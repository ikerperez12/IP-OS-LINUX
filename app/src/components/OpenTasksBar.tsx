import { memo } from 'react';
import { useOS } from '@/hooks/useOSStore';
import AppIcon from './AppIcon';

const OpenTasksBar = memo(function OpenTasksBar() {
  const { state, dispatch } = useOS();
  const tasks = [...state.windows].sort((a, b) => a.createdAt - b.createdAt);

  if (tasks.length === 0) return null;

  const compact = state.uiPreferences.tabletMode || window.innerWidth < 760;

  return (
    <div
      className="fixed left-1/2 z-[145] flex items-center gap-2 overflow-x-auto custom-scrollbar"
      style={{
        bottom: compact ? 76 : 72,
        transform: 'translateX(-50%)',
        maxWidth: compact ? 'calc(100vw - 18px)' : 'min(860px, calc(100vw - 64px))',
        padding: compact ? '7px 8px' : '8px 10px',
        borderRadius: 18,
        background: 'rgba(14, 18, 28, 0.54)',
        border: '1px solid rgba(255,255,255,0.11)',
        backdropFilter: `blur(${state.uiPreferences.blurIntensity}px) saturate(190%)`,
        WebkitBackdropFilter: `blur(${state.uiPreferences.blurIntensity}px) saturate(190%)`,
        boxShadow: '0 14px 44px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.08)',
      }}
      aria-label="Open windows"
    >
      {tasks.map((task) => {
        const app = state.apps.find((a) => a.id === task.appId);
        const isFocused = task.isFocused && task.state !== 'minimized';
        const isMinimized = task.state === 'minimized';
        return (
          <button
            key={task.id}
            onClick={() => dispatch({ type: 'RESTORE_OR_FOCUS_APP_WINDOW', appId: task.appId })}
            className="group flex items-center gap-2 shrink-0 rounded-xl transition-all"
            style={{
              minWidth: compact ? 48 : 132,
              maxWidth: compact ? 54 : 190,
              height: compact ? 46 : 42,
              padding: compact ? 4 : '4px 10px 4px 5px',
              background: isFocused
                ? 'rgba(124,77,255,0.22)'
                : isMinimized
                  ? 'rgba(255,255,255,0.055)'
                  : 'rgba(255,255,255,0.08)',
              border: `1px solid ${isFocused ? 'rgba(167,139,250,0.5)' : 'rgba(255,255,255,0.07)'}`,
              color: 'var(--text-primary)',
            }}
            title={`${task.title}${isMinimized ? ' (minimized)' : ''}`}
          >
            <AppIcon appId={task.appId} size={compact ? 38 : 34} />
            {!compact && (
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-[11px] font-semibold leading-tight">{app?.name || task.title}</span>
                <span
                  className="block truncate text-[9px] leading-tight"
                  style={{ color: isMinimized ? 'var(--accent-secondary)' : 'var(--text-secondary)' }}
                >
                  {isMinimized ? 'Minimized' : isFocused ? 'Active' : 'Open'}
                </span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
});

export default OpenTasksBar;
