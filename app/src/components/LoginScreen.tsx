// ============================================================
// LoginScreen — Welcome splash with animated "Enter" button
// ============================================================

import { useState, useCallback, memo, useRef, useEffect } from 'react';
import { useOS } from '@/hooks/useOSStore';
import { ChevronRight } from 'lucide-react';

// Particle background for login
const LoginParticles = memo(function LoginParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: { x: number; y: number; r: number; vx: number; vy: number; alpha: number }[] = [];
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.5 + 0.3,
        vx: (Math.random() - 0.5) * 0.0003,
        vy: -Math.random() * 0.0005 - 0.0001,
        alpha: Math.random() * 0.5 + 0.1,
      });
    }

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -0.05) { p.y = 1.05; p.x = Math.random(); }
        if (p.x < -0.05) p.x = 1.05;
        if (p.x > 1.05) p.x = -0.05;

        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.r * window.devicePixelRatio, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(124, 77, 255, ${p.alpha})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0" />;
});

const LoginScreen = memo(function LoginScreen() {
  const { dispatch } = useOS();
  const [isEntering, setIsEntering] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update clock
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleEnter = useCallback(() => {
    setIsEntering(true);
    setTimeout(() => {
      dispatch({ type: 'LOGIN', isGuest: false });
    }, 600);
  }, [dispatch]);

  const timeStr = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateStr = currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div
      className="fixed inset-0 z-[9998] flex flex-col items-center justify-center"
      style={{
        background: 'radial-gradient(ellipse at 30% 70%, rgba(124,77,255,0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, rgba(0,188,212,0.08) 0%, transparent 60%), linear-gradient(135deg, #0a0015 0%, #001020 50%, #0a0015 100%)',
        opacity: isEntering ? 0 : 1,
        transform: isEntering ? 'scale(1.05)' : 'scale(1)',
        transition: 'opacity 500ms ease, transform 500ms ease',
      }}
    >
      <LoginParticles />

      {/* Content */}
      <div
        className="relative z-10 flex flex-col items-center"
        style={{ animation: 'loginFadeIn 800ms ease' }}
      >
        {/* Clock */}
        <h1
          className="font-extralight tracking-wider"
          style={{
            fontSize: 'clamp(64px, 10vw, 120px)',
            color: 'rgba(255,255,255,0.95)',
            textShadow: '0 0 60px rgba(124,77,255,0.3)',
            lineHeight: 1,
          }}
        >
          {timeStr}
        </h1>

        <p
          className="mt-2 mb-12 tracking-widest uppercase"
          style={{
            fontSize: 'clamp(12px, 1.5vw, 16px)',
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '0.2em',
          }}
        >
          {dateStr}
        </p>

        {/* IP Linux Logo */}
        <div
          className="flex items-center justify-center mb-8"
          style={{ animation: 'float 4s ease-in-out infinite' }}
        >
          <svg width="56" height="56" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="loginGrad" x1="10" y1="10" x2="86" y2="92" gradientUnits="userSpaceOnUse">
                <stop stopColor="#7C4DFF" stopOpacity="0.9" />
                <stop offset="0.5" stopColor="#00BCD4" stopOpacity="0.7" />
                <stop offset="1" stopColor="#7C4DFF" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <path d="M48 10L86 32V70L48 92L10 70V32L48 10Z" fill="url(#loginGrad)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <circle cx="48" cy="48" r="8" fill="#FF9800" opacity="0.9" />
          </svg>
        </div>

        {/* Enter button — pill shaped, glowing */}
        <button
          onClick={handleEnter}
          disabled={isEntering}
          className="group relative flex items-center gap-3 rounded-full transition-all"
          style={{
            padding: '16px 40px',
            background: 'linear-gradient(135deg, rgba(124,77,255,0.2), rgba(0,188,212,0.1))',
            border: '1px solid rgba(124,77,255,0.3)',
            backdropFilter: 'blur(16px)',
            color: 'rgba(255,255,255,0.9)',
            fontSize: 'clamp(14px, 1.5vw, 16px)',
            fontWeight: 500,
            letterSpacing: '0.15em',
            cursor: 'pointer',
            animation: 'glow-pulse 3s ease-in-out infinite',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124,77,255,0.35), rgba(0,188,212,0.2))';
            e.currentTarget.style.borderColor = 'rgba(124,77,255,0.6)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124,77,255,0.2), rgba(0,188,212,0.1))';
            e.currentTarget.style.borderColor = 'rgba(124,77,255,0.3)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
        >
          {isEntering ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              <span>Entering...</span>
            </div>
          ) : (
            <>
              <span>ENTER IP LINUX</span>
              <ChevronRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
                style={{ opacity: 0.7 }}
              />
            </>
          )}
        </button>

        {/* Version tag */}
        <p
          className="mt-8"
          style={{
            fontSize: '10px',
            color: 'rgba(255,255,255,0.15)',
            letterSpacing: '0.3em',
          }}
        >
          IP LINUX v2.0 • ADVANCED WEB DESKTOP
        </p>
      </div>

      <style>{`
        @keyframes loginFadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
});

export default LoginScreen;
