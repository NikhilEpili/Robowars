import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useTournament } from '../store';

export default function HomePage() {
  const { teams, addTeam, removeTeam } = useTournament();
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [showRemoveTeam, setShowRemoveTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [teamToRemove, setTeamToRemove] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  function handleAddTeam() {
    if (!newTeamName.trim()) return;
    addTeam(newTeamName.trim());
    setConfirmMessage(`Team "${newTeamName.trim()}" has been added successfully!`);
    setShowConfirm(true);
    setNewTeamName('');
    setShowAddTeam(false);
    setTimeout(() => setShowConfirm(false), 2000);
  }

  function handleRemoveTeam() {
    if (!teamToRemove) return;
    const teamName = teams.find(t => t.id === parseInt(teamToRemove))?.name || 'Unknown';
    removeTeam(parseInt(teamToRemove));
    setConfirmMessage(`Team "${teamName}" has been removed successfully!`);
    setShowConfirm(true);
    setTeamToRemove('');
    setShowRemoveTeam(false);
    setTimeout(() => setShowConfirm(false), 2000);
  }

  return (
    <div className="min-h-screen bg-robo-dark grid-bg flex items-center justify-center">
      {/* Confirmation Toast */}
      {showConfirm && (
        <div className="fixed top-4 right-4 z-50 px-6 py-3 rounded-lg bg-robo-green/20 border border-robo-green/40 text-robo-green font-display font-bold text-sm uppercase tracking-wider">
          {confirmMessage}
        </div>
      )}

      {/* Add Team Modal */}
      {showAddTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-robo-card border border-robo-accent/40 rounded-2xl p-8 max-w-md w-full mx-4">
            <h2 className="font-display font-bold text-2xl text-white uppercase tracking-wider text-center mb-6">
              Add Team
            </h2>
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTeam()}
              placeholder="Enter team name..."
              className="w-full bg-robo-dark border border-robo-border rounded-lg px-4 py-2 text-white font-body focus:border-robo-accent focus:outline-none focus:ring-1 focus:ring-robo-accent/30 transition-colors mb-4"
            />
            <div className="flex flex-col gap-3">
              <button
                onClick={handleAddTeam}
                disabled={!newTeamName.trim()}
                className="w-full py-3 px-6 rounded-xl font-display font-bold uppercase tracking-wider text-sm bg-gradient-to-r from-robo-accent to-cyan-400 text-robo-dark hover:shadow-glow-cyan transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Add Team
              </button>
              <button
                onClick={() => setShowAddTeam(false)}
                className="w-full py-3 px-6 rounded-xl font-display font-bold uppercase tracking-wider text-sm bg-robo-card border border-robo-border text-gray-300 hover:text-white transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Team Modal */}
      {showRemoveTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-robo-card border border-robo-red/40 rounded-2xl p-8 max-w-md w-full mx-4">
            <h2 className="font-display font-bold text-2xl text-robo-red uppercase tracking-wider text-center mb-6">
              Remove Team
            </h2>
            {teams.length === 0 ? (
              <p className="text-center text-gray-400 font-body mb-6">No teams to remove</p>
            ) : (
              <>
                <select
                  value={teamToRemove}
                  onChange={(e) => setTeamToRemove(e.target.value)}
                  className="w-full bg-robo-dark border border-robo-border rounded-lg px-4 py-2 text-white font-body focus:border-robo-accent focus:outline-none focus:ring-1 focus:ring-robo-accent/30 transition-colors mb-4"
                >
                  <option value="">Select team to remove...</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleRemoveTeam}
                    disabled={!teamToRemove}
                    className="w-full py-3 px-6 rounded-xl font-display font-bold uppercase tracking-wider text-sm bg-robo-red/20 text-robo-red border border-robo-red/40 hover:bg-robo-red/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Remove Team
                  </button>
                  <button
                    onClick={() => setShowRemoveTeam(false)}
                    className="w-full py-3 px-6 rounded-xl font-display font-bold uppercase tracking-wider text-sm bg-robo-card border border-robo-border text-gray-300 hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <div className="text-center px-6">
        <h1 className="font-display font-black text-3xl text-white tracking-widest uppercase">
          Welcome to <span className="text-robo-accent">Robowars</span>
        </h1>
        <p className="mt-3 text-xs font-mono text-gray-500 uppercase tracking-[0.3em]">
          Tournament Dashboard
        </p>
        <div className="mt-8 flex flex-col gap-4 items-center">
          <Link
            to="/match"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-display font-bold uppercase tracking-wider text-sm bg-gradient-to-r from-robo-accent to-cyan-400 text-robo-dark hover:shadow-glow-cyan transition-all"
          >
            Start Match
          </Link>
          <Link
            to="/leaderboard"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-display font-bold uppercase tracking-wider text-sm bg-robo-card border border-robo-accent/40 text-robo-accent hover:bg-robo-accent/10 transition-all"
          >
            View Leaderboard
          </Link>
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => setShowAddTeam(true)}
              className="inline-flex items-center justify-center px-5 py-2 rounded-lg font-display font-bold uppercase tracking-wider text-xs bg-robo-green/20 text-robo-green border border-robo-green/40 hover:bg-robo-green/30 transition-all"
            >
              + Add Team
            </button>
            <button
              onClick={() => setShowRemoveTeam(true)}
              className="inline-flex items-center justify-center px-5 py-2 rounded-lg font-display font-bold uppercase tracking-wider text-xs bg-robo-red/20 text-robo-red border border-robo-red/40 hover:bg-robo-red/30 transition-all"
            >
              − Remove Team
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
