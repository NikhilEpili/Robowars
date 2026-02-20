import { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import { calcSubmissionTotal } from './scoring';

// ── 14 Teams ──
const initialTeams = [
  { id: 1,  name: 'Team Quintet' },
  { id: 2,  name: 'No-Mercy' },
  { id: 3,  name: 'KILL-SWITCH' },
  { id: 4,  name: 'DRC SPIT' },
  { id: 5,  name: 'TORQX' },
  { id: 6,  name: 'OMERTÀ CIPHER' },
  { id: 7,  name: 'Torque Titans' },
  { id: 8,  name: 'AutoBotz' },
  { id: 9,  name: 'Exploit' },
  { id: 10, name: 'Mechabots' },
  { id: 11, name: 'Team Quintet 2' },
  { id: 12, name: 'Byte Me' },
  { id: 13, name: 'Team Shunya' },
  { id: 14, name: 'Team Shunya2' },
];

function hydrateTeam(t) {
  return { ...t, damageTotal: 0, aggrTotal: 0, ctrlTotal: 0, total: 0, prevTotal: 0, rounds: 0, flashKey: 0, hasBye: false };
}

// ── Match Lineups (manually managed from admin) ──
const initialMatches = [];

// ── Storage keys ──
const STORAGE_KEY = 'robowars_state';
const CHANNEL_NAME = 'robowars_sync';

function getNextMatchNumber(matches) {
  return matches.reduce((max, m) => {
    const id = String(m.id ?? '');
    const n = Number.parseInt(id.replace(/^m/i, ''), 10);
    if (!Number.isFinite(n)) return max;
    return n > max ? n : max;
  }, 0);
}

function dedupeResultsByTeam(results) {
  const byTeam = new Map();
  results.forEach((r) => {
    const existing = byTeam.get(r.teamId);
    if (!existing || r.score > existing.score) {
      byTeam.set(r.teamId, r);
    }
  });
  return Array.from(byTeam.values());
}

// ── Load from localStorage ──
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.teams) {
        const teams = initialTeams.map(base => {
          const saved = parsed.teams.find(s => s.id === base.id);
          if (saved) {
            return { ...hydrateTeam(base), ...saved, name: base.name };
          }
          return hydrateTeam(base);
        });
        return {
          teams,
          matches: parsed.matches || [],
          byeTeamId: parsed.byeTeamId || null,
          currentRound: parsed.currentRound || 'qualifiers',
          currentMatchId: parsed.currentMatchId || null,
          currentMatchStartTotals: parsed.currentMatchStartTotals || {},
          matchResults: parsed.matchResults || { winners: [], losers: [] },
          roundResults: parsed.roundResults || { qualifiers: { winners: [], losers: [] } },
          activeTeams: parsed.activeTeams || initialTeams.map(t => t.id),
          eliminatedTeams: parsed.eliminatedTeams || [],
        };
      }
    }
  } catch (e) {
    console.warn('Failed to load state:', e);
  }
  return null;
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save state:', e);
  }
}

