/**
 * Renderer Entry Point
 *
 * This is the entry point for the renderer process (the UI).
 * It runs in a sandboxed browser context with NO access to Node.js.
 * Communication with the system happens ONLY through window.electronAPI
 * (defined in preload.ts).
 *
 * Architecture:
 *   index.ts (this file) → initializes app → sets up router → renders views
 */

import './styles/main.css';
import { Router } from './services/router';
import { ApiClient } from './services/api-client';
import { DashboardView } from './views/dashboard';
import { VocabularyView } from './views/vocabulary';
import { QuizView } from './views/quiz';
import { ProgressView } from './views/progress';
import { SettingsView } from './views/settings';
import { ReadingView } from './views/reading';

// ─── Application Bootstrap ──────────────────────────────────────────

class App {
  private router: Router;
  private api: ApiClient;

  constructor() {
    this.api = new ApiClient();
    this.router = new Router('content');

    this.registerViews();
    this.setupNavigation();
  }

  private registerViews(): void {
    this.router.register('dashboard', () => new DashboardView(this.api));
    this.router.register('vocabulary', () => new VocabularyView(this.api));
    this.router.register('quiz', () => new QuizView(this.api));
    this.router.register('reading', () => new ReadingView(this.api));
    this.router.register('progress', () => new ProgressView(this.api));
    this.router.register('settings', () => new SettingsView(this.api));
  }

  private setupNavigation(): void {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const view = (item as HTMLElement).dataset.view;
        if (view) {
          this.navigateTo(view);
        }
      });
    });
  }

  private setupMenuNavigation(): void {
    if (!window.electronAPI?.onNavigate) return;
    window.electronAPI.onNavigate((view: string) => {
      this.navigateTo(view);
    });
  }

  navigateTo(viewName: string): void {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', (item as HTMLElement).dataset.view === viewName);
    });
    this.router.navigate(viewName);
  }

  private async checkBackendStatus(): Promise<void> {
    const statusDot = document.querySelector('.status-dot') as HTMLElement;
    const statusText = document.querySelector('.status-text') as HTMLElement;
    if (!statusDot || !statusText) return;

    if (!window.electronAPI?.getBackendStatus) {
      statusDot.classList.add('error');
      statusText.textContent = 'IPC unavailable';
      return;
    }

    try {
      const status = await window.electronAPI.getBackendStatus();
      if (status.running) {
        statusDot.classList.add('connected');
        statusDot.classList.remove('error');
        statusText.textContent = `${status.mode === 'dotnet' ? '.NET' : 'Embedded'} backend`;
      } else {
        statusDot.classList.add('error');
        statusText.textContent = 'Backend offline';
      }
    } catch (err) {
      statusDot.classList.add('error');
      statusText.textContent = 'Connection error';
      console.error('[App] Backend status check failed:', err);
    }
  }

  start(): void {
    // Navigate to dashboard first (renders the UI immediately)
    this.navigateTo('dashboard');

    // Then set up async features (menu nav, backend status)
    this.setupMenuNavigation();
    this.checkBackendStatus();
  }
}

// ─── Launch ─────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  try {
    const app = new App();
    app.start();
  } catch (err) {
    console.error('[App] Failed to initialize:', err);
    const content = document.getElementById('content');
    if (content) {
      content.innerHTML = `
        <div style="padding: 40px; color: #e94560;">
          <h2>Startup Error</h2>
          <p style="color: #8888a0; margin-top: 12px;">${err instanceof Error ? err.message : String(err)}</p>
          <p style="color: #555570; margin-top: 8px; font-size: 0.85rem;">
            Press Ctrl+Shift+I to open DevTools for details.
          </p>
        </div>
      `;
    }
  }
});
