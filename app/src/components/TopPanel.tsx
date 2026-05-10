// ============================================================
// TopPanel - acrylic bar with functional system tray controls
// ============================================================

import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { format } from 'date-fns';
import { useOS } from '@/hooks/useOSStore';
import SystemIcon from './SystemIcon';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import ClipboardManager from './ClipboardManager';

type TrayPanel = 'accessibility' | 'keyboard' | 'network' | 'volume' | 'shortcuts' | 'battery' | 'power' | null;

const SHORTCUTS: { combo: string; label: string; group: 'System' | 'Windows' | 'Desktop' | 'Apps' }[] = [
  { combo: 'Super', label: 'Toggle App Launcher', group: 'System' },
  { combo: 'Alt + Space', label: 'Global Search (Spotlight)', group: 'System' },
  { combo: 'Ctrl + Alt + T', label: 'Open Terminal', group: 'System' },
  { combo: 'Super + D', label: 'Show Desktop / Minimize all', group: 'Windows' },
  { combo: 'Alt + Tab', label: 'Switch Window', group: 'Windows' },
  { combo: 'Ctrl + Shift + W', label: 'Close active window', group: 'Windows' },
  { combo: 'Esc', label: 'Close launcher / notifications / folder', group: 'Windows' },
  { combo: 'Ctrl + A', label: 'Select all desktop icons', group: 'Desktop' },
  { combo: 'Ctrl / Shift + click', label: 'Multi-select icons', group: 'Desktop' },
  { combo: 'Drag empty area', label: 'Selection rectangle', group: 'Desktop' },
  { combo: 'Drag icon onto icon', label: 'Create folder', group: 'Desktop' },
  { combo: 'Enter', label: 'Open selected icons', group: 'Desktop' },
  { combo: 'Delete', label: 'Remove selected shortcuts', group: 'Desktop' },
  { combo: 'Right click', label: 'Context menu', group: 'Desktop' },
  { combo: 'Click clock', label: 'Open notification center', group: 'Apps' },
  { combo: 'Click activities', label: 'Open app launcher', group: 'Apps' },
];

const PanelShell = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) => (
  <div
    className="absolute top-full right-0 mt-2 rounded-2xl z-[5000] overflow-hidden"
    style={{
      width: 'min(292px, calc(100vw - 12px))',
      background: 'rgba(17,19,28,0.82)',
      boxShadow: '0 24px 70px rgba(0,0,0,0.46), inset 0 1px 0 rgba(255,255,255,0.09)',
      border: '1px solid rgba(255,255,255,0.12)',
      backdropFilter: 'blur(28px) saturate(220%)',
      animation: 'menuAppear 120ms cubic-bezier(0, 0, 0.2, 1)',
    }}
  >
    <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
      <SystemIcon name={icon} size={16} className="text-[var(--accent-primary)]" />
      <span className="text-sm font-semibold text-[var(--text-primary)]">{title}</span>
    </div>
    <div className="p-3">{children}</div>
  </div>
);

