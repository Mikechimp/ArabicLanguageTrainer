export default function QuizPrompt({ label, display, displayType }) {
  const isLetter = displayType === 'letter';

  return (
    <div className="quiz-prompt">
      <div className="prompt-label">{label}</div>
      <div
        className={isLetter ? 'prompt-letter' : 'prompt-text'}
        style={
          isLetter
            ? { fontFamily: "'Amiri', serif", direction: 'rtl' }
            : { fontFamily: "'Outfit', sans-serif", direction: 'ltr' }
        }
      >
        {display}
      </div>
    </div>
  );
}
