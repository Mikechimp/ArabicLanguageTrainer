export default function LetterDetailModal({ letter, onClose }) {
  if (!letter) return null;

  return (
    <div className="modal-overlay active" onClick={(e) => {
      if (e.target.classList.contains('modal-overlay')) onClose();
    }}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>&#x2715;</button>
        <div className="big-letter">{letter.ar}</div>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--gold)' }}>
            {letter.name}
          </span>
          <span style={{ color: 'var(--teal)', marginLeft: 12, fontWeight: 600 }}>
            {letter.sound}
          </span>
          <span style={{ color: 'var(--text-dim)', marginLeft: 12, fontSize: '0.8rem' }}>
            {letter.type}
          </span>
        </div>
        <div className="forms-row">
          {['isolated', 'initial', 'medial', 'final'].map((form) => (
            <div className="form-box" key={form}>
              <div className="label">{form}</div>
              <div className="ar-form">{letter[form]}</div>
            </div>
          ))}
        </div>
        <div className="detail-section">
          <h4>&#x1F4A1; How to Remember</h4>
          <p>{letter.tip}</p>
        </div>
        <div className="detail-section">
          <h4>&#x1F4DA; Example Words</h4>
          <div>
            {letter.examples.map((ex, i) => (
              <div className="example-word" key={i}>
                <span className="ar-word">{ex.ar}</span>
                <span style={{ color: 'var(--teal)' }}>{ex.tr}</span>
                <span style={{ color: 'var(--text-dim)' }}>&mdash; {ex.en}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
