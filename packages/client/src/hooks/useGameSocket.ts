// ---------------------------------------------------------------------------
// worms.arena — WebSocket hook for multiple parallel games
// ---------------------------------------------------------------------------

import { useEffect, useRef, useState, useCallback } from 'react';
import type {
  GameEvent,
  GameState,
  Worm,
  Explosion,
  TurnAction,
  Wind,
  MatchSummary,
} from '@worms-arena/shared';

export interface MatchData {
  state: GameState | null;
  worms: Worm[];
  wind: Wind;
  turnNumber: number;
  activeWormId: number | null;
  currentAction: TurnAction | null;
  projectileFrames: Array<{ x: number; y: number }>;
  movementFrames: Array<{ x: number; y: number }>;
  movingWormId: number | null;
  explosions: Explosion[];
  terrainDamage: Array<{ x: number; y: number; radius: number }>;
  deaths: number[];
  matchOver: boolean;
  winnerId: number | null;
  startedAt: number | null;
}

function freshMatch(): MatchData {
  return {
    state: null, worms: [], wind: 0, turnNumber: 0,
    activeWormId: null, currentAction: null, projectileFrames: [],
    movementFrames: [], movingWormId: null,
    explosions: [], terrainDamage: [], deaths: [],
    matchOver: false, winnerId: null, startedAt: null,
  };
}

export interface MultiGameData {
  connected: boolean;
  /** All active matches keyed by matchId */
  matches: Record<string, MatchData>;
  /** Periodic match list summaries */
  matchList: MatchSummary[];
}

export function useGameSocket(): MultiGameData {
  const [connected, setConnected] = useState(false);
  const [matches, setMatches] = useState<Record<string, MatchData>>({});
  const [matchList, setMatchList] = useState<MatchSummary[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    function connect() {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        setTimeout(connect, 2000);
      };
      ws.onerror = () => ws.close();
      ws.onmessage = (msg) => {
        try {
          const event = JSON.parse(msg.data);
          handleEvent(event);
        } catch {}
      };
    }

    function handleEvent(event: GameEvent | { type: 'welcome' }) {
      if (event.type === 'welcome') return;
      if (event.type === 'match:list') {
        setMatchList(event.matches);
        return;
      }

      const mid = (event as any).matchId as string;
      if (!mid) return;

      setMatches((prev) => {
        const m = prev[mid] ?? freshMatch();
        const updated = applyEvent(m, event as GameEvent);
        // If match ended, keep it briefly then remove
        if (event.type === 'match:end') {
          setTimeout(() => {
            setMatches((p) => {
              const copy = { ...p };
              delete copy[mid];
              return copy;
            });
          }, 10000);
        }
        return { ...prev, [mid]: updated };
      });
    }

    connect();
    return () => { wsRef.current?.close(); };
  }, []);

  return { connected, matches, matchList };
}

function applyEvent(m: MatchData, event: GameEvent): MatchData {
  switch (event.type) {
    case 'match:start':
      return {
        ...freshMatch(),
        state: event.state,
        worms: event.state.worms,
        wind: event.state.wind,
        startedAt: Date.now(),
      };
    case 'turn:start':
      return {
        ...m,
        turnNumber: event.turnNumber,
        activeWormId: event.activeWormId,
        wind: event.wind,
        currentAction: null,
        projectileFrames: [],
        movementFrames: [],
        movingWormId: null,
        explosions: [],
      };
    case 'turn:action':
      return { ...m, currentAction: event.action };
    case 'movement:update':
      return { 
        ...m, 
        movementFrames: event.frames,
        movingWormId: event.wormId,
      };
    case 'projectile:update':
      return { ...m, projectileFrames: event.frames };
    case 'explosion':
      return { ...m, explosions: event.explosions };
    case 'terrain:update':
      return { ...m, terrainDamage: [...m.terrainDamage, ...event.damage] };
    case 'worm:update':
      return { 
        ...m, 
        worms: event.worms, 
        deaths: event.deaths,
        movementFrames: [], // Clear movement frames after update
        movingWormId: null,
      };
    case 'match:stats':
      return {
        ...m,
        state: m.state ? { ...m.state, matchStats: event.stats } : m.state,
      };
    case 'match:end':
      return { ...m, matchOver: true, winnerId: event.winnerId, worms: event.worms };
    default:
      return m;
  }
}
