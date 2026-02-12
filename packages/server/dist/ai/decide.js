// ---------------------------------------------------------------------------
// worms.arena — AI Decision Engine
// ---------------------------------------------------------------------------
import { WEAPONS, WORM_RADIUS, MAP_WIDTH, GRAVITY, PHYSICS_DT, WATER_LEVEL, MAX_MOVE_DISTANCE_PER_TURN, } from '@worms-arena/shared';
/**
 * AI decision: given the current state, pick an action for the active worm.
 */
export function decideAction(activeWorm, allWorms, terrain, wind, agent, rng, inventory) {
    const enemies = allWorms.filter((w) => w.alive && w.teamId !== activeWorm.teamId);
    if (enemies.length === 0) {
        return { type: 'skip' };
    }
    // Check if we should use health kit (low HP)
    if (inventory && inventory.healthKits > 0 && activeWorm.hp < 40 && rng.next() > 0.7) {
        return { type: 'useItem', itemType: 'healthKit' };
    }
    // ----- 1. Score each enemy as a target -----
    const targets = enemies.map((enemy) => {
        const dx = enemy.x - activeWorm.x;
        const dy = enemy.y - activeWorm.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        let score = 0;
        score += (100 - enemy.hp) * 0.5 * agent.aggression;
        score += Math.max(0, 500 - distance) * 0.3;
        score *= 0.5 + agent.aggression * 0.5;
        return { worm: enemy, distance, score };
    });
    targets.sort((a, b) => b.score - a.score);
    const target = targets[0];
    // ----- 2. Decide: shoot, moveTo, or move? -----
    const moveChance = rng.next();
    const shouldMoveTo = moveChance > agent.aggression * 0.6 + agent.riskTolerance * 0.2 &&
        target.distance > 100 &&
        target.distance < 400;
    if (shouldMoveTo) {
        // Choose a strategic position
        const targetPos = chooseTargetPosition(activeWorm, target.worm, terrain, agent, rng);
        if (targetPos) {
            return { type: 'moveTo', targetX: targetPos.x, targetY: targetPos.y };
        }
    }
    const shouldMove = moveChance > agent.aggression * 0.7 + agent.riskTolerance * 0.3 &&
        target.distance < 80 &&
        agent.riskTolerance < 0.4;
    if (shouldMove) {
        const dir = target.worm.x > activeWorm.x ? -1 : 1;
        return { type: 'move', direction: dir };
    }
    // ----- 3. Choose weapon (checking inventory) -----
    const weaponId = chooseWeapon(target.distance, agent, rng, inventory);
    // If no weapon available, try to move or skip
    if (!weaponId) {
        if (target.distance > 200 && rng.next() > 0.5) {
            const targetPos = chooseTargetPosition(activeWorm, target.worm, terrain, agent, rng);
            if (targetPos) {
                return { type: 'moveTo', targetX: targetPos.x, targetY: targetPos.y };
            }
        }
        return { type: 'skip' };
    }
    // ----- 4. Calculate aim using simulation -----
    const { angle, power } = calculateAimBySimulation(activeWorm, target.worm, weaponId, wind, terrain, agent, rng);
    return { type: 'shoot', weaponId, angle, power };
}
function chooseWeapon(distance, agent, rng, inventory) {
    // Get available weapons
    const availableWeapons = [];
    if (!inventory) {
        // Fallback: assume all weapons available
        availableWeapons.push('bazooka', 'grenade', 'shotgun');
    }
    else {
        if (inventory.weapons.bazooka > 0)
            availableWeapons.push('bazooka');
        if (inventory.weapons.grenade > 0)
            availableWeapons.push('grenade');
        if (inventory.weapons.shotgun > 0)
            availableWeapons.push('shotgun');
    }
    if (availableWeapons.length === 0) {
        return null;
    }
    // Choose weapon based on distance and preferences
    let preferred;
    if (distance < 150) {
        preferred = ['shotgun', 'grenade', 'bazooka'];
    }
    else if (distance < 350) {
        if (agent.preferredRange === 'far' || agent.accuracy > 0.8) {
            preferred = ['bazooka', 'grenade'];
        }
        else {
            preferred = ['grenade', 'bazooka'];
        }
    }
    else {
        preferred = ['bazooka', 'grenade'];
    }
    // Filter preferred by availability
    const options = preferred.filter(w => availableWeapons.includes(w));
    if (options.length === 0) {
        return availableWeapons[0];
    }
    // Add some randomness
    if (rng.next() > 0.7 && availableWeapons.length > 1) {
        const otherOptions = availableWeapons.filter(w => !options.includes(w));
        if (otherOptions.length > 0) {
            return otherOptions[Math.floor(rng.next() * otherOptions.length)];
        }
    }
    return options[0];
}
function chooseTargetPosition(worm, target, terrain, agent, rng) {
    const dx = target.x - worm.x;
    const dy = target.y - worm.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    // Try several positions
    const candidates = [];
    for (let i = 0; i < 10; i++) {
        // Generate position within move range
        const angle = (rng.next() - 0.5) * Math.PI * 0.8; // -72 to +72 degrees
        const dist = 30 + rng.next() * (MAX_MOVE_DISTANCE_PER_TURN - 30);
        const candidateX = worm.x + Math.cos(angle) * dist;
        const candidateY = worm.y + Math.sin(angle) * dist;
        // Check bounds
        if (candidateX < WORM_RADIUS || candidateX > MAP_WIDTH - WORM_RADIUS)
            continue;
        if (candidateY < WORM_RADIUS || candidateY > WATER_LEVEL - WORM_RADIUS)
            continue;
        // Check terrain
        const surfaceY = terrain.surfaceY(candidateX);
        if (Math.abs(candidateY - (surfaceY - WORM_RADIUS)) > 20)
            continue;
        // Score position
        const distToTarget = Math.sqrt((candidateX - target.x) ** 2 + (candidateY - target.y) ** 2);
        let score = 0;
        // Prefer positions at good shooting distance
        if (distToTarget > 150 && distToTarget < 350)
            score += 50;
        // Prefer higher ground
        if (candidateY < target.y)
            score += 20;
        // Prefer cover (higher terrain nearby)
        score += 10;
        // Avoid too close
        if (distToTarget < 100)
            score -= 30;
        candidates.push({ x: candidateX, y: surfaceY - WORM_RADIUS, score });
    }
    if (candidates.length === 0)
        return null;
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0];
}
/**
 * Quickly simulate a projectile and return where it lands.
 * Returns the landing position (where it hits terrain, worm, or goes OOB).
 */
