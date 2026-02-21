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
  // Alphabet
  { id: 'a1', arabic: 'ا', transliteration: 'alif', english: 'Alif (a/aa)', category: 'Alphabet', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'a2', arabic: 'ب', transliteration: 'ba', english: 'Ba (b)', category: 'Alphabet', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'a3', arabic: 'ت', transliteration: 'ta', english: 'Ta (t)', category: 'Alphabet', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'a4', arabic: 'ث', transliteration: 'tha', english: 'Tha (th)', category: 'Alphabet', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'a5', arabic: 'ج', transliteration: 'jim', english: 'Jim (j)', category: 'Alphabet', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'a6', arabic: 'ح', transliteration: 'ha', english: 'Ha (h - emphatic)', category: 'Alphabet', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'a7', arabic: 'خ', transliteration: 'kha', english: 'Kha (kh)', category: 'Alphabet', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'a8', arabic: 'د', transliteration: 'dal', english: 'Dal (d)', category: 'Alphabet', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'a9', arabic: 'ذ', transliteration: 'dhal', english: 'Dhal (dh)', category: 'Alphabet', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'a10', arabic: 'ر', transliteration: 'ra', english: 'Ra (r)', category: 'Alphabet', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'a11', arabic: 'ز', transliteration: 'zay', english: 'Zay (z)', category: 'Alphabet', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'a12', arabic: 'س', transliteration: 'sin', english: 'Sin (s)', category: 'Alphabet', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'a13', arabic: 'ش', transliteration: 'shin', english: 'Shin (sh)', category: 'Alphabet', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'a14', arabic: 'ص', transliteration: 'sad', english: 'Sad (s - emphatic)', category: 'Alphabet', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'a15', arabic: 'ض', transliteration: 'dad', english: 'Dad (d - emphatic)', category: 'Alphabet', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'a16', arabic: 'ط', transliteration: 'ta', english: 'Ta (t - emphatic)', category: 'Alphabet', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'a17', arabic: 'ظ', transliteration: 'dha', english: 'Dha (dh - emphatic)', category: 'Alphabet', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'a18', arabic: 'ع', transliteration: '\'ayn', english: 'Ayn (deep throat sound)', category: 'Alphabet', difficulty: 3, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'a19', arabic: 'غ', transliteration: 'ghayn', english: 'Ghayn (gh)', category: 'Alphabet', difficulty: 2, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'a20', arabic: 'ف', transliteration: 'fa', english: 'Fa (f)', category: 'Alphabet', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'a21', arabic: 'ق', transliteration: 'qaf', english: 'Qaf (q - deep)', category: 'Alphabet', difficulty: 3, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'a22', arabic: 'ك', transliteration: 'kaf', english: 'Kaf (k)', category: 'Alphabet', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'a23', arabic: 'ل', transliteration: 'lam', english: 'Lam (l)', category: 'Alphabet', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'a24', arabic: 'م', transliteration: 'mim', english: 'Mim (m)', category: 'Alphabet', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'a25', arabic: 'ن', transliteration: 'nun', english: 'Nun (n)', category: 'Alphabet', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'a26', arabic: 'ه', transliteration: 'ha', english: 'Ha (h - soft)', category: 'Alphabet', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'a27', arabic: 'و', transliteration: 'waw', english: 'Waw (w/oo)', category: 'Alphabet', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },
  { id: 'a28', arabic: 'ي', transliteration: 'ya', english: 'Ya (y/ee)', category: 'Alphabet', difficulty: 1, timesCorrect: 0, timesIncorrect: 0, lastReviewed: null },

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

// ─── Quran Reading Passages ─────────────────────────────────────────

