/**
 * Guided Read-Along View
 *
 * A futuristic synchronized reading experience for Quranic passages.
 * Words light up in sequence as TTS speaks, creating a live read-along
 * effect timed with neon glow highlighting.
 *
 * Features:
 *   - Word-by-word illumination synced to TTS playback
 *   - Adjustable speech rate (0.3x–1.0x) for learning at your own pace
 *   - Futuristic neon glow effects on active/completed words
 *   - Word-by-word transliteration and translation shown below
 *   - Surah filtering and ayah navigation
 */

import { View } from '../services/router';
import { ApiClient, ReadingPassage } from '../services/api-client';
import { getTTSService, TTSState } from '../services/tts-service';

type PlaybackState = 'stopped' | 'loading' | 'playing';

const SPEED_PRESETS = [
  { label: '0.3x', value: 0.3 },
  { label: '0.5x', value: 0.5 },
  { label: '0.7x', value: 0.7 },
  { label: '1.0x', value: 1.0 },
];

export class GuidedReaderView implements View {
  private passages: ReadingPassage[] = [];
  private currentIndex = 0;
  private currentSurah: string | null = null;
  private tts = getTTSService();
  private speechRate = 0.5;
  private playbackState: PlaybackState = 'stopped';
  private activeWordIndex = -1;
  private wordElements: HTMLElement[] = [];
  private containerRef: HTMLElement | null = null;

  constructor(private api: ApiClient) {}

  render(): HTMLElement {
    const container = document.createElement('div');
    container.classList.add('guided-reader-root');
    this.containerRef = container;

    container.innerHTML = `
      <div class="view-header">
        <h2>Guided Read-Along</h2>
        <p>Follow the illuminated words as they are spoken — adjust speed to learn at your pace</p>
      </div>

      <div class="filter-bar" id="gr-surah-filter">
        <button class="filter-btn active" data-surah="all">All Passages</button>
      </div>

      <div id="gr-stage" class="gr-stage">
        <div class="card pulse" style="text-align:center;color:var(--text-muted);">Loading passages...</div>
      </div>
    `;

    this.loadPassages(container);
    return container;
  }

  destroy(): void {
    this.tts.stop();
    this.playbackState = 'stopped';
    this.containerRef = null;
  }

  // ── Data Loading ─────────────────────────────────────────────────

