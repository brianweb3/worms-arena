import type { GameState, Worm, Team, TurnAction, TurnResult, Wind, Item, MatchStats } from './types.js';
import { SeededRNG } from './rng.js';
import { Terrain } from './terrain.js';
export declare class GameEngine {
    readonly seed: number;
    readonly rng: SeededRNG;
    terrain: Terrain;
    matchId: string;
    teams: Team[];
    worms: Worm[];
    turnNumber: number;
    currentTeamIndex: number;
    currentWormIndices: number[];
    wind: Wind;
    isFinished: boolean;
    winnerId: number | null;
    items: Item[];
    matchStats: MatchStats;
    constructor(seed: number, matchId: string, agentIds: string[]);
    /** Get the worm that should act this turn. */
    getActiveWorm(): Worm | null;
    /** Generate new wind for this turn. */
    rollWind(): Wind;
    /** Advance to the next team/worm turn. */
    advanceTurn(): void;
    /** Check if the game is over. */
    checkWinCondition(): void;
    /** Execute a turn action and return the result. */
    executeTurn(action: TurnAction): TurnResult;
    private executeShoot;
    private executeMove;
    private executeMoveTo;
    private executeUseItem;
    private spawnItem;
    private checkItemPickup;
    /** Get a full snapshot of the game state. */
    getState(): GameState;
    private emptyTurnResult;
}
//# sourceMappingURL=engine.d.ts.map