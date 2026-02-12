// ---------------------------------------------------------------------------
// worms.arena — Match Manager (multiple parallel matches)
// ---------------------------------------------------------------------------
import { v4 as uuid } from 'uuid';
import { GameEngine, SeededRNG, MATCH_TIME_LIMIT } from '@worms-arena/shared';
import { PRESET_AGENTS } from './ai/agent.js';
import { decideAction } from './ai/decide.js';
import { recordMatch, upsertAgent } from './db.js';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PARALLEL_MATCHES = 8;
const PAUSE_BETWEEN_MATCHES = 8; // seconds
// Global weapon stats tracker
const weaponStats = {
    bazooka: 0,
    grenade: 0,
    shotgun: 0,
};
export function getWeaponStats() {
    return { ...weaponStats };
}
export class MatchManager {
    broadcaster;
    running = false;
    agents = PRESET_AGENTS;
    globalRng;
    slots = [];
    constructor(broadcaster) {
        this.broadcaster = broadcaster;
        this.globalRng = new SeededRNG(Date.now());
        for (const agent of this.agents) {
            upsertAgent({
                id: agent.id,
                name: agent.name,
                aggression: agent.aggression,
                riskTolerance: agent.riskTolerance,
                accuracy: agent.accuracy,
                preferredRange: agent.preferredRange,
            });
        }
        // Initialize slots
        for (let i = 0; i < PARALLEL_MATCHES; i++) {
            this.slots.push({ id: i, engine: null, agents: null, startedAt: 0, countdown: 0 });
        }
        // On new client: send all active match states + match list
        this.broadcaster.onNewClient((ws) => {
            for (const slot of this.slots) {
                if (slot.engine) {
                    const state = slot.engine.getState();
                    this.broadcaster.send(ws, { type: 'match:start', matchId: state.matchId, state });
                }
            }
            this.broadcaster.send(ws, { type: 'match:list', matches: this.getMatchList() });
        });
        // Periodically broadcast match list
        setInterval(() => {
            this.broadcaster.broadcast({ type: 'match:list', matches: this.getMatchList() });
        }, 2000);
    }
    /** Start all parallel match loops. */
    async start() {
        this.running = true;
        console.log(`[match] Starting ${PARALLEL_MATCHES} parallel match slots`);
        const promises = this.slots.map((slot, i) => this.runSlotLoop(slot, i * 1500));
        await Promise.all(promises);
    }
    stop() {
        this.running = false;
    }
    getMatchList() {
        const list = [];
        for (const slot of this.slots) {
            if (slot.engine && slot.agents) {
                const e = slot.engine;
                const worms1 = e.worms.filter((w) => w.teamId === 0);
                const worms2 = e.worms.filter((w) => w.teamId === 1);
                list.push({
                    matchId: e.matchId,
                    agent1: slot.agents[0].name,
                    agent2: slot.agents[1].name,
                    agent1Id: slot.agents[0].id,
                    agent2Id: slot.agents[1].id,
                    agent1Color: e.teams[0].color,
                    agent2Color: e.teams[1].color,
                    turnNumber: e.turnNumber,
                    alive1: worms1.filter((w) => w.alive).length,
                    alive2: worms2.filter((w) => w.alive).length,
                    totalHp1: worms1.reduce((s, w) => s + (w.alive ? w.hp : 0), 0),
                    totalHp2: worms2.reduce((s, w) => s + (w.alive ? w.hp : 0), 0),
                    startedAt: slot.startedAt,
                });
            }
        }
        return list;
    }
    /** Get next countdown (shortest) */
    getNextCountdown() {
        let min = Infinity;
        for (const slot of this.slots) {
            if (slot.countdown > 0 && slot.countdown < min)
                min = slot.countdown;
        }
        return min === Infinity ? 0 : min;
    }
    /** Run an infinite match loop for one slot. */
    async runSlotLoop(slot, initialDelay) {
        await sleep(initialDelay);
        while (this.running) {
            try {
                await this.runMatch(slot);
            }
            catch (err) {
                console.error(`[match-${slot.id}] Error:`, err);
            }
            // Countdown between matches
            slot.countdown = PAUSE_BETWEEN_MATCHES;
            for (let i = PAUSE_BETWEEN_MATCHES; i > 0; i--) {
                slot.countdown = i;
                await sleep(1000);
            }
            slot.countdown = 0;
        }
    }
    async runMatch(slot) {
        const [agent1, agent2] = this.pickAgents();
        const matchId = uuid();
        const seed = this.globalRng.int(1, 2_000_000_000);
        console.log(`[match-${slot.id}] ${matchId.slice(0, 8)}: ${agent1.name} vs ${agent2.name}`);
        const engine = new GameEngine(seed, matchId, [agent1.id, agent2.id]);
        engine.teams[0].name = agent1.name;
        engine.teams[1].name = agent2.name;
        slot.engine = engine;
        slot.agents = [agent1, agent2];
        slot.startedAt = Date.now();
        const mid = matchId;
        // Broadcast match start
        this.broadcaster.broadcast({ type: 'match:start', matchId: mid, state: engine.getState() });
        await sleep(1500);
        const agents = [agent1, agent2];
        while (!engine.isFinished && this.running) {
            // Check if match time limit has been reached
            const elapsedTime = Date.now() - slot.startedAt;
            if (elapsedTime >= MATCH_TIME_LIMIT) {
                // Determine winner by total HP
                let bestTeam = 0;
                let bestHp = -1;
                for (let t = 0; t < 2; t++) {
                    const totalHp = engine.worms
                        .filter((w) => w.teamId === t && w.alive)
                        .reduce((sum, w) => sum + w.hp, 0);
                    if (totalHp > bestHp) {
                        bestHp = totalHp;
                        bestTeam = t;
                    }
                }
                engine.winnerId = bestHp > 0 ? bestTeam : null;
                engine.isFinished = true;
                break;
            }
            const wind = engine.rollWind();
            const activeWorm = engine.getActiveWorm();
            if (!activeWorm) {
                engine.checkWinCondition();
                if (!engine.isFinished)
                    engine.advanceTurn();
                continue;
            }
            this.broadcaster.broadcast({
                type: 'turn:start', matchId: mid,
                turnNumber: engine.turnNumber + 1, activeWormId: activeWorm.id, wind,
            });
            await sleep(600);
            const agentProfile = agents[activeWorm.teamId];
            const team = engine.teams[activeWorm.teamId];
            const action = decideAction(activeWorm, engine.worms, engine.terrain, wind, agentProfile, engine.rng, team?.inventory);
            this.broadcaster.broadcast({ type: 'turn:action', matchId: mid, turnNumber: engine.turnNumber + 1, action });
            await sleep(200);
            const result = engine.executeTurn(action);
            if (result.movementFrames && result.movementFrames.length > 0) {
                this.broadcaster.broadcast({
                    type: 'movement:update',
                    matchId: mid,
                    frames: result.movementFrames,
                    wormId: activeWorm.id
                });
                await sleep(Math.min(1500, result.movementFrames.length * 20));
            }
            if (result.trajectoryFrames.length > 0) {
                this.broadcaster.broadcast({ type: 'projectile:update', matchId: mid, frames: result.trajectoryFrames });
                await sleep(Math.min(2000, result.trajectoryFrames.length * 15));
            }
            if (result.explosions.length > 0) {
                this.broadcaster.broadcast({ type: 'explosion', matchId: mid, explosions: result.explosions });
                await sleep(400);
            }
            if (result.terrainDamage.length > 0) {
                this.broadcaster.broadcast({ type: 'terrain:update', matchId: mid, damage: result.terrainDamage });
            }
            this.broadcaster.broadcast({ type: 'worm:update', matchId: mid, worms: result.wormsAfter, deaths: result.deaths });
            // Broadcast stats update
            const state = engine.getState();
            if (state.matchStats) {
                // Update global weapon stats
                weaponStats.bazooka += state.matchStats.weaponsUsed.bazooka;
                weaponStats.grenade += state.matchStats.weaponsUsed.grenade;
                weaponStats.shotgun += state.matchStats.weaponsUsed.shotgun;
                this.broadcaster.broadcast({ type: 'match:stats', matchId: mid, stats: state.matchStats });
            }
            await sleep(1000);
        }
        console.log(`[match-${slot.id}] ${matchId.slice(0, 8)} finished: ${engine.winnerId !== null ? agents[engine.winnerId].name + ' wins' : 'Draw'} (${engine.turnNumber} turns)`);
        this.broadcaster.broadcast({
            type: 'match:end', matchId: mid, winnerId: engine.winnerId, teams: engine.teams, worms: engine.worms,
        });
        recordMatch({
            id: matchId, seed, agent1Id: agent1.id, agent2Id: agent2.id,
            winnerAgentId: engine.winnerId !== null ? agents[engine.winnerId].id : null,
            turns: engine.turnNumber,
        });
        slot.engine = null;
        slot.agents = null;
    }
    pickAgents() {
        const idx1 = this.globalRng.int(0, this.agents.length - 1);
        let idx2 = this.globalRng.int(0, this.agents.length - 2);
        if (idx2 >= idx1)
            idx2++;
        return [this.agents[idx1], this.agents[idx2]];
    }
}
//# sourceMappingURL=match.js.map