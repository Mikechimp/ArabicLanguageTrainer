import StatsGrid from './StatsGrid.jsx';
import MasteryGrid from './MasteryGrid.jsx';

export default function ProgressDashboard() {
  return (
    <div className="screen active">
      <div className="section-title">
        Your Journey <div className="line" />
      </div>
      <StatsGrid />
      <div className="section-title" style={{ marginTop: 24 }}>
        Letter Mastery <div className="line" />
      </div>
      <MasteryGrid />
    </div>
  );
}
