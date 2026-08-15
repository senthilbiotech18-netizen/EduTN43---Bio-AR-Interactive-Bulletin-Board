import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Plus, 
  Box, 
  Search, 
  Filter, 
  Layers, 
  Rotate3d, 
  Sparkles, 
  Trash2, 
  Check, 
  Upload, 
  ExternalLink, 
  BookOpen, 
  Info, 
  Maximize2, 
  Minimize2,
  RotateCcw, 
  AlertTriangle,
  ImageIcon,
  Tag,
  Youtube,
  Play,
  Volume2
} from 'lucide-react';
import { Library3DModel, Project } from '../types';
import { 
  subscribeToModelLibrary, 
  deleteModelFromLibrary, 
  clearAllModelsFromLibrary, 
  resetModelLibraryToDefaults 
} from '../services/modelLibraryService';
import { Model3DViewer } from './Model3DViewer';
import { Add3DModelModal } from './Add3DModelModal';
import { isYouTubeUrl, getYouTubeEmbedUrl, getYouTubeThumbnailUrl, getYouTubeVideoId } from '../utils/mediaUtils';

interface ModelLibraryModalProps {
  onClose: () => void;
  onSelectModelForProject?: (model: Library3DModel) => void;
}

export const ModelLibraryModal: React.FC<ModelLibraryModalProps> = ({
  onClose,
  onSelectModelForProject,
}) => {
  const [models, setModels] = useState<Library3DModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<Library3DModel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Fullscreen Theater Mode State
  const [isFullscreenTheaterOpen, setIsFullscreenTheaterOpen] = useState(false);
  const [showTheaterNotes, setShowTheaterNotes] = useState(true);

  // In-app confirmation states (iframe friendly - no window.confirm)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showConfirmClearAll, setShowConfirmClearAll] = useState(false);
  const [showConfirmRestore, setShowConfirmRestore] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Keyboard shortcut listener (ESC to close fullscreen theater)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreenTheaterOpen) {
        setIsFullscreenTheaterOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreenTheaterOpen]);

  // Subscribe to model library
  useEffect(() => {
    const unsubscribe = subscribeToModelLibrary((allModels) => {
      setModels(allModels);
      setSelectedModel((prev) => {
        if (allModels.length === 0) return null;
        if (prev && allModels.some(m => m.id === prev.id)) {
          return allModels.find(m => m.id === prev.id) || prev;
        }
        return allModels[0];
      });
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Compute all unique topic categories dynamically
  const categories = useMemo(() => {
    const defaultTopics = ['All', 'Cellular Biology', 'Genetics', 'Human Anatomy', 'Botany', 'Microbiology'];
    const modelTopics = models.map(m => m.category).filter(Boolean);
    const combined = Array.from(new Set([...defaultTopics, ...modelTopics]));
    return combined;
  }, [models]);

  const filteredModels = useMemo(() => {
    return models.filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        (m.category && m.category.toLowerCase().includes(q)) ||
        (m.annotations && m.annotations.some(a => a.name.toLowerCase().includes(q)));

      const matchesCat = selectedCategory === 'All' || m.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [models, searchQuery, selectedCategory]);

  // Execute Individual Model Deletion
  const handleExecuteDelete = async (modelId: string) => {
    const modelToDelete = models.find(m => m.id === modelId);
    const modelName = modelToDelete ? modelToDelete.name : 'Model';
    
    await deleteModelFromLibrary(modelId);
    setConfirmDeleteId(null);
    
    // Update local selected state
    const remaining = models.filter(m => m.id !== modelId);
    if (selectedModel?.id === modelId) {
      setSelectedModel(remaining.length > 0 ? remaining[0] : null);
    }

    setActionSuccessMsg(`Deleted "${modelName}" from 3D library.`);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  // Execute Clear All Models
  const handleExecuteClearAll = async () => {
    await clearAllModelsFromLibrary();
    setShowConfirmClearAll(false);
    setSelectedModel(null);
    setActionSuccessMsg('All models have been removed from your 3D library.');
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  // Execute Restore Default Biological Presets
  const handleExecuteRestoreDefaults = () => {
    resetModelLibraryToDefaults();
    setShowConfirmRestore(false);
    setActionSuccessMsg('Restored original biology presets (Plant Cell, DNA, Heart, Neuron, Chloroplast, Animal Cell).');
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  // Check if selected model is YouTube
  const isSelectedYouTube = selectedModel ? (
    selectedModel.fileFormat === 'youtube' ||
    isYouTubeUrl(selectedModel.modelUrl) ||
    isYouTubeUrl(selectedModel.videoUrl)
  ) : false;

  // Convert Library3DModel to temporary Project structure for Model3DViewer
  const viewerProject: Project | null = selectedModel ? {
    id: selectedModel.id,
    title: selectedModel.name,
    studentName: selectedModel.authorName || 'Scientific Library',
    grade: selectedModel.category,
    topic: selectedModel.category,
    description: selectedModel.description,
    markerImage: '',
    videoUrl: selectedModel.videoUrl || (isSelectedYouTube ? selectedModel.modelUrl || '' : ''),
    modelType: selectedModel.modelType,
    modelUrl: selectedModel.modelUrl,
    modelScale: selectedModel.scale || 1.0,
    createdAt: selectedModel.createdAt,
    keyPoints: selectedModel.annotations?.map(a => `${a.name}: ${a.function || a.description}`) || [],
    audioTranscript: selectedModel.description
  } : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        id="modal-3d-model-library"
        className="relative w-full max-w-7xl h-[92vh] bg-white dark:bg-[#132416] rounded-3xl shadow-2xl border border-[#2D5A27]/30 flex flex-col overflow-hidden text-[#1A2E1A] dark:text-slate-100"
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-[#2D5A27]/20 flex items-center justify-between bg-[#F4F7F5] dark:bg-[#0E1B10]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2D5A27] text-white flex items-center justify-center shadow-md">
              <Box className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#1A2E1A] dark:text-white">
                  3D Biological Model, Image & Video Library
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#E8F0E8] dark:bg-[#223D23] text-[#2D5A27] dark:text-emerald-300 border border-[#2D5A27]/20">
                  {models.length} {models.length === 1 ? 'Asset' : 'Assets'}
                </span>
              </div>
              <p className="text-xs text-[#2D5A27]/70 dark:text-emerald-400/80 font-medium">
                Add custom biology topics, upload your own 3D images & models, or link YouTube videos to pair with student AR posters
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {models.length > 0 && (
              <button
                id="btn-clear-all-models"
                type="button"
                onClick={() => setShowConfirmClearAll(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 text-xs font-bold transition"
                title="Delete all models to start completely fresh"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete All</span>
              </button>
            )}

            <button
              id="btn-restore-default-models"
              type="button"
              onClick={() => setShowConfirmRestore(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-2xl border border-[#2D5A27]/20 bg-white dark:bg-[#1A2E1A] text-[#2D5A27] dark:text-emerald-300 hover:bg-[#E8F0E8] text-xs font-bold transition"
              title="Restore standard biological preset models"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore Defaults</span>
            </button>

            <button
              id="btn-open-add-model-modal"
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#2D5A27] hover:bg-[#23461e] text-white text-xs font-bold transition shadow-md"
            >
              <Plus className="w-4 h-4 text-emerald-200" />
              <span>+ Add Topic & 3D / YouTube</span>
            </button>

            <button
              id="btn-close-model-library"
              type="button"
              onClick={onClose}
              className="p-2 rounded-2xl text-[#2D5A27]/70 hover:text-[#1A2E1A] dark:hover:text-white hover:bg-[#E8F0E8] dark:hover:bg-[#223D23] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Feedback Banner */}
        {actionSuccessMsg && (
          <div className="px-6 py-2 bg-emerald-50 dark:bg-emerald-950/80 border-b border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-between animate-in fade-in">
            <span>✓ {actionSuccessMsg}</span>
            <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Confirmation Modal for Clear All */}
        {showConfirmClearAll && (
          <div className="px-6 py-3 bg-red-50 dark:bg-red-950/90 border-b border-red-200 dark:border-red-800 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span className="text-xs font-bold text-red-800 dark:text-red-200">
                Are you sure you want to delete ALL {models.length} models and clear the library?
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExecuteClearAll}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                Yes, Delete Everything
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmClearAll(false)}
                className="px-3 py-1 bg-white dark:bg-[#1A2E1A] border border-slate-300 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Confirmation Modal for Restore Defaults */}
        {showConfirmRestore && (
          <div className="px-6 py-3 bg-[#E8F0E8] dark:bg-[#1E3A20] border-b border-[#2D5A27]/20 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-[#2D5A27] dark:text-emerald-300" />
              <span className="text-xs font-bold text-[#1A2E1A] dark:text-emerald-200">
                Restore the default exhibits (Plant Cell, DNA Helix, Human Heart, Neuron, Chloroplast)?
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExecuteRestoreDefaults}
                className="px-3 py-1 bg-[#2D5A27] hover:bg-[#23461e] text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                Restore Standard Presets
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmRestore(false)}
                className="px-3 py-1 bg-white dark:bg-[#1A2E1A] border border-slate-300 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Filter & Topic Bar */}
        <div className="px-6 py-3 border-b border-[#2D5A27]/15 bg-white dark:bg-[#1A2E1A] flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 text-[#2D5A27]/50 dark:text-emerald-400/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-search-models"
              type="text"
              placeholder="Search by model name, organelle, or biology topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-2xl bg-[#F4F7F5] dark:bg-[#132416] border border-[#2D5A27]/15 text-xs text-[#1A2E1A] dark:text-white placeholder-[#2D5A27]/40 focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
            />
          </div>

          {/* Dynamic Topic Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-2xl">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? 'bg-[#2D5A27] text-white shadow-xs'
                    : 'bg-[#F4F7F5] dark:bg-[#132416] text-[#2D5A27]/70 dark:text-emerald-300/70 hover:bg-[#E8F0E8] border border-[#2D5A27]/10'
                }`}
              >
                {cat === 'All' ? <Layers className="w-3 h-3" /> : <Tag className="w-3 h-3" />}
                <span>{cat}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main 2-Column Split View: Models Grid (60%), Live 3D Inspector (40%) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 overflow-hidden">
          {/* Left Column: Models Grid (7 cols) */}
          <div className="lg:col-span-7 p-4 sm:p-6 overflow-y-auto border-r border-[#2D5A27]/15 bg-[#F4F7F5]/50 dark:bg-[#132416]/50 space-y-4">
            {filteredModels.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {filteredModels.map((model) => {
                  const isSelected = selectedModel?.id === model.id;
                  const isPendingDelete = confirmDeleteId === model.id;
                  const isModelYouTube = model.fileFormat === 'youtube' || isYouTubeUrl(model.modelUrl) || isYouTubeUrl(model.videoUrl);
                  const ytThumb = isModelYouTube ? (model.thumbnailImage || getYouTubeThumbnailUrl(model.modelUrl || model.videoUrl)) : null;

                  return (
                    <div
                      key={model.id}
                      onClick={() => !isPendingDelete && setSelectedModel(model)}
                      className={`p-4 rounded-3xl border text-left cursor-pointer transition flex flex-col justify-between group relative ${
                        isSelected
                          ? 'bg-white dark:bg-[#1A2E1A] border-[#2D5A27] shadow-md ring-2 ring-[#2D5A27]/30'
                          : 'bg-white/80 dark:bg-[#1A2E1A]/80 border-[#2D5A27]/15 hover:border-[#2D5A27]/40 hover:bg-white'
                      }`}
                    >
                      <div>
                        {/* Card Header & Topic */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="px-2.5 py-0.5 rounded-lg text-[10px] uppercase font-bold bg-[#E8F0E8] dark:bg-[#223D23] text-[#2D5A27] dark:text-emerald-300 flex items-center gap-1">
                            <Tag className="w-2.5 h-2.5 opacity-70" />
                            {model.category || 'General'}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {isModelYouTube ? (
                              <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-2 py-0.5 rounded-lg flex items-center gap-1 border border-red-200 dark:border-red-900/40">
                                <Youtube className="w-3 h-3" />
                                YouTube
                              </span>
                            ) : model.fileFormat === 'image_3d' ? (
                              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <ImageIcon className="w-2.5 h-2.5" />
                                3D Image
                              </span>
                            ) : model.isBuiltIn ? (
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                                Preset
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
                                Custom {model.fileFormat?.toUpperCase() || '3D'}
                              </span>
                            )}

                            {/* Direct Delete Trigger */}
                            <button
                              id={`btn-delete-model-${model.id}`}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(model.id);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition"
                              title={`Delete "${model.name}"`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Thumbnail if YouTube or Image */}
                        {ytThumb && (
                          <div className="relative aspect-video w-full rounded-2xl overflow-hidden mb-2.5 bg-black/40 border border-[#2D5A27]/20 group-hover:opacity-95 transition">
                            <img src={ytThumb} alt={model.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                              <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                                <Play className="w-4 h-4 fill-white ml-0.5" />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* In-Card Confirmation Box if Pending Delete */}
                        {isPendingDelete && (
                          <div 
                            onClick={(e) => e.stopPropagation()}
                            className="my-2 p-2.5 rounded-2xl bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-800 text-xs animate-in fade-in"
                          >
                            <p className="text-red-800 dark:text-red-200 font-bold mb-2">
                              Delete this model?
                            </p>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleExecuteDelete(model.id)}
                                className="px-3 py-1 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-[11px] shadow-xs"
                              >
                                Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-3 py-1 rounded-xl bg-white dark:bg-[#1A2E1A] border border-slate-300 text-slate-700 dark:text-slate-200 font-bold text-[11px]"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        <h4 className="text-sm font-bold text-[#1A2E1A] dark:text-white leading-snug">
                          {model.name}
                        </h4>

                        <p className="text-xs text-[#2D5A27]/70 dark:text-emerald-300/70 mt-1 line-clamp-2 leading-relaxed">
                          {model.description}
                        </p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-[#2D5A27]/10 flex items-center justify-between text-[11px]">
                        <span className="text-[#2D5A27]/60 dark:text-emerald-400/60 font-medium">
                          {model.annotations?.length || 0} Organelle Pins
                        </span>

                        <span className={`font-bold transition ${isSelected ? 'text-[#2D5A27] dark:text-emerald-300' : 'text-[#2D5A27]/50 group-hover:text-[#2D5A27]'}`}>
                          {isSelected ? '● Active in Inspector' : 'Click to Inspect →'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 bg-white dark:bg-[#1A2E1A] rounded-3xl border border-dashed border-[#2D5A27]/25 p-8 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-3xl bg-[#E8F0E8] dark:bg-[#223D23] flex items-center justify-center mb-4 text-[#2D5A27] dark:text-emerald-300 shadow-inner">
                  <Box className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-[#1A2E1A] dark:text-white">
                  {models.length === 0 ? 'Your Biology Library is Empty' : `No Models in "${selectedCategory}"`}
                </h4>
                <p className="text-xs text-[#2D5A27]/70 dark:text-emerald-400/80 mt-1.5 max-w-md leading-relaxed">
                  {models.length === 0 
                    ? 'All previous models have been deleted. You can now add your own custom topic, upload your 3D image or model, or link a YouTube biology video.'
                    : `Add a new 3D image, model, or YouTube video directly to "${selectedCategory}".`}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-[#2D5A27] hover:bg-[#23461e] text-white text-xs font-bold transition shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Topic & 3D / YouTube</span>
                  </button>

                  {models.length === 0 && (
                    <button
                      type="button"
                      onClick={() => setShowConfirmRestore(true)}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-[#2D5A27]/20 bg-[#F4F7F5] dark:bg-[#223D23] text-[#2D5A27] dark:text-emerald-300 hover:bg-[#E8F0E8] text-xs font-bold transition"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Restore Biology Presets</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Live Interactive Inspector View (5 cols) */}
          <div className="lg:col-span-5 p-4 sm:p-6 bg-white dark:bg-[#1A2E1A] flex flex-col justify-between overflow-y-auto space-y-4">
            {selectedModel ? (
              <>
                {/* Media Screen Box (YouTube Player OR 3D Canvas) with Fullscreen Button */}
                <div className="relative w-full h-64 sm:h-72 shrink-0 rounded-3xl overflow-hidden border border-[#2D5A27]/20 bg-black shadow-md flex items-center justify-center group">
                  {isSelectedYouTube ? (
                    <div className="w-full h-full relative bg-black">
                      <iframe
                        src={getYouTubeEmbedUrl(selectedModel.modelUrl || selectedModel.videoUrl, true) || ''}
                        title={selectedModel.name}
                        className="w-full h-full border-0 absolute inset-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  ) : viewerProject ? (
                    <Model3DViewer
                      project={viewerProject}
                      className="w-full h-full"
                    />
                  ) : null}

                  {/* Floating Fullscreen / Theater Trigger Button */}
                  <div className="absolute top-3 right-3 flex items-center gap-2 z-20 pointer-events-auto">
                    <button
                      id="btn-open-fullscreen-theater"
                      type="button"
                      onClick={() => setIsFullscreenTheaterOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-black/85 hover:bg-black text-white text-xs font-bold shadow-xl border border-white/20 backdrop-blur-md transition hover:scale-105"
                      title="Open in Full Screen Theater Mode"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Full Screen</span>
                    </button>
                  </div>
                </div>

                {/* Model Details Card */}
                <div className="p-4 rounded-3xl bg-[#F4F7F5] dark:bg-[#132416] border border-[#2D5A27]/15 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#2D5A27]/70 dark:text-emerald-400 flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5" />
                        {selectedModel.category}
                      </span>
                      <h3 className="text-base font-bold text-[#1A2E1A] dark:text-white">
                        {selectedModel.name}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSelectedYouTube ? (
                        <a
                          href={selectedModel.modelUrl || selectedModel.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-xl text-xs font-bold bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-300 flex items-center gap-1 border border-red-200 dark:border-red-900"
                        >
                          <Youtube className="w-3 h-3" />
                          <span>YouTube Link</span>
                        </a>
                      ) : (
                        <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-[#E8F0E8] dark:bg-[#223D23] text-[#2D5A27] dark:text-emerald-300">
                          Scale: {selectedModel.scale}x
                        </span>
                      )}
                      
                      {/* Delete from Inspector */}
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(selectedModel.id)}
                        className="p-1.5 rounded-xl border border-red-200 dark:border-red-900/40 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                        title="Delete this model"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Dedicated Full Screen Button Point to Test & Check */}
                  <button
                    id="btn-fullscreen-inspect-trigger"
                    type="button"
                    onClick={() => setIsFullscreenTheaterOpen(true)}
                    className="w-full py-2.5 px-4 rounded-2xl bg-emerald-50 dark:bg-[#1E3A20] hover:bg-emerald-100 dark:hover:bg-[#254828] text-[#2D5A27] dark:text-emerald-300 border border-[#2D5A27]/30 text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs"
                  >
                    <Maximize2 className="w-4 h-4 text-[#2D5A27] dark:text-emerald-400" />
                    <span>Open in Full Screen to Test & Inspect</span>
                  </button>

                  {confirmDeleteId === selectedModel.id && (
                    <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-800 text-xs space-y-2">
                      <p className="font-bold text-red-800 dark:text-red-200">
                        Confirm deletion of "{selectedModel.name}"?
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleExecuteDelete(selectedModel.id)}
                          className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
                        >
                          Confirm Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1A2E1A] border border-slate-300 font-bold text-slate-700 dark:text-slate-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-[#2D5A27]/80 dark:text-emerald-200/80 leading-relaxed">
                    {selectedModel.description}
                  </p>

                  {/* Organelle Callouts List */}
                  {selectedModel.annotations && selectedModel.annotations.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-[#2D5A27]/10">
                      <span className="text-[11px] font-bold text-[#1A2E1A] dark:text-white block">
                        Labeled Organelle Components / Points:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedModel.annotations.map((ann) => (
                          <span
                            key={ann.id}
                            className="px-2 py-0.5 rounded-lg bg-white dark:bg-[#223D23] text-[11px] font-bold text-[#2D5A27] dark:text-emerald-200 border border-[#2D5A27]/15"
                          >
                            • {ann.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Primary Action Button: Link to Student Poster Project */}
                {onSelectModelForProject && (
                  <button
                    id="btn-use-model-in-project"
                    type="button"
                    onClick={() => {
                      onSelectModelForProject(selectedModel);
                      onClose();
                    }}
                    className="w-full py-3 rounded-2xl bg-[#2D5A27] hover:bg-[#23461e] text-white text-xs font-bold transition shadow-md flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-300" />
                    <span>Create Student Project with this {isSelectedYouTube ? 'Video Exhibit' : '3D Model'}</span>
                  </button>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#F4F7F5]/50 dark:bg-[#132416]/50 rounded-3xl border border-dashed border-[#2D5A27]/20">
                <Box className="w-12 h-12 text-[#2D5A27]/40 mb-2" />
                <p className="text-xs font-bold text-[#1A2E1A] dark:text-emerald-200">
                  No Model Selected
                </p>
                <p className="text-[11px] text-[#2D5A27]/60 dark:text-emerald-400/60 mt-1">
                  Click any model on the left to inspect in interactive view
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Fullscreen Theater Mode Overlay */}
        {isFullscreenTheaterOpen && selectedModel && (
          <div 
            id="modal-fullscreen-theater"
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-lg flex flex-col animate-in fade-in duration-200 text-white overflow-hidden"
          >
            {/* Fullscreen Top Navigation Bar */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-2xl bg-[#2D5A27] text-white flex items-center justify-center shadow-md">
                  {isSelectedYouTube ? <Youtube className="w-5 h-5 text-red-400" /> : <Box className="w-5 h-5 text-emerald-200" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      {selectedModel.name}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-800">
                      {selectedModel.category}
                    </span>
                    {isSelectedYouTube && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-950 text-red-300 border border-red-800">
                        YouTube Exhibit
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 font-medium">
                    Full Screen Inspection & Presentation Mode (Press ESC to exit)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {selectedModel.annotations && selectedModel.annotations.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowTheaterNotes(!showTheaterNotes)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                      showTheaterNotes
                        ? 'bg-emerald-900/60 border-emerald-600 text-emerald-200'
                        : 'bg-white/10 border-white/20 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{showTheaterNotes ? 'Hide Organelle Notes' : 'Show Organelle Notes'}</span>
                  </button>
                )}

                {isSelectedYouTube && (
                  <a
                    href={selectedModel.modelUrl || selectedModel.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Watch on YouTube</span>
                  </a>
                )}

                {onSelectModelForProject && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectModelForProject(selectedModel);
                      setIsFullscreenTheaterOpen(false);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#2D5A27] hover:bg-[#23461e] text-white text-xs font-bold transition shadow-md"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Use in Student Poster</span>
                  </button>
                )}

                <button
                  id="btn-close-fullscreen-theater"
                  type="button"
                  onClick={() => setIsFullscreenTheaterOpen(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1 text-xs font-bold"
                  title="Exit Full Screen (ESC)"
                >
                  <Minimize2 className="w-5 h-5" />
                  <span className="hidden sm:inline">Exit Full Screen</span>
                </button>
              </div>
            </div>

            {/* Main Stage & Side Drawer */}
            <div className="flex-1 flex overflow-hidden relative">
              {/* Fullscreen Video / 3D Stage */}
              <div className="flex-1 w-full h-full bg-black flex items-center justify-center overflow-hidden p-2 sm:p-6">
                {isSelectedYouTube ? (
                  <div className="w-full h-full max-w-6xl max-h-[85vh] aspect-video relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black">
                    <iframe
                      src={getYouTubeEmbedUrl(selectedModel.modelUrl || selectedModel.videoUrl, true) || ''}
                      title={selectedModel.name}
                      className="w-full h-full border-0 absolute inset-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                ) : viewerProject ? (
                  <div className="w-full h-full max-w-6xl max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                    <Model3DViewer
                      project={viewerProject}
                      className="w-full h-full"
                    />
                  </div>
                ) : null}
              </div>

              {/* Collapsible Scientific & Organelle Drawer */}
              {showTheaterNotes && (
                <div className="w-80 lg:w-96 border-l border-white/10 bg-[#0E1B10]/95 backdrop-blur-md p-6 overflow-y-auto shrink-0 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <Info className="w-4 h-4" />
                        Exhibit Details
                      </span>
                      <button
                        onClick={() => setShowTheaterNotes(false)}
                        className="text-gray-400 hover:text-white text-xs"
                      >
                        ✕
                      </button>
                    </div>

                    <div>
                      <h4 className="text-lg font-bold text-white mb-2">{selectedModel.name}</h4>
                      <p className="text-xs text-emerald-200/80 leading-relaxed">
                        {selectedModel.description}
                      </p>
                    </div>

                    {selectedModel.annotations && selectedModel.annotations.length > 0 && (
                      <div className="space-y-2 pt-3 border-t border-white/10">
                        <span className="text-xs font-bold text-emerald-300 block">
                          Key Organelles & Components ({selectedModel.annotations.length}):
                        </span>
                        <div className="space-y-2">
                          {selectedModel.annotations.map((ann, idx) => (
                            <div
                              key={ann.id || idx}
                              className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs space-y-1 hover:border-emerald-500/50 transition"
                            >
                              <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                {ann.name}
                              </div>
                              {ann.function && (
                                <p className="text-[11px] text-gray-300 leading-snug pl-3.5">
                                  {ann.function}
                                </p>
                              )}
                              {ann.description && !ann.function && (
                                <p className="text-[11px] text-gray-400 leading-snug pl-3.5">
                                  {ann.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {onSelectModelForProject && (
                    <button
                      type="button"
                      onClick={() => {
                        onSelectModelForProject(selectedModel);
                        setIsFullscreenTheaterOpen(false);
                        onClose();
                      }}
                      className="w-full py-3 rounded-2xl bg-[#2D5A27] hover:bg-[#23461e] text-white text-xs font-bold transition shadow-lg flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-300" />
                      <span>Use this Exhibit in Student Project</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal for Adding New 3D Image / Model / YouTube Video */}
        {isAddModalOpen && (
          <Add3DModelModal
            initialTopic={selectedCategory !== 'All' ? selectedCategory : undefined}
            onClose={() => setIsAddModalOpen(false)}
            onModelAdded={(newModel) => {
              setSelectedModel(newModel);
              setActionSuccessMsg(`Added "${newModel.name}" under topic "${newModel.category}".`);
              setTimeout(() => setActionSuccessMsg(null), 3000);
            }}
          />
        )}
      </div>
    </div>
  );
};
