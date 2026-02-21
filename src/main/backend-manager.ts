/**
 * Backend Manager
 *
 * Manages the lifecycle of the C# .NET backend service.
 * The Electron main process spawns the .NET API as a child process
 * and communicates with it over HTTP (localhost).
 *
 * This pattern is used in production apps like:
 *   - VS Code (Electron shell + language server processes)
 *   - Azure DevOps (web UI + C# microservices)
 *   - Slack Desktop (Electron + native services)
 *
 * When the .NET backend is not available (e.g., SDK not installed),
 * falls back to an embedded TypeScript service layer.
 */

import { ChildProcess, spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';
import { app } from 'electron';
import { EmbeddedService } from './embedded-service';

export interface BackendStatus {
  running: boolean;
  mode: 'dotnet' | 'embedded';
  port: number;
  url: string;
}

export class BackendManager {
  private process: ChildProcess | null = null;
  private port = 5175;
  private baseUrl: string;
  private mode: 'dotnet' | 'embedded' = 'embedded';
  private embeddedService: EmbeddedService;

  constructor() {
    this.baseUrl = `http://localhost:${this.port}`;
    this.embeddedService = new EmbeddedService();
  }

  /**
   * Start the backend service.
   * Attempts to launch the C# .NET backend first.
   * Falls back to embedded TypeScript service if .NET is unavailable.
   */
  async start(): Promise<void> {
    const dotnetPath = this.findBackendExecutable();

    if (dotnetPath) {
      try {
        await this.startDotNetBackend(dotnetPath);
        this.mode = 'dotnet';
        console.log(`[BackendManager] C# backend started on port ${this.port}`);
        return;
      } catch (err) {
        console.warn('[BackendManager] Failed to start C# backend, falling back to embedded service:', err);
      }
    }

    // Fallback: use embedded TypeScript service (direct IPC, no HTTP)
    this.mode = 'embedded';
    this.embeddedService.start();
    console.log('[BackendManager] Embedded service started');
  }

  /**
   * Stop the backend service.
   */
  async stop(): Promise<void> {
    if (this.process) {
      this.process.kill('SIGTERM');
      this.process = null;
    }
    this.embeddedService.stop();
  }

  /**
   * Get the current backend status.
   */
  getStatus(): BackendStatus {
    return {
      running: this.mode === 'dotnet' ? this.process !== null : this.embeddedService.isRunning(),
      mode: this.mode,
      port: this.port,
      url: this.baseUrl,
    };
  }

  /**
   * Forward a request to the backend.
   */
  async request(endpoint: string, method: string, body?: unknown): Promise<unknown> {
    if (this.mode === 'embedded') {
      return this.embeddedService.handleRequest(endpoint, method, body);
    }

    return this.httpRequest(endpoint, method, body);
  }

  // ─── Private Methods ─────────────────────────────────────────────

  private findBackendExecutable(): string | null {
    const possiblePaths = [
      path.join(app.getAppPath(), '..', 'dist', 'backend', 'ArabicTrainer.Api'),
      path.join(process.resourcesPath || '', 'backend', 'ArabicTrainer.Api'),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) return p;
      if (fs.existsSync(p + '.exe')) return p + '.exe';
    }

    return null;
  }

  private startDotNetBackend(executablePath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.process = spawn(executablePath, ['--urls', this.baseUrl], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          ASPNETCORE_ENVIRONMENT: 'Production',
          ASPNETCORE_URLS: this.baseUrl,
        },
      });

      let started = false;

      this.process.stdout?.on('data', (data: Buffer) => {
        const output = data.toString();
        console.log(`[C# Backend] ${output}`);
        if (output.includes('Now listening on') && !started) {
          started = true;
          resolve();
        }
      });

      this.process.stderr?.on('data', (data: Buffer) => {
        console.error(`[C# Backend ERROR] ${data.toString()}`);
      });

      this.process.on('error', (err) => {
        if (!started) reject(err);
      });

      this.process.on('exit', (code) => {
        console.log(`[C# Backend] Process exited with code ${code}`);
        this.process = null;
      });

      // Timeout if backend doesn't start within 10 seconds
      setTimeout(() => {
        if (!started) {
          this.process?.kill();
          reject(new Error('Backend startup timed out'));
        }
      }, 10000);
    });
  }

  private httpRequest(endpoint: string, method: string, body?: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.baseUrl);
      const postData = body ? JSON.stringify(body) : undefined;

      const options: http.RequestOptions = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
        },
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(data);
          }
        });
      });

      req.on('error', reject);
      if (postData) req.write(postData);
      req.end();
    });
  }
}
