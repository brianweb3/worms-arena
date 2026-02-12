// ---------------------------------------------------------------------------
// worms.arena — Live Games Widget (Modern style)
// ---------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import type { MatchSummary } from '@worms-arena/shared';
import { getAgentImageByIndex } from '../utils/agentImages';

interface AgentRecord {
  id: string;
  name: string;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
}

interface Props {
  matches: MatchSummary[];
  onSelectMatch: (matchId: string) => void;
  activeMatchId: string | null;
  onAgentClick?: (agentId: string, agentName: string) => void;
}

export default function LiveGames({ matches, onSelectMatch, activeMatchId, onAgentClick }: Props) {
  const [leaderboard, setLeaderboard] = useState<AgentRecord[]>([]);

  useEffect(() => {
    const load = () => fetch('/api/leaderboard').then((r) => r.json()).then(setLeaderboard).catch(() => {});
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, []);

  const getAgentIndex = (agentId: string): number => {
    const index = leaderboard.findIndex(a => a.id === agentId);
    return index >= 0 ? index : 0; // Default to 0 if not found
  };
  return (
    <div style={{ padding: '12px', fontSize: 15, fontFamily: "'MS Sans Serif', Arial, sans-serif", height: '100%', overflowY: 'auto' }}>
      <div style={{ fontWeight: 600, marginBottom: 16, fontSize: 16, fontFamily: "'MS Sans Serif', Arial, sans-serif", paddingBottom: 12, borderBottom: '2px solid #c0c0c0', color: '#000' }}>
        Live Matches ({matches.length})
      </div>
      {matches.length === 0 && (
        <div style={{ color: 'rgba(0,0,0,0.5)', fontSize: 14, padding: 24, textAlign: 'center', fontFamily: "'MS Sans Serif', Arial, sans-serif" }}>
          Starting matches...
        </div>
      )}
      {matches.map((m) => {
        const isActive = m.matchId === activeMatchId;
        return (
          <div
            key={m.matchId}
            onClick={() => onSelectMatch(m.matchId)}
            style={{
              padding: '12px',
              marginBottom: 8,
              cursor: 'pointer',
              border: isActive 
                ? '2px inset #000080' 
                : '2px outset #c0c0c0',
              background: isActive ? '#c6d9f1' : '#c0c0c0',
              whiteSpace: 'nowrap',
            }}
            onMouseDown={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLDivElement).style.border = '2px inset #c0c0c0';
              }
            }}
            onMouseUp={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLDivElement).style.border = '2px outset #c0c0c0';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                (e.currentTarget as HTMLDivElement).style.border = '2px outset #c0c0c0';
              }
            }}
          >
            {/* Header: agent names */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, whiteSpace: 'nowrap' }}>
              <span style={{ fontWeight: 600, fontSize: 15, fontFamily: "'MS Sans Serif', Arial, sans-serif", color: '#000', display: 'flex', alignItems: 'center', gap: 6 }}>
                {(() => {
                  // Определяем, является ли цвет красным (R > B) или синим (B >= R)
                  const hexToRgb = (hex: string) => {
                    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
                    return result ? {
                      r: parseInt(result[1], 16),
                      g: parseInt(result[2], 16),
                      b: parseInt(result[3], 16)
                    } : { r: 0, g: 0, b: 0 };
                  };
                  const agent1Rgb = hexToRgb(m.agent1Color);
                  const agent2Rgb = hexToRgb(m.agent2Color);
                  const agent1IsRed = agent1Rgb.r > agent1Rgb.b;
                  const agent2IsRed = agent2Rgb.r > agent2Rgb.b;
                  const agent1Index = getAgentIndex(m.agent1Id);
                  const agent2Index = getAgentIndex(m.agent2Id);
                  const wormImg1 = (
                    <img
                      src={getAgentImageByIndex(agent1Index)}
                      alt=""
                      onClick={(e) => {
                        e.stopPropagation();
                        onAgentClick?.(m.agent1Id, m.agent1);
                      }}
                      style={{ 
                        width: 18, 
                        height: 18, 
                        imageRendering: 'pixelated', 
                        objectFit: 'contain', 
                        display: 'block',
                        cursor: onAgentClick ? 'pointer' : 'default',
                      }}
                    />
                  );
                  const wormImg2 = (
                    <img
                      src={getAgentImageByIndex(agent2Index)}
                      alt=""
                      onClick={(e) => {
                        e.stopPropagation();
                        onAgentClick?.(m.agent2Id, m.agent2);
                      }}
                      style={{ 
                        width: 18, 
                        height: 18, 
                        imageRendering: 'pixelated', 
                        objectFit: 'contain', 
                        display: 'block',
                        cursor: onAgentClick ? 'pointer' : 'default',
                      }}
                    />
                  );
                  const agent1Block = (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {agent1IsRed && wormImg1}
                      <span style={{ color: m.agent1Color }}>{m.agent1}</span>
                      {!agent1IsRed && wormImg1}
                    </span>
                  );
                  const agent2Block = (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {agent2IsRed && wormImg2}
                      <span style={{ color: m.agent2Color }}>{m.agent2}</span>
                      {!agent2IsRed && wormImg2}
                    </span>
                  );
                  return (
                    <>
                      {agent1Block}
                      <span style={{ color: '#000', margin: '0 6px' }}>vs</span>
                      {agent2Block}
                    </>
                  );
                })()}
              </span>
              <span style={{ fontSize: 12, fontFamily: "'MS Sans Serif', Arial, sans-serif", background: '#fff', color: '#000', padding: '2px 6px', fontWeight: 600, border: '1px inset #808080' }}>T{m.turnNumber}</span>
            </div>

            {/* HP bars */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, fontFamily: "'MS Sans Serif', Arial, sans-serif" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, color: '#000' }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{m.alive1} alive</span>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{m.totalHp1} HP</span>
                </div>
                <div style={{ height: 12, background: '#fff', overflow: 'hidden', border: '1px inset #808080' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, (m.totalHp1 / 400) * 100)}%`, background: m.agent1Color, transition: 'width 0.3s ease' }} />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, color: '#000' }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{m.alive2} alive</span>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{m.totalHp2} HP</span>
                </div>
                <div style={{ height: 12, background: '#fff', overflow: 'hidden', border: '1px inset #808080' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, (m.totalHp2 / 400) * 100)}%`, background: m.agent2Color, transition: 'width 0.3s ease' }} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
