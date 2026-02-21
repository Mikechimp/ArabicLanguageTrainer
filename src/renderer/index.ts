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

// ─── Application Bootstrap ──────────────────────────────────────────

class App {
  private router: Router;
  private api: ApiClient;

  constructor() {
    this.api = new ApiClient();
    this.router = new Router('content');

    this.registerViews();
    this.setupNavigation();
    this.setupMenuNavigation();
    this.checkBackendStatus();
  }

  private registerViews(): void {
    this.router.register('dashboard', () => new DashboardView(this.api));
    this.router.register('vocabulary', () => new VocabularyView(this.api));
    this.router.register('quiz', () => new QuizView(this.api));
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
    // Listen for navigation commands from the application menu
    window.electronAPI.onNavigate((view: string) => {
      this.navigateTo(view);
    });
  }

  navigateTo(viewName: string): void {
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', (item as HTMLElement).dataset.view === viewName);
    });

    // Route to view
    this.router.navigate(viewName);
  }

  private async checkBackendStatus(): Promise<void> {
    const statusDot = document.querySelector('.status-dot') as HTMLElement;
    const statusText = document.querySelector('.status-text') as HTMLElement;

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
    } catch {
      statusDot.classList.add('error');
      statusText.textContent = 'Connection error';
    }
  }

  start(): void {
    this.navigateTo('dashboard');
  }
}

// ─── Launch ─────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.start();
});
