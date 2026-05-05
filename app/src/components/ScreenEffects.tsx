// ============================================================
// ScreenEffects - global post-process layer (filters + grain)
// ============================================================

import { memo } from 'react';
import { useOS } from '@/hooks/useOSStore';

const NOISE_SVG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0'/></filter><rect width='100%' height='100%' filter='url(#n)' opacity='0.42'/></svg>"
  );

const ScreenEffects = memo(function ScreenEffects() {
  const { state } = useOS();
  const f = state.uiPreferences.screenFilter;
  const grain = state.uiPreferences.acrylicNoise;
  const reduce = state.uiPreferences.reduceMotion;

  let filter = '';
  let mixBlend: string | undefined;
  let scanlines = false;

  switch (f) {
    case 'night-shift':
      filter = 'sepia(0.18) hue-rotate(-12deg) saturate(0.92)';
      mixBlend = undefined;
      break;
    case 'crt':
      filter = 'contrast(1.05) saturate(1.15)';
      scanlines = true;
      break;
    case 'hdr':
      filter = 'contrast(1.12) saturate(1.18) brightness(1.02)';
      break;
    case 'sepia':
      filter = 'sepia(0.65) saturate(0.85)';
      break;
    case 'vivid':
      filter = 'saturate(1.35) contrast(1.06)';
      break;
    default:
      filter = '';
  }

  // We attach the filter to <body> via CSS variable so it cascades to the shell.
  // Here we paint two overlays: grain and CRT scanlines.
  return (
    <>
      <style>{`
        :root { --screen-filter: ${filter || 'none'}; }
        body { transition: filter 220ms ease; }
        body.with-screen-filter { filter: var(--screen-filter); }
      `}</style>
      <FilterBinder enabled={!!filter} />
      {grain && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[9990]"
          style={{
            backgroundImage: `url("${NOISE_SVG}")`,
            backgroundSize: '160px 160px',
            opacity: 0.045,
            mixBlendMode: 'overlay' as const,
            ...(reduce ? {} : { animation: 'grainShift 1.6s steps(6) infinite' }),
          }}
        />
      )}
      {scanlines && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[9991]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0 1px, transparent 1px 3px), radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.35) 100%)',
            mixBlendMode: 'multiply' as const,
            opacity: 0.55,
          }}
        />
      )}
      {mixBlend ? null : null}
      <style>{`
        @keyframes grainShift {
          0% { transform: translate(0,0); }
          25% { transform: translate(-2%, 1%); }
          50% { transform: translate(1%, -1%); }
          75% { transform: translate(-1%, 2%); }
          100% { transform: translate(0,0); }
        }
      `}</style>
    </>
  );
});

const FilterBinder = memo(function FilterBinder({ enabled }: { enabled: boolean }) {
  if (typeof document !== 'undefined') {
    document.body.classList.toggle('with-screen-filter', enabled);
  }
  return null;
});

export default ScreenEffects;
