import type { Explosion, Worm, WeaponId, Wind } from './types';
import { Terrain } from './terrain';
export interface ProjectileResult {
    /** Position frames for animation */
    frames: Array<{
        x: number;
        y: number;
    }>;
    /** Where it exploded (null if it left the map) */
    explosion: Explosion | null;
}
/**
 * Simulate a single projectile until it hits terrain, a worm, or leaves the map.
 */
export declare function simulateProjectile(startX: number, startY: number, vx: number, vy: number, weaponId: WeaponId, wind: Wind, terrain: Terrain, worms: Worm[]): ProjectileResult;
/**
 * Apply explosion: destroy terrain and damage worms.
 * Returns list of damaged worm ids.
 */
export declare function applyExplosion(explosion: Explosion, terrain: Terrain, worms: Worm[]): {
    damagedWorms: Array<{
        id: number;
        damage: number;
    }>;
};
/**
 * Apply gravity to all worms: drop them and apply fall damage.
 */
export declare function applyWormGravity(terrain: Terrain, worms: Worm[]): {
    deaths: number[];
};
//# sourceMappingURL=physics.d.ts.map