import { useState, useCallback } from 'react';
import SENTENCES from '../../data/sentences.json';
import { shuffle } from '../../utils/shuffle.js';
import ReadingCard from './ReadingCard.jsx';

export default function ReadingPractice() {
  const [sentences, setSentences] = useState(() =>
    shuffle([...SENTENCES]).slice(0, 5)
  );
  const [key, setKey] = useState(0);

  const refresh = useCallback(() => {
    setSentences(shuffle([...SENTENCES]).slice(0, 5));
    setKey((k) => k + 1);
  }, []);

  return (
    <div className="screen active">
      <div className="section-title">
        Reading Practice <div className="line" />
      </div>
      <div key={key}>
        {sentences.map((s, i) => (
          <ReadingCard key={`${key}-${i}`} sentence={s} />
        ))}
      </div>
      <button
        className="quiz-next show"
        style={{ marginTop: 16 }}
        onClick={refresh}
      >
        New Sentences &rarr;
      </button>
    </div>
  );
}
