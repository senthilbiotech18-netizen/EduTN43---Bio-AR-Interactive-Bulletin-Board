export type BiologyModelType = 
  | 'preset_plant_cell'
  | 'preset_dna'
  | 'preset_heart'
  | 'preset_neuron'
  | 'preset_chloroplast'
  | 'preset_animal_cell'
  | 'custom_glb';

export interface ModelAnnotation {
  id: string;
  name: string;
  position: [number, number, number];
  description: string;
  function: string;
}

export interface Library3DModel {
  id: string;
  name: string;
  category: string; // Allows any custom topic e.g. Photosynthesis, Circulatory System, etc.
  description: string;
  modelType: BiologyModelType;
  modelUrl?: string; // Data URL or Web URL for GLB/GLTF/3D asset
  thumbnailImage?: string; // Preview image or snapshot
  scale: number;
  annotations: ModelAnnotation[];
  isBuiltIn?: boolean;
  createdAt: string;
  authorName?: string;
  fileFormat?: 'preset' | 'glb' | 'gltf' | 'image_3d' | 'youtube' | 'video';
  videoUrl?: string; // YouTube or direct video link for educational animation/presentation
  studentVideoUrl?: string; // Uploaded student selfie/explanation video or URL
  pipPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'side-by-side';
}

export type ExplanationPreference = 'voice_over' | 'video' | 'both';
export type AudioSourceType = 'recorded' | 'uploaded' | 'speech_synth';
export type PipCornerPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'side-by-side';

export interface Project {
  id: string;
  title: string;
  studentName: string;
  studentAvatar?: string;
  grade: string;
  topic: string;
  description: string;
  markerImage: string; // Base64 Data URL or public URL
  markerFeatures?: number[]; // Cached feature vector for ultra-fast matching
  videoUrl: string;
  studentVideoUrl?: string; // Uploaded student video explaining the model/YouTube video in Picture-in-Picture
  pipPosition?: PipCornerPosition; // Position of student video overlay
  videoCaption?: string;
  modelUrl?: string; // Custom GLB file URL or Data URL
  modelType: BiologyModelType;
  modelScale: number;
  teacherId?: string;
  teacherName?: string;
  createdAt: string;
  keyPoints: string[];
  vocabulary?: { term: string; definition: string }[];
  
  // Voice-over & Audio Narration configuration
  audioNarrationUrl?: string; // Blob or Data URL or audio file
  audioTranscript?: string; // Dialogue script e.g. "Hi, I am Maya Lin and today I will explain..."
  audioDuration?: number; // In seconds
  audioSourceType?: AudioSourceType;
  explanationPreference?: ExplanationPreference; // Voice-over, MP4 video, or both
  autoRotateWithAudio?: boolean; // Keep 3D model rotating slowly during voice-over
}

export interface MarkerMatchResult {
  projectId: string;
  project: Project;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  corners?: { x: number; y: number }[];
  center?: { x: number; y: number };
}

export type ViewMode = 'ar_scanner' | 'teacher_dashboard' | 'model_library' | 'poster_gallery' | 'virtual_test';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'teacher' | 'viewer';
}

