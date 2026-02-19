import { motion, AnimatePresence } from 'framer-motion';
import { useTournament } from '../store';
import { useState, useEffect, useRef, useCallback } from 'react';

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

// ── Score bar sparkline (no max cap — bar scales relative to top scorer) ──
function ScoreBar({ value, maxInList, color }) {
  const pct = maxInList > 0 ? Math.min((value / maxInList) * 100, 100) : 0;
  return (
    <div className="flex flex-col gap-0 min-w-[70px]">
      <span className="font-mono text-[10px] font-bold text-white leading-tight">{value.toFixed(1)}</span>
      <div className="h-0.5 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ── Team Row ──
function TeamRow({ team, rank, isTied, maxDmg, maxAggr, maxCtrl }) {
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (team.flashKey > 0) {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [team.flashKey]);

  return (
    <motion.div
      layout
      layoutId={`team-${team.id}`}
      initial={{ opacity: 0, y: 30, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.97 }}
      transition={{
        layout: { type: 'spring', stiffness: 200, damping: 25, mass: 0.8 },
        opacity: { duration: 0.4, ease: 'easeInOut' },
        scale: { duration: 0.3 },
      }}
      style={{ zIndex: flash ? 10 : 1 }}
      className={`
        relative grid grid-cols-[32px_1fr_1fr_1fr_1fr_80px] items-center gap-2 px-2 py-0.5 rounded-lg
        border border-transparent transition-colors duration-500
        ${flash ? 'border-robo-green/60 shadow-glow-green bg-green-900/15' : 'hover:bg-white/[0.02] hover:border-robo-border'}
        ${rank <= 3 ? 'bg-white/[0.02]' : ''}
        ${team.hasBye ? 'bg-robo-purple/5' : ''}
      `}
    >
      {/* Rank */}
      <RankBadge rank={rank} />

      {/* Team Name */}
      <div className="flex items-center gap-1.5 min-w-0">

        <p className="font-display font-semibold text-white text-[11px] tracking-wide leading-tight truncate">
          {team.name}
          {team.hasBye && <span className="ml-1 text-robo-purple text-[8px] font-mono border border-robo-purple/40 px-0.5 rounded">BYE</span>}
          {isTied && <span className="ml-1 text-robo-yellow text-[9px]">✦</span>}
        </p>
      </div>

      {/* Damage */}
      <ScoreBar value={team.damageTotal} maxInList={maxDmg} color="bg-gradient-to-r from-robo-red to-red-400" />

      {/* Aggression */}
      <ScoreBar value={team.aggrTotal} maxInList={maxAggr} color="bg-gradient-to-r from-robo-orange to-yellow-400" />

      {/* Control */}
      <ScoreBar value={team.ctrlTotal} maxInList={maxCtrl} color="bg-gradient-to-r from-robo-accent to-cyan-300" />

      {/* Total */}
      <div className="text-right">
        <motion.span
          key={team.total}
          initial={{ scale: 1.4, color: '#00e676' }}
          animate={{ scale: 1, color: '#ffffff' }}
          transition={{ type: 'spring', stiffness: 300, damping: 15, duration: 0.6 }}
          className="font-display font-bold text-sm block"
        >
          {team.total.toFixed(1)}
        </motion.span>
        <span className="text-[8px] text-gray-500 font-mono leading-none">pts</span>
      </div>
    </motion.div>
  );
}

// ── Leaderboard ──
export default function Leaderboard() {
  const { sortedTeams, hasTie } = useTournament();
  const scrollRef = useRef(null);
  const [needsScroll, setNeedsScroll] = useState(false);

  // Detect ties for visual indicators
  const totals = sortedTeams.map(t => t.total);
  const tiedTotals = new Set(
    totals.filter((v, i) => totals.indexOf(v) !== i)
  );

  // Compute dynamic maxes for bars (relative to top scorer in each category)
  const maxDmg  = Math.max(...sortedTeams.map(t => t.damageTotal), 1);
  const maxAggr = Math.max(...sortedTeams.map(t => t.aggrTotal), 1);
  const maxCtrl = Math.max(...sortedTeams.map(t => t.ctrlTotal), 1);

  // Check if content overflows and needs auto-scroll
  const checkOverflow = useCallback(() => {
    const el = scrollRef.current;
    if (el) setNeedsScroll(el.scrollHeight > el.clientHeight + 4);
  }, []);

  useEffect(() => {
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [checkOverflow, sortedTeams.length]);

  // Auto-scroll: gently scroll down, pause, then back up
  useEffect(() => {
    if (!needsScroll) return;
    const el = scrollRef.current;
    if (!el) return;

    let direction = 1; // 1 = down, -1 = up
    let paused = false;
    let pauseTimer;

    const step = () => {
      if (paused) return;
      const maxScroll = el.scrollHeight - el.clientHeight;

      if (direction === 1 && el.scrollTop >= maxScroll - 1) {
        paused = true;
        pauseTimer = setTimeout(() => { direction = -1; paused = false; }, 2000);
      } else if (direction === -1 && el.scrollTop <= 1) {
        paused = true;
        pauseTimer = setTimeout(() => { direction = 1; paused = false; }, 2000);
      } else {
        el.scrollTop += direction * 0.5;
      }
    };

    const id = setInterval(step, 30);
    return () => { clearInterval(id); clearTimeout(pauseTimer); };
  }, [needsScroll]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-0.5 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-robo-red live-pulse" />
          <h2 className="font-display font-bold text-sm text-white tracking-wider uppercase">
            Live Leaderboard
          </h2>
        </div>
        {hasTie && (
          <div className="flex items-center gap-2 text-robo-yellow text-[10px] font-mono">
            <span>✦</span>
            <span>TIE — Judges' Decision</span>
          </div>
        )}
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-[32px_1fr_1fr_1fr_1fr_80px] gap-2 px-2 py-0.5 text-[8px] text-gray-500 font-mono uppercase tracking-widest border-b border-robo-border mb-0 flex-shrink-0">
        <span>Rank</span>
        <span>Team</span>
        <span>Damage</span>
        <span>Aggression</span>
        <span>Control</span>
        <span className="text-right">Total</span>
      </div>

      {/* Animated rows — auto-scrolls if overflowing */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto scrollbar-hide space-y-0"
        style={{ scrollBehavior: 'auto' }}
      >
        <AnimatePresence>
          {sortedTeams.map((team, idx) => (
            <TeamRow
              key={team.id}
              team={team}
              rank={idx + 1}
              isTied={tiedTotals.has(team.total)}
              maxDmg={maxDmg}
              maxAggr={maxAggr}
              maxCtrl={maxCtrl}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
