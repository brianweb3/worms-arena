// ---------------------------------------------------------------------------
// worms.arena — In-memory data store with JSON file persistence
// ---------------------------------------------------------------------------

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PRESET_AGENTS } from './ai/agent.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Use /tmp for Vercel (writable) or local data directory
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
const DATA_PATH = isVercel 
  ? path.resolve('/tmp', 'worms-arena-store.json')
  : path.resolve(__dirname, '..', 'data', 'store.json');

console.log(`[db] Using data path: ${DATA_PATH} (Vercel: ${isVercel})`);

// ---- Types ----

export interface AgentRecord {
  id: string;
  name: string;
  aggression: number;
  risk_tolerance: number;
  accuracy: number;
  preferred_range: string;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
}

export interface MatchRecord {
  id: string;
  seed: number;
  agent1_id: string;
  agent2_id: string;
  winner_agent_id: string | null;
  turns: number;
  finished_at: string;
}

interface StoreData {
  agents: Record<string, AgentRecord>;
  matches: MatchRecord[];
}

// ---- Store singleton ----

let store: StoreData = { agents: {}, matches: [] };

export function initDb(): void {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (err) {
      console.warn(`[db] Failed to create directory ${dir}:`, err);
    }
  }
  if (fs.existsSync(DATA_PATH)) {
    try {
      store = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
      console.log(`[db] Loaded ${Object.keys(store.agents).length} agents, ${store.matches.length} matches`);
    } catch (err) {
      console.warn('[db] Failed to parse store, starting fresh:', err);
      store = { agents: {}, matches: [] };
    }
  } else {
    console.log(`[db] No existing store at ${DATA_PATH}, starting fresh`);
    store = { agents: {}, matches: [] };
  }
}

function save(): void {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(store, null, 2));
  } catch {
    // non-critical
  }
}

// ---- Agent operations ----

export function upsertAgent(agent: {
  id: string;
  name: string;
  aggression: number;
  riskTolerance: number;
  accuracy: number;
  preferredRange: string;
}): void {
  const existing = store.agents[agent.id];
  store.agents[agent.id] = {
    id: agent.id,
    name: agent.name,
    aggression: agent.aggression,
    risk_tolerance: agent.riskTolerance,
    accuracy: agent.accuracy,
    preferred_range: agent.preferredRange,
    elo: existing?.elo ?? 1200,
    wins: existing?.wins ?? 0,
    losses: existing?.losses ?? 0,
    draws: existing?.draws ?? 0,
  };
  save();
}

export function getLeaderboard(): AgentRecord[] {
  const agents = Object.values(store.agents);
  console.log(`[db] getLeaderboard: ${agents.length} agents in store`);
  const sorted = agents.sort((a, b) => b.elo - a.elo);
  console.log(`[db] getLeaderboard: returning ${sorted.length} agents`);
  return sorted;
}

export function getAgentRecord(id: string): AgentRecord | undefined {
  return store.agents[id];
}

export function getAllAgents(): AgentRecord[] {
  // Return only agents that are in PRESET_AGENTS to ensure consistency
  const presetIds = new Set(PRESET_AGENTS.map((a) => a.id));
  return Object.values(store.agents).filter((agent) => presetIds.has(agent.id));
}

