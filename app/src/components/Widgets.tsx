import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  CalendarDays,
  CloudSun,
  Cpu,
  Droplets,
  HardDrive,
  Sparkles,
  Thermometer,
  Wind,
  Zap,
} from 'lucide-react';
import { useOS } from '@/hooks/useOSStore';

function WidgetShell({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`pointer-events-auto overflow-hidden rounded-3xl border transition-transform duration-300 hover:-translate-y-0.5 ${className}`}
      style={{
        background: 'linear-gradient(145deg, rgba(18,22,34,0.58), rgba(8,10,18,0.42))',
        borderColor: 'rgba(255,255,255,0.12)',
        boxShadow: '0 22px 60px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.1)',
        backdropFilter: 'blur(28px) saturate(190%)',
      }}
    >
      {children}
    </section>
  );
}

function MetricBar({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[10px] text-white/58">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full"
          style={{
            width: `${value}%`,
            background: tone,
            boxShadow: `0 0 18px ${tone}`,
          }}
        />
      </div>
    </div>
  );
}

export default function DesktopWidgets() {
  const { state } = useOS();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setTime(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const metrics = useMemo(() => {
    const seconds = Math.floor(time.getTime() / 1000);
    return {
      cpu: 18 + (seconds % 17),
      memory: 42 + (seconds % 19),
      disk: 58 + (seconds % 9),
      network: 24 + (seconds % 31),
    };
  }, [time]);

  const hours = time.getHours().toString().padStart(2, '0');
  const mins = time.getMinutes().toString().padStart(2, '0');
  const dayName = time.toLocaleDateString('en-US', { weekday: 'long' });
  const date = time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <aside
      className="pointer-events-none absolute right-6 top-12 z-[5] hidden w-[300px] flex-col gap-4 xl:flex"
      aria-label="Desktop widgets"
    >
      <WidgetShell>
        <div className="relative p-5">
          <div className="absolute right-4 top-4 h-20 w-20 rounded-full bg-violet-500/20 blur-2xl" />
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
            <CalendarDays size={14} />
            Local time
          </div>
          <div className="mt-4 text-6xl font-light leading-none tracking-tight text-white" style={{ textShadow: '0 10px 34px rgba(0,0,0,0.55)' }}>
            {hours}:{mins}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <div className="text-base font-semibold text-white/82">{dayName}</div>
              <div className="text-xs text-white/48">{date}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/8 px-3 py-2 text-right">
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/42">Workspace</div>
              <div className="text-lg font-bold text-white">{state.activeWorkspace}</div>
            </div>
          </div>
        </div>
      </WidgetShell>

      <WidgetShell>
        <div className="relative p-5">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
                <CloudSun size={14} />
                Weather
              </div>
              <div className="mt-4 text-4xl font-light text-white">22 C</div>
              <div className="text-sm font-medium text-white/70">Mostly Sunny</div>
              <div className="text-xs text-white/42">Madrid, ES</div>
            </div>
            <CloudSun size={48} className="text-yellow-300 drop-shadow-[0_0_24px_rgba(250,204,21,0.45)]" strokeWidth={1.5} />
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-[11px] text-white/55">
            <div className="flex items-center gap-1.5"><Thermometer size={13} />18/24</div>
            <div className="flex items-center gap-1.5"><Droplets size={13} />45%</div>
            <div className="flex items-center gap-1.5"><Wind size={13} />12 km/h</div>
          </div>
        </div>
      </WidgetShell>

      <WidgetShell>
        <div className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">
              <Activity size={14} />
              Insight
            </div>
            <span className="rounded-full bg-emerald-400/12 px-2 py-1 text-[10px] font-semibold text-emerald-200">
              Stable
            </span>
          </div>
          <div className="space-y-3">
            <MetricBar label="CPU" value={metrics.cpu} tone="linear-gradient(90deg,#22d3ee,#7c3aed)" />
            <MetricBar label="Memory" value={metrics.memory} tone="linear-gradient(90deg,#a78bfa,#ec4899)" />
            <MetricBar label="Virtual disk" value={metrics.disk} tone="linear-gradient(90deg,#34d399,#14b8a6)" />
            <MetricBar label="Network" value={metrics.network} tone="linear-gradient(90deg,#f59e0b,#ef4444)" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-white/7 p-2">
              <Cpu size={15} className="mx-auto mb-1 text-cyan-200" />
              <div className="text-[10px] text-white/44">Render</div>
              <div className="text-xs font-semibold text-white">60 fps</div>
            </div>
            <div className="rounded-2xl bg-white/7 p-2">
              <HardDrive size={15} className="mx-auto mb-1 text-emerald-200" />
              <div className="text-[10px] text-white/44">Local</div>
              <div className="text-xs font-semibold text-white">IDB</div>
            </div>
            <div className="rounded-2xl bg-white/7 p-2">
              <Zap size={15} className="mx-auto mb-1 text-yellow-200" />
              <div className="text-[10px] text-white/44">Power</div>
              <div className="text-xs font-semibold text-white">{state.systemControls.batterySaver ? 'Saver' : 'Full'}</div>
            </div>
          </div>
        </div>
      </WidgetShell>

      <WidgetShell className="hidden 2xl:block">
        <div className="flex items-center gap-3 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/22 text-violet-100">
            <Sparkles size={20} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white">Desktop ready</div>
            <div className="truncate text-xs text-white/48">Drag apps from launcher to pin shortcuts.</div>
          </div>
        </div>
      </WidgetShell>
    </aside>
  );
}
