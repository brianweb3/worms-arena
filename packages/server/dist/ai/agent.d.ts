export interface AgentProfile {
    id: string;
    name: string;
    /** 0–1: preference for attacking vs taking cover */
    aggression: number;
    /** 0–1: willingness to take risky shots / positions */
    riskTolerance: number;
    /** 0–1: aiming precision (lower = more random deviation) */
    accuracy: number;
    /** Preferred engagement range */
    preferredRange: 'close' | 'medium' | 'far';
    /** Display color override (optional, falls back to team color) */
    color?: string;
}
/**
 * 16 preset AI agents with distinct personalities.
 */
export declare const PRESET_AGENTS: AgentProfile[];
export declare function getAgentById(id: string): AgentProfile | undefined;
//# sourceMappingURL=agent.d.ts.map