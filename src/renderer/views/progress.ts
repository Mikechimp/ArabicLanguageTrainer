/**
 * Progress View
 *
 * Shows detailed learning progress with per-category breakdowns.
 */

import { View } from '../services/router';
import { ApiClient } from '../services/api-client';

export class ProgressView implements View {
  constructor(private api: ApiClient) {}

  render(): HTMLElement {
    const container = document.createElement('div');
    container.innerHTML = `
      <div class="view-header">
        <h2>Your Progress</h2>
        <p>Track your Arabic learning journey</p>
      </div>

      <div class="stats-row" id="progress-stats">
        <div class="stat-card">
          <div class="stat-value stat-accent" id="p-learned">--</div>
          <div class="stat-label">Words Mastered</div>
        </div>
        <div class="stat-card">
          <div class="stat-value stat-info" id="p-total">--</div>
          <div class="stat-label">Total Words</div>
        </div>
        <div class="stat-card">
          <div class="stat-value stat-success" id="p-accuracy">--</div>
          <div class="stat-label">Overall Accuracy</div>
        </div>
        <div class="stat-card">
          <div class="stat-value stat-warning" id="p-streak">--</div>
          <div class="stat-label">Current Streak</div>
        </div>
      </div>

      <div class="view-header">
        <h2>Category Breakdown</h2>
      </div>

      <div id="category-progress" style="max-width: 600px;">
        <div style="color: var(--text-muted); text-align: center; padding: 24px;">Loading...</div>
      </div>
    `;

    this.loadProgress(container);
    return container;
  }

  private async loadProgress(container: HTMLElement): Promise<void> {
    try {
      const progress = await this.api.getProgress();

      // Update stats
      const el = (id: string) => container.querySelector(`#${id}`);
      const setText = (id: string, text: string) => {
        const e = el(id);
        if (e) e.textContent = text;
      };

      setText('p-learned', String(progress.wordsLearned));
      setText('p-total', String(progress.totalWords));
      setText('p-accuracy', `${progress.accuracy}%`);
      setText('p-streak', String(progress.streak));

      // Render category progress bars
      const categoryContainer = container.querySelector('#category-progress');
      if (!categoryContainer) return;

      const colors = ['accent', 'success', 'info', 'warning'];
      const entries = Object.entries(progress.categoryProgress);

      if (entries.length === 0) {
        categoryContainer.innerHTML = `
          <div class="empty-state">
            <p>No progress data yet. Take a quiz to get started!</p>
          </div>
        `;
        return;
      }

      categoryContainer.innerHTML = entries.map(([category, data], i) => {
        const percentage = data.total > 0 ? Math.round((data.learned / data.total) * 100) : 0;
        const color = colors[i % colors.length];

        return `
          <div class="progress-bar-container">
            <div class="progress-bar-header">
              <span class="progress-bar-label">${category}</span>
              <span class="progress-bar-value">${data.learned} / ${data.total} mastered</span>
            </div>
            <div class="progress-bar">
              <div class="progress-bar-fill ${color}" style="width: ${percentage}%"></div>
            </div>
          </div>
        `;
      }).join('');
    } catch {
      console.error('Failed to load progress');
    }
  }
}
