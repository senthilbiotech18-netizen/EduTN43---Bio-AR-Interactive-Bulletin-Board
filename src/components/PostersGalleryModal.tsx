import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Sparkles, 
  Eye, 
  Printer, 
  HelpCircle, 
  Check, 
  ExternalLink,
  Layers,
  Film,
  QrCode
} from 'lucide-react';
import { Project } from '../types';

interface PostersGalleryModalProps {
  projects: Project[];
  onClose: () => void;
  onSelectPosterForAR: (project: Project) => void;
  onOpenMasterQR?: () => void;
}

export const PostersGalleryModal: React.FC<PostersGalleryModalProps> = ({
  projects,
  onClose,
  onSelectPosterForAR,
  onOpenMasterQR,
}) => {
  const [activeProject, setActiveProject] = useState<Project>(projects[0] || null);

  if (!activeProject && projects.length > 0) {
    setActiveProject(projects[0]);
  }

  const handleDownload = (p: Project) => {
    const a = document.createElement('a');
    a.href = p.markerImage;
    a.download = `BioAR_Poster_${p.studentName.replace(/\s+/g, '_')}.jpg`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  if (projects.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0E1B10]/80 backdrop-blur-xl animate-in fade-in duration-200">
        <div className="relative w-full max-w-md p-6 bg-white dark:bg-[#1A2E1A] rounded-3xl shadow-2xl border border-[#2D5A27]/25 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#E8F0E8] dark:bg-[#223D23] text-[#2D5A27] dark:text-emerald-400 mx-auto flex items-center justify-center">
            <Eye className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-[#1A2E1A] dark:text-white">
            Exhibition Library is Empty
          </h3>
          <p className="text-xs text-[#2D5A27]/70 dark:text-emerald-400/80">
            All sample posters have been deleted. You can create a new student drawing exhibit or restore the default sample exhibits from the dashboard.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-[#2D5A27] hover:bg-[#23461e] text-white font-bold text-xs shadow-md transition"
          >
            Close Gallery
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#0E1B10]/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[90vh] flex flex-col bg-white dark:bg-[#1A2E1A] rounded-3xl shadow-2xl border border-[#2D5A27]/25 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D5A27]/15 bg-white/90 dark:bg-[#1A2E1A]/90 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-[#E8F0E8] dark:bg-[#223D23] text-[#2D5A27] dark:text-emerald-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#1A2E1A] dark:text-white text-base">
                Biology Poster Marker Bench & Print Cards
              </h3>
              <p className="text-xs text-[#2D5A27]/70 dark:text-emerald-400/80">
                Point your phone camera at these hand-drawn posters (or test instant AR lock)
              </p>
            </div>
          </div>

          <button
            id="btn-close-gallery-modal"
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl text-[#2D5A27]/70 hover:text-[#1A2E1A] dark:hover:text-white hover:bg-[#E8F0E8] dark:hover:bg-[#223D23] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area: Left list + Right High-Res Poster Stage */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Sidebar List */}
          <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-[#2D5A27]/15 overflow-y-auto p-4 space-y-2 bg-[#F4F7F5]/50 dark:bg-[#132416]/50">
            <div className="text-[11px] font-bold text-[#2D5A27]/70 dark:text-emerald-400/80 uppercase tracking-wider px-2 mb-2">
              Select Biology Poster ({projects.length})
            </div>

            {projects.map((p) => {
              const isSelected = activeProject?.id === p.id;
              return (
                <button
                  key={p.id}
                  id={`btn-gallery-select-${p.id}`}
                  onClick={() => setActiveProject(p)}
                  className={`w-full p-3 rounded-2xl border text-left transition flex items-center gap-3 ${
                    isSelected
                      ? 'bg-white dark:bg-[#223D23] border-[#2D5A27] shadow-sm ring-2 ring-[#2D5A27]/20'
                      : 'bg-white/60 dark:bg-[#1A2E1A]/40 border-[#2D5A27]/10 hover:bg-white'
                  }`}
                >
                  <img
                    src={p.markerImage}
                    alt={p.title}
                    className="w-12 h-14 object-cover rounded-xl border border-[#2D5A27]/20"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-[#2D5A27] dark:text-emerald-400 block truncate">
                      {p.studentName} • {p.grade}
                    </span>
                    <h4 className="font-bold text-xs text-[#1A2E1A] dark:text-white truncate">
                      {p.title}
                    </h4>
                    <span className="text-[10px] text-[#2D5A27]/60 dark:text-emerald-300/60 block truncate mt-0.5">
                      3D: {p.modelType.replace('preset_', '')}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Poster Stage */}
          {activeProject && (
            <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-[#F4F7F5]/80 dark:bg-[#0E1B10]/80 items-center justify-center">
              {/* Poster Frame */}
              <div className="relative max-w-md w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-[#2D5A27]/40 bg-white group">
                <img
                  src={activeProject.markerImage}
                  alt={activeProject.title}
                  className="w-full h-auto object-contain block"
                />

                {/* Floating scan reticle hint */}
                <div className="absolute inset-0 border-2 border-dashed border-[#2D5A27]/40 rounded-3xl pointer-events-none" />
              </div>

              {/* Action Toolbar below poster */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 w-full max-w-md">
                <button
                  id="btn-simulate-ar-lock"
                  onClick={() => {
                    onSelectPosterForAR(activeProject);
                    onClose();
                  }}
                  className="flex-1 min-w-[180px] flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#2D5A27] hover:bg-[#23461e] text-white font-bold text-xs shadow-lg shadow-[#2D5A27]/25 transition"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Test in Live AR Scanner</span>
                </button>

                {onOpenMasterQR && (
                  <button
                    id="btn-gallery-open-master-qr"
                    onClick={() => {
                      onClose();
                      onOpenMasterQR();
                    }}
                    className="flex items-center gap-1.5 py-3 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-xs transition"
                    title="Get Bulletin Board Master QR Banner"
                  >
                    <QrCode className="w-4 h-4 text-emerald-200" />
                    <span>Board Master QR</span>
                  </button>
                )}

                <button
                  id="btn-download-active-poster"
                  onClick={() => handleDownload(activeProject)}
                  className="flex items-center gap-1.5 py-3 px-4 rounded-2xl bg-white dark:bg-[#223D23] hover:bg-[#E8F0E8] text-[#1A2E1A] dark:text-white font-bold text-xs border border-[#2D5A27]/20 shadow-xs transition"
                >
                  <Download className="w-4 h-4 text-[#2D5A27]" />
                  <span>Download Marker</span>
                </button>

                <button
                  id="btn-print-active-poster"
                  onClick={handlePrint}
                  className="p-3 rounded-2xl bg-white dark:bg-[#223D23] hover:bg-[#E8F0E8] text-[#1A2E1A] dark:text-white border border-[#2D5A27]/20 shadow-xs transition"
                  title="Print Poster"
                >
                  <Printer className="w-4 h-4 text-[#2D5A27]" />
                </button>
              </div>

              {/* Instructions note */}
              <p className="text-[11px] text-[#2D5A27]/70 dark:text-emerald-300/70 text-center mt-3 max-w-sm">
                💡 Tip: Open BioAR Board on your mobile phone and aim the camera directly at this screen to test real-time hand-drawn image recognition!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
