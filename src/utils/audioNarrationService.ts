// Audio Narration & Speech Synthesis Manager for BioAR Board
// Handles playing student voice-over audio files/recordings and browser SpeechSynthesis dialogue

export interface AudioPlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  progress: number; // 0 to 1
  sourceType: 'audio_file' | 'speech_synth';
}

type StateListener = (state: AudioPlaybackState) => void;

class AudioNarrationController {
  private audioElement: HTMLAudioElement | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private stateListeners: Set<StateListener> = new Set();
  private timerInterval: number | null = null;
  private synthStartTime = 0;
  private synthEstimatedDuration = 10;
  private currentState: AudioPlaybackState = {
    isPlaying: false,
    isPaused: false,
    currentTime: 0,
    duration: 0,
    progress: 0,
    sourceType: 'audio_file',
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioElement = new Audio();
      this.audioElement.addEventListener('timeupdate', () => this.handleAudioTimeUpdate());
      this.audioElement.addEventListener('ended', () => this.handleAudioEnded());
      this.audioElement.addEventListener('pause', () => this.handleAudioPaused());
      this.audioElement.addEventListener('play', () => this.handleAudioPlay());
      this.audioElement.addEventListener('loadedmetadata', () => {
        if (this.audioElement) {
          this.updateState({
            duration: this.audioElement.duration || 0,
          });
        }
      });
    }
  }

  public subscribe(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    listener(this.currentState);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  private notify() {
    this.stateListeners.forEach((l) => l(this.currentState));
  }

  private updateState(partial: Partial<AudioPlaybackState>) {
    this.currentState = { ...this.currentState, ...partial };
    this.notify();
  }

  public play(options: {
    audioUrl?: string;
    transcript?: string;
    studentName?: string;
    onEnd?: () => void;
  }) {
    this.stop();

    // 1. If audio file / data URL is present, use HTMLAudioElement
    if (options.audioUrl && options.audioUrl.trim().length > 0) {
      if (!this.audioElement) return;
      this.audioElement.src = options.audioUrl;
      this.audioElement.currentTime = 0;
      this.audioElement
        .play()
        .then(() => {
          this.updateState({
            isPlaying: true,
            isPaused: false,
            sourceType: 'audio_file',
          });
        })
        .catch((e) => {
          console.warn('Audio element play error, falling back to speech synthesis:', e);
          if (options.transcript) {
            this.playSpeechSynthesis(options.transcript, options.onEnd);
          }
        });
      return;
    }

    // 2. If no audio URL but transcript exists, use Web Speech Synthesis
    if (options.transcript && options.transcript.trim().length > 0) {
      this.playSpeechSynthesis(options.transcript, options.onEnd);
    }
  }

  private playSpeechSynthesis(text: string, onEndCallback?: () => void) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported on this browser.');
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; // Clear natural presentation pace
    utterance.pitch = 1.05;

    // Pick best natural voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(
      (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Karen'))
    ) || voices.find((v) => v.lang.startsWith('en'));

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    // Estimate duration based on word count (~130 words per minute)
    const wordCount = text.trim().split(/\s+/).length;
    const estDuration = Math.max(3, Math.round((wordCount / 130) * 60));
    this.synthEstimatedDuration = estDuration;
    this.synthStartTime = Date.now();

    utterance.onstart = () => {
      this.updateState({
        isPlaying: true,
        isPaused: false,
        sourceType: 'speech_synth',
        currentTime: 0,
        duration: estDuration,
        progress: 0,
      });

      this.startSynthTimer(onEndCallback);
    };

    utterance.onend = () => {
      this.stopSynthTimer();
      this.updateState({
        isPlaying: false,
        isPaused: false,
        currentTime: this.synthEstimatedDuration,
        progress: 1,
      });
      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = (err) => {
      console.warn('Speech synthesis notice:', err);
      this.stopSynthTimer();
      this.updateState({ isPlaying: false });
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  private startSynthTimer(onEndCallback?: () => void) {
    this.stopSynthTimer();
    this.timerInterval = window.setInterval(() => {
      if (!this.currentState.isPlaying || this.currentState.isPaused) return;
      const elapsedSec = (Date.now() - this.synthStartTime) / 1000;
      const progress = Math.min(1, elapsedSec / this.synthEstimatedDuration);

      this.updateState({
        currentTime: Math.min(elapsedSec, this.synthEstimatedDuration),
        progress,
      });

      if (progress >= 1) {
        this.stopSynthTimer();
      }
    }, 100);
  }

  private stopSynthTimer() {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  public pause() {
    if (this.currentState.sourceType === 'audio_file' && this.audioElement) {
      this.audioElement.pause();
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
    this.updateState({ isPlaying: false, isPaused: true });
  }

  public resume() {
    if (this.currentState.sourceType === 'audio_file' && this.audioElement) {
      this.audioElement.play().catch(() => {});
    } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
    this.updateState({ isPlaying: true, isPaused: false });
  }

  public stop() {
    this.stopSynthTimer();
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.updateState({
      isPlaying: false,
      isPaused: false,
      currentTime: 0,
      progress: 0,
    });
  }

  private handleAudioTimeUpdate() {
    if (!this.audioElement) return;
    const cur = this.audioElement.currentTime;
    const dur = this.audioElement.duration || 1;
    this.updateState({
      currentTime: cur,
      duration: dur,
      progress: Math.min(1, cur / dur),
    });
  }

  private handleAudioEnded() {
    this.updateState({
      isPlaying: false,
      isPaused: false,
      currentTime: this.currentState.duration,
      progress: 1,
    });
  }

  private handleAudioPaused() {
    this.updateState({ isPlaying: false, isPaused: true });
  }

  private handleAudioPlay() {
    this.updateState({ isPlaying: true, isPaused: false });
  }
}

export const audioNarrationManager = new AudioNarrationController();

// Helper to construct natural dialogue script template for student
export function generateStudentDialogueScript(
  studentName: string,
  title: string,
  topic: string,
  keyPoints?: string[]
): string {
  const intro = `Hi, I am ${studentName || 'the student researcher'}, and today I am going to explain our biology project on ${title || topic}!`;
  let body = `As the 3D model rotates, observe the intricate internal organelles and spatial architecture.`;
  if (keyPoints && keyPoints.length > 0) {
    const highlights = keyPoints.slice(0, 2).join(' Furthermore, ');
    body = `Key findings: ${highlights}.`;
  }
  const conclusion = `You can zoom in, dissect internal layers, and tap any labeled organelle to learn its cellular function!`;
  return `${intro} ${body} ${conclusion}`;
}
