import { useState } from 'react';
import LETTERS from '../../data/letters.json';
import LetterCard from './LetterCard.jsx';
import LetterDetailModal from './LetterDetailModal.jsx';

export default function AlphabetGrid() {
  const [selectedLetter, setSelectedLetter] = useState(null);

  return (
    <div className="screen active">
      <div className="section-title">
        Arabic Alphabet &mdash; 28 Letters <div className="line" />
      </div>
      <div className="letter-grid">
        {LETTERS.map((letter, i) => (
          <LetterCard
            key={letter.name}
            letter={letter}
            onClick={() => setSelectedLetter(letter)}
          />
        ))}
      </div>
      {selectedLetter && (
        <LetterDetailModal
          letter={selectedLetter}
          onClose={() => setSelectedLetter(null)}
        />
      )}
    </div>
  );
}
