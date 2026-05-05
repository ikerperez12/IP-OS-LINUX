// Minimal global audio visualizer pinned to the top panel area.
import { memo, useEffect, useRef, useState } from 'react';
import { audioBus } from '@/lib/audioBus';
import { useOS } from '@/hooks/useOSStore';

const AudioVisualizer = memo(function AudioVisualizer() {
  const { state } = useOS();
  const enabled = state.uiPreferences.audioVisualizer && !state.uiPreferences.reduceMotion;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [active, setActive] = useState(!!audioBus.current());

  useEffect(() => {
    return audioBus.subscribe((a) => setActive(!!a));
  }, []);

  useEffect(() => {
    if (!enabled || !active) return;
    let raf = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const analyser = audioBus.current();
    if (!analyser) return;
    const buffer = new Uint8Array(analyser.frequencyBinCount);
    const draw = () => {
      analyser.getByteFrequencyData(buffer);
      const w = canvas.width = canvas.clientWidth;
      const h = canvas.height = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const bars = 24;
      const step = Math.floor(buffer.length / bars);
      for (let i = 0; i < bars; i++) {
        let sum = 0;
        for (let j = 0; j < step; j++) sum += buffer[i * step + j] || 0;
        const v = sum / step / 255;
        const bw = (w / bars) - 2;
        const bh = Math.max(2, v * h);
        ctx.fillStyle = `rgba(124,77,255,${0.35 + v * 0.6})`;
        ctx.fillRect(i * (bw + 2), h - bh, bw, bh);
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [active, enabled]);

  if (!enabled || !active) return null;
  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed top-[34px] right-3 z-[150]"
      style={{ width: 96, height: 22, borderRadius: 6, opacity: 0.85 }}
    />
  );
});

export default AudioVisualizer;
