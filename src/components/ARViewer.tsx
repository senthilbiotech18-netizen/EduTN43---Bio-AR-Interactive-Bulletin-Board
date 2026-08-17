import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Camera, 
  RefreshCw, 
  Sparkles, 
  Play, 
  Info, 
  Layers, 
  SwitchCamera, 
  Zap, 
  ZapOff, 
  Maximize2, 
  HelpCircle, 
  CheckCircle2, 
  Scan, 
  AlertCircle, 
  Compass,
  ArrowRight,
  Eye,
  Sliders
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Project, MarkerMatchResult } from '../types';
import { matchFrameAgainstProjects } from '../utils/visionTracker';
import { Model3DViewer } from './Model3DViewer';
import { VideoPlayerModal } from './VideoPlayerModal';
import { StudentInfoModal } from './StudentInfoModal';
import { StudentPipOverlay } from './StudentPipOverlay';

interface ARViewerProps {
  projects: Project[];
  onOpenGallery: () => void;
  onOpenTeacherDashboard: () => void;
}

export const ARViewer: React.FC<ARViewerProps> = ({
  projects,
  onOpenGallery,
  onOpenTeacherDashboard,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const arOverlayRef = useRef<HTMLDivElement>(null);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  // Scanning & Tracking State
  const [isScanning, setIsScanning] = useState(true);
  const [matchResult, setMatchResult] = useState<MarkerMatchResult | null>(null);
  const [lockConfidence, setLockConfidence] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [scanFps, setScanFps] = useState(60);

  // Modals
  const [activeModal, setActiveTabModal] = useState<'none' | 'video' | '3d_fullscreen' | 'student_info'>('none');
  const [showAR3DOverlay, setShowAR3DOverlay] = useState(true);
  const [hologramPosition, setHologramPosition] = useState<'top-right' | 'bottom-right' | 'top-left' | 'center'>('top-right');
  const [simulatedPosterIndex, setSimulatedPosterIndex] = useState<number | null>(null);

  const scanIntervalRef = useRef<number | null>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);
  const consecutiveMatchesRef = useRef<{ id: string; count: number }>({ id: '', count: 0 });

  const getHologramPositionClasses = (pos: 'top-right' | 'bottom-right' | 'top-left' | 'center') => {
    switch (pos) {
      case 'top-right':
        return 'top-4 right-4 sm:top-5 sm:right-5';
      case 'bottom-right':
        return 'bottom-16 right-4 sm:bottom-16 sm:right-5';
      case 'top-left':
        return 'top-4 left-4 sm:top-5 sm:left-5';
      case 'center':
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
      default:
        return 'top-4 right-4 sm:top-5 sm:right-5';
    }
  };

  // 1. Initialize Camera
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setHasCameraPermission(true);

        const track = stream.getVideoTracks()[0];
        videoTrackRef.current = track;

        // Check torch capabilities
        const capabilities = track.getCapabilities?.() as any;
        if (capabilities?.torch) {
          setHasTorch(true);
        }
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setHasCameraPermission(false);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please allow camera access in browser settings to scan biology posters.'
          : 'Could not initialize camera stream. You can test using the Sample Posters simulator below!'
      );
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (videoTrackRef.current) {
        videoTrackRef.current.stop();
      }
    };
  }, [startCamera]);

  // Toggle Torch/Flashlight
  const toggleTorch = async () => {
    if (!videoTrackRef.current) return;
    try {
      const newTorch = !isTorchOn;
      await (videoTrackRef.current as any).applyConstraints({
        advanced: [{ torch: newTorch }],
      });
      setIsTorchOn(newTorch);
    } catch (e) {
      console.warn('Could not toggle torch:', e);
    }
  };

  // Switch between front and rear cameras
  const toggleCameraFacing = () => {
    setFacingMode(prev => (prev === 'environment' ? 'user' : 'environment'));
  };

  // 2. Real-time Frame Recognition Loop
  useEffect(() => {
    if (!isScanning || projects.length === 0) return;

    let isProcessing = false;
    let lastFrameTime = performance.now();
    let frameCounter = 0;

    const processingCanvas = document.createElement('canvas');

    const scanTick = async () => {
      if (!isProcessing && videoRef.current && videoRef.current.readyState >= 2) {
        isProcessing = true;
        const now = performance.now();

        // Calculate FPS
        frameCounter++;
        if (now - lastFrameTime >= 1000) {
          setScanFps(Math.round((frameCounter * 1000) / (now - lastFrameTime)));
          frameCounter = 0;
          lastFrameTime = now;
        }

        try {
          const match = await matchFrameAgainstProjects(
            videoRef.current,
            projects,
            processingCanvas,
            0.76 // strict minimum confidence threshold for accurate poster recognition
          );

          if (match) {
            if (consecutiveMatchesRef.current.id === match.projectId) {
              consecutiveMatchesRef.current.count++;
            } else {
              consecutiveMatchesRef.current = { id: match.projectId, count: 1 };
            }

            // Lock onto marker after 5 stable consecutive frames (strictly matches authentic student poster)
            if (consecutiveMatchesRef.current.count >= 5) {
              setMatchResult(match);
              setLockConfidence(Math.round(match.confidence * 100));

              if (!isLocked) {
                setIsLocked(true);
                // Celebratory visual micro-confetti on first lock!
                confetti({
                  particleCount: 25,
                  spread: 60,
                  origin: { y: 0.8 },
                  colors: ['#10b981', '#06b6d4', '#facc15'],
                  disableForReducedMotion: true,
                });
              }
            }
          } else {
            // Gradual unlock hysteresis
            if (consecutiveMatchesRef.current.count > 0) {
              consecutiveMatchesRef.current.count--;
            }
            if (consecutiveMatchesRef.current.count === 0 && isLocked) {
              // Wait a bit before releasing lock so it doesn't flicker on quick camera movements
              setTimeout(() => {
                if (consecutiveMatchesRef.current.count === 0) {
                  // Keep matchResult in memory so user can still interact with card, but indicate scanning
                }
              }, 1200);
            }
          }
        } catch (err) {
          console.warn('Frame processing note:', err);
        } finally {
          isProcessing = false;
        }
      }
    };

    // Run recognition at ~25-30 fps to keep device cool and UI silky 60fps
    const interval = window.setInterval(scanTick, 35);
    scanIntervalRef.current = interval;

    return () => {
      clearInterval(interval);
    };
  }, [isScanning, projects, isLocked]);

  // Handle Manual Lock on a simulated poster (for testing without second screen)
  const handleSelectSimulatedPoster = (proj: Project) => {
    setMatchResult({
      projectId: proj.id,
      project: proj,
      confidence: 0.98,
      boundingBox: { x: 0.15, y: 0.15, width: 0.7, height: 0.7 },
      center: { x: 0.5, y: 0.5 },
    });
    setIsLocked(true);
    setLockConfidence(98);
    confetti({
      particleCount: 30,
      spread: 70,
      origin: { y: 0.8 },
      colors: ['#10b981', '#38bdf8', '#fbbf24'],
    });
  };

  const handleUnlockAndRescan = () => {
    setIsLocked(false);
    setMatchResult(null);
    setLockConfidence(0);
    consecutiveMatchesRef.current = { id: '', count: 0 };
  };

  const activeProject = matchResult?.project;

  return (
    <div className="relative w-full flex-1 flex flex-col bg-[#F4F7F5] dark:bg-[#0E1B10] text-[#1A2E1A] dark:text-slate-100 select-none p-3 sm:p-5 lg:p-6">
      <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col gap-4 sm:gap-5">
        
        {/* 1. Top Bento Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-[#1A2E1A] border border-[#2D5A27]/15 dark:border-[#2D5A27]/30 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F0E8] dark:bg-[#223D23] flex items-center justify-center text-[#2D5A27] dark:text-emerald-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2D5A27] dark:text-emerald-400">
                  AR Vision Feed
                </span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-[#E8F0E8] dark:bg-[#223D23] text-[#2D5A27] dark:text-emerald-300">
                  {scanFps} FPS
                </span>
              </div>
              <p className="text-xs text-[#2D5A27]/70 dark:text-emerald-300/70 font-medium">
                {isLocked && activeProject 
                  ? `Locked: ${activeProject.title} (${lockConfidence}%)`
                  : 'Point camera at student hand-drawn biology poster'
                }
              </p>
            </div>
          </div>

          {/* Quick Toolbar Controls */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Quick Poster Picker */}
            <button
              id="btn-quick-poster-picker"
              type="button"
              onClick={onOpenGallery}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#E8F0E8] dark:bg-[#223D23] hover:bg-[#d8e6d8] text-[#1A2E1A] dark:text-emerald-200 text-xs font-bold border border-[#2D5A27]/20 transition"
              title="Poster Marker Test Bench"
            >
              <Eye className="w-3.5 h-3.5 text-[#2D5A27] dark:text-emerald-400" />
              <span>Posters ({projects.length})</span>
            </button>

            {/* Torch/Flash toggle */}
            {hasTorch && (
              <button
                id="btn-toggle-torch"
                type="button"
                onClick={toggleTorch}
                className={`p-2 rounded-2xl border transition shadow-xs ${
                  isTorchOn
                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                    : 'bg-white dark:bg-[#223D23] text-[#2D5A27] dark:text-emerald-300 border-[#2D5A27]/15'
                }`}
                title="Toggle Flashlight"
              >
                {isTorchOn ? <Zap className="w-4 h-4 fill-current" /> : <ZapOff className="w-4 h-4" />}
              </button>
            )}

            {/* Camera Flip */}
            <button
              id="btn-flip-camera"
              type="button"
              onClick={toggleCameraFacing}
              className="p-2 rounded-2xl bg-white dark:bg-[#223D23] hover:bg-[#E8F0E8] text-[#2D5A27] dark:text-emerald-300 border border-[#2D5A27]/15 dark:border-[#2D5A27]/30 shadow-xs transition"
              title="Flip Camera (Front/Back)"
            >
              <SwitchCamera className="w-4 h-4" />
            </button>

            {/* 3D AR Hologram Toggle & Position Selector */}
            {isLocked && (
              <div className="flex items-center gap-1 bg-[#E8F0E8] dark:bg-[#223D23] p-1 rounded-2xl border border-[#2D5A27]/20">
                <button
                  id="btn-toggle-3d-overlay"
                  type="button"
                  onClick={() => setShowAR3DOverlay(!showAR3DOverlay)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    showAR3DOverlay
                      ? 'bg-[#2D5A27] text-white shadow-xs'
                      : 'text-[#2D5A27] dark:text-emerald-300 hover:bg-white/50'
                  }`}
                  title={showAR3DOverlay ? 'Hide 3D Hologram Overlay' : 'Show 3D Hologram Overlay'}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{showAR3DOverlay ? '3D Active' : '3D Hidden'}</span>
                </button>

                {showAR3DOverlay && (
                  <div className="flex items-center gap-0.5 border-l border-[#2D5A27]/20 pl-1">
                    <button
                      type="button"
                      onClick={() => setHologramPosition('top-right')}
                      className={`px-1.5 py-1 rounded-lg text-[10px] font-bold ${
                        hologramPosition === 'top-right'
                          ? 'bg-[#2D5A27] text-white'
                          : 'text-[#2D5A27] dark:text-emerald-300 hover:bg-white/50'
                      }`}
                      title="Dock Top-Right"
                    >
                      ↗ Top
                    </button>
                    <button
                      type="button"
                      onClick={() => setHologramPosition('bottom-right')}
                      className={`px-1.5 py-1 rounded-lg text-[10px] font-bold ${
                        hologramPosition === 'bottom-right'
                          ? 'bg-[#2D5A27] text-white'
                          : 'text-[#2D5A27] dark:text-emerald-300 hover:bg-white/50'
                      }`}
                      title="Dock Bottom-Right"
                    >
                      ↘ Bottom
                    </button>
                    <button
                      type="button"
                      onClick={() => setHologramPosition('center')}
                      className={`px-1.5 py-1 rounded-lg text-[10px] font-bold ${
                        hologramPosition === 'center'
                          ? 'bg-[#2D5A27] text-white'
                          : 'text-[#2D5A27] dark:text-emerald-300 hover:bg-white/50'
                      }`}
                      title="Center View"
                    >
                      ⊙ Center
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Rescan Button */}
            {isLocked && (
              <button
                id="btn-ar-rescan"
                type="button"
                onClick={handleUnlockAndRescan}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#E8F0E8] dark:bg-[#223D23] hover:bg-[#d8e6d8] text-[#2D5A27] dark:text-emerald-300 text-xs font-bold border border-[#2D5A27]/20 transition"
                title="Scan next poster"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Rescan</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Main Bento Grid Body: Large Viewfinder (left) + Side Info Cards (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 flex-1 items-stretch">
          
          {/* Main Viewfinder Bento Tile (col-span-8) */}
          <div className="lg:col-span-8 bg-[#1A2E1A] rounded-3xl overflow-hidden relative shadow-md border border-[#2D5A27]/30 flex flex-col min-h-[420px] sm:min-h-[500px]">
            {/* Live Camera Video Feed */}
            <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                muted
                autoPlay
              />

              {/* Camera Permission Warning / Fallback Banner */}
              {hasCameraPermission === false && (
                <div className="relative z-20 max-w-md mx-4 p-6 rounded-3xl bg-white/95 dark:bg-[#1A2E1A]/95 backdrop-blur-xl border border-[#2D5A27]/20 shadow-2xl text-center">
                  <div className="w-12 h-12 rounded-2xl bg-[#E8F0E8] text-[#2D5A27] mx-auto flex items-center justify-center mb-3">
                    <Camera className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-[#1A2E1A] dark:text-white mb-1.5">
                    Live AR Camera Ready
                  </h3>
                  <p className="text-xs text-[#2D5A27]/80 dark:text-emerald-300/80 mb-4 leading-relaxed">
                    {cameraError || 'Allow camera access to automatically scan and recognize student posters.'}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <button
                      id="btn-retry-camera"
                      onClick={startCamera}
                      className="px-4 py-2.5 rounded-xl bg-[#2D5A27] hover:bg-[#23461e] text-white text-xs font-semibold shadow-md transition flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Retry Camera
                    </button>
                    <button
                      id="btn-open-poster-simulator"
                      onClick={onOpenGallery}
                      className="px-4 py-2.5 rounded-xl bg-[#E8F0E8] text-[#2D5A27] text-xs font-semibold transition flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Browse Biology Posters
                    </button>
                  </div>
                </div>
              )}

              {/* AR Scanning Reticle HUD Overlay */}
              {!isLocked && hasCameraPermission !== false && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10 p-6">
                  {/* Reticle Box with Bento Rounded Brackets */}
                  <div className="relative w-64 h-72 sm:w-80 sm:h-92 rounded-3xl border-2 border-emerald-400/40 flex items-center justify-center shadow-[0_0_30px_rgba(45,90,39,0.3)]">
                    <div className="absolute -top-1 -left-1 w-7 h-7 border-t-4 border-l-4 border-emerald-400 rounded-tl-2xl" />
                    <div className="absolute -top-1 -right-1 w-7 h-7 border-t-4 border-r-4 border-emerald-400 rounded-tr-2xl" />
                    <div className="absolute -bottom-1 -left-1 w-7 h-7 border-b-4 border-l-4 border-emerald-400 rounded-bl-2xl" />
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 border-b-4 border-r-4 border-emerald-400 rounded-br-2xl" />

                    {/* Scanning Laser Beam */}
                    <div 
                      className="absolute left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-pulse" 
                      style={{ top: '45%' }}
                    />

                    {/* Crosshair */}
                    <div className="w-3 h-3 rounded-full border border-emerald-400/90" />
                  </div>

                  {/* Instruction Pill */}
                  <div className="mt-5 px-4 py-2 rounded-2xl bg-[#1A2E1A]/80 backdrop-blur-md border border-[#2D5A27]/40 text-emerald-100 text-xs font-semibold flex items-center gap-2 shadow-lg">
                    <Scan className="w-4 h-4 text-emerald-400" />
                    <span>Point camera at any student biology poster</span>
                  </div>
                </div>
              )}

              {/* Anchored 3D Hologram Overlay (Rendered cleanly docked in chosen corner, NOT blocking center) */}
              {isLocked && activeProject && showAR3DOverlay && activeModal === 'none' && (
                <div 
                  ref={arOverlayRef}
                  className={`absolute z-15 w-52 h-52 sm:w-64 sm:h-64 pointer-events-auto transition-all duration-300 ${getHologramPositionClasses(hologramPosition)}`}
                >
                  <div className="w-full h-full relative rounded-3xl overflow-hidden shadow-[0_15px_35px_rgba(0,0,0,0.5)] border border-emerald-500/40 bg-[#1A2E1A]/30 backdrop-blur-md">
                    <Model3DViewer
                      project={activeProject}
                      isEmbedded={true}
                      onClose={() => setShowAR3DOverlay(false)}
                      className="w-full h-full"
                    />
                  </div>
                </div>
              )}

              {/* Student Recorded Video Presentation (Picture-in-Picture in viewfinder) */}
              {isLocked && activeProject && activeModal === 'none' && (activeProject.studentVideoUrl || activeProject.videoUrl) && (
                <StudentPipOverlay
                  studentVideoUrl={activeProject.studentVideoUrl || activeProject.videoUrl}
                  studentName={activeProject.studentName}
                  studentAvatar={activeProject.studentAvatar}
                  defaultPosition={activeProject.pipPosition || 'bottom-left'}
                  className="z-25"
                />
              )}
            </div>

            {/* Viewfinder Bottom Status Pill Bar */}
            <div className="px-4 py-3 bg-[#132416]/90 border-t border-[#2D5A27]/30 flex items-center justify-between gap-3 text-xs text-emerald-200">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isLocked ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                <span className="font-semibold">
                  {isLocked ? `Matched: ${activeProject?.studentName}'s Poster` : 'Waiting for poster marker...'}
                </span>
              </div>

              {isLocked && (
                <span className="px-2 py-0.5 rounded-md bg-[#2D5A27] text-white text-[11px] font-bold">
                  {lockConfidence}% Confidence
                </span>
              )}
            </div>
          </div>

          {/* Right Side Bento Column (col-span-4) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            {/* Bento Tile 1: Student Project Card */}
            {activeProject ? (
              <div className="p-5 rounded-3xl bg-white dark:bg-[#1A2E1A] border border-[#2D5A27]/15 dark:border-[#2D5A27]/30 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E8F0E8] dark:bg-[#223D23] text-[#2D5A27] dark:text-emerald-300 flex items-center gap-1 border border-[#2D5A27]/15">
                      <CheckCircle2 className="w-3 h-3 text-[#2D5A27] dark:text-emerald-400" />
                      Poster Recognized
                    </span>
                    <span className="text-[11px] font-semibold text-[#2D5A27]/70 dark:text-emerald-300/70">
                      {activeProject.grade}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    {activeProject.studentAvatar ? (
                      <img
                        src={activeProject.studentAvatar}
                        alt={activeProject.studentName}
                        className="w-12 h-12 rounded-2xl object-cover border-2 border-[#2D5A27] shadow-sm"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-[#2D5A27] text-white flex items-center justify-center font-bold text-base shadow-sm">
                        {activeProject.studentName.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-[#1A2E1A] dark:text-white text-base tracking-tight truncate">
                        {activeProject.studentName}
                      </h3>
                      <p className="text-xs text-[#2D5A27] dark:text-emerald-400 font-semibold truncate">
                        {activeProject.title}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-[#1A2E1A]/80 dark:text-emerald-100/80 line-clamp-3 leading-relaxed bg-[#F4F7F5] dark:bg-[#132416] p-3 rounded-2xl border border-[#2D5A27]/10">
                    {activeProject.description}
                  </p>
                </div>

                {/* Primary Student Actions */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    id="btn-ar-play-video"
                    type="button"
                    onClick={() => setActiveTabModal('video')}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-[#2D5A27] hover:bg-[#23461e] active:scale-98 text-white font-bold text-xs shadow-md shadow-[#2D5A27]/20 transition"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Watch Video</span>
                  </button>

                  <button
                    id="btn-ar-student-info"
                    type="button"
                    onClick={() => setActiveTabModal('student_info')}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-2xl bg-[#E8F0E8] dark:bg-[#223D23] hover:bg-[#d8e6d8] text-[#1A2E1A] dark:text-emerald-100 font-bold text-xs border border-[#2D5A27]/20 transition"
                  >
                    <Info className="w-4 h-4 text-[#2D5A27] dark:text-emerald-400" />
                    <span>Profile</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Scanning Guide Bento Card */
              <div className="p-5 rounded-3xl bg-white dark:bg-[#1A2E1A] border border-[#2D5A27]/15 dark:border-[#2D5A27]/30 shadow-xs flex flex-col justify-between space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#E8F0E8] dark:bg-[#223D23] flex items-center justify-center text-[#2D5A27] dark:text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm font-bold text-[#1A2E1A] dark:text-white">
                    AR Image Recognition
                  </h4>
                </div>

                <p className="text-xs text-[#2D5A27]/80 dark:text-emerald-300/80 leading-relaxed">
                  Hold your camera steady in front of any hand-drawn biology poster. The vision engine identifies the drawing lines and brings the 3D organelle and student video to life.
                </p>

                <div className="p-3 rounded-2xl bg-[#F4F7F5] dark:bg-[#132416] border border-[#2D5A27]/10 text-[11px] text-[#2D5A27] dark:text-emerald-300">
                  💡 No QR code needed — the drawing itself is the marker!
                </div>
              </div>
            )}

            {/* Bento Tile 2: 3D Hologram Organelle Preview Tile */}
            <div className="flex-1 p-5 rounded-3xl bg-[#1A2E1A] text-white border border-[#2D5A27]/30 shadow-xs flex flex-col justify-between space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                    3D Biological Organelle
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#223D23] text-emerald-300 border border-[#2D5A27]/40">
                  {activeProject ? activeProject.modelType.replace('preset_', '').replace('_', ' ') : 'Interactive'}
                </span>
              </div>

              {/* Organelle description or 3D call-to-action */}
              <div className="py-2">
                <p className="text-xs text-emerald-100/90 leading-relaxed">
                  {activeProject 
                    ? `Interactive 3D model: Explore structures, rotate 360°, dissect internal layers, and inspect scientific annotations.`
                    : 'Select any sample poster below or aim your camera to render biological 3D cell structures in high fidelity.'
                  }
                </p>
              </div>

              <button
                id="btn-ar-view-3d"
                type="button"
                onClick={() => {
                  if (activeProject) {
                    setActiveTabModal('3d_fullscreen');
                  } else if (projects.length > 0) {
                    handleSelectSimulatedPoster(projects[0]);
                    setActiveTabModal('3d_fullscreen');
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-white text-[#1A2E1A] hover:bg-emerald-50 active:scale-98 font-bold text-xs shadow-md transition"
              >
                <Maximize2 className="w-4 h-4 text-[#2D5A27]" />
                <span>Launch Full 3D Inspector</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Bottom Bento Rail: Sample Poster Quick-Test Bar */}
        <div className="p-3.5 sm:p-4 rounded-3xl bg-white dark:bg-[#1A2E1A] border border-[#2D5A27]/15 dark:border-[#2D5A27]/30 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-xl bg-[#E8F0E8] dark:bg-[#223D23] flex items-center justify-center text-[#2D5A27] dark:text-emerald-400">
              <Eye className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#1A2E1A] dark:text-white block leading-none">
                Exhibition Posters
              </span>
              <span className="text-[10px] text-[#2D5A27]/70 dark:text-emerald-400/80">
                Click any poster to simulate instant AR scan
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto py-1">
            {projects.map((p) => {
              const isCurrent = activeProject?.id === p.id && isLocked;
              return (
                <button
                  key={p.id}
                  id={`btn-sim-test-${p.id}`}
                  type="button"
                  onClick={() => handleSelectSimulatedPoster(p)}
                  className={`px-3 py-1.5 rounded-2xl text-xs font-bold whitespace-nowrap transition flex items-center gap-2 border ${
                    isCurrent
                      ? 'bg-[#2D5A27] text-white border-[#2D5A27] shadow-sm'
                      : 'bg-[#F4F7F5] dark:bg-[#223D23] hover:bg-[#E8F0E8] text-[#1A2E1A] dark:text-emerald-100 border-[#2D5A27]/15'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-emerald-300' : 'bg-[#2D5A27]'}`} />
                  <span>{p.studentName.split(' ')[0]}</span>
                  <span className="text-[10px] opacity-75 font-normal">({p.modelType.replace('preset_', '')})</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* MODALS */}
      {/* 1. Video Player Modal */}
      {activeModal === 'video' && activeProject && (
        <VideoPlayerModal
          project={activeProject}
          onClose={() => setActiveTabModal('none')}
          onOpen3D={() => setActiveTabModal('3d_fullscreen')}
        />
      )}

      {/* 2. 3D Model Fullscreen Modal */}
      {activeModal === '3d_fullscreen' && activeProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#0E1B10]/80 backdrop-blur-xl animate-in fade-in duration-200">
          <div className="relative w-full max-w-5xl h-[88vh] bg-white dark:bg-[#1A2E1A] rounded-3xl overflow-hidden shadow-2xl border border-[#2D5A27]/30">
            <Model3DViewer
              project={activeProject}
              onClose={() => setActiveTabModal('none')}
              isEmbedded={false}
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* 3. Student Info Profile Modal */}
      {activeModal === 'student_info' && activeProject && (
        <StudentInfoModal
          project={activeProject}
          onClose={() => setActiveTabModal('none')}
          onOpenVideo={() => setActiveTabModal('video')}
          onOpen3D={() => setActiveTabModal('3d_fullscreen')}
        />
      )}
    </div>
  );
};
