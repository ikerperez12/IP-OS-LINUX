// ============================================================
// WindowFrame — Draggable, resizable window chrome
// ============================================================

import { useCallback, useRef, useState, memo, useEffect } from 'react';
import type { Window } from '@/types';
import { useOS } from '@/hooks/useOSStore';
import { Columns2, Maximize2, Minus, X } from 'lucide-react';
import SystemIcon from './SystemIcon';

const TOP_PANEL_HEIGHT = 28;
const RESIZE_HANDLE = 8;
const MIN_W = 320;
const MIN_H = 200;

interface WindowFrameProps {
  window: Window;
  children: React.ReactNode;
}

type SnapZone = 'left' | 'right' | 'top' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null;

function detectSnapZone(x: number, y: number, vw: number, vh: number): SnapZone {
  const margin = 18;
  const top = TOP_PANEL_HEIGHT + 6;
  const dockReserve = 92;
  if (y < top + margin) {
    if (x < vw * 0.18) return 'top-left';
    if (x > vw * 0.82) return 'top-right';
    return 'top';
  }
  if (y > vh - dockReserve - margin) {
    if (x < vw * 0.18) return 'bottom-left';
    if (x > vw * 0.82) return 'bottom-right';
  }
  if (x < margin) return 'left';
  if (x > vw - margin) return 'right';
  return null;
}

function commitSnap(
  zone: Exclude<SnapZone, null>,
  vw: number,
  vh: number,
  win: { id: string },
  dispatch: (a: { type: string; [k: string]: unknown }) => void
) {
  const top = TOP_PANEL_HEIGHT;
  const dockReserve = 96;
  const w = vw, hAvail = vh - top - dockReserve;
  let pos = { x: 0, y: top };
  let size = { width: w, height: hAvail };
  switch (zone) {
    case 'left': size = { width: w / 2, height: hAvail }; break;
    case 'right': pos = { x: w / 2, y: top }; size = { width: w / 2, height: hAvail }; break;
    case 'top': size = { width: w, height: hAvail }; break;
    case 'top-left': size = { width: w / 2, height: hAvail / 2 }; break;
    case 'top-right': pos = { x: w / 2, y: top }; size = { width: w / 2, height: hAvail / 2 }; break;
    case 'bottom-left': pos = { x: 0, y: top + hAvail / 2 }; size = { width: w / 2, height: hAvail / 2 }; break;
    case 'bottom-right': pos = { x: w / 2, y: top + hAvail / 2 }; size = { width: w / 2, height: hAvail / 2 }; break;
  }
  dispatch({ type: 'MOVE_WINDOW', windowId: win.id, position: pos });
  dispatch({ type: 'RESIZE_WINDOW', windowId: win.id, size });
}

