// ============================================================
// BootSequence — Cinematic animated boot with particles
// ============================================================

import { useEffect, useState, memo, useRef } from 'react';

const PHASE_LOGO = 0;
const PHASE_LOADING = 1;
const PHASE_TRANSITION = 2;
const PHASE_DESKTOP = 3;
const PHASE_DONE = 4;

// Particle system for boot screen
const ParticleField = memo(function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; color: string }[] = [];
    const colors = ['#7C4DFF', '#00BCD4', '#FF9800', '#9575FF'];

    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    let animId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      });

      // Draw connections
      ctx.globalAlpha = 0.05;
      ctx.strokeStyle = '#7C4DFF';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;

      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => cancelAnimationFrame(animId);
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0" />;
});

const BootSequence = memo(function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<number>(PHASE_LOGO);
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Initializing kernel...');

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    timers.push(
      setTimeout(() => {
        setPhase(PHASE_LOADING);
      }, 900)
    );

    timers.push(
      setTimeout(() => {
        let p = 0;
        const messages = [
          { at: 0, text: 'Initializing kernel...' },
          { at: 15, text: 'Loading system modules...' },
          { at: 35, text: 'Starting network services...' },
          { at: 55, text: 'Mounting file systems...' },
          { at: 75, text: 'Preparing desktop environment...' },
          { at: 90, text: 'Almost ready...' },
        ];
        const interval = setInterval(() => {
          p += Math.random() * 12 + 4;
          if (p >= 100) {
            p = 100;
            clearInterval(interval);
          }
          setProgress(p);
          const msg = [...messages].reverse().find((m) => p >= m.at);
          if (msg) setLoadingText(msg.text);
        }, 100);
        timers.push(interval as unknown as ReturnType<typeof setTimeout>);
      }, 900)
    );

    timers.push(setTimeout(() => setPhase(PHASE_TRANSITION), 2800));
    timers.push(setTimeout(() => setPhase(PHASE_DESKTOP), 3600));
    timers.push(
      setTimeout(() => {
        setPhase(PHASE_DONE);
        onComplete();
      }, 4400)
    );

    return () => timers.forEach((t) => clearTimeout(t));
  }, [onComplete]);

  if (phase === PHASE_DONE) return null;

  const showContent = phase === PHASE_LOGO || phase === PHASE_LOADING || phase === PHASE_TRANSITION;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse at center, #0d001a 0%, #000000 70%)',
        transition: 'opacity 600ms ease',
        opacity: phase === PHASE_DESKTOP ? 0 : 1,
      }}
    >
      <ParticleField />

      {showContent && (
        <div
          className="flex flex-col items-center justify-center relative z-10"
          style={{
            opacity: phase === PHASE_TRANSITION ? 0 : 1,
            transition: 'opacity 400ms ease',
          }}
        >
          {/* Logo */}
          <div
            className="flex items-center justify-center mb-8 relative"
            style={{
              opacity: phase >= PHASE_LOGO ? 1 : 0,
              transform: `scale(${phase >= PHASE_LOGO ? 1 : 0.7})`,
              filter: phase >= PHASE_LOGO ? 'blur(0px)' : 'blur(12px)',
              transition: 'all 700ms cubic-bezier(0, 0, 0.2, 1)',
              animation: phase === PHASE_LOADING ? 'float 3s ease-in-out infinite' : undefined,
            }}
          >
            {/* Glow ring */}
            <div
              className="absolute rounded-full"
              style={{
                width: 140,
                height: 140,
                background: 'radial-gradient(circle, rgba(124,77,255,0.2) 0%, transparent 70%)',
                animation: 'glow-pulse 2s ease-in-out infinite',
              }}
            />
            {/* Logo SVG */}
            <svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
              <defs>
                <linearGradient id="bootGrad1" x1="10" y1="10" x2="86" y2="92" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#7C4DFF" stopOpacity="0.9" />
                  <stop offset="0.5" stopColor="#00BCD4" stopOpacity="0.7" />
                  <stop offset="1" stopColor="#7C4DFF" stopOpacity="0.9" />
                </linearGradient>
                <filter id="bootGlow">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path d="M48 10L86 32V70L48 92L10 70V32L48 10Z" fill="url(#bootGrad1)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" filter="url(#bootGlow)" />
              <path d="M48 10V48M48 48L86 32M48 48L10 32M48 48V92" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <circle cx="48" cy="48" r="10" fill="#FF9800" opacity="0.9" />
              <circle cx="48" cy="48" r="6" fill="#FFB74D" opacity="0.6" />
            </svg>
          </div>

          {/* Title */}
          <h1
            className="text-[36px] font-extrabold tracking-[0.25em] text-white mb-2"
            style={{
              opacity: phase >= PHASE_LOGO ? 1 : 0,
              transform: `translateY(${phase >= PHASE_LOGO ? 0 : 12}px)`,
              transition: 'all 500ms cubic-bezier(0, 0, 0.2, 1) 300ms',
              textShadow: '0 0 30px rgba(124, 77, 255, 0.7), 0 0 60px rgba(0, 188, 212, 0.4)',
            }}
          >
            IP LINUX
          </h1>

          <p
            className="text-[11px] text-[#9E9E9E] tracking-[0.3em] uppercase mb-8"
            style={{
              opacity: phase >= PHASE_LOGO ? 0.6 : 0,
              transition: 'opacity 500ms ease 500ms',
            }}
          >
            Advanced Web Desktop
          </p>

          {/* Progress bar */}
          {phase >= PHASE_LOADING && (
            <div
              className="w-[240px] h-[3px] rounded-full overflow-hidden mb-4"
              style={{
                background: 'rgba(255,255,255,0.06)',
                opacity: phase >= PHASE_LOADING ? 1 : 0,
                transition: 'opacity 200ms ease',
              }}
            >
              <div
                className="h-full rounded-full relative"
                style={{
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #7C4DFF, #00BCD4, #7C4DFF)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 2s linear infinite',
                  transition: 'width 100ms linear',
                  boxShadow: '0 0 12px rgba(124,77,255,0.5)',
                }}
              />
            </div>
          )}

          {/* Loading text */}
          {phase >= PHASE_LOADING && (
            <p
              className="text-[10px] text-[#757575] tracking-wider font-mono"
              style={{
                opacity: phase >= PHASE_LOADING ? 1 : 0,
                transition: 'opacity 300ms ease',
              }}
            >
              {loadingText}
            </p>
          )}
        </div>
      )}
    </div>
  );
});

export default BootSequence;
