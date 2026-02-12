// ---------------------------------------------------------------------------
// worms.arena — Game Engine
// ---------------------------------------------------------------------------
import { MAP_WIDTH, MAP_HEIGHT, WORM_HP, WORM_RADIUS, WORM_MOVE_SPEED, TEAM_SIZE, TEAM_COUNT, WATER_LEVEL, STARTING_WEAPONS, STARTING_HEALTH_KITS, STARTING_SHIELDS, STARTING_SPEED_BOOSTS, MAX_MOVE_DISTANCE_PER_TURN, MOVE_STEP_SIZE, } from './constants';
import { SeededRNG } from './rng';
import { generateTerrain } from './terrain';
import { WEAPONS } from './weapons';
import { simulateProjectile, applyExplosion, applyWormGravity } from './physics';
/** Team colours */
const TEAM_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f'];
/** Worm name pools per team */
const WORM_NAMES = [
    ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot'],
    ['Zeus', 'Ares', 'Hermes', 'Apollo', 'Poseidon', 'Hephaestus'],
    ['Blade', 'Razor', 'Spike', 'Fang', 'Venom', 'Shadow'],
    ['Pixel', 'Byte', 'Chip', 'Glitch', 'Stack', 'Loop'],
];
export class GameEngine {
    seed;
    rng;
    terrain;
    matchId;
    teams;
    worms;
    turnNumber;
    currentTeamIndex;
    currentWormIndices;
    wind;
    isFinished;
    winnerId;
    items;
    matchStats;
    constructor(seed, matchId, agentIds) {
        this.seed = seed;
        this.rng = new SeededRNG(seed);
        this.matchId = matchId;
        // Generate terrain
        this.terrain = generateTerrain(this.rng, MAP_WIDTH, MAP_HEIGHT);
        // Create teams with inventory
        this.teams = [];
        for (let t = 0; t < TEAM_COUNT; t++) {
            const inventory = {
                weapons: {
                    bazooka: STARTING_WEAPONS.bazooka,
                    grenade: STARTING_WEAPONS.grenade,
                    shotgun: STARTING_WEAPONS.shotgun,
                },
                healthKits: STARTING_HEALTH_KITS,
                shields: STARTING_SHIELDS,
                speedBoosts: STARTING_SPEED_BOOSTS,
            };
            this.teams.push({
                id: t,
                name: agentIds[t] ?? `Team ${t + 1}`,
                agentId: agentIds[t] ?? `agent-${t}`,
                color: TEAM_COLORS[t],
                inventory,
            });
        }
        // Create worms
        this.worms = [];
        let wormId = 0;
        for (let t = 0; t < TEAM_COUNT; t++) {
            for (let w = 0; w < TEAM_SIZE; w++) {
                // Spread worms across the map
                const xMin = t === 0 ? 50 : MAP_WIDTH * 0.55;
                const xMax = t === 0 ? MAP_WIDTH * 0.45 : MAP_WIDTH - 50;
                const x = Math.floor(xMin + (xMax - xMin) * ((w + 0.5) / TEAM_SIZE));
                // Find surface y
                const surfY = this.terrain.surfaceY(x);
                const y = surfY - WORM_RADIUS - 1;
                const names = WORM_NAMES[t % WORM_NAMES.length];
                this.worms.push({
                    id: wormId++,
                    name: names[w % names.length],
                    teamId: t,
                    hp: WORM_HP,
                    x,
                    y: Math.max(10, y),
                    alive: true,
                    facing: t === 0 ? 1 : -1,
                });
            }
        }
        this.turnNumber = 0;
        this.currentTeamIndex = 0;
        this.currentWormIndices = new Array(TEAM_COUNT).fill(0);
        this.wind = 0;
        this.isFinished = false;
        this.winnerId = null;
        this.items = [];
        this.matchStats = {
            totalShots: 0,
            totalDamage: 0,
            weaponsUsed: { bazooka: 0, grenade: 0, shotgun: 0 },
            movementDistance: 0,
            itemsPicked: 0,
        };
    }
    /** Get the worm that should act this turn. */
    getActiveWorm() {
        const teamWorms = this.worms.filter((w) => w.teamId === this.currentTeamIndex && w.alive);
        if (teamWorms.length === 0)
            return null;
        const idx = this.currentWormIndices[this.currentTeamIndex] % teamWorms.length;
        return teamWorms[idx];
    }
    /** Generate new wind for this turn. */
    rollWind() {
        this.wind = Math.round(this.rng.range(-1, 1) * 100) / 100;
        return this.wind;
    }
    /** Advance to the next team/worm turn. */
    advanceTurn() {
        this.currentWormIndices[this.currentTeamIndex]++;
        // Find the next team that still has alive worms
        for (let i = 0; i < TEAM_COUNT; i++) {
            this.currentTeamIndex = (this.currentTeamIndex + 1) % TEAM_COUNT;
            const alive = this.worms.filter((w) => w.teamId === this.currentTeamIndex && w.alive);
            if (alive.length > 0)
                return;
        }
    }
    /** Check if the game is over. */
    checkWinCondition() {
        const aliveTeams = new Set();
        for (const w of this.worms) {
            if (w.alive)
                aliveTeams.add(w.teamId);
        }
        if (aliveTeams.size <= 1) {
            this.isFinished = true;
            if (aliveTeams.size === 1) {
                this.winnerId = [...aliveTeams][0];
            }
            else {
                this.winnerId = null; // draw
            }
        }
        // Safety: end after 200 turns
        if (this.turnNumber >= 200) {
            this.isFinished = true;
            // Winner = team with most total HP
            let bestTeam = 0;
            let bestHp = -1;
            for (let t = 0; t < TEAM_COUNT; t++) {
                const totalHp = this.worms
                    .filter((w) => w.teamId === t && w.alive)
                    .reduce((sum, w) => sum + w.hp, 0);
                if (totalHp > bestHp) {
                    bestHp = totalHp;
                    bestTeam = t;
                }
            }
            this.winnerId = bestHp > 0 ? bestTeam : null;
        }
    }
    /** Execute a turn action and return the result. */
    executeTurn(action) {
        this.turnNumber++;
        const activeWorm = this.getActiveWorm();
        if (!activeWorm) {
            // Shouldn't happen, but safety
            return this.emptyTurnResult(action);
        }
        const result = {
            turnNumber: this.turnNumber,
            activeWormId: activeWorm.id,
            wind: this.wind,
            action,
            trajectoryFrames: [],
            explosions: [],
            wormsAfter: [],
            terrainDamage: [],
            deaths: [],
        };
        switch (action.type) {
            case 'shoot':
                this.executeShoot(activeWorm, action, result);
                break;
            case 'move':
                this.executeMove(activeWorm, action, result);
                break;
            case 'moveTo':
                this.executeMoveTo(activeWorm, action, result);
                break;
            case 'useItem':
                this.executeUseItem(activeWorm, action, result);
                break;
            case 'skip':
                break;
        }
        // Apply gravity to all worms after terrain changes
        const { deaths: gravityDeaths } = applyWormGravity(this.terrain, this.worms);
        result.deaths.push(...gravityDeaths);
        // Snapshot worms after turn
        result.wormsAfter = this.worms.map((w) => ({ ...w }));
        // Check win
        this.checkWinCondition();
        // Advance to next turn
        if (!this.isFinished) {
            this.advanceTurn();
        }
        return result;
    }
    executeShoot(worm, action, result) {
        const team = this.teams[worm.teamId];
        if (!team)
            return;
        // Check if weapon is available in inventory
        if (team.inventory.weapons[action.weaponId] <= 0) {
            // Weapon not available, skip
            return;
        }
        // Consume weapon from inventory
        team.inventory.weapons[action.weaponId]--;
        const weapon = WEAPONS[action.weaponId];
        if (!weapon)
            return;
        // Update stats
        this.matchStats.totalShots++;
        this.matchStats.weaponsUsed[action.weaponId]++;
        const speed = weapon.speedMultiplier * action.power;
        for (let p = 0; p < weapon.projectileCount; p++) {
            // Apply spread for multi-projectile weapons
            let angle = action.angle;
            if (weapon.projectileCount > 1) {
                const spreadOffset = (p - (weapon.projectileCount - 1) / 2) * weapon.spreadAngle;
                angle += spreadOffset;
            }
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            // Start projectile slightly in front of the worm
            const startX = worm.x + Math.cos(angle) * (WORM_RADIUS + 4);
            const startY = worm.y + Math.sin(angle) * (WORM_RADIUS + 4);
            const projResult = simulateProjectile(startX, startY, vx, vy, action.weaponId, this.wind, this.terrain, this.worms);
            // Merge trajectory frames
            if (p === 0) {
                result.trajectoryFrames = projResult.frames;
            }
            // Apply explosion
            if (projResult.explosion) {
                result.explosions.push(projResult.explosion);
                result.terrainDamage.push({
                    x: projResult.explosion.x,
                    y: projResult.explosion.y,
                    radius: projResult.explosion.radius,
                });
                const { damagedWorms } = applyExplosion(projResult.explosion, this.terrain, this.worms);
                // Track damage and deaths from explosion
                for (const dw of damagedWorms) {
                    this.matchStats.totalDamage += dw.damage;
                    if (!result.deaths.includes(dw.id)) {
                        const wormHit = this.worms.find((w) => w.id === dw.id);
                        if (wormHit && !wormHit.alive) {
                            result.deaths.push(dw.id);
                        }
                    }
                }
                // Spawn items after explosion (chance)
                if (this.rng.next() < 0.3) {
                    this.spawnItem(projResult.explosion.x, projResult.explosion.y);
                }
            }
        }
        // Update facing direction based on shot angle
        worm.facing = Math.cos(action.angle) >= 0 ? 1 : -1;
    }
    executeMove(worm, action, result) {
        const dir = action.direction;
        worm.facing = dir;
        // Try to walk: check terrain ahead, climb small steps
        const targetX = worm.x + dir * WORM_MOVE_SPEED;
        const step = dir * 2;
        let x = worm.x;
        for (let i = 0; i < Math.abs(WORM_MOVE_SPEED / 2); i++) {
            const nextX = x + step;
            if (nextX < WORM_RADIUS || nextX > MAP_WIDTH - WORM_RADIUS)
                break;
            // Check if we can walk or need to climb
            const feetY = worm.y + WORM_RADIUS;
            if (!this.terrain.isSolid(nextX, feetY) && !this.terrain.isSolid(nextX, feetY + 1)) {
                // No ground ahead — can still walk if there's ground below (slope down)
                x = nextX;
            }
            else if (!this.terrain.isSolid(nextX, worm.y) && !this.terrain.isSolid(nextX, worm.y - 1)) {
                // Can walk at current height
                x = nextX;
            }
            else if (!this.terrain.isSolid(nextX, worm.y - 4)) {
                // Can climb a small step (up to 4 pixels)
                x = nextX;
                worm.y -= 4;
            }
            else {
                // Blocked
                break;
            }
        }
        worm.x = Math.round(x);
        // Check for item pickup
        this.checkItemPickup(worm, result);
    }
    executeMoveTo(worm, action, result) {
        const startX = worm.x;
        const startY = worm.y;
        const targetX = action.targetX;
        const targetY = action.targetY;
        // Calculate distance
        const dx = targetX - startX;
        const dy = targetY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        // Limit movement distance
        const maxDistance = MAX_MOVE_DISTANCE_PER_TURN;
        if (distance > maxDistance) {
            // Scale down to max distance
            const scale = maxDistance / distance;
            const adjustedTargetX = startX + dx * scale;
            const adjustedTargetY = startY + dy * scale;
            return this.executeMoveTo(worm, { type: 'moveTo', targetX: adjustedTargetX, targetY: adjustedTargetY }, result);
        }
        // Simple pathfinding: move towards target step by step
        const path = [];
        let currentX = startX;
        let currentY = startY;
        const steps = Math.ceil(distance / MOVE_STEP_SIZE);
        for (let i = 0; i < steps; i++) {
            const progress = (i + 1) / steps;
            const nextX = startX + dx * progress;
            const nextY = startY + dy * progress;
            // Check if position is valid (not in terrain, not out of bounds)
            if (nextX < WORM_RADIUS || nextX > MAP_WIDTH - WORM_RADIUS)
                break;
            if (nextY < WORM_RADIUS || nextY > WATER_LEVEL)
                break;
            // Check terrain collision
            const checkY = Math.min(nextY + WORM_RADIUS, WATER_LEVEL - 1);
            if (this.terrain.isSolid(nextX, checkY)) {
                // Try to climb up
                let climbY = checkY - 1;
                let foundValid = false;
                for (let climb = 0; climb < 10; climb++) {
                    if (!this.terrain.isSolid(nextX, climbY) && climbY >= WORM_RADIUS) {
                        foundValid = true;
                        break;
                    }
                    climbY--;
                }
                if (!foundValid)
                    break;
                currentY = climbY - WORM_RADIUS;
            }
            else {
                // Apply gravity
                let fallY = checkY;
                while (fallY < WATER_LEVEL - WORM_RADIUS && !this.terrain.isSolid(nextX, fallY + WORM_RADIUS + 1)) {
                    fallY++;
                }
                currentY = fallY - WORM_RADIUS;
            }
            currentX = nextX;
            path.push({ x: currentX, y: currentY });
        }
        // Update worm position
        if (path.length > 0) {
            const finalPos = path[path.length - 1];
            worm.x = Math.round(finalPos.x);
            worm.y = Math.round(finalPos.y);
            worm.facing = dx >= 0 ? 1 : -1;
            result.movementFrames = path;
            this.matchStats.movementDistance += distance;
            // Check for item pickup
            this.checkItemPickup(worm, result);
        }
    }
    executeUseItem(worm, action, result) {
        const team = this.teams[worm.teamId];
        if (!team)
            return;
        switch (action.itemType) {
            case 'healthKit':
                if (team.inventory.healthKits > 0) {
                    team.inventory.healthKits--;
                    worm.hp = Math.min(WORM_HP, worm.hp + 30);
                }
                break;
            case 'shield':
                if (team.inventory.shields > 0) {
                    team.inventory.shields--;
                    // Shield gives temporary protection (could be implemented as a status effect)
                    // For now, just heal a bit
                    worm.hp = Math.min(WORM_HP, worm.hp + 20);
                }
                break;
            case 'speedBoost':
                if (team.inventory.speedBoosts > 0) {
                    team.inventory.speedBoosts--;
                    // Speed boost could affect next movement, but for simplicity we'll just skip
                }
                break;
        }
    }
    spawnItem(x, y) {
        const itemTypes = [
            { type: 'healthKit' },
            { type: 'shield' },
            { type: 'speedBoost' },
            { type: 'weapon', weaponId: 'bazooka' },
            { type: 'weapon', weaponId: 'grenade' },
            { type: 'weapon', weaponId: 'shotgun' },
        ];
        const selected = itemTypes[Math.floor(this.rng.next() * itemTypes.length)];
        const item = {
            id: `item-${Date.now()}-${this.rng.int(0, 10000)}`,
            type: selected.type,
            x: Math.round(x),
            y: Math.round(y),
            weaponId: selected.weaponId,
        };
        this.items.push(item);
    }
    checkItemPickup(worm, result) {
        const pickupRadius = WORM_RADIUS + 5;
        const itemsToPickup = [];
        for (const item of this.items) {
            const dx = item.x - worm.x;
            const dy = item.y - worm.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance <= pickupRadius) {
                itemsToPickup.push(item);
            }
        }
        for (const item of itemsToPickup) {
            const team = this.teams[worm.teamId];
            if (!team)
                continue;
            switch (item.type) {
                case 'healthKit':
                    team.inventory.healthKits++;
                    break;
                case 'shield':
                    team.inventory.shields++;
                    break;
                case 'speedBoost':
                    team.inventory.speedBoosts++;
                    break;
                case 'weapon':
                    if (item.weaponId) {
                        team.inventory.weapons[item.weaponId]++;
                    }
                    break;
            }
            // Remove item from map
            const index = this.items.indexOf(item);
            if (index > -1) {
                this.items.splice(index, 1);
            }
            this.matchStats.itemsPicked++;
            if (!result.itemsPicked) {
                result.itemsPicked = [];
            }
            result.itemsPicked.push(item);
        }
    }
    /** Get a full snapshot of the game state. */
    getState() {
        return {
            matchId: this.matchId,
            seed: this.seed,
            mapWidth: MAP_WIDTH,
            mapHeight: MAP_HEIGHT,
            teams: this.teams.map((t) => ({
                ...t,
                inventory: {
                    weapons: { ...t.inventory.weapons },
                    healthKits: t.inventory.healthKits,
                    shields: t.inventory.shields,
                    speedBoosts: t.inventory.speedBoosts,
                }
            })),
            worms: this.worms.map((w) => ({ ...w })),
            turnNumber: this.turnNumber,
            currentTeamIndex: this.currentTeamIndex,
            currentWormIndices: [...this.currentWormIndices],
            wind: this.wind,
            isFinished: this.isFinished,
            winnerId: this.winnerId,
            terrainBase64: this.terrain.toBase64(),
            matchStats: { ...this.matchStats },
            items: this.items.map((i) => ({ ...i })),
        };
    }
    emptyTurnResult(action) {
        return {
            turnNumber: this.turnNumber,
            activeWormId: -1,
            wind: this.wind,
            action,
            trajectoryFrames: [],
            explosions: [],
            wormsAfter: this.worms.map((w) => ({ ...w })),
            terrainDamage: [],
            deaths: [],
            movementFrames: [],
            itemsPicked: [],
        };
    }
}
//# sourceMappingURL=engine.js.map