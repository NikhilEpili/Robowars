import { useTournament } from '../store';

export default function StatsBar() {
  const { sortedTeams, matches } = useTournament();

  const completedCount = matches.filter(m => m.status === 'completed').length;
  const topTeam = sortedTeams[0];
  const totalRounds = sortedTeams.reduce((sum, t) => sum + t.rounds, 0);

  const stats = [
    { label: 'Teams', value: sortedTeams.length, color: 'text-robo-accent' },
    { label: 'Top Score', value: topTeam?.total.toFixed(1) ?? '—', color: 'text-robo-yellow' },
    { label: 'Rounds Scored', value: totalRounds, color: 'text-robo-purple' },
    { label: 'Matches Done', value: `${completedCount}/${matches.length}`, color: 'text-gray-400' },
  ];

  return (
    <div className="flex items-center justify-center gap-6 py-1 border-b border-robo-border bg-robo-card/30">
      {stats.map((s) => (
        <div key={s.label} className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{s.label}</span>
          <span className={`font-display font-bold text-sm ${s.color}`}>{s.value}</span>
        </div>
      ))}
    </div>
  );
}
