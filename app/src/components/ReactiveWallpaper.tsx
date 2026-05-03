import { memo, useEffect, useRef } from 'react';
import { useOS } from '@/hooks/useOSStore';

type Particle = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  hue: number;
};

const QUALITY_PARTICLES = {
  low: 42,
  medium: 72,
  high: 110,
  ultra: 150,
};

const QUALITY_DPR = {
  low: 1,
  medium: 1.25,
  high: 1.6,
  ultra: 2,
};

const ReactiveWallpaper = memo(function ReactiveWallpaper() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state } = useOS();
  const prefsRef = useRef(state.uiPreferences);
  const pointerRef = useRef({ x: 0.5, y: 0.5, active: false });

  useEffect(() => {
    prefsRef.current = state.uiPreferences;
  }, [state.uiPreferences]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width = 1;
    let height = 1;
    let dpr = 1;
    let frame = 0;
    let animationId = 0;
    let visible = document.visibilityState === 'visible';
    let particles: Particle[] = [];

    const createParticles = () => {
      const count = QUALITY_PARTICLES[prefsRef.current.wallpaperQuality] || QUALITY_PARTICLES.high;
      particles = Array.from({ length: count }, (_, index) => ({
        x: Math.random(),
        y: Math.random(),
        z: 0.25 + Math.random() * 0.95,
        vx: (Math.random() - 0.5) * 0.00055,
        vy: (Math.random() - 0.5) * 0.00045,
        hue: 188 + ((index * 31) % 148),
      }));
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, QUALITY_DPR[prefsRef.current.wallpaperQuality] || 1.6);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      createParticles();
    };

    const draw = () => {
      const prefs = prefsRef.current;
      const reduced = prefs.reduceMotion || !visible;

      ctx.fillStyle = '#050713';
      ctx.fillRect(0, 0, width, height);

      const grd = ctx.createLinearGradient(0, 0, width, height);
      grd.addColorStop(0, '#08111f');
      grd.addColorStop(0.42, '#12091f');
      grd.addColorStop(1, '#03131a');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, width, height);

      const pointer = pointerRef.current;
      const px = pointer.x * width;
      const py = pointer.y * height;
      const t = frame * 0.006;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      particles.forEach((p, index) => {
        if (!reduced) {
          const dx = p.x * width - px;
          const dy = p.y * height - py;
          const distSq = Math.max(1200, dx * dx + dy * dy);
          const force = pointer.active ? Math.min(0.0045, 420 / distSq) : 0.00035;

          p.x += p.vx + (dx / width) * force * p.z + Math.sin(t + index) * 0.00009;
          p.y += p.vy + (dy / height) * force * p.z + Math.cos(t * 0.8 + index) * 0.00008;
          if (p.x < -0.04) p.x = 1.04;
          if (p.x > 1.04) p.x = -0.04;
          if (p.y < -0.04) p.y = 1.04;
          if (p.y > 1.04) p.y = -0.04;
        }

        const x = p.x * width + (pointer.x - 0.5) * 28 * p.z;
        const y = p.y * height + (pointer.y - 0.5) * 20 * p.z;
        const radius = (0.8 + p.z * 1.8) * prefs.iconScale;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 92%, ${58 + p.z * 16}%, ${0.18 + p.z * 0.28})`;
        ctx.fill();
      });

      const maxLinks = prefs.wallpaperQuality === 'ultra' ? 80 : prefs.wallpaperQuality === 'high' ? 56 : 32;
      for (let i = 0; i < particles.length && i < maxLinks; i++) {
        for (let j = i + 1; j < particles.length && j < maxLinks; j++) {
          const a = particles[i];
          const b = particles[j];
          const ax = a.x * width;
          const ay = a.y * height;
          const bx = b.x * width;
          const by = b.y * height;
          const dx = ax - bx;
          const dy = ay - by;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160) {
            ctx.globalAlpha = (1 - dist / 160) * 0.16;
            ctx.strokeStyle = `hsl(${(a.hue + b.hue) / 2}, 90%, 68%)`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      const vignette = ctx.createRadialGradient(width / 2, height / 2, width * 0.1, width / 2, height / 2, width * 0.75);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.48)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      frame += reduced ? 0 : 1;
      animationId = window.requestAnimationFrame(draw);
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerRef.current = {
        x: event.clientX / Math.max(1, window.innerWidth),
        y: event.clientY / Math.max(1, window.innerHeight),
        active: true,
      };
    };
    const onPointerLeave = () => {
      pointerRef.current.active = false;
    };
    const onVisibility = () => {
      visible = document.visibilityState === 'visible';
    };

    resize();
    draw();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0" aria-hidden="true" />;
});

export default ReactiveWallpaper;
