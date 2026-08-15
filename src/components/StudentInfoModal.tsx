import React, { useState } from 'react';
import { 
  X, 
  User, 
  GraduationCap, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  FileText, 
  Download, 
  Play, 
  CheckCircle2, 
  BookOpen, 
  Award,
  ExternalLink
} from 'lucide-react';
import { Project } from '../types';

interface StudentInfoModalProps {
  project: Project;
  onClose: () => void;
  onOpenVideo?: () => void;
  onOpen3D?: () => void;
}

export const StudentInfoModal: React.FC<StudentInfoModalProps> = ({
  project,
  onClose,
  onOpenVideo,
  onOpen3D,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Web Speech API text-to-speech for accessible narration
  const toggleNarration = () => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const textToRead = `${project.title}. By student ${project.studentName}, ${project.grade}. Topic: ${project.topic}. ${project.description}. Key points: ${project.keyPoints.join('. ')}`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const downloadPoster = () => {
    const a = document.createElement('a');
    a.href = project.markerImage;
    a.download = `BioAR_Poster_${project.studentName.replace(/\s+/g, '_')}.jpg`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#0E1B10]/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white dark:bg-[#1A2E1A] rounded-3xl shadow-2xl border border-[#2D5A27]/25 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D5A27]/15 bg-white/90 dark:bg-[#1A2E1A]/90 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-[#E8F0E8] dark:bg-[#223D23] text-[#2D5A27] dark:text-emerald-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#1A2E1A] dark:text-white text-base">
                Student Research Profile
              </h3>
              <p className="text-xs text-[#2D5A27]/70 dark:text-emerald-400/80">
                BioAR Interactive Biology Exhibition
              </p>
            </div>
          </div>

          <button
            id="btn-close-student-modal"
            type="button"
            onClick={() => {
              if (isSpeaking && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
              }
              onClose();
            }}
            className="p-2 rounded-2xl text-[#2D5A27]/70 hover:text-[#1A2E1A] dark:hover:text-white hover:bg-[#E8F0E8] dark:hover:bg-[#223D23] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Student Banner Bento Card */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-5 rounded-3xl bg-[#F4F7F5] dark:bg-[#223D23] border border-[#2D5A27]/15">
            {project.studentAvatar ? (
              <img 
                src={project.studentAvatar} 
                alt={project.studentName} 
                className="w-16 h-16 rounded-2xl object-cover border-2 border-[#2D5A27] shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-[#2D5A27] text-white flex items-center justify-center font-bold text-xl shadow-sm">
                {project.studentName.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <h4 className="text-lg font-bold text-[#1A2E1A] dark:text-white">
                  {project.studentName}
                </h4>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F0E8] dark:bg-[#1A2E1A] text-[#2D5A27] dark:text-emerald-300 border border-[#2D5A27]/15">
                  {project.grade}
                </span>
              </div>
              <p className="text-xs font-semibold text-[#2D5A27] dark:text-emerald-400 mb-3">
                Topic: {project.topic}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <button
                  id="btn-tts-narration"
                  type="button"
                  onClick={toggleNarration}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition ${
                    isSpeaking 
                      ? 'bg-[#2D5A27] text-white animate-pulse' 
                      : 'bg-white dark:bg-[#1A2E1A] text-[#1A2E1A] dark:text-emerald-100 border border-[#2D5A27]/20 hover:bg-[#E8F0E8]'
                  }`}
                >
                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#2D5A27] dark:text-emerald-400" />}
                  {isSpeaking ? 'Pause Audio Read' : 'Listen to Narration'}
                </button>

                <button
                  id="btn-download-marker-poster"
                  type="button"
                  onClick={downloadPoster}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold bg-white dark:bg-[#1A2E1A] text-[#1A2E1A] dark:text-emerald-100 border border-[#2D5A27]/20 hover:bg-[#E8F0E8] transition"
                >
                  <Download className="w-3.5 h-3.5 text-[#2D5A27] dark:text-emerald-400" />
                  Download Drawing Marker
                </button>
              </div>
            </div>
          </div>

          {/* Project Title & Description */}
          <div>
            <h4 className="text-xs font-bold text-[#2D5A27]/70 dark:text-emerald-400/80 uppercase tracking-wider mb-1.5">
              Scientific Poster Overview
            </h4>
            <h3 className="text-base font-bold text-[#1A2E1A] dark:text-white mb-2">
              {project.title}
            </h3>
            <p className="text-sm text-[#1A2E1A]/85 dark:text-emerald-100/90 leading-relaxed bg-[#F4F7F5] dark:bg-[#132416] p-4 rounded-3xl border border-[#2D5A27]/10">
              {project.description}
            </p>
          </div>

          {/* Student Spoken Dialogue & Voice-Over Explanation */}
          {(project.audioTranscript || project.audioNarrationUrl) && (
            <div className="p-4 rounded-3xl bg-[#E8F0E8]/70 dark:bg-[#223D23]/60 border border-[#2D5A27]/20 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#2D5A27] dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4" />
                  Student Spoken Explanation & Voice-Over
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2D5A27] text-white">
                  3D Rotation Sync
                </span>
              </div>
              <p className="text-xs text-[#1A2E1A] dark:text-emerald-100 italic leading-relaxed bg-white/70 dark:bg-[#1A2E1A]/70 p-3 rounded-2xl border border-[#2D5A27]/10">
                "{project.audioTranscript || `Hi, I am ${project.studentName} and I am going to explain about ${project.title}.`}"
              </p>
              <div className="flex items-center justify-between text-[11px] text-[#2D5A27]/80 dark:text-emerald-400/80 pt-1">
                <span>Synchronized with 360° biological model rotation</span>
                {onOpen3D && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpen3D();
                    }}
                    className="font-bold underline hover:text-[#1A2E1A] dark:hover:text-white flex items-center gap-1"
                  >
                    Experience 3D + Voice
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Key Learning Highlights */}
          <div>
            <h4 className="text-xs font-bold text-[#2D5A27]/70 dark:text-emerald-400/80 uppercase tracking-wider mb-3">
              Research Takeaways & Biological Functions
            </h4>
            <div className="space-y-2.5">
              {project.keyPoints.map((pt, i) => (
                <div key={i} className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#F4F7F5] dark:bg-[#132416] border border-[#2D5A27]/10">
                  <div className="p-1 rounded-xl bg-[#E8F0E8] dark:bg-[#223D23] text-[#2D5A27] dark:text-emerald-400 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-xs text-[#1A2E1A] dark:text-emerald-100 leading-relaxed">
                    {pt}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Hand-drawn Poster Marker Preview */}
          <div>
            <h4 className="text-xs font-bold text-[#2D5A27]/70 dark:text-emerald-400/80 uppercase tracking-wider mb-2">
              Original Hand-Drawn AR Marker
            </h4>
            <div className="relative rounded-3xl overflow-hidden border border-[#2D5A27]/20 group max-h-56 bg-[#F4F7F5] dark:bg-[#132416] flex items-center justify-center p-2">
              <img 
                src={project.markerImage} 
                alt={project.title} 
                className="w-full h-full object-contain max-h-56 rounded-2xl group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-[#1A2E1A]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-3xl">
                <button
                  onClick={downloadPoster}
                  className="px-4 py-2 rounded-2xl bg-white text-[#1A2E1A] font-bold text-xs shadow-lg flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4 text-[#2D5A27]" />
                  Download Full Res Poster
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#2D5A27]/15 bg-[#F4F7F5] dark:bg-[#132416] flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-[#2D5A27]/70 dark:text-emerald-400/80 font-medium">
            Created: {new Date(project.createdAt).toLocaleDateString()}
          </span>

          <div className="flex items-center gap-2">
            {onOpenVideo && (
              <button
                id="btn-student-info-play-video"
                type="button"
                onClick={() => {
                  onClose();
                  onOpenVideo();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white dark:bg-[#223D23] hover:bg-[#E8F0E8] text-[#1A2E1A] dark:text-emerald-100 text-xs font-bold border border-[#2D5A27]/15 transition"
              >
                <Play className="w-3.5 h-3.5 fill-current text-[#2D5A27] dark:text-emerald-400" />
                Watch Presentation
              </button>
            )}

            {onOpen3D && (
              <button
                id="btn-student-info-view-3d"
                type="button"
                onClick={() => {
                  onClose();
                  onOpen3D();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#2D5A27] hover:bg-[#23461e] text-white text-xs font-bold shadow-md transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Launch 3D Model
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
