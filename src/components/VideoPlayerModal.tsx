import React, { useRef, useState, useEffect } from 'react';
import { 
  X, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  BookOpen, 
  RotateCcw,
  CheckCircle,
  Youtube,
  ExternalLink,
  User,
  Move
} from 'lucide-react';
import { Project, PipCornerPosition } from '../types';
import { isYouTubeUrl, getYouTubeEmbedUrl, isVimeoUrl, getVimeoEmbedUrl } from '../utils/mediaUtils';
import { StudentPipOverlay } from './StudentPipOverlay';

interface VideoPlayerModalProps {
  project: Project;
  onClose: () => void;
  onOpen3D?: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  project,
  onClose,
  onOpen3D,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [activeTab, setActiveTab] = useState<'video' | 'transcript' | 'key_points'>('video');
  const [pipPosition, setPipPosition] = useState<PipCornerPosition>(project.pipPosition || 'bottom-right');
  const [showPip, setShowPip] = useState(true);

  const videoSrc = project.videoUrl || project.modelUrl || '';
  const isYouTube = isYouTubeUrl(videoSrc);
  const isVimeo = isVimeoUrl(videoSrc);
  const studentVideoSrc = project.studentVideoUrl;

  useEffect(() => {
    if (isYouTube || isVimeo) return;
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => {
      setDuration(video.duration || 0);
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    };
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
    };
  }, [isYouTube, isVimeo, videoSrc]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const changeSpeed = () => {
    if (!videoRef.current) return;
    const speeds = [1.0, 1.25, 1.5, 2.0, 0.75];
    const nextSpeed = speeds[(speeds.indexOf(playbackRate) + 1) % speeds.length];
    videoRef.current.playbackRate = nextSpeed;
    setPlaybackRate(nextSpeed);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#0E1B10]/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div 
        ref={containerRef}
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-[#1A2E1A] rounded-3xl shadow-2xl border border-[#2D5A27]/25 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D5A27]/15 bg-white/90 dark:bg-[#1A2E1A]/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {project.studentAvatar ? (
              <img 
                src={project.studentAvatar} 
                alt={project.studentName} 
                className="w-10 h-10 rounded-2xl object-cover border-2 border-[#2D5A27]"
              />
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-[#2D5A27] flex items-center justify-center text-white font-bold text-sm">
                {project.studentName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[#1A2E1A] dark:text-white text-base tracking-tight">
                  {project.title}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F0E8] dark:bg-[#223D23] text-[#2D5A27] dark:text-emerald-300 border border-[#2D5A27]/15">
                  {project.grade}
                </span>
                {isYouTube && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-300 flex items-center gap-1">
                    <Youtube className="w-3 h-3" />
                    YouTube
                  </span>
                )}
              </div>
              <p className="text-xs text-[#2D5A27]/70 dark:text-emerald-400/80">
                Student Presenter: <span className="font-semibold text-[#1A2E1A] dark:text-emerald-200">{project.studentName}</span> • Topic: {project.topic}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isYouTube && (
              <a
                href={videoSrc}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-red-50 dark:bg-red-950/60 hover:bg-red-100 text-red-600 dark:text-red-300 text-xs font-bold border border-red-200 dark:border-red-900 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open on YouTube
              </a>
            )}

            {onOpen3D && (
              <button
                id="btn-modal-switch-to-3d"
                type="button"
                onClick={() => {
                  onClose();
                  onOpen3D();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#E8F0E8] dark:bg-[#223D23] hover:bg-[#d8e6d8] text-[#2D5A27] dark:text-emerald-300 text-xs font-bold border border-[#2D5A27]/20 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                View 3D Organelle
              </button>
            )}
            <button
              id="btn-close-video-modal"
              type="button"
              onClick={onClose}
              className="p-2 rounded-2xl text-[#2D5A27]/70 hover:text-[#1A2E1A] dark:hover:text-white hover:bg-[#E8F0E8] dark:hover:bg-[#223D23] transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Main Video Screen */}
          <div className="relative aspect-video w-full bg-black group flex items-center justify-center overflow-hidden">
            {isYouTube ? (
              <iframe
                src={getYouTubeEmbedUrl(videoSrc, true) || ''}
                title={project.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : isVimeo ? (
              <iframe
                src={getVimeoEmbedUrl(videoSrc) || ''}
                title={project.title}
                className="w-full h-full border-0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <>
                <video
                  ref={videoRef}
                  src={videoSrc}
                  className="w-full h-full object-contain"
                  playsInline
                  onClick={togglePlay}
                />

                {/* Floating Overlay Controls on Hover/Active */}
                <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-95 group-hover:opacity-100 transition-opacity">
                  {/* Progress Slider */}
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[11px] font-mono text-emerald-200">{formatTime(currentTime)}</span>
                    <input
                      id="video-seek-bar"
                      type="range"
                      min="0"
                      max={duration || 100}
                      step="0.1"
                      value={currentTime}
                      onChange={handleSeek}
                      className="flex-1 accent-emerald-500 h-1.5 bg-white/30 rounded-lg cursor-pointer"
                    />
                    <span className="text-[11px] font-mono text-emerald-300/70">{formatTime(duration)}</span>
                  </div>

                  {/* Bottom control row */}
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <button
                        id="btn-video-play-pause"
                        onClick={togglePlay}
                        className="p-2 rounded-2xl bg-[#2D5A27] hover:bg-[#23461e] text-white transition transform active:scale-95 shadow-md"
                      >
                        {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                      </button>

                      <button
                        id="btn-video-replay"
                        onClick={() => {
                          if (videoRef.current) {
                            videoRef.current.currentTime = 0;
                            videoRef.current.play();
                            setIsPlaying(true);
                          }
                        }}
                        className="p-2 rounded-2xl hover:bg-white/20 text-slate-300 transition"
                        title="Restart from beginning"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>

                      <button
                        id="btn-video-mute"
                        onClick={toggleMute}
                        className="p-2 rounded-2xl hover:bg-white/20 text-slate-300 transition"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        id="btn-video-speed"
                        onClick={changeSpeed}
                        className="px-2.5 py-1 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-mono text-white transition"
                      >
                        {playbackRate}x
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Corner Picture-in-Picture Student Video Overlay */}
            {studentVideoSrc && showPip && (
              <StudentPipOverlay
                studentVideoUrl={studentVideoSrc}
                studentName={project.studentName}
                studentAvatar={project.studentAvatar}
                defaultPosition={pipPosition}
                onPositionChange={setPipPosition}
              />
            )}
          </div>

          {/* Video Notes & Scientific Breakdown */}
          <div className="p-6">
            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-[#2D5A27]/15 pb-3 mb-4">
              <button
                id="tab-video-summary"
                onClick={() => setActiveTab('video')}
                className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition ${
                  activeTab === 'video'
                    ? 'bg-[#2D5A27] text-white'
                    : 'text-[#2D5A27]/70 dark:text-emerald-400/80 hover:bg-[#E8F0E8] dark:hover:bg-[#223D23]'
                }`}
              >
                Student Presentation Overview
              </button>
              <button
                id="tab-video-keypoints"
                onClick={() => setActiveTab('key_points')}
                className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'key_points'
                    ? 'bg-[#2D5A27] text-white'
                    : 'text-[#2D5A27]/70 dark:text-emerald-400/80 hover:bg-[#E8F0E8] dark:hover:bg-[#223D23]'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                Key Biology Concepts ({project.keyPoints.length})
              </button>
            </div>

            {activeTab === 'video' && (
              <div className="space-y-4">
                <div className="p-4 rounded-3xl bg-[#F4F7F5] dark:bg-[#132416] border border-[#2D5A27]/15">
                  <h4 className="text-xs font-bold text-[#2D5A27]/70 dark:text-emerald-400/80 uppercase tracking-wider mb-1">
                    Student Scientific Statement
                  </h4>
                  <p className="text-sm text-[#1A2E1A] dark:text-emerald-100 leading-relaxed">
                    {project.videoCaption || project.description}
                  </p>
                </div>

                {project.vocabulary && project.vocabulary.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-[#2D5A27]/70 dark:text-emerald-400/80 uppercase tracking-wider mb-2.5">
                      Core Scientific Terms
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {project.vocabulary.map((vocab, i) => (
                        <div key={i} className="p-3 rounded-2xl bg-[#F4F7F5] dark:bg-[#223D23] border border-[#2D5A27]/15">
                          <span className="font-bold text-xs text-[#2D5A27] dark:text-emerald-400 block mb-0.5">
                            {vocab.term}
                          </span>
                          <span className="text-xs text-[#1A2E1A]/80 dark:text-emerald-200/80">
                            {vocab.definition}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'key_points' && (
              <div className="space-y-2.5">
                {project.keyPoints.map((pt, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#F4F7F5] dark:bg-[#132416] border border-[#2D5A27]/15">
                    <div className="p-1 rounded-xl bg-[#E8F0E8] dark:bg-[#223D23] text-[#2D5A27] dark:text-emerald-400 mt-0.5">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1A2E1A] dark:text-emerald-100 leading-snug">
                        {pt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