interface QuranPassage {
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

const QURAN_PASSAGES: QuranPassage[] = [
  // Al-Fatiha (The Opening) - complete
  {
    id: 'q1_1', surah: 'Al-Fatiha', surahNumber: 1, ayah: 1,
    arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    transliteration: 'Bismillahir rahmanir raheem',
    translation: 'In the name of God, the Most Gracious, the Most Merciful',
    wordByWord: [
      { arabic: 'بِسْمِ', transliteration: 'bismi', english: 'In the name' },
      { arabic: 'اللَّهِ', transliteration: 'allahi', english: 'of God' },
      { arabic: 'الرَّحْمَٰنِ', transliteration: 'ar-rahmani', english: 'the Most Gracious' },
      { arabic: 'الرَّحِيمِ', transliteration: 'ar-raheemi', english: 'the Most Merciful' },
    ],
    difficulty: 1,
  },
  {
    id: 'q1_2', surah: 'Al-Fatiha', surahNumber: 1, ayah: 2,
    arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ',
    transliteration: 'Alhamdu lillahi rabbil \'aalameen',
    translation: 'All praise is due to God, Lord of all the worlds',
    wordByWord: [
      { arabic: 'الْحَمْدُ', transliteration: 'al-hamdu', english: 'All praise' },
      { arabic: 'لِلَّهِ', transliteration: 'lillahi', english: 'is due to God' },
      { arabic: 'رَبِّ', transliteration: 'rabbi', english: 'Lord' },
      { arabic: 'الْعَالَمِينَ', transliteration: 'al-\'aalameen', english: 'of the worlds' },
    ],
    difficulty: 1,
  },
  {
    id: 'q1_3', surah: 'Al-Fatiha', surahNumber: 1, ayah: 3,
    arabic: 'الرَّحْمَٰنِ الرَّحِيمِ',
    transliteration: 'Ar-rahmanir raheem',
    translation: 'The Most Gracious, the Most Merciful',
    wordByWord: [
      { arabic: 'الرَّحْمَٰنِ', transliteration: 'ar-rahmani', english: 'The Most Gracious' },
      { arabic: 'الرَّحِيمِ', transliteration: 'ar-raheemi', english: 'the Most Merciful' },
    ],
    difficulty: 1,
  },
  {
    id: 'q1_4', surah: 'Al-Fatiha', surahNumber: 1, ayah: 4,
    arabic: 'مَالِكِ يَوْمِ الدِّينِ',
    transliteration: 'Maliki yawmid deen',
    translation: 'Master of the Day of Judgment',
    wordByWord: [
      { arabic: 'مَالِكِ', transliteration: 'maliki', english: 'Master/Owner' },
      { arabic: 'يَوْمِ', transliteration: 'yawmi', english: 'of the Day' },
      { arabic: 'الدِّينِ', transliteration: 'ad-deeni', english: 'of Judgment' },
    ],
    difficulty: 1,
  },
  {
    id: 'q1_5', surah: 'Al-Fatiha', surahNumber: 1, ayah: 5,
    arabic: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ',
    transliteration: 'Iyyaka na\'budu wa iyyaka nasta\'een',
    translation: 'You alone we worship, and You alone we ask for help',
    wordByWord: [
      { arabic: 'إِيَّاكَ', transliteration: 'iyyaka', english: 'You alone' },
      { arabic: 'نَعْبُدُ', transliteration: 'na\'budu', english: 'we worship' },
      { arabic: 'وَإِيَّاكَ', transliteration: 'wa iyyaka', english: 'and You alone' },
      { arabic: 'نَسْتَعِينُ', transliteration: 'nasta\'een', english: 'we ask for help' },
    ],
    difficulty: 2,
  },
  {
    id: 'q1_6', surah: 'Al-Fatiha', surahNumber: 1, ayah: 6,
    arabic: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ',
    transliteration: 'Ihdinas siratal mustaqeem',
    translation: 'Guide us to the straight path',
    wordByWord: [
      { arabic: 'اهْدِنَا', transliteration: 'ihdina', english: 'Guide us' },
      { arabic: 'الصِّرَاطَ', transliteration: 'as-sirata', english: 'to the path' },
      { arabic: 'الْمُسْتَقِيمَ', transliteration: 'al-mustaqeema', english: 'the straight' },
    ],
    difficulty: 2,
  },
  {
    id: 'q1_7', surah: 'Al-Fatiha', surahNumber: 1, ayah: 7,
    arabic: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ',
    transliteration: 'Siratal ladhina an\'amta \'alayhim ghayril maghdubi \'alayhim walad daalleen',
    translation: 'The path of those upon whom You have bestowed favor, not of those who have earned anger nor of those who are astray',
    wordByWord: [
      { arabic: 'صِرَاطَ', transliteration: 'sirata', english: 'The path' },
      { arabic: 'الَّذِينَ', transliteration: 'alladhina', english: 'of those whom' },
      { arabic: 'أَنْعَمْتَ', transliteration: 'an\'amta', english: 'You have blessed' },
      { arabic: 'عَلَيْهِمْ', transliteration: '\'alayhim', english: 'upon them' },
      { arabic: 'غَيْرِ', transliteration: 'ghayri', english: 'not' },
      { arabic: 'الْمَغْضُوبِ', transliteration: 'al-maghdubi', english: 'those who earned wrath' },
      { arabic: 'عَلَيْهِمْ', transliteration: '\'alayhim', english: 'upon them' },
      { arabic: 'وَلَا', transliteration: 'wa la', english: 'and not' },
      { arabic: 'الضَّالِّينَ', transliteration: 'ad-daalleen', english: 'those astray' },
    ],
    difficulty: 3,
  },
  // Al-Ikhlas (Sincerity) - complete
  {
    id: 'q112_1', surah: 'Al-Ikhlas', surahNumber: 112, ayah: 1,
    arabic: 'قُلْ هُوَ اللَّهُ أَحَدٌ',
    transliteration: 'Qul huwa Allahu ahad',
    translation: 'Say: He is God, the One',
    wordByWord: [
      { arabic: 'قُلْ', transliteration: 'qul', english: 'Say' },
      { arabic: 'هُوَ', transliteration: 'huwa', english: 'He is' },
      { arabic: 'اللَّهُ', transliteration: 'allahu', english: 'God' },
      { arabic: 'أَحَدٌ', transliteration: 'ahad', english: 'the One' },
    ],
    difficulty: 1,
  },
  {
    id: 'q112_2', surah: 'Al-Ikhlas', surahNumber: 112, ayah: 2,
    arabic: 'اللَّهُ الصَّمَدُ',
    transliteration: 'Allahus samad',
    translation: 'God, the Eternal Refuge',
    wordByWord: [
      { arabic: 'اللَّهُ', transliteration: 'allahu', english: 'God' },
      { arabic: 'الصَّمَدُ', transliteration: 'as-samad', english: 'the Eternal Refuge' },
    ],
    difficulty: 1,
  },
  {
    id: 'q112_3', surah: 'Al-Ikhlas', surahNumber: 112, ayah: 3,
    arabic: 'لَمْ يَلِدْ وَلَمْ يُولَدْ',
    transliteration: 'Lam yalid wa lam yulad',
    translation: 'He neither begets nor is born',
    wordByWord: [
      { arabic: 'لَمْ', transliteration: 'lam', english: 'Not' },
      { arabic: 'يَلِدْ', transliteration: 'yalid', english: 'He begets' },
      { arabic: 'وَلَمْ', transliteration: 'wa lam', english: 'and not' },
      { arabic: 'يُولَدْ', transliteration: 'yulad', english: 'is He born' },
    ],
    difficulty: 2,
  },
  {
    id: 'q112_4', surah: 'Al-Ikhlas', surahNumber: 112, ayah: 4,
    arabic: 'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ',
    transliteration: 'Wa lam yakun lahu kufuwan ahad',
    translation: 'Nor is there to Him any equivalent',
    wordByWord: [
      { arabic: 'وَلَمْ', transliteration: 'wa lam', english: 'And not' },
      { arabic: 'يَكُن', transliteration: 'yakun', english: 'is there' },
      { arabic: 'لَّهُ', transliteration: 'lahu', english: 'to Him' },
      { arabic: 'كُفُوًا', transliteration: 'kufuwan', english: 'equivalent' },
      { arabic: 'أَحَدٌ', transliteration: 'ahad', english: 'anyone' },
    ],
    difficulty: 2,
  },
  // Ayat al-Kursi (The Throne Verse) - 2:255
  {
    id: 'q2_255', surah: 'Al-Baqarah', surahNumber: 2, ayah: 255,
    arabic: 'اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ',
    transliteration: 'Allahu la ilaha illa huwal hayyul qayyum',
    translation: 'God - there is no deity except Him, the Ever-Living, the Sustainer of existence',
    wordByWord: [
      { arabic: 'اللَّهُ', transliteration: 'allahu', english: 'God' },
      { arabic: 'لَا إِلَٰهَ', transliteration: 'la ilaha', english: 'there is no deity' },
      { arabic: 'إِلَّا', transliteration: 'illa', english: 'except' },
      { arabic: 'هُوَ', transliteration: 'huwa', english: 'Him' },
      { arabic: 'الْحَيُّ', transliteration: 'al-hayyu', english: 'the Ever-Living' },
      { arabic: 'الْقَيُّومُ', transliteration: 'al-qayyum', english: 'the Sustainer' },
    ],
    difficulty: 3,
  },
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
      if (url === '/api/reading' && method === 'GET') {
        return this.getReadingPassages();
      }
      if (url.startsWith('/api/reading/') && method === 'GET') {
        const surahNum = parseInt(url.split('/api/reading/')[1], 10);
        return this.getReadingPassagesBySurah(surahNum);
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
      'Alphabet': 'type',
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

  // ─── Reading Passages ────────────────────────────────────────────

  private getReadingPassages(): QuranPassage[] {
    return QURAN_PASSAGES;
  }

  private getReadingPassagesBySurah(surahNumber: number): QuranPassage[] {
    return QURAN_PASSAGES.filter(p => p.surahNumber === surahNumber);
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
        if (data.vocabulary) {
          // Merge saved progress into current vocabulary.
          // This ensures new words added in updates appear while
          // keeping the user's progress on existing words.
          const savedMap = new Map<string, VocabularyItem>();
          for (const item of data.vocabulary) {
            savedMap.set(item.id, item);
          }
          this.vocabulary = VOCABULARY.map(word => {
            const saved = savedMap.get(word.id);
            if (saved) {
              return { ...word, timesCorrect: saved.timesCorrect, timesIncorrect: saved.timesIncorrect, lastReviewed: saved.lastReviewed };
            }
            return { ...word };
          });
        }
        if (data.quizHistory) this.quizHistory = data.quizHistory;
        if (data.streak !== undefined) this.streak = data.streak;
      }
    } catch (err) {
      console.error('[EmbeddedService] Failed to load persisted data:', err);
    }
  }
}
