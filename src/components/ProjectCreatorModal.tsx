import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Upload, 
  Camera, 
  Sparkles, 
  Save, 
  Layers, 
  Film, 
  Image as ImageIcon, 
  Check, 
  Plus, 
  Trash2, 
  BookOpen, 
  Eye, 
  Box,
  FileText,
  AlertCircle,
  Mic,
  ExternalLink,
  Youtube,
  User
} from 'lucide-react';
import { Project, BiologyModelType, AudioSourceType, ExplanationPreference, Library3DModel, PipCornerPosition } from '../types';
import { saveProject } from '../services/projectsService';
import { subscribeToModelLibrary } from '../services/modelLibraryService';
import { generateHandDrawnPoster } from '../utils/posterGenerator';
import { optimizeUploadedImage } from '../utils/imageOptimizer';
import { isYouTubeUrl, getYouTubeVideoId, getYouTubeEmbedUrl } from '../utils/mediaUtils';
import { AudioVoiceOverRecorder } from './AudioVoiceOverRecorder';
import { Add3DModelModal } from './Add3DModelModal';
import { ModelLibraryModal } from './ModelLibraryModal';

interface ProjectCreatorModalProps {
  initialProject?: Project | null;
  onClose: () => void;
  onSaved: (project: Project) => void;
  teacherName?: string;
  teacherId?: string;
}

