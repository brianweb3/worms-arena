// ---------------------------------------------------------------------------
// worms.arena — Worm Renderer
// ---------------------------------------------------------------------------

import type { Worm, Team } from '@worms-arena/shared';
import { WORM_RADIUS } from '@worms-arena/shared';

/**
 * Draw all worms on the canvas.
 */
export function drawWorms(
  ctx: CanvasRenderingContext2D,
  worms: Worm[],
  teams: Team[],
  activeWormId: number | null,
): void {
  for (const worm of worms) {
    if (!worm.alive) continue;
    const team = teams.find((t) => t.id === worm.teamId);
    const color = team?.color ?? '#fff';
    const isActive = worm.id === activeWormId;

    // Body (circle)
    ctx.beginPath();
    ctx.arc(worm.x, worm.y, WORM_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = isActive ? '#fff' : '#000';
    ctx.lineWidth = isActive ? 2.5 : 1;
    ctx.stroke();

    // Eyes
    const eyeOffsetX = worm.facing * 3;
    ctx.beginPath();
    ctx.arc(worm.x + eyeOffsetX, worm.y - 2, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(worm.x + eyeOffsetX + worm.facing * 0.5, worm.y - 2, 1, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();

    // Name label above worm
    ctx.font = 'bold 9px "MS Sans Serif", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeText(worm.name, worm.x, worm.y - WORM_RADIUS - 12);
    ctx.fillText(worm.name, worm.x, worm.y - WORM_RADIUS - 12);

    // HP bar
    const barWidth = 24;
    const barHeight = 3;
    const barX = worm.x - barWidth / 2;
    const barY = worm.y - WORM_RADIUS - 8;
    const hpRatio = worm.hp / 100;

    // Background
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    // Health fill
    ctx.fillStyle = hpRatio > 0.5 ? '#2ecc71' : hpRatio > 0.25 ? '#f39c12' : '#e74c3c';
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
    // Border
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Active indicator (arrow above)
    if (isActive) {
      ctx.beginPath();
      ctx.moveTo(worm.x, worm.y - WORM_RADIUS - 22);
      ctx.lineTo(worm.x - 4, worm.y - WORM_RADIUS - 28);
      ctx.lineTo(worm.x + 4, worm.y - WORM_RADIUS - 28);
      ctx.closePath();
      ctx.fillStyle = '#ffff00';
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}