function quickSimulate(startX, startY, angle, power, weaponId, wind, terrain) {
    const weapon = WEAPONS[weaponId];
    const speed = weapon.speedMultiplier * power;
    let x = startX;
    let y = startY;
    let vx = Math.cos(angle) * speed;
    let vy = Math.sin(angle) * speed;
    // Skip initial terrain overlap
    let safeSteps = 0;
    while (terrain.isSolid(x, y) && safeSteps < 20) {
        y -= 1;
        safeSteps++;
    }
    const maxSteps = 400;
    for (let step = 0; step < maxSteps; step++) {
        if (weapon.windAffected) {
            vx += wind * 80 * PHYSICS_DT;
        }
        vy += GRAVITY * PHYSICS_DT;
        x += vx * PHYSICS_DT;
        y += vy * PHYSICS_DT;
        // Out of bounds
        if (x < -50 || x > MAP_WIDTH + 50 || y > WATER_LEVEL + 50) {
            return { x, y, hit: false };
        }
        if (y < -200)
            continue;
        // Terrain hit (for impact weapons)
        if (weapon.fuseTime === 0 && terrain.isSolid(x, y)) {
            return { x, y, hit: true };
        }
    }
    return { x, y, hit: false };
}
/**
 * Find the best angle/power by simulating many trajectories and picking
 * the one that lands closest to the target.
 */
function calculateAimBySimulation(shooter, target, weaponId, wind, terrain, agent, rng) {
    const dx = target.x - shooter.x;
    const direction = dx > 0 ? 1 : -1;
    const distance = Math.sqrt(dx * dx + (target.y - shooter.y) ** 2);
    // Start position (slightly in front of worm)
    const launchOffset = WORM_RADIUS + 4;
    let bestAngle = direction > 0 ? -0.5 : Math.PI + 0.5;
    let bestPower = 0.7;
    let bestDist = Infinity;
    // Try a range of angles and power levels
    // Angles: from nearly horizontal to 60° upward
    const angleSteps = 16;
    const powerSteps = 5;
    for (let ai = 0; ai < angleSteps; ai++) {
        // Angle range: 5° to 75° upward from horizontal
        const upAngle = (5 + (70 * ai) / (angleSteps - 1)) * (Math.PI / 180);
        const angle = direction > 0
            ? -upAngle // Right: negative angle = upward
            : Math.PI + upAngle; // Left: PI + up = upward to the left
        for (let pi = 0; pi < powerSteps; pi++) {
            const power = 0.4 + 0.6 * (pi / (powerSteps - 1));
            const startX = shooter.x + Math.cos(angle) * launchOffset;
            const startY = shooter.y + Math.sin(angle) * launchOffset;
            const result = quickSimulate(startX, startY, angle, power, weaponId, wind, terrain);
            const distToTarget = Math.sqrt((result.x - target.x) ** 2 + (result.y - target.y) ** 2);
            if (distToTarget < bestDist) {
                bestDist = distToTarget;
                bestAngle = angle;
                bestPower = power;
            }
        }
    }
    // Apply accuracy noise
    const noiseScale = (1 - agent.accuracy) * 0.2;
    const angleNoise = (rng.next() - 0.5) * 2 * noiseScale;
    const powerNoise = (rng.next() - 0.5) * 2 * noiseScale * 0.15;
    bestAngle += angleNoise;
    bestPower = Math.min(1.0, Math.max(0.3, bestPower + powerNoise));
    return { angle: bestAngle, power: bestPower };
}
//# sourceMappingURL=decide.js.map