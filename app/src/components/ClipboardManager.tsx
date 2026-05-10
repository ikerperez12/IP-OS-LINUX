// ClipboardManager - floating tray button + glass dropdown showing last clipboard items.
import { memo, useEffect, useRef, useState } from 'react';
import { useOS } from '@/hooks/useOSStore';
import SystemIcon from './SystemIcon';

const ClipboardManager = memo(function ClipboardManager() {
  const { state, dispatch } = useOS();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onCopy = () => {
      try {
        const sel = window.getSelection?.()?.toString();
        if (sel && sel.trim().length > 0) {
          dispatch({
            type: 'PUSH_CLIPBOARD',
            entry: { kind: 'text', preview: sel.slice(0, 80), payload: sel },
          });
        }
      } catch {/* ignore */}
    };
    document.addEventListener('copy', onCopy);
    return () => document.removeEventListener('copy', onCopy);
  }, [dispatch]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const writeBack = async (payload: string) => {
    try {
      await navigator.clipboard.writeText(payload);
      setOpen(false);
    } catch {/* ignore */}
  };

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-7 w-7 p-0 rounded-lg flex items-center justify-center hover:bg-[rgba(255,255,255,0.08)] transition-colors"
        title="Universal clipboard"
        aria-label="Open universal clipboard"
      >
        <SystemIcon name="Clipboard" size={14} />
        {state.clipboard.length > 0 && (
          <span
            className="ml-1 text-[9px] font-bold rounded-full px-1.5 py-0.5"
            style={{ background: 'var(--accent-primary)', color: '#fff' }}
          >{state.clipboard.length}</span>
        )}
      </button>
      {open && (
        <div
          className="absolute top-full right-0 mt-2 rounded-2xl overflow-hidden"
          style={{
            width: 'min(320px, calc(100vw - 12px))',
            background: 'rgba(17,19,28,0.85)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(24px) saturate(220%)',
            boxShadow: '0 28px 80px rgba(0,0,0,0.5)',
          }}
        >
          <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <SystemIcon name="Clipboard" size={14} className="text-[var(--accent-primary)]" />
            <span className="text-sm font-semibold flex-1">Clipboard</span>
            <button
              onClick={() => dispatch({ type: 'CLEAR_CLIPBOARD' })}
              className="text-[10px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              aria-label="Clear clipboard"
            >Clear</button>
          </div>
          <div className="max-h-[360px] overflow-auto">
            {state.clipboard.length === 0 && (
              <div className="px-3 py-6 text-xs text-[var(--text-secondary)] text-center">
                Copy any text and it appears here.
              </div>
            )}
            {state.clipboard.map((entry) => (
              <button
                key={entry.id}
                onClick={() => writeBack(entry.payload)}
                className="w-full text-left px-3 py-2 hover:bg-[rgba(124,77,255,0.12)] transition-colors flex items-start gap-2"
              >
                <SystemIcon name="Type" size={12} className="mt-0.5 text-[var(--text-secondary)]" />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] truncate">{entry.preview}</div>
                  <div className="text-[10px] text-[var(--text-secondary)]">
                    {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); dispatch({ type: 'REMOVE_CLIPBOARD', id: entry.id }); }}
                  className="text-[10px] text-[var(--text-secondary)] hover:text-red-400"
                  aria-label="Remove"
                ><SystemIcon name="X" size={10} /></button>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default ClipboardManager;
