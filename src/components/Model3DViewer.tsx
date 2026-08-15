import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { 
  Rotate3d, 
  ZoomIn, 
  ZoomOut, 
  Layers, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  Info, 
  RefreshCw, 
  X, 
  Eye,
  Sliders,
  CheckCircle2,
  Box,
  Mic,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RotateCcw,
  Film
} from 'lucide-react';
import { Project, ModelAnnotation } from '../types';
import { loadBiologyModel, BiologyModelResult } from './biology3DModels';
import { audioNarrationManager, AudioPlaybackState } from '../utils/audioNarrationService';
import { isYouTubeUrl, getYouTubeEmbedUrl } from '../utils/mediaUtils';

interface Model3DViewerProps {
  project: Project;
  onClose?: () => void;
  onOpenVideo?: () => void;
  isEmbedded?: boolean; // When rendered inline in AR overlay or in full modal
  className?: string;
  autoPlayNarration?: boolean;
}

export const Model3DViewer: React.FC<Model3DViewerProps> = ({
  project,
  onClose,
  onOpenVideo,
  isEmbedded = false,
  className = '',
  autoPlayNarration = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [selectedAnnotation, setSelectedAnnotation] = useState<ModelAnnotation | null>(null);
  const [annotations, setAnnotations] = useState<ModelAnnotation[]>([]);
  const [isWireframe, setIsWireframe] = useState(false);
  const [isAutoRotate, setIsAutoRotate] = useState(true);
  const [explodeFactor, setExplodeFactor] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [viewTheme, setViewTheme] = useState<'light' | 'dark'>('light');
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Audio Narration State
  const [audioState, setAudioState] = useState<AudioPlaybackState>({
    isPlaying: false,
    isPaused: false,
    currentTime: 0,
    duration: 0,
    progress: 0,
    sourceType: 'speech_synth',
  });
  const [showTranscriptCard, setShowTranscriptCard] = useState(true);

  // References for Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const activeModelRef = useRef<BiologyModelResult | null>(null);
  const customMeshGroupRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Mouse & Touch interaction state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const touchDistanceRef = useRef<number | null>(null);
  const modelRotationRef = useRef({ x: 0.2, y: 0.3 });
  const cameraDistanceRef = useRef(4.8);

  // Listen to audio narration state updates
  useEffect(() => {
    const unsubscribe = audioNarrationManager.subscribe((state) => {
      setAudioState(state);
    });
    return () => {
      unsubscribe();
      audioNarrationManager.stop();
    };
  }, []);

  // Optional auto-play voice-over when 3D viewer mounts
  useEffect(() => {
    if (autoPlayNarration) {
      const timer = setTimeout(() => {
        handleToggleNarration();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [project.id]);

  const handleToggleNarration = () => {
    if (audioState.isPlaying) {
      audioNarrationManager.pause();
    } else if (audioState.isPaused) {
      audioNarrationManager.resume();
    } else {
      audioNarrationManager.play({
        audioUrl: project.audioNarrationUrl,
        transcript: project.audioTranscript || `Hi, I am ${project.studentName}, and I am going to explain the structure of the ${project.title}.`,
        studentName: project.studentName,
      });
      // Ensure auto-rotation is active while speaking
      if (project.autoRotateWithAudio !== false) {
        setIsAutoRotate(true);
      }
    }
  };

  const handleReplayNarration = () => {
    audioNarrationManager.stop();
    audioNarrationManager.play({
      audioUrl: project.audioNarrationUrl,
      transcript: project.audioTranscript || `Hi, I am ${project.studentName}, and I am going to explain the structure of the ${project.title}.`,
      studentName: project.studentName,
    });
    if (project.autoRotateWithAudio !== false) {
      setIsAutoRotate(true);
    }
  };

  const isYouTubeModel = isYouTubeUrl(project.modelUrl);

  useEffect(() => {
    if (isYouTubeModel) return;
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 600;
    const height = containerRef.current.clientHeight || 450;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Background color based on theme (or transparent if embedded in AR camera)
    if (isEmbedded) {
      scene.background = null;
    } else {
      scene.background = new THREE.Color(viewTheme === 'light' ? 0xF4F7F5 : 0x0E1B10);
    }

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, cameraDistanceRef.current);
    cameraRef.current = camera;

    // 3. Renderer with high DPR and antialias
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    rendererRef.current = renderer;

    // Reset annotations and selection when loading new model
    setSelectedAnnotation(null);
    setAnnotations([]);

    // 4. Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, viewTheme === 'light' ? 1.2 : 0.8);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.4);
    mainLight.position.set(5, 8, 5);
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.6);
    fillLight.position.set(-5, -2, -3);
    scene.add(fillLight);

    const topRimLight = new THREE.DirectionalLight(0x10b981, 0.8);
    topRimLight.position.set(0, 6, -4);
    scene.add(topRimLight);

    // 5. Load 3D Model: either custom GLB, 3D image hologram, or biological procedural preset
    let modelResult: BiologyModelResult | null = null;
    let customGroup: THREE.Group | null = null;

    const is3DImage = project.modelUrl && (
      project.modelUrl.startsWith('data:image/') || 
      /\.(png|jpe?g|webp|svg)(\?.*)?$/i.test(project.modelUrl)
    );

    if (project.modelType === 'custom_glb' && is3DImage && project.modelUrl) {
      setIsLoadingModel(true);
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(
        project.modelUrl,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          customGroup = new THREE.Group();
          
          // Double-sided textured hologram plane
          const planeGeo = new THREE.PlaneGeometry(2.6, 2.6);
          const planeMat = new THREE.MeshBasicMaterial({ 
            map: texture, 
            transparent: true, 
            side: THREE.DoubleSide 
          });
          const planeMesh = new THREE.Mesh(planeGeo, planeMat);
          customGroup.add(planeMesh);

          // Glowing biological glass border ring
          const ringGeo = new THREE.RingGeometry(1.35, 1.40, 64);
          const ringMat = new THREE.MeshBasicMaterial({ 
            color: 0x10b981, 
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
          });
          const ringMesh = new THREE.Mesh(ringGeo, ringMat);
          customGroup.add(ringMesh);

          customGroup.scale.setScalar(project.modelScale || 1.0);
          scene.add(customGroup);
          customMeshGroupRef.current = customGroup;
          
          // Populate annotations from project key points if available
          if (project.keyPoints && project.keyPoints.length > 0) {
            const mappedPins: ModelAnnotation[] = project.keyPoints.map((kp, idx) => {
              const parts = kp.split(':');
              const name = parts[0]?.trim() || `Organelle Feature ${idx + 1}`;
              const func = parts[1]?.trim() || 'Biological cellular role.';
              const angle = (idx / project.keyPoints.length) * Math.PI * 2;
              return {
                id: `pin_${idx}`,
                name,
                position: [Math.cos(angle) * 0.9, Math.sin(angle) * 0.9, 0.1],
                description: func,
                function: func
              };
            });
            setAnnotations(mappedPins);
          }

          setIsLoadingModel(false);
        },
        undefined,
        (err) => {
          console.warn('Error loading 3D image texture:', err);
          modelResult = loadBiologyModel('preset_plant_cell');
          scene.add(modelResult.group);
          activeModelRef.current = modelResult;
          setAnnotations(modelResult.annotations);
          setIsLoadingModel(false);
        }
      );
    } else if (project.modelType === 'custom_glb' && project.modelUrl) {
      setIsLoadingModel(true);
      const loader = new GLTFLoader();
      loader.load(
        project.modelUrl,
        (gltf) => {
          customGroup = gltf.scene;
          const box = new THREE.Box3().setFromObject(customGroup);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          const scale = (2.5 / maxDim) * (project.modelScale || 1.0);
          customGroup.scale.setScalar(scale);
          customGroup.position.sub(center.multiplyScalar(scale));
          scene.add(customGroup);
          customMeshGroupRef.current = customGroup;
          setIsLoadingModel(false);
        },
        undefined,
        (err) => {
          console.warn('Error loading custom GLB, falling back to biological preset:', err);
          setLoadError('Failed to load custom GLB file. Showing high-detail biological organelle.');
          modelResult = loadBiologyModel('preset_plant_cell');
          scene.add(modelResult.group);
          activeModelRef.current = modelResult;
          setAnnotations(modelResult.annotations);
          setIsLoadingModel(false);
        }
      );
    } else {
      modelResult = loadBiologyModel(project.modelType || 'preset_plant_cell');
      modelResult.group.scale.setScalar(project.modelScale || 1.0);
      scene.add(modelResult.group);
      activeModelRef.current = modelResult;
      setAnnotations(modelResult.annotations);
    }

    // 6. Animation Loop
    const clock = new THREE.Clock();
    let elapsed = 0;

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      elapsed += delta;

      // Rotate continuously when auto-rotate is enabled OR when voice narration is actively speaking
      const shouldSpin = (isAutoRotate || audioState.isPlaying) && !isDraggingRef.current;
      if (shouldSpin) {
        // Steady, slow rotation speed for educational observation
        const spinSpeed = audioState.isPlaying ? 0.38 : 0.30;
        modelRotationRef.current.y += delta * spinSpeed;
      }

      // Apply rotation to target group
      if (modelResult) {
        modelResult.group.rotation.x = modelRotationRef.current.x;
        modelResult.group.rotation.y = modelRotationRef.current.y;
        modelResult.update(delta, elapsed, explodeFactor);
      } else if (customGroup) {
        customGroup.rotation.x = modelRotationRef.current.x;
        customGroup.rotation.y = modelRotationRef.current.y;
      }

      // Smooth camera position
      camera.position.z = cameraDistanceRef.current;

      renderer.render(scene, camera);
    };

    animate();

    // 7. Resize Observer for fluid responsiveness
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        const newHeight = entry.contentRect.height;
        if (newWidth > 0 && newHeight > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = newWidth / newHeight;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(newWidth, newHeight);
        }
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Clean up
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();
      if (modelResult) modelResult.dispose();
      renderer.dispose();
    };
  }, [project, viewTheme, audioState.isPlaying]);

  // Wireframe toggle update
  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(m => { m.wireframe = isWireframe; });
        } else if (obj.material) {
          obj.material.wireframe = isWireframe;
        }
      }
    });
  }, [isWireframe]);

  // Touch & Mouse Handlers for smooth 3D Orbiting and Pinch Zooming
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;

    modelRotationRef.current.y += deltaX * 0.008;
    modelRotationRef.current.x += deltaY * 0.008;
    modelRotationRef.current.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, modelRotationRef.current.x));

    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    cameraDistanceRef.current = Math.max(2.0, Math.min(8.0, cameraDistanceRef.current + e.deltaY * 0.003));
  };

  // Touch events for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDraggingRef.current) {
      const deltaX = e.touches[0].clientX - previousMousePositionRef.current.x;
      const deltaY = e.touches[0].clientY - previousMousePositionRef.current.y;

      modelRotationRef.current.y += deltaX * 0.01;
      modelRotationRef.current.x += deltaY * 0.01;
      modelRotationRef.current.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, modelRotationRef.current.x));

      previousMousePositionRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    } else if (e.touches.length === 2 && touchDistanceRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const diff = touchDistanceRef.current - dist;
      cameraDistanceRef.current = Math.max(2.0, Math.min(8.0, cameraDistanceRef.current + diff * 0.01));
      touchDistanceRef.current = dist;
    }
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    touchDistanceRef.current = null;
  };

  const resetView = () => {
    modelRotationRef.current = { x: 0.2, y: 0.3 };
    cameraDistanceRef.current = 4.8;
    setExplodeFactor(0);
    setIsAutoRotate(true);
    setSelectedAnnotation(null);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      ref={containerRef}
      id="model-3d-container"
      className={`relative flex flex-col w-full h-full select-none overflow-hidden ${
        isEmbedded 
          ? 'rounded-3xl bg-transparent' 
          : `rounded-3xl ${viewTheme === 'light' ? 'bg-slate-50 text-slate-800' : 'bg-slate-950 text-slate-100'}`
      } ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Media View: YouTube Embed OR Three.js Canvas */}
      {isYouTubeModel ? (
        <div className="w-full h-full bg-black flex items-center justify-center pointer-events-auto z-10">
          <iframe
            src={getYouTubeEmbedUrl(project.modelUrl, true) || ''}
            title={project.title}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      ) : (
        <canvas ref={canvasRef} className="w-full h-full cursor-grab active:cursor-grabbing block" />
      )}

      {/* Embedded AR Hologram Mode Minimal Controls */}
      {isEmbedded ? (
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
          <div className="flex items-center gap-2 pointer-events-auto bg-[#1A2E1A]/90 dark:bg-[#1A2E1A]/90 text-emerald-100 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-lg border border-emerald-500/30">
            <div className={`w-2 h-2 rounded-full ${audioState.isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-emerald-400 animate-pulse'}`} />
            <span className="text-[11px] font-bold tracking-tight truncate max-w-[130px] sm:max-w-[160px]">
              {project.title}
            </span>
          </div>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              id="btn-expand-embedded-3d"
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-2xl bg-white/90 dark:bg-[#1A2E1A]/90 hover:bg-white text-[#1A2E1A] dark:text-emerald-100 backdrop-blur-md shadow-md border border-[#2D5A27]/20 transition"
              title="Expand to Full 3D Inspector"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {onClose && (
              <button
                id="btn-dismiss-embedded-3d"
                type="button"
                onClick={onClose}
                className="p-2 rounded-2xl bg-white/90 dark:bg-[#1A2E1A]/90 hover:bg-red-50 hover:text-red-600 text-[#2D5A27] dark:text-emerald-100 backdrop-blur-md shadow-md border border-[#2D5A27]/20 transition"
                title="Hide Hologram"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Fullscreen / Modal Controls Header Bar */
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
          {/* Title & Topic Pill */}
          <div className="flex items-center gap-2.5 pointer-events-auto bg-white/90 dark:bg-[#1A2E1A]/90 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-xs border border-[#2D5A27]/20">
            <div className={`w-2.5 h-2.5 rounded-full ${audioState.isPlaying ? 'bg-emerald-500 animate-ping' : 'bg-[#2D5A27] animate-pulse'}`} />
            <div>
              <h4 className="text-xs font-bold text-[#1A2E1A] dark:text-emerald-100 tracking-tight line-clamp-1">
                {project.title}
              </h4>
              <p className="text-[10px] text-[#2D5A27]/70 dark:text-emerald-400/80 font-medium flex items-center gap-1">
                <span>{project.studentName}</span>
                <span>•</span>
                <span className="text-[#2D5A27] font-bold">
                  {audioState.isPlaying ? '🎙️ Speaking Voice-Over' : '3D Hologram'}
                </span>
              </p>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {/* Switch to Video if available */}
            {onOpenVideo && project.videoUrl && (
              <button
                id="btn-switch-to-video"
                type="button"
                onClick={onOpenVideo}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/90 dark:bg-[#1A2E1A]/90 backdrop-blur-md hover:bg-[#E8F0E8] text-[#2D5A27] dark:text-emerald-300 text-xs font-bold shadow-xs border border-[#2D5A27]/20 transition"
                title="Watch Student Video"
              >
                <Film className="w-3.5 h-3.5 text-[#2D5A27]" />
                <span className="hidden sm:inline">Student Video</span>
              </button>
            )}

            {/* Theme switcher */}
            <button
              id="btn-3d-theme-toggle"
              type="button"
              onClick={() => setViewTheme(prev => (prev === 'light' ? 'dark' : 'light'))}
              className="p-2 rounded-2xl bg-white/90 dark:bg-[#1A2E1A]/90 backdrop-blur-md hover:bg-[#E8F0E8] dark:hover:bg-[#223D23] text-[#1A2E1A] dark:text-emerald-200 shadow-xs border border-[#2D5A27]/20 transition"
              title="Toggle Light/Dark Canvas"
            >
              {viewTheme === 'light' ? <Eye className="w-4 h-4 text-[#2D5A27]" /> : <Sparkles className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Fullscreen */}
            <button
              id="btn-3d-fullscreen"
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-2xl bg-white/90 dark:bg-[#1A2E1A]/90 backdrop-blur-md hover:bg-[#E8F0E8] dark:hover:bg-[#223D23] text-[#1A2E1A] dark:text-emerald-200 shadow-xs border border-[#2D5A27]/20 transition"
              title="Full Screen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4 text-[#2D5A27]" /> : <Maximize2 className="w-4 h-4 text-[#2D5A27]" />}
            </button>

            {/* Close button if provided */}
            {onClose && (
              <button
                id="btn-close-3d-modal"
                type="button"
                onClick={onClose}
                className="p-2 rounded-2xl bg-white/90 dark:bg-[#1A2E1A]/90 backdrop-blur-md hover:bg-red-50 dark:hover:bg-red-950/40 text-[#2D5A27]/70 hover:text-red-600 shadow-xs border border-[#2D5A27]/20 transition"
                title="Close 3D Viewer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Voice-Over Audio Narration Dock (Modal Mode Only) */}
      {!isEmbedded && (
        <div className="absolute top-18 left-4 right-4 max-w-xl pointer-events-auto z-20">
          <div className="p-3 rounded-2xl bg-white/95 dark:bg-[#1A2E1A]/95 backdrop-blur-xl border border-[#2D5A27]/25 shadow-lg flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                {/* Play / Pause Voice Button */}
                <button
                  id="btn-play-voice-over"
                  type="button"
                  onClick={handleToggleNarration}
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center transition shadow-md ${
                    audioState.isPlaying
                      ? 'bg-emerald-600 text-white animate-pulse shadow-emerald-500/25'
                      : 'bg-[#2D5A27] hover:bg-[#23461e] text-white'
                  }`}
                  title={audioState.isPlaying ? 'Pause Voice-Over' : 'Play Student Voice-Over'}
                >
                  {audioState.isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleReplayNarration}
                  className="p-1.5 text-[#2D5A27]/70 hover:text-[#2D5A27] rounded-xl hover:bg-[#E8F0E8] transition"
                  title="Restart Narration"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <div>
                  <div className="flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5 text-[#2D5A27] dark:text-emerald-400" />
                    <span className="text-xs font-bold text-[#1A2E1A] dark:text-white">
                      {project.studentName}'s Voice-Over
                    </span>
                    {audioState.isPlaying && (
                      <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded-md">
                        Rotating 3D
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#2D5A27]/70 dark:text-emerald-300/70 font-mono">
                    {formatTime(audioState.currentTime)} / {formatTime(audioState.duration || 15)}
                  </span>
                </div>
              </div>

              {/* Live animated waveform equalizer */}
              <div className="flex items-center gap-0.5 h-5 px-2">
                {[40, 90, 60, 100, 50, 80, 45, 95, 70, 30].map((h, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all duration-150 ${
                      audioState.isPlaying
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-[#2D5A27]/30 dark:bg-emerald-800/40'
                    }`}
                    style={{
                      height: audioState.isPlaying ? `${Math.max(20, (h * (i % 3 + 1)) % 100)}%` : '20%',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Subtitle Dialogue Script Preview */}
            {showTranscriptCard && (
              <div className="p-2 rounded-xl bg-[#F4F7F5] dark:bg-[#223D23] border border-[#2D5A27]/10 text-[11px] text-[#1A2E1A] dark:text-emerald-100 italic leading-relaxed line-clamp-2">
                "{project.audioTranscript || `Hi, I am ${project.studentName} and I am explaining the ${project.title}...`}"
              </div>
            )}

            {/* Progress bar */}
            <div className="w-full bg-[#E8F0E8] dark:bg-[#223D23] h-1 rounded-full overflow-hidden">
              <div
                className="bg-[#2D5A27] dark:bg-emerald-400 h-full transition-all duration-100"
                style={{ width: `${Math.round(audioState.progress * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Organelle Hotspot Chips on Left Side (Modal Mode Only) */}
      {!isEmbedded && annotations.length > 0 && (
        <div className="absolute top-52 left-4 max-w-[240px] flex flex-wrap gap-1.5 pointer-events-auto z-20">
          {annotations.map((ann) => {
            const isSelected = selectedAnnotation?.id === ann.id;
            return (
              <button
                key={ann.id}
                id={`btn-organelle-${ann.id}`}
                type="button"
                onClick={() => setSelectedAnnotation(isSelected ? null : ann)}
                className={`px-3 py-1 text-[11px] font-bold rounded-2xl transition-all shadow-xs border flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#2D5A27] text-white border-[#2D5A27] shadow-sm'
                    : 'bg-white/90 dark:bg-[#1A2E1A]/90 backdrop-blur-md text-[#1A2E1A] dark:text-emerald-200 hover:bg-[#E8F0E8] border-[#2D5A27]/20'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#2D5A27]'}`} />
                {ann.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Organelle Card Popup (Modal Mode Only) */}
      {!isEmbedded && selectedAnnotation && (
        <div className="absolute bottom-24 left-4 right-4 md:left-6 md:right-auto md:w-96 p-4 rounded-3xl bg-white/95 dark:bg-[#1A2E1A]/95 backdrop-blur-xl border border-[#2D5A27]/30 shadow-2xl z-30 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5">
              <div className="p-1 rounded-xl bg-[#E8F0E8] dark:bg-[#223D23] text-[#2D5A27] dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h5 className="text-sm font-bold text-[#1A2E1A] dark:text-white">
                {selectedAnnotation.name}
              </h5>
            </div>
            <button
              onClick={() => setSelectedAnnotation(null)}
              className="p-1 text-[#2D5A27]/60 hover:text-[#1A2E1A] rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-[#1A2E1A]/80 dark:text-emerald-200/80 leading-relaxed mb-2">
            {selectedAnnotation.description}
          </p>
          <div className="p-2.5 rounded-2xl bg-[#F4F7F5] dark:bg-[#223D23] border border-[#2D5A27]/15 text-[11px] text-[#2D5A27] dark:text-emerald-300">
            <span className="font-bold">Function: </span>
            {selectedAnnotation.function}
          </div>
        </div>
      )}

      {/* Bottom Floating Control Deck (Modal Mode Only) */}
      {!isEmbedded && (
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2 pointer-events-none z-20">
          {/* Explode / Disassembly Slider */}
          <div className="flex items-center gap-2 pointer-events-auto bg-white/90 dark:bg-[#1A2E1A]/90 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-xs border border-[#2D5A27]/20">
            <Sliders className="w-3.5 h-3.5 text-[#2D5A27]" />
            <span className="text-[11px] font-bold text-[#1A2E1A] dark:text-emerald-200 whitespace-nowrap">
              Dissect: {Math.round(explodeFactor * 100)}%
            </span>
            <input
              id="range-3d-explode"
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={explodeFactor}
              onChange={(e) => setExplodeFactor(parseFloat(e.target.value))}
              className="w-20 md:w-28 accent-[#2D5A27] h-1.5 bg-[#E8F0E8] dark:bg-[#223D23] rounded-lg cursor-pointer"
            />
          </div>

          {/* Action Toggle Pills */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {/* Wireframe */}
            <button
              id="btn-3d-wireframe"
              type="button"
              onClick={() => setIsWireframe(!isWireframe)}
              className={`px-3 py-2 rounded-2xl text-xs font-bold backdrop-blur-md transition flex items-center gap-1.5 shadow-xs border ${
                isWireframe
                  ? 'bg-[#2D5A27] text-white border-[#2D5A27]'
                  : 'bg-white/90 dark:bg-[#1A2E1A]/90 text-[#1A2E1A] dark:text-emerald-200 hover:bg-[#E8F0E8] border-[#2D5A27]/20'
              }`}
              title="Toggle Wireframe Structural Mesh"
            >
              <Layers className="w-3.5 h-3.5 text-[#2D5A27] dark:text-emerald-400" />
              <span className="hidden sm:inline">Mesh</span>
            </button>

            {/* Auto Rotate */}
            <button
              id="btn-3d-autorotate"
              type="button"
              onClick={() => setIsAutoRotate(!isAutoRotate)}
              className={`px-3 py-2 rounded-2xl text-xs font-bold backdrop-blur-md transition flex items-center gap-1.5 shadow-xs border ${
                isAutoRotate || audioState.isPlaying
                  ? 'bg-[#E8F0E8] dark:bg-[#223D23] text-[#2D5A27] dark:text-emerald-300 border-[#2D5A27]/30'
                  : 'bg-white/90 dark:bg-[#1A2E1A]/90 text-[#1A2E1A] dark:text-emerald-200 hover:bg-[#E8F0E8] border-[#2D5A27]/20'
              }`}
              title="Toggle Spin"
            >
              <Rotate3d className={`w-3.5 h-3.5 text-[#2D5A27] dark:text-emerald-400 ${isAutoRotate || audioState.isPlaying ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Spin</span>
            </button>

            {/* Reset Camera */}
            <button
              id="btn-3d-reset-view"
              type="button"
              onClick={resetView}
              className="p-2 rounded-2xl bg-white/90 dark:bg-[#1A2E1A]/90 backdrop-blur-md hover:bg-[#E8F0E8] dark:hover:bg-[#223D23] text-[#1A2E1A] dark:text-emerald-200 shadow-xs border border-[#2D5A27]/20 transition"
              title="Reset Angle & Zoom"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#2D5A27]" />
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoadingModel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm z-30">
          <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Loading 3D Biological Organelle...</p>
        </div>
      )}
    </div>
  );
};

