// Terminal — multi-tab shell wrapper around TerminalSession.
// Each tab is a fresh isolated session. Color profile is shared across tabs.

import { useState, useCallback, useMemo } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import TerminalSession from './TerminalSession';
import SystemIcon from '@/components/SystemIcon';

type Profile = 'matrix' | 'ubuntu' | 'monokai' | 'solarized';

interface SessionTab {
  id: string;
  label: string;
}

const PROFILES: Record<Profile, { bg: string; fg: string; accent: string; label: string }> = {
  matrix:    { bg: '#000000', fg: '#3CFF7B', accent: '#22C55E', label: 'Matrix' },
  ubuntu:    { bg: '#300A24', fg: '#EAEAEA', accent: '#E95420', label: 'Ubuntu' },
  monokai:   { bg: '#272822', fg: '#F8F8F2', accent: '#FD971F', label: 'Monokai' },
  solarized: { bg: '#002B36', fg: '#93A1A1', accent: '#268BD2', label: 'Solarized' },
};

let nextId = 1;
const newId = () => `tab-${nextId++}`;

export default function Terminal() {
  const [tabs, setTabs] = useState<SessionTab[]>(() => [{ id: newId(), label: 'Session 1' }]);
  const [activeId, setActiveId] = useState<string>(() => tabs[0]?.id ?? newId());
  const [profile, setProfile] = useState<Profile>('matrix');
  const profileTheme = PROFILES[profile];
  const activeIndex = tabs.findIndex((tab) => tab.id === activeId);

  const addTab = useCallback(() => {
    const id = newId();
    setTabs((prev) => [...prev, { id, label: `Session ${prev.length + 1}` }]);
    setActiveId(id);
  }, []);

  const closeTab = useCallback((id: string) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (next.length === 0) {
        const fresh = newId();
        setActiveId(fresh);
        return [{ id: fresh, label: 'Session 1' }];
      }
      if (id === activeId) setActiveId(next[next.length - 1].id);
      return next;
    });
  }, [activeId]);

  const cssVars = useMemo(
    () => ({
      '--term-bg': profileTheme.bg,
      '--term-fg': profileTheme.fg,
      '--term-accent': profileTheme.accent,
    }) as CSSProperties,
    [profileTheme]
  );

  const handleTabListKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const lastIndex = tabs.length - 1;
    let nextIndex = activeIndex < 0 ? 0 : activeIndex;
    if (event.key === 'ArrowLeft') nextIndex = nextIndex <= 0 ? lastIndex : nextIndex - 1;
    if (event.key === 'ArrowRight') nextIndex = nextIndex >= lastIndex ? 0 : nextIndex + 1;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = lastIndex;
    setActiveId(tabs[nextIndex].id);
  }, [activeIndex, tabs]);

  return (
    <div className="flex flex-col h-full" style={{ background: profileTheme.bg, color: profileTheme.fg, ...cssVars }}>
      <header
        className="flex items-center gap-1 px-2 py-1 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.25)' }}
        role="tablist"
        aria-label="Terminal sessions"
        onKeyDown={handleTabListKeyDown}
      >
        {tabs.map((tab) => {
          const active = tab.id === activeId;
          return (
            <div
              key={tab.id}
              className="flex items-center rounded-t-md text-[11px]"
              style={{
                background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                borderBottom: active ? `2px solid ${profileTheme.accent}` : '2px solid transparent',
                color: active ? profileTheme.fg : 'rgba(255,255,255,0.55)',
              }}
            >
              <button
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`terminal-panel-${tab.id}`}
                id={`terminal-tab-${tab.id}`}
                tabIndex={active ? 0 : -1}
                onClick={() => setActiveId(tab.id)}
                className="flex items-center gap-1 rounded-l-md px-2 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--term-accent)]"
              >
                <SystemIcon name="Terminal" size={11} />
                <span>{tab.label}</span>
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                className="rounded-r-md px-1 py-1 hover:text-red-400 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-1 focus-visible:outline-red-300"
                aria-label={`Close ${tab.label}`}
              ><SystemIcon name="X" size={10} /></button>
            </div>
          );
        })}
        <button
          onClick={addTab}
          className="ml-1 w-6 h-6 rounded flex items-center justify-center hover:bg-[rgba(255,255,255,0.08)]"
          title="New tab"
          aria-label="New tab"
        ><SystemIcon name="Plus" size={12} /></button>

        <div className="ml-auto flex items-center gap-1">
          <label className="text-[10px] uppercase tracking-wider opacity-60">Theme</label>
          <select
            value={profile}
            onChange={(e) => setProfile(e.target.value as Profile)}
            className="text-[10px] px-1 py-0.5 rounded outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', color: profileTheme.fg, border: '1px solid rgba(255,255,255,0.1)' }}
            aria-label="Terminal color profile"
          >
            {Object.entries(PROFILES).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </header>
      <div className="flex-1 min-h-0">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            id={`terminal-panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`terminal-tab-${tab.id}`}
            style={{ display: tab.id === activeId ? 'block' : 'none', height: '100%' }}
          >
            <TerminalSession />
          </div>
        ))}
      </div>
    </div>
  );
}
