// ---------------------------------------------------------------------------
// worms.arena — Loading Screen
// ---------------------------------------------------------------------------

import { useEffect, useState } from 'react';

interface Props {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: Props) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 2 + Math.random() * 3;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 400);
          return 100;
        }
        return next;
      });
    }, 60);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#008080',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"MS Sans Serif", Arial, sans-serif',
      }}
    >
      {/* Window-style container */}
      <div
        className="window"
        style={{
          width: 500,
          minHeight: 200,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Title bar */}
        <div
          className="title-bar"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '2px 4px',
            background: '#c0c0c0',
            borderBottom: '2px solid #808080',
          }}
        >
          <div className="title-bar-text" style={{ fontWeight: 'bold', fontSize: 11 }}>
            worms.arena
          </div>
        </div>

        {/* Window body */}
        <div
          className="window-body"
          style={{
            padding: 20,
            background: '#c0c0c0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
          }}
        >
          {/* Logo */}
          <div
            style={{
              fontSize: 28,
              color: '#000',
              textAlign: 'center',
              fontWeight: 'bold',
              fontFamily: "'DM Mono', monospace",
              letterSpacing: '2px',
            }}
          >
            worms.arena
          </div>

          {/* Progress bar */}
          <div
            style={{
              width: '100%',
              height: 24,
              backgroundColor: '#e0e0e0',
              border: '2px solid #808080',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: '#000080',
                transition: 'width 0.1s linear',
              }}
            />
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: 11,
                fontWeight: 'bold',
                color: progress > 50 ? '#fff' : '#000',
              }}
            >
              {Math.round(progress)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
