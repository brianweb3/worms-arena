// ---------------------------------------------------------------------------
// worms.arena — Desktop (Win98-style multi-window)
// ---------------------------------------------------------------------------

import { useState, useCallback, useEffect } from 'react';
import Window from './Window';
import Taskbar from './Taskbar';
import AgentPanel from './AgentPanel';
import LiveGames from './LiveGames';
import Leaderboard from './Leaderboard';
import BattleLog from './BattleLog';
import Manifesto from './Manifesto';
import AgentStats from './AgentStats';
import MatchStats from './MatchStats';
import WeaponStats from './WeaponStats';
import GameCanvas from '../renderer/GameCanvas';
import { useMusic } from '../hooks/useMusic';
import type { MultiGameData, MatchData } from '../hooks/useGameSocket';
import { getAgentImagePath } from '../utils/agentImages';

interface WindowDef {
  id: string;
  title: string;
  icon: React.ReactNode;
  minimized: boolean;
  closed: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Props {
  gameData: MultiGameData;
}

const LOGO_IMG = <img src="/assets/logo-new.png" alt="" style={{ width: 16, height: 16, imageRendering: 'pixelated' }} />;
const LOGO_32 = <img src="/assets/logo-new.png" alt="" style={{ width: 32, height: 32, imageRendering: 'pixelated' }} />;
const LOGO_64 = <img src="/assets/logo-new.png" alt="" style={{ width: 64, height: 64, imageRendering: 'pixelated' }} />;
const LB_IMG = <img src="/assets/leaderboard-icon-new.png" alt="" style={{ width: 16, height: 16, imageRendering: 'pixelated' }} />;
const LB_32 = <img src="/assets/leaderboard-icon-new.png" alt="" style={{ width: 32, height: 32, imageRendering: 'pixelated' }} />;
const LB_64 = <img src="/assets/leaderboard-icon-new.png" alt="" style={{ width: 64, height: 64, imageRendering: 'pixelated' }} />;
const MANIFESTO_IMG = <img src="/assets/manifesto-icon.png" alt="" style={{ width: 16, height: 16, imageRendering: 'pixelated' }} />;
const MANIFESTO_32 = <img src="/assets/manifesto-icon.png" alt="" style={{ width: 32, height: 32, imageRendering: 'pixelated' }} />;
const MANIFESTO_64 = <img src="/assets/manifesto-icon.png" alt="" style={{ width: 64, height: 64, imageRendering: 'pixelated' }} />;
const BATTLE_LOG_IMG = <img src="/assets/battle-log-icon.png" alt="" style={{ width: 16, height: 16, imageRendering: 'pixelated' }} />;
const BATTLE_LOG_32 = <img src="/assets/battle-log-icon.png" alt="" style={{ width: 32, height: 32, imageRendering: 'pixelated' }} />;
const BATTLE_LOG_64 = <img src="/assets/battle-log-icon.png" alt="" style={{ width: 64, height: 64, imageRendering: 'pixelated' }} />;
const X_32 = <img src="/assets/x-icon.png" alt="" style={{ width: 32, height: 32, imageRendering: 'pixelated' }} />;
const X_64 = <img src="/assets/x-icon.png" alt="" style={{ width: 64, height: 64, imageRendering: 'pixelated' }} />;
const YOUTUBE_32 = <img src="/assets/youtube-icon.png" alt="" style={{ width: 32, height: 32, imageRendering: 'pixelated' }} />;
const YOUTUBE_64 = <img src="/assets/youtube-icon.png" alt="" style={{ width: 64, height: 64, imageRendering: 'pixelated' }} />;

export default function Desktop({ gameData }: Props) {
  const music = useMusic();

  // Calculate window positions and sizes based on screen dimensions
  const calculateWindowLayout = useCallback((liveMatchesWidthValue: number) => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const taskbarHeight = 34;
    const padding = 10;
    
    // Layout structure:
    // [Leaderboard] [LIVE (large)] [Live Matches]
    // [Manifesto] [Match Stats] [Weapon Stats]
    
    const leaderboardWidth = Math.round(screenWidth * 0.18); // 18% ширины экрана
    const liveMatchesWidth = liveMatchesWidthValue;
    const manifestoHeight = Math.round((screenHeight - taskbarHeight) * 0.25); // 25% высоты
    
    // Available width for LIVE = screen - leaderboard - live matches - padding
    const availableWidthForLive = screenWidth - leaderboardWidth - liveMatchesWidth - padding * 4;
    const availableHeightForLive = screenHeight - taskbarHeight - manifestoHeight - padding * 3;
    
    // Bottom row: Manifesto, Match Stats, Weapon Stats
    const bottomRowY = availableHeightForLive + padding * 2;
    const bottomRowWidth = screenWidth - liveMatchesWidth - padding * 3; // Вся ширина кроме Live Matches
    const statsWindowWidth = Math.round(bottomRowWidth * 0.22); // 22% для каждого stats окна
    const manifestoWidth = bottomRowWidth - statsWindowWidth * 2 - padding * 2; // Остальное для Manifesto (~56%)
    
    return {
      leaderboard: {
        x: padding,
        y: padding,
        w: leaderboardWidth,
        h: availableHeightForLive, // Та же высота что и LIVE
      },
      game: {
        x: leaderboardWidth + padding * 2, // После leaderboard с отступом
        y: padding,
        w: availableWidthForLive,
        h: availableHeightForLive,
      },
      manifesto: {
        x: padding,
        y: bottomRowY,
        w: manifestoWidth,
        h: manifestoHeight,
      },
      agents: {
        x: Math.round(screenWidth * 0.375 + padding),
        y: Math.round((screenHeight - taskbarHeight) * 0.25 + padding),
        w: Math.round(screenWidth * 0.14),
        h: Math.round((screenHeight - taskbarHeight) * 0.26),
      },
      log: {
        x: Math.round(screenWidth * 0.229 + padding),
        y: Math.round((screenHeight - taskbarHeight) * 0.426 + padding),
        w: Math.round(screenWidth * 0.188),
        h: Math.round((screenHeight - taskbarHeight) * 0.241),
      },
      'agent-stats': {
        x: Math.round(screenWidth * 0.156 + padding),
        y: Math.round((screenHeight - taskbarHeight) * 0.093 + padding),
        w: Math.round(screenWidth * 0.26),
        h: Math.round((screenHeight - taskbarHeight) * 0.556),
      },
      'match-stats': {
        x: padding + manifestoWidth + padding,
        y: bottomRowY,
        w: statsWindowWidth,
        h: manifestoHeight,
      },
      'weapon-stats': {
        x: padding + manifestoWidth + padding + statsWindowWidth + padding,
        y: bottomRowY,
        w: statsWindowWidth,
        h: manifestoHeight,
      },
    };
  }, []);

