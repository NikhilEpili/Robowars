import { motion, AnimatePresence } from 'framer-motion';
import { useTournament } from '../store';

function StatusBadge({ status }) {
  const styles = {
    live:      'bg-robo-red/20 text-robo-red border-robo-red/40',
    next:      'bg-robo-yellow/20 text-robo-yellow border-robo-yellow/40',
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
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded border ${styles[status]}`}>
      {status === 'live' && <span className="live-pulse">●</span>}
      {labels[status]}
    </span>
  );
}

function MatchCard({ match, index }) {
  const isLive = match.status === 'live';
  return (
    <motion.div
      layout
      layoutId={`match-${match.id}`}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -60, scale: 0.9, transition: { duration: 0.4, ease: 'easeIn' } }}
      transition={{
        layout: { type: 'spring', stiffness: 250, damping: 25, mass: 0.8 },
        opacity: { duration: 0.35 },
        scale: { duration: 0.3 },
      }}
      className={`
        flex-shrink-0 w-full rounded-lg p-2.5 border transition-all duration-300
        ${isLive
          ? 'border-robo-red/40 bg-robo-red/5 shadow-glow-red'
          : match.status === 'next'
            ? 'border-robo-yellow/20 bg-robo-yellow/5'
            : 'border-robo-border bg-robo-card/50'
        }
      `}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] font-mono text-gray-500 uppercase">Match {match.id.replace('m','')}</span>
        <StatusBadge status={match.status} />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-center flex-1">
          <p className={`font-display font-bold text-xs ${isLive ? 'text-white' : 'text-gray-300'}`}>
            {match.teamA}
          </p>
        </div>
        <div className={`mx-2 font-display font-bold text-sm ${isLive ? 'text-robo-red' : 'text-gray-600'}`}>
          VS
        </div>
        <div className="text-center flex-1">
          <p className={`font-display font-bold text-xs ${isLive ? 'text-white' : 'text-gray-300'}`}>
            {match.teamB}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Side panel version ──
export function MatchLineupPanel({ showAdvance = true }) {
  const { matches, advanceMatch } = useTournament();
  const activeMatches = matches.filter(m => m.status !== 'completed');

  return (
    <div className="w-64 flex-shrink-0 overflow-y-auto">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display font-bold text-sm text-white tracking-wider uppercase">
          Match Lineups
        </h2>
        {showAdvance && (
          <button
            onClick={advanceMatch}
            className="text-[10px] font-mono bg-robo-accent/10 text-robo-accent border border-robo-accent/30 px-3 py-1 rounded-lg hover:bg-robo-accent/20 transition-colors uppercase tracking-wider"
          >
            Advance →
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        <AnimatePresence mode="popLayout">
          {activeMatches.map((match, idx) => (
            <MatchCard key={match.id} match={match} index={idx} />
          ))}
        </AnimatePresence>
        {activeMatches.length === 0 && (
          <div className="text-center py-8 text-gray-600 font-mono text-sm">
            All matches completed
          </div>
        )}
      </div>
    </div>
  );
}

// ── Bottom ticker version ──
export function MatchTicker() {
  const { matches } = useTournament();

  return (
    <div className="relative overflow-hidden border-t border-robo-border bg-robo-dark/80 backdrop-blur-sm">
      <div className="flex items-center">
        {/* Label */}
        <div className="flex-shrink-0 bg-robo-red px-3 py-1.5 font-display font-bold text-[10px] uppercase tracking-wider text-white z-10">
          <span className="live-pulse mr-1">●</span> LIVE FEED
        </div>

        {/* Scrolling ticker */}
        <div className="overflow-hidden flex-1">
          <div className="ticker-scroll flex items-center gap-4 py-1.5 px-3 whitespace-nowrap">
            {[...matches, ...matches].map((m, i) => (
              <span key={`${m.id}-${i}`} className="inline-flex items-center gap-2 text-sm">
                <StatusBadge status={m.status} />
                <span className="font-body text-gray-300">
                  <span className="text-white font-semibold">{m.teamA}</span>
                  <span className="text-gray-600 mx-2">vs</span>
                  <span className="text-white font-semibold">{m.teamB}</span>
                </span>
                <span className="text-gray-700 mx-2">│</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
