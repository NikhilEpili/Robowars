import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TournamentProvider } from './store';
import DisplayPage from './pages/DisplayPage';
import AdminPage from './pages/AdminPage';
import MatchPage from './pages/MatchPage';

export default function App() {
  return (
    <BrowserRouter>
      <TournamentProvider>
        <Routes>
          {/* Projector view — clean display, no admin controls */}
          <Route path="/" element={<DisplayPage />} />
          {/* Admin / Judge panel — scoring form + mini preview */}
          <Route path="/admin" element={<AdminPage />} />
          {/* Full-screen match lineups page */}
          <Route path="/match" element={<MatchPage />} />
        </Routes>
      </TournamentProvider>
    </BrowserRouter>
  );
}
