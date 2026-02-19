import { useTournament } from '../store';
import { motion } from 'framer-motion';

export default function StatsBar() {
  const { sortedTeams, matches } = useTournament();

  const completedCount = matches.filter(m => m.status === 'completed').length;
  const topTeam = sortedTeams[0];
  const avgScore = sortedTeams.length > 0
    ? (sortedTeams.reduce((sum, t) => sum + t.total, 0) / sortedTeams.length)
    : 0;
  const totalRounds = sortedTeams.reduce((sum, t) => sum + t.rounds, 0);

  const stats = [
    { label: 'Teams', value: sortedTeams.length, color: 'text-robo-accent' },
    { label: 'Top Score', value: topTeam?.total.toFixed(1) ?? '—', color: 'text-robo-yellow' },
    { label: 'Avg Score', value: avgScore.toFixed(1), color: 'text-robo-green' },
    { label: 'Rounds Scored', value: totalRounds, color: 'text-robo-purple' },
    { label: 'Matches Done', value: `${completedCount}/${matches.length}`, color: 'text-gray-400' },
  ];

  return (
    <div className="flex items-center justify-center gap-6 py-1 border-b border-robo-border bg-robo-card/30">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-2"
        >
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{s.label}</span>
          <span className={`font-display font-bold text-sm ${s.color}`}>{s.value}</span>
        </motion.div>
      ))}
    </div>
  );
}
