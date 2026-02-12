import { SeededRNG } from './rng';
/**
 * Pixel-based terrain map.
 * Each byte: 0 = air, 1 = solid ground.
 */
export declare class Terrain {
    readonly width: number;
    readonly height: number;
    readonly data: Uint8Array;
    constructor(width?: number, height?: number, data?: Uint8Array);
    /** Get pixel value at (x, y). Out-of-bounds → 0 (air). */
    get(x: number, y: number): number;
    /** Set pixel value at (x, y). */
    set(x: number, y: number, value: number): void;
    /** Check if (x, y) is solid. */
    isSolid(x: number, y: number): boolean;
    /** Destroy terrain in a circle. Returns number of pixels destroyed. */
    destroyCircle(cx: number, cy: number, radius: number): number;
    /**
     * Find the y-coordinate of the surface at a given x.
     * Scans top-to-bottom and returns the y of the first solid pixel.
     * Returns height (below map) if no solid pixel found.
     */
    surfaceY(x: number): number;
    /**
     * Drop a worm down from (x, startY) until it lands on solid ground or falls
     * into water. Returns the new y and the fall distance.
     */
    dropWorm(x: number, startY: number, wormRadius: number): {
        y: number;
        fallDistance: number;
    };
    /** Clone this terrain. */
    clone(): Terrain;
    /** Encode terrain data to base64. */
    toBase64(): string;
    /** Decode terrain from base64. */
    static fromBase64(encoded: string, width: number, height: number): Terrain;
}
/** Generate a random terrain map. */
export declare function generateTerrain(rng: SeededRNG, width?: number, height?: number): Terrain;
//# sourceMappingURL=terrain.d.ts.map