import { useGame } from '../../context/GameContext.jsx';

export default function StatsGrid() {
  const { state } = useGame();
  const mastered = Object.values(state.letterMastery).filter((v) => v >= 3).length;
  const accuracy =
    state.totalAnswered > 0
      ? Math.round((state.totalCorrect / state.totalAnswered) * 100)
      : 0;
  const totalXP = state.xp + (state.level - 1) * 100;

  const stats = [
    { value: state.level, label: 'Level' },
    { value: totalXP, label: 'Total XP' },
    { value: state.maxStreak, label: 'Best Streak' },
    { value: `${accuracy}%`, label: 'Accuracy' },
    { value: state.totalAnswered, label: 'Answered' },
    { value: `${mastered}/28`, label: 'Mastered' },
  ];

  return (
    <div className="progress-grid">
      {stats.map((s) => (
        <div className="progress-card" key={s.label}>
          <div className="pc-value">{s.value}</div>
          <div className="pc-label">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
