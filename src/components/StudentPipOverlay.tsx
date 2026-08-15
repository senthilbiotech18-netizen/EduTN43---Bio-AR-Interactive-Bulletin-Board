import React, { useRef, useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Move, 
  Maximize2, 
  Minimize2, 
  User, 
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import { PipCornerPosition } from '../types';

interface StudentPipOverlayProps {
  studentVideoUrl: string;
  studentName: string;
  studentAvatar?: string;
  defaultPosition?: PipCornerPosition;
  onPositionChange?: (position: PipCornerPosition) => void;
  className?: string;
  isDraggable?: boolean;
}

export const StudentPipOverlay: React.FC<StudentPipOverlayProps> = ({
  studentVideoUrl,
  studentName,
  studentAvatar,
  defaultPosition = 'bottom-right',
  onPositionChange,
  className = '',
  isDraggable = true,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [position, setPosition] = useState<PipCornerPosition>(defaultPosition);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setPosition(defaultPosition);
  }, [defaultPosition]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const cycleCorner = (e: React.MouseEvent) => {
    e.stopPropagation();
    const positions: PipCornerPosition[] = ['bottom-right', 'bottom-left', 'top-left', 'top-right'];
    const currentIndex = positions.indexOf(position);
    const nextPos = positions[(currentIndex + 1) % positions.length];
    setPosition(nextPos);
    if (onPositionChange) onPositionChange(nextPos);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'top-left':
        return 'top-4 left-4';
      case 'side-by-side':
        return 'bottom-4 right-4';
      case 'bottom-right':
      default:
        return 'bottom-4 right-4';
    }
  };

  if (!studentVideoUrl || hasError) return null;

  return (
    <div
      className={`absolute z-30 transition-all duration-300 pointer-events-auto ${getPositionClasses()} ${className}`}
    >
      <div 
        className={`relative rounded-2xl overflow-hidden shadow-2xl border-2 border-emerald-400/80 bg-black/90 backdrop-blur-md transition-all duration-300 group ${
          isExpanded 
            ? 'w-64 h-48 sm:w-80 sm:h-60' 
            : 'w-40 h-28 sm:w-52 sm:h-36'
        }`}
      >
        {/* Student Video Element */}
        <video
          ref={videoRef}
          src={studentVideoUrl}
          autoPlay
          playsInline
          loop
          muted={isMuted}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
        />

        {/* Presenter Name Tag Badge */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-black/75 backdrop-blur-md border border-white/20 text-[10px] font-bold text-white flex items-center gap-1.5 shadow-md">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="truncate max-w-[100px] sm:max-w-[130px]">
            {studentName || 'Student Presenter'}
          </span>
        </div>

        {/* Overlay Action Bar on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
          {/* Top Controls */}
          <div className="flex items-center justify-end gap-1">
            {isDraggable && (
              <button
                type="button"
                onClick={cycleCorner}
                title="Move to next corner"
                className="p-1 rounded-lg bg-black/60 hover:bg-black text-white text-[10px] transition"
              >
                <Move className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              title={isExpanded ? 'Shrink' : 'Enlarge'}
              className="p-1 rounded-lg bg-black/60 hover:bg-black text-white text-[10px] transition"
            >
              {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Bottom Audio/Playback Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={togglePlay}
                className="p-1 rounded-lg bg-[#2D5A27] hover:bg-[#23461e] text-white"
              >
                {isPlaying ? <Pause className="w-3 h-3 fill-white" /> : <Play className="w-3 h-3 fill-white" />}
              </button>
              <button
                type="button"
                onClick={toggleMute}
                className="p-1 rounded-lg bg-black/60 hover:bg-black text-white"
              >
                {isMuted ? <VolumeX className="w-3 h-3 text-red-400" /> : <Volume2 className="w-3 h-3 text-emerald-400" />}
              </button>
            </div>

            <span className="text-[9px] font-bold text-emerald-300 bg-[#2D5A27]/80 px-1.5 py-0.5 rounded">
              Student PiP
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