  const [windows, setWindows] = useState<WindowDef[]>(() => {
    const initialLiveMatchesWidth = Math.max(380, Math.round(window.innerWidth * 0.2));
    const layout = calculateWindowLayout(initialLiveMatchesWidth);
    return [
      { id: 'game', title: 'worms.arena — LIVE', icon: LOGO_IMG, minimized: false, closed: false, x: layout.game.x, y: layout.game.y, w: layout.game.w, h: layout.game.h },
      { id: 'agents', title: 'Agents', icon: '🤖', minimized: false, closed: true, x: layout.agents.x, y: layout.agents.y, w: layout.agents.w, h: layout.agents.h },
      { id: 'leaderboard', title: 'Leaderboard', icon: LB_IMG, minimized: false, closed: false, x: layout.leaderboard.x, y: layout.leaderboard.y, w: layout.leaderboard.w, h: layout.leaderboard.h },
      { id: 'log', title: 'Battle Log', icon: BATTLE_LOG_IMG, minimized: false, closed: true, x: layout.log.x, y: layout.log.y, w: layout.log.w, h: layout.log.h },
      { id: 'manifesto', title: 'Manifesto', icon: MANIFESTO_IMG, minimized: false, closed: false, x: layout.manifesto.x, y: layout.manifesto.y, w: layout.manifesto.w, h: layout.manifesto.h },
      { id: 'agent-stats', title: 'Agent Stats', icon: '📊', minimized: false, closed: true, x: layout['agent-stats'].x, y: layout['agent-stats'].y, w: layout['agent-stats'].w, h: layout['agent-stats'].h },
      { id: 'match-stats', title: 'Match Stats', icon: '📈', minimized: false, closed: false, x: layout['match-stats'].x, y: layout['match-stats'].y, w: layout['match-stats'].w, h: layout['match-stats'].h },
      { id: 'weapon-stats', title: 'Weapon Stats', icon: '🔫', minimized: false, closed: false, x: layout['weapon-stats'].x, y: layout['weapon-stats'].y, w: layout['weapon-stats'].w, h: layout['weapon-stats'].h },
    ];
  });

  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [focusedWindow, setFocusedWindow] = useState<string | null>(null);
  const [liveMatchesX, setLiveMatchesX] = useState(720);
  const [liveMatchesHeight, setLiveMatchesHeight] = useState(250);
  const [liveMatchesWidth, setLiveMatchesWidth] = useState(380);
  const [gameMaximized, setGameMaximized] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [selectedAgentName, setSelectedAgentName] = useState<string | null>(null);
  const [allAgents, setAllAgents] = useState<Record<string, { name: string }>>({});

