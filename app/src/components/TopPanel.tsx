// ============================================================
// TopPanel - Activities button, clock, system tray
// ============================================================

import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { format } from 'date-fns';
import { useOS } from '@/hooks/useOSStore';
import SystemIcon from './SystemIcon';

const TopPanel = memo(function TopPanel() {
  const { state, dispatch } = useOS();
  const [time, setTime] = useState(new Date());
  const [sysMenuOpen, setSysMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!sysMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setSysMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [sysMenuOpen]);

  const handleActivities = useCallback(() => {
    dispatch({ type: 'TOGGLE_APP_LAUNCHER' });
  }, [dispatch]);

  const handleClockClick = useCallback(() => {
    dispatch({ type: 'TOGGLE_NOTIFICATION_CENTER' });
  }, [dispatch]);

  const formattedTime = format(time, 'EEE h:mm a');
  const formattedDate = format(time, 'EEEE, MMMM d, yyyy');

  const trayButton = 'h-7 px-1.5 rounded hover:bg-[var(--bg-hover)] transition-colors flex items-center justify-center shrink-0';

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-between px-2 text-xs font-medium select-none glass-effect"
      style={{
        height: 28,
        borderBottom: '1px solid var(--border-subtle)',
        color: 'var(--text-primary)',
      }}
    >
      <div className="flex-1 flex items-center justify-start min-w-0">
        <button
          onClick={handleActivities}
          className="h-7 px-3 rounded hover:bg-[var(--bg-hover)] transition-colors text-xs font-medium"
        >
          Activities
        </button>
      </div>

      <div className="flex-1 flex justify-center min-w-0">
        <button
          onClick={handleClockClick}
          className="h-7 px-2 rounded hover:bg-[var(--bg-hover)] transition-colors text-xs font-medium group relative flex items-center justify-center"
        >
          <span className="truncate">{formattedTime}</span>
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 rounded bg-[var(--bg-tooltip)] text-[var(--text-primary)] text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[5000]">
            {formattedDate}
          </div>
        </button>
      </div>

      <div className="flex-1 flex items-center justify-end gap-1 min-w-0">
        <button className={trayButton} title="Accessibility">
          <SystemIcon name="Accessibility" size={14} />
        </button>
        <button className={trayButton} title="Keyboard">
          <SystemIcon name="Keyboard" size={14} />
        </button>
        <button className={trayButton} title="Network">
          <SystemIcon name="Wifi" size={14} />
        </button>
        <button className={trayButton} title="Volume">
          <SystemIcon name="Volume2" size={14} />
        </button>
        <button
          className={trayButton}
          title={state.integrationStatus.supabaseConfigured ? 'Cloud connected' : 'Cloud local mode'}
        >
          <SystemIcon
            name={state.integrationStatus.supabaseConfigured ? 'CloudUpload' : 'Cloud'}
            size={14}
            style={{ color: state.integrationStatus.supabaseConfigured ? 'var(--accent-success)' : 'var(--text-secondary)' }}
          />
        </button>
        <button
          className={trayButton}
          title={state.integrationStatus.aiConfigured ? 'AI bridge ready' : 'AI bridge not configured'}
        >
          <SystemIcon
            name="Robot"
            size={14}
            style={{ color: state.integrationStatus.aiConfigured ? 'var(--accent-primary)' : 'var(--text-secondary)' }}
          />
        </button>
        <button className={`${trayButton} gap-1`} title="Battery">
          <SystemIcon name="Battery" size={14} />
          <span className="text-[10px] shrink-0">100%</span>
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setSysMenuOpen(!sysMenuOpen)}
            className={trayButton}
            title="Power menu"
          >
            <SystemIcon name="Power" size={14} />
          </button>

          {sysMenuOpen && (
            <div
              className="absolute top-full right-0 mt-1 py-2 rounded-lg z-[5000]"
              style={{
                background: 'var(--bg-context-menu)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border-default)',
                width: 252,
                animation: 'menuAppear 120ms cubic-bezier(0, 0, 0.2, 1)',
              }}
            >
              <div className="flex items-center gap-2 px-3 py-2 mb-1">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7C4DFF, #4A148C)' }}>
                  <span className="text-white text-xs font-bold">U</span>
                </div>
                <span className="text-sm font-medium flex-1 truncate">{state.auth.userName}</span>
                <button
                  className="w-7 h-7 rounded flex items-center justify-center shrink-0 hover:bg-[var(--bg-hover)]"
                  onClick={() => {
                    setSysMenuOpen(false);
                    dispatch({ type: 'OPEN_WINDOW', appId: 'settings' });
                  }}
                  title="Settings"
                >
                  <SystemIcon name="Settings" size={14} />
                </button>
              </div>

              <div className="my-1 mx-2" style={{ height: 1, background: 'var(--border-subtle)' }} />

              {[
                { label: 'Wired Connection', icon: 'Network', active: true },
                { label: 'Wi-Fi', icon: 'Wifi', active: true },
                { label: 'Bluetooth', icon: 'Bluetooth', active: false },
                { label: state.integrationStatus.supabaseConfigured ? 'Cloud Sync Ready' : 'Cloud Sync Local', icon: 'CloudUpload', active: state.integrationStatus.supabaseConfigured },
                { label: state.integrationStatus.aiConfigured ? 'AI Bridge Ready' : 'AI Bridge Offline', icon: 'Robot', active: state.integrationStatus.aiConfigured },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--bg-hover)] cursor-pointer">
                  <SystemIcon name={item.icon} size={15} className="shrink-0 text-[var(--text-secondary)]" />
                  <span className="text-sm flex-1 truncate">{item.label}</span>
                  <div
                    className="w-8 h-5 rounded-full relative shrink-0"
                    style={{ background: item.active ? 'var(--accent-primary)' : 'var(--border-default)' }}
                  >
                    <div
                      className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                      style={{ right: item.active ? 2 : undefined, left: item.active ? undefined : 2 }}
                    />
                  </div>
                </div>
              ))}

              <div className="my-1 mx-2" style={{ height: 1, background: 'var(--border-subtle)' }} />

              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--bg-hover)] transition-colors text-left"
                onClick={() => { setSysMenuOpen(false); dispatch({ type: 'LOGOUT' }); }}
              >
                <SystemIcon name="Lock" size={15} />
                Lock
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--bg-hover)] transition-colors text-left"
                onClick={() => { setSysMenuOpen(false); dispatch({ type: 'LOGOUT' }); }}
              >
                <SystemIcon name="LogOut" size={15} />
                Log Out
              </button>
              <button
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--bg-hover)] transition-colors text-left"
                onClick={() => setSysMenuOpen(false)}
              >
                <SystemIcon name="Power" size={15} />
                Power Off / Restart
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes menuAppear {
          from { opacity: 0; transform: scale(0.95) translateY(-4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
});

export default TopPanel;
