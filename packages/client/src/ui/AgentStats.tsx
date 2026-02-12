// ---------------------------------------------------------------------------
// worms.arena — Agent Statistics Window
// ---------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import { getAgentImagePath } from '../utils/agentImages';

interface AgentStats {
  agent: {
    id: string;
    name: string;
    aggression: number;
    risk_tolerance: number;
    accuracy: number;
    preferred_range: string;
    elo: number;
    wins: number;
    losses: number;
    draws: number;
  };
  recentMatches: Array<{
    id: string;
    agent1_id: string;
    agent2_id: string;
    winner_agent_id: string | null;
    turns: number;
    finished_at: string;
  }>;
  winRateByOpponent: Record<string, { wins: number; losses: number; draws: number }>;
  averageTurns: number;
  winRateByRange: Record<string, { wins: number; losses: number }>;
  longestWinStreak: number;
  currentStreak: number;
  bestOpponent: string | null;
  worstOpponent: string | null;
}

interface Props {
  agentId: string;
  onClose: () => void;
}

type TabType = 'overview' | 'matchups' | 'history';

export default function AgentStats({ agentId, onClose }: Props) {
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [allAgents, setAllAgents] = useState<Record<string, { name: string }>>({});
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [statsRes, agentsRes] = await Promise.all([
          fetch(`/api/agent/${agentId}/stats`),
          fetch('/api/agents'),
        ]);
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
        }
        if (agentsRes.ok) {
          const agents = await agentsRes.json();
          const agentsMap: Record<string, { name: string }> = {};
          agents.forEach((a: { id: string; name: string }) => {
            agentsMap[a.id] = { name: a.name };
          });
          setAllAgents(agentsMap);
        }
      } catch (err) {
        console.error('Failed to load agent stats', err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [agentId]);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'rgba(0,0,0,0.5)', fontFamily: "'DM Mono', monospace" }}>
        Loading...
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'rgba(0,0,0,0.5)', fontFamily: "'DM Mono', monospace" }}>
        Agent not found
      </div>
    );
  }

  const totalGames = stats.agent.wins + stats.agent.losses + stats.agent.draws;
  const winRate = totalGames > 0 ? ((stats.agent.wins / totalGames) * 100).toFixed(1) : '0';

  // Calculate best win rate opponent
  const opponentStats = Object.entries(stats.winRateByOpponent)
    .map(([opponentId, oppStats]) => {
      const total = oppStats.wins + oppStats.losses + oppStats.draws;
      return {
        id: opponentId,
        name: allAgents[opponentId]?.name || opponentId,
        wins: oppStats.wins,
        losses: oppStats.losses,
        draws: oppStats.draws,
        total,
        winRate: total > 0 ? (oppStats.wins / total) * 100 : 0,
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'matchups', label: 'Matchups' },
    { id: 'history', label: 'History' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #c0c0c0', backgroundColor: '#c0c0c0', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 600 : 400,
                border: 'none',
                borderRight: '1px solid #808080',
                backgroundColor: activeTab === tab.id ? '#fff' : 'transparent',
                color: '#000',
                cursor: 'pointer',
                fontFamily: "'MS Sans Serif', Arial, sans-serif",
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          style={{
            padding: '4px 12px',
            fontSize: 12,
            fontWeight: 600,
            border: '1px outset #c0c0c0',
            backgroundColor: '#c0c0c0',
            color: '#000',
            cursor: 'pointer',
            fontFamily: "'MS Sans Serif', Arial, sans-serif",
            marginRight: 4,
            outline: 'none',
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.border = '1px inset #c0c0c0';
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.border = '1px outset #c0c0c0';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.border = '1px outset #c0c0c0';
          }}
        >
          Close
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '20px', fontSize: 16, height: '100%', overflowY: 'auto', backgroundColor: '#fff' }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 26, fontWeight: 700, marginBottom: 8, fontFamily: "'MS Sans Serif', Arial, sans-serif", color: '#000', display: 'flex', alignItems: 'center', gap: 12 }}>
            <img 
              src={getAgentImagePath(agentId)}
              alt=""
              style={{ width: 32, height: 32, imageRendering: 'pixelated', objectFit: 'contain' }}
            />
            {stats.agent.name}
          </div>
          <div style={{ fontSize: 16, color: '#000', fontFamily: "'MS Sans Serif', Arial, sans-serif" }}>
            ELO: {stats.agent.elo} • Win Rate: {winRate}% • {totalGames} games
          </div>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Characteristics */}
            <div style={{ padding: '16px', marginBottom: 20, background: '#f0f0f0', border: '1px solid #c0c0c0' }}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, fontFamily: "'MS Sans Serif', Arial, sans-serif", color: '#000' }}>
                Characteristics
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13, fontFamily: "'MS Sans Serif', Arial, sans-serif" }}>
                <div>
                  <div style={{ color: '#000', marginBottom: 6, fontSize: 13 }}>Aggression</div>
                  <div style={{ height: 12, background: '#c0c0c0', overflow: 'hidden', border: '1px solid #808080' }}>
                    <div style={{ height: '100%', width: `${stats.agent.aggression * 100}%`, background: '#000080' }} />
                  </div>
                  <div style={{ fontSize: 12, color: '#000', marginTop: 4 }}>{(stats.agent.aggression * 100).toFixed(0)}%</div>
                </div>
                <div>
                  <div style={{ color: '#000', marginBottom: 6, fontSize: 13 }}>Risk Tolerance</div>
                  <div style={{ height: 12, background: '#c0c0c0', overflow: 'hidden', border: '1px solid #808080' }}>
                    <div style={{ height: '100%', width: `${stats.agent.risk_tolerance * 100}%`, background: '#000080' }} />
                  </div>
                  <div style={{ fontSize: 12, color: '#000', marginTop: 4 }}>{(stats.agent.risk_tolerance * 100).toFixed(0)}%</div>
                </div>
                <div>
                  <div style={{ color: '#000', marginBottom: 6, fontSize: 13 }}>Accuracy</div>
                  <div style={{ height: 12, background: '#c0c0c0', overflow: 'hidden', border: '1px solid #808080' }}>
                    <div style={{ height: '100%', width: `${stats.agent.accuracy * 100}%`, background: '#000080' }} />
                  </div>
                  <div style={{ fontSize: 12, color: '#000', marginTop: 4 }}>{(stats.agent.accuracy * 100).toFixed(0)}%</div>
                </div>
                <div>
                  <div style={{ color: '#000', marginBottom: 6, fontSize: 13 }}>Preferred Range</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#000', textTransform: 'capitalize', marginTop: 8 }}>{stats.agent.preferred_range}</div>
                </div>
              </div>
            </div>

            {/* Performance Stats */}
            <div style={{ padding: '16px', marginBottom: 20, background: '#f0f0f0', border: '1px solid #c0c0c0' }}>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, fontFamily: "'MS Sans Serif', Arial, sans-serif", color: '#000' }}>
                Performance
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 15, fontFamily: "'MS Sans Serif', Arial, sans-serif" }}>
                <div>
                  <div style={{ color: '#000', marginBottom: 4 }}>Average Turns</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#000' }}>{stats.averageTurns}</div>
                </div>
                <div>
                  <div style={{ color: '#000', marginBottom: 4 }}>Longest Win Streak</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#008000' }}>{stats.longestWinStreak}</div>
                </div>
                <div>
                  <div style={{ color: '#000', marginBottom: 4 }}>Current Streak</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: stats.currentStreak > 0 ? '#008000' : '#800000' }}>
                    {stats.currentStreak > 0 ? `+${stats.currentStreak}` : stats.currentStreak}
                  </div>
                </div>
                <div>
                  <div style={{ color: '#000', marginBottom: 4 }}>Total Games</div>
                  <div style={{ fontSize: 20, fontWeight: 600, color: '#000' }}>{totalGames}</div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'matchups' && (
          <>
            {/* Win Rate by Range */}
            <div style={{ padding: '16px', marginBottom: 20, background: '#f0f0f0', border: '1px solid #c0c0c0' }}>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, fontFamily: "'MS Sans Serif', Arial, sans-serif", color: '#000' }}>
                Win Rate by Opponent Range
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 15, fontFamily: "'MS Sans Serif', Arial, sans-serif" }}>
                {(['close', 'medium', 'far'] as const).map((range) => {
                  const rangeStats = stats.winRateByRange[range];
                  const total = rangeStats.wins + rangeStats.losses;
                  const winRate = total > 0 ? ((rangeStats.wins / total) * 100).toFixed(0) : '—';
                  return (
                    <div key={range} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                      <span style={{ color: '#000', textTransform: 'capitalize', fontSize: 16 }}>{range}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 15, color: '#000' }}>{rangeStats.wins}W / {rangeStats.losses}L</span>
                        <span style={{ fontWeight: 600, color: '#000', minWidth: 50, textAlign: 'right', fontSize: 16 }}>{winRate}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Opponents */}
            {opponentStats.length > 0 && (
              <div style={{ padding: '16px', marginBottom: 20, background: '#f0f0f0', border: '1px solid #c0c0c0' }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, fontFamily: "'MS Sans Serif', Arial, sans-serif", color: '#000' }}>
                  Top Opponents
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 15, fontFamily: "'MS Sans Serif', Arial, sans-serif" }}>
                  {opponentStats.map((opp) => (
                    <div key={opp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
                      <span style={{ color: '#000', fontSize: 16 }}>{opp.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 15, color: '#000' }}>{opp.wins}W / {opp.losses}L</span>
                        <span style={{ fontWeight: 600, color: '#000', minWidth: 50, textAlign: 'right', fontSize: 16 }}>{opp.winRate.toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Best/Worst Opponents */}
            {(stats.bestOpponent || stats.worstOpponent) && (
              <div style={{ padding: '16px', marginBottom: 20, background: '#f0f0f0', border: '1px solid #c0c0c0' }}>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, fontFamily: "'MS Sans Serif', Arial, sans-serif", color: '#000' }}>
                  Matchup Analysis
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 16, fontFamily: "'MS Sans Serif', Arial, sans-serif" }}>
                  {stats.bestOpponent && (
                    <div>
                      <span style={{ color: '#000' }}>Best Matchup: </span>
                      <span style={{ fontWeight: 600, color: '#008000' }}>{allAgents[stats.bestOpponent]?.name || stats.bestOpponent}</span>
                    </div>
                  )}
                  {stats.worstOpponent && (
                    <div>
                      <span style={{ color: '#000' }}>Worst Matchup: </span>
                      <span style={{ fontWeight: 600, color: '#800000' }}>{allAgents[stats.worstOpponent]?.name || stats.worstOpponent}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'history' && (
          <div style={{ padding: '16px', background: '#f0f0f0', border: '1px solid #c0c0c0' }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, fontFamily: "'MS Sans Serif', Arial, sans-serif", color: '#000' }}>
              Recent Matches ({stats.recentMatches.length})
            </div>
            <div style={{ maxHeight: 400, overflowY: 'auto', border: '1px inset #808080', background: '#fff' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, fontFamily: "'MS Sans Serif', Arial, sans-serif" }}>
                <thead>
                  <tr style={{ background: '#c0c0c0', borderBottom: '1px solid #808080' }}>
                    <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600, fontSize: 12, borderRight: '1px solid #808080' }}>Opponent</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 600, fontSize: 12, borderRight: '1px solid #808080', width: '60px' }}>Turns</th>
                    <th style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 600, fontSize: 12, width: '50px' }}>Result</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentMatches.slice(0, 20).map((match, index) => {
                    const opponentId = match.agent1_id === agentId ? match.agent2_id : match.agent1_id;
                    const opponentName = allAgents[opponentId]?.name || opponentId;
                    const result = match.winner_agent_id === agentId ? 'W' : match.winner_agent_id === opponentId ? 'L' : 'D';
                    const resultColor = result === 'W' ? '#008000' : result === 'L' ? '#800000' : '#808080';
                    return (
                      <tr 
                        key={match.id} 
                        style={{ 
                          background: index % 2 === 0 ? '#fff' : '#f0f0f0',
                          borderBottom: '1px solid #c0c0c0'
                        }}
                      >
                        <td style={{ padding: '6px 8px', fontSize: 13, borderRight: '1px solid #c0c0c0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                          {opponentName}
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', fontSize: 13, borderRight: '1px solid #c0c0c0' }}>
                          {match.turns}
                        </td>
                        <td style={{ padding: '6px 8px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: resultColor }}>
                          {result}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
