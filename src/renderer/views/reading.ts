/**
 * Reading Trainer View
 *
 * An interactive reading mode for studying Quranic passages.
 * Shows Arabic text with word-by-word breakdown, transliteration,
 * and English translation. Users can navigate between verses
 * and toggle different layers of assistance.
 */

import { View } from '../services/router';
import { ApiClient, ReadingPassage } from '../services/api-client';

export class ReadingView implements View {
  private passages: ReadingPassage[] = [];
  private currentIndex = 0;
  private showTransliteration = true;
  private showTranslation = true;
  private showWordByWord = false;
  private currentSurah: string | null = null;

  constructor(private api: ApiClient) {}

  render(): HTMLElement {
    const container = document.createElement('div');
    container.innerHTML = `
      <div class="view-header">
        <h2>Reading Trainer</h2>
        <p>Study Quranic passages with word-by-word breakdown</p>
      </div>

      <div class="filter-bar" id="surah-filter">
        <button class="filter-btn active" data-surah="all">All Passages</button>
      </div>

      <div class="reading-controls">
        <label class="toggle-label">
          <input type="checkbox" id="toggle-translit" checked>
          <span>Transliteration</span>
        </label>
        <label class="toggle-label">
          <input type="checkbox" id="toggle-translation" checked>
          <span>Translation</span>
        </label>
        <label class="toggle-label">
          <input type="checkbox" id="toggle-wbw">
          <span>Word-by-Word</span>
        </label>
      </div>

      <div id="reading-content" class="reading-container">
        <div class="card pulse" style="text-align: center; color: var(--text-muted);">Loading passages...</div>
      </div>

      <div class="reading-nav" id="reading-nav" style="display: none;">
        <button class="btn btn-secondary" id="btn-prev">Previous Ayah</button>
        <span class="reading-position" id="reading-position"></span>
        <button class="btn btn-secondary" id="btn-next">Next Ayah</button>
      </div>
    `;

    // Toggle controls
    container.querySelector('#toggle-translit')?.addEventListener('change', (e) => {
      this.showTransliteration = (e.target as HTMLInputElement).checked;
      this.renderPassage(container);
    });
    container.querySelector('#toggle-translation')?.addEventListener('change', (e) => {
      this.showTranslation = (e.target as HTMLInputElement).checked;
      this.renderPassage(container);
    });
    container.querySelector('#toggle-wbw')?.addEventListener('change', (e) => {
      this.showWordByWord = (e.target as HTMLInputElement).checked;
      this.renderPassage(container);
    });

    // Navigation
    container.querySelector('#btn-prev')?.addEventListener('click', () => {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.renderPassage(container);
      }
    });
    container.querySelector('#btn-next')?.addEventListener('click', () => {
      if (this.currentIndex < this.passages.length - 1) {
        this.currentIndex++;
        this.renderPassage(container);
      }
    });

    this.loadPassages(container);

    return container;
  }

  private async loadPassages(container: HTMLElement): Promise<void> {
    try {
      this.passages = await this.api.getReadingPassages();
      if (!this.passages || this.passages.length === 0) {
        const content = container.querySelector('#reading-content');
        if (content) content.innerHTML = '<div class="empty-state"><p>No reading passages available</p></div>';
        return;
      }
      this.buildSurahFilter(container);
      this.renderPassage(container);
    } catch (err) {
      console.error('[ReadingView] Failed to load passages:', err);
      const content = container.querySelector('#reading-content');
      if (content) content.innerHTML = `<div class="empty-state"><p>Failed to load passages</p><p style="font-size:0.8rem;color:var(--text-muted);margin-top:8px;">${err instanceof Error ? err.message : 'Unknown error'}</p></div>`;
    }
  }

  private buildSurahFilter(container: HTMLElement): void {
    const filterBar = container.querySelector('#surah-filter');
    if (!filterBar) return;

    const surahs = new Map<string, number>();
    for (const p of this.passages) {
      if (!surahs.has(p.surah)) surahs.set(p.surah, p.surahNumber);
    }

    let html = '<button class="filter-btn active" data-surah="all">All Passages</button>';
    for (const [name, num] of surahs) {
      html += `<button class="filter-btn" data-surah="${num}">${name}</button>`;
    }
    filterBar.innerHTML = html;

    filterBar.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const surah = (btn as HTMLElement).dataset.surah;
        if (surah === 'all') {
          this.currentSurah = null;
        } else {
          this.currentSurah = surah || null;
        }
        this.currentIndex = 0;
        this.renderPassage(container);
      });
    });
  }

  private getFilteredPassages(): ReadingPassage[] {
    if (!this.currentSurah) return this.passages;
    const num = parseInt(this.currentSurah, 10);
    return this.passages.filter(p => p.surahNumber === num);
  }

  private renderPassage(container: HTMLElement): void {
    const content = container.querySelector('#reading-content');
    const nav = container.querySelector('#reading-nav') as HTMLElement;
    const position = container.querySelector('#reading-position');
    const btnPrev = container.querySelector('#btn-prev') as HTMLButtonElement;
    const btnNext = container.querySelector('#btn-next') as HTMLButtonElement;
    if (!content) return;

    const filtered = this.getFilteredPassages();
    if (filtered.length === 0) {
      content.innerHTML = '<div class="empty-state"><p>No passages found</p></div>';
      if (nav) nav.style.display = 'none';
      return;
    }

    if (this.currentIndex >= filtered.length) this.currentIndex = 0;
    const passage = filtered[this.currentIndex];

    let html = `
      <div class="reading-card fade-in">
        <div class="reading-surah-label">
          Surah ${passage.surah} (${passage.surahNumber}:${passage.ayah})
        </div>
        <div class="reading-arabic">${passage.arabic}</div>
    `;

    if (this.showTransliteration) {
      html += `<div class="reading-transliteration">${passage.transliteration}</div>`;
    }

    if (this.showTranslation) {
      html += `<div class="reading-translation">${passage.translation}</div>`;
    }

    if (this.showWordByWord && passage.wordByWord.length > 0) {
      html += '<div class="wbw-container">';
      for (const word of passage.wordByWord) {
        html += `
          <div class="wbw-word">
            <span class="wbw-arabic">${word.arabic}</span>
            <span class="wbw-translit">${word.transliteration}</span>
            <span class="wbw-english">${word.english}</span>
          </div>
        `;
      }
      html += '</div>';
    }

    html += '</div>';
    content.innerHTML = html;

    // Update nav
    if (nav) nav.style.display = 'flex';
    if (position) position.textContent = `${this.currentIndex + 1} / ${filtered.length}`;
    if (btnPrev) btnPrev.disabled = this.currentIndex === 0;
    if (btnNext) btnNext.disabled = this.currentIndex === filtered.length - 1;
  }
}
