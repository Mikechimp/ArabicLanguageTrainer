/**
 * Electron Main Process
 *
 * This is the entry point for the desktop application.
 * The main process has full access to Node.js APIs and the operating system.
 * It creates and manages BrowserWindows (renderer processes) and handles
 * the lifecycle of the C# backend service.
 *
 * Architecture:
 *   main.ts (this file) → creates BrowserWindow → loads renderer
 *                        → spawns C# backend process
 *                        → handles IPC between renderer and backend
 */

import { app, BrowserWindow, Menu, ipcMain, dialog, shell } from 'electron';
import { BackendManager } from './backend-manager';

// Webpack magic variables injected by Electron Forge
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Fix black/blank rendering on some Windows GPU drivers
app.disableHardwareAcceleration();

// ─── Application State ───────────────────────────────────────────────
let mainWindow: BrowserWindow | null = null;
const backendManager = new BackendManager();

// ─── Window Creation ─────────────────────────────────────────────────
function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Arabic Language Trainer',
    backgroundColor: '#1a1a2e',
    show: false, // Don't show until ready (prevents flash)
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      contextIsolation: true,    // Security: isolate renderer from Node.js
      nodeIntegration: false,    // Security: no Node.js in renderer
      sandbox: true,             // Security: sandbox the renderer
    },
  });

  // Load the webpack-bundled renderer
  window.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Show window when content is ready (smooth launch)
  window.once('ready-to-show', () => {
    window.show();
    window.focus();
    // Open DevTools in development for debugging
    if (!app.isPackaged) {
      window.webContents.openDevTools({ mode: 'bottom' });
    }
  });

  window.on('closed', () => {
    mainWindow = null;
  });

  return window;
}

// ─── Application Menu ────────────────────────────────────────────────
function createApplicationMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Preferences',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow?.webContents.send('navigate', 'settings');
          },
        },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Learn',
      submenu: [
        {
          label: 'Vocabulary',
          click: () => mainWindow?.webContents.send('navigate', 'vocabulary'),
        },
        {
          label: 'Quiz',
          click: () => mainWindow?.webContents.send('navigate', 'quiz'),
        },
        {
          label: 'Progress',
          click: () => mainWindow?.webContents.send('navigate', 'progress'),
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Arabic Language Trainer',
          click: () => {
            dialog.showMessageBox({
              type: 'info',
              title: 'About',
              message: 'Arabic Language Trainer v1.0.0',
              detail: 'A desktop application for learning Arabic.\nBuilt with Electron + TypeScript + C# .NET',
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ─── IPC Handlers ────────────────────────────────────────────────────
// These handle messages from the renderer process (UI)
function registerIpcHandlers(): void {
  // Backend status check
  ipcMain.handle('backend:status', async () => {
    return backendManager.getStatus();
  });

  // Forward API requests from renderer to C# backend
  ipcMain.handle('backend:request', async (_event, endpoint: string, method: string, body?: unknown) => {
    try {
      return await backendManager.request(endpoint, method, body);
    } catch (err) {
      console.error(`[IPC] backend:request failed for ${method} ${endpoint}:`, err);
      return { error: 'Request failed', status: 500 };
    }
  });

  // App info
  ipcMain.handle('app:version', () => {
    return app.getVersion();
  });

  // System info (versions) - renderer is sandboxed, so it can't access process.versions
  ipcMain.handle('app:system-info', () => {
    return {
      electron: process.versions.electron,
      chrome: process.versions.chrome,
      node: process.versions.node,
      platform: process.platform,
    };
  });

  // Open external links
  ipcMain.handle('app:open-external', async (_event, url: string) => {
    await shell.openExternal(url);
  });
}

// ─── App Lifecycle ───────────────────────────────────────────────────
app.whenReady().then(async () => {
  createApplicationMenu();
  registerIpcHandlers();

  // Start the backend service (don't let failure block window creation)
  try {
    await backendManager.start();
  } catch (err) {
    console.error('[Main] Backend failed to start:', err);
  }

  // Create the main window
  mainWindow = createMainWindow();

  // macOS: re-create window when dock icon clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createMainWindow();
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Cleanup backend process on quit
app.on('before-quit', async () => {
  await backendManager.stop();
});
