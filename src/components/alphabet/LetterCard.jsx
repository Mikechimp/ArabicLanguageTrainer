import { useGame } from '../../context/GameContext.jsx';
import { playTap } from '../../utils/sounds.js';

export default function LetterCard({ letter, onClick }) {
  const { state } = useGame();
  const mastery = state.letterMastery[letter.name] || 0;
  const mastered = mastery >= 3;

  return (
    <div
      className={`letter-card${mastered ? ' mastered' : ''}`}
      onClick={() => { playTap(); onClick(); }}
    >
      <div className="mastery-dot" />
      <div className="ar">{letter.ar}</div>
      <div className="name">{letter.name}</div>
      <div className="sound">{letter.sound}</div>
    </div>
  );
}
