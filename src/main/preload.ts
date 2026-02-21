/**
 * Preload Script
 *
 * This runs in a sandboxed context BEFORE the renderer loads.
 * It creates a secure bridge between the renderer (untrusted web content)
 * and the main process (full Node.js access).
 *
 * Security architecture:
 *   Renderer (sandboxed) → contextBridge API → Main Process (privileged)
 *
 * The renderer can ONLY call functions exposed here.
 * It cannot access Node.js, Electron internals, or the filesystem directly.
 * This is the same security model used by VS Code, Slack, Discord, etc.
 */

import { contextBridge, ipcRenderer } from 'electron';

// ─── API exposed to the renderer process ─────────────────────────────

contextBridge.exposeInMainWorld('electronAPI', {
  // ── Backend Communication ──────────────────────────────────────
  getBackendStatus: () => ipcRenderer.invoke('backend:status'),

  apiRequest: (endpoint: string, method: string, body?: unknown) =>
    ipcRenderer.invoke('backend:request', endpoint, method, body),

  // ── App Info ───────────────────────────────────────────────────
  getVersion: () => ipcRenderer.invoke('app:version'),
  getSystemInfo: () => ipcRenderer.invoke('app:system-info'),
  openExternal: (url: string) => ipcRenderer.invoke('app:open-external', url),

  // ── Navigation Events (from menu) ─────────────────────────────
  onNavigate: (callback: (view: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, view: string) => callback(view);
    ipcRenderer.on('navigate', handler);
    // Return cleanup function
    return () => ipcRenderer.removeListener('navigate', handler);
  },
});

// ─── Type Declaration ────────────────────────────────────────────────
// This tells TypeScript what's available on window.electronAPI

export interface ElectronAPI {
  getBackendStatus: () => Promise<{
    running: boolean;
    mode: 'dotnet' | 'embedded';
    port: number;
    url: string;
  }>;
  apiRequest: (endpoint: string, method: string, body?: unknown) => Promise<unknown>;
  getVersion: () => Promise<string>;
  getSystemInfo: () => Promise<{ electron: string; chrome: string; node: string; platform: string }>;
  openExternal: (url: string) => Promise<void>;
  onNavigate: (callback: (view: string) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