const ShortcutsPanel = ({ onClose }: { onClose: () => void }) => {
  const groups = ['System', 'Windows', 'Desktop', 'Apps'] as const;
  return (
    <div
      className="absolute top-full right-0 mt-2 rounded-2xl z-[5000] overflow-hidden"
      style={{
        width: 'min(360px, calc(100vw - 12px))',
        background: 'rgba(17,19,28,0.85)',
        boxShadow: '0 28px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.09)',
        border: '1px solid rgba(255,255,255,0.12)',
        backdropFilter: 'blur(28px) saturate(220%)',
        animation: 'menuAppear 140ms cubic-bezier(0, 0, 0.2, 1)',
      }}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #7C4DFF, #4A148C)', boxShadow: '0 0 12px rgba(124,77,255,0.45)' }}
        >
          <SystemIcon name="Robot" size={14} className="text-white" />
        </span>
        <span className="text-sm font-semibold text-[var(--text-primary)] flex-1">Keyboard Shortcuts</span>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:bg-[rgba(255,255,255,0.08)]"
          aria-label="Close shortcuts"
        >
          <SystemIcon name="X" size={14} />
        </button>
      </div>
      <div className="p-3 max-h-[460px] overflow-auto space-y-3">
        {groups.map((g) => (
          <div key={g}>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-1 px-2">{g}</div>
            <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
              {SHORTCUTS.filter((s) => s.group === g).map((s, idx, arr) => (
                <div
                  key={s.combo + s.label}
                  className="flex items-center gap-2 px-3 py-2"
                  style={{ borderBottom: idx === arr.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}
                >
                  <span className="flex-1 text-[12px] text-[var(--text-primary)] truncate">{s.label}</span>
                  <kbd
                    className="text-[10px] font-mono px-2 py-1 rounded-md whitespace-nowrap"
                    style={{
                      background: 'rgba(124,77,255,0.18)',
                      border: '1px solid rgba(124,77,255,0.35)',
                      color: '#E0CFFF',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {s.combo}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ToggleRow = ({
  icon,
  label,
  detail,
  value,
  onChange,
}: {
  icon: string;
  label: string;
  detail?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) => (
  <button
    className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-[rgba(255,255,255,0.07)] text-left"
    onClick={() => onChange(!value)}
  >
    <SystemIcon name={icon} size={16} className="text-[var(--text-secondary)] shrink-0" />
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-medium text-[var(--text-primary)] truncate">{label}</span>
      {detail && <span className="block text-[10px] text-[var(--text-secondary)] truncate">{detail}</span>}
    </span>
    <span
      className="w-9 h-5 rounded-full relative shrink-0"
      style={{ background: value ? 'var(--accent-primary)' : 'rgba(255,255,255,0.15)' }}
    >
      <span
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
        style={{ left: value ? 18 : 2 }}
      />
    </span>
  </button>
);

const TopPanel = memo(function TopPanel() {
  const { state, dispatch } = useOS();
  const [time, setTime] = useState(new Date());
  const [activePanel, setActivePanel] = useState<TrayPanel>(null);
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

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

  useEffect(() => {
    if (!activePanel) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActivePanel(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [activePanel]);

  const handleActivities = useCallback(() => {
    dispatch({ type: 'TOGGLE_APP_LAUNCHER' });
  }, [dispatch]);

  const handleClockClick = useCallback(() => {
    dispatch({ type: 'TOGGLE_NOTIFICATION_CENTER' });
  }, [dispatch]);

  const setControls = useCallback(
    (controls: Partial<typeof state.systemControls>) => {
      dispatch({ type: 'SET_SYSTEM_CONTROLS', controls });
    },
    [dispatch]
  );

  const compactTopPanel = viewportWidth <= 560;
  const veryCompactTopPanel = viewportWidth <= 380;
  const showWorkspaceSwitcher = viewportWidth > 680;
  const showFullTray = viewportWidth > 520;
  const formattedTime = format(time, compactTopPanel ? 'h:mm a' : 'EEE h:mm a');
  const formattedDate = format(time, 'EEEE, MMMM d, yyyy');
  const trayButton = (panel: TrayPanel, extra = '') => {
    const sizeClass = panel === 'battery' && !compactTopPanel ? 'h-7 min-w-12 px-1.5' : 'h-7 w-7 p-0';
    return `${sizeClass} rounded-lg transition-all flex items-center justify-center shrink-0 ${extra} ${
      activePanel === panel ? 'bg-[rgba(124,77,255,0.22)] text-white' : 'hover:bg-[rgba(255,255,255,0.08)]'
    }`;
  };

  const renderPanel = () => {
    switch (activePanel) {
      case 'accessibility':
        return (
          <PanelShell title="Accessibility" icon="Accessibility">
            <ToggleRow icon="Accessibility" label="Reduce Motion" detail="Pause heavy wallpaper movement" value={state.uiPreferences.reduceMotion} onChange={v => dispatch({ type: 'SET_UI_PREFERENCES', preferences: { reduceMotion: v } })} />
            <ToggleRow icon="Eye" label="High Contrast" detail="Increase tray and panel contrast" value={state.systemControls.highContrast} onChange={v => setControls({ highContrast: v })} />
            <ToggleRow icon="MousePointer" label="Tablet Targets" detail="Larger icons and touch spacing" value={state.uiPreferences.tabletMode} onChange={v => dispatch({ type: 'SET_TABLET_MODE', tabletMode: v })} />
          </PanelShell>
        );
      case 'keyboard':
        return (
          <PanelShell title="Keyboard" icon="Keyboard">
            <div className="space-y-3">
              <label className="text-xs text-[var(--text-secondary)]">Layout</label>
              <select
                className="w-full rounded-xl px-3 py-2 bg-[var(--bg-input)] text-sm text-[var(--text-primary)] outline-none border"
                style={{ borderColor: 'var(--border-default)' }}
                value={state.systemControls.keyboardLayout}
                onChange={(e) => setControls({ keyboardLayout: e.target.value })}
              >
                <option value="US">US</option>
                <option value="ES">Spanish</option>
                <option value="DE">German</option>
                <option value="FR">French</option>
              </select>
              <button
                className="w-full mt-2 px-3 py-2 rounded-xl text-xs font-semibold text-white"
                style={{ background: 'var(--accent-primary)' }}
                onClick={() => setActivePanel('shortcuts')}
              >
                See all shortcuts
              </button>
            </div>
          </PanelShell>
        );
      case 'network':
        return (
          <PanelShell title="Network" icon="Wifi">
            <ToggleRow icon="Wifi" label="Wi-Fi" detail={state.systemControls.networkEnabled ? 'Connected to IP Linux Local' : 'Offline'} value={state.systemControls.networkEnabled} onChange={v => setControls({ networkEnabled: v })} />
            <ToggleRow icon="Bluetooth" label="Bluetooth" detail={state.systemControls.bluetoothEnabled ? 'Discoverable' : 'Off'} value={state.systemControls.bluetoothEnabled} onChange={v => setControls({ bluetoothEnabled: v })} />
            <button className="w-full mt-2 px-3 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: 'var(--accent-primary)' }} onClick={() => dispatch({ type: 'OPEN_WINDOW', appId: 'networktools' })}>
              Open Network Tools
            </button>
          </PanelShell>
        );
      case 'volume':
        return (
          <PanelShell title="Sound" icon={state.systemControls.muted ? 'VolumeX' : 'Volume2'}>
            <ToggleRow icon="VolumeX" label="Mute Output" value={state.systemControls.muted} onChange={v => setControls({ muted: v })} />
            <div className="mt-3 px-2">
              <div className="flex items-center justify-between text-xs text-[var(--text-secondary)] mb-2">
                <span>Output Volume</span>
                <span>{state.systemControls.muted ? 0 : state.systemControls.volume}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={state.systemControls.volume}
                onChange={(e) => setControls({ volume: Number(e.target.value), muted: Number(e.target.value) === 0 })}
                className="w-full"
                style={{ accentColor: 'var(--accent-primary)' }}
              />
            </div>
          </PanelShell>
        );
      case 'shortcuts':
        return (
          <ShortcutsPanel onClose={() => setActivePanel(null)} />
        );
      case 'battery':
        return (
          <PanelShell title="Power" icon="Battery">
            <ToggleRow icon="Battery" label="Battery Saver" detail="Low wallpaper quality and reduced motion" value={state.systemControls.batterySaver} onChange={v => setControls({ batterySaver: v })} />
            <div className="mt-3 rounded-xl p-3 text-xs text-[var(--text-secondary)]" style={{ background: 'rgba(255,255,255,0.05)' }}>
              Battery 100% · Wallpaper quality {state.uiPreferences.wallpaperQuality}
            </div>
          </PanelShell>
        );
      case 'power':
        return (
          <PanelShell title="Power Menu" icon="Power">
            <div className="flex items-center gap-3 px-2 py-2 mb-2">
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7C4DFF, #4A148C)' }}>
                <span className="text-white text-xs font-bold">U</span>
              </div>
              <span className="text-sm font-medium flex-1 truncate">{state.auth.userName}</span>
              <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-hover)]" onClick={() => dispatch({ type: 'OPEN_WINDOW', appId: 'settings' })}>
                <SystemIcon name="Settings" size={15} />
              </button>
            </div>
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-[rgba(255,255,255,0.07)]" onClick={() => dispatch({ type: 'LOGOUT' })}>
              <SystemIcon name="Lock" size={15} /> Lock
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-[rgba(255,255,255,0.07)]" onClick={() => dispatch({ type: 'MINIMIZE_ALL' })}>
              <SystemIcon name="Minimize" size={15} /> Show Desktop
            </button>
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-[rgba(255,255,255,0.07)]" onClick={() => dispatch({ type: 'CASCADE_WINDOWS' })}>
              <SystemIcon name="PanelTopOpen" size={15} /> Cascade Windows
            </button>
          </PanelShell>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="iplinux-top-panel fixed top-0 left-0 right-0 z-[200] grid items-center px-2 text-xs font-medium select-none"
      style={{
        height: 30,
        gridTemplateColumns: 'auto minmax(0, 1fr) auto',
        columnGap: compactTopPanel ? 4 : 10,
        color: 'var(--text-primary)',
        background: state.systemControls.highContrast
          ? 'rgba(5,6,12,0.92)'
          : 'linear-gradient(180deg, rgba(26,28,40,0.78), rgba(16,18,26,0.58))',
        backdropFilter: `blur(${state.uiPreferences.blurIntensity}px) saturate(220%)`,
        WebkitBackdropFilter: `blur(${state.uiPreferences.blurIntensity}px) saturate(220%)`,
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
    >
      <div className="flex items-center justify-start min-w-0 gap-1.5">
        <button onClick={handleActivities} className={`${compactTopPanel ? 'h-7 px-2' : 'h-7 px-3'} rounded-lg hover:bg-[rgba(255,255,255,0.08)] transition-colors text-xs font-semibold`} aria-label="Open activities and applications">
          {veryCompactTopPanel ? 'Apps' : 'Activities'}
        </button>
        {showWorkspaceSwitcher && <WorkspaceSwitcher />}
      </div>

      <div className="flex justify-center min-w-0 px-1">
        <button onClick={handleClockClick} className={`${compactTopPanel ? 'h-7 px-1.5 text-[11px]' : 'h-7 px-3 text-xs'} min-w-0 max-w-full rounded-lg hover:bg-[rgba(255,255,255,0.08)] transition-colors font-semibold group relative flex items-center justify-center`} aria-label={`Open calendar and notifications, ${formattedDate}`}>
          <span className="truncate">{formattedTime}</span>
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 rounded-xl bg-[rgba(17,19,28,0.88)] text-[var(--text-primary)] text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[5000] border border-white/10">
            {formattedDate}
          </div>
        </button>
      </div>

      <div className="flex items-center justify-end gap-1 min-w-0 relative" ref={menuRef}>
        {showFullTray && <ClipboardManager />}
        <a
          href="https://github.com/ikerperez12/IP-OS-LINUX"
          target="_blank"
          rel="noopener noreferrer"
          className={`${compactTopPanel ? 'h-6 w-6' : 'h-7 w-7'} rounded-full transition-all flex items-center justify-center shrink-0 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(124,77,255,0.75)]`}
          title="Open IP Linux repository"
          aria-label="Open IP Linux GitHub repository"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.14), rgba(124,77,255,0.18))',
            border: '1px solid rgba(255,255,255,0.18)',
            boxShadow: '0 0 16px rgba(124,77,255,0.24), inset 0 1px 0 rgba(255,255,255,0.22)',
            backdropFilter: 'blur(18px) saturate(180%)',
            WebkitBackdropFilter: 'blur(18px) saturate(180%)',
          }}
        >
          <SystemIcon name="GitHub" size={compactTopPanel ? 12 : 14} className="text-white drop-shadow" />
        </a>
        {showFullTray && <button className={trayButton('accessibility')} title="Accessibility" aria-label="Open accessibility controls" onClick={() => setActivePanel(activePanel === 'accessibility' ? null : 'accessibility')}>
          <SystemIcon name="Accessibility" size={14} />
        </button>}
        {showFullTray && <button className={trayButton('keyboard')} title="Keyboard" aria-label="Open keyboard controls" onClick={() => setActivePanel(activePanel === 'keyboard' ? null : 'keyboard')}>
          <SystemIcon name="Keyboard" size={14} />
        </button>}
        {showFullTray && <button className={trayButton('network')} title="Network" aria-label="Open network controls" onClick={() => setActivePanel(activePanel === 'network' ? null : 'network')}>
          <SystemIcon name={state.systemControls.networkEnabled ? 'Wifi' : 'WifiOff'} size={14} />
        </button>}
        {showFullTray && <button className={trayButton('volume')} title="Volume" aria-label="Open volume controls" onClick={() => setActivePanel(activePanel === 'volume' ? null : 'volume')}>
          <SystemIcon name={state.systemControls.muted ? 'VolumeX' : 'Volume2'} size={14} />
        </button>}
        <button
          className={trayButton('shortcuts', 'relative')}
          title="Keyboard shortcuts"
          onClick={() => setActivePanel(activePanel === 'shortcuts' ? null : 'shortcuts')}
          aria-label="Open keyboard shortcuts"
        >
          <span
            className={`${compactTopPanel ? 'w-6 h-6' : 'w-7 h-7'} rounded-full flex items-center justify-center transition-transform`}
            style={{
              background: activePanel === 'shortcuts'
                ? 'linear-gradient(135deg, #7C4DFF, #4A148C)'
                : 'linear-gradient(135deg, rgba(124,77,255,0.55), rgba(74,20,140,0.65))',
              boxShadow: activePanel === 'shortcuts'
                ? '0 0 14px rgba(124,77,255,0.6), inset 0 1px 0 rgba(255,255,255,0.25)'
                : '0 0 8px rgba(124,77,255,0.35), inset 0 1px 0 rgba(255,255,255,0.18)',
              transform: activePanel === 'shortcuts' ? 'scale(1.05)' : 'scale(1)',
              animation: 'robotFloat 3.6s ease-in-out infinite',
            }}
          >
            <SystemIcon name="Robot" size={compactTopPanel ? 13 : 15} className="text-white drop-shadow" />
          </span>
        </button>
        <button className={trayButton('battery', 'gap-1')} title="Battery" aria-label="Open battery controls" onClick={() => setActivePanel(activePanel === 'battery' ? null : 'battery')}>
          <SystemIcon name="Battery" size={14} />
          {!compactTopPanel && <span className="text-[10px] shrink-0">100%</span>}
        </button>
        <button className={trayButton('power')} title="Power menu" aria-label="Open power menu" onClick={() => setActivePanel(activePanel === 'power' ? null : 'power')}>
          <SystemIcon name="Power" size={14} />
        </button>

        {renderPanel()}
      </div>

      <style>{`
        @keyframes menuAppear {
          from { opacity: 0; transform: scale(0.95) translateY(-4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes robotFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-1px) scale(1.04); }
        }
      `}</style>
    </div>
  );
});

export default TopPanel;
