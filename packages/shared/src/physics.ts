// ---------------------------------------------------------------------------
// worms.arena — Physics: projectile simulation
// ---------------------------------------------------------------------------

import {
  GRAVITY,
  PHYSICS_DT,
  MAX_PHYSICS_STEPS,
  MAP_WIDTH,
  MAP_HEIGHT,
  WATER_LEVEL,
  WORM_RADIUS,
} from './constants';
import { WEAPONS } from './weapons';
import type { Projectile, Explosion, Worm, WeaponId, Wind } from './types';
import { Terrain } from './terrain';

export interface ProjectileResult {
  /** Position frames for animation */
  frames: Array<{ x: number; y: number }>;
  /** Where it exploded (null if it left the map) */
  explosion: Explosion | null;
}

/**
 * Simulate a single projectile until it hits terrain, a worm, or leaves the map.
 */
export function simulateProjectile(
  startX: number,
  startY: number,
  vx: number,
  vy: number,
  weaponId: WeaponId,
  wind: Wind,
  terrain: Terrain,
  worms: Worm[],
): ProjectileResult {
  const weapon = WEAPONS[weaponId];
  const frames: Array<{ x: number; y: number }> = [];

  let x = startX;
  let y = startY;
  let cvx = vx;
  let cvy = vy;
  let fuse = weapon.fuseTime;
  let exploded = false;
  let explosion: Explosion | null = null;

  // If starting inside terrain, nudge upward until free
  let safetyCount = 0;
  while (terrain.isSolid(x, y) && safetyCount < 20) {
    y -= 1;
    safetyCount++;
  }

  for (let step = 0; step < MAX_PHYSICS_STEPS; step++) {
    // Apply wind (if applicable)
    if (weapon.windAffected) {
      cvx += wind * 80 * PHYSICS_DT;
    }
    // Apply gravity
    cvy += GRAVITY * PHYSICS_DT;

    // Move
    x += cvx * PHYSICS_DT;
    y += cvy * PHYSICS_DT;

    // Record frame (every 2nd step for lighter payloads)
    if (step % 2 === 0) {
      frames.push({ x: Math.round(x), y: Math.round(y) });
    }

    // Fuse countdown
    if (weapon.fuseTime > 0) {
      fuse -= PHYSICS_DT;
      if (fuse <= 0) {
        explosion = { x, y, radius: weapon.radius, damage: weapon.damage };
        exploded = true;
        break;
      }
    }

    // Out of bounds check
    if (x < -50 || x > MAP_WIDTH + 50 || y > WATER_LEVEL + 50) {
      break;
    }
    // Above the map is fine (projectile going up)
    if (y < -200) continue;

    // Terrain collision (only for impact-detonation weapons or bouncing)
    if (weapon.fuseTime === 0 && terrain.isSolid(x, y)) {
      explosion = { x, y, radius: weapon.radius, damage: weapon.damage };
      exploded = true;
      break;
    }

    // Grenade bounces off terrain
    if (weapon.fuseTime > 0 && terrain.isSolid(x, y)) {
      // Simple bounce: reverse velocity component, lose energy
      // Check which direction we came from
      const prevX = x - cvx * PHYSICS_DT;
      const prevY = y - cvy * PHYSICS_DT;

      if (terrain.isSolid(x, prevY) && !terrain.isSolid(prevX, y)) {
        cvx = -cvx * 0.5;
        x = prevX;
      } else if (!terrain.isSolid(x, prevY) && terrain.isSolid(prevX, y)) {
        cvy = -cvy * 0.5;
        y = prevY;
      } else {
        cvx = -cvx * 0.4;
        cvy = -cvy * 0.4;
        x = prevX;
        y = prevY;
      }
    }

    // Worm collision (for impact-detonation weapons)
    if (weapon.fuseTime === 0) {
      for (const worm of worms) {
        if (!worm.alive) continue;
        const dx = x - worm.x;
        const dy = y - worm.y;
        if (dx * dx + dy * dy <= WORM_RADIUS * WORM_RADIUS) {
          explosion = { x: worm.x, y: worm.y, radius: weapon.radius, damage: weapon.damage };
          exploded = true;
          break;
        }
      }
      if (exploded) break;
    }
  }

  // Always include final position
  if (frames.length === 0 || (frames[frames.length - 1].x !== Math.round(x) || frames[frames.length - 1].y !== Math.round(y))) {
    frames.push({ x: Math.round(x), y: Math.round(y) });
  }

  return { frames, explosion };
}

/**
 * Apply explosion: destroy terrain and damage worms.
 * Returns list of damaged worm ids.
 */
export function applyExplosion(
  explosion: Explosion,
  terrain: Terrain,
  worms: Worm[],
): { damagedWorms: Array<{ id: number; damage: number }> } {
  // Destroy terrain
  terrain.destroyCircle(explosion.x, explosion.y, explosion.radius);

  // Damage worms in blast radius
  const damagedWorms: Array<{ id: number; damage: number }> = [];
  for (const worm of worms) {
    if (!worm.alive) continue;
    const dx = explosion.x - worm.x;
    const dy = explosion.y - worm.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist <= explosion.radius) {
      // Linear falloff: full damage at center, 0 at edge
      const factor = 1 - dist / explosion.radius;
      const dmg = Math.round(explosion.damage * factor);
      if (dmg > 0) {
        worm.hp = Math.max(0, worm.hp - dmg);
        if (worm.hp <= 0) {
          worm.alive = false;
        }
        damagedWorms.push({ id: worm.id, damage: dmg });
      }
    }
  }

  return { damagedWorms };
}

/**
 * Apply gravity to all worms: drop them and apply fall damage.
 */
export function applyWormGravity(
  terrain: Terrain,
  worms: Worm[],
): { deaths: number[] } {
  const deaths: number[] = [];
  for (const worm of worms) {
    if (!worm.alive) continue;
    const { y: newY, fallDistance } = terrain.dropWorm(worm.x, worm.y, WORM_RADIUS);
    worm.y = newY;

    // Check water death
    if (worm.y >= WATER_LEVEL) {
      worm.alive = false;
      worm.hp = 0;
      deaths.push(worm.id);
      continue;
    }

    // Fall damage
    if (fallDistance > 40) {
      const dmg = Math.round((fallDistance - 40) * 0.8);
      worm.hp = Math.max(0, worm.hp - dmg);
      if (worm.hp <= 0) {
        worm.alive = false;
        deaths.push(worm.id);
      }
    }
  }
  return { deaths };
}