export const ProjectCreatorModal: React.FC<ProjectCreatorModalProps> = ({
  initialProject,
  onClose,
  onSaved,
  teacherName = 'Dr. Sarah Jenkins',
  teacherId = 'teacher_default_01',
}) => {
  // Form State
  const [title, setTitle] = useState(initialProject?.title || '');
  const [studentName, setStudentName] = useState(initialProject?.studentName || '');
  const [grade, setGrade] = useState(initialProject?.grade || 'Grade 9 - AP Biology');
  const [topic, setTopic] = useState(initialProject?.topic || 'Cell Biology & Organelles');
  const [description, setDescription] = useState(initialProject?.description || '');
  const [markerImage, setMarkerImage] = useState(initialProject?.markerImage || '');
  const [videoUrl, setVideoUrl] = useState(initialProject?.videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');
  const [videoCaption, setVideoCaption] = useState(initialProject?.videoCaption || '');
  const [modelType, setModelType] = useState<BiologyModelType>(initialProject?.modelType || 'preset_plant_cell');
  const [modelUrl, setModelUrl] = useState(initialProject?.modelUrl || '');
  const [modelScale, setModelScale] = useState(initialProject?.modelScale || 1.0);
  const [selectedModelName, setSelectedModelName] = useState(initialProject?.title ? 'Assigned' : 'Plant Cell');
  
  // Available 3D Models from Central Library
  const [libraryModels, setLibraryModels] = useState<Library3DModel[]>([]);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);
  const [isAdd3DModalOpen, setIsAdd3DModalOpen] = useState(false);

  useEffect(() => {
    const unsub = subscribeToModelLibrary((models) => {
      setLibraryModels(models);
    });
    return () => unsub();
  }, []);
  
  // Voice-over & Explanation State
  const [audioNarrationUrl, setAudioNarrationUrl] = useState(initialProject?.audioNarrationUrl || '');
  const [audioTranscript, setAudioTranscript] = useState(initialProject?.audioTranscript || '');
  const [audioSourceType, setAudioSourceType] = useState<AudioSourceType>(initialProject?.audioSourceType || 'speech_synth');
  const [explanationPreference, setExplanationPreference] = useState<ExplanationPreference>(initialProject?.explanationPreference || 'both');
  const [autoRotateWithAudio, setAutoRotateWithAudio] = useState<boolean>(initialProject?.autoRotateWithAudio !== false);

  // Student Video & Picture-in-Picture Explanation
  const [studentVideoUrl, setStudentVideoUrl] = useState(initialProject?.studentVideoUrl || '');
  const [pipPosition, setPipPosition] = useState<PipCornerPosition>(initialProject?.pipPosition || 'bottom-right');
  const studentVideoFileInputRef = useRef<HTMLInputElement>(null);

  const [keyPoints, setKeyPoints] = useState<string[]>(
    initialProject?.keyPoints && initialProject.keyPoints.length > 0
      ? initialProject.keyPoints
      : [
          'Detailed biological cell structures drawn to scale with accurate proportions.',
          'Demonstrates chemical biochemical conversion processes.'
        ]
  );
  const [newPoint, setNewPoint] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const markerFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const glbFileInputRef = useRef<HTMLInputElement>(null);

  // Handle Marker Image File Upload
  const handleMarkerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const optimized = await optimizeUploadedImage(file, 1600);
      setMarkerImage(optimized);
    } catch (err) {
      console.warn('Fallback to raw marker file read:', err);
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (typeof evt.target?.result === 'string') {
          setMarkerImage(evt.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Student Video File Upload
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Use Blob URL or Data URL
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
  };

  // Handle Custom GLB 3D File Upload
  const handleGLBUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setModelUrl(url);
    setModelType('custom_glb');
  };

  // Generate Hand-Drawn Marker on Demand
  const handleGenerateSampleMarker = (type: 'plant_cell' | 'dna' | 'heart' | 'neuron' | 'chloroplast') => {
    const generated = generateHandDrawnPoster(
      type,
      title || 'Biology Investigation',
      studentName || 'Student Artist',
      grade || 'Grade 9'
    );
    setMarkerImage(generated);
  };

  // Add Key Learning Point
  const handleAddKeyPoint = () => {
    if (!newPoint.trim()) return;
    setKeyPoints([...keyPoints, newPoint.trim()]);
    setNewPoint('');
  };

  const handleRemoveKeyPoint = (idx: number) => {
    setKeyPoints(keyPoints.filter((_, i) => i !== idx));
  };

  // Save to Firebase Firestore
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter a project title');
      return;
    }
    if (!studentName.trim()) {
      setErrorMsg('Please enter student name');
      return;
    }
    if (!markerImage) {
      setErrorMsg('Please upload or generate a hand-drawn poster marker image');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const projectId = initialProject?.id || `proj_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      const newProject: Project = {
        id: projectId,
        title: title.trim(),
        studentName: studentName.trim(),
        grade: grade.trim(),
        topic: topic.trim(),
        description: description.trim() || `${studentName}'s interactive biology exhibition poster on ${topic}.`,
        markerImage,
        videoUrl: videoUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        videoCaption: videoCaption.trim() || `${studentName}'s science fair presentation and inquiry findings.`,
        modelType,
        modelUrl: modelType === 'custom_glb' ? modelUrl : undefined,
        modelScale,
        teacherId,
        teacherName,
        createdAt: initialProject?.createdAt || new Date().toISOString(),
        keyPoints: keyPoints.filter(p => p.trim().length > 0),
        vocabulary: initialProject?.vocabulary || [],
        
        // Voice-over narration fields
        audioNarrationUrl: audioNarrationUrl || undefined,
        audioTranscript: audioTranscript.trim() || undefined,
        audioSourceType,
        explanationPreference,
        autoRotateWithAudio,

        // Student Selfie & PiP Video Explanation
        studentVideoUrl: studentVideoUrl || undefined,
        pipPosition,
      };

      await saveProject(newProject);
      onSaved(newProject);
      onClose();
    } catch (err: any) {
      console.warn('Save project error:', err);
      setErrorMsg(err.message || 'Failed to save project. Please check fields.');
    } finally {
      setIsSaving(false);
    }
  };

  const presetModels: { type: BiologyModelType; name: string; tag: string; iconBg: string }[] = [
    { type: 'preset_plant_cell', name: 'Plant Cell & Chloroplast', tag: 'Cell Biology', iconBg: 'bg-emerald-500' },
    { type: 'preset_dna', name: 'DNA Double Helix', tag: 'Genetics', iconBg: 'bg-blue-500' },
    { type: 'preset_heart', name: 'Human Heart (Pulsing)', tag: 'Physiology', iconBg: 'bg-rose-500' },
    { type: 'preset_neuron', name: 'Neuron & Action Potential', tag: 'Neuroscience', iconBg: 'bg-purple-500' },
    { type: 'preset_chloroplast', name: 'Chloroplast Organelle', tag: 'Photosynthesis', iconBg: 'bg-teal-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#0E1B10]/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-white dark:bg-[#1A2E1A] rounded-3xl shadow-2xl border border-[#2D5A27]/25 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D5A27]/15 bg-white/90 dark:bg-[#1A2E1A]/90 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-[#E8F0E8] dark:bg-[#223D23] text-[#2D5A27] dark:text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#1A2E1A] dark:text-white text-base">
                {initialProject ? 'Edit Student AR Project' : 'Create New AR Poster Project'}
              </h3>
              <p className="text-xs text-[#2D5A27]/70 dark:text-emerald-400/80">
                Configure hand-drawn poster marker, rotatable 3D model, student voice-over, and video
              </p>
            </div>
          </div>

          <button
            id="btn-close-project-creator"
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl text-[#2D5A27]/70 hover:text-[#1A2E1A] dark:hover:text-white hover:bg-[#E8F0E8] dark:hover:bg-[#223D23] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Student & Project Details */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-[#2D5A27]/70 dark:text-emerald-400/80 uppercase tracking-wider">
              1. Student & Exhibit Information
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1A2E1A] dark:text-emerald-200 mb-1">
                  Project Title *
                </label>
                <input
                  id="input-project-title"
                  type="text"
                  required
                  placeholder="e.g. Plant Cell & Chloroplast Function"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4F7F5] dark:bg-[#223D23] border border-[#2D5A27]/15 text-sm text-[#1A2E1A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A2E1A] dark:text-emerald-200 mb-1">
                  Student Name *
                </label>
                <input
                  id="input-student-name"
                  type="text"
                  required
                  placeholder="e.g. Maya Lin"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4F7F5] dark:bg-[#223D23] border border-[#2D5A27]/15 text-sm text-[#1A2E1A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#1A2E1A] dark:text-emerald-200 mb-1">
                  Grade / Class
                </label>
                <select
                  id="select-grade"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4F7F5] dark:bg-[#223D23] border border-[#2D5A27]/15 text-sm text-[#1A2E1A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
                >
                  <option value="Grade 7 - Life Sciences">Grade 7 - Life Sciences</option>
                  <option value="Grade 8 - General Biology">Grade 8 - General Biology</option>
                  <option value="Grade 9 - AP Biology">Grade 9 - AP Biology</option>
                  <option value="Grade 10 - Human Physiology">Grade 10 - Human Physiology</option>
                  <option value="Grade 11 - Molecular Genetics">Grade 11 - Molecular Genetics</option>
                  <option value="Grade 12 - Advanced Biochemistry">Grade 12 - Advanced Biochemistry</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A2E1A] dark:text-emerald-200 mb-1">
                  Biology Topic
                </label>
                <input
                  id="input-topic"
                  type="text"
                  placeholder="e.g. Photosynthesis & Cellular Respiration"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4F7F5] dark:bg-[#223D23] border border-[#2D5A27]/15 text-sm text-[#1A2E1A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1A2E1A] dark:text-emerald-200 mb-1">
                Poster Scientific Abstract / Description
              </label>
              <textarea
                id="textarea-description"
                rows={3}
                placeholder="Describe the biological hypotheses, cell structures, and key inquiries explored in this poster..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4F7F5] dark:bg-[#223D23] border border-[#2D5A27]/15 text-sm text-[#1A2E1A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
              />
            </div>
          </div>

          {/* Section 2: Reference Image / AR Poster Marker */}
          <div className="space-y-3 pt-4 border-t border-[#2D5A27]/15">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#2D5A27]/70 dark:text-emerald-400/80 uppercase tracking-wider">
                2. Hand-Drawn Poster Marker Image *
              </h4>
              <span className="text-[11px] text-[#2D5A27] dark:text-emerald-400 font-bold">
                Matches drawing to this 3D Image & Student Voice
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              {/* Marker Preview */}
              <div className="relative aspect-[4/5] rounded-3xl bg-[#F4F7F5] dark:bg-[#132416] border-2 border-dashed border-[#2D5A27]/30 flex flex-col items-center justify-center p-3 overflow-hidden group">
                {markerImage ? (
                  <>
                    <img
                      src={markerImage}
                      alt="AR Marker Poster"
                      className="w-full h-full object-contain rounded-2xl"
                    />
                    <button
                      type="button"
                      onClick={() => setMarkerImage('')}
                      className="absolute top-3 right-3 p-2 rounded-xl bg-red-600 text-white opacity-0 group-hover:opacity-100 transition shadow-md"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon className="w-8 h-8 text-[#2D5A27]/40 mx-auto mb-2" />
                    <p className="text-xs font-bold text-[#1A2E1A] dark:text-emerald-200">
                      No Poster Marker Uploaded
                    </p>
                    <p className="text-[11px] text-[#2D5A27]/60 dark:text-emerald-300/60 mt-1">
                      Upload photo of student's drawing or generate a sample sketch
                    </p>
                  </div>
                )}
              </div>

              {/* Upload / Generate Controls */}
              <div className="space-y-3">
                <input
                  ref={markerFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleMarkerUpload}
                  className="hidden"
                />

                <button
                  id="btn-upload-marker-file"
                  type="button"
                  onClick={() => markerFileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#E8F0E8] dark:bg-[#223D23] hover:bg-[#d8e6d8] text-[#1A2E1A] dark:text-emerald-100 text-xs font-bold transition border border-[#2D5A27]/15"
                >
                  <Upload className="w-4 h-4 text-[#2D5A27]" />
                  Upload Photo of Student Poster
                </button>

                <div className="pt-2">
                  <span className="text-[11px] font-bold text-[#2D5A27]/70 dark:text-emerald-400/80 block mb-2">
                    Or generate biology poster artwork:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleGenerateSampleMarker('plant_cell')}
                      className="px-2.5 py-1.5 text-[11px] rounded-xl bg-white dark:bg-[#223D23] hover:bg-[#E8F0E8] text-[#1A2E1A] dark:text-emerald-200 border border-[#2D5A27]/20 font-bold"
                    >
                      🌱 Plant Cell
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerateSampleMarker('dna')}
                      className="px-2.5 py-1.5 text-[11px] rounded-xl bg-white dark:bg-[#223D23] hover:bg-[#E8F0E8] text-[#1A2E1A] dark:text-emerald-200 border border-[#2D5A27]/20 font-bold"
                    >
                      🧬 DNA Helix
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerateSampleMarker('heart')}
                      className="px-2.5 py-1.5 text-[11px] rounded-xl bg-white dark:bg-[#223D23] hover:bg-[#E8F0E8] text-[#1A2E1A] dark:text-emerald-200 border border-[#2D5A27]/20 font-bold"
                    >
                      ❤️ Human Heart
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerateSampleMarker('neuron')}
                      className="px-2.5 py-1.5 text-[11px] rounded-xl bg-white dark:bg-[#223D23] hover:bg-[#E8F0E8] text-[#1A2E1A] dark:text-emerald-200 border border-[#2D5A27]/20 font-bold"
                    >
                      ⚡ Neuron
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGenerateSampleMarker('chloroplast')}
                      className="px-2.5 py-1.5 text-[11px] rounded-xl bg-white dark:bg-[#223D23] hover:bg-[#E8F0E8] text-[#1A2E1A] dark:text-emerald-200 border border-[#2D5A27]/20 font-bold"
                    >
                      🍃 Chloroplast
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: 3D Biological Organelle Model Selection */}
          <div className="space-y-3 pt-4 border-t border-[#2D5A27]/15">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#2D5A27]/70 dark:text-emerald-400/80 uppercase tracking-wider flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5" />
                <span>3. Rotatable 3D Biological Image / Model</span>
              </h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdd3DModalOpen(true)}
                  className="text-[11px] text-[#2D5A27] dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Upload 3D Asset</span>
                </button>
                <span className="text-[#2D5A27]/30">•</span>
                <button
                  type="button"
                  onClick={() => setIsLibraryModalOpen(true)}
                  className="text-[11px] text-[#2D5A27] dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Open 3D Library ({libraryModels.length})</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {libraryModels.map((item) => {
                const isSelected = (item.isBuiltIn && modelType === item.modelType) || 
                                   (!item.isBuiltIn && modelUrl === item.modelUrl && modelType === 'custom_glb');
                return (
                  <button
                    key={item.id}
                    id={`btn-select-model-${item.id}`}
                    type="button"
                    onClick={() => {
                      setModelType(item.modelType);
                      setModelUrl(item.modelUrl || '');
                      setModelScale(item.scale || 1.0);
                      setSelectedModelName(item.name);
                      if (item.annotations && item.annotations.length > 0) {
                        // Pre-populate key points from annotations if empty
                        if (keyPoints.length <= 2) {
                          setKeyPoints(item.annotations.map(a => `${a.name}: ${a.function || a.description}`));
                        }
                      }
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#E8F0E8] dark:bg-[#223D23] border-[#2D5A27] shadow-xs ring-2 ring-[#2D5A27]/20'
                        : 'bg-[#F4F7F5] dark:bg-[#132416] border-[#2D5A27]/10 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold text-[#2D5A27]/70 dark:text-emerald-400/70 truncate max-w-[120px]">
                        {item.category}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-[#2D5A27] dark:text-emerald-400" />}
                    </div>
                    <span className="font-bold text-xs text-[#1A2E1A] dark:text-white truncate">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-[#2D5A27]/60 dark:text-emerald-300/60 mt-1">
                      {item.isBuiltIn ? 'Preset 3D' : `${item.fileFormat?.toUpperCase() || 'Custom 3D'}`}
                    </span>
                  </button>
                );
              })}

              {/* Direct Upload Custom 3D File Button */}
              <button
                id="btn-select-model-custom"
                type="button"
                onClick={() => setIsAdd3DModalOpen(true)}
                className="p-3.5 rounded-2xl border border-dashed border-[#2D5A27]/30 text-left transition flex flex-col justify-between bg-[#F4F7F5]/50 dark:bg-[#132416]/50 hover:bg-white hover:border-[#2D5A27]"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold text-[#2D5A27]/70 dark:text-emerald-400/70">New 3D Asset</span>
                  <Plus className="w-3.5 h-3.5 text-[#2D5A27] dark:text-emerald-400" />
                </div>
                <span className="font-bold text-xs text-[#1A2E1A] dark:text-white flex items-center gap-1">
                  <Upload className="w-3 h-3 text-[#2D5A27]" />
                  <span>+ Upload to Library</span>
                </span>
                <span className="text-[10px] text-[#2D5A27]/60 dark:text-emerald-300/60 mt-1">
                  .GLB / 3D Image
                </span>
              </button>
            </div>
          </div>

          {/* Section 4: Student Voice-Over & Audio Narration */}
          <div className="pt-4 border-t border-[#2D5A27]/15">
            <AudioVoiceOverRecorder
              studentName={studentName}
              projectTitle={title}
              topic={topic}
              keyPoints={keyPoints}
              audioUrl={audioNarrationUrl}
              audioTranscript={audioTranscript}
              audioSourceType={audioSourceType}
              explanationPreference={explanationPreference}
              autoRotateWithAudio={autoRotateWithAudio}
              onAudioChange={(data) => {
                setAudioNarrationUrl(data.audioUrl || '');
                setAudioTranscript(data.audioTranscript);
                setAudioSourceType(data.audioSourceType);
                setExplanationPreference(data.explanationPreference);
                setAutoRotateWithAudio(data.autoRotateWithAudio);
              }}
            />
          </div>

          {/* Section 5: Biology YouTube Video & Student PiP Overlay */}
          <div className="space-y-4 pt-4 border-t border-[#2D5A27]/15">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#2D5A27]/70 dark:text-emerald-400/80 uppercase tracking-wider flex items-center gap-1.5">
                <Youtube className="w-4 h-4 text-red-500" />
                <span>5. Biology Screen & Student Explanation Video (Picture-in-Picture)</span>
              </h4>
              <span className="text-[11px] text-[#2D5A27]/70 dark:text-emerald-400/80 font-medium">
                Corner overlay over YouTube video
              </span>
            </div>

            {/* Primary Main Video (YouTube or Animation) */}
            <div className="p-4 rounded-3xl bg-[#F4F7F5] dark:bg-[#223D23] border border-[#2D5A27]/15 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#1A2E1A] dark:text-emerald-200">
                  Main Biology Video (YouTube Link or Full-Screen MP4)
                </label>
                <span className="text-[10px] text-gray-500 font-medium">Plays in background full frame</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input
                    id="input-video-url"
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=... or .mp4"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-2xl bg-white dark:bg-[#132416] border border-[#2D5A27]/15 text-xs text-[#1A2E1A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
                  />
                </div>

                <div>
                  <input
                    ref={videoFileInputRef}
                    type="file"
                    accept="video/mp4,video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                  <button
                    id="btn-upload-video-file"
                    type="button"
                    onClick={() => videoFileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-2xl bg-white dark:bg-[#132416] hover:bg-[#E8F0E8] dark:hover:bg-[#1e3a20] text-[#1A2E1A] dark:text-emerald-100 text-xs font-bold transition border border-[#2D5A27]/15"
                  >
                    <Film className="w-4 h-4 text-[#2D5A27]" />
                    Upload Main Video File
                  </button>
                </div>
              </div>

              {/* Live YouTube Preview */}
              {isYouTubeUrl(videoUrl) && (
                <div className="p-3 rounded-2xl bg-red-50/70 dark:bg-red-950/40 border border-red-200 dark:border-red-900/40 flex items-center justify-between text-xs">
                  <span className="font-bold text-red-700 dark:text-red-300 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>YouTube Video Linked (ID: {getYouTubeVideoId(videoUrl)})</span>
                  </span>
                  <span className="text-[11px] text-gray-500">Ready for PiP overlay</span>
                </div>
              )}
            </div>

            {/* Student Recorded Selfie/Video for Corner Overlay */}
            <div className="p-4 rounded-3xl bg-emerald-50/60 dark:bg-[#132416] border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#2D5A27] text-white flex items-center justify-center text-xs">
                    <User className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1A2E1A] dark:text-emerald-200">
                      Student Explanation Video (Corner PiP Overlay)
                    </label>
                    <p className="text-[11px] text-[#2D5A27]/80 dark:text-emerald-400/80">
                      Upload your student's recorded selfie video explaining the biology topic.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input
                    ref={studentVideoFileInputRef}
                    type="file"
                    accept="video/mp4,video/webm,video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const url = URL.createObjectURL(file);
                      setStudentVideoUrl(url);
                    }}
                    className="hidden"
                  />
                  <button
                    id="btn-upload-student-pip-video"
                    type="button"
                    onClick={() => studentVideoFileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-[#2D5A27] hover:bg-[#23461e] text-white text-xs font-bold transition shadow-xs"
                  >
                    <Film className="w-4 h-4 text-emerald-200" />
                    {studentVideoUrl ? 'Replace Student Video' : 'Upload Student Recorded Video'}
                  </button>
                </div>

                <div>
                  <input
                    id="input-student-video-url"
                    type="url"
                    placeholder="Or paste direct student video URL (.mp4)"
                    value={studentVideoUrl}
                    onChange={(e) => setStudentVideoUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#1A2E1A] border border-[#2D5A27]/20 text-xs text-[#1A2E1A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
                  />
                </div>
              </div>

              {/* Corner Placement Selector */}
              {studentVideoUrl && (
                <div className="pt-2 border-t border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <span className="text-xs font-bold text-[#1A2E1A] dark:text-emerald-200">
                    Fix Student Video in Corner:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(['bottom-right', 'bottom-left', 'top-right', 'top-left'] as PipCornerPosition[]).map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => setPipPosition(pos)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold capitalize transition border ${
                          pipPosition === pos
                            ? 'bg-[#2D5A27] text-white border-[#2D5A27]'
                            : 'bg-white dark:bg-[#1A2E1A] text-[#1A2E1A] dark:text-gray-300 border-[#2D5A27]/20 hover:bg-emerald-50'
                        }`}
                      >
                        {pos.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 6: Key Takeaways */}
          <div className="space-y-3 pt-4 border-t border-[#2D5A27]/15">
            <h4 className="text-xs font-bold text-[#2D5A27]/70 dark:text-emerald-400/80 uppercase tracking-wider">
              6. Key Scientific Takeaways
            </h4>

            <div className="space-y-2">
              {keyPoints.map((pt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={pt}
                    onChange={(e) => {
                      const updated = [...keyPoints];
                      updated[idx] = e.target.value;
                      setKeyPoints(updated);
                    }}
                    className="flex-1 px-3.5 py-2 rounded-2xl bg-[#F4F7F5] dark:bg-[#223D23] border border-[#2D5A27]/15 text-xs text-[#1A2E1A] dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyPoint(idx)}
                    className="p-2 text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <div className="flex gap-2">
                <input
                  id="input-new-keypoint"
                  type="text"
                  placeholder="Add a new scientific observation..."
                  value={newPoint}
                  onChange={(e) => setNewPoint(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddKeyPoint(); } }}
                  className="flex-1 px-3.5 py-2 rounded-2xl bg-[#F4F7F5] dark:bg-[#223D23] border border-[#2D5A27]/15 text-xs text-[#1A2E1A] dark:text-white"
                />
                <button
                  id="btn-add-keypoint"
                  type="button"
                  onClick={handleAddKeyPoint}
                  className="px-4 py-2 rounded-2xl bg-[#E8F0E8] dark:bg-[#223D23] hover:bg-[#d8e6d8] text-[#2D5A27] dark:text-emerald-300 text-xs font-bold flex items-center gap-1 border border-[#2D5A27]/15"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#2D5A27]/15 bg-[#F4F7F5] dark:bg-[#132416] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-2xl text-xs font-bold text-[#2D5A27]/70 dark:text-emerald-400/80 hover:bg-[#E8F0E8] dark:hover:bg-[#223D23] transition"
          >
            Cancel
          </button>

          <button
            id="btn-save-project-submit"
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#2D5A27] hover:bg-[#23461e] active:scale-98 text-white text-xs font-bold shadow-md shadow-[#2D5A27]/25 transition disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'Saving Project...' : 'Save to Firebase'}</span>
          </button>
        </div>
      </div>

      {/* 3D Library Browser Modal */}
      {isLibraryModalOpen && (
        <ModelLibraryModal
          onClose={() => setIsLibraryModalOpen(false)}
          onSelectModelForProject={(chosenModel) => {
            setModelType(chosenModel.modelType);
            setModelUrl(chosenModel.modelUrl || '');
            setModelScale(chosenModel.scale || 1.0);
            setSelectedModelName(chosenModel.name);
            if (chosenModel.annotations && chosenModel.annotations.length > 0) {
              setKeyPoints(chosenModel.annotations.map(a => `${a.name}: ${a.function || a.description}`));
            }
            setIsLibraryModalOpen(false);
          }}
        />
      )}

      {/* Add New 3D Asset Modal */}
      {isAdd3DModalOpen && (
        <Add3DModelModal
          onClose={() => setIsAdd3DModalOpen(false)}
          onModelAdded={(newModel) => {
            setModelType(newModel.modelType);
            setModelUrl(newModel.modelUrl || '');
            setModelScale(newModel.scale || 1.0);
            setSelectedModelName(newModel.name);
            if (newModel.annotations && newModel.annotations.length > 0) {
              setKeyPoints(newModel.annotations.map(a => `${a.name}: ${a.function || a.description}`));
            }
            setIsAdd3DModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

