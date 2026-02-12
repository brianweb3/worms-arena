// ---------------------------------------------------------------------------
// worms.arena — Main Game Canvas Component
// ---------------------------------------------------------------------------

import { useRef, useEffect, useCallback, useState } from 'react';
import type { GameState, Team, Worm, Explosion } from '@worms-arena/shared';
import { Terrain, MAP_WIDTH, MAP_HEIGHT } from '@worms-arena/shared';
import { renderTerrainToImageData, applyTerrainDamageToImage } from './drawTerrain';
import { drawWorms } from './drawWorms';
import { drawProjectile, drawTrail, drawExplosion } from './drawProjectile';
import { drawHUD } from './drawUI';
import type { MatchData } from '../hooks/useGameSocket';

interface Props {
  gameData: MatchData;
}

export default function GameCanvas({ gameData }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const terrainImageRef = useRef<ImageData | null>(null);
  const terrainCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const projectileFrameRef = useRef<number>(0);
  const movementFrameRef = useRef<number>(0);
  const explosionStartRef = useRef<number>(0);
  const healthKitImageRef = useRef<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);

  // Preload health kit image
  useEffect(() => {
    const img = new Image();
    img.src = '/assets/item-health-kit.png';
    img.onload = () => {
      healthKitImageRef.current = img;
    };
  }, []);

  const {
    state,
    worms,
    wind,
    turnNumber,
    activeWormId,
    currentAction,
    projectileFrames,
    movementFrames,
    movingWormId,
    explosions,
    terrainDamage,
    matchOver,
    winnerId,
    startedAt,
  } = gameData;

  // Initialize terrain when match starts
  useEffect(() => {
    if (!state?.terrainBase64) return;

    const terrain = Terrain.fromBase64(state.terrainBase64, state.mapWidth, state.mapHeight);
    const imageData = renderTerrainToImageData(terrain.data, state.mapWidth, state.mapHeight);
    terrainImageRef.current = imageData;

    // Create offscreen canvas for terrain
    const offscreen = document.createElement('canvas');
    offscreen.width = state.mapWidth;
    offscreen.height = state.mapHeight;
    const offCtx = offscreen.getContext('2d')!;
    offCtx.putImageData(imageData, 0, 0);
    terrainCanvasRef.current = offscreen;
  }, [state?.matchId, state?.terrainBase64]);

  // Apply terrain damage
  useEffect(() => {
    if (terrainDamage.length === 0) return;
    const terrainImage = terrainImageRef.current;
    const offscreen = terrainCanvasRef.current;
    if (!terrainImage || !offscreen) return;

    applyTerrainDamageToImage(terrainImage, terrainDamage, state?.mapHeight ?? MAP_HEIGHT);
    const offCtx = offscreen.getContext('2d')!;
    offCtx.putImageData(terrainImage, 0, 0);
  }, [terrainDamage]);

  // Start projectile animation
  useEffect(() => {
    projectileFrameRef.current = 0;
  }, [projectileFrames]);

  // Start movement animation
  useEffect(() => {
    movementFrameRef.current = 0;
  }, [movementFrames]);

  // Explosion timer
  useEffect(() => {
    if (explosions.length > 0) {
      explosionStartRef.current = performance.now();
    }
  }, [explosions]);

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let running = true;

    function render() {
      if (!running) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d')!;

      const cw = canvas.width;
      const ch = canvas.height;

      // Calculate scale to fit
      const scaleX = cw / MAP_WIDTH;
      const scaleY = ch / MAP_HEIGHT;
      const s = Math.min(scaleX, scaleY);

      ctx.clearRect(0, 0, cw, ch);
      ctx.save();

      // Center the game
      const offsetX = (cw - MAP_WIDTH * s) / 2;
      const offsetY = (ch - MAP_HEIGHT * s) / 2;
      ctx.translate(offsetX, offsetY);
      ctx.scale(s, s);

      // Draw terrain
      if (terrainCanvasRef.current) {
        ctx.drawImage(terrainCanvasRef.current, 0, 0);
      } else {
        // Fallback: draw sky
        ctx.fillStyle = '#2a3050';
        ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
      }

      // Draw items
      const items = state?.items ?? [];
      for (const item of items) {
        if (item.type === 'healthKit' && healthKitImageRef.current) {
          // Draw health kit icon
          ctx.drawImage(healthKitImageRef.current, item.x - 8, item.y - 8, 16, 16);
        } else {
          // Fallback circles for items
          ctx.fillStyle = item.type === 'healthKit' ? '#4CAF50' :
                         item.type === 'shield' ? '#2196F3' :
                         item.type === 'speedBoost' ? '#FF9800' : '#9E9E9E';
          ctx.beginPath();
          ctx.arc(item.x, item.y, item.type === 'healthKit' ? 8 : 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Draw worms (with movement animation if applicable)
      const teams = state?.teams ?? [];
      let wormsToDraw = worms;
      
      // If there's a moving worm, interpolate its position
      if (movementFrames && movementFrames.length > 0 && movingWormId !== null) {
        const frameIdx = Math.min(movementFrameRef.current, movementFrames.length - 1);
        const frame = movementFrames[frameIdx];
        if (frame) {
          wormsToDraw = worms.map(w => 
            w.id === movingWormId 
              ? { ...w, x: frame.x, y: frame.y }
              : w
          );
          if (movementFrameRef.current < movementFrames.length) {
            movementFrameRef.current += 1;
          }
        }
      }
      
      drawWorms(ctx, wormsToDraw, teams, activeWormId);

      // Animate projectile
      if (projectileFrames.length > 0) {
        const frameIdx = Math.min(
          projectileFrameRef.current,
          projectileFrames.length - 1,
        );
        const frame = projectileFrames[frameIdx];
        if (frame) {
          drawTrail(ctx, projectileFrames, frameIdx);
          drawProjectile(ctx, frame.x, frame.y);
        }
        if (projectileFrameRef.current < projectileFrames.length) {
          projectileFrameRef.current += 2; // advance 2 frames per render
        }
      }

      // Draw explosions
      if (explosions.length > 0) {
        const elapsed = (performance.now() - explosionStartRef.current) / 1000;
        const duration = 0.6;
        const progress = Math.min(1, elapsed / duration);
        for (const exp of explosions) {
          drawExplosion(ctx, exp, progress);
        }
      }

      // HUD
      try {
        drawHUD(ctx, MAP_WIDTH, MAP_HEIGHT, teams, worms, wind, turnNumber, activeWormId, currentAction ?? null, startedAt ?? null);
      } catch (err) {
        console.error('Error drawing HUD:', err);
      }

      // Match over overlay
      if (matchOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

        ctx.font = 'bold 36px "MS Sans Serif", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';

        if (winnerId !== null) {
          const winnerTeam = teams.find((t) => t.id === winnerId);
          ctx.fillStyle = winnerTeam?.color ?? '#fff';
          ctx.fillText(`${winnerTeam?.name ?? 'Team'} WINS!`, MAP_WIDTH / 2, MAP_HEIGHT / 2 - 10);
        } else {
          ctx.fillText('DRAW!', MAP_WIDTH / 2, MAP_HEIGHT / 2 - 10);
        }

        ctx.font = '16px "MS Sans Serif", Arial, sans-serif';
        ctx.fillStyle = '#ccc';
        ctx.fillText('Next match starting soon...', MAP_WIDTH / 2, MAP_HEIGHT / 2 + 20);
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    }

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [state, worms, wind, turnNumber, activeWormId, currentAction, startedAt, projectileFrames, movementFrames, movingWormId, explosions, matchOver, winnerId]);

  // Resize canvas to fit container
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleResize() {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', background: '#000' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  );
}
