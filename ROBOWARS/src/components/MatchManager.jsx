import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournament } from '../store';

const ROUNDS = [
  { key: 'qualifiers',     label: 'Qualifiers',     icon: '○',
    active: 'bg-robo-accent/20 border-robo-accent/50 text-robo-accent',
    inactive: 'bg-robo-dark/50 border-robo-border text-gray-500 hover:text-gray-300 hover:border-gray-500',
    heading: 'text-robo-accent' },
  { key: 'quarter-finals', label: 'Quarter Finals',  icon: '◉',
    active: 'bg-robo-yellow/20 border-robo-yellow/50 text-robo-yellow',
    inactive: 'bg-robo-dark/50 border-robo-border text-gray-500 hover:text-gray-300 hover:border-gray-500',
    heading: 'text-robo-yellow' },
  { key: 'semi-finals',    label: 'Semi Finals',     icon: '◈',
    active: 'bg-robo-orange/20 border-robo-orange/50 text-robo-orange',
    inactive: 'bg-robo-dark/50 border-robo-border text-gray-500 hover:text-gray-300 hover:border-gray-500',
    heading: 'text-robo-orange' },
  { key: 'finals',         label: 'Finals',          icon: '★',
    active: 'bg-robo-red/20 border-robo-red/50 text-robo-red',
    inactive: 'bg-robo-dark/50 border-robo-border text-gray-500 hover:text-gray-300 hover:border-gray-500',
    heading: 'text-robo-red' },
];

