import type { Worm, TurnAction, Wind, Inventory } from '@worms-arena/shared';
import { Terrain } from '@worms-arena/shared';
import { SeededRNG } from '@worms-arena/shared';
import type { AgentProfile } from './agent.js';
/**
 * AI decision: given the current state, pick an action for the active worm.
 */
export declare function decideAction(activeWorm: Worm, allWorms: Worm[], terrain: Terrain, wind: Wind, agent: AgentProfile, rng: SeededRNG, inventory?: Inventory): TurnAction;
//# sourceMappingURL=decide.d.ts.map