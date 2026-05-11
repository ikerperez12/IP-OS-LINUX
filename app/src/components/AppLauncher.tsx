// ============================================================
// AppLauncher — Full-screen overlay with search + colorful app grid
// ============================================================

import { useState, useCallback, useRef, useEffect, memo } from 'react';
import { useOS } from '@/hooks/useOSStore';
import { getAppById } from '@/apps/registry';
import { Plus, Search, X } from 'lucide-react';
import AppIcon from './AppIcon';

const CATEGORIES = ['Favorites', 'All', 'System', 'Productivity', 'Internet', 'Media', 'Games', 'DevTools', 'Creative'];

type LauncherDrag = {
  appId: string;
  name: string;
  icon: string;
  start: { x: number; y: number };
  current: { x: number; y: number };
  moved: boolean;
};

const AppLauncher = memo(function AppLauncher() {
  const { state, dispatch } = useOS();
  const { appLauncherOpen, apps, dockItems } = state;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [draggingApp, setDraggingApp] = useState<LauncherDrag | null>(null);
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragSuppressClickRef = useRef(false);

  useEffect(() => {
    if (appLauncherOpen) {
      setSearchQuery('');
      const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 100);
      return () => window.clearTimeout(focusTimer);
    }
  }, [appLauncherOpen]);

  useEffect(() => {
    if (!appLauncherOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dispatch({ type: 'SET_APP_LAUNCHER', open: false });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appLauncherOpen, dispatch]);

  useEffect(() => {
    const measure = () => setViewportWidth(window.visualViewport?.width || window.innerWidth);
    measure();
    const vv = window.visualViewport;
    window.addEventListener('resize', measure);
    window.addEventListener('orientationchange', measure);
    vv?.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('orientationchange', measure);
      vv?.removeEventListener('resize', measure);
    };
  }, []);

  const handleLaunch = useCallback(
    (appId: string) => {
      if (dragSuppressClickRef.current) return;
      dispatch({ type: 'SET_APP_LAUNCHER', open: false });
      setTimeout(() => {
        dispatch({ type: 'OPEN_WINDOW', appId });
      }, 150);
    },
    [dispatch]
  );

  const pinAppToDesktop = useCallback(
    (appId: string, position?: { x: number; y: number }) => {
      const app = apps.find((candidate) => candidate.id === appId);
      if (!app) return;
      dispatch({
        type: 'ADD_DESKTOP_ICON',
        icon: {
          name: app.name,
          icon: app.icon,
          kind: 'app',
          appId: app.id,
          position: position || { x: 26, y: 18 },
          isSelected: true,
        },
      });
      dispatch({
        type: 'ADD_NOTIFICATION',
        notification: {
          appId: 'desktop',
          appName: 'Desktop',
          appIcon: 'Desktop',
          title: 'Shortcut added',
          message: `${app.name} is now pinned to the desktop.`,
          isRead: false,
        },
      });
    },
    [apps, dispatch]
  );

  useEffect(() => {
    if (!draggingApp) return;

    const handleMouseMove = (event: MouseEvent) => {
      const moved = draggingApp.moved ||
        Math.hypot(event.clientX - draggingApp.start.x, event.clientY - draggingApp.start.y) > 8;
      setDraggingApp({
        ...draggingApp,
        current: { x: event.clientX, y: event.clientY },
        moved,
      });
    };

    const handleMouseUp = (event: MouseEvent) => {
      const moved = draggingApp.moved ||
        Math.hypot(event.clientX - draggingApp.start.x, event.clientY - draggingApp.start.y) > 8;
      if (moved) {
        dragSuppressClickRef.current = true;
        const desktopTop = 28;
        const desktopBottomReserve = 84;
        if (event.clientY > desktopTop && event.clientY < window.innerHeight - desktopBottomReserve) {
          pinAppToDesktop(draggingApp.appId, {
            x: event.clientX - 50,
            y: event.clientY - desktopTop - 58,
          });
          dispatch({ type: 'SET_APP_LAUNCHER', open: false });
        }
        window.setTimeout(() => {
          dragSuppressClickRef.current = false;
        }, 180);
      }
      setDraggingApp(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp, { once: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dispatch, draggingApp, pinAppToDesktop]);

  const filteredApps = apps.filter((app) => {
    if (state.disabledAppIds.includes(app.id)) return false;
    const matchesSearch = !searchQuery ||
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || activeCategory === 'Favorites'
      ? true
      : app.category === activeCategory;
    const matchesFavorites = activeCategory !== 'Favorites' || dockItems.some((d) => d.appId === app.id && d.isPinned);
    return matchesSearch && matchesCategory && matchesFavorites;
  });

  const frequentApps = dockItems
    .filter((d) => d.isPinned && !state.disabledAppIds.includes(d.appId))
    .map((d) => getAppById(d.appId))
    .filter(Boolean);

  if (!appLauncherOpen) return null;

  const phoneLauncher = viewportWidth <= 640;
  const compactLauncher = viewportWidth <= 380;
  const frequentIconSize = phoneLauncher ? (compactLauncher ? 42 : 46) : 60;
  const appGridIconSize = phoneLauncher ? (compactLauncher ? 44 : 48) : state.uiPreferences.tabletMode ? 70 : 64;
  const dragIconSize = phoneLauncher ? 50 : 72;
  const appGridMin = phoneLauncher ? (compactLauncher ? 76 : 84) : state.uiPreferences.tabletMode ? 112 : 98;

  return (
    <div
      className="fixed inset-0 z-[3000] flex flex-col items-center"
      style={{
        background: 'var(--bg-app-grid)',
        backdropFilter: `blur(${state.uiPreferences.blurIntensity}px)`,
        WebkitBackdropFilter: `blur(${state.uiPreferences.blurIntensity}px)`,
        animation: 'launcherFade 300ms ease',
        paddingTop: phoneLauncher ? 26 : 32,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) dispatch({ type: 'SET_APP_LAUNCHER', open: false });
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') dispatch({ type: 'SET_APP_LAUNCHER', open: false });
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Application launcher"
    >
      {/* Search bar */}
      <div
        className="relative w-[480px] max-w-[90vw]"
        style={{ animation: 'searchSlideDown 400ms cubic-bezier(0, 0, 0.2, 1) 100ms both' }}
      >
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Type to search applications..."
          className="w-full h-11 rounded-full pl-11 pr-10 text-sm outline-none transition-all"
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-default)',
            color: 'var(--text-primary)',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,77,255,0.15)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-default)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          aria-label="Search applications"
        />
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(''); inputRef.current?.focus(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
            aria-label="Clear application search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Frequent apps */}
      {!searchQuery && frequentApps.length > 0 && (
        <div className="mt-6 w-[480px] max-w-[90vw]"
          style={{ animation: 'searchSlideDown 300ms ease 200ms both' }}>
          <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-[0.1em] mb-3">Frequently Used</p>
          <div className="flex gap-3 sm:gap-5">
            {frequentApps.slice(0, 6).map((app) => (
              <button
                key={app!.id}
                onClick={() => handleLaunch(app!.id)}
                className="flex flex-col items-center gap-1.5 group"
                aria-label={`Open ${app!.name}`}
              >
                <div className="group-hover:scale-110 transition-transform">
                  <AppIcon appId={app!.id} size={frequentIconSize} />
                </div>
                <span className="text-[10px] text-[var(--text-primary)] text-center truncate max-w-[64px]">{app!.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category tabs */}
      {!searchQuery && (
        <div
          className="flex items-center gap-0 mt-6 overflow-x-auto max-w-[90vw]"
          style={{ animation: 'searchSlideDown 300ms ease 250ms both' }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="px-4 py-1.5 text-xs font-medium whitespace-nowrap transition-colors relative"
              style={{
                color: activeCategory === cat ? 'var(--accent-primary)' : 'var(--text-secondary)',
                borderBottom: activeCategory === cat ? '2px solid var(--accent-primary)' : '2px solid transparent',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* App grid — with colorful AppIcon */}
      <div
        className="mt-6 w-[780px] max-w-[90vw] overflow-y-auto custom-scrollbar pb-8"
        style={{
          maxHeight: phoneLauncher ? 'calc(100dvh - 190px)' : 'calc(100vh - 220px)',
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fill, minmax(${appGridMin}px, 1fr))`,
          gap: phoneLauncher ? (compactLauncher ? 8 : 10) : state.uiPreferences.tabletMode ? 16 : 12,
          animation: 'gridAppear 300ms cubic-bezier(0.34, 1.56, 0.64, 1) 200ms both',
        }}
      >
        {filteredApps.map((app, index) => (
          <div
            key={app.id}
            role="button"
            tabIndex={0}
            onClick={(event) => {
              if (dragSuppressClickRef.current) {
                event.preventDefault();
                event.stopPropagation();
                return;
              }
              handleLaunch(app.id);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleLaunch(app.id);
              }
            }}
            onMouseDown={(event) => {
              if (event.button !== 0) return;
              setDraggingApp({
                appId: app.id,
                name: app.name,
                icon: app.icon,
                start: { x: event.clientX, y: event.clientY },
                current: { x: event.clientX, y: event.clientY },
                moved: false,
              });
            }}
            className="relative flex flex-col items-center gap-1.5 p-1.5 sm:p-2 rounded-2xl group transition-all"
            aria-label={`Open ${app.name}`}
            style={{
              animation: `iconPop 250ms cubic-bezier(0.34, 1.56, 0.64, 1) ${200 + index * 12}ms both`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <button
              type="button"
              className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
              style={{
                background: 'rgba(124,77,255,0.88)',
                border: '1px solid rgba(255,255,255,0.24)',
                boxShadow: '0 8px 22px rgba(124,77,255,0.28)',
              }}
              onMouseDown={(event) => {
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                pinAppToDesktop(app.id);
              }}
              aria-label={`Add ${app.name} to desktop`}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  event.stopPropagation();
                  pinAppToDesktop(app.id);
                }
              }}
            >
              <Plus size={13} className="text-white" />
            </button>
            <div className="group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-200">
              <AppIcon appId={app.id} size={appGridIconSize} />
            </div>
            <span className="text-[10px] text-[var(--text-primary)] text-center truncate max-w-[78px] sm:max-w-[92px] font-medium leading-tight">
              {app.name}
            </span>
          </div>
        ))}

        {filteredApps.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-[var(--text-secondary)]">
            <Search size={48} className="mb-4 opacity-30" />
            <p className="text-sm">No applications found</p>
          </div>
        )}
      </div>

      {draggingApp?.moved && (
        <div
          className="pointer-events-none fixed z-[5000] flex flex-col items-center gap-1"
          style={{
            left: draggingApp.current.x - dragIconSize / 2,
            top: draggingApp.current.y - dragIconSize / 2,
            filter: 'drop-shadow(0 18px 28px rgba(0,0,0,0.42))',
          }}
        >
          <AppIcon appId={draggingApp.appId} size={dragIconSize} />
          <span
            className="rounded-full px-2 py-1 text-[10px] font-semibold text-white"
            style={{ background: 'rgba(15,23,42,0.82)', border: '1px solid rgba(255,255,255,0.14)' }}
          >
            Drop on desktop
          </span>
        </div>
      )}

      <style>{`
        @keyframes launcherFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes searchSlideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gridAppear {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes iconPop {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
});

export default AppLauncher;
