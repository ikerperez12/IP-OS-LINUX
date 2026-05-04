import { memo, useEffect, useRef } from 'react';
import { useOS } from '@/hooks/useOSStore';
import type { AnimatedWallpaperId, Theme, UIPreferences } from '@/types';

type Particle = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  hue: number;
};

const QUALITY_PARTICLES = {
  low: 34,
  medium: 64,
  high: 100,
  ultra: 138,
};

const QUALITY_DPR = {
  low: 1,
  medium: 1.25,
  high: 1.6,
  ultra: 2,
};

const animatedHue: Record<AnimatedWallpaperId, number> = {
  aurora: 205,
  nebula: 285,
  particles: 190,
  liquid: 145,
  grid: 210,
};

function drawBase(ctx: CanvasRenderingContext2D, width: number, height: number, theme: Theme, frame: number) {
  const animated = theme.wallpaperMode === 'animated';
  const id = theme.animatedWallpaper;
  const t = frame * 0.006;

  ctx.fillStyle = '#050713';
  ctx.fillRect(0, 0, width, height);

  const gradient = ctx.createLinearGradient(0, 0, width, height);
  if (!animated) {
    switch (theme.wallpaper) {
      case 'light':
        gradient.addColorStop(0, '#eaf6ff');
        gradient.addColorStop(0.5, '#b7d8ff');
        gradient.addColorStop(1, '#f7f3ff');
        break;
      case 'nature':
        gradient.addColorStop(0, '#071b16');
        gradient.addColorStop(0.5, '#123f2e');
        gradient.addColorStop(1, '#07111f');
        break;
      case 'tech':
        gradient.addColorStop(0, '#03131d');
        gradient.addColorStop(0.48, '#071927');
        gradient.addColorStop(1, '#100c24');
        break;
      case 'sunset':
        gradient.addColorStop(0, '#1f1028');
        gradient.addColorStop(0.5, '#3c1027');
        gradient.addColorStop(1, '#071321');
        break;
      default:
        gradient.addColorStop(0, '#0b1024');
        gradient.addColorStop(0.54, '#1b0b2d');
        gradient.addColorStop(1, '#03121c');
        break;
    }
  } else if (id === 'grid') {
    gradient.addColorStop(0, '#020617');
    gradient.addColorStop(0.52, '#08111f');
    gradient.addColorStop(1, '#050713');
  } else if (id === 'nebula') {
    gradient.addColorStop(0, '#020617');
    gradient.addColorStop(0.54, '#180925');
    gradient.addColorStop(1, '#020617');
  } else if (id === 'liquid') {
    gradient.addColorStop(0, '#04111d');
    gradient.addColorStop(0.5, '#15122a');
    gradient.addColorStop(1, '#031018');
  } else {
    gradient.addColorStop(0, '#08111f');
    gradient.addColorStop(0.42, '#12091f');
    gradient.addColorStop(1, '#03131a');
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const blobs = animated
    ? [
        { x: 0.24 + Math.sin(t) * 0.04, y: 0.24 + Math.cos(t * 0.9) * 0.04, r: 0.36, c: id === 'liquid' ? 'rgba(34,197,94,0.22)' : 'rgba(124,77,255,0.2)' },
        { x: 0.74 + Math.sin(t * 0.7) * 0.04, y: 0.38 + Math.cos(t * 0.8) * 0.04, r: 0.34, c: id === 'nebula' ? 'rgba(236,72,153,0.22)' : 'rgba(45,212,191,0.16)' },
        { x: 0.52 + Math.cos(t * 0.55) * 0.03, y: 0.78 + Math.sin(t * 0.7) * 0.03, r: 0.3, c: id === 'grid' ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.13)' },
      ]
    : [
        { x: 0.28, y: 0.26, r: 0.38, c: theme.wallpaper === 'nature' ? 'rgba(34,197,94,0.22)' : 'rgba(124,77,255,0.18)' },
        { x: 0.74, y: 0.42, r: 0.32, c: theme.wallpaper === 'sunset' ? 'rgba(251,146,60,0.2)' : 'rgba(14,165,233,0.14)' },
      ];

  blobs.forEach((blob) => {
    const radial = ctx.createRadialGradient(blob.x * width, blob.y * height, 0, blob.x * width, blob.y * height, Math.max(width, height) * blob.r);
    radial.addColorStop(0, blob.c);
    radial.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);
  });

  if (id === 'grid' || theme.wallpaper === 'tech') {
    ctx.save();
    ctx.globalAlpha = animated ? 0.1 : 0.08;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    const step = 32;
    for (let x = ((frame * 0.08) % step) - step; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();
  }
}

const ReactiveWallpaper = memo(function ReactiveWallpaper() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state } = useOS();
  const prefsRef = useRef<UIPreferences>(state.uiPreferences);
  const themeRef = useRef<Theme>(state.theme);
  const pointerRef = useRef({ x: 0.5, y: 0.5, active: false });

  useEffect(() => {
    prefsRef.current = state.uiPreferences;
    themeRef.current = state.theme;
  }, [state.theme, state.uiPreferences]);

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
      const prefs = prefsRef.current;
      const theme = themeRef.current;
      const count = theme.wallpaperMode === 'animated'
        ? QUALITY_PARTICLES[prefs.wallpaperQuality] || QUALITY_PARTICLES.high
        : Math.round((QUALITY_PARTICLES.low / 2));
      const baseHue = animatedHue[theme.animatedWallpaper] || 205;
      particles = Array.from({ length: count }, (_, index) => ({
        x: Math.random(),
        y: Math.random(),
        z: 0.25 + Math.random() * 0.95,
        vx: (Math.random() - 0.5) * 0.00055,
        vy: (Math.random() - 0.5) * 0.00045,
        hue: baseHue + ((index * 31) % 130),
      }));
    };

    const resize = () => {
      const prefs = prefsRef.current;
      dpr = Math.min(window.devicePixelRatio || 1, QUALITY_DPR[prefs.wallpaperQuality] || 1.6);
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
      const theme = themeRef.current;
      const reduced = prefs.reduceMotion || !visible || theme.wallpaperMode === 'static';

      drawBase(ctx, width, height, theme, frame);

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
        ctx.fillStyle = `hsla(${p.hue}, 92%, ${58 + p.z * 16}%, ${0.16 + p.z * 0.26})`;
        ctx.fill();
      });

      if (theme.wallpaperMode === 'animated') {
        const maxLinks = prefs.wallpaperQuality === 'ultra' ? 76 : prefs.wallpaperQuality === 'high' ? 52 : 30;
        for (let i = 0; i < particles.length && i < maxLinks; i += 1) {
          for (let j = i + 1; j < particles.length && j < maxLinks; j += 1) {
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
      }
      ctx.restore();

      const vignette = ctx.createRadialGradient(width / 2, height / 2, width * 0.1, width / 2, height / 2, width * 0.75);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, theme.wallpaperMode === 'static' && theme.wallpaper === 'light' ? 'rgba(0,0,0,0.22)' : 'rgba(0,0,0,0.48)');
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