// ── Reducer ──
function reducer(state, action) {
  switch (action.type) {
    case 'UPDATE_TEAM': {
      // payload: { teamId, damageEntries: [{severity, hits}], aggrEntries: [{factor, hits}], ctrlEntries: [{factor, hits}] }
      const { teamId, damageEntries, aggrEntries, ctrlEntries } = action.payload;
      const { dmg: dmgPts, aggr: aggrPts, ctrl: ctrlPts } = calcSubmissionTotal(damageEntries, aggrEntries, ctrlEntries);
      return {
        ...state,
        teams: state.teams.map(t =>
          t.id === teamId
            ? {
                ...t,
                damageTotal: t.damageTotal + dmgPts,
                aggrTotal:   t.aggrTotal + aggrPts,
                ctrlTotal:   t.ctrlTotal + ctrlPts,
                prevTotal:   t.total,
                total:       t.total + dmgPts + aggrPts + ctrlPts,
                rounds:      t.rounds + 1,
                flashKey:    t.flashKey + 1,
              }
            : t
        ),
      };
    }
    case 'ADVANCE_MATCH': {
      const matches = state.matches.map(m => {
        if (m.status === 'live') return { ...m, status: 'completed' };
        if (m.status === 'next') return { ...m, status: 'live' };
        return m;
      });
      let promoted = false;
      const finalMatches = matches.map(m => {
        if (!promoted && m.status === 'upcoming') {
          promoted = true;
          return { ...m, status: 'next' };
        }
        return m;
      });
      return { ...state, matches: finalMatches };
    }
    case 'SET_BYE': {
      // payload: teamId or null
      const byeId = action.payload;
      return {
        ...state,
        byeTeamId: byeId,
        teams: state.teams.map(t => ({ ...t, hasBye: t.id === byeId })),
      };
    }
    case 'ADD_MATCH': {
      // payload: { teamA, teamB, status, round }
      const newId = 'm' + (getNextMatchNumber(state.matches) + 1);
      return {
        ...state,
        matches: [...state.matches, { id: newId, ...action.payload }],
      };
    }
    case 'REMOVE_MATCH': {
      return {
        ...state,
        matches: state.matches.filter(m => m.id !== action.payload),
      };
    }
    case 'UPDATE_MATCH_STATUS': {
      // payload: { matchId, status }
      return {
        ...state,
        matches: state.matches.map(m =>
          m.id === action.payload.matchId ? { ...m, status: action.payload.status } : m
        ),
      };
    }
    case 'SET_ROUND': {
      return { ...state, currentRound: action.payload };
    }
    case 'SET_PROCEED_TO_MATCHES': {
      return { ...state, showProceedToMatches: action.payload };
    }
    case 'SET_CURRENT_MATCH': {
      return {
        ...state,
        currentMatchId: action.payload?.matchId ?? null,
        currentMatchStartTotals: action.payload?.startTotals ?? {},
      };
    }
    case 'RECORD_MATCH_RESULT': {
      const { winners, losers, matchId, round } = action.payload;
      const keepWinner = state.matchResults.winners.filter(r => r.matchId !== matchId);
      const keepLoser = state.matchResults.losers.filter(r => r.matchId !== matchId);
      
      const currentRound = round || state.currentRound || 'qualifiers';
      const roundKey = currentRound;
      const roundData = state.roundResults[roundKey] || { winners: [], losers: [] };
      const keepRoundWinner = roundData.winners.filter(r => r.matchId !== matchId);
      const keepRoundLoser = roundData.losers.filter(r => r.matchId !== matchId);
      
      return {
        ...state,
        matchResults: {
          winners: [...keepWinner, ...winners],
          losers: [...keepLoser, ...losers],
        },
        roundResults: {
          ...state.roundResults,
          [roundKey]: {
            winners: [...keepRoundWinner, ...winners],
            losers: [...keepRoundLoser, ...losers],
          },
        },
      };
    }
    case 'SYNC_STATE': {
      return action.payload;
    }
    case 'RESET_ALL': {
      return {
        teams: initialTeams.map(hydrateTeam),
        matches: [],
        byeTeamId: null,
        currentRound: 'qualifiers',
        currentMatchId: null,
        currentMatchStartTotals: {},
        matchResults: { winners: [], losers: [] },
      };
    }
    case 'ADD_TEAM': {
      const newTeamName = action.payload;
      const newId = Math.max(0, ...state.teams.map(t => t.id)) + 1;
      return {
        ...state,
        teams: [...state.teams, hydrateTeam({ id: newId, name: newTeamName })],
      };
    }
    case 'REMOVE_TEAM': {
      const teamId = action.payload;
      return {
        ...state,
        teams: state.teams.filter(t => t.id !== teamId),
      };
    }
    case 'ADVANCE_ROUND': {
      // payload: { fromRound, toRound }
      const { fromRound, toRound } = action.payload;
      const roundData = state.roundResults[fromRound] || { winners: [], losers: [] };
      const roundMatchCount = state.matches.filter(m => (m.round || 'qualifiers') === fromRound).length;
      const winners = dedupeResultsByTeam(roundData.winners)
        .sort((a, b) => b.score - a.score);
      const losers = dedupeResultsByTeam(roundData.losers)
        .sort((a, b) => b.score - a.score);

      const cappedWinners = roundMatchCount > 0 && winners.length > roundMatchCount
        ? winners.slice(0, roundMatchCount)
        : winners;
      
      let advancingTeamIds = new Set();
      let nextMatches = [];
      let nextMatchNum = getNextMatchNumber(state.matches);
      
      // Different matchmaking logic based on the round we're advancing from
      if (fromRound === 'qualifiers') {
        // After qualifiers: Top winner vs top loser, then 2nd vs 7th, 3rd vs 6th, 4th vs 5th (winners only)
        const winnerArray = [...cappedWinners];
        const loserArray = [...losers];
        
        // All winners advance
        winnerArray.forEach(entry => advancingTeamIds.add(entry.teamId));
        
        // Top loser advances
        if (loserArray.length > 0) {
          advancingTeamIds.add(loserArray[0].teamId);
        }
        
        // Match 1: Top winner vs top loser
        if (winnerArray.length > 0 && loserArray.length > 0) {
          const team1 = state.teams.find(t => t.id === winnerArray[0].teamId);
          const team2 = state.teams.find(t => t.id === loserArray[0].teamId);
          if (team1 && team2) {
            nextMatches.push({
              id: `m${++nextMatchNum}`,
              teamA: team1.name,
              teamB: team2.name,
              status: 'upcoming',
              round: toRound,
            });
          }
        }
        
        // Remaining winners: 2nd vs 7th, 3rd vs 6th, 4th vs 5th
        const remainingWinners = winnerArray.slice(1);
        const matchCount = Math.floor(remainingWinners.length / 2);
        
        for (let i = 0; i < matchCount; i++) {
          const team1Id = remainingWinners[i].teamId;
          const team2Id = remainingWinners[remainingWinners.length - 1 - i].teamId;
          const team1 = state.teams.find(t => t.id === team1Id);
          const team2 = state.teams.find(t => t.id === team2Id);
          if (team1 && team2) {
            nextMatches.push({
              id: `m${++nextMatchNum}`,
              teamA: team1.name,
              teamB: team2.name,
              status: 'upcoming',
              round: toRound,
            });
          }
        }
      } else {
        // After quarter-finals and beyond: Pure elimination, only winners advance
        const winnerArray = [...cappedWinners];
        
        // Only winners advance
        winnerArray.forEach(entry => advancingTeamIds.add(entry.teamId));
        
        // Matchmaking: 1st vs last, 2nd vs second-last, etc.
        const matchCount = Math.floor(winnerArray.length / 2);
        
        for (let i = 0; i < matchCount; i++) {
          const team1Id = winnerArray[i].teamId;
          const team2Id = winnerArray[winnerArray.length - 1 - i].teamId;
          const team1 = state.teams.find(t => t.id === team1Id);
          const team2 = state.teams.find(t => t.id === team2Id);
          if (team1 && team2) {
            nextMatches.push({
              id: `m${++nextMatchNum}`,
              teamA: team1.name,
              teamB: team2.name,
              status: 'upcoming',
              round: toRound,
            });
          }
        }
      }
      
      // Teams that don't advance are eliminated
      const newEliminated = state.teams
        .filter(t => state.activeTeams.includes(t.id) && !advancingTeamIds.has(t.id))
        .map(t => t.id);
      
      // Reset scores for all teams to zero
      const resetTeams = state.teams.map(t => ({
        ...t,
        total: 0,
        damageTotal: 0,
        aggrTotal: 0,
        ctrlTotal: 0,
        rounds: 0,
      }));
      
      return {
        ...state,
        teams: resetTeams,
        activeTeams: Array.from(advancingTeamIds),
        eliminatedTeams: [...state.eliminatedTeams, ...newEliminated],
        roundResults: {
          ...state.roundResults,
          [toRound]: { winners: [], losers: [] },
        },
        matches: [...state.matches, ...nextMatches],
        currentRound: toRound,
        currentMatchId: null,
        currentMatchStartTotals: {},
        showProceedToMatches: true,
      };
    }
    default:
      return state;
  }
}

