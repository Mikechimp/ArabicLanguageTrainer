export default function LetterSlots({ slots, total }) {
  return (
    <div className="letter-slots">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`letter-slot${slots[i] ? ' filled correct-slot' : ''}`}
        >
          {slots[i] || ''}
        </div>
      ))}
    </div>
  );
}
