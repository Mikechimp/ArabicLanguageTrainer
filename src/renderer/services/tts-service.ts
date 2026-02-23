/**
 * Text-to-Speech Service
 *
 * Provides Arabic pronunciation audio using the Web Speech API (SpeechSynthesis).
 * Chromium (Electron's rendering engine) supports the SpeechSynthesis API natively.
 *
 * States:
 *   - idle: No audio playing
 *   - loading: Voice is being prepared
 *   - playing: Audio is currently playing
 *   - error: TTS not available or failed
 */

export type TTSState = 'idle' | 'loading' | 'playing' | 'error';

export type TTSStateCallback = (state: TTSState) => void;

export class TTSService {
  private synth: SpeechSynthesis;
  private arabicVoice: SpeechSynthesisVoice | null = null;
  private voicesLoaded = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.synth = window.speechSynthesis;
    this.loadVoices();

    // Voices may load asynchronously
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.addEventListener('voiceschanged', () => this.loadVoices());
    }
  }

  private loadVoices(): void {
    const voices = this.synth.getVoices();
    if (voices.length === 0) return;

    this.voicesLoaded = true;

    // Prefer Arabic voices, look for ar-SA, ar-EG, ar, or any Arabic variant
    const arabicVoices = voices.filter(v => v.lang.startsWith('ar'));

    if (arabicVoices.length > 0) {
      // Prefer ar-SA (Saudi/MSA) first, then ar-EG, then any Arabic
      this.arabicVoice =
        arabicVoices.find(v => v.lang === 'ar-SA') ||
        arabicVoices.find(v => v.lang === 'ar-EG') ||
        arabicVoices[0];
    }
  }

  /** Whether TTS is available in this environment */
  get isAvailable(): boolean {
    return 'speechSynthesis' in window;
  }

  /** Stop any current playback */
  stop(): void {
    if (this.synth.speaking || this.synth.pending) {
      this.synth.cancel();
    }
    this.currentUtterance = null;
  }

  /**
   * Speak the given Arabic text.
   * @param text Arabic text to pronounce
   * @param onStateChange Callback for state changes (loading, playing, idle, error)
   */
  speak(text: string, onStateChange?: TTSStateCallback): void {
    if (!this.isAvailable) {
      onStateChange?.('error');
      return;
    }

    // Stop any current playback
    this.stop();
    onStateChange?.('loading');

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.8; // Slightly slower for learning
    utterance.pitch = 1.0;

    if (this.arabicVoice) {
      utterance.voice = this.arabicVoice;
    }

    utterance.onstart = () => {
      onStateChange?.('playing');
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      onStateChange?.('idle');
    };

    utterance.onerror = (event) => {
      this.currentUtterance = null;
      // 'canceled' is not a real error — it happens when we call stop()
      if (event.error === 'canceled') {
        onStateChange?.('idle');
      } else {
        console.error('[TTS] Speech error:', event.error);
        onStateChange?.('error');
      }
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }
}

/** Singleton TTS instance shared across views */
let _instance: TTSService | null = null;

export function getTTSService(): TTSService {
  if (!_instance) {
    _instance = new TTSService();
  }
  return _instance;
}
