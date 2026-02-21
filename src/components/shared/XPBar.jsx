import { useGame } from '../../context/GameContext.jsx';
import { xpForLevel } from '../../utils/xp-calculator.js';

export default function XPBar() {
  const { state } = useGame();
  const needed = xpForLevel(state.level);
  const pct = (state.xp / needed) * 100;

  return (
    <div className="xp-bar-wrap">
      <div className="xp-bar-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
