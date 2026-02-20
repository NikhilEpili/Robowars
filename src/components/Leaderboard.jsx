import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournament } from '../store';

const ROUNDS = [
  { key: 'qualifiers', label: 'Qualifiers' },
  { key: 'quarter-finals', label: 'Quarter Finals' },
  { key: 'semi-finals', label: 'Semi Finals' },
  { key: 'finals', label: 'Finals' },
];

// ── Rank badge colors ──
function rankStyle(rank) {
  if (rank === 1) return 'text-robo-yellow border-robo-yellow bg-yellow-900/20';
  if (rank === 2) return 'text-gray-300 border-gray-400 bg-gray-700/20';
  if (rank === 3) return 'text-orange-400 border-orange-400 bg-orange-900/20';
  return 'text-gray-500 border-gray-600 bg-gray-800/20';
}

function RankBadge({ rank }) {
  return (
    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center font-display font-bold text-[10px] ${rankStyle(rank)}`}>
      {rank}
    </div>
  );
}

function ResultRow({ rank, name, score }) {
  return (
    <div className="grid grid-cols-[32px_1fr_70px] items-center gap-2 px-2 py-1 rounded-lg border border-transparent hover:bg-white/[0.02] hover:border-robo-border">
      <RankBadge rank={rank} />
      <span className="font-display font-semibold text-white text-[11px] tracking-wide leading-tight truncate">
        {name}
      </span>
      <span className="text-right font-mono font-bold text-[11px] text-white">
        {score.toFixed(1)}
      </span>
    </div>
  );
}

// ── Leaderboard ──
export default function Leaderboard() {
  const { teams, matchResults, roundResults, currentRound, resetAll, advanceRound, matches } = useTournament();
  const navigate = useNavigate();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advanceMessage, setAdvanceMessage] = useState('');

  const [viewRound, setViewRound] = useState(currentRound || 'qualifiers');

  const teamById = new Map(teams.map(t => [t.id, t]));

  function dedupeResultsByTeam(results) {
    const byTeam = new Map();
    results.forEach((r) => {
      const existing = byTeam.get(r.teamId);
      if (!existing || r.score > existing.score) {
        byTeam.set(r.teamId, r);
      }
    });
    return Array.from(byTeam.values());
  }
  
  // Get round-specific leaderboards based on viewRound
  const roundData = roundResults?.[viewRound] || (viewRound === currentRound ? matchResults : { winners: [], losers: [] });
  const roundMatchCount = matches.filter(m => (m.round || 'qualifiers') === viewRound).length;
  const winnersRaw = dedupeResultsByTeam(roundData?.winners || [])
    .sort((a, b) => b.score - a.score);
  const losersRaw = dedupeResultsByTeam(roundData?.losers || [])
    .sort((a, b) => b.score - a.score);

  const winners = roundMatchCount > 0 && winnersRaw.length > roundMatchCount
    ? winnersRaw.slice(0, roundMatchCount)
    : winnersRaw;
  const losers = roundMatchCount > 0 && losersRaw.length > roundMatchCount
    ? losersRaw.slice(0, roundMatchCount)
    : losersRaw;

  function handleReset() {
    setShowResetConfirm(true);
  }

  function confirmReset() {
    resetAll();
    setShowResetConfirm(false);
  }

  function handleAdvanceRound() {
    const roundMap = {
      'qualifiers': 'quarter-finals',
      'quarter-finals': 'semi-finals',
      'semi-finals': 'finals',
    };
    const nextRound = roundMap[currentRound];
    if (nextRound) {
      advanceRound(currentRound, nextRound);
      const roundLabels = {
        'quarter-finals': 'Quarter Finals',
        'semi-finals': 'Semi Finals',
        'finals': 'Finals'
      };
      setAdvanceMessage(`Advanced to ${roundLabels[nextRound]}! Remaining teams have been auto-matched.`);
      setShowAdvanceModal(true);
      setViewRound(nextRound);
    }
  }

  function handleDownloadCSV() {
    const lines = [];
    
    // Tournament Summary
    lines.push('ROBOWARS TOURNAMENT - DETAILED RESULTS');
    lines.push(`Generated: ${new Date().toLocaleString()}`);
    lines.push('');
    lines.push(`Total Teams: ${teams.length}`);
    lines.push(`Total Winners: ${winners.length}`);
    lines.push(`Total Losers: ${losers.length}`);
    lines.push('');
    lines.push('='.repeat(80));
    lines.push('');
    
    // Winners Section - Detailed
    lines.push('WINNERS LEADERBOARD - DETAILED BREAKDOWN');
    lines.push('Rank,Team Name,Match ID,Match Score,Team Total Score,Damage Total,Aggression Total,Control Total,Rounds Played');
    winners.forEach((entry, idx) => {
      const team = teamById.get(entry.teamId);
      lines.push(`${idx + 1},"${team?.name || 'Unknown'}",${entry.matchId},${entry.score.toFixed(1)},${team?.total.toFixed(1) || '0.0'},${team?.damageTotal.toFixed(1) || '0.0'},${team?.aggrTotal.toFixed(1) || '0.0'},${team?.ctrlTotal.toFixed(1) || '0.0'},${team?.rounds || 0}`);
    });
    
    lines.push('');
    lines.push('WINNERS SUMMARY');
    lines.push('Rank,Team Name,Match Score');
    winners.forEach((entry, idx) => {
      const team = teamById.get(entry.teamId);
      lines.push(`${idx + 1},"${team?.name || 'Unknown'}",${entry.score.toFixed(1)}`);
    });
    
    // Empty line separator
    lines.push('');
    lines.push('='.repeat(80));
    lines.push('');
    
    // Losers Section - Detailed
    lines.push('LOSERS LEADERBOARD - DETAILED BREAKDOWN');
    lines.push('Rank,Team Name,Match ID,Match Score,Team Total Score,Damage Total,Aggression Total,Control Total,Rounds Played');
    losers.forEach((entry, idx) => {
      const team = teamById.get(entry.teamId);
      lines.push(`${idx + 1},"${team?.name || 'Unknown'}",${entry.matchId},${entry.score.toFixed(1)},${team?.total.toFixed(1) || '0.0'},${team?.damageTotal.toFixed(1) || '0.0'},${team?.aggrTotal.toFixed(1) || '0.0'},${team?.ctrlTotal.toFixed(1) || '0.0'},${team?.rounds || 0}`);
    });
    
    lines.push('');
    lines.push('LOSERS SUMMARY');
    lines.push('Rank,Team Name,Match Score');
    losers.forEach((entry, idx) => {
      const team = teamById.get(entry.teamId);
      lines.push(`${idx + 1},"${team?.name || 'Unknown'}",${entry.score.toFixed(1)}`);
    });
    
    // Overall Team Statistics
    lines.push('');
    lines.push('='.repeat(80));
    lines.push('');
    lines.push('OVERALL TEAM STATISTICS');
    lines.push('Team Name,Total Score,Damage Points,Aggression Points,Control Points,Rounds Played');
    teams.forEach(team => {
      lines.push(`"${team.name}",${team.total.toFixed(1)},${team.damageTotal.toFixed(1)},${team.aggrTotal.toFixed(1)},${team.ctrlTotal.toFixed(1)},${team.rounds}`);
    });
    
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `robowars_detailed_report_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex-1 flex flex-col gap-4 min-h-0">
      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-robo-card border border-robo-red/40 rounded-2xl p-8 max-w-md w-full mx-4 shadow-glow-red">
            <h2 className="font-display font-bold text-2xl text-robo-red uppercase tracking-wider text-center mb-4">
              ⚠ Warning
            </h2>
            <p className="text-sm text-gray-300 font-body text-center mb-2">
              You are about to reset <strong className="text-white">ALL</strong> tournament data including:
            </p>
            <ul className="text-xs text-gray-400 font-mono mb-6 space-y-1 list-disc list-inside">
              <li>All team scores</li>
              <li>All match results</li>
              <li>Winners and losers leaderboards</li>
              <li>Match history</li>
            </ul>
            <p className="text-sm text-robo-red font-display font-bold text-center mb-8">
              This action CANNOT be undone!
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={confirmReset}
                className="w-full py-3 px-6 rounded-xl font-display font-bold uppercase tracking-wider text-sm bg-robo-red/20 text-robo-red border border-robo-red/40 hover:bg-robo-red/30 transition-all"
              >
                Yes, Reset Everything
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="w-full py-3 px-6 rounded-xl font-display font-bold uppercase tracking-wider text-sm bg-robo-card border border-robo-accent/40 text-robo-accent hover:bg-robo-accent/10 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advance Round Success Modal */}
      {showAdvanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-robo-card border border-robo-yellow/40 rounded-2xl p-8 max-w-md w-full mx-4 shadow-glow-yellow">
            <h2 className="font-display font-bold text-2xl text-robo-yellow uppercase tracking-wider text-center mb-4">
              ✨ Round Advanced!
            </h2>
            <p className="text-base text-gray-200 font-body text-center mb-6 leading-relaxed">
              {advanceMessage}
            </p>
            <button
              onClick={() => setShowAdvanceModal(false)}
              className="w-full py-3 px-6 rounded-xl font-display font-bold uppercase tracking-wider text-sm bg-robo-yellow/20 text-robo-yellow border border-robo-yellow/40 hover:bg-robo-yellow/30 transition-all"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-robo-accent" />
          <h2 className="font-display font-bold text-sm text-white tracking-wider uppercase">Tournament Results</h2>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">View:</label>
          <select
            value={viewRound}
            onChange={(e) => setViewRound(e.target.value)}
            className="bg-robo-dark border border-robo-border rounded-lg px-2 py-1 text-xs text-white font-body focus:border-robo-accent focus:outline-none cursor-pointer"
          >
            {ROUNDS.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-robo-yellow" />
          <h2 className="font-display font-bold text-sm text-white tracking-wider uppercase">Round Actions</h2>
        </div>
        <div className="flex items-center gap-2">
          {currentRound !== 'finals' && winners.length > 0 && (
            <button
              type="button"
              onClick={handleAdvanceRound}
              className="px-3 py-1.5 rounded-lg font-display font-bold uppercase tracking-wider text-[10px] bg-robo-yellow/20 border border-robo-yellow/40 text-robo-yellow hover:bg-robo-yellow/30 transition-colors"
            >
              → Advance Round
            </button>
          )}
          <button
            type="button"
            onClick={handleDownloadCSV}
            className="px-3 py-1.5 rounded-lg font-display font-bold uppercase tracking-wider text-[10px] bg-robo-card border border-robo-green/30 text-robo-green hover:bg-robo-green/10 transition-colors"
          >
            ↓ CSV
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg font-display font-bold uppercase tracking-wider text-[10px] bg-robo-card border border-robo-red/30 text-robo-red hover:bg-robo-red/10 transition-colors"
          >
            Reset All
          </button>
        </div>
      </div>
      
      <div className="bg-robo-card/50 rounded-xl border border-robo-border p-3 flex flex-col min-h-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-robo-green" />
          <h2 className="font-display font-bold text-sm text-white tracking-wider uppercase">Winners Leaderboard</h2>
        </div>
        <div className="grid grid-cols-[32px_1fr_70px] gap-2 px-2 py-0.5 text-[8px] text-gray-500 font-mono uppercase tracking-widest border-b border-robo-border mb-1">
          <span>Rank</span>
          <span>Team</span>
          <span className="text-right">Score</span>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-0">
          {winners.length === 0 && (
            <div className="text-center text-xs font-mono text-gray-600 py-6">No winners yet</div>
          )}
          {winners.map((entry, idx) => (
            <ResultRow
              key={`${entry.matchId}-${entry.teamId}`}
              rank={idx + 1}
              name={teamById.get(entry.teamId)?.name || 'Unknown'}
              score={entry.score}
            />
          ))}
        </div>
      </div>

      <div className="bg-robo-card/50 rounded-xl border border-robo-border p-3 flex flex-col min-h-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-robo-red" />
          <h2 className="font-display font-bold text-sm text-white tracking-wider uppercase">Losers Leaderboard</h2>
        </div>
        <div className="grid grid-cols-[32px_1fr_70px] gap-2 px-2 py-0.5 text-[8px] text-gray-500 font-mono uppercase tracking-widest border-b border-robo-border mb-1">
          <span>Rank</span>
          <span>Team</span>
          <span className="text-right">Score</span>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-0">
          {losers.length === 0 && (
            <div className="text-center text-xs font-mono text-gray-600 py-6">No losers yet</div>
          )}
          {losers.map((entry, idx) => (
            <ResultRow
              key={`${entry.matchId}-${entry.teamId}`}
              rank={idx + 1}
              name={teamById.get(entry.teamId)?.name || 'Unknown'}
              score={entry.score}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
