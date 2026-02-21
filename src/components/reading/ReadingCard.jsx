import { useState } from 'react';
import { stringSimilarity, normalizeTransliteration } from '../../utils/string-similarity.js';
import { calculateXP } from '../../utils/xp-calculator.js';
import { useGame } from '../../context/GameContext.jsx';

export default function ReadingCard({ sentence }) {
  const { state, correctAnswer, wrongAnswer } = useGame();
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [disabled, setDisabled] = useState(false);

  const handleCheck = () => {
    const cleanAnswer = normalizeTransliteration(sentence.tr);
    const userAnswer = input.toLowerCase().replace(/[\s\-']/g, '');
    const similarity = stringSimilarity(userAnswer, cleanAnswer);

    if (similarity > 0.7) {
      const xp = calculateXP('reading', state.streak + 1);
      correctAnswer(xp, null);
      setFeedback({
        correct: true,
        message: `✓ "${sentence.tr}" — ${sentence.en} — +${xp} XP`,
      });
      setDisabled(true);
    } else {
      wrongAnswer();
      setFeedback({
        correct: false,
        message: `Try again! The answer is: ${sentence.tr} (${sentence.en})`,
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !disabled) handleCheck();
  };

  return (
    <div className="reading-card">
      <div className="rc-arabic">{sentence.ar}</div>
      <div className="rc-hint">
        <span style={{ color: 'var(--teal)', fontWeight: 600 }}>Hint:</span>{' '}
        {sentence.hint}
      </div>
      <div className="reading-input-wrap">
        <input
          className="reading-input"
          placeholder="Type the transliteration..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        <button
          className="reading-submit"
          onClick={handleCheck}
          disabled={disabled}
        >
          Check
        </button>
      </div>
      {feedback && (
        <div
          className={`quiz-feedback show ${feedback.correct ? 'correct-fb' : 'wrong-fb'}`}
          style={{ marginTop: 10 }}
        >
          {feedback.message}
        </div>
      )}
    </div>
  );
}
