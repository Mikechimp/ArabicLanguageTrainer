/**
 * Dashboard View
 *
 * The landing page of the application. Shows an overview of
 * learning progress, quick-start buttons, and recent activity.
 */

import { View } from '../services/router';
import { ApiClient } from '../services/api-client';

export class DashboardView implements View {
  constructor(private api: ApiClient) {}

  render(): HTMLElement {
    const container = document.createElement('div');
    container.innerHTML = `
      <div class="view-header">
        <h2>Dashboard</h2>
        <p>Welcome back. Continue your Arabic learning journey.</p>
      </div>

      <div class="stats-row" id="dashboard-stats">
        <div class="stat-card">
          <div class="stat-value stat-accent" id="stat-words">--</div>
          <div class="stat-label">Words Learned</div>
        </div>
        <div class="stat-card">
          <div class="stat-value stat-success" id="stat-accuracy">--</div>
          <div class="stat-label">Accuracy</div>
        </div>
        <div class="stat-card">
          <div class="stat-value stat-warning" id="stat-streak">--</div>
          <div class="stat-label">Current Streak</div>
        </div>
        <div class="stat-card">
          <div class="stat-value stat-info" id="stat-total">--</div>
          <div class="stat-label">Total Words</div>
        </div>
      </div>

      <div class="view-header">
        <h2>Quick Start</h2>
      </div>

      <div class="card-grid">
        <div class="card card-clickable" id="quick-quiz">
          <div class="card-title">Take a Quiz</div>
          <p style="color: var(--text-secondary); margin-bottom: 16px;">
            Test your knowledge with a 10-question quiz
          </p>
          <button class="btn btn-primary">Start Quiz</button>
        </div>

        <div class="card card-clickable" id="quick-vocab">
          <div class="card-title">Browse Vocabulary</div>
          <p style="color: var(--text-secondary); margin-bottom: 16px;">
            Review words and phrases by category
          </p>
          <button class="btn btn-secondary">Open Vocabulary</button>
        </div>

        <div class="card card-clickable" id="quick-progress">
          <div class="card-title">View Progress</div>
          <p style="color: var(--text-secondary); margin-bottom: 16px;">
            Track your learning journey and statistics
          </p>
          <button class="btn btn-secondary">See Progress</button>
        </div>
      </div>

      <div class="view-header" style="margin-top: 32px;">
        <h2>Categories</h2>
      </div>

      <div class="card-grid" id="category-cards">
        <div class="card pulse" style="text-align: center; color: var(--text-muted);">Loading categories...</div>
      </div>
    `;

    // Quick nav buttons
    container.querySelector('#quick-quiz')?.addEventListener('click', () => {
      document.querySelector('.nav-item[data-view="quiz"]')?.dispatchEvent(new Event('click'));
    });
    container.querySelector('#quick-vocab')?.addEventListener('click', () => {
      document.querySelector('.nav-item[data-view="vocabulary"]')?.dispatchEvent(new Event('click'));
    });
    container.querySelector('#quick-progress')?.addEventListener('click', () => {
      document.querySelector('.nav-item[data-view="progress"]')?.dispatchEvent(new Event('click'));
    });

    // Load data
    this.loadStats(container);
    this.loadCategories(container);

    return container;
  }

  private async loadStats(container: HTMLElement): Promise<void> {
    try {
      const progress = await this.api.getProgress();
      const statWords = container.querySelector('#stat-words');
      const statAccuracy = container.querySelector('#stat-accuracy');
      const statStreak = container.querySelector('#stat-streak');
      const statTotal = container.querySelector('#stat-total');

      if (statWords) statWords.textContent = String(progress.wordsLearned);
      if (statAccuracy) statAccuracy.textContent = `${progress.accuracy}%`;
      if (statStreak) statStreak.textContent = String(progress.streak);
      if (statTotal) statTotal.textContent = String(progress.totalWords);
    } catch {
      console.error('Failed to load dashboard stats');
    }
  }

  private async loadCategories(container: HTMLElement): Promise<void> {
    try {
      const categories = await this.api.getCategories();
      const grid = container.querySelector('#category-cards');
      if (!grid) return;

      grid.innerHTML = categories.map(cat => `
        <div class="card">
          <div class="card-label">${cat.count} words</div>
          <div class="card-title" style="margin-top: 8px;">${cat.name}</div>
        </div>
      `).join('');
    } catch {
      console.error('Failed to load categories');
    }
  }
}