const WindowFrame = memo(function WindowFrame({ window: win, children }: WindowFrameProps) {
  const { state, dispatch } = useOS();
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ isDragging: boolean; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{ isResizing: boolean; edge: string; startX: number; startY: number; origW: number; origH: number; origX: number; origY: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const isMaximized = win.state === 'maximized';
  const isMinimized = win.state === 'minimized';
  const isFocused = win.isFocused;
  const viewportWidth = typeof window === 'undefined' ? win.size.width : window.innerWidth;
  const viewportHeight = typeof window === 'undefined' ? win.size.height + TOP_PANEL_HEIGHT : window.innerHeight;
  const mobileViewport = viewportWidth <= 760;
  const lockedLayout = isMaximized || mobileViewport;
  const bottomReserve = mobileViewport ? 132 : 96;
  const maxFrameWidth = Math.max(MIN_W, viewportWidth - (mobileViewport ? 0 : 16));
  const maxFrameHeight = Math.max(MIN_H, viewportHeight - TOP_PANEL_HEIGHT - bottomReserve);
  const frameWidth = lockedLayout ? viewportWidth : Math.min(win.size.width, maxFrameWidth);
  const frameHeight = lockedLayout ? maxFrameHeight : Math.min(win.size.height, maxFrameHeight);
  const frameLeft = lockedLayout
    ? 0
    : Math.min(Math.max(win.position.x, 8), Math.max(8, viewportWidth - frameWidth - 8));
  const frameTop = lockedLayout
    ? TOP_PANEL_HEIGHT
    : Math.min(Math.max(win.position.y, TOP_PANEL_HEIGHT), Math.max(TOP_PANEL_HEIGHT, viewportHeight - frameHeight - bottomReserve));

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
      if (lockedLayout) return;
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
    [lockedLayout, win.position.x, win.position.y]
  );

  // ---- Resize ----
  const handleResizeMouseDown = useCallback(
    (edge: string) => (e: React.MouseEvent<HTMLDivElement>) => {
      if (lockedLayout) return;
      if (!edge) return;
      e.preventDefault();
      e.stopPropagation();
      focusThis();
      resizeRef.current = {
        isResizing: true,
        edge,
        startX: e.clientX,
        startY: e.clientY,
        origW: frameWidth,
        origH: frameHeight,
        origX: frameLeft,
        origY: frameTop,
      };
      setIsResizing(true);
    },
    [lockedLayout, focusThis, frameWidth, frameHeight, frameLeft, frameTop]
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
        const zone = detectSnapZone(e.clientX, e.clientY, vw, window.innerHeight);
        window.dispatchEvent(new CustomEvent('iplinux:snap-zone', { detail: { zone } }));
      }
      if (resizeRef.current?.isResizing) {
        const { edge, startX, startY, origW, origH, origX, origY } = resizeRef.current;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;
        const minLeft = 8;
        const minTop = TOP_PANEL_HEIGHT;
        const maxRight = Math.max(MIN_W + minLeft, viewportW - 8);
        const maxBottom = Math.max(MIN_H + minTop, viewportH - bottomReserve);
        const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

        let left = origX;
        let top = origY;
        let right = origX + origW;
        let bottom = origY + origH;

        if (edge.includes('w')) left = clamp(origX + dx, minLeft, right - MIN_W);
        if (edge.includes('e')) right = clamp(origX + origW + dx, left + MIN_W, maxRight);
        if (edge.includes('n')) top = clamp(origY + dy, minTop, bottom - MIN_H);
        if (edge.includes('s')) bottom = clamp(origY + origH + dy, top + MIN_H, maxBottom);

        const nx = left;
        const ny = top;
        const nw = Math.round(right - left);
        const nh = Math.round(bottom - top);
        dispatch({ type: 'MOVE_WINDOW', windowId: win.id, position: { x: nx, y: ny } });
        dispatch({ type: 'RESIZE_WINDOW', windowId: win.id, size: { width: nw, height: nh } });
      }
    };
    const onUp = (e: MouseEvent) => {
      if (dragRef.current?.isDragging) {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const zone = detectSnapZone(e.clientX, e.clientY, vw, vh);
        if (zone) commitSnap(zone, vw, vh, win, dispatch as (a: { type: string; [k: string]: unknown }) => void);
        window.dispatchEvent(new CustomEvent('iplinux:snap-zone', { detail: { zone: null } }));
      }
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
  }, [bottomReserve, dispatch, win.id, win.size.width, win.size.height]);

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
        left: frameLeft,
        top: frameTop,
        width: frameWidth,
        height: frameHeight,
        zIndex: win.zIndex,
        borderRadius: lockedLayout ? 0 : 12,
        background: 'rgba(30, 30, 35, 0.85)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        border: `1px solid ${isFocused ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)'}`,
        transition: isDragging || isResizing
          ? 'none'
          : (state.uiPreferences.wobblyWindows
              ? 'transform 320ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 200ms ease, border-color 200ms ease'
              : 'box-shadow 200ms ease, border-color 200ms ease'),
        transform: isDragging && state.uiPreferences.wobblyWindows ? 'rotate(0.4deg) scale(1.005)' : 'none',
        boxShadow: state.uiPreferences.dynamicShadows
          ? (() => {
              const cx = win.position.x + win.size.width / 2;
              const cy = win.position.y + win.size.height / 2;
              const dx = (cx - window.innerWidth / 2) / window.innerWidth;
              const dy = (cy - window.innerHeight / 2) / window.innerHeight;
              const ox = Math.round(-dx * 36);
              const oy = Math.round(-dy * 28 + 24);
              return `${ox}px ${oy}px ${isFocused ? 60 : 30}px rgba(0,0,0,${isFocused ? 0.55 : 0.32})`;
            })()
          : (isFocused ? '0 24px 60px rgba(0,0,0,0.5)' : '0 12px 30px rgba(0,0,0,0.32)'),
        overflow: 'hidden',
      }}
      onMouseDown={handleMouseDown}
    >
      {state.uiPreferences.edgeSheen && (
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 right-0 top-0 z-40"
          style={{
            height: 18,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0))',
            mixBlendMode: 'overlay' as const,
          }}
        />
      )}
      {!lockedLayout && (
        <div aria-hidden="true" className="absolute inset-0 z-50 pointer-events-none">
          <div onMouseDown={handleResizeMouseDown('n')} style={{ position: 'absolute', top: 0, left: RESIZE_HANDLE * 2, right: RESIZE_HANDLE * 2, height: RESIZE_HANDLE, cursor: 'n-resize', pointerEvents: isDragging ? 'none' : 'auto' }} />
          <div onMouseDown={handleResizeMouseDown('s')} style={{ position: 'absolute', bottom: 0, left: RESIZE_HANDLE * 2, right: RESIZE_HANDLE * 2, height: RESIZE_HANDLE + 4, cursor: 's-resize', pointerEvents: isDragging ? 'none' : 'auto' }} />
          <div onMouseDown={handleResizeMouseDown('w')} style={{ position: 'absolute', left: 0, top: RESIZE_HANDLE * 2, bottom: RESIZE_HANDLE * 2, width: RESIZE_HANDLE, cursor: 'w-resize', pointerEvents: isDragging ? 'none' : 'auto' }} />
          <div onMouseDown={handleResizeMouseDown('e')} style={{ position: 'absolute', right: 0, top: RESIZE_HANDLE * 2, bottom: RESIZE_HANDLE * 2, width: RESIZE_HANDLE, cursor: 'e-resize', pointerEvents: isDragging ? 'none' : 'auto' }} />
          <div onMouseDown={handleResizeMouseDown('nw')} style={{ position: 'absolute', top: 0, left: 0, width: RESIZE_HANDLE * 2, height: RESIZE_HANDLE * 2, cursor: 'nw-resize', pointerEvents: isDragging ? 'none' : 'auto' }} />
          <div onMouseDown={handleResizeMouseDown('ne')} style={{ position: 'absolute', top: 0, right: 0, width: RESIZE_HANDLE * 2, height: RESIZE_HANDLE * 2, cursor: 'ne-resize', pointerEvents: isDragging ? 'none' : 'auto' }} />
          <div onMouseDown={handleResizeMouseDown('sw')} style={{ position: 'absolute', bottom: 0, left: 0, width: RESIZE_HANDLE * 2, height: RESIZE_HANDLE * 2, cursor: 'sw-resize', pointerEvents: isDragging ? 'none' : 'auto' }} />
          <div onMouseDown={handleResizeMouseDown('se')} style={{ position: 'absolute', bottom: 0, right: 0, width: RESIZE_HANDLE * 2.5, height: RESIZE_HANDLE * 2.5, cursor: 'se-resize', pointerEvents: isDragging ? 'none' : 'auto' }} />
          <div
            className="absolute bottom-1.5 right-1.5 h-3 w-3 rounded-sm opacity-45"
            style={{
              background:
                'linear-gradient(135deg, transparent 0 35%, rgba(255,255,255,0.45) 36% 46%, transparent 47% 60%, rgba(255,255,255,0.32) 61% 72%, transparent 73%)',
            }}
          />
        </div>
      )}

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
          borderRadius: lockedLayout ? 0 : '12px 12px 0 0',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          boxShadow: isFocused ? 'inset 0 1px 0 rgba(255,255,255,0.08)' : 'none',
          transition: 'background 150ms ease, box-shadow 150ms ease',
          cursor: lockedLayout ? 'default' : 'grab',
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
            aria-label={`Close ${win.title}`}
          >
            <X size={8} strokeWidth={2.5} color="#4D0000" />
          </button>
          <button
            onClick={handleMinimize}
            className={`traffic-btn ${isFocused ? 'traffic-minimize' : 'traffic-unfocused'}`}
            title="Minimize"
            aria-label={`Minimize ${win.title}`}
          >
            <Minus size={8} strokeWidth={2.5} color="#995700" />
          </button>
          <button
            onClick={handleMaximize}
            className={`traffic-btn ${isFocused ? 'traffic-maximize' : 'traffic-unfocused'}`}
            title={isMaximized ? 'Restore' : 'Maximize'}
            aria-label={`${isMaximized ? 'Restore' : 'Maximize'} ${win.title}`}
          >
            {isMaximized ? (
              <Columns2 size={7} strokeWidth={2.5} color="#006500" />
            ) : (
              <Maximize2 size={7} strokeWidth={2.5} color="#006500" />
            )}
          </button>
        </div>

        {/* Center: icon + title */}
        <div className="flex-1 flex items-center justify-center gap-2 overflow-hidden px-2">
          <SystemIcon appId={win.appId} name={win.icon} size={16} className="shrink-0" style={{ color: isFocused ? 'var(--text-secondary)' : 'var(--text-disabled)' }} />
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
          borderRadius: lockedLayout ? 0 : '0 0 12px 12px',
        }}
      >
        {children}
      </div>
    </div>
  );
});

export default WindowFrame;
