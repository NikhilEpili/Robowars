import { motion, AnimatePresence } from 'framer-motion';
import { useTournament } from '../store';
import { useState, useEffect } from 'react';

function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="font-mono font-bold text-sm text-white tabular-nums">
      {time.toLocaleTimeString('en-US', { hour12: false })}
    </span>
  );
}

function StatusBadge({ status, large = false }) {
  const styles = {
    live:      'bg-robo-red/20 text-robo-red border-robo-red/50',
    next:      'bg-robo-yellow/20 text-robo-yellow border-robo-yellow/50',
    upcoming:  'bg-gray-700/30 text-gray-400 border-gray-600/40',
    completed: 'bg-gray-800/30 text-gray-600 border-gray-700/30',
  };
  const labels = {
    live: '● LIVE NOW',
    next: '◉ UP NEXT',
    upcoming: '○ UPCOMING',
    completed: '✓ DONE',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono font-bold uppercase tracking-wider rounded-lg border ${styles[status]} ${large ? 'px-4 py-1.5 text-sm' : 'px-3 py-1 text-[11px]'}`}>
      {status === 'live' && <span className="live-pulse">●</span>}
      {labels[status]}
    </span>
  );
}

function MatchCard({ match }) {
  const isLive = match.status === 'live';
  const isNext = match.status === 'next';
  const isDone = match.status === 'completed';

  return (
    <motion.div
      layout
      layoutId={`matchpage-${match.id}`}
      initial={{ opacity: 0, y: 60, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -80, scale: 0.85, transition: { duration: 0.5, ease: 'easeIn' } }}
      transition={{
        layout: { type: 'spring', stiffness: 200, damping: 22, mass: 0.8 },
        opacity: { duration: 0.4 },
        scale: { duration: 0.35 },
      }}
      className={`
        relative rounded-2xl border-2 transition-all duration-500 overflow-hidden
        ${isLive
          ? 'border-robo-red/60 bg-gradient-to-b from-robo-red/10 to-robo-dark shadow-glow-red'
          : isNext
            ? 'border-robo-yellow/40 bg-gradient-to-b from-robo-yellow/5 to-robo-dark'
            : isDone
              ? 'border-gray-700/30 bg-gray-900/30 opacity-50'
              : 'border-robo-border bg-robo-card/40'
        }
        ${isLive ? 'p-8' : 'p-5'}
      `}
    >
      {/* Live scanning line effect */}
      {isLive && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-robo-red/50 to-transparent animate-scan-line" />
        </div>
      )}

      {/* Match header */}
      <div className="flex items-center justify-between mb-4">
        <span className={`font-mono uppercase tracking-widest ${isLive ? 'text-sm text-gray-400' : 'text-xs text-gray-500'}`}>
          Match {match.id.replace('m', '')}
        </span>
        <StatusBadge status={match.status} large={isLive} />
      </div>

      {/* Teams */}
      <div className="flex items-center justify-center gap-6">
        <motion.div
          className="flex-1 text-center"
          initial={false}
          animate={{ scale: isLive ? 1 : 0.95 }}
          transition={{ duration: 0.3 }}
        >
          <p className={`font-display font-black uppercase tracking-wider ${
            isLive ? 'text-2xl text-white' : isNext ? 'text-lg text-gray-200' : 'text-base text-gray-400'
          }`}>
            {match.teamA}
          </p>
        </motion.div>

        <div className={`flex-shrink-0 font-display font-black ${
          isLive ? 'text-3xl text-robo-red' : isNext ? 'text-xl text-gray-500' : 'text-lg text-gray-600'
        }`}>
          VS
        </div>

        <motion.div
          className="flex-1 text-center"
          initial={false}
          animate={{ scale: isLive ? 1 : 0.95 }}
          transition={{ duration: 0.3 }}
        >
          <p className={`font-display font-black uppercase tracking-wider ${
            isLive ? 'text-2xl text-white' : isNext ? 'text-lg text-gray-200' : 'text-base text-gray-400'
          }`}>
            {match.teamB}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

const ROUNDS = [
  { key: 'qualifiers',     label: 'Qualifiers',
    color: 'text-robo-accent', border: 'border-robo-accent', bg: 'bg-robo-accent',
    bgFaded: 'bg-robo-accent/10', borderFaded: 'border-robo-accent/30' },
  { key: 'quarter-finals', label: 'Quarter Finals',
    color: 'text-robo-yellow', border: 'border-robo-yellow', bg: 'bg-robo-yellow',
    bgFaded: 'bg-robo-yellow/10', borderFaded: 'border-robo-yellow/30' },
  { key: 'semi-finals',    label: 'Semi Finals',
    color: 'text-robo-orange', border: 'border-robo-orange', bg: 'bg-robo-orange',
    bgFaded: 'bg-robo-orange/10', borderFaded: 'border-robo-orange/30' },
  { key: 'finals',         label: 'Finals',
    color: 'text-robo-red', border: 'border-robo-red', bg: 'bg-robo-red',
    bgFaded: 'bg-robo-red/10', borderFaded: 'border-robo-red/30' },
];

export default function MatchPage() {
  const { matches, currentRound } = useTournament();

  const activeRound = ROUNDS.find(r => r.key === currentRound) || ROUNDS[0];
  const liveMatch = matches.find(m => m.status === 'live');
  const nextMatch = matches.find(m => m.status === 'next');
  const upcomingMatches = matches.filter(m => m.status === 'upcoming');
  const completedMatches = matches.filter(m => m.status === 'completed');

  return (
    <div className="h-screen bg-robo-dark grid-bg flex flex-col overflow-hidden">
      {/* Header */}
      <header className="relative border-b border-robo-border bg-robo-dark/80 backdrop-blur-sm">
        <div className="max-w-[1400px] mx-auto px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-robo-accent to-cyan-600 flex items-center justify-center shadow-glow-cyan">
              <span className="font-display font-black text-sm text-robo-dark">RW</span>
            </div>
            <div>
              <h1 className="font-display font-black text-xl text-white tracking-widest leading-none">
                ROBO<span className="text-robo-accent">WARS</span>
              </h1>
              <p className="text-[9px] font-mono text-gray-500 tracking-[0.3em] uppercase">Match Lineups</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${activeRound.bgFaded} border ${activeRound.borderFaded} rounded-full px-4 py-1`}>
              <div className={`w-2 h-2 rounded-full ${activeRound.bg} live-pulse`} />
              <span className={`font-display font-bold text-[10px] ${activeRound.color} tracking-wider uppercase`}>{activeRound.label}</span>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Time</p>
              <Clock />
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-robo-accent/40 to-transparent" />
      </header>

      {/* Stats strip */}
      <div className="flex items-center justify-center gap-8 py-1.5 border-b border-robo-border bg-robo-card/30">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Total</span>
          <span className="font-display font-bold text-sm text-robo-accent">{matches.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Live</span>
          <span className="font-display font-bold text-sm text-robo-red">{liveMatch ? 1 : 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Upcoming</span>
          <span className="font-display font-bold text-sm text-robo-yellow">{upcomingMatches.length + (nextMatch ? 1 : 0)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Done</span>
          <span className="font-display font-bold text-sm text-gray-400">{completedMatches.length}</span>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
        <div className="max-w-[900px] mx-auto px-6 py-6 space-y-8">

          {/* LIVE MATCH — hero section */}
          {liveMatch && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-robo-red live-pulse" />
                <h2 className="font-display font-bold text-base text-white tracking-wider uppercase">Now Fighting</h2>
              </div>
              <AnimatePresence mode="popLayout">
                <MatchCard key={liveMatch.id} match={liveMatch} />
              </AnimatePresence>
            </section>
          )}

          {/* UP NEXT */}
          {nextMatch && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-robo-yellow" />
                <h2 className="font-display font-bold text-sm text-robo-yellow tracking-wider uppercase">Up Next</h2>
              </div>
              <AnimatePresence mode="popLayout">
                <MatchCard key={nextMatch.id} match={nextMatch} />
              </AnimatePresence>
            </section>
          )}

          {/* UPCOMING */}
          {upcomingMatches.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-gray-500" />
                <h2 className="font-display font-bold text-sm text-gray-400 tracking-wider uppercase">Upcoming</h2>
              </div>
              <div className="grid gap-3">
                <AnimatePresence mode="popLayout">
                  {upcomingMatches.map(m => (
                    <MatchCard key={m.id} match={m} />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          {/* COMPLETED */}
          {completedMatches.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-gray-600" />
                <h2 className="font-display font-bold text-sm text-gray-500 tracking-wider uppercase">Completed</h2>
              </div>
              <div className="grid gap-2">
                <AnimatePresence mode="popLayout">
                  {completedMatches.map(m => (
                    <MatchCard key={m.id} match={m} />
                  ))}
                </AnimatePresence>
              </div>
            </section>
          )}

          {/* Empty state */}
          {matches.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-600">
              <span className="text-5xl mb-4">⚔️</span>
              <p className="font-display font-bold text-lg uppercase tracking-wider">No Matches Yet</p>
              <p className="font-mono text-sm mt-1">Add matches from the admin panel</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
