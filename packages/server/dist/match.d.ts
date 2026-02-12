import type { MatchSummary } from '@worms-arena/shared';
import { Broadcaster } from './broadcast.js';
export declare function getWeaponStats(): Record<string, number>;
export declare class MatchManager {
    private broadcaster;
    private running;
    private agents;
    private globalRng;
    private slots;
    constructor(broadcaster: Broadcaster);
    /** Start all parallel match loops. */
    start(): Promise<void>;
    stop(): void;
    getMatchList(): MatchSummary[];
    /** Get next countdown (shortest) */
    getNextCountdown(): number;
    /** Run an infinite match loop for one slot. */
    private runSlotLoop;
    private runMatch;
    private pickAgents;
}
//# sourceMappingURL=match.d.ts.map