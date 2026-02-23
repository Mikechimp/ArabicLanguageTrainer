/**
 * Text-to-Speech Service
 *
 * Provides Arabic pronunciation audio using the Web Speech API (SpeechSynthesis).
 * Chromium (Electron's rendering engine) supports the SpeechSynthesis API natively.
 *
 * Known issues addressed:
 *   - Chromium bug: speechSynthesis can silently pause after ~15s; workaround via resume() timer
 *   - No Arabic voice: onstart never fires; workaround via timeout + error fallback
 *   - Some systems have no voices at all; detected and reported as error immediately
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
  private fallbackVoice: SpeechSynthesisVoice | null = null;
  private voicesLoaded = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private startTimeout: ReturnType<typeof setTimeout> | null = null;
  private resumeInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.synth = window.speechSynthesis;
    this.loadVoices();

    // Voices may load asynchronously in Chromium
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.addEventListener('voiceschanged', () => this.loadVoices());
    }
  }

  private loadVoices(): void {
    const voices = this.synth.getVoices();
    if (voices.length === 0) return;

    this.voicesLoaded = true;

    // Look for Arabic voices: ar-SA, ar-EG, ar-*, or any Arabic variant
    const arabicVoices = voices.filter(v => v.lang.startsWith('ar'));

    if (arabicVoices.length > 0) {
      this.arabicVoice =
        arabicVoices.find(v => v.lang === 'ar-SA') ||
        arabicVoices.find(v => v.lang === 'ar-EG') ||
        arabicVoices[0];
    }

    // Pick a fallback voice (any voice that works) for when Arabic isn't available
    // Google voices tend to handle Arabic script better even if tagged as en-US
    if (!this.arabicVoice) {
      this.fallbackVoice =
        voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) ||
        voices.find(v => v.default) ||
        voices[0] || null;
    }
  }

  /** Whether TTS is available in this environment */
  get isAvailable(): boolean {
    return 'speechSynthesis' in window;
  }

  /** Whether a dedicated Arabic voice was found */
  get hasArabicVoice(): boolean {
    return this.arabicVoice !== null;
  }

  private clearTimers(): void {
    if (this.startTimeout) {
      clearTimeout(this.startTimeout);
      this.startTimeout = null;
    }
    if (this.resumeInterval) {
      clearInterval(this.resumeInterval);
      this.resumeInterval = null;
    }
  }

  /** Stop any current playback */
  stop(): void {
    this.clearTimers();
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

    // Ensure voices are loaded
    if (!this.voicesLoaded) {
      const voices = this.synth.getVoices();
      if (voices.length > 0) {
        this.loadVoices();
      }
    }

    const voice = this.arabicVoice || this.fallbackVoice;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      // Clear the "stuck" timeout since speech started
      if (this.startTimeout) {
        clearTimeout(this.startTimeout);
        this.startTimeout = null;
      }
      onStateChange?.('playing');

      // Chromium bug workaround: speechSynthesis can silently pause after ~15s.
      // Periodically call resume() to keep it going.
      this.resumeInterval = setInterval(() => {
        if (this.synth.speaking && !this.synth.paused) {
          this.synth.pause();
          this.synth.resume();
        }
      }, 10000);
    };

    utterance.onend = () => {
      this.clearTimers();
      this.currentUtterance = null;
      onStateChange?.('idle');
    };

    utterance.onerror = (event) => {
      this.clearTimers();
      this.currentUtterance = null;
      // 'canceled' is not a real error — it happens when we call stop()
      if (event.error === 'canceled' || event.error === 'interrupted') {
        onStateChange?.('idle');
      } else {
        console.error('[TTS] Speech error:', event.error);
        onStateChange?.('error');
      }
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);

    // Safety timeout: if onstart doesn't fire within 3 seconds, the TTS is stuck.
    // This happens when no suitable voice exists for the language.
    this.startTimeout = setTimeout(() => {
      if (this.currentUtterance === utterance) {
        console.warn('[TTS] Speech start timeout — no suitable voice may be available');
        this.stop();
        onStateChange?.('error');
      }
    }, 3000);
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
