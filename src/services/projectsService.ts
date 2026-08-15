import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Project } from '../types';
import { getInitialSampleProjects } from '../utils/sampleData';
import { preloadProjectFeatures } from '../utils/visionTracker';

const PROJECTS_COLLECTION = 'projects';
const LOCAL_STORAGE_KEY = 'bioar_board_projects_cache';
const INITIALIZED_KEY = 'bioar_seed_initialized_flag';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Notice:', JSON.stringify(errInfo));
  return errInfo;
}

// Helper to get local cache
function getLocalCache(): Project[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw !== null) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Error reading local projects cache:', e);
  }
  return [];
}

// Helper to save local cache
function saveLocalCache(projects: Project[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.warn('Error saving local projects cache:', e);
  }
}

// Fetch all projects with real-time listener
export function subscribeToProjects(onUpdate: (projects: Project[]) => void, onError?: (err: Error) => void) {
  let isSeeding = false;
  const isInitialized = localStorage.getItem(INITIALIZED_KEY) === 'true';

  // Initialize with initial sample data or cache immediately
  const rawCache = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (rawCache !== null) {
    const initialCache = getLocalCache();
    onUpdate(initialCache);
    preloadProjectFeatures(initialCache);
  } else if (!isInitialized) {
    // First time ever opening app: provide default samples
    const defaultSamples = getInitialSampleProjects();
    saveLocalCache(defaultSamples);
    localStorage.setItem(INITIALIZED_KEY, 'true');
    onUpdate(defaultSamples);
    preloadProjectFeatures(defaultSamples);
  } else {
    onUpdate([]);
  }

  try {
    const colRef = collection(db, PROJECTS_COLLECTION);
    const q = query(colRef);

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        const hasInitializedMarker = localStorage.getItem(INITIALIZED_KEY) === 'true';

        // Auto-seed ONLY if first run and never seeded before
        if (snapshot.empty && !isSeeding && !hasInitializedMarker) {
          isSeeding = true;
          const initialSamples = getInitialSampleProjects();
          localStorage.setItem(INITIALIZED_KEY, 'true');
          try {
            for (const proj of initialSamples) {
              const docRef = doc(db, PROJECTS_COLLECTION, proj.id);
              await setDoc(docRef, {
                ...proj,
                createdAt: proj.createdAt || new Date().toISOString(),
                updatedAt: serverTimestamp()
              });
            }
          } catch (seedErr) {
            handleFirestoreError(seedErr, OperationType.WRITE, PROJECTS_COLLECTION);
          }
          isSeeding = false;
          return;
        }

        // If snapshot is empty (e.g. user deleted all exhibits)
        if (snapshot.empty) {
          saveLocalCache([]);
          onUpdate([]);
          preloadProjectFeatures([]);
          return;
        }

        const remoteProjects: Project[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          remoteProjects.push({
            id: docSnap.id,
            title: data.title || 'Untitled Project',
            studentName: data.studentName || 'Anonymous Student',
            studentAvatar: data.studentAvatar,
            grade: data.grade || 'General Biology',
            topic: data.topic || 'Life Sciences',
            description: data.description || '',
            markerImage: data.markerImage || '',
            videoUrl: data.videoUrl || '',
            videoCaption: data.videoCaption,
            modelUrl: data.modelUrl,
            modelType: data.modelType || 'preset_plant_cell',
            modelScale: data.modelScale || 1.0,
            teacherId: data.teacherId,
            teacherName: data.teacherName,
            createdAt: data.createdAt || new Date().toISOString(),
            keyPoints: Array.isArray(data.keyPoints) ? data.keyPoints : [],
            vocabulary: Array.isArray(data.vocabulary) ? data.vocabulary : [],
            audioNarrationUrl: data.audioNarrationUrl,
            audioTranscript: data.audioTranscript,
            audioSourceType: data.audioSourceType || 'speech_synth',
            explanationPreference: data.explanationPreference || 'both',
            autoRotateWithAudio: data.autoRotateWithAudio !== false,
          });
        });

        localStorage.setItem(INITIALIZED_KEY, 'true');
        saveLocalCache(remoteProjects);
        onUpdate(remoteProjects);
        preloadProjectFeatures(remoteProjects);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, PROJECTS_COLLECTION);
        const fallback = getLocalCache();
        onUpdate(fallback);
        preloadProjectFeatures(fallback);
        if (onError) onError(err);
      }
    );

    return unsubscribe;
  } catch (error: any) {
    handleFirestoreError(error, OperationType.GET, PROJECTS_COLLECTION);
    const fallback = getLocalCache();
    onUpdate(fallback);
    preloadProjectFeatures(fallback);
    return () => {};
  }
}

// Create or update a student project
export async function saveProject(project: Project): Promise<void> {
  localStorage.setItem(INITIALIZED_KEY, 'true');
  const localList = getLocalCache();
  const existingIdx = localList.findIndex(p => p.id === project.id);
  if (existingIdx >= 0) {
    localList[existingIdx] = project;
  } else {
    localList.unshift(project);
  }
  saveLocalCache(localList);
  preloadProjectFeatures(localList);

  try {
    const docRef = doc(db, PROJECTS_COLLECTION, project.id);
    await setDoc(docRef, {
      ...project,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `${PROJECTS_COLLECTION}/${project.id}`);
  }
}

// Delete a student project
export async function deleteProject(projectId: string): Promise<void> {
  localStorage.setItem(INITIALIZED_KEY, 'true');
  const localList = getLocalCache().filter(p => p.id !== projectId);
  saveLocalCache(localList);
  preloadProjectFeatures(localList);

  try {
    const docRef = doc(db, PROJECTS_COLLECTION, projectId);
    await deleteDoc(docRef);
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, `${PROJECTS_COLLECTION}/${projectId}`);
  }
}

// Delete all projects from the library
export async function deleteAllProjects(): Promise<void> {
  localStorage.setItem(INITIALIZED_KEY, 'true');
  saveLocalCache([]);
  preloadProjectFeatures([]);

  try {
    const colRef = collection(db, PROJECTS_COLLECTION);
    const snapshot = await getDocs(colRef);
    const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, PROJECTS_COLLECTION, d.id)));
    await Promise.all(deletePromises);
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, PROJECTS_COLLECTION);
  }
}

// Reset and reseed projects to default templates
export async function resetToDefaultProjects(): Promise<Project[]> {
  localStorage.setItem(INITIALIZED_KEY, 'true');
  const samples = getInitialSampleProjects();
  saveLocalCache(samples);
  try {
    for (const proj of samples) {
      const docRef = doc(db, PROJECTS_COLLECTION, proj.id);
      await setDoc(docRef, {
        ...proj,
        updatedAt: serverTimestamp()
      });
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, PROJECTS_COLLECTION);
  }
  preloadProjectFeatures(samples);
  return samples;
}

