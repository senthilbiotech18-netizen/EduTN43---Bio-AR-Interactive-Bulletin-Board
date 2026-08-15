import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Monitor, 
  Laptop, 
  Apple, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Camera, 
  ArrowRight, 
  ExternalLink, 
  Layers, 
  FileDown, 
  CheckCircle,
  HelpCircle,
  Maximize2
} from 'lucide-react';
import { 
  SupportedOS, 
  detectUserOS, 
  isRunningInStandaloneMode,
  downloadWindowsDesktopLauncher,
  downloadWindowsAppLauncher,
  downloadMacDesktopLauncher,
  downloadMacCommandLauncher,
  downloadChromebookDesktopEntry
} from '../utils/desktopInstallUtils';

interface DesktopInstallModalProps {
  onClose: () => void;
  deferredPrompt: any;
  onInstallSuccess?: () => void;
}

export const DesktopInstallModal: React.FC<DesktopInstallModalProps> = ({
  onClose,
  deferredPrompt,
  onInstallSuccess
}) => {
  const [selectedOS, setSelectedOS] = useState<SupportedOS>('windows');
  const [detectedOS, setDetectedOS] = useState<SupportedOS>('windows');
  const [isStandalone, setIsStandalone] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const os = detectUserOS();
    setDetectedOS(os);
    if (os !== 'other') {
      setSelectedOS(os);
    } else {
      setSelectedOS('windows');
    }
    setIsStandalone(isRunningInStandaloneMode());
  }, []);

  const handleNativePWAInstall = async () => {
    if (!deferredPrompt) {
      // If browser doesn't support or already handled the prompt, guide the user
      alert('To install directly, click the Install App icon (⊞ or ⬇) in your browser address bar (Omnibox), or use the download options below.');
      return;
    }

    try {
      setIsInstalling(true);
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        if (onInstallSuccess) onInstallSuccess();
        setDownloadSuccessMsg('App installed successfully! Check your Desktop/Applications.');
      }
    } catch (err) {
      console.error('Error during PWA installation:', err);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDownloadWindowsLauncher = () => {
    downloadWindowsAppLauncher();
    setDownloadSuccessMsg('Downloaded Windows Launcher (.bat)! Double click to open BioAR in standalone window mode.');
  };

  const handleDownloadWindowsShortcut = () => {
    downloadWindowsDesktopLauncher();
    setDownloadSuccessMsg('Downloaded Windows Desktop Shortcut (.url)! Double click anytime on your desktop.');
  };

  const handleDownloadMacLauncher = () => {
    downloadMacCommandLauncher();
    setDownloadSuccessMsg('Downloaded Mac Command Launcher (.command)! Double click to run in standalone window.');
  };

  const handleDownloadMacShortcut = () => {
    downloadMacDesktopLauncher();
    setDownloadSuccessMsg('Downloaded Mac WebLoc Shortcut (.webloc)! Move to your Desktop or Dock.');
  };

  const handleDownloadChromebookLauncher = () => {
    downloadChromebookDesktopEntry();
    setDownloadSuccessMsg('Downloaded Chromebook .desktop launcher file!');
  };

  return (
    <div 
      id="modal-desktop-install"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-3xl bg-[#F4F7F5] dark:bg-[#132416] border border-[#2D5A27]/25 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#2D5A27]/15 bg-white dark:bg-[#1A2E1A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#2D5A27] text-white flex items-center justify-center shadow-md">
              <Download className="w-6 h-6 text-emerald-300 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-[#1A2E1A] dark:text-white">
                  Download & Install Desktop App
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-950 text-[#2D5A27] dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Chromebook • Windows • Mac
                </span>
              </div>
              <p className="text-xs text-[#2D5A27]/70 dark:text-emerald-400/80 font-medium">
                Install BioAR Board for high-speed AR tracking, camera access, and distraction-free classroom use.
              </p>
            </div>
          </div>

          <button
            id="btn-close-install-modal"
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl bg-[#E8F0E8] dark:bg-[#223D23] hover:bg-[#d8e6d8] dark:hover:bg-[#2c4e2e] text-[#1A2E1A] dark:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* Notification Banner if downloaded */}
          {downloadSuccessMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{downloadSuccessMsg}</span>
            </div>
          )}

          {/* If already running in standalone app mode */}
          {isStandalone && (
            <div className="p-4 rounded-2xl bg-[#E8F0E8] dark:bg-[#1E3A20] border border-[#2D5A27]/30 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-[#1A2E1A] dark:text-emerald-100">
                  Application Already Installed & Active
                </h4>
                <p className="text-[11px] text-[#2D5A27]/70 dark:text-emerald-400">
                  You are currently running BioAR Board inside a dedicated standalone desktop window.
                </p>
              </div>
            </div>
          )}

          {/* Quick 1-Click Native Install Bar (Omnibox / PWA prompt) */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#2D5A27] to-[#1E3E1C] text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-300" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                  Instant 1-Click Installation
                </span>
              </div>
              <h3 className="text-base font-bold text-white">
                Install as a Native Desktop App
              </h3>
              <p className="text-xs text-emerald-100/80 max-w-md">
                Adds a standalone icon to your Chromebook Shelf, Windows Start/Taskbar, or Mac Dock.
              </p>
            </div>

            <button
              id="btn-trigger-native-install"
              type="button"
              onClick={handleNativePWAInstall}
              disabled={isInstalling}
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-white hover:bg-emerald-50 text-[#2D5A27] font-bold text-xs shadow-md hover:scale-105 transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#2D5A27]" />
              <span>{isInstalling ? 'Installing...' : '1-Click Direct Install'}</span>
            </button>
          </div>

          {/* Operating System Selector Tabs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#2D5A27]/70 dark:text-emerald-400/80">
                Select Your Computer Platform:
              </label>
              {detectedOS !== 'other' && (
                <span className="text-[11px] text-[#2D5A27] dark:text-emerald-300 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Detected: <span className="capitalize">{detectedOS}</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 p-1.5 rounded-2xl bg-[#E8F0E8] dark:bg-[#1A2E1A] border border-[#2D5A27]/15">
              {/* Chromebook Tab */}
              <button
                id="tab-os-chromebook"
                type="button"
                onClick={() => setSelectedOS('chromebook')}
                className={`py-3 px-3 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-2 ${
                  selectedOS === 'chromebook'
                    ? 'bg-white dark:bg-[#2D5A27] text-[#2D5A27] dark:text-white shadow-sm ring-1 ring-[#2D5A27]/20'
                    : 'text-[#2D5A27]/70 dark:text-emerald-300/70 hover:text-[#1A2E1A] dark:hover:text-white'
                }`}
              >
                <Laptop className="w-4 h-4 text-amber-500" />
                <span>Chromebook (ChromeOS)</span>
              </button>

              {/* Windows Tab */}
              <button
                id="tab-os-windows"
                type="button"
                onClick={() => setSelectedOS('windows')}
                className={`py-3 px-3 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-2 ${
                  selectedOS === 'windows'
                    ? 'bg-white dark:bg-[#2D5A27] text-[#2D5A27] dark:text-white shadow-sm ring-1 ring-[#2D5A27]/20'
                    : 'text-[#2D5A27]/70 dark:text-emerald-300/70 hover:text-[#1A2E1A] dark:hover:text-white'
                }`}
              >
                <Monitor className="w-4 h-4 text-blue-500" />
                <span>Windows (10 / 11)</span>
              </button>

              {/* Mac Tab */}
              <button
                id="tab-os-mac"
                type="button"
                onClick={() => setSelectedOS('mac')}
                className={`py-3 px-3 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-2 ${
                  selectedOS === 'mac'
                    ? 'bg-white dark:bg-[#2D5A27] text-[#2D5A27] dark:text-white shadow-sm ring-1 ring-[#2D5A27]/20'
                    : 'text-[#2D5A27]/70 dark:text-emerald-300/70 hover:text-[#1A2E1A] dark:hover:text-white'
                }`}
              >
                <Apple className="w-4 h-4 text-slate-700 dark:text-slate-200" />
                <span>Apple Mac (macOS)</span>
              </button>
            </div>
          </div>

          {/* OS-Specific Guided Instructions & Download Cards */}
          {selectedOS === 'chromebook' && (
            <div className="p-5 rounded-3xl bg-white dark:bg-[#1A2E1A] border border-[#2D5A27]/20 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Laptop className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1A2E1A] dark:text-white">
                    Installing on Chromebook (ChromeOS)
                  </h4>
                  <p className="text-xs text-[#2D5A27]/70 dark:text-emerald-400/80">
                    Perfect for student classrooms, school-managed Chromebooks, and lab carts.
                  </p>
                </div>
              </div>

              {/* Step by step guide */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-[#F4F7F5] dark:bg-[#223D23] border border-[#2D5A27]/15 space-y-1.5">
                  <span className="font-bold text-[#2D5A27] dark:text-emerald-300">Step 1: Look at URL Bar</span>
                  <p className="text-gray-600 dark:text-gray-300 text-[11px] leading-relaxed">
                    Look at the right side of the Chrome address bar. Click the <strong>Install icon (⊞ / ⬇)</strong>.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#F4F7F5] dark:bg-[#223D23] border border-[#2D5A27]/15 space-y-1.5">
                  <span className="font-bold text-[#2D5A27] dark:text-emerald-300">Step 2: Or 3-Dots Menu</span>
                  <p className="text-gray-600 dark:text-gray-300 text-[11px] leading-relaxed">
                    Click Chrome's <strong>⋮ (3 dots)</strong> &rarr; <strong>"Save and share"</strong> &rarr; <strong>"Install BioAR Board"</strong>.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#F4F7F5] dark:bg-[#223D23] border border-[#2D5A27]/15 space-y-1.5">
                  <span className="font-bold text-[#2D5A27] dark:text-emerald-300">Step 3: Pin to Shelf</span>
                  <p className="text-gray-600 dark:text-gray-300 text-[11px] leading-relaxed">
                    Right-click the BioAR Board icon on your bottom Shelf and select <strong>"Pin"</strong> for 1-click student launching.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  id="btn-download-chromebook-desktop-entry"
                  type="button"
                  onClick={handleDownloadChromebookLauncher}
                  className="flex-1 py-2.5 px-4 rounded-2xl bg-[#E8F0E8] dark:bg-[#223D23] hover:bg-[#d8e6d8] dark:hover:bg-[#2c4e2e] text-[#1A2E1A] dark:text-emerald-100 text-xs font-bold transition flex items-center justify-center gap-2 border border-[#2D5A27]/20"
                >
                  <FileDown className="w-4 h-4 text-[#2D5A27] dark:text-emerald-400" />
                  <span>Download .desktop Launcher File</span>
                </button>
              </div>
            </div>
          )}

          {selectedOS === 'windows' && (
            <div className="p-5 rounded-3xl bg-white dark:bg-[#1A2E1A] border border-[#2D5A27]/20 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1A2E1A] dark:text-white">
                    Installing on Windows (10 & 11)
                  </h4>
                  <p className="text-xs text-[#2D5A27]/70 dark:text-emerald-400/80">
                    Runs borderless as a native Windows desktop application with Start Menu & Taskbar pinning.
                  </p>
                </div>
              </div>

              {/* Step by step guide */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-[#F4F7F5] dark:bg-[#223D23] border border-[#2D5A27]/15 space-y-1.5">
                  <span className="font-bold text-[#2D5A27] dark:text-emerald-300">Method A: Edge / Chrome</span>
                  <p className="text-gray-600 dark:text-gray-300 text-[11px] leading-relaxed">
                    Click the <strong>App Available (⊞)</strong> icon in Microsoft Edge or Chrome address bar and click <strong>Install</strong>.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#F4F7F5] dark:bg-[#223D23] border border-[#2D5A27]/15 space-y-1.5">
                  <span className="font-bold text-[#2D5A27] dark:text-emerald-300">Method B: App Launcher</span>
                  <p className="text-gray-600 dark:text-gray-300 text-[11px] leading-relaxed">
                    Download our standalone <strong>.bat Launcher</strong> below to open BioAR in windowed desktop mode.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#F4F7F5] dark:bg-[#223D23] border border-[#2D5A27]/15 space-y-1.5">
                  <span className="font-bold text-[#2D5A27] dark:text-emerald-300">Method C: Desktop Shortcut</span>
                  <p className="text-gray-600 dark:text-gray-300 text-[11px] leading-relaxed">
                    Download the <strong>.url Shortcut</strong> and place it on your Windows desktop or USB drive.
                  </p>
                </div>
              </div>

              {/* Download Buttons for Windows */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  id="btn-download-windows-bat"
                  type="button"
                  onClick={handleDownloadWindowsLauncher}
                  className="py-3 px-4 rounded-2xl bg-[#2D5A27] hover:bg-[#23461e] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <FileDown className="w-4 h-4 text-emerald-300" />
                  <span>Download Windows App Launcher (.bat)</span>
                </button>

                <button
                  id="btn-download-windows-url"
                  type="button"
                  onClick={handleDownloadWindowsShortcut}
                  className="py-3 px-4 rounded-2xl bg-[#E8F0E8] dark:bg-[#223D23] hover:bg-[#d8e6d8] dark:hover:bg-[#2c4e2e] text-[#1A2E1A] dark:text-emerald-100 text-xs font-bold transition flex items-center justify-center gap-2 border border-[#2D5A27]/20"
                >
                  <Download className="w-4 h-4 text-[#2D5A27] dark:text-emerald-400" />
                  <span>Download Desktop Shortcut (.url)</span>
                </button>
              </div>
            </div>
          )}

          {selectedOS === 'mac' && (
            <div className="p-5 rounded-3xl bg-white dark:bg-[#1A2E1A] border border-[#2D5A27]/20 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-500/15 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
                  <Apple className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#1A2E1A] dark:text-white">
                    Installing on Apple Mac (macOS)
                  </h4>
                  <p className="text-xs text-[#2D5A27]/70 dark:text-emerald-400/80">
                    Add to Dock, Applications folder, Launchpad, and Spotlight for macOS Sonoma, Ventura, Monterey.
                  </p>
                </div>
              </div>

              {/* Step by step guide */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-[#F4F7F5] dark:bg-[#223D23] border border-[#2D5A27]/15 space-y-1.5">
                  <span className="font-bold text-[#2D5A27] dark:text-emerald-300">Safari: Add to Dock</span>
                  <p className="text-gray-600 dark:text-gray-300 text-[11px] leading-relaxed">
                    In Safari menu bar, click <strong>File</strong> &rarr; <strong>"Add to Dock..."</strong> to create a native macOS application.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#F4F7F5] dark:bg-[#223D23] border border-[#2D5A27]/15 space-y-1.5">
                  <span className="font-bold text-[#2D5A27] dark:text-emerald-300">Chrome: Install App</span>
                  <p className="text-gray-600 dark:text-gray-300 text-[11px] leading-relaxed">
                    Click the <strong>Install icon (⊞)</strong> in the top URL bar or click <strong>Chrome Menu &rarr; "Save and share" &rarr; "Install"</strong>.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#F4F7F5] dark:bg-[#223D23] border border-[#2D5A27]/15 space-y-1.5">
                  <span className="font-bold text-[#2D5A27] dark:text-emerald-300">Direct Mac Launcher</span>
                  <p className="text-gray-600 dark:text-gray-300 text-[11px] leading-relaxed">
                    Download the <strong>.webloc</strong> or <strong>.command</strong> launcher below and drop it onto your Desktop or Dock.
                  </p>
                </div>
              </div>

              {/* Download Buttons for Mac */}
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  id="btn-download-mac-webloc"
                  type="button"
                  onClick={handleDownloadMacShortcut}
                  className="py-3 px-4 rounded-2xl bg-[#2D5A27] hover:bg-[#23461e] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <Download className="w-4 h-4 text-emerald-300" />
                  <span>Download Mac WebLoc File (.webloc)</span>
                </button>

                <button
                  id="btn-download-mac-command"
                  type="button"
                  onClick={handleDownloadMacLauncher}
                  className="py-3 px-4 rounded-2xl bg-[#E8F0E8] dark:bg-[#223D23] hover:bg-[#d8e6d8] dark:hover:bg-[#2c4e2e] text-[#1A2E1A] dark:text-emerald-100 text-xs font-bold transition flex items-center justify-center gap-2 border border-[#2D5A27]/20"
                >
                  <FileDown className="w-4 h-4 text-[#2D5A27] dark:text-emerald-400" />
                  <span>Download Mac Command Script (.command)</span>
                </button>
              </div>
            </div>
          )}

          {/* Key Advantages Bento Section */}
          <div className="p-4 rounded-3xl bg-[#E8F0E8]/60 dark:bg-[#1A2E1A]/60 border border-[#2D5A27]/15 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#2D5A27] dark:text-emerald-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              Why Install on Desktop?
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-white dark:bg-[#223D23] border border-[#2D5A27]/10 flex items-start gap-2.5">
                <Camera className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#1A2E1A] dark:text-white">Full Camera Access</div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-300">Direct hardware webcam stream with zero latency for poster AR recognition.</div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-[#223D23] border border-[#2D5A27]/10 flex items-start gap-2.5">
                <Maximize2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#1A2E1A] dark:text-white">Clean Window Mode</div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-300">No browser tabs or URL bars — perfect for student focus and school presentations.</div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-white dark:bg-[#223D23] border border-[#2D5A27]/10 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-[#1A2E1A] dark:text-white">Offline Ready</div>
                  <div className="text-[11px] text-gray-500 dark:text-gray-300">Service Worker caches core 3D models and posters for smooth school lab sessions.</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#2D5A27]/15 bg-white dark:bg-[#1A2E1A] flex items-center justify-between">
          <span className="text-[11px] text-gray-500 dark:text-gray-400">
            Works across Google Chrome, Microsoft Edge, Safari, and Brave
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-2xl bg-[#2D5A27] hover:bg-[#23461e] text-white text-xs font-bold transition shadow-sm"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
