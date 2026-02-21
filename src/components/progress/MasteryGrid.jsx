import LETTERS from '../../data/letters.json';
import { useGame } from '../../context/GameContext.jsx';

export default function MasteryGrid() {
  const { state } = useGame();

  return (
    <div className="mastery-grid">
      {LETTERS.map((l) => {
        const m = state.letterMastery[l.name] || 0;
        const cls =
          m === 0 ? '' : m < 2 ? 'm-1' : m < 3 ? 'm-2' : 'm-3';
        return (
          <div className={`mastery-cell ${cls}`} key={l.name}>
            <span>{l.ar}</span>
            <div className="m-dots">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`m-dot${i < m ? ' filled' : ''}`}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
