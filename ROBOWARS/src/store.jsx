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
      const maxNum = state.matches.reduce((max, m) => {
        const n = parseInt(m.id.replace('m', ''), 10);
        return n > max ? n : max;
      }, 0);
      const newId = 'm' + (maxNum + 1);
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
    case 'SYNC_STATE': {
      return action.payload;
    }
    case 'RESET_ALL': {
      return {
        teams: initialTeams.map(hydrateTeam),
        matches: [],
        byeTeamId: null,
        currentRound: 'qualifiers',
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
};

// ── Context ──
const TournamentContext = createContext(null);

export function TournamentProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, null, () => loadState() || defaultState);
  const channelRef = useRef(null);
  const tabId = useRef(Math.random().toString(36).slice(2));

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

  // Save to localStorage & broadcast on every state change
  useEffect(() => {
    saveState(state);
    if (channelRef.current) {
      channelRef.current.postMessage({ type: 'STATE_UPDATE', state, senderId: tabId.current });
    }
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

  // Sort teams by total descending, stable sort by id for ties
  const sortedTeams = [...state.teams].sort((a, b) => {
    if (b.total !== a.total) return b.total - a.total;
    return a.id - b.id;
  });

  const hasTie = sortedTeams.some((t, i) => i > 0 && t.total === sortedTeams[i - 1].total);

  return (
    <TournamentContext.Provider value={{
      teams: state.teams,
      sortedTeams,
      matches: state.matches,
      byeTeamId: state.byeTeamId,
      currentRound: state.currentRound || 'qualifiers',
      hasTie,
      updateTeam,
      advanceMatch,
      setBye,
      addMatch,
      removeMatch,
      updateMatchStatus,
      resetAll,
      setRound,
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
