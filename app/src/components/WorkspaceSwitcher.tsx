// WorkspaceSwitcher - top-bar pill that shows current workspace and allows
// switching with click or Ctrl+Left/Right arrows.
import { memo, useEffect } from 'react';
import { useOS } from '@/hooks/useOSStore';

const WorkspaceSwitcher = memo(function WorkspaceSwitcher() {
  const { state, dispatch } = useOS();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return;
      if (e.target && (() => {
        const el = e.target as HTMLElement;
        const tag = el.tagName;
        return el.isContentEditable || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      })()) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        const ids = state.workspaces.map((w) => w.id);
        const idx = ids.indexOf(state.activeWorkspace);
        const nextIdx = e.key === 'ArrowRight'
          ? (idx + 1) % ids.length
          : (idx - 1 + ids.length) % ids.length;
        dispatch({ type: 'SET_ACTIVE_WORKSPACE', id: ids[nextIdx] });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.workspaces, state.activeWorkspace, dispatch]);

  return (
    <div
      className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
      title="Virtual workspaces — Ctrl+Left/Right"
    >
      {state.workspaces.map((w) => (
        <button
          key={w.id}
          onClick={() => dispatch({ type: 'SET_ACTIVE_WORKSPACE', id: w.id })}
          className="text-[10px] font-semibold rounded-md transition-all"
          style={{
            width: 24,
            height: 24,
            background: state.activeWorkspace === w.id ? 'var(--accent-primary)' : 'transparent',
            color: state.activeWorkspace === w.id ? '#fff' : 'var(--text-secondary)',
          }}
          aria-label={`Switch to ${w.name}`}
          aria-current={state.activeWorkspace === w.id}
        >
          {w.id}
        </button>
      ))}
    </div>
  );
});

export default WorkspaceSwitcher;
