// ---------------------------------------------------------------------------
// worms.arena — Seeded PRNG (mulberry32)
// ---------------------------------------------------------------------------
/**
 * Seeded pseudo-random number generator.
 * Deterministic: same seed → same sequence.
 */
export class SeededRNG {
    state;
    constructor(seed) {
        this.state = seed | 0;
    }
    /** Returns a float in [0, 1) */
    next() {
        this.state |= 0;
        this.state = (this.state + 0x6d2b79f5) | 0;
        let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    /** Returns a float in [min, max) */
    range(min, max) {
        return min + this.next() * (max - min);
    }
    /** Returns an integer in [min, max] (inclusive) */
    int(min, max) {
        return Math.floor(this.range(min, max + 1));
    }
}
//# sourceMappingURL=rng.js.map