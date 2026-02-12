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
export declare function initDb(): void;
export declare function upsertAgent(agent: {
    id: string;
    name: string;
    aggression: number;
    riskTolerance: number;
    accuracy: number;
    preferredRange: string;
}): void;
export declare function getLeaderboard(): AgentRecord[];
export declare function getAgentRecord(id: string): AgentRecord | undefined;
export declare function getAllAgents(): AgentRecord[];
export declare function getAgentStats(agentId: string): {
    agent: AgentRecord;
    recentMatches: MatchRecord[];
    winRateByOpponent: Record<string, {
        wins: number;
        losses: number;
        draws: number;
    }>;
    averageTurns: number;
    winRateByRange: Record<string, {
        wins: number;
        losses: number;
    }>;
    longestWinStreak: number;
    currentStreak: number;
    bestOpponent: string | null;
    worstOpponent: string | null;
} | null;
export declare function recordMatch(match: {
    id: string;
    seed: number;
    agent1Id: string;
    agent2Id: string;
    winnerAgentId: string | null;
    turns: number;
}): void;
//# sourceMappingURL=db.d.ts.map