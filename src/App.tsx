import React, { useState, useEffect } from 'react';
import { Project, ViewMode, UserProfile, Library3DModel } from './types';
import { subscribeToProjects } from './services/projectsService';
import { Navbar } from './components/Navbar';
import { ARViewer } from './components/ARViewer';
import { TeacherDashboard } from './components/TeacherDashboard';
import { PostersGalleryModal } from './components/PostersGalleryModal';
import { ModelLibraryModal } from './components/ModelLibraryModal';
import { ProjectCreatorModal } from './components/ProjectCreatorModal';
import { DesktopInstallModal } from './components/DesktopInstallModal';
import { MasterQRModal } from './components/MasterQRModal';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentView, setCurrentView] = useState<ViewMode>('ar_scanner');
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [is3DLibraryOpen, setIs3DLibraryOpen] = useState(false);
  const [isMasterQROpen, setIsMasterQROpen] = useState(false);
  const [projectToCreateFromModel, setProjectToCreateFromModel] = useState<Project | null>(null);
  const [isCreatorOpenFromLibrary, setIsCreatorOpenFromLibrary] = useState(false);

  // Desktop App Installation & PWA Prompt States
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  const [currentUser, setCurrentUser] = useState<UserProfile | null>({
    uid: 'teacher_sarah_jenkins',
    email: 'sarah.jenkins@gsis.edu',
    displayName: 'Dr. Sarah Jenkins',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'teacher',
  });

  // Listen to PWA install prompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Subscribe to real-time Firestore projects
  useEffect(() => {
    const unsubscribe = subscribeToProjects((updatedProjects) => {
      setProjects(updatedProjects);
    });

    // Listen to Firebase Auth state
    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Educator',
          photoURL: user.photoURL || undefined,
          role: 'teacher',
        });
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
      authUnsubscribe();
    };
  }, []);

  const handleSelectModelToCreateProject = (model: Library3DModel) => {
    setIs3DLibraryOpen(false);
    // Create a scaffold project using this 3D model
    const scaffoldProject: Project = {
      id: `proj_${Date.now()}`,
      title: `${model.name} Study`,
      studentName: 'Student Researcher',
      grade: 'Grade 9 - AP Biology',
      topic: model.category,
      description: model.description,
      markerImage: '',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      modelType: model.modelType,
      modelUrl: model.modelUrl,
      modelScale: model.scale || 1.0,
      audioTranscript: `Hello, I am presenting our biological investigation on ${model.name}.`,
      keyPoints: model.annotations?.map(a => `${a.name}: ${a.function || a.description}`) || [],
      vocabulary: [],
      createdAt: new Date().toISOString(),
      teacherId: currentUser?.uid || 'teacher_default',
      teacherName: currentUser?.displayName || 'Dr. Sarah Jenkins',
    };
    setProjectToCreateFromModel(scaffoldProject);
    setIsCreatorOpenFromLibrary(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F4F7F5] dark:bg-[#0E1B10] text-[#1A2E1A] dark:text-slate-100 font-sans antialiased">
      {/* Navigation Bar */}
      <Navbar
        currentView={currentView}
        onViewChange={setCurrentView}
        onOpenGallery={() => setIsGalleryOpen(true)}
        onOpen3DLibrary={() => setIs3DLibraryOpen(true)}
        onOpenMasterQR={() => setIsMasterQROpen(true)}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
        projectCount={projects.length}
      />

      {/* Main View Area */}
      <main className="flex-1 relative flex flex-col">
        {currentView === 'ar_scanner' && (
          <ARViewer
            projects={projects}
            onOpenGallery={() => setIsGalleryOpen(true)}
            onOpenTeacherDashboard={() => setCurrentView('teacher_dashboard')}
          />
        )}

        {currentView === 'teacher_dashboard' && (
          <TeacherDashboard
            projects={projects}
            currentUser={currentUser}
            onUserChange={setCurrentUser}
            onOpenARScanner={() => setCurrentView('ar_scanner')}
            onOpenGallery={() => setIsGalleryOpen(true)}
            onOpenMasterQR={() => setIsMasterQROpen(true)}
            onOpen3DLibrary={() => setIs3DLibraryOpen(true)}
            onOpenInstallModal={() => setIsInstallModalOpen(true)}
          />
        )}
      </main>

      {/* Desktop App Install & Download Modal */}
      {isInstallModalOpen && (
        <DesktopInstallModal
          onClose={() => setIsInstallModalOpen(false)}
          deferredPrompt={deferredPrompt}
          onInstallSuccess={() => {
            setIsAppInstalled(true);
          }}
        />
      )}

      {/* Posters Gallery & Testing Modal */}
      {isGalleryOpen && (
        <PostersGalleryModal
          projects={projects}
          onClose={() => setIsGalleryOpen(false)}
          onOpenMasterQR={() => setIsMasterQROpen(true)}
          onSelectPosterForAR={(selectedProject) => {
            setCurrentView('ar_scanner');
          }}
        />
      )}

      {/* Classroom Bulletin Board Master QR Banner Modal */}
      {isMasterQROpen && (
        <MasterQRModal
          projects={projects}
          onClose={() => setIsMasterQROpen(false)}
        />
      )}

      {/* 3D Model Library Modal */}
      {is3DLibraryOpen && (
        <ModelLibraryModal
          onClose={() => setIs3DLibraryOpen(false)}
          onSelectModelForProject={handleSelectModelToCreateProject}
        />
      )}

      {/* Project Creator from Library Selection */}
      {isCreatorOpenFromLibrary && (
        <ProjectCreatorModal
          initialProject={projectToCreateFromModel}
          onClose={() => {
            setIsCreatorOpenFromLibrary(false);
            setProjectToCreateFromModel(null);
          }}
          onSaved={() => {
            setIsCreatorOpenFromLibrary(false);
            setProjectToCreateFromModel(null);
            setCurrentView('teacher_dashboard');
          }}
          teacherName={currentUser?.displayName}
          teacherId={currentUser?.uid}
        />
      )}
    </div>
  );
}
