import { useState, useEffect, useRef, useCallback } from 'react';
import { Droplets, Maximize, Minimize, Pause, Play } from 'lucide-react';

type MatrixColor = 'green' | 'amber' | 'red' | 'blue' | 'purple';

const COLOR_MAP: Record<MatrixColor, { primary: string; glow: string; bg: string }> = {
  green: { primary: '#00FF66', glow: 'rgba(0,255,102,0.35)', bg: '#000503' },
  amber: { primary: '#FFB000', glow: 'rgba(255,176,0,0.35)', bg: '#090500' },
  red: { primary: '#FF2A55', glow: 'rgba(255,42,85,0.35)', bg: '#090001' },
  blue: { primary: '#28A8FF', glow: 'rgba(40,168,255,0.35)', bg: '#000713' },
  purple: { primary: '#B85CFF', glow: 'rgba(184,92,255,0.35)', bg: '#080012' },
};

const KATAKANA = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
const LATIN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '[]{}<>/\\|$#@%&*+-=';
const ALL_CHARS = KATAKANA + LATIN + NUMBERS + SYMBOLS;

interface Column {
  x: number;
  speed: number;
  chars: string[];
  y: number;
  length: number;
  opacity: number;
}

export default function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [density, setDensity] = useState(1);
  const [color, setColor] = useState<MatrixColor>('green');
  const [showControls, setShowControls] = useState(true);

  const isPlayingRef = useRef(isPlaying);
  const speedRef = useRef(speed);
  const densityRef = useRef(density);
  const colorRef = useRef(color);
  const columnsRef = useRef<Column[]>([]);
  const animationRef = useRef<number>(0);
  const frameCount = useRef(0);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { densityRef.current = density; }, [density]);
  useEffect(() => { colorRef.current = color; }, [color]);

  const colors = COLOR_MAP[color];

  const randomChar = useCallback(() => ALL_CHARS[Math.floor(Math.random() * ALL_CHARS.length)], []);

  const createColumn = useCallback((canvasWidth: number, fontSize: number, x?: number): Column => {
    const column: Column = {
      x: x ?? Math.floor(Math.random() * (canvasWidth / fontSize)) * fontSize,
      speed: 0.55 + Math.random() * 1.85,
      chars: [],
      y: -Math.random() * 700,
      length: 10 + Math.floor(Math.random() * 26),
      opacity: 0.32 + Math.random() * 0.68,
    };
    for (let j = 0; j < column.length; j++) column.chars.push(randomChar());
    return column;
  }, [randomChar]);

  const initColumns = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fontSize = 15;
    const width = canvas.clientWidth || canvas.parentElement?.clientWidth || 1;
    const cols = Math.max(1, Math.floor(width / fontSize));
    const actualCols = Math.max(1, Math.floor(cols * densityRef.current));

    columnsRef.current = Array.from({ length: actualCols }, (_, i) =>
      createColumn(width, fontSize, i * (cols / actualCols) * fontSize)
    );
  }, [createColumn]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = isFullscreen && containerRef.current
        ? containerRef.current.clientWidth
        : canvas.parentElement?.clientWidth || 1;
      const height = isFullscreen && containerRef.current
        ? containerRef.current.clientHeight
        : canvas.parentElement?.clientHeight || 1;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.getContext('2d')?.setTransform(dpr, 0, 0, dpr, 0, 0);
      initColumns();
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [isFullscreen, initColumns]);

  useEffect(() => { initColumns(); }, [density, initColumns]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const fontSize = 15;
    let visible = document.visibilityState === 'visible';
    const onVisibility = () => { visible = document.visibilityState === 'visible'; };

    document.addEventListener('visibilitychange', onVisibility);

    const draw = () => {
      const width = canvas.clientWidth || canvas.width;
      const height = canvas.clientHeight || canvas.height;
      const cm = COLOR_MAP[colorRef.current];

      ctx.fillStyle = `${cm.bg}2A`;
      ctx.fillRect(0, 0, width, height);

      if (!isPlayingRef.current || !visible) {
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      frameCount.current++;

      columnsRef.current.forEach((col) => {
        col.y += col.speed * speedRef.current;

        if (frameCount.current % 4 === 0) {
          const idx = Math.floor(Math.random() * col.chars.length);
          col.chars[idx] = randomChar();
        }

        for (let i = 0; i < col.chars.length; i++) {
          const charY = col.y - i * fontSize;
          if (charY < -fontSize || charY > height + fontSize) continue;

          const isHead = i === 0;
          const brightness = isHead ? 1 : Math.max(0.1, 1 - i / col.length);
          const alpha = isHead ? 1 : brightness * col.opacity;

          ctx.font = `${isHead ? '700' : '400'} ${fontSize}px 'JetBrains Mono', monospace`;
          ctx.fillStyle = isHead ? '#FFFFFF' : cm.primary;
          ctx.globalAlpha = alpha;
          ctx.shadowColor = isHead ? cm.primary : 'transparent';
          ctx.shadowBlur = isHead ? 12 : 0;
          ctx.fillText(col.chars[i], col.x, charY);
          ctx.globalAlpha = 1;
          ctx.shadowBlur = 0;
        }

        if (col.y - col.length * fontSize > height) {
          const next = createColumn(width, fontSize);
          next.x = col.x;
          Object.assign(col, next);
        }
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    animationRef.current = requestAnimationFrame(draw);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      cancelAnimationFrame(animationRef.current);
    };
  }, [createColumn, randomChar]);

  const handleClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (let i = 0; i < 6; i++) {
      const fontSize = 15;
      const newCol = createColumn(rect.width, fontSize);
      newCol.x = x + (Math.random() - 0.5) * 90;
      newCol.y = y;
      newCol.speed = 1.2 + Math.random() * 2.2;
      columnsRef.current.push(newCol);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => {
      const next = !prev;
      setShowControls(!next);
      return next;
    });
  };

  return (
    <div ref={containerRef} className="relative flex flex-col h-full overflow-hidden" style={{ background: colors.bg }}>
      <div className="absolute inset-0" onClick={handleClick}>
        <canvas ref={canvasRef} className="block w-full h-full" style={{ cursor: 'crosshair' }} />
      </div>

      {showControls && (
        <div className="relative z-10">
          <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' }}>
            <Droplets size={14} style={{ color: colors.primary }} />
            <span className="text-xs font-medium flex-1" style={{ color: '#fff' }}>Matrix Rain</span>
            <button onClick={() => setIsPlaying((prev) => !prev)} className="p-1.5 rounded hover:bg-white/10" style={{ color: '#fff' }}>
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
            </button>
            <button onClick={toggleFullscreen} className="p-1.5 rounded hover:bg-white/10" style={{ color: '#fff' }}>
              {isFullscreen ? <Minimize size={12} /> : <Maximize size={12} />}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 px-3 py-1.5 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.62)', backdropFilter: 'blur(8px)' }}>
            <label className="flex items-center gap-1">
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.62)' }}>Speed</span>
              <input type="range" min={0.2} max={3} step={0.1} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="w-16" />
            </label>
            <label className="flex items-center gap-1">
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.62)' }}>Density</span>
              <input type="range" min={0.3} max={2} step={0.1} value={density} onChange={(e) => setDensity(Number(e.target.value))} className="w-16" />
            </label>
            <div className="flex items-center gap-1">
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.62)' }}>Color</span>
              {(['green', 'amber', 'red', 'blue', 'purple'] as MatrixColor[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-3.5 h-3.5 rounded-full border transition-transform"
                  style={{ background: COLOR_MAP[c].primary, borderColor: color === c ? '#fff' : 'transparent', transform: color === c ? 'scale(1.3)' : 'scale(1)' }}
                  aria-label={`Use ${c} matrix color`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-2 left-0 right-0 text-center z-10 pointer-events-none">
        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Click anywhere to spawn burst</span>
      </div>
    </div>
  );
}
