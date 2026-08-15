import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  RotateCcw, 
  Upload, 
  Sparkles, 
  Volume2, 
  Check, 
  Trash2, 
  AlertCircle, 
  FileAudio,
  Radio,
  FileText
} from 'lucide-react';
import { AudioSourceType, ExplanationPreference } from '../types';
import { audioNarrationManager, generateStudentDialogueScript } from '../utils/audioNarrationService';

interface AudioVoiceOverRecorderProps {
  studentName: string;
  projectTitle: string;
  topic: string;
  keyPoints: string[];
  audioUrl?: string;
  audioTranscript?: string;
  audioSourceType?: AudioSourceType;
  explanationPreference?: ExplanationPreference;
  autoRotateWithAudio?: boolean;
  onAudioChange: (data: {
    audioUrl?: string;
    audioTranscript: string;
    audioSourceType: AudioSourceType;
    explanationPreference: ExplanationPreference;
    autoRotateWithAudio: boolean;
  }) => void;
}

export const AudioVoiceOverRecorder: React.FC<AudioVoiceOverRecorderProps> = ({
  studentName,
  projectTitle,
  topic,
  keyPoints,
  audioUrl = '',
  audioTranscript = '',
  audioSourceType = 'speech_synth',
  explanationPreference = 'both',
  autoRotateWithAudio = true,
  onAudioChange,
}) => {
  // Mode tabs: 'record' | 'upload' | 'script'
  const [activeTab, setActiveTab] = useState<'record' | 'upload' | 'script'>('record');

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string>(audioUrl);
  const [transcript, setTranscript] = useState<string>(
    audioTranscript || generateStudentDialogueScript(studentName, projectTitle, topic, keyPoints)
  );
  const [sourceType, setSourceType] = useState<AudioSourceType>(audioSourceType);
  const [pref, setPref] = useState<ExplanationPreference>(explanationPreference);
  const [autoRotate, setAutoRotate] = useState<boolean>(autoRotateWithAudio);

  // Playback Test State
  const [isPlayingTest, setIsPlayingTest] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync transcript default if student name or title changes and transcript was untouched
  useEffect(() => {
    if (!transcript || transcript.startsWith('Hi, I am')) {
      const generated = generateStudentDialogueScript(studentName, projectTitle, topic, keyPoints);
      setTranscript(generated);
    }
  }, [studentName, projectTitle, topic]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      audioNarrationManager.stop();
    };
  }, []);

  // 1. Start Microphone Recording
  const startRecording = async () => {
    try {
      setMicError(null);
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedAudioBlob(audioBlob);
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          setCurrentAudioUrl(dataUrl);
          setSourceType('recorded');
          onAudioChange({
            audioUrl: dataUrl,
            audioTranscript: transcript,
            audioSourceType: 'recorded',
            explanationPreference: pref,
            autoRotateWithAudio: autoRotate,
          });
        };
        reader.readAsDataURL(audioBlob);

        // Stop mic tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Microphone recording error:', err);
      setMicError('Could not access microphone. Please enable mic permissions or upload an audio file.');
      setIsRecording(false);
    }
  };

  // 2. Stop Microphone Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // 3. Handle Audio File Upload (.mp3, .wav, .m4a, etc.)
  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      if (typeof evt.target?.result === 'string') {
        const dataUrl = evt.target.result;
        setCurrentAudioUrl(dataUrl);
        setSourceType('uploaded');
        onAudioChange({
          audioUrl: dataUrl,
          audioTranscript: transcript,
          audioSourceType: 'uploaded',
          explanationPreference: pref,
          autoRotateWithAudio: autoRotate,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // 4. Test Playback
  const handleTestPlayback = () => {
    if (isPlayingTest) {
      audioNarrationManager.stop();
      setIsPlayingTest(false);
    } else {
      setIsPlayingTest(true);
      audioNarrationManager.play({
        audioUrl: currentAudioUrl,
        transcript: transcript,
        studentName: studentName,
        onEnd: () => setIsPlayingTest(false),
      });
    }
  };

  const handleTranscriptChange = (newText: string) => {
    setTranscript(newText);
    onAudioChange({
      audioUrl: currentAudioUrl,
      audioTranscript: newText,
      audioSourceType: sourceType,
      explanationPreference: pref,
      autoRotateWithAudio: autoRotate,
    });
  };

  const handlePreferenceChange = (newPref: ExplanationPreference) => {
    setPref(newPref);
    onAudioChange({
      audioUrl: currentAudioUrl,
      audioTranscript: transcript,
      audioSourceType: sourceType,
      explanationPreference: newPref,
      autoRotateWithAudio: autoRotate,
    });
  };

  const handleAutoRotateChange = (rotate: boolean) => {
    setAutoRotate(rotate);
    onAudioChange({
      audioUrl: currentAudioUrl,
      audioTranscript: transcript,
      audioSourceType: sourceType,
      explanationPreference: pref,
      autoRotateWithAudio: rotate,
    });
  };

  const formatSecs = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-4 rounded-3xl bg-[#F4F7F5] dark:bg-[#132416] p-4 sm:p-5 border border-[#2D5A27]/15">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-2xl bg-[#2D5A27] text-white flex items-center justify-center shadow-xs">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#1A2E1A] dark:text-emerald-100 uppercase tracking-wider">
              Student Voice-Over & 3D Narration
            </h4>
            <p className="text-[11px] text-[#2D5A27]/70 dark:text-emerald-400/80">
              3D model continuously rotates while student voice-over is speaking
            </p>
          </div>
        </div>

        {/* Explanation Preference Selector */}
        <div className="flex items-center gap-1 bg-white dark:bg-[#1A2E1A] p-1 rounded-2xl border border-[#2D5A27]/15">
          <button
            type="button"
            onClick={() => handlePreferenceChange('voice_over')}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition ${
              pref === 'voice_over'
                ? 'bg-[#2D5A27] text-white shadow-xs'
                : 'text-[#2D5A27] dark:text-emerald-300 hover:bg-[#E8F0E8]'
            }`}
          >
            🎙️ Voice-Over Only
          </button>
          <button
            type="button"
            onClick={() => handlePreferenceChange('video')}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition ${
              pref === 'video'
                ? 'bg-[#2D5A27] text-white shadow-xs'
                : 'text-[#2D5A27] dark:text-emerald-300 hover:bg-[#E8F0E8]'
            }`}
          >
            🎬 MP4 Video
          </button>
          <button
            type="button"
            onClick={() => handlePreferenceChange('both')}
            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition ${
              pref === 'both'
                ? 'bg-[#2D5A27] text-white shadow-xs'
                : 'text-[#2D5A27] dark:text-emerald-300 hover:bg-[#E8F0E8]'
            }`}
          >
            🌟 Both Available
          </button>
        </div>
      </div>

      {micError && (
        <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{micError}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1.5 border-b border-[#2D5A27]/15 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('record')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition ${
            activeTab === 'record'
              ? 'bg-[#2D5A27] text-white shadow-xs'
              : 'bg-white dark:bg-[#1A2E1A] text-[#1A2E1A] dark:text-emerald-200 border border-[#2D5A27]/10'
          }`}
        >
          <Mic className="w-3.5 h-3.5" />
          <span>Record with Mic</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition ${
            activeTab === 'upload'
              ? 'bg-[#2D5A27] text-white shadow-xs'
              : 'bg-white dark:bg-[#1A2E1A] text-[#1A2E1A] dark:text-emerald-200 border border-[#2D5A27]/10'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Audio File</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('script')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition ${
            activeTab === 'script'
              ? 'bg-[#2D5A27] text-white shadow-xs'
              : 'bg-white dark:bg-[#1A2E1A] text-[#1A2E1A] dark:text-emerald-200 border border-[#2D5A27]/10'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Dialogue Script & AI Voice</span>
        </button>
      </div>

      {/* Tab 1: Record Voice-over */}
      {activeTab === 'record' && (
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1A2E1A] border border-[#2D5A27]/15 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {isRecording ? (
                <div className="w-12 h-12 rounded-full bg-red-600 animate-pulse text-white flex items-center justify-center shadow-lg shadow-red-500/30">
                  <Radio className="w-6 h-6 animate-spin" />
                </div>
              ) : currentAudioUrl && sourceType === 'recorded' ? (
                <div className="w-12 h-12 rounded-full bg-[#E8F0E8] text-[#2D5A27] flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#E8F0E8] text-[#2D5A27] flex items-center justify-center">
                  <Mic className="w-6 h-6" />
                </div>
              )}

              <div>
                <h5 className="text-xs font-bold text-[#1A2E1A] dark:text-white">
                  {isRecording
                    ? `Recording ${studentName}'s Voice... ${formatSecs(recordingSeconds)}`
                    : currentAudioUrl && sourceType === 'recorded'
                    ? `Voice-Over Recorded Successfully!`
                    : `Ready to Record Student Voice`}
                </h5>
                <p className="text-[11px] text-[#2D5A27]/70 dark:text-emerald-300/70">
                  {isRecording
                    ? 'Student can speak: "Hi, I am ' + (studentName || 'Maya') + ' and I am explaining..."'
                    : 'Click Start to record an explanation for this 3D model.'}
                </p>
              </div>
            </div>

            {/* Record / Stop Action Buttons */}
            <div className="flex items-center gap-2">
              {isRecording ? (
                <button
                  id="btn-stop-mic-recording"
                  type="button"
                  onClick={stopRecording}
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop Recording</span>
                </button>
              ) : (
                <button
                  id="btn-start-mic-recording"
                  type="button"
                  onClick={startRecording}
                  className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#2D5A27] hover:bg-[#23461e] text-white font-bold text-xs shadow-md shadow-[#2D5A27]/25 transition"
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>{currentAudioUrl && sourceType === 'recorded' ? 'Re-record Voice' : 'Start Recording'}</span>
                </button>
              )}

              {currentAudioUrl && (
                <button
                  id="btn-test-recorded-audio"
                  type="button"
                  onClick={handleTestPlayback}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold border transition ${
                    isPlayingTest
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-[#E8F0E8] dark:bg-[#223D23] text-[#2D5A27] dark:text-emerald-200 border-[#2D5A27]/20'
                  }`}
                >
                  {isPlayingTest ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{isPlayingTest ? 'Pause' : 'Test Play'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Sound wave visualizer animation when recording */}
          {isRecording && (
            <div className="flex items-center justify-center gap-1 py-2">
              {[40, 70, 30, 90, 60, 100, 45, 80, 55, 95, 35, 65, 85, 50].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-[#2D5A27] dark:bg-emerald-400 rounded-full animate-pulse"
                  style={{
                    height: `${h}%`,
                    animationDuration: `${0.4 + (i % 5) * 0.15}s`,
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Upload Audio File */}
      {activeTab === 'upload' && (
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1A2E1A] border border-[#2D5A27]/15 space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/mp3,audio/wav,audio/m4a,audio/webm,audio/ogg,audio/*"
            onChange={handleAudioFileUpload}
            className="hidden"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#E8F0E8] dark:bg-[#223D23] text-[#2D5A27] dark:text-emerald-400 flex items-center justify-center">
                <FileAudio className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-[#1A2E1A] dark:text-white">
                  {currentAudioUrl && sourceType === 'uploaded' ? 'Audio File Attached' : 'Select Audio Narration File'}
                </h5>
                <p className="text-[11px] text-[#2D5A27]/70 dark:text-emerald-300/70">
                  Supports MP3, WAV, M4A, WEBM recorded on phone or studio mic
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#2D5A27] hover:bg-[#23461e] text-white text-xs font-bold shadow-xs transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Browse File</span>
              </button>

              {currentAudioUrl && (
                <button
                  type="button"
                  onClick={handleTestPlayback}
                  className="flex items-center gap-1 px-3 py-2 rounded-2xl bg-[#E8F0E8] text-[#2D5A27] text-xs font-bold border border-[#2D5A27]/20"
                >
                  {isPlayingTest ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{isPlayingTest ? 'Stop' : 'Play'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Dialogue Script & AI Voice */}
      {activeTab === 'script' && (
        <div className="p-4 rounded-2xl bg-white dark:bg-[#1A2E1A] border border-[#2D5A27]/15 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#1A2E1A] dark:text-emerald-200 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#2D5A27]" />
              <span>Student Dialogue Script (Plays with Natural Voice)</span>
            </label>
            <button
              type="button"
              onClick={() => {
                const newScript = generateStudentDialogueScript(studentName, projectTitle, topic, keyPoints);
                handleTranscriptChange(newScript);
              }}
              className="text-[11px] font-bold text-[#2D5A27] dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Regenerate Intro Script
            </button>
          </div>

          <textarea
            id="textarea-dialogue-script"
            rows={3}
            value={transcript}
            onChange={(e) => handleTranscriptChange(e.target.value)}
            placeholder="e.g. Hi, I am Maya Lin, and I am going to explain the Plant Cell structure..."
            className="w-full p-3 rounded-2xl bg-[#F4F7F5] dark:bg-[#223D23] border border-[#2D5A27]/15 text-xs text-[#1A2E1A] dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-[#2D5A27]"
          />

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-[#2D5A27]/70 dark:text-emerald-400/80">
              💡 The 3D organelle will rotate automatically while this voice-over is spoken.
            </span>
            <button
              type="button"
              onClick={handleTestPlayback}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold border transition ${
                isPlayingTest
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-[#E8F0E8] dark:bg-[#223D23] text-[#2D5A27] dark:text-emerald-200 border-[#2D5A27]/20'
              }`}
            >
              {isPlayingTest ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isPlayingTest ? 'Stop Voice' : 'Listen with Natural Voice'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Synchronized 3D Auto-Rotation Setting Checkbox */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-white/70 dark:bg-[#1A2E1A]/70 border border-[#2D5A27]/15">
        <div className="flex items-center gap-2">
          <input
            id="chk-auto-rotate-audio"
            type="checkbox"
            checked={autoRotate}
            onChange={(e) => handleAutoRotateChange(e.target.checked)}
            className="w-4 h-4 rounded-md accent-[#2D5A27] cursor-pointer"
          />
          <label htmlFor="chk-auto-rotate-audio" className="text-xs font-bold text-[#1A2E1A] dark:text-white cursor-pointer">
            Rotate 3D model slowly and continuously until student explanation gets over
          </label>
        </div>

        <span className="text-[10px] uppercase font-bold text-[#2D5A27] dark:text-emerald-400 bg-[#E8F0E8] dark:bg-[#223D23] px-2 py-0.5 rounded-md">
          Auto 360° Sync
        </span>
      </div>
    </div>
  );
};
