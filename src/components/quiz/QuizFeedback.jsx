export default function QuizFeedback({ show, correct, message }) {
  if (!show) return null;

  return (
    <div
      className={`quiz-feedback show ${correct ? 'correct-fb' : 'wrong-fb'}`}
    >
      {message}
    </div>
  );
}
