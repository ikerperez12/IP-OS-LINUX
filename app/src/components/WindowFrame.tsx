// ============================================================
// WindowFrame — Draggable, resizable window chrome
// ============================================================

import { useCallback, useRef, useState, memo, useEffect } from 'react';
import type { Window } from '@/types';
import { useOS } from '@/hooks/useOSStore';
import * as Icons from 'lucide-react';
import type { LucideProps } from 'lucide-react';

const TOP_PANEL_HEIGHT = 28;
const RESIZE_HANDLE = 8;
const MIN_W = 320;
const MIN_H = 200;

const DynamicIcon = ({ name, ...props }: { name: string } & LucideProps) => {
  const IconComp = (Icons as unknown as unknown as Record<string, React.ComponentType<LucideProps>>)[name];
  return IconComp ? <IconComp {...props} /> : <Icons.HelpCircle {...props} />;
};

interface WindowFrameProps {
  window: Window;
  children: React.ReactNode;
}

const WindowFrame = memo(function WindowFrame({ window: win, children }: WindowFrameProps) {
  const { dispatch } = useOS();
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ isDragging: boolean; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{ isResizing: boolean; edge: string; startX: number; startY: number; origW: number; origH: number; origX: number; origY: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const isMaximized = win.state === 'maximized';
  const isMinimized = win.state === 'minimized';
  const isFocused = win.isFocused;

  const focusThis = useCallback(() => {
    if (!win.isFocused && win.state !== 'minimized') {
      dispatch({ type: 'FOCUS_WINDOW', windowId: win.id });
    }
  }, [dispatch, win.id, win.isFocused, win.state]);

  const handleMouseDown = useCallback(() => {
    focusThis();
  }, [focusThis]);

  // ---- Drag ----
  const handleTitleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isMaximized) return;
      // Don't drag if clicking on buttons
      if ((e.target as HTMLElement).closest('.traffic-group')) return;
      e.preventDefault();
      dragRef.current = {
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        origX: win.position.x,
        origY: win.position.y,
      };
      setIsDragging(true);
    },
    [isMaximized, win.position.x, win.position.y]
  );

  // ---- Resize ----
  const getEdge = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    let edge = '';
    if (y < RESIZE_HANDLE) edge += 'n';
    if (y > rect.height - RESIZE_HANDLE) edge += 's';
    if (x < RESIZE_HANDLE) edge += 'w';
    if (x > rect.width - RESIZE_HANDLE) edge += 'e';
    return edge;
  }, []);

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isMaximized) return;
      const edge = getEdge(e);
      if (!edge) return;
      e.preventDefault();
      e.stopPropagation();
      resizeRef.current = {
        isResizing: true,
        edge,
        startX: e.clientX,
        startY: e.clientY,
        origW: win.size.width,
        origH: win.size.height,
        origX: win.position.x,
        origY: win.position.y,
      };
      setIsResizing(true);
    },
    [isMaximized, getEdge, win.size, win.position]
  );

  // ---- Global mouse events for drag/resize ----
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragRef.current?.isDragging) {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        let nx = dragRef.current.origX + dx;
        let ny = dragRef.current.origY + dy;
        const vw = window.innerWidth;
        ny = Math.max(TOP_PANEL_HEIGHT, ny);
        nx = Math.min(Math.max(nx, -(win.size.width - 100)), vw - 100);
        dispatch({ type: 'MOVE_WINDOW', windowId: win.id, position: { x: nx, y: ny } });
      }
      if (resizeRef.current?.isResizing) {
        const { edge, startX, startY, origW, origH, origX, origY } = resizeRef.current;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        let nx = origX, ny = origY, nw = origW, nh = origH;
        if (edge.includes('e')) nw = Math.max(MIN_W, origW + dx);
        if (edge.includes('s')) nh = Math.max(MIN_H, origH + dy);
        if (edge.includes('w')) {
          nw = Math.max(MIN_W, origW - dx);
          nx = origX + (origW - nw);
        }
        if (edge.includes('n')) {
          nh = Math.max(MIN_H, origH - dy);
          ny = origY + (origH - nh);
          ny = Math.max(TOP_PANEL_HEIGHT, ny);
        }
        dispatch({ type: 'MOVE_WINDOW', windowId: win.id, position: { x: nx, y: ny } });
        dispatch({ type: 'RESIZE_WINDOW', windowId: win.id, size: { width: nw, height: nh } });
      }
    };
    const onUp = () => {
      dragRef.current = null;
      resizeRef.current = null;
      setIsDragging(false);
      setIsResizing(false);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dispatch, win.id, win.size.width, win.size.height]);

  const handleMinimize = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      dispatch({ type: 'MINIMIZE_WINDOW', windowId: win.id });
    },
    [dispatch, win.id]
  );

  const handleMaximize = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isMaximized) {
        dispatch({ type: 'RESTORE_WINDOW', windowId: win.id });
      } else {
        dispatch({ type: 'MAXIMIZE_WINDOW', windowId: win.id });
      }
    },
    [dispatch, win.id, isMaximized]
  );

  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      dispatch({ type: 'CLOSE_WINDOW', windowId: win.id });
    },
    [dispatch, win.id]
  );

  const handleDoubleClickTitle = useCallback(() => {
    if (isMaximized) {
      dispatch({ type: 'RESTORE_WINDOW', windowId: win.id });
    } else {
      dispatch({ type: 'MAXIMIZE_WINDOW', windowId: win.id });
    }
  }, [dispatch, win.id, isMaximized]);

  if (isMinimized) return null;

  return (
    <div
      ref={frameRef}
      className={`absolute flex flex-col select-none ${isFocused ? 'window-glow-focused' : 'window-glow-unfocused'}`}
      style={{
        left: win.position.x,
        top: win.position.y,
        width: win.size.width,
        height: win.size.height,
        zIndex: win.zIndex,
        borderRadius: isMaximized ? 0 : 12,
        background: 'rgba(30, 30, 35, 0.85)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: `1px solid ${isFocused ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)'}`,
        transition: isDragging || isResizing ? 'none' : 'box-shadow 200ms ease, border-color 200ms ease',
        overflow: 'hidden',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Resize handles */}
      <div className="absolute inset-0 z-50 pointer-events-none">
        <div onMouseDown={handleResizeMouseDown} style={{ position: 'absolute', top: 0, left: RESIZE_HANDLE, right: RESIZE_HANDLE, height: RESIZE_HANDLE, cursor: 'n-resize', pointerEvents: isDragging ? 'none' : 'auto' }} />
        <div onMouseDown={handleResizeMouseDown} style={{ position: 'absolute', bottom: 0, left: RESIZE_HANDLE, right: RESIZE_HANDLE, height: RESIZE_HANDLE, cursor: 's-resize', pointerEvents: isDragging ? 'none' : 'auto' }} />
        <div onMouseDown={handleResizeMouseDown} style={{ position: 'absolute', left: 0, top: RESIZE_HANDLE, bottom: RESIZE_HANDLE, width: RESIZE_HANDLE, cursor: 'w-resize', pointerEvents: isDragging ? 'none' : 'auto' }} />
        <div onMouseDown={handleResizeMouseDown} style={{ position: 'absolute', right: 0, top: RESIZE_HANDLE, bottom: RESIZE_HANDLE, width: RESIZE_HANDLE, cursor: 'e-resize', pointerEvents: isDragging ? 'none' : 'auto' }} />
        <div onMouseDown={handleResizeMouseDown} style={{ position: 'absolute', top: 0, left: 0, width: RESIZE_HANDLE * 2, height: RESIZE_HANDLE * 2, cursor: 'nw-resize', pointerEvents: isDragging ? 'none' : 'auto' }} />
        <div onMouseDown={handleResizeMouseDown} style={{ position: 'absolute', top: 0, right: 0, width: RESIZE_HANDLE * 2, height: RESIZE_HANDLE * 2, cursor: 'ne-resize', pointerEvents: isDragging ? 'none' : 'auto' }} />
        <div onMouseDown={handleResizeMouseDown} style={{ position: 'absolute', bottom: 0, left: 0, width: RESIZE_HANDLE * 2, height: RESIZE_HANDLE * 2, cursor: 'sw-resize', pointerEvents: isDragging ? 'none' : 'auto' }} />
        <div onMouseDown={handleResizeMouseDown} style={{ position: 'absolute', bottom: 0, right: 0, width: RESIZE_HANDLE * 2, height: RESIZE_HANDLE * 2, cursor: 'se-resize', pointerEvents: isDragging ? 'none' : 'auto' }} />
      </div>

      {/* Title bar */}
      <div
        className="relative z-10 flex items-center shrink-0"
        style={{
          height: 38,
          background: isFocused
            ? 'rgba(25, 25, 30, 0.65)'
            : 'rgba(20, 20, 25, 0.4)',
          backdropFilter: 'blur(16px) saturate(180%)',
          WebkitBackdropFilter: 'blur(16px) saturate(180%)',
          borderRadius: isMaximized ? 0 : '12px 12px 0 0',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          boxShadow: isFocused ? 'inset 0 1px 0 rgba(255,255,255,0.08)' : 'none',
          transition: 'background 150ms ease, box-shadow 150ms ease',
          cursor: isMaximized ? 'default' : 'grab',
        }}
        onMouseDown={handleTitleMouseDown}
        onDoubleClick={handleDoubleClickTitle}
      >
        {/* Left: Traffic light buttons */}
        <div className="traffic-group flex items-center gap-[7px] pl-4 pr-3 relative z-[60]">
          <button
            onClick={handleClose}
            className={`traffic-btn ${isFocused ? 'traffic-close' : 'traffic-unfocused'}`}
            title="Close"
          >
            <Icons.X size={8} strokeWidth={2.5} color="#4D0000" />
          </button>
          <button
            onClick={handleMinimize}
            className={`traffic-btn ${isFocused ? 'traffic-minimize' : 'traffic-unfocused'}`}
            title="Minimize"
          >
            <Icons.Minus size={8} strokeWidth={2.5} color="#995700" />
          </button>
          <button
            onClick={handleMaximize}
            className={`traffic-btn ${isFocused ? 'traffic-maximize' : 'traffic-unfocused'}`}
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? (
              <Icons.Columns2 size={7} strokeWidth={2.5} color="#006500" />
            ) : (
              <Icons.Maximize2 size={7} strokeWidth={2.5} color="#006500" />
            )}
          </button>
        </div>

        {/* Center: icon + title */}
        <div className="flex-1 flex items-center justify-center gap-2 overflow-hidden px-2">
          <DynamicIcon name={win.icon} size={14} className="shrink-0" style={{ color: isFocused ? 'var(--text-secondary)' : 'var(--text-disabled)' }} />
          <span
            className="text-[12px] font-medium truncate"
            style={{
              color: isFocused ? 'var(--text-primary)' : 'var(--text-disabled)',
              transition: 'color 150ms ease',
            }}
          >
            {win.title}
          </span>
        </div>

        {/* Right: spacer to balance the traffic lights */}
        <div style={{ width: 72 }} />
      </div>

      {/* Body */}
      <div
        className="relative z-10 flex-1 overflow-hidden"
        style={{
          background: 'var(--bg-window)',
          borderRadius: isMaximized ? 0 : '0 0 12px 12px',
        }}
      >
        {children}
      </div>
    </div>
  );
});

export default WindowFrame;
