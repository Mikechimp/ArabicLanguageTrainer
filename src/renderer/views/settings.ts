/**
 * Settings View
 *
 * Application settings and backend status information.
 */

import { View } from '../services/router';
import { ApiClient } from '../services/api-client';
import { getTTSService } from '../services/tts-service';

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
        <h3>TTS Voice Diagnostics</h3>
        <div class="card" id="tts-diagnostics">
          <div style="color: var(--text-secondary); font-size: 0.9rem;">Loading voice info...</div>
        </div>
        <button class="btn btn-secondary" id="btn-refresh-voices" style="margin-top: 12px;">Refresh Voices</button>
        <button class="btn btn-secondary" id="btn-test-tts" style="margin-top: 12px; margin-left: 8px;">Test Arabic TTS</button>
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
    this.loadTTSDiagnostics(container);

    container.querySelector('#btn-refresh-voices')?.addEventListener('click', () => {
      this.loadTTSDiagnostics(container);
    });

    container.querySelector('#btn-test-tts')?.addEventListener('click', () => {
      const tts = getTTSService();
      const testBtn = container.querySelector('#btn-test-tts') as HTMLButtonElement;
      if (testBtn) testBtn.textContent = 'Speaking...';
      tts.speak('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', (state) => {
        if (testBtn) {
          if (state === 'playing') testBtn.textContent = 'Playing...';
          else if (state === 'error') testBtn.textContent = 'Error — check console';
          else testBtn.textContent = 'Test Arabic TTS';
        }
      });
    });

    return container;
  }

  private loadTTSDiagnostics(container: HTMLElement): void {
    const panel = container.querySelector('#tts-diagnostics');
    if (!panel) return;

    const tts = getTTSService();
    const diag = tts.getDiagnostics();

    const statusColor = diag.selectedVoice ? 'var(--accent-success)' : 'var(--accent-primary)';
    const statusText = diag.selectedVoice
      ? `Using: ${diag.selectedVoice.name} (${diag.selectedVoice.lang})`
      : 'No Arabic voice detected';

    let html = `
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
        <span class="status-dot" style="background: ${statusColor}; width: 10px; height: 10px; border-radius: 50%; display: inline-block;"></span>
        <strong style="color: ${statusColor};">${statusText}</strong>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border-color);">
        <span style="color: var(--text-secondary);">SpeechSynthesis API</span>
        <span>${diag.available ? 'Available' : 'Not Available'}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border-color);">
        <span style="color: var(--text-secondary);">Voices loaded</span>
        <span>${diag.voicesLoaded ? 'Yes' : 'No'}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border-color);">
        <span style="color: var(--text-secondary);">Total system voices</span>
        <span>${diag.totalVoices}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border-color);">
        <span style="color: var(--text-secondary);">Arabic voices found</span>
        <span style="color: ${diag.arabicVoices.length > 0 ? 'var(--accent-success)' : 'var(--accent-primary)'};">
          ${diag.arabicVoices.length}
        </span>
      </div>
    `;

    if (diag.arabicVoices.length > 0) {
      html += '<div style="margin-top: 12px;"><strong style="font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px;">Arabic Voices</strong></div>';
      for (const v of diag.arabicVoices) {
        const isSelected = diag.selectedVoice && v.name === diag.selectedVoice.name;
        html += `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid var(--border-color);">
            <span style="color: ${isSelected ? 'var(--accent-success)' : 'var(--text-primary)'};">
              ${isSelected ? '&rarr; ' : ''}${v.name}
            </span>
            <span style="font-size: 0.85rem; color: var(--text-muted);">
              ${v.lang} ${v.localService ? '(local)' : '(network)'}
            </span>
          </div>
        `;
      }
    }

    if (diag.fallbackVoice) {
      html += `
        <div style="display: flex; justify-content: space-between; padding: 6px 0; margin-top: 8px;">
          <span style="color: var(--text-secondary);">Fallback voice</span>
          <span style="color: var(--text-muted);">${diag.fallbackVoice.name} (${diag.fallbackVoice.lang})</span>
        </div>
      `;
    }

    if (diag.arabicVoices.length === 0) {
      html += `
        <div style="margin-top: 16px; padding: 12px; background: rgba(233, 69, 96, 0.08); border-radius: var(--radius-sm); border-left: 3px solid var(--accent-primary);">
          <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.6;">
            <strong style="color: var(--accent-primary);">No Arabic voices detected.</strong> Install an Arabic language pack in your OS:
          </p>
          <ul style="color: var(--text-muted); font-size: 0.8rem; margin: 8px 0 0 16px; line-height: 1.8;">
            <li><strong>Windows:</strong> Settings &rarr; Time &amp; Language &rarr; Speech &rarr; Add voices (ar-SA or ar-EG)</li>
            <li><strong>macOS:</strong> System Settings &rarr; Accessibility &rarr; Spoken Content &rarr; Manage Voices</li>
            <li><strong>Linux:</strong> Install <code>espeak-ng</code> or a speech-dispatcher Arabic voice</li>
          </ul>
        </div>
      `;
    }

    panel.innerHTML = html;
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
