// ============================================================
// Music Player — Audio player with Web Audio API synthesizer
// ============================================================

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, Volume2, VolumeX, ListMusic, Music
} from 'lucide-react';

// ---- Types ----
interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  // Synth config
  freq: number;
  type: OscillatorType;
  bpm: number;
  pattern: number[];
}

// ---- Demo Tracks with synth patterns ----
const DEMO_TRACKS: Track[] = [
  { id: '1', title: 'Midnight Drive', artist: 'Neon Horizons', album: 'Night Moves', duration: 30,
    freq: 220, type: 'sawtooth', bpm: 120, pattern: [0,3,7,10,12,10,7,3] },
  { id: '2', title: 'Electric Dreams', artist: 'Purple Rain', album: 'Synthwave Vol.1', duration: 30,
    freq: 261.63, type: 'square', bpm: 130, pattern: [0,4,7,12,7,4,0,-5] },
  { id: '3', title: 'Urban Sunrise', artist: 'City Lights', album: 'Metropolitan', duration: 30,
    freq: 196, type: 'triangle', bpm: 100, pattern: [0,5,7,12,14,12,7,5] },
  { id: '4', title: 'Deep Focus', artist: 'Ambient Works', album: 'Flow State', duration: 30,
    freq: 174.61, type: 'sine', bpm: 80, pattern: [0,7,12,7,0,5,9,5] },
  { id: '5', title: 'Summer Breeze', artist: 'Chill Wave', album: 'Coastal Vibes', duration: 30,
    freq: 293.66, type: 'sine', bpm: 90, pattern: [0,4,7,11,12,11,7,4] },
  { id: '6', title: 'Digital Frontier', artist: 'Synth Masters', album: 'Cyberpunk', duration: 30,
    freq: 164.81, type: 'sawtooth', bpm: 140, pattern: [0,3,5,7,12,7,5,3] },
  { id: '7', title: 'Ocean Waves', artist: 'Nature Sounds', album: 'Serenity', duration: 30,
    freq: 246.94, type: 'sine', bpm: 70, pattern: [0,2,4,7,9,7,4,2] },
  { id: '8', title: 'Night Crawler', artist: 'Bass Collective', album: 'Underground', duration: 30,
    freq: 130.81, type: 'square', bpm: 150, pattern: [0,0,7,7,5,5,3,3] },
];

