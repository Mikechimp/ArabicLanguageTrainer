import { useState, useCallback, useEffect } from 'react';
import LETTERS_DATA from '../../data/letters.json';
import VOCAB from '../../data/vocabulary.json';
import { shuffle } from '../../utils/shuffle.js';
import { calculateXP } from '../../utils/xp-calculator.js';
import { useGame } from '../../context/GameContext.jsx';
import LetterSlots from './LetterSlots.jsx';
import LetterChoices from './LetterChoices.jsx';
import QuizFeedback from '../quiz/QuizFeedback.jsx';

export default function WordBuilder() {
  const { state, correctAnswer, breakStreak } = useGame();
  const [word, setWord] = useState(null);
  const [slots, setSlots] = useState([]);
  const [slotIndex, setSlotIndex] = useState(0);
  const [choices, setChoices] = useState([]);
  const [usedIndices, setUsedIndices] = useState(new Set());
  const [wrongIndex, setWrongIndex] = useState(-1);
  const [feedback, setFeedback] = useState({ show: false, correct: false, message: '' });
  const [complete, setComplete] = useState(false);

  const generate = useCallback(() => {
    const w = VOCAB[Math.floor(Math.random() * VOCAB.length)];
    setWord(w);
    setSlots(new Array(w.letters.length).fill(null));
    setSlotIndex(0);
    setUsedIndices(new Set());
    setWrongIndex(-1);
    setFeedback({ show: false, correct: false, message: '' });
    setComplete(false);

    const extra = shuffle(LETTERS_DATA.map((l) => l.ar))
      .filter((a) => !w.letters.includes(a))
      .slice(0, Math.max(4, w.letters.length));
    setChoices(shuffle([...w.letters, ...extra]));
  }, []);

  useEffect(() => {
    generate();
  }, [generate]);

  const handleSelect = (choiceIndex, letter) => {
    if (complete || !word) return;

    const expected = word.letters[slotIndex];
    if (letter === expected) {
      const newSlots = [...slots];
      newSlots[slotIndex] = letter;
      setSlots(newSlots);
      setUsedIndices(new Set([...usedIndices, choiceIndex]));
      setWrongIndex(-1);
      setFeedback({ show: false, correct: false, message: '' });

      const nextIndex = slotIndex + 1;
      setSlotIndex(nextIndex);

      if (nextIndex >= word.letters.length) {
        setComplete(true);
        const xp = calculateXP('wordBuilder', state.streak + 1);
        correctAnswer(xp, null);
        setFeedback({
          show: true,
          correct: true,
          message: `🎉 Perfect! "${word.en}" — +${xp} XP`,
        });
      }
    } else {
      breakStreak();
      setWrongIndex(choiceIndex);
      setFeedback({
        show: true,
        correct: false,
        message: `Not quite — next letter is ${expected}`,
      });
      setTimeout(() => {
        setWrongIndex(-1);
        setFeedback({ show: false, correct: false, message: '' });
      }, 1200);
    }
  };

  if (!word) return null;

  return (
    <div className="screen active">
      <div className="section-title">
        Word Builder <div className="line" />
      </div>
      <div className="word-challenge">
        <div className="word-display">
          <div className="wd-arabic">{word.ar}</div>
          <div className="wd-transliteration">{word.tr}</div>
          <div className="wd-meaning">{word.en}</div>
        </div>
        <LetterSlots slots={slots} total={word.letters.length} />
        <LetterChoices
          choices={choices}
          usedIndices={usedIndices}
          onSelect={handleSelect}
          wrongIndex={wrongIndex}
        />
        <QuizFeedback
          show={feedback.show}
          correct={feedback.correct}
          message={feedback.message}
        />
        {complete && (
          <button className="quiz-next show" onClick={generate}>
            Next Word &rarr;
          </button>
        )}
      </div>
    </div>
  );
}