  private async loadPassages(container: HTMLElement): Promise<void> {
    try {
      this.passages = await this.api.getReadingPassages();
      if (!this.passages || this.passages.length === 0) {
        this.renderEmpty(container, 'No reading passages available');
        return;
      }
      this.buildSurahFilter(container);
      this.renderStage(container);
    } catch (err) {
      console.error('[GuidedReader] Failed to load passages:', err);
      this.renderEmpty(container, `Failed to load passages: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  private renderEmpty(container: HTMLElement, msg: string): void {
    const stage = container.querySelector('#gr-stage');
    if (stage) stage.innerHTML = `<div class="empty-state"><p>${msg}</p></div>`;
  }

  // ── Surah Filter ─────────────────────────────────────────────────

  private buildSurahFilter(container: HTMLElement): void {
    const bar = container.querySelector('#gr-surah-filter');
    if (!bar) return;

    const surahs = new Map<string, number>();
    for (const p of this.passages) {
      if (!surahs.has(p.surah)) surahs.set(p.surah, p.surahNumber);
    }

    let html = '<button class="filter-btn active" data-surah="all">All Passages</button>';
    for (const [name, num] of surahs) {
      html += `<button class="filter-btn" data-surah="${num}">${name}</button>`;
    }
    bar.innerHTML = html;

    bar.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        bar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const surah = (btn as HTMLElement).dataset.surah;
        this.currentSurah = surah === 'all' ? null : (surah || null);
        this.currentIndex = 0;
        this.stopPlayback();
        this.renderStage(container);
      });
    });
  }

  private getFilteredPassages(): ReadingPassage[] {
    if (!this.currentSurah) return this.passages;
    const num = parseInt(this.currentSurah, 10);
    return this.passages.filter(p => p.surahNumber === num);
  }

  // ── Main Stage ───────────────────────────────────────────────────

  private renderStage(container: HTMLElement): void {
    const stage = container.querySelector('#gr-stage');
    if (!stage) return;

    const filtered = this.getFilteredPassages();
    if (filtered.length === 0) {
      stage.innerHTML = '<div class="empty-state"><p>No passages found</p></div>';
      return;
    }
    if (this.currentIndex >= filtered.length) this.currentIndex = 0;
    const passage = filtered[this.currentIndex];

    // Split Arabic text into individual words
    const words = passage.arabic.split(/\s+/).filter(w => w.length > 0);

    stage.innerHTML = `
      <div class="gr-card fade-in">
        <div class="gr-surah-label">
          Surah ${passage.surah} (${passage.surahNumber}:${passage.ayah})
        </div>

        <div class="gr-arabic-stage" id="gr-arabic-stage">
          ${words.map((w, i) => `<span class="gr-word gr-word-upcoming" data-word-index="${i}">${w}</span>`).join('<span class="gr-word-space"> </span>')}
        </div>

        <div class="gr-scanline" id="gr-scanline"></div>

        <div class="gr-controls">
          <div class="gr-speed-control">
            <span class="gr-speed-label">Speed</span>
            <div class="gr-speed-buttons" id="gr-speed-buttons">
              ${SPEED_PRESETS.map(p => `
                <button class="gr-speed-btn ${p.value === this.speechRate ? 'active' : ''}" data-rate="${p.value}">${p.label}</button>
              `).join('')}
            </div>
          </div>

          <div class="gr-playback-controls">
            <button class="gr-play-btn" id="gr-play-btn" title="Play read-along">
              <svg class="gr-play-icon" id="gr-icon-play" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <svg class="gr-play-icon" id="gr-icon-stop" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none" style="display:none">
                <rect x="4" y="4" width="16" height="16" rx="2"/>
              </svg>
              <svg class="gr-play-icon gr-icon-loading" id="gr-icon-loading" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none">
                <circle cx="12" cy="12" r="10" stroke-dasharray="31.4" stroke-dashoffset="10"/>
              </svg>
            </button>
          </div>
        </div>

        ${passage.transliteration ? `<div class="gr-transliteration">${passage.transliteration}</div>` : ''}
        ${passage.translation ? `<div class="gr-translation">${passage.translation}</div>` : ''}

        ${passage.wordByWord && passage.wordByWord.length > 0 ? `
          <div class="gr-wbw-section" id="gr-wbw-section">
            <h4 class="gr-wbw-title">Word-by-Word Breakdown</h4>
            <div class="gr-wbw-container">
              ${passage.wordByWord.map((w, i) => `
                <div class="gr-wbw-word ${i === 0 ? '' : ''}" data-wbw-index="${i}">
                  <span class="gr-wbw-arabic">${w.arabic}</span>
                  <span class="gr-wbw-translit">${w.transliteration}</span>
                  <span class="gr-wbw-english">${w.english}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>

      <div class="gr-nav">
        <button class="btn btn-secondary" id="gr-btn-prev" ${this.currentIndex === 0 ? 'disabled' : ''}>Previous Ayah</button>
        <span class="gr-position">${this.currentIndex + 1} / ${filtered.length}</span>
        <button class="btn btn-secondary" id="gr-btn-next" ${this.currentIndex === filtered.length - 1 ? 'disabled' : ''}>Next Ayah</button>
      </div>
    `;

    // Cache word element references
    this.wordElements = Array.from(stage.querySelectorAll('.gr-word[data-word-index]'));
    this.activeWordIndex = -1;

    this.attachStageHandlers(container, passage);
  }

  // ── Event Handlers ───────────────────────────────────────────────

  private attachStageHandlers(container: HTMLElement, passage: ReadingPassage): void {
    // Speed buttons
    container.querySelectorAll('.gr-speed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const rate = parseFloat((btn as HTMLElement).dataset.rate || '0.5');
        this.speechRate = rate;
        container.querySelectorAll('.gr-speed-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        // If currently playing, restart with new speed
        if (this.playbackState === 'playing') {
          this.stopPlayback();
          setTimeout(() => this.startPlayback(container, passage), 100);
        }
      });
    });

    // Play/Stop button
    const playBtn = container.querySelector('#gr-play-btn');
    playBtn?.addEventListener('click', () => {
      if (this.playbackState === 'playing' || this.playbackState === 'loading') {
        this.stopPlayback();
        this.updatePlaybackUI(container, 'stopped');
        this.resetWordHighlights();
      } else {
        this.startPlayback(container, passage);
      }
    });

    // Navigation
    container.querySelector('#gr-btn-prev')?.addEventListener('click', () => {
      const filtered = this.getFilteredPassages();
      if (this.currentIndex > 0) {
        this.stopPlayback();
        this.currentIndex--;
        this.renderStage(container);
      }
    });
    container.querySelector('#gr-btn-next')?.addEventListener('click', () => {
      const filtered = this.getFilteredPassages();
      if (this.currentIndex < filtered.length - 1) {
        this.stopPlayback();
        this.currentIndex++;
        this.renderStage(container);
      }
    });

    // Click on individual words to hear them
    this.wordElements.forEach(el => {
      el.addEventListener('click', () => {
        if (this.playbackState !== 'playing') {
          const word = el.textContent || '';
          this.tts.speak(word);
          // Quick flash effect
          el.classList.add('gr-word-flash');
          setTimeout(() => el.classList.remove('gr-word-flash'), 600);
        }
      });
    });
  }

  // ── Playback ─────────────────────────────────────────────────────

  private startPlayback(container: HTMLElement, passage: ReadingPassage): void {
    this.resetWordHighlights();
    this.playbackState = 'loading';
    this.updatePlaybackUI(container, 'loading');

    const text = passage.arabic;
    const words = text.split(/\s+/).filter(w => w.length > 0);

    // Build a char-index → word-index map
    const wordCharRanges: { start: number; end: number }[] = [];
    let cursor = 0;
    for (const w of words) {
      const idx = text.indexOf(w, cursor);
      wordCharRanges.push({ start: idx, end: idx + w.length });
      cursor = idx + w.length;
    }

    this.tts.speakWithTracking(
      text,
      this.speechRate,
      (charIndex: number, _charLength: number) => {
        // Find which word this character index belongs to
        let wordIdx = -1;
        for (let i = 0; i < wordCharRanges.length; i++) {
          if (charIndex >= wordCharRanges[i].start && charIndex < wordCharRanges[i].end) {
            wordIdx = i;
            break;
          }
          // Also match if charIndex is between this word's start and the next word's start
          if (i < wordCharRanges.length - 1 && charIndex >= wordCharRanges[i].start && charIndex < wordCharRanges[i + 1].start) {
            wordIdx = i;
            break;
          }
        }
        // If charIndex is past all known words, highlight the last word
        if (wordIdx === -1 && wordCharRanges.length > 0 && charIndex >= wordCharRanges[wordCharRanges.length - 1].start) {
          wordIdx = wordCharRanges.length - 1;
        }

        if (wordIdx >= 0 && wordIdx !== this.activeWordIndex) {
          this.highlightWord(wordIdx, container);
        }
      },
      (state: TTSState) => {
        switch (state) {
          case 'playing':
            this.playbackState = 'playing';
            this.updatePlaybackUI(container, 'playing');
            break;
          case 'idle':
            this.playbackState = 'stopped';
            this.updatePlaybackUI(container, 'stopped');
            // Mark all words as completed when playback ends naturally
            this.completeAllWords();
            break;
          case 'error':
            this.playbackState = 'stopped';
            this.updatePlaybackUI(container, 'stopped');
            this.resetWordHighlights();
            break;
        }
      },
    );
  }

  private stopPlayback(): void {
    this.tts.stop();
    this.playbackState = 'stopped';
  }

  // ── Word Highlighting ────────────────────────────────────────────

  private highlightWord(index: number, container: HTMLElement): void {
    // Mark previously active word as completed
    if (this.activeWordIndex >= 0 && this.activeWordIndex < this.wordElements.length) {
      const prev = this.wordElements[this.activeWordIndex];
      prev.classList.remove('gr-word-active', 'gr-word-upcoming');
      prev.classList.add('gr-word-completed');
    }

    // Mark all words before the active one as completed too
    for (let i = 0; i < index; i++) {
      const el = this.wordElements[i];
      if (el) {
        el.classList.remove('gr-word-active', 'gr-word-upcoming');
        el.classList.add('gr-word-completed');
      }
    }

    // Set new active word
    this.activeWordIndex = index;
    if (index < this.wordElements.length) {
      const active = this.wordElements[index];
      active.classList.remove('gr-word-upcoming', 'gr-word-completed');
      active.classList.add('gr-word-active');

      // Also highlight the corresponding word-by-word breakdown entry
      this.highlightWbw(index, container);
    }
  }

  private highlightWbw(wordIndex: number, container: HTMLElement): void {
    const wbwWords = container.querySelectorAll('.gr-wbw-word');
    wbwWords.forEach((el, i) => {
      el.classList.remove('gr-wbw-active', 'gr-wbw-completed');
      if (i === wordIndex) {
        el.classList.add('gr-wbw-active');
      } else if (i < wordIndex) {
        el.classList.add('gr-wbw-completed');
      }
    });
  }

  private completeAllWords(): void {
    for (const el of this.wordElements) {
      el.classList.remove('gr-word-active', 'gr-word-upcoming');
      el.classList.add('gr-word-completed');
    }
    if (this.containerRef) {
      this.containerRef.querySelectorAll('.gr-wbw-word').forEach(el => {
        el.classList.remove('gr-wbw-active');
        el.classList.add('gr-wbw-completed');
      });
    }
  }

  private resetWordHighlights(): void {
    this.activeWordIndex = -1;
    for (const el of this.wordElements) {
      el.classList.remove('gr-word-active', 'gr-word-completed', 'gr-word-flash');
      el.classList.add('gr-word-upcoming');
    }
    if (this.containerRef) {
      this.containerRef.querySelectorAll('.gr-wbw-word').forEach(el => {
        el.classList.remove('gr-wbw-active', 'gr-wbw-completed');
      });
    }
  }

  // ── UI State ─────────────────────────────────────────────────────

  private updatePlaybackUI(container: HTMLElement, state: 'stopped' | 'loading' | 'playing'): void {
    const iconPlay = container.querySelector('#gr-icon-play') as HTMLElement;
    const iconStop = container.querySelector('#gr-icon-stop') as HTMLElement;
    const iconLoading = container.querySelector('#gr-icon-loading') as HTMLElement;
    const playBtn = container.querySelector('#gr-play-btn') as HTMLElement;
    if (!iconPlay || !iconStop || !iconLoading || !playBtn) return;

    iconPlay.style.display = 'none';
    iconStop.style.display = 'none';
    iconLoading.style.display = 'none';

    playBtn.classList.remove('gr-play-btn-active', 'gr-play-btn-loading');

    switch (state) {
      case 'playing':
        iconStop.style.display = 'block';
        playBtn.classList.add('gr-play-btn-active');
        playBtn.title = 'Stop read-along';
        break;
      case 'loading':
        iconLoading.style.display = 'block';
        playBtn.classList.add('gr-play-btn-loading');
        playBtn.title = 'Loading...';
        break;
      default:
        iconPlay.style.display = 'block';
        playBtn.title = 'Play read-along';
        break;
    }
  }
}
