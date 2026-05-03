// ============================================================
// Dock — Bottom dock with magnification, colorful AppIcons
// ============================================================

import { useCallback, memo, useState, useEffect } from 'react';
import { useOS } from '@/hooks/useOSStore';
import { getAppById } from '@/apps/registry';
import AppIcon from './AppIcon';

const Dock = memo(function Dock() {
  const { state, dispatch } = useOS();
  const { dockItems } = state;
  const [bouncingItems, setBouncingItems] = useState<Set<string>>(new Set());
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Bounce animation cleanup
  useEffect(() => {
    const bouncing = dockItems.filter((d) => d.bounce).map((d) => d.appId);
    if (bouncing.length > 0) {
      setBouncingItems((prev) => new Set([...prev, ...bouncing]));
      dispatch({ type: 'BOUNCE_DOCK_ITEM', appId: bouncing[0] });
      const timer = setTimeout(() => setBouncingItems(new Set()), 400);
      return () => clearTimeout(timer);
    }
  }, [dockItems, dispatch]);

  const handleAppClick = useCallback(
    (appId: string) => {
      const activeWin = state.windows.find((w) => w.appId === appId && w.state !== 'minimized');
      if (activeWin) {
        dispatch({ type: 'FOCUS_WINDOW', windowId: activeWin.id });
      } else {
        const minWin = state.windows.find((w) => w.appId === appId && w.state === 'minimized');
        if (minWin) {
          dispatch({ type: 'RESTORE_WINDOW', windowId: minWin.id });
          dispatch({ type: 'FOCUS_WINDOW', windowId: minWin.id });
        } else {
          dispatch({ type: 'OPEN_WINDOW', appId });
        }
      }
    },
    [dispatch, state.windows]
  );

  const handleShowApps = useCallback(() => {
    dispatch({ type: 'TOGGLE_APP_LAUNCHER' });
  }, [dispatch]);

  const handleTrashClick = useCallback(() => {
    dispatch({ type: 'OPEN_WINDOW', appId: 'filemanager' });
  }, [dispatch]);

  const pinnedItems = dockItems.filter((d) => d.isPinned);
  const openUnpinned = dockItems.filter((d) => !d.isPinned && d.isOpen);
  const allItems = [...pinnedItems, ...openUnpinned];

  // Magnification scale calculation
  const getScale = (index: number) => {
    if (hoveredIndex === null) return 1;
    const distance = Math.abs(index - hoveredIndex);
    if (distance === 0) return 1.45;
    if (distance === 1) return 1.2;
    if (distance === 2) return 1.08;
    return 1;
  };

  const getTranslateY = (index: number) => {
    if (hoveredIndex === null) return 0;
    const distance = Math.abs(index - hoveredIndex);
    if (distance === 0) return -12;
    if (distance === 1) return -5;
    if (distance === 2) return -2;
    return 0;
  };

  const renderDockIcon = (appId: string, globalIndex: number, isTrash = false) => {
    const item = dockItems.find((d) => d.appId === appId);
    if (!item && !isTrash) return null;

    const app = getAppById(appId);
    const isBouncing = bouncingItems.has(appId);
    const isOpen = item?.isOpen || false;
    const isFocused = item?.isFocused || false;
    const scale = isTrash ? 1 : getScale(globalIndex);
    const ty = isTrash ? 0 : getTranslateY(globalIndex);

    return (
      <div
        key={appId}
        className="relative flex flex-col items-center"
        onMouseEnter={() => !isTrash && setHoveredIndex(globalIndex)}
        onMouseLeave={() => setHoveredIndex(null)}
        style={{
          transformOrigin: 'bottom center',
          transform: `scale(${isBouncing ? 1 : scale}) translateY(${isBouncing ? -10 : ty}px)`,
          transition: isBouncing
            ? 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)'
            : 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Tooltip */}
        {hoveredIndex === globalIndex && (
          <div
            className="absolute bottom-full mb-3 px-2.5 py-1 rounded-md text-[10px] font-medium whitespace-nowrap z-[4000]"
            style={{
              background: 'rgba(20,20,25,0.9)',
              backdropFilter: 'blur(8px)',
              color: 'var(--text-primary)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.08)',
              animation: 'tooltipAppear 100ms ease',
            }}
          >
            {isTrash ? 'Trash' : app?.name || appId}
          </div>
        )}

        {/* Colorful Icon */}
        <button
          onClick={() => isTrash ? handleTrashClick() : handleAppClick(appId)}
          className="flex items-center justify-center transition-all ripple-container"
          style={{
            borderRadius: 14,
            padding: 2,
            opacity: isTrash ? 0.8 : 1,
            filter: hoveredIndex === globalIndex ? 'brightness(1.15)' : 'brightness(1)',
          }}
        >
          {isTrash ? (
            <AppIcon appId="filemanager" size={44} />
          ) : (
            <AppIcon appId={appId} size={44} />
          )}
        </button>

        {/* Active indicator */}
        {isOpen && (
          <div
            className="absolute -bottom-1.5 rounded-full"
            style={{
              width: isFocused ? 6 : 4,
              height: isFocused ? 6 : 4,
              background: isFocused
                ? 'var(--accent-primary)'
                : 'rgba(255,255,255,0.4)',
              boxShadow: isFocused
                ? '0 0 8px rgba(124,77,255,0.5)'
                : 'none',
              transition: 'all 200ms ease',
              animation: 'dotAppear 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div
      className="fixed bottom-2 left-1/2 -translate-x-1/2 z-[150] flex items-end gap-1 px-3 pb-2 pt-1.5"
      style={{
        background: 'rgba(20, 20, 25, 0.55)',
        backdropFilter: 'blur(28px) saturate(220%)',
        WebkitBackdropFilter: 'blur(28px) saturate(220%)',
        borderRadius: 20,
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        animation: 'dockSlideUp 400ms cubic-bezier(0, 0, 0.2, 1)',
      }}
      onMouseLeave={() => setHoveredIndex(null)}
    >
      {/* Show Applications button */}
      <div className="relative flex flex-col items-center" style={{ transformOrigin: 'bottom center' }}>
        <button
          onClick={handleShowApps}
          className="flex items-center justify-center transition-all ripple-container"
          style={{
            borderRadius: 14,
            background: state.appLauncherOpen
              ? 'rgba(124,77,255,0.2)'
              : 'transparent',
          }}
        >
          <div
            className="flex items-center justify-center"
            style={{
              width: 44, height: 44,
              borderRadius: 12,
              background: state.appLauncherOpen
                ? 'linear-gradient(145deg, #7C4DFF, #311B92)'
                : 'rgba(255,255,255,0.08)',
            }}
          >
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="7" rx="2" fill="rgba(255,255,255,0.8)"/>
              <rect x="14" y="3" width="7" height="7" rx="2" fill="rgba(255,255,255,0.8)"/>
              <rect x="3" y="14" width="7" height="7" rx="2" fill="rgba(255,255,255,0.8)"/>
              <rect x="14" y="14" width="7" height="7" rx="2" fill="rgba(255,255,255,0.8)"/>
            </svg>
          </div>
        </button>
      </div>

      {/* Separator */}
      <div
        className="mx-1 shrink-0 self-center"
        style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.08)', borderRadius: 1 }}
      />

      {/* Pinned + open unpinned apps */}
      {allItems.map((item, i) => (
        <span key={item.appId}>
          {i === pinnedItems.length && openUnpinned.length > 0 && (
            <div
              className="mx-1 shrink-0 self-center inline-block"
              style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.08)', borderRadius: 1 }}
            />
          )}
          {renderDockIcon(item.appId, i)}
        </span>
      ))}

      {/* Separator */}
      <div
        className="mx-1 shrink-0 self-center"
        style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.08)', borderRadius: 1 }}
      />

      {/* Trash */}
      {renderDockIcon('trash', -1, true)}

      <style>{`
        @keyframes dockSlideUp {
          from { transform: translateX(-50%) translateY(60px); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        @keyframes tooltipAppear {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dotAppear {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
      `}</style>
    </div>
  );
});

export default Dock;
