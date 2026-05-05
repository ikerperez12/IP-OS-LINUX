import { memo, useMemo, useState } from 'react';
import { useOS } from '@/hooks/useOSStore';
import { APP_REGISTRY } from './registry';
import AppIcon from '@/components/AppIcon';
import SystemIcon from '@/components/SystemIcon';

const PROTECTED_APP_IDS = new Set(['appstore', 'settings', 'filemanager', 'terminal']);

const AppStore = memo(function AppStore() {
  const { state, dispatch } = useOS();
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'all' | 'installed' | 'available'>('all');

  const disabled = state.disabledAppIds;
  const installedCount = APP_REGISTRY.length - disabled.length;

  const apps = useMemo(() => {
    const q = query.trim().toLowerCase();
    return APP_REGISTRY
      .filter((app) =>
        !q ||
        app.name.toLowerCase().includes(q) ||
        app.description.toLowerCase().includes(q) ||
        app.category.toLowerCase().includes(q)
      )
      .filter((app) => {
        const installed = !disabled.includes(app.id);
        if (tab === 'installed') return installed;
        if (tab === 'available') return !installed;
        return true;
      });
  }, [disabled, query, tab]);

  return (
    <div className="flex h-full flex-col" style={{ background: 'rgba(15,17,24,0.92)' }}>
      <header className="flex items-center gap-3 border-b px-4 py-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: 'linear-gradient(135deg, #7C4DFF, #4A148C)', boxShadow: '0 0 18px rgba(124,77,255,0.5)' }}
          aria-hidden="true"
        >
          <SystemIcon name="ShoppingBag" size={18} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold">IP Linux Store</h1>
          <p className="text-[11px] text-[var(--text-secondary)]">
            {APP_REGISTRY.length} apps - {installedCount} installed
          </p>
        </div>
        <label className="relative block">
          <span className="sr-only">Search apps</span>
          <SystemIcon name="Search" size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search apps..."
            className="rounded-lg py-1.5 pl-8 pr-3 text-sm outline-none"
            style={{ width: 240, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
          />
        </label>
      </header>

      <nav className="flex gap-1 px-4 pt-3" role="tablist" aria-label="App Store filters">
        {(['all', 'installed', 'available'] as const).map((filter) => (
          <button
            key={filter}
            type="button"
            role="tab"
            aria-selected={tab === filter}
            onClick={() => setTab(filter)}
            className="rounded-lg px-3 py-1.5 text-[12px] font-semibold capitalize focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-primary)]"
            style={{
              background: tab === filter ? 'var(--accent-primary)' : 'rgba(255,255,255,0.04)',
              color: tab === filter ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {filter}
          </button>
        ))}
      </nav>

      <div className="grid flex-1 gap-3 overflow-auto p-4 custom-scrollbar" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
        {apps.map((app) => {
          const installed = !disabled.includes(app.id);
          const protectedApp = PROTECTED_APP_IDS.has(app.id);
          return (
            <article
              key={app.id}
              className="flex flex-col gap-2 rounded-xl p-3"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-start gap-3">
                <AppIcon appId={app.id} size={48} />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-semibold">{app.name}</h2>
                  <p className="text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">{app.category}</p>
                </div>
              </div>
              <p className="min-h-[36px] text-[11px] text-[var(--text-secondary)] line-clamp-3">{app.description}</p>
              <div className="mt-1 flex items-center gap-2">
                <button
                  type="button"
                  disabled={protectedApp}
                  onClick={() => dispatch({ type: 'TOGGLE_APP_INSTALLATION', appId: app.id })}
                  className="rounded-md px-2.5 py-1 text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-55"
                  style={{
                    background: installed ? 'rgba(255,255,255,0.06)' : 'var(--accent-primary)',
                    color: installed ? 'var(--text-secondary)' : '#fff',
                    border: installed ? '1px solid rgba(255,255,255,0.12)' : 'none',
                  }}
                  aria-label={`${installed ? 'Uninstall' : 'Install'} ${app.name}`}
                >
                  {protectedApp ? 'Core app' : installed ? 'Uninstall' : 'Install'}
                </button>
                {installed && (
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'OPEN_WINDOW', appId: app.id })}
                    className="rounded-md px-2.5 py-1 text-[11px] font-semibold"
                    style={{ background: 'rgba(124,77,255,0.18)', color: '#E0CFFF' }}
                    aria-label={`Open ${app.name}`}
                  >
                    Open
                  </button>
                )}
              </div>
            </article>
          );
        })}
        {apps.length === 0 && (
          <div className="col-span-full py-12 text-center text-sm text-[var(--text-secondary)]">
            No apps match your filters.
          </div>
        )}
      </div>
    </div>
  );
});

export default AppStore;