export default function MatchManager() {
  const { teams, matches, currentRound, addMatch, removeMatch, setRound, setCurrentMatch, activeTeams } = useTournament();
  const [newTeamA, setNewTeamA] = useState('');
  const [newTeamB, setNewTeamB] = useState('');
  const [addToRound, setAddToRound] = useState(currentRound || 'qualifiers');
  const [viewRound, setViewRound] = useState(currentRound || 'qualifiers');
  const navigate = useNavigate();

  // Update viewRound when currentRound changes
  useEffect(() => {
    setViewRound(currentRound || 'qualifiers');
  }, [currentRound]);

  // Memoize computed values to prevent unnecessary recalculations
  const availableTeams = useMemo(() => 
    teams.filter(t => activeTeams && activeTeams.includes(t.id)),
    [teams, activeTeams]
  );

  const availableForRound = useMemo(() => {
    // Get teams that have already played in current round
    const teamsPlayedInRound = new Set();
    matches
      .filter(m => (m.round || 'qualifiers') === addToRound)
      .forEach(m => {
        const teamA = teams.find(t => t.name === m.teamA);
        const teamB = teams.find(t => t.name === m.teamB);
        if (teamA) teamsPlayedInRound.add(teamA.name);
        if (teamB) teamsPlayedInRound.add(teamB.name);
      });

    // Show only teams that haven't played yet in this round
    return availableTeams.filter(t => !teamsPlayedInRound.has(t.name));
  }, [matches, addToRound, teams, availableTeams]);

  function handleAddMatch() {
    if (!newTeamA || !newTeamB || newTeamA === newTeamB) return;
    addMatch(newTeamA, newTeamB, 'upcoming', addToRound);
    setNewTeamA('');
    setNewTeamB('');
  }

  function handleStartScoring(matchId) {
    const match = matches.find(m => m.id === matchId);
    const teamA = match ? teams.find(t => t.name === match.teamA) : null;
    const teamB = match ? teams.find(t => t.name === match.teamB) : null;
    const startTotals = {
      ...(teamA ? { [teamA.id]: teamA.total } : {}),
      ...(teamB ? { [teamB.id]: teamB.total } : {}),
    };
    setCurrentMatch({ matchId, startTotals });
    navigate('/scoring');
  }

  return (
    <div className="bg-robo-card/50 rounded-xl border border-robo-border p-4 space-y-4">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-robo-yellow" />
            <h2 className="font-display font-bold text-sm text-white tracking-wider uppercase">Match Lineups</h2>
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

        <div className="mb-3">
          <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">Current Tournament Stage</label>
          <div className="flex gap-1.5">
            {ROUNDS.map(r => (
              <button
                key={r.key}
                onClick={() => setRound(r.key)}
                className={`flex-1 py-1.5 px-2 rounded-lg font-display font-bold text-[10px] uppercase tracking-wider border ${
                  currentRound === r.key ? r.active : r.inactive
                }`}
              >
                {r.icon} {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-robo-border pt-3">
        <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-2">Add Match</label>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">Team A</label>
            <select
              value={newTeamA}
              onChange={(e) => setNewTeamA(e.target.value)}
              className="w-full bg-robo-dark border border-robo-border rounded-lg px-2 py-1.5 text-xs text-white font-body focus:border-robo-accent focus:outline-none cursor-pointer"
            >
              <option value="">Select...</option>
              {availableForRound.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
          </div>
          <span className="pb-1.5 text-gray-600 font-display font-bold text-xs">VS</span>
          <div className="flex-1">
            <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">Team B</label>
            <select
              value={newTeamB}
              onChange={(e) => setNewTeamB(e.target.value)}
              className="w-full bg-robo-dark border border-robo-border rounded-lg px-2 py-1.5 text-xs text-white font-body focus:border-robo-accent focus:outline-none cursor-pointer"
            >
              <option value="">Select...</option>
              {availableForRound.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
          </div>
          <div className="w-28">
            <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">Stage</label>
            <select
              value={addToRound}
              onChange={(e) => setAddToRound(e.target.value)}
              className="w-full bg-robo-dark border border-robo-border rounded-lg px-2 py-1.5 text-xs text-white font-body focus:border-robo-accent focus:outline-none cursor-pointer"
            >
              {ROUNDS.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
          </div>
          <button
            type="button"
            onClick={handleAddMatch}
            disabled={!newTeamA || !newTeamB || newTeamA === newTeamB}
            className="px-4 py-1.5 rounded-lg font-display font-bold text-xs uppercase bg-robo-accent/20 text-robo-accent border border-robo-accent/30 hover:bg-robo-accent/30 disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
          >
            + Add
          </button>
        </div>
      </div>

      <div className="border-t border-robo-border pt-3 space-y-3 max-h-[520px] overflow-y-auto scrollbar-hide">
        {(() => {
          const roundMatches = matches.filter(m => (m.round || 'qualifiers') === viewRound);
          if (roundMatches.length === 0) {
            return <p className="text-xs text-gray-600 font-mono text-center py-3">No matches in this round</p>;
          }
          const round = ROUNDS.find(r => r.key === viewRound);
          return (
            <div key={viewRound}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`${round.heading} text-[10px]`}>{round.icon}</span>
                <span className={`text-[10px] font-display font-bold ${round.heading} uppercase tracking-wider`}>{round.label}</span>
                <span className="text-[9px] font-mono text-gray-600">({roundMatches.length})</span>
              </div>
              <div className="space-y-1">
                {roundMatches.map(m => (
                  <div key={m.id} className={`flex items-center gap-2 rounded-lg p-2 border text-xs ${
                    m.status === 'live' ? 'border-robo-red/40 bg-robo-red/5' :
                    m.status === 'next' ? 'border-robo-yellow/20 bg-robo-yellow/5' :
                    m.status === 'completed' ? 'border-gray-700/30 bg-gray-800/20 opacity-50' :
                    'border-robo-border bg-robo-card/30'
                  }`}>
                    <span className="text-[9px] font-mono text-gray-500 w-6">{m.id.replace('m','')}</span>
                    <span className="flex-1 font-body text-white truncate">
                      {m.teamA} <span className="text-gray-600 mx-1">vs</span> {m.teamB}
                    </span>
                    {m.status === 'completed' ? (
                      <span className="px-3 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase text-robo-green border border-robo-green/30 bg-robo-green/10">
                        ✓ Completed
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartScoring(m.id)}
                        className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase bg-robo-accent/10 text-robo-accent border border-robo-accent/30 hover:bg-robo-accent/20"
                      >
                        Start Scoring
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeMatch(m.id)}
                      className="w-6 h-6 flex items-center justify-center rounded bg-robo-red/10 border border-robo-red/30 text-robo-red hover:bg-robo-red/30 hover:text-white text-xs font-bold flex-shrink-0"
                      title="Remove match"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