// ---- Visualizer Bars ----
const VisualizerBars = memo(function VisualizerBars({ isPlaying, analyser }: { isPlaying: boolean; analyser: AnalyserNode | null }) {
  const [bars, setBars] = useState<number[]>(Array(32).fill(4));

  useEffect(() => {
    if (!isPlaying) {
      if (!isPlaying) setBars(Array(32).fill(4));
      return;
    }

    if (!analyser) {
      let animId: number;
      let tick = 0;
      const updateFallback = () => {
        tick += 0.18;
        setBars(Array.from({ length: 32 }, (_, i) => 8 + Math.abs(Math.sin(tick + i * 0.42)) * 28));
        animId = requestAnimationFrame(updateFallback);
      };
      updateFallback();
      return () => cancelAnimationFrame(animId);
    }

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let animId: number;

    const update = () => {
      analyser.getByteFrequencyData(dataArray);
      const step = Math.floor(dataArray.length / 32);
      const newBars: number[] = [];
      for (let i = 0; i < 32; i++) {
        const val = dataArray[i * step] || 0;
        newBars.push(4 + (val / 255) * 40);
      }
      setBars(newBars);
      animId = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, analyser]);

  return (
    <div className="flex items-end justify-center gap-[2px]" style={{ height: 50 }}>
      {bars.map((h, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-75"
          style={{
            width: 4,
            height: h,
            background: `linear-gradient(to top, var(--accent-primary), var(--accent-secondary))`,
            opacity: 0.6 + (i / 32) * 0.4,
          }}
        />
      ))}
    </div>
  );
});

// ---- Helpers ----
const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

// ---- Main Music Player ----
export default function MusicPlayer() {
  const [tracks] = useState<Track[]>(DEMO_TRACKS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'one' | 'all'>('off');
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const voiceGainRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const noteIndexRef = useRef(0);
  const noteTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  const currentTrack = tracks[currentIndex];

  // Init Audio Context on first play
  const ensureAudio = useCallback(async () => {
    if (!audioCtxRef.current) {
      const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) {
        throw new Error('Web Audio API is not available in this browser.');
      }
      const ctx = new AudioContextCtor();
      const gain = ctx.createGain();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      gain.connect(analyser);
      analyser.connect(ctx.destination);
      gain.gain.value = volume;
      audioCtxRef.current = ctx;
      gainRef.current = gain;
      analyserRef.current = analyser;
      setAnalyserNode(analyser);
    }
    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }
    return audioCtxRef.current!;
  }, [volume]);

  // Start synth playback
  const startSynth = useCallback(async (track: Track) => {
    try {
      setAudioError(null);
      const ctx = await ensureAudio();
    // Stop previous oscillator
    if (oscillatorRef.current) {
      try { oscillatorRef.current.stop(); } catch { /* ok */ }
    }
    if (noteTimerRef.current) clearInterval(noteTimerRef.current);

    const gain = gainRef.current!;
    gain.gain.value = volume;

    const osc = ctx.createOscillator();
      const voiceGain = ctx.createGain();
    osc.type = track.type;
    osc.frequency.value = track.freq;
      voiceGain.gain.setValueAtTime(0.0001, ctx.currentTime);
      voiceGain.gain.exponentialRampToValueAtTime(0.92, ctx.currentTime + 0.045);
      osc.connect(voiceGain);
      voiceGain.connect(gain);
    osc.start();
    oscillatorRef.current = osc;
      voiceGainRef.current = voiceGain;
    noteIndexRef.current = 0;

    // Play pattern
    const noteDuration = 60000 / track.bpm;
    noteTimerRef.current = setInterval(() => {
      const noteOffset = track.pattern[noteIndexRef.current % track.pattern.length];
      const freq = track.freq * Math.pow(2, noteOffset / 12);
      osc.frequency.setTargetAtTime(freq, ctx.currentTime, 0.05);
      noteIndexRef.current++;
    }, noteDuration);
    } catch (error) {
      setIsPlaying(false);
      setAudioError(error instanceof Error ? error.message : 'Audio playback failed.');
    }
  }, [ensureAudio, volume]);

  // Stop synth
  const stopSynth = useCallback(() => {
    const ctx = audioCtxRef.current;
    const voiceGain = voiceGainRef.current;
    if (oscillatorRef.current) {
      try {
        if (ctx && voiceGain && ctx.state !== 'closed') {
          const now = ctx.currentTime;
          voiceGain.gain.cancelScheduledValues(now);
          voiceGain.gain.setTargetAtTime(0.0001, now, 0.025);
          oscillatorRef.current.stop(now + 0.09);
        } else {
          oscillatorRef.current.stop();
        }
      } catch { /* ok */ }
      oscillatorRef.current = null;
      voiceGainRef.current = null;
    }
    if (noteTimerRef.current) {
      clearInterval(noteTimerRef.current);
      noteTimerRef.current = null;
    }
  }, []);

  // Handle volume changes
  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = volume;
    }
  }, [volume]);

  // Progress timer
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= currentTrack.duration) {
            handleNext();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, currentTrack]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      stopSynth();
      setIsPlaying(false);
    } else {
      void startSynth(currentTrack);
      setIsPlaying(true);
    }
  }, [isPlaying, stopSynth, startSynth, currentTrack]);

  const handleNext = useCallback(() => {
    stopSynth();
    const nextIndex = isShuffle
      ? Math.floor(Math.random() * tracks.length)
      : (currentIndex + 1) % tracks.length;
    setCurrentIndex(nextIndex);
    setCurrentTime(0);
    setIsPlaying(true);
    void startSynth(tracks[nextIndex]);
  }, [isShuffle, tracks, currentIndex, stopSynth, startSynth]);

  const handlePrev = useCallback(() => {
    stopSynth();
    if (currentTime > 3) {
      setCurrentTime(0);
      void startSynth(currentTrack);
    } else {
      const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
      setCurrentIndex(prevIndex);
      setCurrentTime(0);
      setIsPlaying(true);
      void startSynth(tracks[prevIndex]);
    }
  }, [currentTime, currentIndex, tracks, currentTrack, stopSynth, startSynth]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(Number(e.target.value));
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value));
  };

  const toggleRepeat = () => {
    setRepeatMode((prev) => prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off');
  };

  const handleTrackSelect = useCallback((i: number) => {
    stopSynth();
    setCurrentIndex(i);
    setCurrentTime(0);
    setIsPlaying(true);
    void startSynth(tracks[i]);
  }, [stopSynth, startSynth, tracks]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSynth();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, [stopSynth]);

  const albumColors = [
    ['#7C4DFF', '#311B92'],
    ['#EC407A', '#880E4F'],
    ['#FF7043', '#BF360C'],
    ['#42A5F5', '#0D47A1'],
    ['#26C6DA', '#006064'],
    ['#66BB6A', '#1B5E20'],
    ['#FFCA28', '#F57F17'],
    ['#AB47BC', '#4527A0'],
  ];

  const [c1, c2] = albumColors[currentIndex % albumColors.length];

  return (
    <div className="flex flex-col h-full relative overflow-hidden" style={{ background: 'var(--bg-window)' }}>
      {/* Album Art Area */}
      <div className="flex flex-col items-center pt-6 pb-4">
        <div
          className="flex items-center justify-center rounded-2xl mb-4 transition-transform"
          style={{
            width: 180, height: 180,
            background: `linear-gradient(135deg, ${c1}, ${c2})`,
            boxShadow: `0 16px 48px ${c2}80`,
            animation: isPlaying ? 'pulse 2s ease-in-out infinite' : 'none',
          }}
        >
          <Music size={64} style={{ color: 'rgba(255,255,255,0.25)' }} />
        </div>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
          {currentTrack.title}
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
          {currentTrack.artist}
        </p>
        <p style={{ fontSize: '11px', color: 'var(--text-disabled)', marginTop: '1px' }}>
          {currentTrack.album}
        </p>
      </div>

      {/* Visualizer */}
      <div className="px-6 mb-2">
        <VisualizerBars isPlaying={isPlaying} analyser={analyserNode} />
        {audioError && (
          <p className="mt-1 text-center text-[10px]" style={{ color: 'var(--accent-warning)' }}>
            {audioError}
          </p>
        )}
      </div>

      {/* Progress Bar */}
      <div className="px-6 mb-2">
        <input
          type="range"
          min={0}
          max={currentTrack.duration}
          value={currentTime}
          onChange={handleSeek}
          className="w-full"
          style={{ accentColor: 'var(--accent-primary)', height: 4 }}
        />
        <div className="flex justify-between mt-1">
          <span style={{ fontSize: '11px', color: 'var(--text-disabled)' }}>{formatTime(currentTime)}</span>
          <span style={{ fontSize: '11px', color: 'var(--text-disabled)' }}>{formatTime(currentTrack.duration)}</span>
        </div>
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-center gap-5 px-6 py-2">
        <button onClick={() => setIsShuffle((s) => !s)} className="transition-all hover:scale-110"
          style={{ color: isShuffle ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
          <Shuffle size={20} />
        </button>
        <button onClick={handlePrev} className="transition-all hover:scale-110" style={{ color: 'var(--text-primary)' }}>
          <SkipBack size={28} />
        </button>
        <button
          onClick={handlePlayPause}
          className="flex items-center justify-center rounded-full transition-all hover:scale-105"
          style={{ width: 56, height: 56, background: `linear-gradient(135deg, ${c1}, ${c2})`, color: 'white', boxShadow: `0 4px 20px ${c1}60` }}
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
        </button>
        <button onClick={handleNext} className="transition-all hover:scale-110" style={{ color: 'var(--text-primary)' }}>
          <SkipForward size={28} />
        </button>
        <button onClick={toggleRepeat} className="transition-all hover:scale-110"
          style={{ color: repeatMode !== 'off' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
          {repeatMode === 'one' ? <Repeat1 size={20} /> : <Repeat size={20} />}
        </button>
      </div>

      {/* Volume + Playlist Row */}
      <div className="flex items-center justify-between px-6 py-2">
        <div className="flex items-center gap-2 flex-1">
          <button onClick={() => setVolume(v => v === 0 ? 0.5 : 0)} className="transition-all" style={{ color: 'var(--text-secondary)' }}>
            {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input type="range" min={0} max={1} step={0.01} value={volume} onChange={handleVolumeChange}
            className="flex-1" style={{ accentColor: 'var(--accent-primary)', height: 4, maxWidth: 100 }} />
        </div>
        <button onClick={() => setShowPlaylist((s) => !s)}
          className="flex items-center justify-center rounded-lg transition-all hover:bg-[var(--bg-hover)]"
          style={{ width: 32, height: 32, color: showPlaylist ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
          <ListMusic size={20} />
        </button>
      </div>

      {/* Playlist Panel */}
      {showPlaylist && (
        <div className="absolute bottom-0 left-0 right-0 z-10 overflow-y-auto custom-scrollbar"
          style={{ height: '55%', background: 'var(--bg-titlebar)', borderRadius: '12px 12px 0 0', boxShadow: '0 -4px 16px rgba(0,0,0,0.3)' }}>
          <div className="flex items-center justify-between px-4 py-3 sticky top-0"
            style={{ background: 'var(--bg-titlebar)', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Playlist</span>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{tracks.length} tracks</span>
          </div>
          {tracks.map((track, i) => {
            const [tc1] = albumColors[i % albumColors.length];
            return (
              <div key={track.id}
                onClick={() => handleTrackSelect(i)}
                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all"
                style={{ background: i === currentIndex ? 'var(--bg-selected)' : 'transparent', borderLeft: i === currentIndex ? `3px solid ${tc1}` : '3px solid transparent' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-disabled)', width: 20, textAlign: 'center' }}>
                  {i === currentIndex && isPlaying ? <Music size={12} style={{ color: tc1 }} /> : i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="truncate" style={{ fontSize: '13px', fontWeight: i === currentIndex ? 600 : 400, color: 'var(--text-primary)' }}>
                    {track.title}
                  </div>
                  <div className="truncate" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {track.artist}
                  </div>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-disabled)', flexShrink: 0 }}>{formatTime(track.duration)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
