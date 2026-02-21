import LETTERS from '../data/letters.json';
import VOCAB from '../data/vocabulary.json';
import { shuffle } from './shuffle.js';

function generateOptions(letter, count, field) {
  const correct = letter[field];
  const wrong = shuffle(LETTERS.filter((l) => l[field] !== correct))
    .slice(0, count - 1)
    .map((l) => l[field]);
  return shuffle([correct, ...wrong]);
}

export const QUIZ_TYPES = {
  easy: [
    {
      type: 'identify',
      label: 'What letter is this?',
      genQ: () => {
        const l = LETTERS[Math.floor(Math.random() * LETTERS.length)];
        const opts = generateOptions(l, 4, 'name');
        return {
          display: l.ar,
          displayType: 'letter',
          options: opts,
          correctIndex: opts.indexOf(l.name),
          letter: l,
        };
      },
    },
    {
      type: 'sound',
      label: 'What sound does this make?',
      genQ: () => {
        const l = LETTERS[Math.floor(Math.random() * LETTERS.length)];
        const opts = generateOptions(l, 4, 'sound');
        return {
          display: l.ar,
          displayType: 'letter',
          options: opts,
          correctIndex: opts.indexOf(l.sound),
          letter: l,
        };
      },
    },
  ],
  medium: [
    {
      type: 'name_to_letter',
      label: 'Find this letter:',
      genQ: () => {
        const l = LETTERS[Math.floor(Math.random() * LETTERS.length)];
        const wrong = shuffle(
          LETTERS.filter((x) => x.name !== l.name)
        ).slice(0, 3);
        const allOpts = shuffle([l, ...wrong]);
        return {
          display: l.name + ' (' + l.sound + ')',
          displayType: 'text',
          options: allOpts.map((o) => o.ar),
          correctIndex: allOpts.indexOf(l),
          letter: l,
          optArabic: true,
        };
      },
    },
    {
      type: 'form_identify',
      label: 'Which letter is this form?',
      genQ: () => {
        const l = LETTERS[Math.floor(Math.random() * LETTERS.length)];
        const forms = ['initial', 'medial', 'final'];
        const form = forms[Math.floor(Math.random() * forms.length)];
        const opts = generateOptions(l, 4, 'name');
        return {
          display: l[form],
          displayType: 'letter',
          options: opts,
          correctIndex: opts.indexOf(l.name),
          letter: l,
          sublabel: `(${form} form)`,
        };
      },
    },
  ],
  hard: [
    {
      type: 'word_meaning',
      label: 'What does this word mean?',
      genQ: () => {
        const w = VOCAB[Math.floor(Math.random() * VOCAB.length)];
        const wrongWords = shuffle(
          VOCAB.filter((x) => x.en !== w.en)
        ).slice(0, 3);
        const allOpts = shuffle([w.en, ...wrongWords.map((x) => x.en)]);
        return {
          display: w.ar,
          displayType: 'letter',
          options: allOpts,
          correctIndex: allOpts.indexOf(w.en),
          letter: { name: 'Vocab' },
        };
      },
    },
    {
      type: 'transliterate',
      label: 'How is this transliterated?',
      genQ: () => {
        const w = VOCAB[Math.floor(Math.random() * VOCAB.length)];
        const wrongWords = shuffle(
          VOCAB.filter((x) => x.tr !== w.tr)
        ).slice(0, 3);
        const allOpts = shuffle([w.tr, ...wrongWords.map((x) => x.tr)]);
        return {
          display: w.ar,
          displayType: 'letter',
          options: allOpts,
          correctIndex: allOpts.indexOf(w.tr),
          letter: { name: 'Vocab' },
        };
      },
    },
  ],
};

export function generateQuizQuestion(difficulty) {
  const types = QUIZ_TYPES[difficulty];
  const qt = types[Math.floor(Math.random() * types.length)];
  const q = qt.genQ();
  return { ...q, label: qt.label + (q.sublabel ? ' ' + q.sublabel : '') };
}
