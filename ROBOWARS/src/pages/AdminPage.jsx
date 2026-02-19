import { useState, useCallback } from 'react';
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
export default function AdminPage() {
  const { teams, sortedTeams, updateTeam, resetAll } = useTournament();
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
    <div className="min-h-screen bg-robo-dark grid-bg">
      <div className="max-w-[720px] mx-auto border-x border-robo-border min-h-screen">
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
              <span className="font-display font-bold text-xl">
                +{preview.total.toFixed(1)}
              </span>
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
          <button
            type="submit"
            className={`w-full py-3 rounded-xl font-display font-bold uppercase tracking-wider text-sm transition-all duration-300 ${
              submitted
                ? 'bg-robo-green text-robo-dark'
                : 'bg-gradient-to-r from-robo-accent to-cyan-400 text-robo-dark hover:shadow-glow-cyan'
            }`}
          >
            {submitted ? '✓ SCORE SUBMITTED' : 'SUBMIT SCORES'}
          </button>

          {/* Controls + Reset */}
          <div className="flex gap-3">
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
    </div>
  );
}
