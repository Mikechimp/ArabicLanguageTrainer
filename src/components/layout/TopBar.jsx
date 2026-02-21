import { useGame } from '../../context/GameContext.jsx';
import XPBar from '../shared/XPBar.jsx';

export default function TopBar() {
  const { state } = useGame();

  return (
    <div className="top-bar">
      <h1>
        ARABIC MASTERY <span className="arabic-title">العربية</span>
      </h1>
      <div className="stats-row">
        <div className="stat streak">
          <span className="icon">&#x1F525;</span>
          <span>{state.streak}</span>
        </div>
        <div className="stat xp">
          <span className="icon">&#x26A1;</span>
          <span>{state.xp}</span>
          <XPBar />
        </div>
        <div className="stat level">
          <span className="icon">&#x2605;</span>
          Lv <span>{state.level}</span>
        </div>
      </div>
    </div>
  );
}
