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

/** Callback fired when TTS reaches a new word boundary */
export type TTSWordBoundaryCallback = (charIndex: number, charLength: number) => void;

export interface VoiceDiagnostics {
  available: boolean;
  voicesLoaded: boolean;
  totalVoices: number;
  arabicVoices: { name: string; lang: string; localService: boolean }[];
  selectedVoice: { name: string; lang: string } | null;
  fallbackVoice: { name: string; lang: string } | null;
  allVoices: { name: string; lang: string; localService: boolean }[];
}

export class TTSService {
  private synth: SpeechSynthesis;
  private arabicVoice: SpeechSynthesisVoice | null = null;
  private arabicVoices: SpeechSynthesisVoice[] = [];
  private fallbackVoice: SpeechSynthesisVoice | null = null;
  private voicesLoaded = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private startTimeout: ReturnType<typeof setTimeout> | null = null;
  private resumeInterval: ReturnType<typeof setInterval> | null = null;
  private pendingSpeak: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.synth = window.speechSynthesis;
    this.loadVoices();

    // Voices may load asynchronously in Chromium
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.addEventListener('voiceschanged', () => this.loadVoices());
    }

    // Some Chromium builds never fire voiceschanged — poll as a fallback
    if (!this.voicesLoaded) {
      let attempts = 0;
      const poll = setInterval(() => {
        attempts++;
        this.loadVoices();
        if (this.voicesLoaded || attempts >= 20) {
          clearInterval(poll);
        }
      }, 250);
    }
  }

  private loadVoices(): void {
    const voices = this.synth.getVoices();
    if (voices.length === 0) return;

    this.voicesLoaded = true;
    console.log(`[TTS] Found ${voices.length} voices`);

    // Normalize lang codes for matching: ar-SA, ar_SA, ar → all count as Arabic
    const isArabicVoice = (v: SpeechSynthesisVoice): boolean => {
      const lang = v.lang.toLowerCase().replace(/_/g, '-');
      return lang.startsWith('ar') ||
             v.name.toLowerCase().includes('arabic') ||
             v.name.toLowerCase().includes('العربية');
    };

    // Collect all Arabic-capable voices
    this.arabicVoices = voices.filter(isArabicVoice);
    console.log(`[TTS] Arabic voices found: ${this.arabicVoices.length}`);
    for (const v of this.arabicVoices) {
      console.log(`[TTS]   → "${v.name}" lang=${v.lang} local=${v.localService}`);
    }

    if (this.arabicVoices.length > 0) {
      const normLang = (v: SpeechSynthesisVoice) => v.lang.toLowerCase().replace(/_/g, '-');
      this.arabicVoice =
        this.arabicVoices.find(v => normLang(v) === 'ar-sa') ||
        this.arabicVoices.find(v => normLang(v) === 'ar-eg') ||
        this.arabicVoices.find(v => normLang(v).startsWith('ar-')) ||
        this.arabicVoices.find(v => normLang(v) === 'ar') ||
        this.arabicVoices[0];

      console.log(`[TTS] Selected Arabic voice: "${this.arabicVoice.name}" (${this.arabicVoice.lang})`);
    }

    // Always pick a fallback voice even if Arabic is found, in case it fails at runtime
    this.fallbackVoice =
      voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) ||
      voices.find(v => v.default) ||
      voices[0] || null;

    if (this.fallbackVoice) {
      console.log(`[TTS] Fallback voice: "${this.fallbackVoice.name}" (${this.fallbackVoice.lang})`);
    }
  }

  /** Get diagnostic info about available voices for debugging */
  getDiagnostics(): VoiceDiagnostics {
    const voices = this.synth.getVoices();
    return {
      available: this.isAvailable,
      voicesLoaded: this.voicesLoaded,
      totalVoices: voices.length,
      arabicVoices: this.arabicVoices.map(v => ({
        name: v.name, lang: v.lang, localService: v.localService,
      })),
      selectedVoice: this.arabicVoice
        ? { name: this.arabicVoice.name, lang: this.arabicVoice.lang }
        : null,
      fallbackVoice: this.fallbackVoice
        ? { name: this.fallbackVoice.name, lang: this.fallbackVoice.lang }
        : null,
      allVoices: voices.map(v => ({
        name: v.name, lang: v.lang, localService: v.localService,
      })),
    };
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
    if (this.pendingSpeak) {
      clearTimeout(this.pendingSpeak);
      this.pendingSpeak = null;
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
   * Build a priority-ordered list of voices to try.
   * Selected Arabic voice first, then other Arabic voices, then fallback.
   */
  private getVoiceCandidates(): SpeechSynthesisVoice[] {
    const candidates: SpeechSynthesisVoice[] = [];
    if (this.arabicVoice) candidates.push(this.arabicVoice);
    for (const v of this.arabicVoices) {
      if (v !== this.arabicVoice) candidates.push(v);
    }
    if (this.fallbackVoice && !candidates.includes(this.fallbackVoice)) {
      candidates.push(this.fallbackVoice);
    }
    return candidates;
  }

  /**
   * Internal: attempt to speak with a specific voice. Returns the utterance.
   * On timeout, calls `onRetry` so the caller can try the next voice.
   */
  private attemptSpeak(
    text: string,
    voice: SpeechSynthesisVoice | null,
    rate: number,
    onStateChange: TTSStateCallback | undefined,
    onRetry: () => void,
  ): void {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    if (voice) {
      utterance.voice = voice;
      console.log(`[TTS] Trying voice: "${voice.name}" (${voice.lang})`);
    }

    utterance.onstart = () => {
      if (this.startTimeout) {
        clearTimeout(this.startTimeout);
        this.startTimeout = null;
      }
      onStateChange?.('playing');

      // Chromium bug workaround: speechSynthesis can silently pause after ~15s.
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
      if (event.error === 'canceled' || event.error === 'interrupted') {
        onStateChange?.('idle');
      } else {
        console.error(`[TTS] Speech error with voice "${voice?.name}":`, event.error);
        // Try the next voice instead of immediately failing
        onRetry();
      }
    };

    this.currentUtterance = utterance;

    this.pendingSpeak = setTimeout(() => {
      this.pendingSpeak = null;
      this.synth.resume();
      this.synth.speak(utterance);
      setTimeout(() => {
        if (this.synth.paused) {
          this.synth.resume();
        }
      }, 100);
    }, 50);

    // If onstart doesn't fire within 3s, this voice isn't working — try next
    this.startTimeout = setTimeout(() => {
      if (this.currentUtterance === utterance) {
        console.warn(`[TTS] Voice "${voice?.name}" timed out — trying next voice`);
        this.synth.cancel();
        this.clearTimers();
        this.currentUtterance = null;
        onRetry();
      }
    }, 3000);
  }

  /**
   * Speak the given Arabic text.
   * Tries each available Arabic voice in priority order, falling back
   * automatically if a voice doesn't start within 3 seconds.
   *
   * @param text Arabic text to pronounce
   * @param onStateChange Callback for state changes (loading, playing, idle, error)
   */
  speak(text: string, onStateChange?: TTSStateCallback): void {
    if (!this.isAvailable) {
      onStateChange?.('error');
      return;
    }

    this.stop();
    onStateChange?.('loading');

    if (!this.voicesLoaded) {
      const voices = this.synth.getVoices();
      if (voices.length > 0) {
        this.loadVoices();
      }
    }

    const candidates = this.getVoiceCandidates();
    let attempt = 0;

    const tryNext = () => {
      if (attempt >= candidates.length) {
        // All voices failed — try once with no explicit voice (let browser pick)
        if (attempt === candidates.length) {
          attempt++;
          console.warn('[TTS] All voices failed — trying browser default');
          this.attemptSpeak(text, null, 0.85, onStateChange, () => {
            console.error('[TTS] All voice candidates exhausted');
            this.stop();
            onStateChange?.('error');
          });
        } else {
          console.error('[TTS] All voice candidates exhausted');
          this.stop();
          onStateChange?.('error');
        }
        return;
      }
      this.attemptSpeak(text, candidates[attempt], 0.85, onStateChange, () => {
        attempt++;
        tryNext();
      });
    };

    tryNext();
  }

  /**
   * Speak with word boundary tracking for synchronized highlighting.
   * Uses SpeechSynthesis onboundary events when available, with a
   * timer-based fallback that estimates word timing from text length.
   * Tries multiple voice candidates if the first one fails.
   *
   * @param text Arabic text to speak
   * @param rate Speech rate (0.3 - 1.0)
   * @param onWordBoundary Called when TTS advances to a new word
   * @param onStateChange Called when playback state changes
   */
  speakWithTracking(
    text: string,
    rate: number,
    onWordBoundary: TTSWordBoundaryCallback,
    onStateChange?: TTSStateCallback,
  ): void {
    if (!this.isAvailable) {
      onStateChange?.('error');
      return;
    }

    this.stop();
    onStateChange?.('loading');

    if (!this.voicesLoaded) {
      const voices = this.synth.getVoices();
      if (voices.length > 0) {
        this.loadVoices();
      }
    }

    // Build word offset map for fallback timing
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const wordOffsets: { start: number; length: number }[] = [];
    let cursor = 0;
    for (const w of words) {
      const idx = text.indexOf(w, cursor);
      wordOffsets.push({ start: idx, length: w.length });
      cursor = idx + w.length;
    }

    const clampedRate = Math.max(0.1, Math.min(rate, 1.0));
    const candidates = this.getVoiceCandidates();
    let attempt = 0;

    const tryVoice = (voice: SpeechSynthesisVoice | null) => {
      // Track whether real boundary events fire
      let boundaryFired = false;
      let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
      let fallbackTimers: ReturnType<typeof setTimeout>[] = [];

      const cleanupFallback = () => {
        if (fallbackTimer) { clearTimeout(fallbackTimer); fallbackTimer = null; }
        for (const t of fallbackTimers) clearTimeout(t);
        fallbackTimers = [];
      };

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      utterance.rate = clampedRate;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      if (voice) {
        utterance.voice = voice;
        console.log(`[TTS:tracked] Trying voice: "${voice.name}" (${voice.lang}) at rate ${clampedRate}`);
      }

      utterance.onboundary = (event: SpeechSynthesisEvent) => {
        if (event.name === 'word') {
          boundaryFired = true;
          cleanupFallback();
          onWordBoundary(event.charIndex, event.charLength || 0);
        }
      };

      utterance.onstart = () => {
        if (this.startTimeout) {
          clearTimeout(this.startTimeout);
          this.startTimeout = null;
        }
        onStateChange?.('playing');

        // Fire the first word boundary immediately
        if (wordOffsets.length > 0) {
          onWordBoundary(wordOffsets[0].start, wordOffsets[0].length);
        }

        // Fallback: if no boundary events fire within 500ms, estimate timing
        fallbackTimer = setTimeout(() => {
          if (boundaryFired) return;

          const charsPerSecond = 5 * clampedRate;
          const totalChars = text.replace(/\s+/g, '').length;
          if (totalChars === 0) return;
          const msPerChar = (totalChars / charsPerSecond) * 1000 / totalChars;

          for (let i = 1; i < wordOffsets.length; i++) {
            const prevChars = wordOffsets.slice(0, i).reduce((sum, w) => sum + w.length, 0);
            const delay = prevChars * msPerChar;
            const wo = wordOffsets[i];
            const timer = setTimeout(() => {
              if (this.currentUtterance === utterance) {
                onWordBoundary(wo.start, wo.length);
              }
            }, delay);
            fallbackTimers.push(timer);
          }
        }, 500);

        // Chromium resume workaround
        this.resumeInterval = setInterval(() => {
          if (this.synth.speaking && !this.synth.paused) {
            this.synth.pause();
            this.synth.resume();
          }
        }, 10000);
      };

      utterance.onend = () => {
        cleanupFallback();
        this.clearTimers();
        this.currentUtterance = null;
        onStateChange?.('idle');
      };

      utterance.onerror = (event) => {
        cleanupFallback();
        this.clearTimers();
        this.currentUtterance = null;
        if (event.error === 'canceled' || event.error === 'interrupted') {
          onStateChange?.('idle');
        } else {
          console.error(`[TTS:tracked] Error with voice "${voice?.name}":`, event.error);
          tryNext();
        }
      };

      this.currentUtterance = utterance;

      this.pendingSpeak = setTimeout(() => {
        this.pendingSpeak = null;
        this.synth.resume();
        this.synth.speak(utterance);
        setTimeout(() => {
          if (this.synth.paused) this.synth.resume();
        }, 100);
      }, 50);

      // If this voice doesn't start within 3s, try the next one
      this.startTimeout = setTimeout(() => {
        if (this.currentUtterance === utterance) {
          console.warn(`[TTS:tracked] Voice "${voice?.name}" timed out`);
          cleanupFallback();
          this.synth.cancel();
          this.clearTimers();
          this.currentUtterance = null;
          tryNext();
        }
      }, 3000);
    };

    const tryNext = () => {
      if (attempt >= candidates.length) {
        // Last resort: no explicit voice
        if (attempt === candidates.length) {
          attempt++;
          console.warn('[TTS:tracked] All voices failed — trying browser default');
          tryVoice(null);
        } else {
          console.error('[TTS:tracked] All voice candidates exhausted');
          this.stop();
          onStateChange?.('error');
        }
        return;
      }
      const voice = candidates[attempt];
      attempt++;
      tryVoice(voice);
    };

    tryNext();
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
