import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTournament } from '../store';
import {
  DAMAGE_MULTIPLIERS, AGGRESSION_MULTIPLIERS, CONTROL_MULTIPLIERS,
  DAMAGE_BASE, AGGRESSION_BASE, CONTROL_BASE,
  calcDamageEntry, calcAggressionEntry, calcControlEntry,
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
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-end gap-2"
    >
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
    </motion.div>
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

      <AnimatePresence>
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
      </AnimatePresence>
    </div>
  );
}

// ── ADMIN PAGE ──
export default function AdminPage() {
  const { teams, sortedTeams, matches, byeTeamId, currentRound, updateTeam, advanceMatch, setBye, addMatch, removeMatch, updateMatchStatus, resetAll, setRound } = useTournament();
  const [submitted, setSubmitted] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id ?? 1);

  // Multi-entry arrays (each entry: { severity/factor, hits })
  const [damageEntries, setDamageEntries] = useState([{ severity: 'Cosmetic', hits: 1 }]);
  const [aggrEntries, setAggrEntries] = useState([{ factor: 'Reactive', hits: 1 }]);
  const [ctrlEntries, setCtrlEntries] = useState([{ factor: 'Evasive', hits: 1 }]);

  const selectedTeam = teams.find(t => t.id === selectedTeamId);
  const preview = calcSubmissionTotal(damageEntries, aggrEntries, ctrlEntries);

  const handleTeamChange = useCallback((id) => {
    setSelectedTeamId(Number(id));
    // Reset entries for new team
    setDamageEntries([{ severity: 'Cosmetic', hits: 1 }]);
    setAggrEntries([{ factor: 'Reactive', hits: 1 }]);
    setCtrlEntries([{ factor: 'Evasive', hits: 1 }]);
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    // Filter out zero-hit entries
    const dmgFiltered = damageEntries.filter(e => e.hits > 0);
    const aggrFiltered = aggrEntries.filter(e => e.hits > 0);
    const ctrlFiltered = ctrlEntries.filter(e => e.hits > 0);

    if (dmgFiltered.length === 0 && aggrFiltered.length === 0 && ctrlFiltered.length === 0) return;

    updateTeam({
      teamId: selectedTeamId,
      damageEntries: dmgFiltered,
      aggrEntries: aggrFiltered,
      ctrlEntries: ctrlFiltered,
    });

    // Reset form
    setDamageEntries([{ severity: 'Cosmetic', hits: 1 }]);
    setAggrEntries([{ factor: 'Reactive', hits: 1 }]);
    setCtrlEntries([{ factor: 'Evasive', hits: 1 }]);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  }

  function handleReset() {
    if (window.confirm('Reset ALL scores and matches? This cannot be undone!')) {
      resetAll();
    }
  }

  function handleDownloadCSV() {
    const headers = ['Rank', 'Team', 'Damage', 'Aggression', 'Control', 'Total', 'Rounds'];
    const rows = sortedTeams.map((t, i) => [
      i + 1,
      `"${t.name}"`,
      t.damageTotal.toFixed(1),
      t.aggrTotal.toFixed(1),
      t.ctrlTotal.toFixed(1),
      t.total.toFixed(1),
      t.rounds,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `robowars_scores_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-robo-dark grid-bg flex">
      {/* ── Left: Score Entry Form ── */}
      <div className="w-[520px] flex-shrink-0 border-r border-robo-border overflow-y-auto h-screen">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-robo-card/95 backdrop-blur-xl border-b border-robo-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-robo-red to-red-700 flex items-center justify-center shadow-glow-red">
              <span className="font-display font-black text-sm text-white">RW</span>
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-white tracking-wider uppercase">Judge Panel</h1>
              <p className="text-[10px] font-mono text-gray-500">Admin — scores sync to display in real-time</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Team selector */}
          <div>
            <Select
              label="Select Team"
              value={selectedTeamId}
              onChange={handleTeamChange}
              options={teams.map(t => ({ value: t.id, label: t.name }))}
            />
            {selectedTeam && (
              <div className="mt-2 flex items-center gap-4 text-[10px] font-mono text-gray-500">
                <span>Current: <span className="text-white font-bold">{selectedTeam.total.toFixed(1)} pts</span></span>
                <span>Rounds: <span className="text-white">{selectedTeam.rounds}</span></span>
              </div>
            )}
          </div>

          {/* Damage Section — multiple entries */}
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

          {/* Aggression Section — multiple entries */}
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

          {/* Control Section — multiple entries */}
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

          {/* Preview Total */}
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
              <motion.span
                key={preview.total}
                initial={{ scale: 1.2, color: '#00f0ff' }}
                animate={{ scale: 1, color: '#00e676' }}
                className="font-display font-bold text-xl"
              >
                +{preview.total.toFixed(1)}
              </motion.span>
            </div>
            {selectedTeam && (
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-white uppercase tracking-wider text-sm">New Total</span>
                <span className="font-display font-bold text-2xl text-white">
                  {(selectedTeam.total + preview.total).toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-3 rounded-xl font-display font-bold uppercase tracking-wider text-sm transition-all duration-300 ${
              submitted
                ? 'bg-robo-green text-robo-dark'
                : 'bg-gradient-to-r from-robo-accent to-cyan-400 text-robo-dark hover:shadow-glow-cyan'
            }`}
          >
            {submitted ? '✓ SCORE SUBMITTED' : 'SUBMIT SCORES'}
          </motion.button>

          {/* Match controls + Reset */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={advanceMatch}
              className="flex-1 py-2 rounded-xl font-display font-bold uppercase tracking-wider text-xs bg-robo-card border border-robo-border text-robo-accent hover:bg-robo-accent/10 transition-colors"
            >
              Advance Match →
            </button>
            <button
              type="button"
              onClick={handleDownloadCSV}
              className="py-2 px-4 rounded-xl font-display font-bold uppercase tracking-wider text-xs bg-robo-card border border-robo-green/30 text-robo-green hover:bg-robo-green/10 transition-colors"
            >
              ↓ CSV
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="py-2 px-4 rounded-xl font-display font-bold uppercase tracking-wider text-xs bg-robo-card border border-robo-red/30 text-robo-red hover:bg-robo-red/10 transition-colors"
            >
              Reset All
            </button>
          </div>
        </form>
      </div>

      {/* ── Right: Bye + Match Manager + Scoreboard ── */}
      <div className="flex-1 overflow-y-auto h-screen p-6 space-y-6">

        {/* ── BYE SECTION ── */}
        <div className="bg-robo-card/50 rounded-xl border border-robo-purple/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-robo-purple" />
            <h2 className="font-display font-bold text-sm text-white tracking-wider uppercase">Bye (Chit Draw)</h2>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={byeTeamId ?? ''}
              onChange={(e) => setBye(e.target.value ? Number(e.target.value) : null)}
              className="flex-1 bg-robo-dark border border-robo-border rounded-lg px-3 py-2 text-sm text-white font-body focus:border-robo-purple focus:outline-none focus:ring-1 focus:ring-robo-purple/30 transition-colors appearance-none cursor-pointer"
            >
              <option value="">No bye this round</option>
              {teams.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            {byeTeamId && (
              <button
                onClick={() => setBye(null)}
                className="text-xs font-mono text-robo-red hover:text-red-400 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          {byeTeamId && (
            <div className="mt-2 text-xs font-mono text-robo-purple">
              ✦ {teams.find(t => t.id === byeTeamId)?.name} has a BYE — advances without fighting
            </div>
          )}
        </div>

        {/* ── MATCH MANAGER ── */}
        <MatchManager teams={teams} matches={matches} currentRound={currentRound} addMatch={addMatch} removeMatch={removeMatch} updateMatchStatus={updateMatchStatus} advanceMatch={advanceMatch} setRound={setRound} />

        {/* ── Mini Scoreboard ── */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full bg-robo-green live-pulse" />
            <h2 className="font-display font-bold text-sm text-white tracking-wider uppercase">Live Scoreboard</h2>
          </div>
          <div className="bg-robo-card/50 rounded-xl border border-robo-border overflow-hidden">
            <div className="grid grid-cols-[36px_1fr_60px_60px_60px_60px] gap-1 px-3 py-1.5 text-[9px] text-gray-500 font-mono uppercase tracking-widest border-b border-robo-border">
              <span>#</span>
              <span>Team</span>
              <span className="text-right">DMG</span>
              <span className="text-right">AGR</span>
              <span className="text-right">CTR</span>
              <span className="text-right">Total</span>
            </div>

            {sortedTeams.map((team, idx) => (
              <motion.div
                key={team.id}
                layout
                layoutId={`admin-row-${team.id}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  layout: { type: 'spring', stiffness: 250, damping: 25, mass: 0.7 },
                  opacity: { duration: 0.3 },
                }}
                className={`grid grid-cols-[36px_1fr_60px_60px_60px_60px] gap-1 px-3 py-1.5 border-b border-robo-border/50 items-center text-xs ${
                  team.id === selectedTeamId ? 'bg-robo-accent/5 border-l-2 border-l-robo-accent' : ''
                } ${team.hasBye ? 'bg-robo-purple/5 border-l-2 border-l-robo-purple' : ''}`}
              >
                <span className={`font-display font-bold ${idx === 0 ? 'text-robo-yellow' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-orange-400' : 'text-gray-600'}`}>
                  {idx + 1}
                </span>
                <div className="flex items-center gap-1.5 truncate">

                  <span className="font-display font-semibold text-white truncate">{team.name}</span>
                  {team.hasBye && <span className="text-robo-purple text-[9px] font-mono">BYE</span>}
                </div>
                <span className="text-right font-mono text-robo-red">{team.damageTotal.toFixed(1)}</span>
                <span className="text-right font-mono text-robo-orange">{team.aggrTotal.toFixed(1)}</span>
                <span className="text-right font-mono text-robo-accent">{team.ctrlTotal.toFixed(1)}</span>
                <span className="text-right font-display font-bold text-white">{team.total.toFixed(1)}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick link */}
        <div className="p-3 bg-robo-card/50 rounded-xl border border-robo-border">
          <p className="text-xs font-mono text-gray-400">
            <span className="text-robo-accent font-bold">Display URL:</span>{' '}
            Open <a href="/" target="_blank" className="text-robo-accent underline hover:text-white transition-colors">the display page</a> in a new window on the projector. Scores + matches sync in real-time.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── ROUND CONFIG ──
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

// ── MATCH MANAGER COMPONENT ──
function MatchManager({ teams, matches, currentRound, addMatch, removeMatch, updateMatchStatus, advanceMatch, setRound }) {
  const [newTeamA, setNewTeamA] = useState('');
  const [newTeamB, setNewTeamB] = useState('');
  const [addToRound, setAddToRound] = useState(currentRound || 'qualifiers');

  function handleAddMatch() {
    if (!newTeamA || !newTeamB || newTeamA === newTeamB) return;
    addMatch(newTeamA, newTeamB, 'upcoming', addToRound);
    setNewTeamA('');
    setNewTeamB('');
  }

  const statusOpts = ['upcoming', 'next', 'live', 'completed'];

  return (
    <div className="bg-robo-card/50 rounded-xl border border-robo-border p-4 space-y-4">
      {/* Header + Current Round */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-robo-yellow" />
          <h2 className="font-display font-bold text-sm text-white tracking-wider uppercase">Match Lineups</h2>
        </div>

        {/* Active Round Selector */}
        <div className="mb-3">
          <label className="block text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">Current Tournament Stage</label>
          <div className="flex gap-1.5">
            {ROUNDS.map(r => (
              <button
                key={r.key}
                onClick={() => setRound(r.key)}
                className={`flex-1 py-1.5 px-2 rounded-lg font-display font-bold text-[10px] uppercase tracking-wider border transition-all duration-200 ${
                  currentRound === r.key ? r.active : r.inactive
                }`}
              >
                {r.icon} {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Add new match */}
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
              {teams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
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
              {teams.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
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
            className="px-4 py-1.5 rounded-lg font-display font-bold text-xs uppercase bg-robo-accent/20 text-robo-accent border border-robo-accent/30 hover:bg-robo-accent/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Matches grouped by round */}
      <div className="border-t border-robo-border pt-3 space-y-3 max-h-[350px] overflow-y-auto scrollbar-hide">
        {ROUNDS.map(round => {
          const roundMatches = matches.filter(m => (m.round || 'qualifiers') === round.key);
          if (roundMatches.length === 0) return null;
          return (
            <div key={round.key}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`${round.heading} text-[10px]`}>{round.icon}</span>
                <span className={`text-[10px] font-display font-bold ${round.heading} uppercase tracking-wider`}>{round.label}</span>
                <span className="text-[9px] font-mono text-gray-600">({roundMatches.length})</span>
              </div>
              <div className="space-y-1">
                <AnimatePresence initial={false}>
                  {roundMatches.map(m => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className={`flex items-center gap-2 rounded-lg p-2 border text-xs ${
                        m.status === 'live' ? 'border-robo-red/40 bg-robo-red/5' :
                        m.status === 'next' ? 'border-robo-yellow/20 bg-robo-yellow/5' :
                        m.status === 'completed' ? 'border-gray-700/30 bg-gray-800/20 opacity-50' :
                        'border-robo-border bg-robo-card/30'
                      }`}>
                        <span className="text-[9px] font-mono text-gray-500 w-6">{m.id.replace('m','')}</span>
                        <span className="flex-1 font-body text-white truncate">
                          {m.teamA} <span className="text-gray-600 mx-1">vs</span> {m.teamB}
                        </span>
                        <select
                          value={m.status}
                          onChange={(e) => updateMatchStatus(m.id, e.target.value)}
                          className={`bg-transparent border rounded px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase cursor-pointer focus:outline-none ${
                            m.status === 'live' ? 'border-robo-red/40 text-robo-red' :
                            m.status === 'next' ? 'border-robo-yellow/40 text-robo-yellow' :
                            m.status === 'completed' ? 'border-gray-600 text-gray-500' :
                            'border-gray-600 text-gray-400'
                          }`}
                        >
                          {statusOpts.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                        </select>
                        <button
                          onClick={() => removeMatch(m.id)}
                          className="w-6 h-6 flex items-center justify-center rounded bg-robo-red/10 border border-robo-red/30 text-robo-red hover:bg-robo-red/30 hover:text-white transition-colors text-xs font-bold flex-shrink-0"
                          title="Remove match"
                        >
                          ✕
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
        {matches.length === 0 && (
          <p className="text-xs text-gray-600 font-mono text-center py-3">No matches added yet</p>
        )}
      </div>
    </div>
  );
}
