/**
 * API Client
 *
 * Abstraction layer for communicating with the backend.
 * All backend calls go through this client, which routes them
 * through the Electron IPC bridge (preload.ts → main.ts → backend).
 *
 * This pattern (API client abstraction) is used everywhere:
 *   - Every REST API has a client library
 *   - Azure DevOps SDK wraps the VSTS REST API
 *   - This is the "Service Layer" pattern in enterprise architecture
 */

interface BackendStatus {
  running: boolean;
  mode: 'dotnet' | 'embedded';
  port: number;
  url: string;
}

export interface VocabularyItem {
  id: string;
  arabic: string;
  transliteration: string;
  english: string;
  category: string;
  difficulty: number;
  timesCorrect: number;
  timesIncorrect: number;
  lastReviewed: string | null;
}

export interface QuizQuestion {
  id: string;
  vocabularyId: string;
  arabic: string;
  transliteration: string;
  correctAnswer: string;
  options: string[];
  category: string;
}

export interface UserProgress {
  totalWords: number;
  wordsLearned: number;
  accuracy: number;
  streak: number;
  lastSession: string | null;
  categoryProgress: Record<string, { learned: number; total: number }>;
}

export interface Category {
  name: string;
  count: number;
  icon: string;
}

export class ApiClient {
  // ── Health ─────────────────────────────────────────────────────
  async getStatus(): Promise<BackendStatus> {
    return window.electronAPI.getBackendStatus();
  }

  // ── Vocabulary ─────────────────────────────────────────────────
  async getVocabulary(): Promise<VocabularyItem[]> {
    return window.electronAPI.apiRequest('/api/vocabulary', 'GET') as Promise<VocabularyItem[]>;
  }

  async getVocabularyByCategory(category: string): Promise<VocabularyItem[]> {
    return window.electronAPI.apiRequest(`/api/vocabulary/${encodeURIComponent(category)}`, 'GET') as Promise<VocabularyItem[]>;
  }

  async getCategories(): Promise<Category[]> {
    return window.electronAPI.apiRequest('/api/categories', 'GET') as Promise<Category[]>;
  }

  // ── Quiz ───────────────────────────────────────────────────────
  async getQuiz(): Promise<QuizQuestion[]> {
    return window.electronAPI.apiRequest('/api/quiz', 'GET') as Promise<QuizQuestion[]>;
  }

  async submitAnswer(vocabularyId: string, correct: boolean): Promise<{ success: boolean; streak: number }> {
    return window.electronAPI.apiRequest('/api/quiz/submit', 'POST', {
      vocabularyId,
      correct,
      answeredAt: new Date().toISOString(),
    }) as Promise<{ success: boolean; streak: number }>;
  }

  // ── Progress ───────────────────────────────────────────────────
  async getProgress(): Promise<UserProgress> {
    return window.electronAPI.apiRequest('/api/progress', 'GET') as Promise<UserProgress>;
  }
}
