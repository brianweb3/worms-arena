// ---------------------------------------------------------------------------
// worms.arena — Terrain Renderer
// ---------------------------------------------------------------------------

import { WATER_LEVEL } from '@worms-arena/shared';

const GROUND_COLOR = { r: 100, g: 70, b: 40 };
const GROUND_TOP_COLOR = { r: 60, g: 160, b: 60 };
const SKY_TOP = { r: 40, g: 40, b: 80 };
const SKY_BOTTOM = { r: 100, g: 120, b: 180 };
const WATER_COLOR = { r: 30, g: 80, b: 180, a: 180 };

/**
 * Draw the terrain to an offscreen ImageData buffer.
 * Returns ImageData that can be put to canvas.
 */
export function renderTerrainToImageData(
  terrainData: Uint8Array,
  width: number,
  height: number,
): ImageData {
  const imageData = new ImageData(width, height);
  const pixels = imageData.data;

  for (let y = 0; y < height; y++) {
    const skyT = y / height;
    const skyR = Math.floor(SKY_TOP.r + (SKY_BOTTOM.r - SKY_TOP.r) * skyT);
    const skyG = Math.floor(SKY_TOP.g + (SKY_BOTTOM.g - SKY_TOP.g) * skyT);
    const skyB = Math.floor(SKY_TOP.b + (SKY_BOTTOM.b - SKY_TOP.b) * skyT);

    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const tIdx = y * width + x;

      if (terrainData[tIdx] === 1) {
        // Check if top surface (pixel above is air)
        const isTop = y === 0 || terrainData[(y - 1) * width + x] === 0;
        const isNearTop = y > 0 && y < height - 1 &&
          (terrainData[(y - 1) * width + x] === 0 ||
           terrainData[(y - 2) * width + x] === 0);

        if (isTop || isNearTop) {
          // Grass layer
          pixels[idx] = GROUND_TOP_COLOR.r;
          pixels[idx + 1] = GROUND_TOP_COLOR.g;
          pixels[idx + 2] = GROUND_TOP_COLOR.b;
        } else {
          // Dirt with slight variation
          const noise = ((x * 7 + y * 13) % 20) - 10;
          pixels[idx] = Math.max(0, Math.min(255, GROUND_COLOR.r + noise));
          pixels[idx + 1] = Math.max(0, Math.min(255, GROUND_COLOR.g + noise));
          pixels[idx + 2] = Math.max(0, Math.min(255, GROUND_COLOR.b + noise));
        }
        pixels[idx + 3] = 255;
      } else if (y >= WATER_LEVEL) {
        // Water
        pixels[idx] = WATER_COLOR.r;
        pixels[idx + 1] = WATER_COLOR.g;
        pixels[idx + 2] = WATER_COLOR.b;
        pixels[idx + 3] = WATER_COLOR.a;
      } else {
        // Sky
        pixels[idx] = skyR;
        pixels[idx + 1] = skyG;
        pixels[idx + 2] = skyB;
        pixels[idx + 3] = 255;
      }
    }
  }

  return imageData;
}

/**
 * Apply terrain destruction to existing ImageData.
 */
export function applyTerrainDamageToImage(
  imageData: ImageData,
  damage: Array<{ x: number; y: number; radius: number }>,
  height: number,
): void {
  const pixels = imageData.data;
  const width = imageData.width;

  for (const d of damage) {
    const r = Math.ceil(d.radius);
    const r2 = d.radius * d.radius;
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy <= r2) {
          const px = Math.floor(d.x) + dx;
          const py = Math.floor(d.y) + dy;
          if (px >= 0 && px < width && py >= 0 && py < height) {
            const idx = (py * width + px) * 4;
            if (py >= WATER_LEVEL) {
              pixels[idx] = 30;
              pixels[idx + 1] = 80;
              pixels[idx + 2] = 180;
              pixels[idx + 3] = 180;
            } else {
              // Sky gradient
              const skyT = py / height;
              pixels[idx] = Math.floor(SKY_TOP.r + (SKY_BOTTOM.r - SKY_TOP.r) * skyT);
              pixels[idx + 1] = Math.floor(SKY_TOP.g + (SKY_BOTTOM.g - SKY_TOP.g) * skyT);
              pixels[idx + 2] = Math.floor(SKY_TOP.b + (SKY_BOTTOM.b - SKY_TOP.b) * skyT);
              pixels[idx + 3] = 255;
            }
          }
        }
      }
    }
  }
}