  useEffect(() => {
    fetch('/api/agents')
      .then((r) => r.json())
      .then((agents) => {
        const agentsMap: Record<string, { name: string }> = {};
        agents.forEach((a: { id: string; name: string }) => {
          agentsMap[a.id] = { name: a.name };
        });
        setAllAgents(agentsMap);
      })
      .catch(() => {});
  }, []);

  const activeMatch: MatchData | null = activeMatchId
    ? gameData.matches[activeMatchId] ?? null
    : gameData.matchList.length > 0
      ? gameData.matches[gameData.matchList[0].matchId] ?? null
      : null;

  useEffect(() => {
    if (activeMatchId && gameData.matches[activeMatchId]) {
      setActiveMatchId(activeMatchId);
    } else if (gameData.matchList.length > 0 && !activeMatchId) {
      setActiveMatchId(gameData.matchList[0].matchId);
    }
  }, [gameData.matchList, gameData.matches, activeMatchId]);

  useEffect(() => {
    const updateLayout = () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const taskbarHeight = 34;
      const padding = 10;
      
      // Live Matches: фиксированная ширина 380px или 20% от ширины экрана (что больше)
      const newLiveMatchesWidth = Math.max(380, Math.round(screenWidth * 0.2));
      setLiveMatchesWidth(newLiveMatchesWidth);
      const liveMatchesRight = padding;
      const liveMatchesStartX = screenWidth - liveMatchesRight - newLiveMatchesWidth;
      setLiveMatchesX(liveMatchesStartX);
      
      // Update window positions and sizes based on screen dimensions
      const layout = calculateWindowLayout(newLiveMatchesWidth);
      
      // Высота Live Matches до низа экрана (до taskbar)
      setLiveMatchesHeight(screenHeight - taskbarHeight - padding * 2);
      
      setWindows((prev) => prev.map((w) => {
        const newLayout = layout[w.id as keyof typeof layout];
        if (newLayout) {
          return { ...w, x: newLayout.x, y: newLayout.y, w: newLayout.w, h: newLayout.h };
        }
        return w;
      }));
    };
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, [calculateWindowLayout]);

  const wFor = useCallback((id: string) => windows.find((w) => w.id === id)!, [windows]);

