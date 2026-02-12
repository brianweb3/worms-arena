// ---------------------------------------------------------------------------
// worms.arena — Draggable + Resizable Window (Win98 style)
// ---------------------------------------------------------------------------

import { useRef, useState, useEffect, useCallback, type ReactNode, type CSSProperties } from 'react';

interface Props {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultX?: number;
  defaultY?: number;
  defaultWidth?: number;
  defaultHeight?: number;
  minWidth?: number;
  minHeight?: number;
  minimized?: boolean;
  onMinimize?: () => void;
  onClose?: () => void;
  zIndex?: number;
  onFocus?: () => void;
  style?: CSSProperties;
  disableDrag?: boolean;
  disableResize?: boolean;
  onMaximizeChange?: (maximized: boolean) => void;
  onPositionChange?: (x: number, y: number) => void;
  onSizeChange?: (width: number, height: number) => void;
  windowId?: string;
}

export default function Window({
  title,
  icon,
  children,
  defaultX = 50,
  defaultY = 50,
  defaultWidth = 600,
  defaultHeight = 400,
  minWidth = 200,
  minHeight = 120,
  minimized = false,
  onMinimize,
  onClose,
  zIndex = 1,
  onFocus,
  style,
  disableDrag = false,
  disableResize = false,
  onMaximizeChange,
  onPositionChange,
  onSizeChange,
  windowId,
}: Props) {
  const [pos, setPos] = useState({ x: defaultX, y: defaultY });
  const [size, setSize] = useState({ w: defaultWidth, h: defaultHeight });
  const [maximized, setMaximized] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  // Sync position and size with props when they change
  useEffect(() => {
    setPos({ x: defaultX, y: defaultY });
  }, [defaultX, defaultY]);

  useEffect(() => {
    setSize({ w: defaultWidth, h: defaultHeight });
  }, [defaultWidth, defaultHeight]);

  const handleTitleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (maximized || disableDrag) return;
      e.preventDefault();
      onFocus?.();
      dragRef.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };

      const onMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        const newX = dragRef.current.origX + ev.clientX - dragRef.current.startX;
        const newY = dragRef.current.origY + ev.clientY - dragRef.current.startY;
        setPos({ x: newX, y: newY });
        onPositionChange?.(newX, newY);
      };
      const onUp = () => {
        dragRef.current = null;
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [pos, onFocus, maximized, disableDrag],
  );

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (maximized || disableResize) return;
      e.preventDefault();
      e.stopPropagation();
      onFocus?.();
      const startX = e.clientX;
      const startY = e.clientY;
      const origW = size.w;
      const origH = size.h;

      const onMove = (ev: MouseEvent) => {
        const newSize = {
          w: Math.max(minWidth, origW + ev.clientX - startX),
          h: Math.max(minHeight, origH + ev.clientY - startY),
        };
        setSize(newSize);
        onSizeChange?.(newSize.w, newSize.h);
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [size, onFocus, maximized, minWidth, minHeight, disableResize],
  );

  if (minimized) return null;

  const windowStyle: CSSProperties = maximized
    ? { position: 'absolute', left: 0, top: 0, width: '100%', height: 'calc(100% - 36px)', zIndex }
    : { position: 'absolute', left: pos.x, top: pos.y, width: size.w, height: size.h, zIndex };

  return (
    <div
      className="window"
      style={{
        ...windowStyle,
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
      onMouseDown={() => onFocus?.()}
    >
      <div
        className="title-bar"
        onMouseDown={handleTitleMouseDown}
        style={{ cursor: maximized ? 'default' : 'grab', flexShrink: 0 }}
      >
        <div className="title-bar-text" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
          {title}
        </div>
        <div className="title-bar-controls">
          <button
            aria-label="Maximize"
            onClick={(e) => {
              e.stopPropagation();
              const newMaximized = !maximized;
              setMaximized(newMaximized);
              onMaximizeChange?.(newMaximized);
            }}
          />
        </div>
      </div>
      <div
        className="window-body"
        style={{ flex: 1, overflow: 'hidden', padding: 2, display: 'flex', flexDirection: 'column', position: 'relative' }}
      >
        {children}
      </div>
      {!maximized && !disableResize && (
        <div
          onMouseDown={handleResizeMouseDown}
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: 16,
            height: 16,
            cursor: 'nwse-resize',
            background:
              'linear-gradient(135deg, transparent 50%, #808080 50%, transparent 55%, transparent 60%, #808080 60%, transparent 65%, transparent 70%, #808080 70%, transparent 75%)',
            zIndex: 1001,
          }}
        />
      )}
    </div>
  );
}
