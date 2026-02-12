// ---------------------------------------------------------------------------
// worms.arena — Agent Info Panel (clickable with detail view)
// ---------------------------------------------------------------------------

import { useState, useEffect } from 'react';
import type { Worm, Team } from '@worms-arena/shared';

interface AgentRecord {
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
}

interface Props {
  teams: Team[];
  worms: Worm[];
}

export default function AgentPanel({ teams, worms }: Props) {
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentRecord | null>(null);

  useEffect(() => {
    fetch('/api/agents')
      .then((r) => r.json())
      .then(setAgents)
      .catch(() => {});
    const iv = setInterval(() => {
      fetch('/api/agents').then((r) => r.json()).then(setAgents).catch(() => {});
    }, 10000);
    return () => clearInterval(iv);
  }, []);

  if (selectedAgent) {
    return <AgentDetail agent={selectedAgent} worms={worms} teams={teams} onBack={() => setSelectedAgent(null)} />;
  }

  return (
    <div style={{ padding: 0, fontSize: 15, fontFamily: "'MS Sans Serif', Arial, sans-serif", overflowY: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 12, fontWeight: 600, fontSize: 16, fontFamily: "'MS Sans Serif', Arial, sans-serif", paddingBottom: 8, borderBottom: '1px solid rgba(0,0,0,0.1)' }}>
        AI Agents ({agents.length})
      </div>
      {agents.map((agent) => {
        const teamMatch = teams.find((t) => t.agentId === agent.id);
        const teamWorms = teamMatch ? worms.filter((w) => w.teamId === teamMatch.id) : [];
        const alive = teamWorms.filter((w) => w.alive).length;
        const inMatch = teamMatch != null;

        return (
          <div
            key={agent.id}
            onClick={() => setSelectedAgent(agent)}
            style={{
              padding: '12px',
              marginBottom: 8,
              cursor: 'pointer',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: inMatch ? 'rgba(34, 102, 255, 0.1)' : 'rgba(0, 0, 0, 0.03)',
              border: `1px solid ${inMatch ? 'rgba(34, 102, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = inMatch ? 'rgba(34, 102, 255, 0.2)' : 'rgba(0, 0, 0, 0.08)';
              (e.currentTarget as HTMLDivElement).style.transform = 'translateX(4px)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = inMatch ? 'rgba(34, 102, 255, 0.1)' : 'rgba(0, 0, 0, 0.03)';
              (e.currentTarget as HTMLDivElement).style.transform = 'translateX(0)';
            }}
          >
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: inMatch ? (teamMatch?.color ?? '#888') : '#888', flexShrink: 0, boxShadow: `0 0 4px ${inMatch ? (teamMatch?.color ?? '#888') : '#888'}40` }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 15, fontFamily: "'MS Sans Serif', Arial, sans-serif" }}>{agent.name}</div>
              <div style={{ fontSize: 13, opacity: 0.7, fontFamily: "'MS Sans Serif', Arial, sans-serif", marginTop: 2 }}>
                ELO {agent.elo} | {agent.wins}W/{agent.losses}L
                {inMatch && ` | ${alive} alive`}
              </div>
            </div>
            <div style={{ fontSize: 14, opacity: 0.4, fontFamily: "'MS Sans Serif', Arial, sans-serif" }}>→</div>
          </div>
        );
      })}
    </div>
  );
}

// ---- Agent Detail View ----

function AgentDetail({ agent, worms, teams, onBack }: {
  agent: AgentRecord;
  worms: Worm[];
  teams: Team[];
  onBack: () => void;
}) {
  const totalGames = agent.wins + agent.losses + agent.draws;
  const winRate = totalGames > 0 ? ((agent.wins / totalGames) * 100).toFixed(1) : '—';

  const teamMatch = teams.find((t) => t.agentId === agent.id);
  const teamWorms = teamMatch ? worms.filter((w) => w.teamId === teamMatch.id) : [];

  return (
    <div style={{ padding: 0, fontSize: 15, fontFamily: "'MS Sans Serif', Arial, sans-serif", overflowY: 'auto', height: '100%' }}>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          fontSize: 14,
          padding: '8px 12px',
          marginBottom: 16,
          cursor: 'pointer',
          borderRadius: '6px',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          background: 'rgba(0, 0, 0, 0.03)',
          fontFamily: "'MS Sans Serif', Arial, sans-serif",
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0, 0, 0, 0.08)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0, 0, 0, 0.03)';
        }}
      >
        ← Back
      </button>

      {/* Name */}
      <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 16, fontFamily: "'MS Sans Serif', Arial, sans-serif" }}>
        {agent.name}
      </div>

      {/* Stats */}
      <div style={{ padding: '16px', marginBottom: 16, borderRadius: '8px', background: 'rgba(0, 0, 0, 0.03)', border: '1px solid rgba(0, 0, 0, 0.1)' }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, fontFamily: "'MS Sans Serif', Arial, sans-serif" }}>Rating</div>
        <table style={{ width: '100%', fontSize: 14, fontFamily: "'MS Sans Serif', Arial, sans-serif" }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}><td style={{ padding: '6px 0' }}>ELO</td><td style={{ textAlign: 'right', fontWeight: 600 }}>{agent.elo}</td></tr>
            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}><td style={{ padding: '6px 0' }}>Win Rate</td><td style={{ textAlign: 'right' }}>{winRate}%</td></tr>
            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}><td style={{ padding: '6px 0' }}>Wins</td><td style={{ textAlign: 'right', color: '#4fc34f', fontWeight: 500 }}>{agent.wins}</td></tr>
            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}><td style={{ padding: '6px 0' }}>Losses</td><td style={{ textAlign: 'right', color: '#d94141', fontWeight: 500 }}>{agent.losses}</td></tr>
            <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}><td style={{ padding: '6px 0' }}>Draws</td><td style={{ textAlign: 'right' }}>{agent.draws}</td></tr>
            <tr><td style={{ padding: '6px 0' }}>Total Games</td><td style={{ textAlign: 'right', fontWeight: 500 }}>{totalGames}</td></tr>
          </tbody>
        </table>
      </div>

      {/* Personality */}
      <div style={{ padding: '16px', marginBottom: 16, borderRadius: '8px', background: 'rgba(0, 0, 0, 0.03)', border: '1px solid rgba(0, 0, 0, 0.1)' }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, fontFamily: "'MS Sans Serif', Arial, sans-serif" }}>Personality</div>
        <StatBar label="Aggression" value={agent.aggression} color="#e74c3c" />
        <StatBar label="Accuracy" value={agent.accuracy} color="#3498db" />
        <StatBar label="Risk Tolerance" value={agent.risk_tolerance} color="#f39c12" />
        <div style={{ fontSize: 14, marginTop: 12, fontFamily: "'MS Sans Serif', Arial, sans-serif" }}>
          Preferred Range: <b>{agent.preferred_range}</b>
        </div>
      </div>

      {/* Current match worms */}
      {teamMatch && teamWorms.length > 0 && (
        <div style={{ padding: '16px', borderRadius: '8px', background: 'rgba(0, 0, 0, 0.03)', border: '1px solid rgba(0, 0, 0, 0.1)' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, fontFamily: "'MS Sans Serif', Arial, sans-serif" }}>Current Match</div>
          <div style={{ fontSize: 13, marginBottom: 12, color: teamMatch.color, fontFamily: "'MS Sans Serif', Arial, sans-serif", fontWeight: 500 }}>
            Playing as {teamMatch.name}
          </div>
          {teamWorms.map((w) => (
            <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, opacity: w.alive ? 1 : 0.4, fontSize: 14, fontFamily: "'MS Sans Serif', Arial, sans-serif" }}>
              <span style={{ minWidth: 60 }}>{w.name}</span>
              <div style={{ flex: 1, height: 8, background: 'rgba(0, 0, 0, 0.1)', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, height: '100%',
                  width: `${w.hp}%`,
                  background: w.hp > 50 ? '#4fc34f' : w.hp > 25 ? '#f39c12' : '#d94141',
                  borderRadius: '4px',
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <span style={{ minWidth: 32, textAlign: 'right', fontWeight: 500 }}>{w.alive ? w.hp : 'X'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontFamily: "'MS Sans Serif', Arial, sans-serif", marginBottom: 6 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 500 }}>{(value * 100).toFixed(0)}%</span>
      </div>
      <div style={{ height: 10, background: 'rgba(0, 0, 0, 0.1)', borderRadius: '5px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value * 100}%`, background: color, borderRadius: '5px', transition: 'width 0.3s ease' }} />
      </div>
    </div>
  );
}
