// ============================================================
// App.tsx — Main IP Linux Shell
// ============================================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { OSProvider, useOS } from '@/hooks/useOSStore';
import BootSequence from '@/components/BootSequence';
import LoginScreen from '@/components/LoginScreen';
import Desktop from '@/components/Desktop';
import TopPanel from '@/components/TopPanel';
import Dock from '@/components/Dock';
import AppLauncher from '@/components/AppLauncher';
import WindowManager from '@/components/WindowManager';
import ContextMenu from '@/components/ContextMenu';
import NotificationSystem from '@/components/NotificationSystem';
import NotificationCenter from '@/components/NotificationCenter';
import AppIcon from '@/components/AppIcon';
import GlobalSearch from '@/components/GlobalSearch';
import DesktopWidgets from '@/components/Widgets';
import ReactiveWallpaper from '@/components/ReactiveWallpaper';
import ScreenEffects from '@/components/ScreenEffects';
import AudioVisualizer from '@/components/AudioVisualizer';
import ClipboardManager from '@/components/ClipboardManager';
import SnapAssistOverlay from '@/components/SnapAssistOverlay';

function AppShell() {
  const { state, dispatch } = useOS();
  const { bootPhase, auth } = state;
  const [bootComplete, setBootComplete] = useState(false);
  const altTabRef = useRef<{ holding: boolean }>({ holding: false });

  // Boot sequence
  useEffect(() => {
    if (bootPhase === 'off') {
      dispatch({ type: 'SET_BOOT_PHASE', phase: 'logo' });
    }
  }, [bootPhase, dispatch]);

  useEffect(() => {
    const syncViewportMode = () => {
      const touchPrimary = window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
      const tabletMode = window.innerWidth <= 900 && touchPrimary;
      dispatch({ type: 'SET_TABLET_MODE', tabletMode });
    };
    syncViewportMode();
    window.addEventListener('resize', syncViewportMode);
    return () => window.removeEventListener('resize', syncViewportMode);
  }, [dispatch]);

  const handleBootComplete = useCallback(() => {
    setBootComplete(true);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null): boolean => {
      const el = target as HTMLElement | null;
      if (!el) return false;
      if (el.isContentEditable) return true;
      const tag = el.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
      const role = el.getAttribute && el.getAttribute('role');
      if (role === 'textbox' || role === 'searchbox') return true;
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const typing = isTypingTarget(e.target);

      // Super key toggles app launcher (skip when typing in inputs)
      if (!typing && e.key === 'Meta' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'TOGGLE_APP_LAUNCHER' });
        return;
      }

      // Ctrl+Alt+T opens Terminal — system-level, always allowed
      if (e.ctrlKey && e.altKey && e.key === 't') {
        e.preventDefault();
        dispatch({ type: 'OPEN_WINDOW', appId: 'terminal' });
        return;
      }

      // Super+D minimize all (skip when typing)
      if (!typing && (e.metaKey || e.key === 'Meta') && e.key === 'd') {
        e.preventDefault();
        dispatch({ type: 'MINIMIZE_ALL' });
        return;
      }

      // Alt+Tab window switching — explicit Alt+Tab combo only
      if (e.key === 'Alt') {
        altTabRef.current.holding = true;
      }
      if (e.key === 'Tab' && e.altKey) {
        e.preventDefault();
        if (!state.isAltTabbing) {
          dispatch({ type: 'START_ALT_TAB' });
        } else {
          dispatch({ type: 'CYCLE_ALT_TAB' });
        }
      }

      // Escape closes app launcher / notifications (allowed even while typing)
      if (e.key === 'Escape') {
        if (state.appLauncherOpen) {
          dispatch({ type: 'SET_APP_LAUNCHER', open: false });
        }
        if (state.notificationCenterOpen) {
          dispatch({ type: 'TOGGLE_NOTIFICATION_CENTER' });
        }
      }

      // Ctrl+Shift+W closes active window — moved off plain Ctrl+W so the
      // shortcut never collides with shell / editor "delete word" input.
      if (e.ctrlKey && e.shiftKey && (e.key === 'W' || e.key === 'w') && state.activeWindowId) {
        e.preventDefault();
        dispatch({ type: 'CLOSE_WINDOW', windowId: state.activeWindowId });
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt' && state.isAltTabbing) {
        dispatch({ type: 'END_ALT_TAB' });
        altTabRef.current.holding = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [dispatch, state.appLauncherOpen, state.notificationCenterOpen, state.isAltTabbing, state.activeWindowId]);

  // Determine what to render
  const showBoot = bootPhase !== 'complete' && !bootComplete;
  const showLogin = bootComplete && !auth.isAuthenticated;
  const showDesktop = bootComplete && auth.isAuthenticated;

  return (
    <div className={state.theme.mode === 'light' ? 'light' : ''} style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Boot Sequence */}
      {showBoot && <BootSequence onComplete={handleBootComplete} />}

      {/* Login Screen */}
      {showLogin && <LoginScreen />}

      {/* Desktop Shell */}
      {showDesktop && (
        <div className="relative w-full h-full" style={{ background: 'var(--bg-desktop)' }}>
          {/* Single wallpaper layer */}
          <ReactiveWallpaper />

          {/* Desktop Widgets layer */}
          <DesktopWidgets />

          {/* Desktop Icons layer */}
          <Desktop />

          {/* Windows layer */}
          <WindowManager />

          {/* Top panel */}
          <TopPanel />

          {/* Dock */}
          <Dock />

          {/* Overlays */}
          <AppLauncher />
          <ContextMenu />
          <NotificationSystem />
          <NotificationCenter />
          <GlobalSearch />

          {/* Round 6 — visual sensorial */}
          <ScreenEffects />
          <AudioVisualizer />

          {/* Round 7 — productivity */}
          <ClipboardManager />
          <SnapAssistOverlay />

          {/* Alt+Tab switcher — with proper Lucide icons */}
          {state.isAltTabbing && (
            <div
              className="fixed inset-0 z-[5000] flex items-center justify-center pointer-events-none"
              style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
            >
              <div
                className="flex items-center gap-3 px-6 py-5 rounded-2xl pointer-events-auto"
                style={{
                  background: 'rgba(25,25,30,0.85)',
                  backdropFilter: 'blur(24px) saturate(180%)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 16px 64px rgba(0,0,0,0.5)',
                  animation: 'alttabAppear 150ms ease',
                }}
              >
                {state.windows
                  .filter((w) => w.state !== 'minimized')
                  .map((w, i) => {
                    const app = state.apps.find((a) => a.id === w.appId);
                    const isSelected = i === state.altTabIndex;
                    return (
                      <div
                        key={w.id}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all"
                        style={{
                          background: isSelected ? 'rgba(124,77,255,0.15)' : 'transparent',
                          border: isSelected ? '2px solid rgba(124,77,255,0.6)' : '2px solid transparent',
                          boxShadow: isSelected ? '0 0 20px rgba(124,77,255,0.2)' : 'none',
                          width: 84,
                          transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                        }}
                      >
                        <AppIcon appId={w.appId} size={56} className="drop-shadow-lg" />
                        <span
                          className="text-[11px] font-medium tracking-wide truncate w-full text-center mt-2"
                          style={{ color: isSelected ? '#fff' : 'var(--text-secondary)' }}
                        >
                          {app?.name || 'Unknown'}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          <style>{`
            @keyframes alttabAppear {
              from { opacity: 0; transform: scale(0.92); }
              to { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <OSProvider>
      <AppShell />
      <Analytics />
    </OSProvider>
  );
}
