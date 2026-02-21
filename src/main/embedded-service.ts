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

  // Numbers (1-10)
  { id: 'n1', arabic: 'واحد', transliteration: 'wahid', english: 'One', category: 'Numbers', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'n2', arabic: 'اثنان', transliteration: 'ithnan', english: 'Two', category: 'Numbers', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'n3', arabic: 'ثلاثة', transliteration: 'thalatha', english: 'Three', category: 'Numbers', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'n4', arabic: 'أربعة', transliteration: 'arba\'a', english: 'Four', category: 'Numbers', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'n5', arabic: 'خمسة', transliteration: 'khamsa', english: 'Five', category: 'Numbers', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'n6', arabic: 'ستة', transliteration: 'sitta', english: 'Six', category: 'Numbers', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'n7', arabic: 'سبعة', transliteration: 'sab\'a', english: 'Seven', category: 'Numbers', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'n8', arabic: 'ثمانية', transliteration: 'thamaniya', english: 'Eight', category: 'Numbers', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'n9', arabic: 'تسعة', transliteration: 'tis\'a', english: 'Nine', category: 'Numbers', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'n10', arabic: 'عشرة', transliteration: 'ashara', english: 'Ten', category: 'Numbers', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  // Numbers (tens + units for building larger numbers)
  { id: 'n20', arabic: 'عشرون', transliteration: 'ishrun', english: 'Twenty', category: 'Numbers', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'n30', arabic: 'ثلاثون', transliteration: 'thalathun', english: 'Thirty', category: 'Numbers', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'n40', arabic: 'أربعون', transliteration: 'arba\'un', english: 'Forty', category: 'Numbers', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'n50', arabic: 'خمسون', transliteration: 'khamsun', english: 'Fifty', category: 'Numbers', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'n60', arabic: 'ستون', transliteration: 'sittun', english: 'Sixty', category: 'Numbers', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'n70', arabic: 'سبعون', transliteration: 'sab\'un', english: 'Seventy', category: 'Numbers', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'n80', arabic: 'ثمانون', transliteration: 'thamanun', english: 'Eighty', category: 'Numbers', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'n90', arabic: 'تسعون', transliteration: 'tis\'un', english: 'Ninety', category: 'Numbers', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'n100', arabic: 'مئة', transliteration: 'mi\'a', english: 'Hundred', category: 'Numbers', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'n1000', arabic: 'ألف', transliteration: 'alf', english: 'Thousand', category: 'Numbers', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },

  // Common Words
  { id: 'c1', arabic: 'ماء', transliteration: 'ma\'', english: 'Water', category: 'Common Words', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'c2', arabic: 'طعام', transliteration: 'ta\'am', english: 'Food', category: 'Common Words', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'c3', arabic: 'بيت', transliteration: 'bayt', english: 'House', category: 'Common Words', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'c4', arabic: 'كتاب', transliteration: 'kitab', english: 'Book', category: 'Common Words', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'c5', arabic: 'سيارة', transliteration: 'sayyara', english: 'Car', category: 'Common Words', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'c6', arabic: 'مدرسة', transliteration: 'madrasa', english: 'School', category: 'Common Words', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'c7', arabic: 'صديق', transliteration: 'sadiq', english: 'Friend', category: 'Common Words', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'c8', arabic: 'عائلة', transliteration: 'a\'ila', english: 'Family', category: 'Common Words', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'c9', arabic: 'رجل', transliteration: 'rajul', english: 'Man', category: 'Common Words', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'c10', arabic: 'امرأة', transliteration: 'imra\'a', english: 'Woman', category: 'Common Words', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'c11', arabic: 'ولد', transliteration: 'walad', english: 'Boy', category: 'Common Words', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'c12', arabic: 'بنت', transliteration: 'bint', english: 'Girl', category: 'Common Words', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'c13', arabic: 'يوم', transliteration: 'yawm', english: 'Day', category: 'Common Words', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'c14', arabic: 'ليلة', transliteration: 'layla', english: 'Night', category: 'Common Words', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'c15', arabic: 'شمس', transliteration: 'shams', english: 'Sun', category: 'Common Words', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'c16', arabic: 'قمر', transliteration: 'qamar', english: 'Moon', category: 'Common Words', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'c17', arabic: 'باب', transliteration: 'bab', english: 'Door', category: 'Common Words', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'c18', arabic: 'شارع', transliteration: 'shari\'', english: 'Street', category: 'Common Words', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'c19', arabic: 'مدينة', transliteration: 'madina', english: 'City', category: 'Common Words', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'c20', arabic: 'هاتف', transliteration: 'hatif', english: 'Phone', category: 'Common Words', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },

  // Phrases
  { id: 'p1', arabic: 'كيف حالك؟', transliteration: 'kayf halak?', english: 'How are you?', category: 'Phrases', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'p2', arabic: 'ما اسمك؟', transliteration: 'ma ismak?', english: 'What is your name?', category: 'Phrases', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'p3', arabic: 'أنا بخير', transliteration: 'ana bikhayr', english: 'I am fine', category: 'Phrases', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'p4', arabic: 'اسمي...', transliteration: 'ismi...', english: 'My name is...', category: 'Phrases', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'p5', arabic: 'أين الحمام؟', transliteration: 'ayn al-hammam?', english: 'Where is the bathroom?', category: 'Phrases', difficulty: 3, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'p6', arabic: 'كم الساعة؟', transliteration: 'kam as-sa\'a?', english: 'What time is it?', category: 'Phrases', difficulty: 3, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'p7', arabic: 'أنا لا أفهم', transliteration: 'ana la afham', english: 'I don\'t understand', category: 'Phrases', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'p8', arabic: 'هل تتكلم الإنجليزية؟', transliteration: 'hal tatakallam al-injiliziyya?', english: 'Do you speak English?', category: 'Phrases', difficulty: 3, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'p9', arabic: 'أريد أن أتعلم العربية', transliteration: 'urid an ata\'allam al-\'arabiyya', english: 'I want to learn Arabic', category: 'Phrases', difficulty: 3, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'p10', arabic: 'كم الثمن؟', transliteration: 'kam ath-thaman?', english: 'How much does it cost?', category: 'Phrases', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'p11', arabic: 'أنا جائع', transliteration: 'ana ja\'i\'', english: 'I am hungry', category: 'Phrases', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'p12', arabic: 'أنا عطشان', transliteration: 'ana \'atshan', english: 'I am thirsty', category: 'Phrases', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'p13', arabic: 'ساعدني من فضلك', transliteration: 'sa\'idni min fadlik', english: 'Help me please', category: 'Phrases', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'p14', arabic: 'أين المستشفى؟', transliteration: 'ayn al-mustashfa?', english: 'Where is the hospital?', category: 'Phrases', difficulty: 3, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'p15', arabic: 'تشرفنا', transliteration: 'tasharrafna', english: 'Nice to meet you', category: 'Phrases', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'p16', arabic: 'إن شاء الله', transliteration: 'in sha\' allah', english: 'God willing', category: 'Phrases', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
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
