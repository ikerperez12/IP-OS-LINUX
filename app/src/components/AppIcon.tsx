// ============================================================
// AppIcon - premium vector app tiles backed by SystemIcon visuals
// ============================================================

import { memo } from 'react';
import SystemIcon, { APP_VISUALS, getAppVisual } from './SystemIcon';

interface AppIconProps {
  appId: string;
  size?: number;
  className?: string;
}

const AppIcon = memo(function AppIcon({ appId, size = 56, className = '' }: AppIconProps) {
  const visual = getAppVisual(appId);
  const inner = Math.round(size * 0.68);

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: Math.max(12, size * 0.24),
        background: visual.bg,
        color: visual.fg,
        boxShadow: [
          `0 ${Math.max(6, size * 0.18)}px ${Math.max(16, size * 0.42)}px ${visual.glow}`,
          'inset 0 1px 0 rgba(255,255,255,0.42)',
          'inset 0 -10px 24px rgba(0,0,0,0.24)',
        ].join(', '),
        border: '1px solid rgba(255,255,255,0.22)',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(145deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.08) 34%, transparent 56%)',
          mixBlendMode: 'screen',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          left: size * 0.12,
          right: size * 0.12,
          top: size * 0.1,
          height: size * 0.28,
          borderRadius: size,
          background: 'rgba(255,255,255,0.18)',
          filter: 'blur(10px)',
        }}
      />
      <SystemIcon
        appId={appId}
        size={inner}
        className="relative z-10 drop-shadow-[0_3px_6px_rgba(0,0,0,0.35)]"
        style={{ color: visual.fg }}
      />
    </div>
  );
});

export default AppIcon;
export { APP_VISUALS };
