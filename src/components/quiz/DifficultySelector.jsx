const difficulties = ['easy', 'medium', 'hard'];

export default function DifficultySelector({ current, onChange }) {
  return (
    <div className="diff-selector">
      {difficulties.map((d) => (
        <button
          key={d}
          className={`diff-btn${d === current ? ' active' : ''}`}
          onClick={() => onChange(d)}
        >
          {d.charAt(0).toUpperCase() + d.slice(1)}
        </button>
      ))}
    </div>
  );
}
