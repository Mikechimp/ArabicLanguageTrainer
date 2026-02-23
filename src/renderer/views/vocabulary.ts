/**
 * Vocabulary View
 *
 * Displays all vocabulary items in a filterable table.
 * Shows Arabic text, transliteration, English translation, and category.
 * Includes pronunciation playback via TTS for each word.
 */

import { View } from '../services/router';
import { ApiClient, VocabularyItem } from '../services/api-client';
import { getTTSService, TTSState } from '../services/tts-service';

export class VocabularyView implements View {
  private allVocab: VocabularyItem[] = [];
  private activeCategory: string = 'All';
  private tts = getTTSService();
  private activePlayBtn: HTMLButtonElement | null = null;

  constructor(private api: ApiClient) {}

  render(): HTMLElement {
    const container = document.createElement('div');
    container.innerHTML = `
      <div class="view-header">
        <h2>Vocabulary</h2>
        <p>Browse and learn Arabic words and phrases</p>
      </div>

      <div class="filter-bar" id="filter-bar">
        <button class="filter-btn active" data-category="All">All</button>
      </div>

      <table class="vocab-table">
        <thead>
          <tr>
            <th>Arabic</th>
            <th>Transliteration</th>
            <th>English</th>
            <th>Category</th>
            <th>Mastery</th>
            <th class="th-audio">Audio</th>
          </tr>
        </thead>
        <tbody id="vocab-body">
          <tr>
            <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 40px;">
              Loading vocabulary...
            </td>
          </tr>
        </tbody>
      </table>
    `;

    this.loadData(container);
    return container;
  }

  destroy(): void {
    this.tts.stop();
  }

  private async loadData(container: HTMLElement): Promise<void> {
    try {
      this.allVocab = await this.api.getVocabulary();
      const categories = await this.api.getCategories();

      // Build filter buttons
      const filterBar = container.querySelector('#filter-bar');
      if (filterBar) {
        filterBar.innerHTML = `
          <button class="filter-btn active" data-category="All">All (${this.allVocab.length})</button>
          ${categories.map(c => `
            <button class="filter-btn" data-category="${c.name}">${c.name} (${c.count})</button>
          `).join('')}
        `;

        filterBar.querySelectorAll('.filter-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            this.activeCategory = (btn as HTMLElement).dataset.category || 'All';
            this.renderTable(container);
          });
        });
      }

      this.renderTable(container);
    } catch {
      console.error('Failed to load vocabulary');
    }
  }

  private renderTable(container: HTMLElement): void {
    const tbody = container.querySelector('#vocab-body');
    if (!tbody) return;

    const filtered = this.activeCategory === 'All'
      ? this.allVocab
      : this.allVocab.filter(v => v.category === this.activeCategory);

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 40px;">
            No vocabulary items found
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(item => {
      const total = item.timesCorrect + item.timesIncorrect;
      const mastery = total > 0 ? Math.round((item.timesCorrect / total) * 100) : 0;
      const masteryColor = mastery >= 80 ? 'var(--accent-success)' :
                           mastery >= 50 ? 'var(--accent-warning)' :
                           total > 0 ? 'var(--accent-primary)' : 'var(--text-muted)';

      return `
        <tr>
          <td class="arabic-cell">${item.arabic}</td>
          <td class="transliteration-cell">${item.transliteration}</td>
          <td>${item.english}</td>
          <td><span class="category-badge">${item.category}</span></td>
          <td style="color: ${masteryColor}">${total > 0 ? `${mastery}%` : 'New'}</td>
          <td>
            <button class="tts-btn" data-arabic="${item.arabic}" title="Listen to pronunciation">
              <svg class="tts-icon tts-icon-play" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <svg class="tts-icon tts-icon-playing" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none">
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
              </svg>
              <svg class="tts-icon tts-icon-loading" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:none">
                <circle cx="12" cy="12" r="10" stroke-dasharray="31.4" stroke-dashoffset="10"/>
              </svg>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    // Attach TTS button handlers
    tbody.querySelectorAll('.tts-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const arabic = (btn as HTMLElement).dataset.arabic;
        if (arabic) {
          this.playPronunciation(arabic, btn as HTMLButtonElement);
        }
      });
    });
  }

  private playPronunciation(text: string, btn: HTMLButtonElement): void {
    // If clicking the same button that's playing, stop it
    if (this.activePlayBtn === btn) {
      this.tts.stop();
      this.setButtonState(btn, 'idle');
      this.activePlayBtn = null;
      return;
    }

    // Reset previous button
    if (this.activePlayBtn) {
      this.setButtonState(this.activePlayBtn, 'idle');
    }

    this.activePlayBtn = btn;

    this.tts.speak(text, (state: TTSState) => {
      this.setButtonState(btn, state);
      if (state === 'idle' || state === 'error') {
        this.activePlayBtn = null;
      }
    });
  }

  private setButtonState(btn: HTMLButtonElement, state: TTSState): void {
    const playIcon = btn.querySelector('.tts-icon-play') as HTMLElement;
    const playingIcon = btn.querySelector('.tts-icon-playing') as HTMLElement;
    const loadingIcon = btn.querySelector('.tts-icon-loading') as HTMLElement;
    if (!playIcon || !playingIcon || !loadingIcon) return;

    playIcon.style.display = 'none';
    playingIcon.style.display = 'none';
    loadingIcon.style.display = 'none';

    btn.classList.remove('tts-playing', 'tts-loading', 'tts-error');

    switch (state) {
      case 'playing':
        playingIcon.style.display = 'block';
        btn.classList.add('tts-playing');
        break;
      case 'loading':
        loadingIcon.style.display = 'block';
        btn.classList.add('tts-loading');
        break;
      case 'error':
        playIcon.style.display = 'block';
        btn.classList.add('tts-error');
        break;
      default:
        playIcon.style.display = 'block';
        break;
    }
  }
}