  const updateWindow = useCallback((id: string, updates: Partial<WindowDef>) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w)));
  }, []);

  const openWindow = useCallback((id: string) => {
    updateWindow(id, { closed: false, minimized: false });
    setFocusedWindow(id);
  }, [updateWindow]);

  const selectMatch = useCallback((matchId: string) => {
    setActiveMatchId(matchId);
    const w = windows.find((w) => w.id === 'game');
    if (w && w.closed) {
      updateWindow('game', { closed: false, minimized: false });
      setFocusedWindow('game');
    }
  }, [windows, updateWindow]);

  const closeWindow = useCallback((id: string) => {
    updateWindow(id, { closed: true });
  }, [updateWindow]);

  const toggleMinimize = useCallback((id: string) => {
    const w = wFor(id);
    if (w.minimized) {
      updateWindow(id, { minimized: false });
      setFocusedWindow(id);
    } else {
      updateWindow(id, { minimized: true });
    }
  }, [wFor, updateWindow]);

  const bringToFront = useCallback((id: string) => {
    setFocusedWindow(id);
  }, []);

  const zIndexFor = useCallback((id: string) => {
    if (focusedWindow === id) return 1000;
    // Если окно game максимизировано, оно должно быть выше Live Matches (900)
    if (id === 'game' && gameMaximized) return 950;
    const idx = windows.findIndex((w) => w.id === id);
    return 100 + idx;
  }, [focusedWindow, windows, gameMaximized]);

  const handleDesktopClick = useCallback(() => {
    // Try to start music on first user interaction if autoplay was blocked
    music.tryAutostart();
    setFocusedWindow(null);
  }, []);

  const taskbarItems = windows
    .filter((w) => !w.closed)
    .map((w) => ({
      id: w.id,
      title: w.title,
      icon: w.icon,
      minimized: w.minimized,
    }));

  return (
    <div
      onClick={handleDesktopClick}
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '"MS Sans Serif", Arial, sans-serif',
        backgroundColor: '#008080',
      }}
    >
      {/* Top bar — Twitter */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 28,
          background: '#c0c0c0',
          borderBottom: '2px solid #808080',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 12px',
          gap: 8,
          zIndex: 10000,
        }}
      >
        <a
          href="https://x.com/i/communities/2021995555740667942"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 10px',
            fontSize: 12,
            fontFamily: '"MS Sans Serif", Arial, sans-serif',
            color: '#000',
            textDecoration: 'none',
            background: '#c0c0c0',
            border: '1px solid #808080',
            boxShadow: 'inset 1px 1px 0 #fff, 1px 1px 0 #000',
          }}
        >
          <img src="/assets/twitter-logo.svg" alt="" style={{ width: 16, height: 16, display: 'block' }} />
          Twitter
        </a>
      </div>

      {/* Desktop icons */}
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
      </div>

      {/* Game window */}
      {!wFor('game').closed && (
        <Window
          title={activeMatch?.state ? `${activeMatch.state.teams[0]?.name} vs ${activeMatch.state.teams[1]?.name} — LIVE` : 'worms.arena — LIVE'}
          icon={LOGO_IMG}
          defaultX={wFor('game').x} defaultY={wFor('game').y}
          defaultWidth={wFor('game').w} defaultHeight={wFor('game').h}
          minimized={false}
          zIndex={zIndexFor('game')}
          onFocus={() => bringToFront('game')}
          onMaximizeChange={setGameMaximized}
          windowId="game"
          disableResize={true}
          onPositionChange={(x, y) => updateWindow('game', { x, y })}
          onSizeChange={(w, h) => updateWindow('game', { w, h })}
        >
          {activeMatch ? (
            <GameCanvas gameData={activeMatch} />
          ) : (
            <div style={{ 
              padding: 40, 
              textAlign: 'center', 
              color: 'rgba(0,0,0,0.5)', 
              fontFamily: "'DM Mono', monospace",
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 600
            }}>
              Waiting for matches...
            </div>
          )}
        </Window>
      )}

      {/* Live Matches list - always visible on the right, cannot be closed */}
      {!gameMaximized && (
      <div
        style={{
          position: 'absolute',
          right: 10,
          top: 10,
          width: liveMatchesWidth,
          height: liveMatchesHeight,
          zIndex: 900,
        }}
      >
        <Window
          title="Live Matches"
          icon="⚔️"
          defaultX={0}
          defaultY={0}
          defaultWidth={liveMatchesWidth}
          defaultHeight={liveMatchesHeight}
          minimized={false}
          zIndex={900}
          onFocus={() => {}}
          style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}
          disableDrag={true}
          disableResize={true}
          windowId="live-matches"
        >
          <LiveGames 
            matches={gameData.matchList} 
            onSelectMatch={selectMatch} 
            activeMatchId={activeMatchId}
            onAgentClick={(agentId, agentName) => {
              setSelectedAgentId(agentId);
              setSelectedAgentName(agentName);
              updateWindow('agent-stats', { closed: false, minimized: false });
              setFocusedWindow('agent-stats');
            }}
          />
        </Window>
      </div>
      )}

      {/* Agents window */}
      {!wFor('agents').closed && (
        <Window
          title="Agents"
          icon="🤖"
          defaultX={wFor('agents').x} defaultY={wFor('agents').y}
          defaultWidth={wFor('agents').w} defaultHeight={wFor('agents').h}
          minimized={false}
          zIndex={zIndexFor('agents')}
          onFocus={() => bringToFront('agents')}
          minWidth={250} minHeight={200}
          windowId="agents"
          disableResize={true}
          onPositionChange={(x, y) => updateWindow('agents', { x, y })}
          onSizeChange={(w, h) => updateWindow('agents', { w, h })}
        >
          <AgentPanel
            agents={gameData.agents}
            teams={activeMatch?.state?.teams ?? []}
            worms={activeMatch?.worms ?? []}
          />
        </Window>
      )}

      {/* Leaderboard window */}
      {!wFor('leaderboard').closed && (
        <Window
          title="Leaderboard" icon={LB_IMG}
          defaultX={wFor('leaderboard').x} defaultY={wFor('leaderboard').y}
          defaultWidth={wFor('leaderboard').w} defaultHeight={wFor('leaderboard').h}
          minimized={false}
          zIndex={zIndexFor('leaderboard')}
          onFocus={() => bringToFront('leaderboard')}
          minWidth={250} minHeight={150}
          windowId="leaderboard"
          disableResize={true}
          onPositionChange={(x, y) => updateWindow('leaderboard', { x, y })}
          onSizeChange={(w, h) => updateWindow('leaderboard', { w, h })}
        >
          <Leaderboard onAgentClick={(agentId) => {
            setSelectedAgentId(agentId);
            setSelectedAgentName(allAgents[agentId]?.name || agentId);
            updateWindow('agent-stats', { closed: false, minimized: false });
            setFocusedWindow('agent-stats');
          }} />
        </Window>
      )}

      {/* Battle log window */}
      {!wFor('log').closed && (
        <Window
          title="Battle Log" icon={BATTLE_LOG_IMG}
          defaultX={wFor('log').x} defaultY={wFor('log').y}
          defaultWidth={wFor('log').w} defaultHeight={wFor('log').h}
          minimized={false}
          zIndex={zIndexFor('log')}
          onFocus={() => bringToFront('log')}
          minWidth={200} minHeight={120}
          windowId="log"
          disableResize={true}
          onPositionChange={(x, y) => updateWindow('log', { x, y })}
          onSizeChange={(w, h) => updateWindow('log', { w, h })}
        >
          <BattleLog matchData={activeMatch} />
        </Window>
      )}

      {/* Manifesto window */}
      {!wFor('manifesto').closed && (
        <Window
          title="Manifesto — worms.arena" icon={MANIFESTO_IMG}
          defaultX={wFor('manifesto').x} defaultY={wFor('manifesto').y}
          defaultWidth={wFor('manifesto').w} defaultHeight={wFor('manifesto').h}
          minimized={false}
          zIndex={zIndexFor('manifesto')}
          onFocus={() => bringToFront('manifesto')}
          minWidth={300} minHeight={200}
          windowId="manifesto"
          disableResize={true}
          onPositionChange={(x, y) => updateWindow('manifesto', { x, y })}
          onSizeChange={(w, h) => updateWindow('manifesto', { w, h })}
        >
          <Manifesto />
        </Window>
      )}

      {/* Agent Stats window */}
      {!wFor('agent-stats').closed && selectedAgentId && (
        <Window
          title={`Agent Stats — ${selectedAgentName || selectedAgentId}`}
          icon={<img src={getAgentImagePath(selectedAgentId)} alt="" style={{ width: 16, height: 16, imageRendering: 'pixelated', objectFit: 'contain' }} />}
          defaultX={wFor('agent-stats').x}
          defaultY={wFor('agent-stats').y}
          defaultWidth={wFor('agent-stats').w}
          defaultHeight={wFor('agent-stats').h}
          minimized={false}
          zIndex={zIndexFor('agent-stats')}
          onFocus={() => bringToFront('agent-stats')}
          minWidth={600} minHeight={500}
          windowId="agent-stats"
          disableDrag={true}
          disableResize={true}
        >
          <AgentStats agentId={selectedAgentId} onClose={() => {
            closeWindow('agent-stats');
            setSelectedAgentId(null);
          }} />
        </Window>
      )}

      {/* Match Stats window */}
      {!wFor('match-stats').closed && (
        <Window
          title="Match Statistics" icon="📈"
          defaultX={wFor('match-stats').x} defaultY={wFor('match-stats').y}
          defaultWidth={wFor('match-stats').w} defaultHeight={wFor('match-stats').h}
          minimized={false}
          zIndex={zIndexFor('match-stats')}
          onFocus={() => bringToFront('match-stats')}
          minWidth={250} minHeight={200}
          windowId="match-stats"
          disableResize={true}
          onPositionChange={(x, y) => updateWindow('match-stats', { x, y })}
          onSizeChange={(w, h) => updateWindow('match-stats', { w, h })}
        >
          <MatchStats stats={activeMatch?.state?.matchStats} />
        </Window>
      )}

      {/* Weapon Stats window */}
      {!wFor('weapon-stats').closed && (
        <Window
          title="Weapon Statistics" icon="🔫"
          defaultX={wFor('weapon-stats').x} defaultY={wFor('weapon-stats').y}
          defaultWidth={wFor('weapon-stats').w} defaultHeight={wFor('weapon-stats').h}
          minimized={false}
          zIndex={zIndexFor('weapon-stats')}
          onFocus={() => bringToFront('weapon-stats')}
          minWidth={250} minHeight={200}
          windowId="weapon-stats"
          disableResize={true}
          onPositionChange={(x, y) => updateWindow('weapon-stats', { x, y })}
          onSizeChange={(w, h) => updateWindow('weapon-stats', { w, h })}
        >
          <WeaponStats />
        </Window>
      )}

      {/* Taskbar */}
      <Taskbar
        items={taskbarItems}
        onItemClick={toggleMinimize}
        connected={gameData.connected}
        matchCount={gameData.matchList.length}
        musicPlaying={music.playing}
        onMusicToggle={music.toggle}
      />
    </div>
  );
}

// ---- Desktop Icon ----

function DesktopIcon({ icon, onClick }: { icon: React.ReactNode; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      onDoubleClick={onClick}
      style={{
        textAlign: 'center',
        width: 48,
        height: 48,
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
        border: '2px solid #000',
        backgroundColor: '#c0c0c0',
        boxShadow: 'inset -1px -1px 0px #808080, inset 1px 1px 0px #ffffff',
        transition: 'transform 0.2s ease',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.15)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{icon}</div>
    </div>
  );
}
