// ---------------------------------------------------------------------------
// worms.arena — Terrain generation & destruction
// ---------------------------------------------------------------------------

import { MAP_WIDTH, MAP_HEIGHT, WATER_LEVEL } from './constants.js';
import { SeededRNG } from './rng.js';

/**
 * Pixel-based terrain map.
 * Each byte: 0 = air, 1 = solid ground.
 */
export class Terrain {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8Array;

  constructor(width: number = MAP_WIDTH, height: number = MAP_HEIGHT, data?: Uint8Array) {
    this.width = width;
    this.height = height;
    this.data = data ?? new Uint8Array(width * height);
  }

  /** Get pixel value at (x, y). Out-of-bounds → 0 (air). */
  get(x: number, y: number): number {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (ix < 0 || ix >= this.width || iy < 0 || iy >= this.height) return 0;
    return this.data[iy * this.width + ix];
  }

  /** Set pixel value at (x, y). */
  set(x: number, y: number, value: number): void {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    if (ix < 0 || ix >= this.width || iy < 0 || iy >= this.height) return;
    this.data[iy * this.width + ix] = value;
  }

  /** Check if (x, y) is solid. */
  isSolid(x: number, y: number): boolean {
    return this.get(x, y) === 1;
  }

  /** Destroy terrain in a circle. Returns number of pixels destroyed. */
  destroyCircle(cx: number, cy: number, radius: number): number {
    const r = Math.ceil(radius);
    const r2 = radius * radius;
    let destroyed = 0;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= r2) {
          const px = Math.floor(cx) + dx;
          const py = Math.floor(cy) + dy;
          if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
            const idx = py * this.width + px;
            if (this.data[idx] === 1) {
              this.data[idx] = 0;
              destroyed++;
            }
          }
        }
      }
    }
    return destroyed;
  }

  /**
   * Find the y-coordinate of the surface at a given x.
   * Scans top-to-bottom and returns the y of the first solid pixel.
   * Returns height (below map) if no solid pixel found.
   */
  surfaceY(x: number): number {
    const ix = Math.floor(x);
    if (ix < 0 || ix >= this.width) return this.height;
    for (let y = 0; y < this.height; y++) {
      if (this.data[y * this.width + ix] === 1) {
        return y;
      }
    }
    return this.height;
  }

  /**
   * Drop a worm down from (x, startY) until it lands on solid ground or falls
   * into water. Returns the new y and the fall distance.
   */
  dropWorm(x: number, startY: number, wormRadius: number): { y: number; fallDistance: number } {
    let y = startY;
    const startYFloor = Math.floor(startY);
    // Move down until standing on solid ground or out of map
    while (y < WATER_LEVEL) {
      // Check if the pixel below the worm's feet is solid
      if (this.isSolid(x, y + wormRadius + 1)) {
        break;
      }
      y++;
    }
    return { y, fallDistance: Math.max(0, y - startYFloor) };
  }

  /** Clone this terrain. */
  clone(): Terrain {
    return new Terrain(this.width, this.height, new Uint8Array(this.data));
  }

  /** Encode terrain data to base64. */
  toBase64(): string {
    // Simple RLE compression before base64
    const bytes: number[] = [];
    let i = 0;
    while (i < this.data.length) {
      const val = this.data[i];
      let count = 1;
      while (i + count < this.data.length && this.data[i + count] === val && count < 255) {
        count++;
      }
      bytes.push(val, count);
      i += count;
    }
    // Convert to base64 using Buffer (node) or btoa (browser)
    const u8 = new Uint8Array(bytes);
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(u8).toString('base64');
    }
    let binary = '';
    for (let j = 0; j < u8.length; j++) {
      binary += String.fromCharCode(u8[j]);
    }
    return btoa(binary);
  }

  /** Decode terrain from base64. */
  static fromBase64(encoded: string, width: number, height: number): Terrain {
    let u8: Uint8Array;
    if (typeof Buffer !== 'undefined') {
      u8 = new Uint8Array(Buffer.from(encoded, 'base64'));
    } else {
      const binary = atob(encoded);
      u8 = new Uint8Array(binary.length);
      for (let j = 0; j < binary.length; j++) {
        u8[j] = binary.charCodeAt(j);
      }
    }
    // RLE decode
    const data = new Uint8Array(width * height);
    let pos = 0;
    for (let j = 0; j < u8.length; j += 2) {
      const val = u8[j];
      const count = u8[j + 1];
      for (let k = 0; k < count && pos < data.length; k++) {
        data[pos++] = val;
      }
    }
    return new Terrain(width, height, data);
  }
}

// ---------------------------------------------------------------------------
// Terrain generation (simple Perlin-ish noise)
// ---------------------------------------------------------------------------

/** Generate a random terrain map. */
export function generateTerrain(rng: SeededRNG, width: number = MAP_WIDTH, height: number = MAP_HEIGHT): Terrain {
  const terrain = new Terrain(width, height);

  // Generate height map using layered sine waves (cheap "noise")
  const heightMap = new Float64Array(width);

  // Base height: terrain occupies roughly the bottom 40-60% of the map
  const baseHeight = height * 0.45;

  // Several octaves of randomised sine waves
  const octaves = 5;
  const amplitudes: number[] = [];
  const frequencies: number[] = [];
  const phases: number[] = [];

  for (let o = 0; o < octaves; o++) {
    amplitudes.push(rng.range(30, 80) / (o + 1));
    frequencies.push(rng.range(0.002, 0.008) * (o + 1));
    phases.push(rng.range(0, Math.PI * 2));
  }

  for (let x = 0; x < width; x++) {
    let h = baseHeight;
    for (let o = 0; o < octaves; o++) {
      h += amplitudes[o] * Math.sin(x * frequencies[o] + phases[o]);
    }
    // Clamp
    heightMap[x] = Math.max(60, Math.min(height - 40, h));
  }

  // Fill terrain: everything from surfaceY down to WATER_LEVEL is solid
  for (let x = 0; x < width; x++) {
    const surfY = Math.floor(height - heightMap[x]);
    for (let y = surfY; y < WATER_LEVEL; y++) {
      terrain.set(x, y, 1);
    }
  }

  // Carve some random caves / holes for variety
  const caveCount = rng.int(2, 5);
  for (let c = 0; c < caveCount; c++) {
    const cx = rng.int(100, width - 100);
    const cy = rng.int(Math.floor(height * 0.5), WATER_LEVEL - 30);
    const cr = rng.int(15, 40);
    terrain.destroyCircle(cx, cy, cr);
  }

  return terrain;
}
