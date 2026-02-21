/**
 * Settings View
 *
 * Application settings and backend status information.
 */

import { View } from '../services/router';
import { ApiClient } from '../services/api-client';

export class SettingsView implements View {
  constructor(private api: ApiClient) {}

  render(): HTMLElement {
    const container = document.createElement('div');
    container.innerHTML = `
      <div class="view-header">
        <h2>Settings</h2>
        <p>Configure your learning experience</p>
      </div>

      <div class="settings-section">
        <h3>Backend Status</h3>
        <div class="card" id="backend-info">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <span class="status-dot" id="settings-status-dot"></span>
            <span id="settings-status-text" style="font-weight: 600;">Checking...</span>
          </div>
          <div id="settings-status-details" style="color: var(--text-secondary); font-size: 0.9rem;"></div>
        </div>
      </div>

      <div class="settings-section">
        <h3>Application Architecture</h3>
        <div class="card">
          <p style="color: var(--text-secondary); line-height: 1.8; font-size: 0.9rem;">
            This application uses a <strong style="color: var(--text-primary);">multi-process architecture</strong>:
          </p>
          <ul style="color: var(--text-secondary); margin: 16px 0 0 20px; line-height: 2; font-size: 0.9rem;">
            <li><strong style="color: var(--accent-primary);">Main Process</strong> (Electron/TypeScript) &mdash; Window management, system integration, IPC</li>
            <li><strong style="color: var(--accent-info);">Renderer Process</strong> (TypeScript/HTML/CSS) &mdash; User interface, sandboxed browser context</li>
            <li><strong style="color: var(--accent-success);">Backend Service</strong> (C# .NET / Embedded TS) &mdash; API, business logic, data persistence</li>
            <li><strong style="color: var(--accent-warning);">Preload Bridge</strong> (TypeScript) &mdash; Secure IPC between renderer and main process</li>
          </ul>
        </div>
      </div>

      <div class="settings-section">
        <h3>About</h3>
        <div class="card">
          <div style="display: flex; justify-content: space-between; padding: 4px 0;">
            <span style="color: var(--text-secondary);">Version</span>
            <span id="app-version">--</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0;">
            <span style="color: var(--text-secondary);">Electron</span>
            <span id="info-electron">--</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0;">
            <span style="color: var(--text-secondary);">Chrome</span>
            <span id="info-chrome">--</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0;">
            <span style="color: var(--text-secondary);">Node.js</span>
            <span id="info-node">--</span>
          </div>
        </div>
      </div>
    `;

    this.loadStatus(container);
    return container;
  }

  private async loadStatus(container: HTMLElement): Promise<void> {
    try {
      const status = await this.api.getStatus();
      const version = await window.electronAPI.getVersion();
      const sysInfo = await window.electronAPI.getSystemInfo();

      const dot = container.querySelector('#settings-status-dot') as HTMLElement;
      const text = container.querySelector('#settings-status-text') as HTMLElement;
      const details = container.querySelector('#settings-status-details') as HTMLElement;
      const versionEl = container.querySelector('#app-version') as HTMLElement;

      if (status.running) {
        dot.classList.add('connected');
        text.textContent = 'Backend Running';
        text.style.color = 'var(--accent-success)';
      } else {
        dot.classList.add('error');
        text.textContent = 'Backend Offline';
        text.style.color = 'var(--accent-primary)';
      }

      details.innerHTML = `
        Mode: <strong>${status.mode === 'dotnet' ? 'C# .NET Backend' : 'Embedded TypeScript Service'}</strong><br>
        Port: <strong>${status.port}</strong><br>
        URL: <strong>${status.url}</strong>
      `;

      if (versionEl) versionEl.textContent = version;

      const elElectron = container.querySelector('#info-electron');
      const elChrome = container.querySelector('#info-chrome');
      const elNode = container.querySelector('#info-node');
      if (elElectron) elElectron.textContent = sysInfo.electron;
      if (elChrome) elChrome.textContent = sysInfo.chrome;
      if (elNode) elNode.textContent = sysInfo.node;
    } catch {
      console.error('Failed to load backend status');
    }
  }
}
