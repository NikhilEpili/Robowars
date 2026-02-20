import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTournament } from '../store';
import {
  DAMAGE_MULTIPLIERS, AGGRESSION_MULTIPLIERS, CONTROL_MULTIPLIERS,
  DAMAGE_BASE, AGGRESSION_BASE, CONTROL_BASE,
  calcSubmissionTotal,
} from '../scoring';

// ── Reusable UI Components ──

function Select({ label, value, onChange, options, className = '' }) {
  return (
    <div className={className}>
      {label && <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-robo-dark border border-robo-border rounded-lg px-3 py-2 text-sm text-white font-body focus:border-robo-accent focus:outline-none focus:ring-1 focus:ring-robo-accent/30 transition-colors appearance-none cursor-pointer"
      >
        {options.map(o => (
          <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
        ))}
      </select>
    </div>
  );
}

function NumberInput({ label, value, onChange, min = 0, className = '' }) {
  return (
    <div className={className}>
      {label && <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">{label}</label>}
      <input
        type="number"
        min={min}
        value={value}
        onChange={(e) => onChange(Math.max(min, parseInt(e.target.value) || 0))}
        className="w-full bg-robo-dark border border-robo-border rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-robo-accent focus:outline-none focus:ring-1 focus:ring-robo-accent/30 transition-colors"
      />
    </div>
  );
}

// ── Entry Row (one row with type + hits + live calc) ──
function EntryRow({ entry, onChange, onRemove, typeKey, typeLabel, multipliers, base, color }) {
  const typeValue = entry[typeKey];
  const pts = base * (multipliers[typeValue] ?? 1) * entry.hits;

  return (
    <div className="flex items-end gap-2">
      <Select
        label={typeLabel}
        value={typeValue}
        onChange={(v) => onChange({ ...entry, [typeKey]: v })}
        options={Object.keys(multipliers).map(k => ({
          value: k,
          label: `${k} (×${multipliers[k]})`
        }))}
        className="flex-1"
      />
      <NumberInput
        label="Hits"
        value={entry.hits}
        onChange={(v) => onChange({ ...entry, hits: v })}
        min={0}
        className="w-20"
      />
      <div className="pb-2 w-24 text-right">
        <span className={`font-mono font-bold text-sm ${color}`}>{pts.toFixed(1)}</span>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="pb-2 text-gray-600 hover:text-robo-red transition-colors text-lg leading-none"
        title="Remove entry"
      >
        ×
      </button>
    </div>
  );
}

// ── Category Section (multiple entries per category) ──
function CategorySection({ title, color, dotColor, base, entries, setEntries, typeKey, typeLabel, multipliers, defaultType }) {
  const addEntry = () => {
    setEntries([...entries, { [typeKey]: defaultType, hits: 1 }]);
  };

  const removeEntry = (idx) => {
    setEntries(entries.filter((_, i) => i !== idx));
  };

  const updateEntry = (idx, newEntry) => {
    setEntries(entries.map((e, i) => i === idx ? newEntry : e));
  };

  const categoryTotal = entries.reduce((sum, e) => sum + (base * (multipliers[e[typeKey]] ?? 1) * e.hits), 0);

  return (
    <div className="border-glow rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className={`font-display font-semibold ${color} text-sm tracking-wider uppercase flex items-center gap-2`}>
          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          {title}
          <span className="ml-2 font-mono text-xs text-gray-500 font-normal normal-case">Base: {base}</span>
        </h3>
        <div className="flex items-center gap-3">
          <span className={`font-mono font-bold text-sm ${color}`}>{categoryTotal.toFixed(1)} pts</span>
          <button
            type="button"
            onClick={addEntry}
            className={`text-[10px] font-mono ${color} border border-current/30 px-2 py-0.5 rounded-lg hover:bg-white/5 transition-colors uppercase tracking-wider`}
          >
            + Add
          </button>
        </div>
      </div>

      {entries.length === 0 && (
        <p className="text-xs text-gray-600 font-mono text-center py-2">No entries — click "+ Add" to score</p>
      )}

      {entries.map((entry, idx) => (
        <EntryRow
          key={idx}
          entry={entry}
          onChange={(e) => updateEntry(idx, e)}
          onRemove={() => removeEntry(idx)}
          typeKey={typeKey}
          typeLabel={typeLabel}
          multipliers={multipliers}
          base={base}
          color={color}
        />
      ))}
    </div>
  );
}

// ── ADMIN PAGE ──
function ScorePanel({
  team,
  label,
  accent = 'text-robo-accent',
  damageEntries,
  setDamageEntries,
  aggrEntries,
  setAggrEntries,
  ctrlEntries,
  setCtrlEntries,
}) {
  const preview = calcSubmissionTotal(damageEntries, aggrEntries, ctrlEntries);

  return (
    <div className="bg-robo-card/50 rounded-xl border border-robo-border p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{label}</p>
          <h2 className={`font-display font-bold text-lg uppercase tracking-wider ${accent}`}>
            {team?.name || 'No team selected'}
          </h2>
        </div>
        {team && (
          <div className="text-right text-[10px] font-mono text-gray-500">
            <div>Current</div>
            <div className="text-white font-bold text-sm">{team.total.toFixed(1)} pts</div>
          </div>
        )}
      </div>

      <div className="space-y-5">
        <CategorySection
          title="Damage"
          color="text-robo-red"
          dotColor="bg-robo-red"
          base={DAMAGE_BASE}
          entries={damageEntries}
          setEntries={setDamageEntries}
          typeKey="severity"
          typeLabel="Severity"
          multipliers={DAMAGE_MULTIPLIERS}
          defaultType="Cosmetic"
        />

        <CategorySection
          title="Aggression"
          color="text-robo-orange"
          dotColor="bg-robo-orange"
          base={AGGRESSION_BASE}
          entries={aggrEntries}
          setEntries={setAggrEntries}
          typeKey="factor"
          typeLabel="Factor"
          multipliers={AGGRESSION_MULTIPLIERS}
          defaultType="Reactive"
        />

        <CategorySection
          title="Control"
          color="text-robo-accent"
          dotColor="bg-robo-accent"
          base={CONTROL_BASE}
          entries={ctrlEntries}
          setEntries={setCtrlEntries}
          typeKey="factor"
          typeLabel="Factor"
          multipliers={CONTROL_MULTIPLIERS}
          defaultType="Evasive"
        />

        <div className="bg-robo-dark rounded-xl p-4 border border-robo-border space-y-3">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block">Submission Preview</span>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <span className="text-[10px] font-mono text-gray-500 block">Damage</span>
              <span className="font-display font-bold text-robo-red">{preview.dmg.toFixed(1)}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-gray-500 block">Aggression</span>
              <span className="font-display font-bold text-robo-orange">{preview.aggr.toFixed(1)}</span>
            </div>
            <div>
              <span className="text-[10px] font-mono text-gray-500 block">Control</span>
              <span className="font-display font-bold text-robo-accent">{preview.ctrl.toFixed(1)}</span>
            </div>
          </div>
          <div className="border-t border-robo-border pt-3 flex items-center justify-between">
            <span className="font-body text-sm text-gray-400">+ This round</span>
            <span className="font-display font-bold text-xl">+{preview.total.toFixed(1)}</span>
          </div>
          {team && (
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-white uppercase tracking-wider text-sm">New Total</span>
              <span className="font-display font-bold text-2xl text-white">
                {(team.total + preview.total).toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const {
    teams,
    sortedTeams,
    matches,
    currentMatchId,
    currentMatchStartTotals,
    updateTeam,
    updateMatchStatus,
    setCurrentMatch,
    recordMatchResult,
    resetAll,
  } = useTournament();
  const [submittedAll, setSubmittedAll] = useState(false);
  const [matchEnded, setMatchEnded] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const [damageEntriesA, setDamageEntriesA] = useState([]);
  const [aggrEntriesA, setAggrEntriesA] = useState([]);
  const [ctrlEntriesA, setCtrlEntriesA] = useState([]);

  const [damageEntriesB, setDamageEntriesB] = useState([]);
  const [aggrEntriesB, setAggrEntriesB] = useState([]);
  const [ctrlEntriesB, setCtrlEntriesB] = useState([]);

  const currentMatch = matches.find(m => m.id === currentMatchId) || null;
  const teamA = currentMatch ? teams.find(t => t.name === currentMatch.teamA) : null;
  const teamB = currentMatch ? teams.find(t => t.name === currentMatch.teamB) : null;

  useEffect(() => {
    setDamageEntriesA([]);
    setAggrEntriesA([]);
    setCtrlEntriesA([]);
    setDamageEntriesB([]);
    setAggrEntriesB([]);
    setCtrlEntriesB([]);
    setMatchEnded(false);
  }, [currentMatchId]);

  function handleSubmitAll() {
    if (!currentMatch || (!teamA && !teamB)) return;

    if (teamA) {
      const dmgA = damageEntriesA.filter(e => e.hits > 0);
      const aggrA = aggrEntriesA.filter(e => e.hits > 0);
      const ctrlA = ctrlEntriesA.filter(e => e.hits > 0);
      if (dmgA.length || aggrA.length || ctrlA.length) {
        updateTeam({ teamId: teamA.id, damageEntries: dmgA, aggrEntries: aggrA, ctrlEntries: ctrlA });
      }
    }

    if (teamB) {
      const dmgB = damageEntriesB.filter(e => e.hits > 0);
      const aggrB = aggrEntriesB.filter(e => e.hits > 0);
      const ctrlB = ctrlEntriesB.filter(e => e.hits > 0);
      if (dmgB.length || aggrB.length || ctrlB.length) {
        updateTeam({ teamId: teamB.id, damageEntries: dmgB, aggrEntries: aggrB, ctrlEntries: ctrlB });
      }
    }

    setDamageEntriesA([{ severity: 'Cosmetic', hits: 1 }]);
    setAggrEntriesA([{ factor: 'Reactive', hits: 1 }]);
    setCtrlEntriesA([{ factor: 'Evasive', hits: 1 }]);
    setDamageEntriesB([{ severity: 'Cosmetic', hits: 1 }]);
    setAggrEntriesB([{ factor: 'Reactive', hits: 1 }]);
    setCtrlEntriesB([{ factor: 'Evasive', hits: 1 }]);
    setSubmittedAll(true);
    setTimeout(() => setSubmittedAll(false), 1500);
  }

  function handleEndMatch() {
    if (!currentMatch) return;
    const startA = teamA ? currentMatchStartTotals[teamA.id] ?? teamA.total : 0;
    const startB = teamB ? currentMatchStartTotals[teamB.id] ?? teamB.total : 0;
    const scoreA = teamA ? Number((teamA.total - startA).toFixed(1)) : 0;
    const scoreB = teamB ? Number((teamB.total - startB).toFixed(1)) : 0;

    const winners = [];
    const losers = [];

    if (teamA && teamB) {
      if (scoreA > scoreB) {
        winners.push({ matchId: currentMatch.id, teamId: teamA.id, score: scoreA });
        losers.push({ matchId: currentMatch.id, teamId: teamB.id, score: scoreB });
      } else if (scoreB > scoreA) {
        winners.push({ matchId: currentMatch.id, teamId: teamB.id, score: scoreB });
        losers.push({ matchId: currentMatch.id, teamId: teamA.id, score: scoreA });
      } else {
        winners.push({ matchId: currentMatch.id, teamId: teamA.id, score: scoreA });
        winners.push({ matchId: currentMatch.id, teamId: teamB.id, score: scoreB });
      }
    }

    if (winners.length || losers.length) {
      recordMatchResult({ matchId: currentMatch.id, winners, losers, round: currentMatch.round });
    }

    updateMatchStatus(currentMatch.id, 'completed');
    setCurrentMatch({ matchId: null, startTotals: {} });
    setMatchEnded(true);
  }

  function handleReset() {
    setShowResetConfirm(true);
  }

  function confirmReset() {
    resetAll();
    setShowResetConfirm(false);
  }

  return (
    <div className="min-h-screen bg-robo-dark grid-bg">
      <div className="max-w-[1400px] mx-auto min-h-screen px-6">
        {/* Match Ended Modal */}
        {matchEnded && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-robo-card border border-robo-accent/40 rounded-2xl p-8 max-w-md w-full mx-4 shadow-glow-cyan">
              <h2 className="font-display font-bold text-2xl text-white uppercase tracking-wider text-center mb-6">
                Match Ended
              </h2>
              <p className="text-sm text-gray-400 font-mono text-center mb-8">
                What would you like to do next?
              </p>
              <div className="flex flex-col gap-3">
                <Link
                  to="/leaderboard"
                  className="w-full py-3 px-6 rounded-xl font-display font-bold uppercase tracking-wider text-sm bg-gradient-to-r from-robo-accent to-cyan-400 text-robo-dark hover:shadow-glow-cyan transition-all text-center"
                >
                  View Leaderboard
                </Link>
                <Link
                  to="/match"
                  className="w-full py-3 px-6 rounded-xl font-display font-bold uppercase tracking-wider text-sm bg-robo-card border border-robo-accent/40 text-robo-accent hover:bg-robo-accent/10 transition-all text-center"
                >
                  Start New Match
                </Link>
              </div>
            </div>
          </div>
        )}

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

        {/* Header */}
        <div className="sticky top-0 z-20 bg-robo-card/95 backdrop-blur-xl border-b border-robo-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-robo-red to-red-700 flex items-center justify-center shadow-glow-red">
              <span className="font-display font-black text-sm text-white">RW</span>
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-white tracking-wider uppercase">Scoring Panel</h1>
              <p className="text-[10px] font-mono text-gray-500">Scoring — select a match and submit judge marks</p>
            </div>
          </div>
        </div>
        <div className="py-6 space-y-6">
          {!currentMatch && (
            <div className="bg-robo-card/50 rounded-xl border border-robo-border p-6 text-center">
              <p className="font-display font-bold text-lg text-white uppercase tracking-wider mb-6">No match selected</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                <Link
                  to="/leaderboard"
                  className="flex-1 py-3 px-6 rounded-xl font-display font-bold uppercase tracking-wider text-sm bg-gradient-to-r from-robo-accent to-cyan-400 text-robo-dark hover:shadow-glow-cyan transition-all text-center"
                >
                  View Leaderboard
                </Link>
                <Link
                  to="/match"
                  className="flex-1 py-3 px-6 rounded-xl font-display font-bold uppercase tracking-wider text-sm bg-robo-card border border-robo-accent/40 text-robo-accent hover:bg-robo-accent/10 transition-all text-center"
                >
                  Start New Match
                </Link>
              </div>
            </div>
          )}

          {currentMatch && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ScorePanel
                team={teamA}
                label="Team 1 — Judge 1"
                accent="text-robo-accent"
                damageEntries={damageEntriesA}
                setDamageEntries={setDamageEntriesA}
                aggrEntries={aggrEntriesA}
                setAggrEntries={setAggrEntriesA}
                ctrlEntries={ctrlEntriesA}
                setCtrlEntries={setCtrlEntriesA}
              />
              <ScorePanel
                team={teamB}
                label="Team 2 — Judge 2"
                accent="text-robo-yellow"
                damageEntries={damageEntriesB}
                setDamageEntries={setDamageEntriesB}
                aggrEntries={aggrEntriesB}
                setAggrEntries={setAggrEntriesB}
                ctrlEntries={ctrlEntriesB}
                setCtrlEntries={setCtrlEntriesB}
              />
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSubmitAll}
              disabled={!currentMatch}
              className={`py-2 px-5 rounded-xl font-display font-bold uppercase tracking-wider text-xs transition-colors ${
                submittedAll
                  ? 'bg-robo-green text-robo-dark'
                  : 'bg-gradient-to-r from-robo-accent to-cyan-400 text-robo-dark hover:shadow-glow-cyan'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {submittedAll ? '✓ Submitted' : 'Submit'}
            </button>
            <button
              type="button"
              onClick={handleEndMatch}
              disabled={!currentMatch}
              className="py-2 px-5 rounded-xl font-display font-bold uppercase tracking-wider text-xs bg-robo-red/20 text-robo-red border border-robo-red/40 hover:bg-robo-red/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              End Match
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="py-2 px-4 rounded-xl font-display font-bold uppercase tracking-wider text-xs bg-robo-card border border-robo-red/30 text-robo-red hover:bg-robo-red/10 transition-colors"
            >
              Reset All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
