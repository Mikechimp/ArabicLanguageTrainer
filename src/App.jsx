import { Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext.jsx';
import ParticleBackground from './components/layout/ParticleBackground.jsx';
import TopBar from './components/layout/TopBar.jsx';
import NavTabs from './components/layout/NavTabs.jsx';
import ComboPopup from './components/shared/ComboPopup.jsx';
import AlphabetGrid from './components/alphabet/AlphabetGrid.jsx';
import QuizArena from './components/quiz/QuizArena.jsx';
import WordBuilder from './components/words/WordBuilder.jsx';
import ReadingPractice from './components/reading/ReadingPractice.jsx';
import ProgressDashboard from './components/progress/ProgressDashboard.jsx';

export default function App() {
  return (
    <GameProvider>
      <ParticleBackground />
      <div id="app">
        <TopBar />
        <NavTabs />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<AlphabetGrid />} />
            <Route path="/quiz" element={<QuizArena />} />
            <Route path="/words" element={<WordBuilder />} />
            <Route path="/reading" element={<ReadingPractice />} />
            <Route path="/progress" element={<ProgressDashboard />} />
          </Routes>
        </div>
      </div>
      <ComboPopup />
    </GameProvider>
  );
}
