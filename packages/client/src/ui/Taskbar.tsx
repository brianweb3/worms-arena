// ---------------------------------------------------------------------------
// worms.arena — Taskbar (Win98-style)
// ---------------------------------------------------------------------------

import { useState, useEffect } from 'react';

interface TaskbarItem {
  id: string;
  title: string;
  icon?: React.ReactNode;
  minimized: boolean;
}

interface Props {
  items: TaskbarItem[];
  onItemClick: (id: string) => void;
  connected: boolean;
  matchCount: number;
  musicPlaying: boolean;
  onMusicToggle: () => void;
}

export default function Taskbar({ items, onItemClick, connected, matchCount, musicPlaying, onMusicToggle }: Props) {
  const [time, setTime] = useState(formatTime());

  useEffect(() => {
    const interval = setInterval(() => setTime(formatTime()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 34,
        background: '#c0c0c0',
        borderTop: '2px solid #ffffff',
        borderBottom: '2px solid #808080',
        display: 'flex',
        alignItems: 'center',
        padding: '2px 2px',
        gap: 4,
        zIndex: 9999,
      }}
    >
      {/* Start button */}
      <button
        type="button"
        className="button"
        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', fontSize: 11 }}
      >
        <img src="/assets/logo.png" alt="" style={{ width: 16, height: 16, imageRendering: 'pixelated' }} />
        Start
      </button>

      {/* Taskbar items */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          gap: 2,
          overflow: 'hidden',
          paddingLeft: 2,
        }}
      >
        {items.map((item) => (
          <button
            type="button"
            key={item.id}
            className="button"
            onClick={() => onItemClick(item.id)}
            style={{
              flex: '0 0 auto',
              maxWidth: 180,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              padding: '2px 8px',
              fontSize: 11,
              fontWeight: item.minimized ? 'normal' : 'bold',
            }}
          >
            {item.title}
          </button>
        ))}
      </div>

      {/* System tray */}
      <div
        className="status-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '0 6px',
          fontSize: 10,
        }}
      >
        <button
          type="button"
          className="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMusicToggle();
          }}
          style={{ padding: '0 4px', fontSize: 10 }}
          title={musicPlaying ? 'Mute music' : 'Play music'}
        >
          {musicPlaying ? '🔊' : '🔇'}
        </button>
        <span title={`${matchCount} live matches`}>⚔️ {matchCount}</span>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: connected ? '#00aa00' : '#cc0000',
          }}
        />
        <span>{time}</span>
      </div>
    </div>
  );
}

function formatTime(): string {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
