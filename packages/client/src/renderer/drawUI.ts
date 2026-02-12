// ---------------------------------------------------------------------------
// worms.arena — HUD Renderer (Modern style)
// ---------------------------------------------------------------------------

import type { Team, Worm, Wind, TurnAction } from '@worms-arena/shared';
import { WEAPONS, MATCH_TIME_LIMIT } from '@worms-arena/shared';

/**
 * Draw the in-game HUD: wind indicator, turn info, team scores.
 */
export function drawHUD(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  _canvasHeight: number,
  teams: Team[],
  worms: Worm[],
  wind: Wind,
  turnNumber: number,
  activeWormId: number | null,
  currentAction: TurnAction | null,
  startedAt: number | null,
): void {
  ctx.save();

  // ---- Wind indicator (top center) ----
  const windX = canvasWidth / 2;
  const windY = 20;
  const windBarWidth = 100;

  // Wind label with backdrop
  ctx.font = '600 11px "DM Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(windX - 30, windY - 16, 60, 14);
  ctx.fillStyle = '#fff';
  ctx.fillText('WIND', windX, windY - 4);

  // Wind bar background with rounded corners effect
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.fillRect(windX - windBarWidth / 2, windY, windBarWidth, 8);

  // Wind bar fill
  const windPixels = wind * (windBarWidth / 2);
  if (wind > 0) {
    ctx.fillStyle = '#3498db';
    ctx.fillRect(windX, windY, windPixels, 8);
  } else {
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(windX + windPixels, windY, -windPixels, 8);
  }

  // Center mark
  ctx.fillStyle = '#fff';
  ctx.fillRect(windX - 1, windY - 1, 2, 10);

  // ---- Turn number and Timer (top left) ----
  ctx.font = '600 12px "DM Mono", monospace';
  ctx.textAlign = 'left';
  
  const turnText = `Turn ${turnNumber}`;
  const turnWidth = ctx.measureText(turnText).width + 16;
  
  let timerText = '';
  let timerWidth = 0;
  if (startedAt !== null) {
    const elapsed = Date.now() - startedAt;
    const remaining = Math.max(0, MATCH_TIME_LIMIT - elapsed);
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    timerText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    timerWidth = ctx.measureText(timerText).width + 16;
  }
  
  const totalWidth = turnWidth + (timerWidth > 0 ? timerWidth + 8 : 0);
  
  // Background for both
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(8, 4, totalWidth, 16);
  
  // Turn number
  ctx.fillStyle = '#fff';
  ctx.fillText(turnText, 12, 16);
  
  // Timer (right of turn number)
  if (timerText) {
    const elapsed = Date.now() - (startedAt ?? 0);
    const remaining = Math.max(0, MATCH_TIME_LIMIT - elapsed);
    ctx.font = '600 12px "DM Mono", monospace';
    ctx.fillStyle = remaining < 30000 ? '#e74c3c' : '#fff'; // Red if less than 30 seconds
    ctx.fillText(timerText, 12 + turnWidth + 4, 16);
  }

  // ---- Team scores (top corners) ----
  for (let t = 0; t < teams.length; t++) {
    const team = teams[t];
    const teamWorms = worms.filter((w) => w.teamId === team.id);
    const aliveCount = teamWorms.filter((w) => w.alive).length;
    const totalHp = teamWorms.reduce((s, w) => s + (w.alive ? w.hp : 0), 0);

    const x = t === 0 ? 8 : canvasWidth - 8;
    const y = 40;
    ctx.textAlign = t === 0 ? 'left' : 'right';
    
    // Team name backdrop
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    const nameWidth = ctx.measureText(team.name).width + 16;
    ctx.fillRect(t === 0 ? x : x - nameWidth, y - 12, nameWidth, 14);
    
    ctx.font = '600 12px "DM Mono", monospace';
    ctx.fillStyle = team.color;
    ctx.fillText(`${team.name}`, t === 0 ? x + 8 : x - 8, y);

    // Stats backdrop
    const statsText = `${aliveCount} alive | ${totalHp} HP`;
    const statsWidth = ctx.measureText(statsText).width + 16;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(t === 0 ? x : x - statsWidth, y + 4, statsWidth, 14);
    
    ctx.font = '500 10px "DM Mono", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText(statsText, t === 0 ? x + 8 : x - 8, y + 16);
  }

  // ---- Active worm label ----
  if (activeWormId !== null) {
    const activeWorm = worms.find((w) => w.id === activeWormId);
    if (activeWorm) {
      const team = teams.find((t) => t.id === activeWorm.teamId);
      ctx.textAlign = 'center';
      const label = `${activeWorm.name}'s turn`;
      ctx.font = '600 12px "DM Mono", monospace';
      const labelWidth = ctx.measureText(label).width + 20;
      
      // Backdrop
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(windX - labelWidth / 2, windY + 16, labelWidth, 16);
      
      ctx.fillStyle = team?.color ?? '#fff';
      ctx.fillText(label, windX, windY + 28);

      // ---- Weapon display ----
      if (currentAction && currentAction.type === 'shoot' && currentAction.weaponId) {
        try {
          const weapon = WEAPONS?.[currentAction.weaponId];
          if (weapon && weapon.name) {
            const weaponText = `uses ${weapon.name}`;
            ctx.font = '500 11px "DM Mono", monospace';
            const weaponWidth = ctx.measureText(weaponText).width + 20;
            
            // Backdrop
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(windX - weaponWidth / 2, windY + 36, weaponWidth, 16);
            
            ctx.fillStyle = team?.color ?? '#fff';
            ctx.fillText(weaponText, windX, windY + 48);
          }
        } catch (err) {
          // Silently ignore weapon display errors
        }
      }
    }
  }

  ctx.restore();
}
