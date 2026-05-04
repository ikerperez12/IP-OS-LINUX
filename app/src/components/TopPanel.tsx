// ============================================================
// TopPanel - acrylic bar with functional system tray controls
// ============================================================

import { useState, useEffect, useCallback, memo, useRef } from 'react';
import { format } from 'date-fns';
import { useOS } from '@/hooks/useOSStore';
import SystemIcon from './SystemIcon';

type TrayPanel = 'accessibility' | 'keyboard' | 'network' | 'volume' | 'cloud' | 'ai' | 'battery' | 'power' | null;

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
      width: 292,
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
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
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

  const formattedTime = format(time, 'EEE h:mm a');
  const formattedDate = format(time, 'EEEE, MMMM d, yyyy');
  const trayButton = (panel: TrayPanel, extra = '') => (
    `h-7 px-1.5 rounded-lg transition-all flex items-center justify-center shrink-0 ${extra} ${
      activePanel === panel ? 'bg-[rgba(124,77,255,0.22)] text-white' : 'hover:bg-[rgba(255,255,255,0.08)]'
    }`
  );

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
              <div className="rounded-xl p-3 text-[11px] leading-5 text-[var(--text-secondary)]" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div><strong>Alt + Space</strong> Global Search</div>
                <div><strong>Ctrl + Alt + T</strong> Terminal</div>
                <div><strong>Super + D</strong> Minimize all</div>
              </div>
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
      case 'cloud':
        return (
          <PanelShell title="Cloud Sync" icon="CloudUpload">
            <div className="rounded-xl p-3 text-sm" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="font-semibold text-[var(--text-primary)]">{state.integrationStatus.supabaseConfigured ? 'Supabase configured' : 'Local mode'}</div>
              <div className="text-xs text-[var(--text-secondary)] mt-1">No secret keys are exposed in the browser. Cloud sync uses public Supabase anon config only.</div>
            </div>
            <button className="w-full mt-3 px-3 py-2 rounded-xl text-xs font-semibold text-white" style={{ background: 'var(--accent-primary)' }} onClick={() => dispatch({ type: 'OPEN_WINDOW', appId: 'settings' })}>
              Open Settings
            </button>
          </PanelShell>
        );
      case 'ai':
        return (
          <PanelShell title="AI Bridge" icon="Robot">
            <div className="rounded-xl p-3 text-sm" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div className="font-semibold text-[var(--text-primary)]">{state.integrationStatus.aiConfigured ? 'AI bridge ready' : 'AI bridge offline'}</div>
              <div className="text-xs text-[var(--text-secondary)] mt-1">OpenAI calls stay behind the Supabase Edge Function iplinux-ai.</div>
            </div>
          </PanelShell>
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
      className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-between px-2 text-xs font-medium select-none"
      style={{
        height: 30,
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
      <div className="flex-1 flex items-center justify-start min-w-0">
        <button onClick={handleActivities} className="h-7 px-3 rounded-lg hover:bg-[rgba(255,255,255,0.08)] transition-colors text-xs font-semibold">
          Activities
        </button>
      </div>

      <div className="flex-1 flex justify-center min-w-0">
        <button onClick={handleClockClick} className="h-7 px-3 rounded-lg hover:bg-[rgba(255,255,255,0.08)] transition-colors text-xs font-semibold group relative flex items-center justify-center">
          <span className="truncate">{formattedTime}</span>
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 rounded-xl bg-[rgba(17,19,28,0.88)] text-[var(--text-primary)] text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[5000] border border-white/10">
            {formattedDate}
          </div>
        </button>
      </div>

      <div className="flex-1 flex items-center justify-end gap-1 min-w-0 relative" ref={menuRef}>
        <button className={trayButton('accessibility')} title="Accessibility" onClick={() => setActivePanel(activePanel === 'accessibility' ? null : 'accessibility')}>
          <SystemIcon name="Accessibility" size={14} />
        </button>
        <button className={trayButton('keyboard')} title="Keyboard" onClick={() => setActivePanel(activePanel === 'keyboard' ? null : 'keyboard')}>
          <SystemIcon name="Keyboard" size={14} />
        </button>
        <button className={trayButton('network')} title="Network" onClick={() => setActivePanel(activePanel === 'network' ? null : 'network')}>
          <SystemIcon name={state.systemControls.networkEnabled ? 'Wifi' : 'WifiOff'} size={14} />
        </button>
        <button className={trayButton('volume')} title="Volume" onClick={() => setActivePanel(activePanel === 'volume' ? null : 'volume')}>
          <SystemIcon name={state.systemControls.muted ? 'VolumeX' : 'Volume2'} size={14} />
        </button>
        <button className={trayButton('cloud')} title="Cloud status" onClick={() => setActivePanel(activePanel === 'cloud' ? null : 'cloud')}>
          <SystemIcon name={state.integrationStatus.supabaseConfigured ? 'CloudUpload' : 'Cloud'} size={14} style={{ color: state.integrationStatus.supabaseConfigured ? 'var(--accent-success)' : 'var(--text-secondary)' }} />
        </button>
        <button className={trayButton('ai')} title="AI bridge" onClick={() => setActivePanel(activePanel === 'ai' ? null : 'ai')}>
          <SystemIcon name="Robot" size={14} style={{ color: state.integrationStatus.aiConfigured ? 'var(--accent-primary)' : 'var(--text-secondary)' }} />
        </button>
        <button className={trayButton('battery', 'gap-1')} title="Battery" onClick={() => setActivePanel(activePanel === 'battery' ? null : 'battery')}>
          <SystemIcon name="Battery" size={14} />
          <span className="text-[10px] shrink-0">100%</span>
        </button>
        <button className={trayButton('power')} title="Power menu" onClick={() => setActivePanel(activePanel === 'power' ? null : 'power')}>
          <SystemIcon name="Power" size={14} />
        </button>

        {renderPanel()}
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
