/**
 * Embedded Service
 *
 * A TypeScript implementation of the backend API that runs inside
 * the Electron main process. This serves as:
 *   1. A fallback when the C# .NET backend is not available
 *   2. A development convenience (no need to build C# during UI work)
 *   3. A reference implementation that mirrors the C# API contract
 *
 * The API surface is identical to the C# backend, so the renderer
 * doesn't know or care which one it's talking to.
 *
 * NOTE: This service handles requests directly via handleRequest() -
 * no HTTP server needed. The BackendManager calls handleRequest()
 * from the IPC handler in the main process.
 */

import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

// ─── Data Types (mirrors C# Models) ─────────────────────────────────

interface VocabularyItem {
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

interface QuizQuestion {
  id: string;
  vocabularyId: string;
  arabic: string;
  transliteration: string;
  correctAnswer: string;
  options: string[];
  category: string;
}

interface QuizResult {
  vocabularyId: string;
  correct: boolean;
  answeredAt: string;
}

interface UserProgress {
  totalWords: number;
  wordsLearned: number;
  accuracy: number;
  streak: number;
  lastSession: string | null;
  categoryProgress: Record<string, { learned: number; total: number }>;
}

// ─── Vocabulary Data ─────────────────────────────────────────────────

const VOCABULARY: VocabularyItem[] = [
  // Greetings
  { id: 'g1', arabic: 'مرحبا', transliteration: 'marhaba', english: 'Hello', category: 'Greetings', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'g2', arabic: 'السلام عليكم', transliteration: 'as-salamu alaykum', english: 'Peace be upon you', category: 'Greetings', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'g3', arabic: 'صباح الخير', transliteration: 'sabah al-khayr', english: 'Good morning', category: 'Greetings', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'g4', arabic: 'مساء الخير', transliteration: 'masa al-khayr', english: 'Good evening', category: 'Greetings', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'g5', arabic: 'مع السلامة', transliteration: 'ma as-salama', english: 'Goodbye', category: 'Greetings', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'g6', arabic: 'شكرا', transliteration: 'shukran', english: 'Thank you', category: 'Greetings', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'g7', arabic: 'عفوا', transliteration: 'afwan', english: 'You\'re welcome', category: 'Greetings', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'g8', arabic: 'من فضلك', transliteration: 'min fadlik', english: 'Please', category: 'Greetings', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },

  // Numbers
  { id: 'n1', arabic: 'واحد', transliteration: 'wahid', english: 'One', category: 'Numbers', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'n2', arabic: 'اثنان', transliteration: 'ithnan', english: 'Two', category: 'Numbers', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'n3', arabic: 'ثلاثة', transliteration: 'thalatha', english: 'Three', category: 'Numbers', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'n4', arabic: 'أربعة', transliteration: 'arba\'a', english: 'Four', category: 'Numbers', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'n5', arabic: 'خمسة', transliteration: 'khamsa', english: 'Five', category: 'Numbers', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'n6', arabic: 'عشرة', transliteration: 'ashara', english: 'Ten', category: 'Numbers', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'n7', arabic: 'مئة', transliteration: 'mi\'a', english: 'Hundred', category: 'Numbers', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'n8', arabic: 'ألف', transliteration: 'alf', english: 'Thousand', category: 'Numbers', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },

  // Common Words
  { id: 'c1', arabic: 'ماء', transliteration: 'ma\'', english: 'Water', category: 'Common Words', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'c2', arabic: 'طعام', transliteration: 'ta\'am', english: 'Food', category: 'Common Words', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'c3', arabic: 'بيت', transliteration: 'bayt', english: 'House', category: 'Common Words', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'c4', arabic: 'كتاب', transliteration: 'kitab', english: 'Book', category: 'Common Words', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'c5', arabic: 'سيارة', transliteration: 'sayyara', english: 'Car', category: 'Common Words', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'c6', arabic: 'مدرسة', transliteration: 'madrasa', english: 'School', category: 'Common Words', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'c7', arabic: 'صديق', transliteration: 'sadiq', english: 'Friend', category: 'Common Words', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'c8', arabic: 'عائلة', transliteration: 'a\'ila', english: 'Family', category: 'Common Words', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },

  // Phrases
  { id: 'p1', arabic: 'كيف حالك؟', transliteration: 'kayf halak?', english: 'How are you?', category: 'Phrases', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'p2', arabic: 'ما اسمك؟', transliteration: 'ma ismak?', english: 'What is your name?', category: 'Phrases', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'p3', arabic: 'أنا بخير', transliteration: 'ana bikhayr', english: 'I am fine', category: 'Phrases', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'p4', arabic: 'اسمي...', transliteration: 'ismi...', english: 'My name is...', category: 'Phrases', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'p5', arabic: 'أين الحمام؟', transliteration: 'ayn al-hammam?', english: 'Where is the bathroom?', category: 'Phrases', difficulty: 3, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'p6', arabic: 'كم الساعة؟', transliteration: 'kam as-sa\'a?', english: 'What time is it?', category: 'Phrases', difficulty: 3, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
];

// ─── Service Implementation ──────────────────────────────────────────

export class EmbeddedService {
  private running = false;
  private vocabulary: VocabularyItem[] = [...VOCABULARY];
  private quizHistory: QuizResult[] = [];
  private streak = 0;
  private dataPath: string = '';

  start(): void {
    try {
      this.dataPath = path.join(app.getPath('userData'), 'trainer-data.json');
      this.loadPersistedData();
    } catch (err) {
      console.warn('[EmbeddedService] Could not load persisted data, using defaults:', err);
      this.vocabulary = [...VOCABULARY];
    }
    this.running = true;
    console.log('[EmbeddedService] Service started (direct IPC mode)');
  }

  stop(): void {
    this.persistData();
    this.running = false;
  }

  isRunning(): boolean {
    return this.running;
  }

  /**
   * Handle a request directly (called from main process via IPC)
   */
  async handleRequest(endpoint: string, method: string, body?: unknown): Promise<unknown> {
    const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    try {
      if (url === '/api/health' && method === 'GET') {
        return { status: 'healthy', mode: 'embedded', timestamp: new Date().toISOString() };
      }
      if (url === '/api/vocabulary' && method === 'GET') {
        return this.getVocabulary();
      }
      if (url.startsWith('/api/vocabulary/') && method === 'GET') {
        const category = decodeURIComponent(url.split('/api/vocabulary/')[1]);
        return this.getVocabularyByCategory(category);
      }
      if (url === '/api/categories' && method === 'GET') {
        return this.getCategories();
      }
      if (url === '/api/quiz' && method === 'GET') {
        return this.generateQuiz();
      }
      if (url === '/api/quiz/submit' && method === 'POST') {
        return this.submitQuizResult(body as QuizResult);
      }
      if (url === '/api/progress' && method === 'GET') {
        return this.getProgress();
      }

      return { error: 'Not found', status: 404 };
    } catch (err) {
      console.error(`[EmbeddedService] Error handling ${method} ${url}:`, err);
      return { error: 'Internal error', status: 500 };
    }
  }

  // ─── API Handlers ────────────────────────────────────────────────

  private getVocabulary(): VocabularyItem[] {
    return this.vocabulary;
  }

  private getVocabularyByCategory(category: string): VocabularyItem[] {
    return this.vocabulary.filter(v => v.category.toLowerCase() === category.toLowerCase());
  }

  private getCategories(): { name: string; count: number; icon: string }[] {
    const categoryMap = new Map<string, number>();
    const icons: Record<string, string> = {
      'Greetings': 'hand-wave',
      'Numbers': 'hash',
      'Common Words': 'book-open',
      'Phrases': 'message-circle',
    };

    for (const item of this.vocabulary) {
      categoryMap.set(item.category, (categoryMap.get(item.category) || 0) + 1);
    }

    return Array.from(categoryMap.entries()).map(([name, count]) => ({
      name,
      count,
      icon: icons[name] || 'folder',
    }));
  }

  private generateQuiz(count = 10): QuizQuestion[] {
    const shuffled = [...this.vocabulary].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    return selected.map(item => {
      const others = this.vocabulary
        .filter(v => v.id !== item.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(v => v.english);

      const options = [item.english, ...others].sort(() => Math.random() - 0.5);

      return {
        id: `q_${item.id}_${Date.now()}`,
        vocabularyId: item.id,
        arabic: item.arabic,
        transliteration: item.transliteration,
        correctAnswer: item.english,
        options,
        category: item.category,
      };
    });
  }

  private submitQuizResult(result: QuizResult): { success: boolean; streak: number } {
    const item = this.vocabulary.find(v => v.id === result.vocabularyId);
    if (item) {
      if (result.correct) {
        item.timesCorrect++;
        this.streak++;
      } else {
        item.timesIncorrect++;
        this.streak = 0;
      }
      item.lastReviewed = new Date().toISOString();
    }

    this.quizHistory.push(result);
    this.persistData();

    return { success: true, streak: this.streak };
  }

  private getProgress(): UserProgress {
    const totalWords = this.vocabulary.length;
    const wordsLearned = this.vocabulary.filter(v => v.timesCorrect >= 3).length;
    const totalAttempts = this.vocabulary.reduce((sum, v) => sum + v.timesCorrect + v.timesIncorrect, 0);
    const totalCorrect = this.vocabulary.reduce((sum, v) => sum + v.timesCorrect, 0);
    const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

    const categoryProgress: Record<string, { learned: number; total: number }> = {};
    for (const item of this.vocabulary) {
      if (!categoryProgress[item.category]) {
        categoryProgress[item.category] = { learned: 0, total: 0 };
      }
      categoryProgress[item.category].total++;
      if (item.timesCorrect >= 3) {
        categoryProgress[item.category].learned++;
      }
    }

    return {
      totalWords,
      wordsLearned,
      accuracy,
      streak: this.streak,
      lastSession: this.quizHistory.length > 0
        ? this.quizHistory[this.quizHistory.length - 1].answeredAt
        : null,
      categoryProgress,
    };
  }

  // ─── Data Persistence ────────────────────────────────────────────

  private persistData(): void {
    try {
      if (!this.dataPath) return;
      const data = {
        vocabulary: this.vocabulary,
        quizHistory: this.quizHistory,
        streak: this.streak,
      };
      fs.writeFileSync(this.dataPath, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('[EmbeddedService] Failed to persist data:', err);
    }
  }

  private loadPersistedData(): void {
    try {
      if (this.dataPath && fs.existsSync(this.dataPath)) {
        const raw = fs.readFileSync(this.dataPath, 'utf-8');
        const data = JSON.parse(raw);
        if (data.vocabulary) this.vocabulary = data.vocabulary;
        if (data.quizHistory) this.quizHistory = data.quizHistory;
        if (data.streak !== undefined) this.streak = data.streak;
      }
    } catch (err) {
      console.error('[EmbeddedService] Failed to load persisted data:', err);
    }
  }
}
