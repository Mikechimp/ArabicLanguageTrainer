/**
 * Vocabulary View
 *
 * Displays all vocabulary items in a filterable table.
 * Shows Arabic text, transliteration, English translation, and category.
 */

import { View } from '../services/router';
import { ApiClient, VocabularyItem } from '../services/api-client';

export class VocabularyView implements View {
  private allVocab: VocabularyItem[] = [];
  private activeCategory: string = 'All';

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
          </tr>
        </thead>
        <tbody id="vocab-body">
          <tr>
            <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 40px;">
              Loading vocabulary...
            </td>
          </tr>
        </tbody>
      </table>
    `;

    this.loadData(container);
    return container;
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
          <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 40px;">
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
        </tr>
      `;
    }).join('');
  }
}
