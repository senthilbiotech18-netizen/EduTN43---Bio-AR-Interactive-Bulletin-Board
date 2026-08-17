import React from 'react';
import { 
  Camera, 
  Sparkles, 
  Layers, 
  GraduationCap, 
  Eye, 
  Dna, 
  Grid, 
  ShieldCheck, 
  Smartphone, 
  Box, 
  Plus,
  Download,
  Laptop,
  QrCode
} from 'lucide-react';
import { ViewMode } from '../types';

interface NavbarProps {
  currentView: ViewMode;
  onViewChange: (mode: ViewMode) => void;
  onOpenGallery: () => void;
  onOpen3DLibrary: () => void;
  onOpenMasterQR?: () => void;
  onOpenInstallModal?: () => void;
  projectCount: number;
  isInstallable?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onViewChange,
  onOpenGallery,
  onOpen3DLibrary,
  onOpenMasterQR,
  onOpenInstallModal,
  projectCount,
  isInstallable = true,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[#F4F7F5]/90 dark:bg-[#132416]/90 backdrop-blur-xl border-b border-[#2D5A27]/15 dark:border-[#2D5A27]/30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Tag */}
        <div 
          onClick={() => onViewChange('ar_scanner')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-2xl bg-[#2D5A27] flex items-center justify-center text-white shadow-md shadow-[#2D5A27]/25 group-hover:scale-105 transition-transform">
            <Dna className="w-5 h-5 animate-pulse text-emerald-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-[#1A2E1A] dark:text-white tracking-tight leading-none">
                BioAR Board
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E0E7E1] dark:bg-[#223D23] text-[#2D5A27] dark:text-emerald-300 border border-[#2D5A27]/15">
                Bento AR
              </span>
            </div>
            <p className="text-[11px] text-[#2D5A27]/70 dark:text-emerald-400/80 font-medium hidden sm:block">
              Image Recognition Biology Exhibition
            </p>
          </div>
        </div>

        {/* Center View Selector Tabs (Bento Pill) */}
        <div className="flex items-center p-1 rounded-2xl bg-[#E8F0E8] dark:bg-[#1A2E1A] border border-[#2D5A27]/15 dark:border-[#2D5A27]/30 shadow-inner">
          <button
            id="nav-tab-ar-viewer"
            type="button"
            onClick={() => onViewChange('ar_scanner')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              currentView === 'ar_scanner'
                ? 'bg-white dark:bg-[#2D5A27] text-[#2D5A27] dark:text-white shadow-sm'
                : 'text-[#2D5A27]/70 dark:text-emerald-300/70 hover:text-[#1A2E1A] dark:hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Viewer</span>
          </button>

          <button
            id="nav-tab-teacher-dashboard"
            type="button"
            onClick={() => onViewChange('teacher_dashboard')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              currentView === 'teacher_dashboard'
                ? 'bg-white dark:bg-[#2D5A27] text-[#2D5A27] dark:text-white shadow-sm'
                : 'text-[#2D5A27]/70 dark:text-emerald-300/70 hover:text-[#1A2E1A] dark:hover:text-white'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Teacher Hub</span>
          </button>

          <button
            id="nav-tab-3d-library"
            type="button"
            onClick={onOpen3DLibrary}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#2D5A27]/70 dark:text-emerald-300/70 hover:text-[#1A2E1A] dark:hover:text-white transition-all"
          >
            <Box className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>3D Library</span>
          </button>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2">
          {onOpenMasterQR && (
            <button
              id="btn-nav-master-qr"
              type="button"
              onClick={onOpenMasterQR}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition hover:scale-105"
              title="Get Board Master QR Code for Parents"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Board QR</span>
            </button>
          )}

          {onOpenInstallModal && (
            <button
              id="btn-nav-install-desktop"
              type="button"
              onClick={onOpenInstallModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-100/80 dark:bg-emerald-950/70 hover:bg-emerald-200/90 dark:hover:bg-emerald-900/90 text-[#2D5A27] dark:text-emerald-300 text-xs font-bold border border-emerald-300/60 dark:border-emerald-800 shadow-xs transition hover:scale-105"
              title="Download / Install Desktop App for Chromebook, Windows, Mac"
            >
              <Download className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              <span className="hidden md:inline">Install</span>
            </button>
          )}

          <button
            id="btn-nav-gallery"
            type="button"
            onClick={onOpenGallery}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-white dark:bg-[#1A2E1A] hover:bg-[#E8F0E8] dark:hover:bg-[#223D23] text-[#1A2E1A] dark:text-emerald-100 text-xs font-semibold border border-[#2D5A27]/15 dark:border-[#2D5A27]/30 shadow-xs transition"
            title="Browse & Print Posters"
          >
            <Eye className="w-3.5 h-3.5 text-[#2D5A27] dark:text-emerald-400" />
            <span className="hidden sm:inline">Posters</span>
            <span className="px-1.5 py-0.2 rounded-md bg-[#E8F0E8] dark:bg-[#2D5A27] text-[#2D5A27] dark:text-emerald-200 text-[10px] font-bold">
              {projectCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

