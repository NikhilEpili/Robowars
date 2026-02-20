import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Leaderboard from '../components/Leaderboard';
import { MatchLineupPanel, MatchTicker } from '../components/MatchLineups';
import { useTournament } from '../store';

export default function DisplayPage() {
  const { teams, byeTeamId } = useTournament();
  const byeTeam = byeTeamId ? teams.find(t => t.id === byeTeamId) : null;

  return (
    <div className="h-screen bg-robo-dark grid-bg flex flex-col overflow-hidden">
      <Header />

      {byeTeam && (
        <div className="flex items-center justify-center gap-2 py-1 bg-robo-purple/10 border-b border-robo-purple/20">
          <span className="w-2 h-2 rounded-full bg-robo-purple" />
          <span className="font-display font-bold text-xs text-robo-purple uppercase tracking-wider">
            BYE: {byeTeam.name} — advances without fighting
          </span>
        </div>
      )}

      <main className="flex-1 min-h-0 max-w-[1800px] w-full mx-auto px-4 py-1 flex gap-4">
        <Leaderboard />
        <MatchLineupPanel showAdvance={false} />
      </main>

      <MatchTicker />
    </div>
  );
}
