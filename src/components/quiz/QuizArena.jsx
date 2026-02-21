import { useState, useCallback, useEffect } from 'react';
import { useGame } from '../../context/GameContext.jsx';
import { generateQuizQuestion } from '../../utils/quiz-generators.js';
import { calculateXP } from '../../utils/xp-calculator.js';
import { triggerCombo } from '../shared/ComboPopup.jsx';
import DifficultySelector from './DifficultySelector.jsx';
import QuizPrompt from './QuizPrompt.jsx';
import QuizOptions from './QuizOptions.jsx';
import QuizFeedback from './QuizFeedback.jsx';

export default function QuizArena() {
  const { state, correctAnswer, wrongAnswer } = useGame();
  const [difficulty, setDifficulty] = useState('easy');
  const [question, setQuestion] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [feedback, setFeedback] = useState({ show: false, correct: false, message: '' });

  const generate = useCallback(() => {
    setQuestion(generateQuizQuestion(difficulty));
    setAnswered(false);
    setSelectedIndex(-1);
    setFeedback({ show: false, correct: false, message: '' });
  }, [difficulty]);

  useEffect(() => {
    generate();
  }, [generate]);

  const handleSelect = (index) => {
    if (answered) return;
    setAnswered(true);
    setSelectedIndex(index);

    if (index === question.correctIndex) {
      const xp = calculateXP(difficulty, state.streak + 1);
      correctAnswer(xp, question.letter?.name);
      const newStreak = state.streak + 1;
      setFeedback({
        show: true,
        correct: true,
        message: `✓ Correct! +${xp} XP${newStreak >= 3 ? ` (🔥 ${newStreak} streak!)` : ''}`,
      });
      if (newStreak === 5) triggerCombo('🔥 5 STREAK!');
      if (newStreak === 10) triggerCombo('⚡ 10 STREAK!!');
      if (newStreak === 20) triggerCombo('💎 20 STREAK!!!');
    } else {
      wrongAnswer();
      setFeedback({
        show: true,
        correct: false,
        message: `✗ The answer was: ${question.options[question.correctIndex]}`,
      });
    }
  };

  const handleDiffChange = (d) => {
    setDifficulty(d);
  };

  if (!question) return null;

  return (
    <div className="screen active">
      <div className="section-title">
        Battle Arena <div className="line" />
      </div>
      <DifficultySelector current={difficulty} onChange={handleDiffChange} />
      <div className="quiz-container">
        <QuizPrompt
          label={question.label}
          display={question.display}
          displayType={question.displayType}
        />
        <QuizOptions
          options={question.options}
          optArabic={question.optArabic}
          onSelect={handleSelect}
          answered={answered}
          correctIndex={question.correctIndex}
          selectedIndex={selectedIndex}
        />
        <QuizFeedback
          show={feedback.show}
          correct={feedback.correct}
          message={feedback.message}
        />
        {answered && (
          <button className="quiz-next show" onClick={generate}>
            Next &rarr;
          </button>
        )}
      </div>
    </div>
  );
}
