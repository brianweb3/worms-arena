// ---------------------------------------------------------------------------
// worms.arena — Projectile & Explosion Renderer
// ---------------------------------------------------------------------------

import type { Explosion } from '@worms-arena/shared';

/**
 * Draw projectile at current animation frame.
 */
export function drawProjectile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
): void {
  // Projectile body
  ctx.beginPath();
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#ff4444';
  ctx.fill();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Glow
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 100, 0, 0.3)';
  ctx.fill();
}

/**
 * Draw projectile trail (fading dots).
 */
export function drawTrail(
  ctx: CanvasRenderingContext2D,
  frames: Array<{ x: number; y: number }>,
  currentFrame: number,
): void {
  const trailLength = Math.min(20, currentFrame);
  const startFrame = Math.max(0, currentFrame - trailLength);

  for (let i = startFrame; i < currentFrame; i++) {
    const f = frames[i];
    if (!f) continue;
    const alpha = (i - startFrame) / trailLength;
    ctx.beginPath();
    ctx.arc(f.x, f.y, 1.5 * alpha, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 150, 50, ${alpha * 0.6})`;
    ctx.fill();
  }
}

/**
 * Draw an explosion animation.
 * progress: 0 (start) to 1 (end).
 */
export function drawExplosion(
  ctx: CanvasRenderingContext2D,
  explosion: Explosion,
  progress: number,
): void {
  const maxR = explosion.radius * 1.2;
  const r = maxR * Math.min(1, progress * 2);
  const alpha = Math.max(0, 1 - progress);

  // Outer glow
  const gradient = ctx.createRadialGradient(
    explosion.x, explosion.y, 0,
    explosion.x, explosion.y, r,
  );
  gradient.addColorStop(0, `rgba(255, 255, 200, ${alpha})`);
  gradient.addColorStop(0.3, `rgba(255, 180, 50, ${alpha * 0.8})`);
  gradient.addColorStop(0.7, `rgba(255, 80, 0, ${alpha * 0.5})`);
  gradient.addColorStop(1, `rgba(100, 20, 0, 0)`);

  ctx.beginPath();
  ctx.arc(explosion.x, explosion.y, r, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Sparks
  if (progress < 0.5) {
    const sparkCount = 8;
    for (let s = 0; s < sparkCount; s++) {
      const angle = (s / sparkCount) * Math.PI * 2 + progress * 3;
      const dist = r * (0.5 + progress);
      const sx = explosion.x + Math.cos(angle) * dist;
      const sy = explosion.y + Math.sin(angle) * dist;
      ctx.beginPath();
      ctx.arc(sx, sy, 2 * (1 - progress * 2), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 100, ${alpha})`;
      ctx.fill();
    }
  }
}