export function getAgentStats(agentId: string): {
  agent: AgentRecord;
  recentMatches: MatchRecord[];
  winRateByOpponent: Record<string, { wins: number; losses: number; draws: number }>;
  averageTurns: number;
  winRateByRange: Record<string, { wins: number; losses: number }>;
  longestWinStreak: number;
  currentStreak: number;
  bestOpponent: string | null;
  worstOpponent: string | null;
} | null {
  const agent = store.agents[agentId];
  if (!agent) return null;

  // Get all matches involving this agent
  const agentMatches = store.matches.filter(
    (m) => m.agent1_id === agentId || m.agent2_id === agentId
  );

  // Recent matches (last 20)
  const recentMatches = agentMatches.slice(-20).reverse();

  // Win rate by opponent
  const winRateByOpponent: Record<string, { wins: number; losses: number; draws: number }> = {};
  agentMatches.forEach((m) => {
    const opponentId = m.agent1_id === agentId ? m.agent2_id : m.agent1_id;
    if (!winRateByOpponent[opponentId]) {
      winRateByOpponent[opponentId] = { wins: 0, losses: 0, draws: 0 };
    }
    if (m.winner_agent_id === agentId) {
      winRateByOpponent[opponentId].wins++;
    } else if (m.winner_agent_id === opponentId) {
      winRateByOpponent[opponentId].losses++;
    } else {
      winRateByOpponent[opponentId].draws++;
    }
  });

  // Average turns
  const totalTurns = agentMatches.reduce((sum, m) => sum + m.turns, 0);
  const averageTurns = agentMatches.length > 0 ? totalTurns / agentMatches.length : 0;

  // Win rate by preferred range (simplified - using opponent's range)
  const winRateByRange: Record<string, { wins: number; losses: number }> = {
    close: { wins: 0, losses: 0 },
    medium: { wins: 0, losses: 0 },
    far: { wins: 0, losses: 0 },
  };

  agentMatches.forEach((m) => {
    const opponentId = m.agent1_id === agentId ? m.agent2_id : m.agent1_id;
    const opponent = store.agents[opponentId];
    if (opponent) {
      const range = opponent.preferred_range as 'close' | 'medium' | 'far';
      if (m.winner_agent_id === agentId) {
        winRateByRange[range].wins++;
      } else if (m.winner_agent_id === opponentId) {
        winRateByRange[range].losses++;
      }
    }
  });

  // Longest win streak and current streak
  let longestStreak = 0;
  let currentStreak = 0;
  let maxStreak = 0;
  for (let i = agentMatches.length - 1; i >= 0; i--) {
    const m = agentMatches[i];
    if (m.winner_agent_id === agentId) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else if (m.winner_agent_id !== null) {
      longestStreak = Math.max(longestStreak, maxStreak);
      maxStreak = 0;
      currentStreak = 0;
    }
  }
  longestStreak = Math.max(longestStreak, maxStreak);

  // Best and worst opponent (by win rate, minimum 3 games)
  let bestOpponent: string | null = null;
  let worstOpponent: string | null = null;
  let bestWinRate = -1;
  let worstWinRate = 2;

  Object.entries(winRateByOpponent).forEach(([opponentId, stats]) => {
    const total = stats.wins + stats.losses + stats.draws;
    if (total >= 3) {
      const winRate = stats.wins / total;
      if (winRate > bestWinRate) {
        bestWinRate = winRate;
        bestOpponent = opponentId;
      }
      if (winRate < worstWinRate) {
        worstWinRate = winRate;
        worstOpponent = opponentId;
      }
    }
  });

  return {
    agent,
    recentMatches,
    winRateByOpponent,
    averageTurns: Math.round(averageTurns),
    winRateByRange,
    longestWinStreak: longestStreak,
    currentStreak: maxStreak,
    bestOpponent,
    worstOpponent,
  };
}

// ---- Match operations ----

export function recordMatch(match: {
  id: string;
  seed: number;
  agent1Id: string;
  agent2Id: string;
  winnerAgentId: string | null;
  turns: number;
}): void {
  store.matches.push({
    id: match.id,
    seed: match.seed,
    agent1_id: match.agent1Id,
    agent2_id: match.agent2Id,
    winner_agent_id: match.winnerAgentId,
    turns: match.turns,
    finished_at: new Date().toISOString(),
  });

  // Update ELO
  const a1 = store.agents[match.agent1Id];
  const a2 = store.agents[match.agent2Id];
  if (a1 && a2) {
    if (match.winnerAgentId === match.agent1Id) {
      a1.wins++;
      a2.losses++;
      updateElo(a1, a2, 1);
    } else if (match.winnerAgentId === match.agent2Id) {
      a2.wins++;
      a1.losses++;
      updateElo(a1, a2, 0);
    } else {
      a1.draws++;
      a2.draws++;
      updateElo(a1, a2, 0.5);
    }
  }

  // Keep only last 500 matches in memory
  if (store.matches.length > 500) {
    store.matches = store.matches.slice(-500);
  }

  save();
}

/** Simple ELO update. score1 = 1 (player1 wins), 0 (player2 wins), 0.5 (draw) */
function updateElo(a1: AgentRecord, a2: AgentRecord, score1: number): void {
  const K = 32;
  const expected1 = 1 / (1 + Math.pow(10, (a2.elo - a1.elo) / 400));
  const expected2 = 1 - expected1;
  a1.elo = Math.round(a1.elo + K * (score1 - expected1));
  a2.elo = Math.round(a2.elo + K * ((1 - score1) - expected2));
}
