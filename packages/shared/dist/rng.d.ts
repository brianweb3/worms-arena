/**
 * Seeded pseudo-random number generator.
 * Deterministic: same seed → same sequence.
 */
export declare class SeededRNG {
    private state;
    constructor(seed: number);
    /** Returns a float in [0, 1) */
    next(): number;
    /** Returns a float in [min, max) */
    range(min: number, max: number): number;
    /** Returns an integer in [min, max] (inclusive) */
    int(min: number, max: number): number;
}
//# sourceMappingURL=rng.d.ts.map