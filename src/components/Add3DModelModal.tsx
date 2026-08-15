import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Sparkles, 
  Box, 
  Check, 
  Plus, 
  Trash2, 
  ImageIcon,
  ExternalLink,
  FileCheck,
  Loader2,
  Youtube,
  Play
} from 'lucide-react';
import { Library3DModel, BiologyModelType, ModelAnnotation } from '../types';
import { saveModelToLibrary, BUILT_IN_3D_MODELS } from '../services/modelLibraryService';
import { optimizeUploadedImage } from '../utils/imageOptimizer';
import { 
  isYouTubeUrl, 
  getYouTubeVideoId, 
  getYouTubeEmbedUrl, 
  getYouTubeThumbnailUrl,
  isVimeoUrl,
  getVimeoEmbedUrl
} from '../utils/mediaUtils';

interface Add3DModelModalProps {
  onClose: () => void;
  onModelAdded: (newModel: Library3DModel) => void;
  initialTopic?: string;
}

export const Add3DModelModal: React.FC<Add3DModelModalProps> = ({
  onClose,
  onModelAdded,
  initialTopic,
}) => {
  // Tabs: YouTube link, 3D Image, GLB upload, 3D Web URL, Presets
  const [activeTab, setActiveTab] = useState<'upload_image_3d' | 'youtube_video' | 'upload_glb' | 'web_url' | 'customize_preset'>('upload_image_3d');

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(
    initialTopic && initialTopic !== 'All' ? initialTopic : 'Cellular Biology'
  );
  const [isCustomTopicMode, setIsCustomTopicMode] = useState(
    initialTopic && initialTopic !== 'All' && !['Cellular Biology', 'Genetics', 'Human Anatomy', 'Botany', 'Microbiology'].includes(initialTopic)
  );
  const [customTopicInput, setCustomTopicInput] = useState(
    initialTopic && initialTopic !== 'All' && !['Cellular Biology', 'Genetics', 'Human Anatomy', 'Botany', 'Microbiology'].includes(initialTopic)
      ? initialTopic
      : ''
  );
  const [description, setDescription] = useState('');
  const [modelType, setModelType] = useState<BiologyModelType>('custom_glb');
  const [modelUrl, setModelUrl] = useState<string>('');
  const [youtubeInputUrl, setYoutubeInputUrl] = useState<string>('');
  const [thumbnailImage, setThumbnailImage] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [uploadedFileSize, setUploadedFileSize] = useState<string>('');
  const [scale, setScale] = useState<number>(1.0);
  const [fileFormat, setFileFormat] = useState<'glb' | 'gltf' | 'image_3d' | 'youtube' | 'video' | 'preset'>('image_3d');
  
  // Organelle Hotspot Annotations
  const [annotations, setAnnotations] = useState<ModelAnnotation[]>([]);
  const [newAnnName, setNewAnnName] = useState('');
  const [newAnnDesc, setNewAnnDesc] = useState('');
  const [newAnnFunc, setNewAnnFunc] = useState('');

  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const glbInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const commonTopicSuggestions = [
    'Cellular Biology',
    'Genetics',
    'Human Anatomy',
    'Botany',
    'Microbiology',
    'Photosynthesis',
    'Circulatory System',
    'Cell Division & Mitosis',
    'Ecology & Food Webs',
    'Microscopy & Histology'
  ];

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Watch YouTube URL changes and auto-extract thumbnails and video IDs
  useEffect(() => {
    if (activeTab === 'youtube_video' || isYouTubeUrl(youtubeInputUrl) || isYouTubeUrl(modelUrl)) {
      const targetUrl = youtubeInputUrl || modelUrl;
      if (isYouTubeUrl(targetUrl)) {
        const vidId = getYouTubeVideoId(targetUrl);
        const thumb = getYouTubeThumbnailUrl(targetUrl);
        if (thumb) {
          setThumbnailImage(thumb);
        }
        setFileFormat('youtube');
        setModelType('custom_glb');
        if (!name && vidId) {
          setName(`Biology Video Exhibit (${vidId})`);
        }
      }
    }
  }, [youtubeInputUrl, modelUrl, activeTab]);

  // Process 3D Biology Image / Render File
  const processImageFile = async (file: File) => {
    if (!file) return;
    setIsProcessingFile(true);
    setErrorMsg(null);

    try {
      if (!name) {
        const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setName(baseName.charAt(0).toUpperCase() + baseName.slice(1));
      }

      setUploadedFileName(file.name);
      setUploadedFileSize(formatBytes(file.size));

      // Optimize image for high-definition 3D rendering and fast persistence
      const optimizedDataUrl = await optimizeUploadedImage(file);
      setModelUrl(optimizedDataUrl);
      setThumbnailImage(optimizedDataUrl);
      setModelType('custom_glb');
      setFileFormat('image_3d');
    } catch (err) {
      console.error('Error reading desktop image:', err);
      setErrorMsg('Failed to process uploaded image file. Please try another image.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Process .GLB / .GLTF 3D File
  const processGLBFile = async (file: File) => {
    if (!file) return;
    setIsProcessingFile(true);
    setErrorMsg(null);

    try {
      if (!name) {
        const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        setName(baseName.charAt(0).toUpperCase() + baseName.slice(1));
      }

      setUploadedFileName(file.name);
      setUploadedFileSize(formatBytes(file.size));

      const reader = new FileReader();
      reader.onload = (evt) => {
        if (typeof evt.target?.result === 'string') {
          setModelUrl(evt.target.result);
          setModelType('custom_glb');
          setFileFormat(file.name.endsWith('.gltf') ? 'gltf' : 'glb');
          setIsProcessingFile(false);
        }
      };
      reader.onerror = () => {
        setErrorMsg('Could not read 3D model file from desktop.');
        setIsProcessingFile(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error processing GLB file:', err);
      setErrorMsg('Failed to read 3D model file.');
      setIsProcessingFile(false);
    }
  };

  // Handle .GLB / .GLTF Input Change
  const handleGLBFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processGLBFile(file);
  };

  // Handle 3D Biology Image Input Change
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.glb') || file.name.endsWith('.gltf')) {
      setActiveTab('upload_glb');
      processGLBFile(file);
    } else if (file.type.startsWith('image/')) {
      setActiveTab('upload_image_3d');
      processImageFile(file);
    } else {
      setErrorMsg('Please drop a valid 3D file (.glb/.gltf) or biology image (PNG, JPG, WebP, SVG).');
    }
  };

  // Clone from Preset
  const handleSelectPresetToCustomize = (preset: Library3DModel) => {
    setName(`${preset.name} (Custom Edition)`);
    setCategory(preset.category);
    setDescription(preset.description);
    setModelType(preset.modelType);
    setModelUrl(preset.modelUrl || '');
    setScale(preset.scale || 1.0);
    setAnnotations([...preset.annotations]);
    setFileFormat('preset');
  };

  // Add Annotation
  const handleAddAnnotation = () => {
    if (!newAnnName.trim()) return;
    const newAnn: ModelAnnotation = {
      id: `ann_${Date.now()}`,
      name: newAnnName.trim(),
      position: [
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 1.0
      ],
      description: newAnnDesc.trim() || 'Organelle sub-structure.',
      function: newAnnFunc.trim() || 'Biochemical cellular role.'
    };
    setAnnotations([...annotations, newAnn]);
    setNewAnnName('');
    setNewAnnDesc('');
    setNewAnnFunc('');
  };

  const handleRemoveAnnotation = (id: string) => {
    setAnnotations(annotations.filter(a => a.id !== id));
  };

  // Submit and Save
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please specify a model or organelle name.');
      return;
    }

    const finalTopic = (isCustomTopicMode && customTopicInput.trim()) 
      ? customTopicInput.trim() 
      : (category.trim() || 'Custom');

    let finalModelUrl = modelUrl.trim();
    let finalFileFormat = fileFormat;
    let finalThumbnail = thumbnailImage;

    // If using YouTube tab or entered a YouTube link
    if (activeTab === 'youtube_video' || isYouTubeUrl(youtubeInputUrl) || isYouTubeUrl(finalModelUrl)) {
      const ytUrl = (youtubeInputUrl || finalModelUrl).trim();
      if (!isYouTubeUrl(ytUrl)) {
        setErrorMsg('Please enter a valid YouTube video URL (e.g. https://www.youtube.com/watch?v=...)');
        return;
      }
      finalModelUrl = ytUrl;
      finalFileFormat = 'youtube';
      finalThumbnail = getYouTubeThumbnailUrl(ytUrl) || finalThumbnail;
    } else if (activeTab === 'web_url' && !finalModelUrl) {
      setErrorMsg('Please enter a valid 3D file or model URL.');
      return;
    } else if (activeTab === 'upload_glb' && !finalModelUrl && modelType === 'custom_glb') {
      setErrorMsg('Please upload a .GLB or .GLTF 3D model file.');
      return;
    } else if (activeTab === 'upload_image_3d' && !finalModelUrl) {
      setErrorMsg('Please upload a 3D biology diagram or organelle image.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const saved = await saveModelToLibrary({
        name: name.trim(),
        category: finalTopic,
        description: description.trim() || `${finalFileFormat === 'youtube' ? 'YouTube Biology Video' : '3D'} ${name} for ${finalTopic} biology investigation.`,
        modelType: 'custom_glb',
        modelUrl: finalModelUrl || undefined,
        videoUrl: finalFileFormat === 'youtube' ? finalModelUrl : undefined,
        thumbnailImage: finalThumbnail || undefined,
        scale,
        annotations,
        authorName: 'Biology Educator',
        fileFormat: finalFileFormat
      });

      onModelAdded(saved);
      onClose();
    } catch (err) {
      console.error('Failed to save 3D model to library:', err);
      setErrorMsg('Could not save to 3D library. Please verify parameters and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        id="modal-add-3d-model"
        className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-[#1A2E1A] rounded-3xl shadow-2xl border border-[#2D5A27]/30 flex flex-col overflow-hidden text-[#1A2E1A] dark:text-slate-100"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#2D5A27]/20 flex items-center justify-between bg-[#F4F7F5] dark:bg-[#132416]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2D5A27] text-white flex items-center justify-center shadow-md">
              <Box className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-[#1A2E1A] dark:text-white">
                Add 3D Image, Model, or YouTube Video to Library
              </h3>
              <p className="text-xs text-[#2D5A27]/70 dark:text-emerald-400/80 font-medium">
                Upload from desktop or link YouTube biology videos & save to your persistent collection
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#2D5A27]/70 hover:text-[#2D5A27] dark:hover:text-white hover:bg-[#E8F0E8] dark:hover:bg-[#223D23] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Mode Tabs */}
        <div className="px-6 pt-4 border-b border-[#2D5A27]/15 flex items-center gap-2 overflow-x-auto bg-white dark:bg-[#1A2E1A]">
          <button
            type="button"
            onClick={() => {
              setActiveTab('youtube_video');
              setFileFormat('youtube');
            }}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'youtube_video'
                ? 'border-red-600 text-red-600 dark:text-red-400'
                : 'border-transparent text-[#2D5A27]/60 dark:text-emerald-400/60 hover:text-[#1A2E1A]'
            }`}
          >
            <Youtube className="w-3.5 h-3.5 text-red-500" />
            <span>YouTube Biology Video Link</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('upload_image_3d');
              setModelType('custom_glb');
              setFileFormat('image_3d');
            }}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'upload_image_3d'
                ? 'border-[#2D5A27] text-[#2D5A27] dark:text-emerald-300'
                : 'border-transparent text-[#2D5A27]/60 dark:text-emerald-400/60 hover:text-[#1A2E1A]'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Upload 3D Biology Image</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('upload_glb');
              setModelType('custom_glb');
              setFileFormat('glb');
            }}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'upload_glb'
                ? 'border-[#2D5A27] text-[#2D5A27] dark:text-emerald-300'
                : 'border-transparent text-[#2D5A27]/60 dark:text-emerald-400/60 hover:text-[#1A2E1A]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload 3D .GLB / .GLTF</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('web_url');
              setModelType('custom_glb');
            }}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'web_url'
                ? 'border-[#2D5A27] text-[#2D5A27] dark:text-emerald-300'
                : 'border-transparent text-[#2D5A27]/60 dark:text-emerald-400/60 hover:text-[#1A2E1A]'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Direct 3D URL</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('customize_preset')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'customize_preset'
                ? 'border-[#2D5A27] text-[#2D5A27] dark:text-emerald-300'
                : 'border-transparent text-[#2D5A27]/60 dark:text-emerald-400/60 hover:text-[#1A2E1A]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Clone Preset</span>
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-300 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* 1. YouTube Video Link Panel */}
          {activeTab === 'youtube_video' && (
            <div className="p-5 rounded-3xl bg-[#F4F7F5] dark:bg-[#132416] border border-red-500/20 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-red-100 dark:bg-red-950 text-red-600">
                  <Youtube className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1A2E1A] dark:text-white">
                    Link YouTube Biology Video / 3D Animation
                  </h4>
                  <p className="text-xs text-[#2D5A27]/70 dark:text-emerald-400/70">
                    Paste any YouTube URL (e.g. watch, share, or embed link). It will play directly inside the library and AR inspector.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A2E1A] dark:text-white mb-1.5">
                  YouTube Video Link *
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  value={youtubeInputUrl}
                  onChange={(e) => {
                    setYoutubeInputUrl(e.target.value);
                    setModelUrl(e.target.value);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#223D23] border border-[#2D5A27]/20 text-sm text-[#1A2E1A] dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Live YouTube Embed Preview */}
              {isYouTubeUrl(youtubeInputUrl) && (
                <div className="space-y-2 pt-2 border-t border-[#2D5A27]/15">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>YouTube Video Recognized (ID: {getYouTubeVideoId(youtubeInputUrl)})</span>
                    </span>
                    <span className="text-[11px] text-gray-500">Live Preview</span>
                  </div>

                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden border-2 border-red-500/40 shadow-md bg-black">
                    <iframe
                      src={getYouTubeEmbedUrl(youtubeInputUrl, false) || ''}
                      title="YouTube Video Preview"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. Upload Image 3D Panel */}
          {activeTab === 'upload_image_3d' && (
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`p-5 rounded-3xl transition border-2 border-dashed text-center space-y-3 ${
                isDraggingOver 
                  ? 'border-[#2D5A27] bg-[#E8F0E8] dark:bg-[#1E3A20]' 
                  : 'border-[#2D5A27]/30 bg-[#F4F7F5] dark:bg-[#132416]'
              }`}
            >
              <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleImageFileChange}
                className="hidden"
              />
              
              {isProcessingFile ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <Loader2 className="w-8 h-8 text-[#2D5A27] animate-spin" />
                  <p className="text-xs font-bold text-[#2D5A27] dark:text-emerald-300">
                    Processing desktop image for 3D view...
                  </p>
                </div>
              ) : thumbnailImage && fileFormat === 'image_3d' ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-[#2D5A27] shadow-lg bg-black/20">
                    <img 
                      src={thumbnailImage} 
                      alt="Uploaded 3D biological asset preview" 
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-[#2D5A27]/10 pointer-events-none" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-[#2D5A27] dark:text-emerald-300 flex items-center justify-center gap-1">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span>{uploadedFileName || 'Image Ready'}</span>
                      {uploadedFileSize && <span className="text-[10px] text-gray-500 font-normal">({uploadedFileSize})</span>}
                    </p>
                    <p className="text-[11px] text-[#2D5A27]/70 dark:text-emerald-400/70 mt-0.5">
                      High-detail rendering attached and ready to save
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="px-4 py-1.5 rounded-xl bg-white dark:bg-[#223D23] border border-[#2D5A27]/30 text-xs font-bold text-[#2D5A27] dark:text-emerald-300 hover:bg-[#E8F0E8] transition"
                  >
                    Choose Different Image
                  </button>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-[#E8F0E8] dark:bg-[#223D23] flex items-center justify-center mx-auto text-[#2D5A27] dark:text-emerald-300 shadow-sm">
                    <ImageIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1A2E1A] dark:text-white">
                      Upload 3D Biology Image or Diagram from Desktop
                    </h4>
                    <p className="text-xs text-[#2D5A27]/70 dark:text-emerald-400/70 mt-1 max-w-md mx-auto">
                      Drag & drop your microscope cross-section, diagram, or 3D render here, or click to browse (PNG, JPG, SVG, WebP).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="px-6 py-2.5 rounded-2xl bg-[#2D5A27] hover:bg-[#23461e] text-white text-xs font-bold transition shadow-sm"
                  >
                    Browse & Upload from Desktop
                  </button>
                </>
              )}
            </div>
          )}

          {/* 3. Upload GLB Panel */}
          {activeTab === 'upload_glb' && (
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`p-5 rounded-3xl transition border-2 border-dashed text-center space-y-3 ${
                isDraggingOver 
                  ? 'border-[#2D5A27] bg-[#E8F0E8] dark:bg-[#1E3A20]' 
                  : 'border-[#2D5A27]/30 bg-[#F4F7F5] dark:bg-[#132416]'
              }`}
            >
              <input
                ref={glbInputRef}
                type="file"
                accept=".glb,.gltf"
                onChange={handleGLBFileChange}
                className="hidden"
              />

              {isProcessingFile ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <Loader2 className="w-8 h-8 text-[#2D5A27] animate-spin" />
                  <p className="text-xs font-bold text-[#2D5A27] dark:text-emerald-300">
                    Loading 3D model from desktop...
                  </p>
                </div>
              ) : (
                <>
                  <div className="w-14 h-14 rounded-2xl bg-[#E8F0E8] dark:bg-[#223D23] flex items-center justify-center mx-auto text-[#2D5A27] dark:text-emerald-300 shadow-sm">
                    <Box className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1A2E1A] dark:text-white">
                      {modelUrl ? `✓ Attached: ${uploadedFileName || '3D Model'}` : 'Select a 3D File (.glb or .gltf)'}
                    </h4>
                    <p className="text-xs text-[#2D5A27]/70 dark:text-emerald-400/70 mt-1 max-w-md mx-auto">
                      {modelUrl && uploadedFileSize ? `Size: ${uploadedFileSize} • Saved to persistent 3D storage` : 'Drag and drop or browse 3D models exported from Blender, Sketchfab, or BioDigital.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => glbInputRef.current?.click()}
                    className="px-6 py-2.5 rounded-2xl bg-[#2D5A27] hover:bg-[#23461e] text-white text-xs font-bold transition shadow-sm"
                  >
                    {modelUrl ? 'Replace 3D File' : 'Browse Desktop .GLB File'}
                  </button>
                </>
              )}
            </div>
          )}

          {/* 4. Direct 3D URL */}
          {activeTab === 'web_url' && (
            <div className="p-4 rounded-3xl bg-[#F4F7F5] dark:bg-[#132416] border border-[#2D5A27]/20 space-y-3">
              <label className="block text-xs font-bold text-[#1A2E1A] dark:text-white">
                Public 3D Model URL (.glb / .gltf / CDN)
              </label>
              <input
                type="url"
                placeholder="https://cdn.example.com/models/mitochondria.glb"
                value={modelUrl}
                onChange={(e) => {
                  const val = e.target.value;
                  setModelUrl(val);
                  if (isYouTubeUrl(val)) {
                    setYoutubeInputUrl(val);
                    setFileFormat('youtube');
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#223D23] border border-[#2D5A27]/15 text-sm text-[#1A2E1A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
              />
              <p className="text-[11px] text-[#2D5A27]/70 dark:text-emerald-400/70">
                Direct link to any HTTPS CORS-accessible .glb or .gltf 3D asset, or YouTube video.
              </p>
            </div>
          )}

          {/* 5. Preset selection */}
          {activeTab === 'customize_preset' && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-[#1A2E1A] dark:text-white block">
                Select a Scientific Preset to Clone & Label:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BUILT_IN_3D_MODELS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPresetToCustomize(preset)}
                    className="p-3 rounded-2xl bg-[#F4F7F5] dark:bg-[#132416] hover:bg-[#E8F0E8] dark:hover:bg-[#223D23] border border-[#2D5A27]/20 text-left transition"
                  >
                    <span className="text-[10px] font-bold uppercase text-[#2D5A27]/70 dark:text-emerald-400 block mb-1">
                      {preset.category}
                    </span>
                    <span className="text-xs font-bold text-[#1A2E1A] dark:text-white block">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. Metadata Inputs: Topic & Model Name */}
          <div className="space-y-4 pt-2 border-t border-[#2D5A27]/15">
            {/* Topic / Subject Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#1A2E1A] dark:text-white">
                  Biology Topic / Category *
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomTopicMode(!isCustomTopicMode)}
                  className="text-xs font-bold text-[#2D5A27] dark:text-emerald-300 hover:underline"
                >
                  {isCustomTopicMode ? '← Pick standard topic' : '+ Create custom topic'}
                </button>
              </div>

              {isCustomTopicMode ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="Type custom topic name (e.g. Immunology, Marine Biology, Photosynthesis)..."
                    value={customTopicInput}
                    onChange={(e) => setCustomTopicInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4F7F5] dark:bg-[#223D23] border border-[#2D5A27]/15 text-sm text-[#1A2E1A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
                  />
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    <span className="text-[11px] text-[#2D5A27]/70 dark:text-emerald-400/70 whitespace-nowrap">
                      Quick picks:
                    </span>
                    {commonTopicSuggestions.slice(5).map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => setCustomTopicInput(sug)}
                        className="px-2 py-0.5 rounded-lg bg-[#E8F0E8] dark:bg-[#132416] text-[10px] font-bold text-[#2D5A27] dark:text-emerald-300 hover:bg-[#2D5A27] hover:text-white transition whitespace-nowrap"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4F7F5] dark:bg-[#223D23] border border-[#2D5A27]/15 text-sm text-[#1A2E1A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
                >
                  <option value="Cellular Biology">Cellular Biology</option>
                  <option value="Genetics">Genetics</option>
                  <option value="Human Anatomy">Human Anatomy</option>
                  <option value="Botany">Botany</option>
                  <option value="Microbiology">Microbiology</option>
                </select>
              )}
            </div>

            {/* Model / Organelle Name */}
            <div>
              <label className="block text-xs font-bold text-[#1A2E1A] dark:text-white mb-1">
                Model / Exhibit Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Chloroplast Thylakoid Grana, Photosynthesis Video, Ribosome..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4F7F5] dark:bg-[#223D23] border border-[#2D5A27]/15 text-sm text-[#1A2E1A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-[#1A2E1A] dark:text-white mb-1">
                Scientific Description / Biological Function
              </label>
              <textarea
                rows={2}
                placeholder="Describe anatomical features, biochemical functions, and educational key points..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-[#F4F7F5] dark:bg-[#223D23] border border-[#2D5A27]/15 text-sm text-[#1A2E1A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
              />
            </div>
          </div>

          {/* 3. Organelle Callout Hotspots / Annotations (Optional) */}
          <div className="pt-3 border-t border-[#2D5A27]/15 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#2D5A27]/80 dark:text-emerald-300 uppercase tracking-wider">
                Organelle Callout Pins ({annotations.length})
              </label>
              <span className="text-[11px] text-[#2D5A27]/70 dark:text-emerald-400/80">
                Optional interactive labels pinned onto the model
              </span>
            </div>

            {/* List Existing Annotations */}
            {annotations.length > 0 && (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {annotations.map((ann, idx) => (
                  <div 
                    key={ann.id} 
                    className="p-2.5 rounded-2xl bg-[#F4F7F5] dark:bg-[#132416] border border-[#2D5A27]/15 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex-1">
                      <span className="font-bold text-[#1A2E1A] dark:text-white flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-[#2D5A27] text-white text-[10px] flex items-center justify-center font-mono">
                          {idx + 1}
                        </span>
                        {ann.name}
                      </span>
                      <p className="text-[#2D5A27]/70 dark:text-emerald-300/70 text-[11px] mt-0.5">
                        {ann.function || ann.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveAnnotation(ann.id)}
                      className="p-1 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Annotation Card */}
            <div className="p-3 rounded-2xl bg-[#E8F0E8]/50 dark:bg-[#223D23]/50 border border-[#2D5A27]/20 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Organelle / Part Name (e.g. Grana Stacks)"
                  value={newAnnName}
                  onChange={(e) => setNewAnnName(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1A2E1A] border border-[#2D5A27]/15 text-xs text-[#1A2E1A] dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Function (e.g. Light-dependent reactions)"
                  value={newAnnFunc}
                  onChange={(e) => setNewAnnFunc(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1A2E1A] border border-[#2D5A27]/15 text-xs text-[#1A2E1A] dark:text-white"
                />
              </div>

              <button
                type="button"
                onClick={handleAddAnnotation}
                disabled={!newAnnName.trim()}
                className="w-full py-1.5 rounded-xl bg-white dark:bg-[#1A2E1A] hover:bg-[#E8F0E8] border border-[#2D5A27]/20 text-xs font-bold text-[#2D5A27] dark:text-emerald-300 disabled:opacity-40 transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Organelle Pin</span>
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              id="btn-submit-save-3d-model"
              type="submit"
              disabled={isSubmitting || isProcessingFile || (!modelUrl && !youtubeInputUrl && activeTab !== 'customize_preset')}
              className="w-full py-3.5 rounded-2xl bg-[#2D5A27] hover:bg-[#23461e] text-white text-sm font-bold transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Asset to Library...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Save {fileFormat === 'youtube' ? 'YouTube Video' : '3D Model'} to Library</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