const defaultState = {
  teams: initialTeams.map(hydrateTeam),
  matches: [],
  byeTeamId: null,
  currentRound: 'qualifiers',
  currentMatchId: null,
  currentMatchStartTotals: {},
  matchResults: { winners: [], losers: [] },
  roundResults: { qualifiers: { winners: [], losers: [] } },
  activeTeams: initialTeams.map(t => t.id),
  eliminatedTeams: [],
  showProceedToMatches: false,
};

// ── Context ──
const TournamentContext = createContext(null);

export function TournamentProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, () => loadState() || defaultState);
  const channelRef = useRef(null);
  const tabId = useRef(Math.random().toString(36).slice(2));
  const stateRef = useRef(state);
  
  // Keep stateRef in sync
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Set up BroadcastChannel for cross-tab sync
  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = channel;

    channel.onmessage = (event) => {
      // Ignore messages from this same tab
      if (event.data?.senderId === tabId.current) return;
      if (event.data?.type === 'STATE_UPDATE') {
        dispatch({ type: 'SYNC_STATE', payload: event.data.state });
      }
    };

    return () => channel.close();
  }, []);

  // Save to localStorage & broadcast on every state change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveState(state);
      if (channelRef.current) {
        channelRef.current.postMessage({ type: 'STATE_UPDATE', state, senderId: tabId.current });
      }
    }, 50); // 50ms debounce to prevent rapid fire updates
    
    return () => clearTimeout(timeoutId);
  }, [state]);

  const updateTeam = useCallback((payload) => {
    dispatch({ type: 'UPDATE_TEAM', payload });
  }, []);

  const advanceMatch = useCallback(() => {
    dispatch({ type: 'ADVANCE_MATCH' });
  }, []);

  const setBye = useCallback((teamId) => {
    dispatch({ type: 'SET_BYE', payload: teamId });
  }, []);

  const addMatch = useCallback((teamA, teamB, status = 'upcoming', round = 'qualifiers') => {
    dispatch({ type: 'ADD_MATCH', payload: { teamA, teamB, status, round } });
  }, []);

  const removeMatch = useCallback((matchId) => {
    dispatch({ type: 'REMOVE_MATCH', payload: matchId });
  }, []);

  const updateMatchStatus = useCallback((matchId, status) => {
    dispatch({ type: 'UPDATE_MATCH_STATUS', payload: { matchId, status } });
  }, []);

  const resetAll = useCallback(() => {
    dispatch({ type: 'RESET_ALL' });
  }, []);

  const setRound = useCallback((round) => {
    dispatch({ type: 'SET_ROUND', payload: round });
  }, []);

  const setCurrentMatch = useCallback((payload) => {
    dispatch({ type: 'SET_CURRENT_MATCH', payload });
  }, []);

  const recordMatchResult = useCallback((payload) => {
    dispatch({ type: 'RECORD_MATCH_RESULT', payload });
  }, []);

  const addTeam = useCallback((teamName) => {
    dispatch({ type: 'ADD_TEAM', payload: teamName });
  }, []);

  const removeTeam = useCallback((teamId) => {
    dispatch({ type: 'REMOVE_TEAM', payload: teamId });
  }, []);

  const advanceRound = useCallback((fromRound, toRound) => {
    dispatch({ type: 'ADVANCE_ROUND', payload: { fromRound, toRound } });
  }, []);

  // Sort teams by total descending, stable sort by id for ties
  const sortedTeams = [...state.teams].sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    return a.id - b.id;
  });

  const hasTie = sortedTeams.some((t, i) => i > 0 && t.total === sortedTeams[i - 1].total);

  const setProceedToMatches = useCallback((show) => {
    dispatch({ type: 'SET_PROCEED_TO_MATCHES', payload: show });
  }, []);

  return (
    <TournamentContext.Provider value={{
      teams: state.teams,
      sortedTeams,
      matches: state.matches,
      byeTeamId: state.byeTeamId,
      currentRound: state.currentRound || 'qualifiers',
      currentMatchId: state.currentMatchId || null,
      currentMatchStartTotals: state.currentMatchStartTotals || {},
      matchResults: state.matchResults || { winners: [], losers: [] },
      roundResults: state.roundResults || { qualifiers: { winners: [], losers: [] } },
      activeTeams: state.activeTeams || [],
      eliminatedTeams: state.eliminatedTeams || [],
      showProceedToMatches: state.showProceedToMatches || false,
      hasTie,
      updateTeam,
      advanceMatch,
      setBye,
      addMatch,
      removeMatch,
      updateMatchStatus,
      resetAll,
      setRound,
      setCurrentMatch,
      recordMatchResult,
      addTeam,
      removeTeam,
      advanceRound,
      setProceedToMatches,
    }}>
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  const ctx = useContext(TournamentContext);
  if (!ctx) throw new Error('useTournament must be inside TournamentProvider');
  return ctx;
}
