// ---------------------------------------------------------------------------
// worms.arena — Leaderboard Window (Modern style)
// ---------------------------------------------------------------------------

import { useState, useEffect } from 'react';
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
  onAgentClick?: (agentId: string) => void;
}

export default function Leaderboard({ onAgentClick }: Props) {
  const [agents, setAgents] = useState<AgentRecord[]>([]);

  useEffect(() => {
    const load = () => fetch('/api/leaderboard').then((r) => r.json()).then(setAgents).catch(() => {});
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{ padding: 0, fontSize: 15, fontFamily: "'MS Sans Serif', Arial, sans-serif", height: '100%', overflowY: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead>
          <tr style={{ background: 'rgba(0, 0, 0, 0.05)', borderRadius: '8px 8px 0 0' }}>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 600, fontFamily: "'MS Sans Serif', Arial, sans-serif", borderBottom: '1px solid rgba(0,0,0,0.1)' }}>#</th>
            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 600, fontFamily: "'MS Sans Serif', Arial, sans-serif", borderBottom: '1px solid rgba(0,0,0,0.1)' }}>Agent</th>
            <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 14, fontWeight: 600, fontFamily: "'MS Sans Serif', Arial, sans-serif", borderBottom: '1px solid rgba(0,0,0,0.1)' }}>ELO</th>
            <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 14, fontWeight: 600, fontFamily: "'MS Sans Serif', Arial, sans-serif", borderBottom: '1px solid rgba(0,0,0,0.1)' }}>W</th>
            <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 14, fontWeight: 600, fontFamily: "'MS Sans Serif', Arial, sans-serif", borderBottom: '1px solid rgba(0,0,0,0.1)' }}>L</th>
            <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 14, fontWeight: 600, fontFamily: "'MS Sans Serif', Arial, sans-serif", borderBottom: '1px solid rgba(0,0,0,0.1)' }}>Win%</th>
          </tr>
        </thead>
        <tbody>
          {agents.map((a, i) => {
            const total = a.wins + a.losses + a.draws;
            const winPct = total > 0 ? ((a.wins / total) * 100).toFixed(0) : '—';
            return (
              <tr
                key={a.id}
                onClick={() => onAgentClick?.(a.id)}
                style={{
                  background: i % 2 === 0 ? 'transparent' : 'rgba(0, 0, 0, 0.02)',
                  fontWeight: i < 3 ? 600 : 400,
                  transition: 'background 0.2s ease',
                  cursor: onAgentClick ? 'pointer' : 'default',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(0, 0, 0, 0.05)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? 'transparent' : 'rgba(0, 0, 0, 0.02)';
                }}
              >
                <td style={{ padding: '12px 16px', fontSize: 16 }}>
                  {i === 0 ? '👑' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`}
                </td>
                <td style={{ padding: '12px 16px', fontFamily: "'MS Sans Serif', Arial, sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img 
                    src={getAgentImageByIndex(i)}
                    alt=""
                    onClick={(e) => {
                      e.stopPropagation();
                      onAgentClick?.(a.id);
                    }}
                    style={{ 
                      width: 20, 
                      height: 20, 
                      imageRendering: 'pixelated', 
                      objectFit: 'contain',
                      cursor: onAgentClick ? 'pointer' : 'default',
                    }}
                  />
                  {a.name}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: "'MS Sans Serif', Arial, sans-serif", fontWeight: 500 }}>{a.elo}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', color: '#4fc34f', fontFamily: "'MS Sans Serif', Arial, sans-serif", fontWeight: 500 }}>{a.wins}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', color: '#d94141', fontFamily: "'MS Sans Serif', Arial, sans-serif", fontWeight: 500 }}>{a.losses}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: "'MS Sans Serif', Arial, sans-serif", fontWeight: 500 }}>{winPct}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
