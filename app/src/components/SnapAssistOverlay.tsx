// SnapAssistOverlay - shows preview rectangles when user drags a window near edges.
// Snap state is exposed through window.dispatchEvent custom events from WindowFrame.
import { memo, useEffect, useState } from 'react';

export type SnapZone = 'left' | 'right' | 'top' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null;

const SnapAssistOverlay = memo(function SnapAssistOverlay() {
  const [zone, setZone] = useState<SnapZone>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { zone: SnapZone } | undefined;
      setZone(detail?.zone ?? null);
    };
    window.addEventListener('iplinux:snap-zone', handler as EventListener);
    return () => window.removeEventListener('iplinux:snap-zone', handler as EventListener);
  }, []);

  if (!zone) return null;
  const top = 32;
  const bottom = 92;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let style: React.CSSProperties = { left: 0, top, width: vw, height: vh - top - bottom };
  switch (zone) {
    case 'left': style = { left: 0, top, width: vw / 2, height: vh - top - bottom }; break;
    case 'right': style = { left: vw / 2, top, width: vw / 2, height: vh - top - bottom }; break;
    case 'top': style = { left: 0, top, width: vw, height: vh - top - bottom }; break;
    case 'top-left': style = { left: 0, top, width: vw / 2, height: (vh - top - bottom) / 2 }; break;
    case 'top-right': style = { left: vw / 2, top, width: vw / 2, height: (vh - top - bottom) / 2 }; break;
    case 'bottom-left': style = { left: 0, top: top + (vh - top - bottom) / 2, width: vw / 2, height: (vh - top - bottom) / 2 }; break;
    case 'bottom-right': style = { left: vw / 2, top: top + (vh - top - bottom) / 2, width: vw / 2, height: (vh - top - bottom) / 2 }; break;
  }

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed z-[4000] rounded-3xl transition-all duration-150 ease-out"
      style={{
        ...style,
        background: 'linear-gradient(135deg, rgba(124,77,255,0.15), rgba(124,77,255,0.05))',
        border: '2px dashed rgba(124,77,255,0.55)',
        boxShadow: '0 0 60px rgba(124,77,255,0.3), inset 0 0 30px rgba(124,77,255,0.18)',
        backdropFilter: 'blur(10px) saturate(180%)',
      }}
    />
  );
});

export default SnapAssistOverlay;
