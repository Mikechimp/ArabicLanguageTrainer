export default function LetterChoices({ choices, usedIndices, onSelect, wrongIndex }) {
  return (
    <div className="letter-choices">
      {choices.map((ch, i) => (
        <div
          key={i}
          className={`letter-choice${usedIndices.has(i) ? ' used' : ''}`}
          style={wrongIndex === i ? { borderColor: 'var(--rose)' } : undefined}
          onClick={() => !usedIndices.has(i) && onSelect(i, ch)}
        >
          {ch}
        </div>
      ))}
    </div>
  );
}
