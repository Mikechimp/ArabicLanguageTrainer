export default function QuizOptions({
  options,
  optArabic,
  onSelect,
  answered,
  correctIndex,
  selectedIndex,
}) {
  return (
    <div className="quiz-options">
      {options.map((opt, i) => {
        let cls = 'quiz-option';
        if (answered) {
          if (i === correctIndex) cls += ' correct';
          else if (i === selectedIndex) cls += ' wrong';
        }
        return (
          <div
            key={i}
            className={cls}
            onClick={() => !answered && onSelect(i)}
          >
            {optArabic ? (
              <div className="opt-arabic">{opt}</div>
            ) : (
              opt
            )}
          </div>
        );
      })}
    </div>
  );
}
