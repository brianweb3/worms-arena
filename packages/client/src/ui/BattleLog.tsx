// ---------------------------------------------------------------------------
// worms.arena — Battle Log component
// ---------------------------------------------------------------------------

import { useRef, useEffect, useState } from 'react';
import type { MatchData } from '../hooks/useGameSocket';

interface Props {
  matchData: MatchData | null;
}

export default function BattleLog({ matchData }: Props) {
  const logRef = useRef<HTMLDivElement>(null);
  const [entries, setEntries] = useState<string[]>([]);
  const prevTurnRef = useRef(0);
  const prevMatchRef = useRef<string | null>(null);

  useEffect(() => {
    if (!matchData) return;

    const matchId = matchData.state?.matchId ?? '';

    // Reset on new match
    if (matchId && matchId !== prevMatchRef.current) {
      prevMatchRef.current = matchId;
      prevTurnRef.current = 0;
      const t1 = matchData.state?.teams[0]?.name ?? '?';
      const t2 = matchData.state?.teams[1]?.name ?? '?';
      setEntries([`--- ${t1} vs ${t2} ---`]);
    }

    if (matchData.turnNumber > prevTurnRef.current) {
      prevTurnRef.current = matchData.turnNumber;
      const activeWorm = matchData.worms.find((w) => w.id === matchData.activeWormId);
      const team = matchData.state?.teams.find((t) => t.id === activeWorm?.teamId);

      if (matchData.currentAction) {
        let msg = `[${matchData.turnNumber}] `;
        if (activeWorm) msg += `${activeWorm.name} (${team?.name}): `;
        switch (matchData.currentAction.type) {
          case 'shoot': msg += `fires ${matchData.currentAction.weaponId}`; break;
          case 'move': msg += `moves ${matchData.currentAction.direction === 1 ? 'right' : 'left'}`; break;
          case 'skip': msg += 'skips'; break;
        }
        setEntries((prev) => [...prev.slice(-80), msg]);
      }
    }

    if (matchData.deaths.length > 0) {
      for (const id of matchData.deaths) {
        const deadWorm = matchData.worms.find((w) => w.id === id);
        if (deadWorm) {
          setEntries((prev) => [...prev.slice(-80), `  💀 ${deadWorm.name} eliminated!`]);
        }
      }
    }

    if (matchData.matchOver) {
      if (matchData.winnerId !== null) {
        const winTeam = matchData.state?.teams.find((t) => t.id === matchData.winnerId);
        setEntries((prev) => [...prev.slice(-80), `🏆 ${winTeam?.name} wins!`]);
      } else {
        setEntries((prev) => [...prev.slice(-80), '🤝 Draw!']);
      }
    }
  }, [matchData?.turnNumber, matchData?.currentAction, matchData?.matchOver, matchData?.deaths, matchData?.state?.matchId]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [entries]);

  return (
    <div
      ref={logRef}
      style={{
        height: '100%',
        overflowY: 'auto',
        background: 'rgba(0, 0, 0, 0.02)',
        borderRadius: '8px',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        padding: '12px',
        fontSize: 13,
        fontFamily: "'MS Sans Serif', Arial, sans-serif",
        lineHeight: 1.6,
      }}
    >
      {entries.length === 0 ? (
        <span style={{ color: 'rgba(0,0,0,0.4)' }}>Waiting for match...</span>
      ) : (
        entries.map((entry, i) => (
          <div key={i} style={{ marginBottom: 4, color: entry.includes('💀') ? '#d94141' : entry.includes('🏆') ? '#4fc34f' : entry.includes('🤝') ? '#f39c12' : 'rgba(0,0,0,0.8)' }}>
            {entry}
          </div>
        ))
      )}
    </div>
  );
}
