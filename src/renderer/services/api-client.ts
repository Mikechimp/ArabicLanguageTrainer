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

export interface ReadingPassage {
  id: string;
  surah: string;
  surahNumber: number;
  ayah: number;
  arabic: string;
  transliteration: string;
  translation: string;
  wordByWord: { arabic: string; transliteration: string; english: string }[];
  difficulty: number;
}

function getAPI() {
  if (!window.electronAPI) {
    throw new Error('electronAPI not available - preload script may not have loaded');
  }
  return window.electronAPI;
}

export class ApiClient {
  // ── Health ─────────────────────────────────────────────────────
  async getStatus(): Promise<BackendStatus> {
    return getAPI().getBackendStatus();
  }

  // ── Vocabulary ─────────────────────────────────────────────────
  async getVocabulary(): Promise<VocabularyItem[]> {
    return getAPI().apiRequest('/api/vocabulary', 'GET') as Promise<VocabularyItem[]>;
  }

  async getVocabularyByCategory(category: string): Promise<VocabularyItem[]> {
    return getAPI().apiRequest(`/api/vocabulary/${encodeURIComponent(category)}`, 'GET') as Promise<VocabularyItem[]>;
  }

  async getCategories(): Promise<Category[]> {
    return getAPI().apiRequest('/api/categories', 'GET') as Promise<Category[]>;
  }

  // ── Quiz ───────────────────────────────────────────────────────
  async getQuiz(): Promise<QuizQuestion[]> {
    return getAPI().apiRequest('/api/quiz', 'GET') as Promise<QuizQuestion[]>;
  }

  async submitAnswer(vocabularyId: string, correct: boolean): Promise<{ success: boolean; streak: number }> {
    return getAPI().apiRequest('/api/quiz/submit', 'POST', {
      vocabularyId,
      correct,
      answeredAt: new Date().toISOString(),
    }) as Promise<{ success: boolean; streak: number }>;
  }

  // ── Progress ───────────────────────────────────────────────────
  async getProgress(): Promise<UserProgress> {
    return getAPI().apiRequest('/api/progress', 'GET') as Promise<UserProgress>;
  }

  // ── Reading Passages ──────────────────────────────────────────
  async getReadingPassages(): Promise<ReadingPassage[]> {
    return getAPI().apiRequest('/api/reading', 'GET') as Promise<ReadingPassage[]>;
  }

  async getReadingPassagesBySurah(surahNumber: number): Promise<ReadingPassage[]> {
    return getAPI().apiRequest(`/api/reading/${surahNumber}`, 'GET') as Promise<ReadingPassage[]>;
  }
}
