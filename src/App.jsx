import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TournamentProvider } from './store';
import DisplayPage from './pages/DisplayPage';
import AdminPage from './pages/AdminPage';
import MatchPage from './pages/MatchPage';
import HomePage from './pages/HomePage';

export default function App() {
  return (
    <BrowserRouter>
      <TournamentProvider>
        <Routes>
          {/* Home */}
          <Route path="/" element={<HomePage />} />
          {/* Projector view — clean display, no admin controls */}
          <Route path="/leaderboard" element={<DisplayPage />} />
          {/* Scoring / Judge panel — scoring form */}
          <Route path="/scoring" element={<AdminPage />} />
          {/* Full-screen match lineups page */}
          <Route path="/match" element={<MatchPage />} />
        </Routes>
      </TournamentProvider>
    </BrowserRouter>
  );
}
