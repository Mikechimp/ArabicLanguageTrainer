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
import { execFile } from 'child_process';
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

  // Query Windows SAPI voices directly via PowerShell (bypasses Chromium)
  ipcMain.handle('app:get-system-voices', async () => {
    if (process.platform !== 'win32') {
      return { platform: process.platform, voices: [], error: 'Not Windows — SAPI query not applicable' };
    }

    return new Promise((resolve) => {
      const psScript = `
        Add-Type -AssemblyName System.Speech;
        $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer;
        $voices = $synth.GetInstalledVoices() | Where-Object { $_.Enabled } | ForEach-Object {
          $info = $_.VoiceInfo;
          [PSCustomObject]@{
            Name = $info.Name;
            Culture = $info.Culture.Name;
            Gender = $info.Gender.ToString();
            Age = $info.Age.ToString();
            Description = $info.Description;
          }
        };
        $voices | ConvertTo-Json -Compress
      `;

      execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', psScript], {
        timeout: 10000,
      }, (error: Error | null, stdout: string, stderr: string) => {
        if (error) {
          console.error('[Main] SAPI voice query failed:', error.message);
          // Try OneCore voices as fallback (newer Windows 10+ voices)
          const oneCoreScript = `
            $voices = @();
            try {
              $synth = New-Object -ComObject SAPI.SpVoice;
              $tokens = $synth.GetVoices();
              for ($i = 0; $i -lt $tokens.Count; $i++) {
                $token = $tokens.Item($i);
                $voices += [PSCustomObject]@{
                  Name = $token.GetDescription();
                  Id = $token.Id;
                };
              };
            } catch { };
            $regVoices = @();
            try {
              $regPath = 'HKLM:\\SOFTWARE\\Microsoft\\Speech_OneCore\\Voices\\Tokens';
              if (Test-Path $regPath) {
                Get-ChildItem $regPath | ForEach-Object {
                  $regVoices += [PSCustomObject]@{
                    Name = (Get-ItemProperty $_.PSPath).'(default)';
                    Lang = (Get-ItemProperty "$($_.PSPath)\\Attributes").Language;
                    Path = $_.PSPath;
                  }
                }
              }
            } catch { };
            [PSCustomObject]@{
              SAPIVoices = $voices;
              OneCoreVoices = $regVoices;
            } | ConvertTo-Json -Depth 3 -Compress
          `;

          execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', oneCoreScript], {
            timeout: 10000,
          }, (error2: Error | null, stdout2: string, _stderr2: string) => {
            if (error2) {
              resolve({ platform: 'win32', voices: [], error: `Both queries failed: ${error.message}` });
              return;
            }
            try {
              const data = JSON.parse(stdout2.trim());
              resolve({ platform: 'win32', sapiVoices: data.SAPIVoices || [], oneCoreVoices: data.OneCoreVoices || [], source: 'onecore-fallback' });
            } catch {
              resolve({ platform: 'win32', voices: [], error: 'Failed to parse OneCore voice data', raw: stdout2.trim() });
            }
          });
          return;
        }

        try {
          let voices = JSON.parse(stdout.trim());
          // PowerShell returns a single object (not array) if only 1 voice
          if (!Array.isArray(voices)) voices = [voices];
          resolve({ platform: 'win32', voices, source: 'sapi' });
        } catch {
          resolve({ platform: 'win32', voices: [], error: 'Failed to parse SAPI voice data', raw: stdout.trim() });
        }
      });
    });
  });

  // Install Arabic language features via PowerShell (elevated)
  ipcMain.handle('app:install-arabic-voices', async () => {
    if (process.platform !== 'win32') {
      return { success: false, error: 'Not Windows' };
    }

    const capabilities = [
      'Language.Basic~~~ar-SA~0.0.1.0',
      'Language.TextToSpeech~~~ar-SA~0.0.1.0',
    ];

    const script = capabilities
      .map(cap => `Add-WindowsCapability -Online -Name "${cap}" -ErrorAction SilentlyContinue`)
      .join('; ');

    return new Promise((resolve) => {
      // This requires elevated privileges — use Start-Process to request UAC
      const elevatedScript = `
        Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile -Command ${script.replace(/'/g, "''")}' -Wait
      `;

      execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', elevatedScript], {
        timeout: 120000, // Language pack install can take a while
      }, (error: Error | null, stdout: string, _stderr: string) => {
        if (error) {
          console.error('[Main] Arabic voice install failed:', error.message);
          resolve({ success: false, error: error.message });
          return;
        }
        resolve({ success: true, output: stdout.trim() });
      });
    });
  });

  // Check which Arabic language capabilities are installed
  ipcMain.handle('app:check-arabic-capabilities', async () => {
    if (process.platform !== 'win32') {
      return { platform: process.platform, capabilities: [], error: 'Not Windows' };
    }

    return new Promise((resolve) => {
      const script = `
        $caps = Get-WindowsCapability -Online | Where-Object { $_.Name -like '*ar-SA*' -or $_.Name -like '*Arabic*' } | ForEach-Object {
          [PSCustomObject]@{
            Name = $_.Name;
            State = $_.State.ToString();
          }
        };
        $caps | ConvertTo-Json -Compress
      `;

      execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
        timeout: 30000,
      }, (error: Error | null, stdout: string, _stderr: string) => {
        if (error) {
          resolve({ platform: 'win32', capabilities: [], error: error.message });
          return;
        }
        try {
          let caps = JSON.parse(stdout.trim());
          if (!Array.isArray(caps)) caps = [caps];
          resolve({ platform: 'win32', capabilities: caps });
        } catch {
          resolve({ platform: 'win32', capabilities: [], error: 'Parse failed', raw: stdout.trim() });
        }
      });
    });
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
