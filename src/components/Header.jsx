import { Link } from 'react-router-dom';
import { useTournament } from '../store';

const ROUND_LABELS = {
  'qualifiers': 'Qualifiers',
  'quarter-finals': 'Quarter Finals',
  'semi-finals': 'Semi Finals',
  'finals': 'Finals',
};

export default function Header() {
  const { currentRound } = useTournament();
  const roundLabel = ROUND_LABELS[currentRound] || 'Qualifiers';

  return (
    <header className="relative border-b border-robo-border bg-robo-dark/80 backdrop-blur-sm">
      <div className="max-w-[1800px] mx-auto px-6 py-1 flex items-center justify-between">
        {/* Left: Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-robo-accent to-cyan-600 flex items-center justify-center shadow-glow-cyan">
              <span className="font-display font-black text-sm text-robo-dark">RW</span>
            </div>
          </div>
          <div>
            <h1 className="font-display font-black text-xl text-white tracking-widest leading-none">
              ROBO<span className="text-robo-accent">WARS</span>
            </h1>
            <p className="text-[9px] font-mono text-gray-500 tracking-[0.3em] uppercase">
              Live Tournament Dashboard
            </p>
          </div>
        </div>

        {/* Center: Live indicator */}
        <div className="hidden md:flex items-center gap-2 bg-robo-red/10 border border-robo-red/30 rounded-full px-4 py-1">
          <div className="w-2 h-2 rounded-full bg-robo-red live-pulse" />
          <span className="font-display font-bold text-[10px] text-robo-red tracking-wider uppercase">Broadcasting Live</span>
        </div>

        {/* Right: Stats */}
        <div className="flex items-center gap-5">
          <div className="text-right">
            <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Season</p>
            <p className="font-display font-bold text-xs text-white">2026</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Round</p>
            <p className="font-display font-bold text-xs text-robo-accent">{roundLabel}</p>
          </div>
          <div className="w-px h-6 bg-robo-border" />
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-robo-card/80 backdrop-blur-sm border border-robo-accent/40 text-robo-accent hover:bg-robo-accent/10 transition-all font-display font-bold text-[10px] uppercase tracking-wider"
          >
            ← Home
          </Link>
        </div>
      </div>

      {/* Decorative line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-robo-accent/40 to-transparent" />
    </header>
  );
}