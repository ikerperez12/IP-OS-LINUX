import { useState, useEffect } from 'react';
import { CloudRain, Sun, Cloud, Thermometer, Wind, Droplets } from 'lucide-react';

export default function DesktopWidgets() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  const mins = time.getMinutes().toString().padStart(2, '0');
  const dayName = time.toLocaleDateString('en-US', { weekday: 'long' });
  const date = time.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  return (
    <div className="absolute top-8 right-8 flex flex-col gap-6 pointer-events-none z-0">
      
      {/* Clock Widget */}
      <div 
        className="w-72 p-6 rounded-3xl backdrop-blur-2xl border pointer-events-auto transition-transform hover:scale-105 duration-300"
        style={{
          background: 'rgba(25, 25, 30, 0.4)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.3)',
        }}
      >
        <div className="flex flex-col">
          <div className="text-6xl font-light tracking-tighter text-white mb-2" style={{ textShadow: '0 4px 24px rgba(0,0,0,0.5)' }}>
            {hours}:{mins}
          </div>
          <div className="text-lg font-medium text-white/80">{dayName}</div>
          <div className="text-sm text-white/50">{date}</div>
        </div>
      </div>

      {/* Weather Widget */}
      <div 
        className="w-72 p-6 rounded-3xl backdrop-blur-2xl border pointer-events-auto transition-transform hover:scale-105 duration-300 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(40, 50, 70, 0.4) 0%, rgba(20, 25, 35, 0.6) 100%)',
          borderColor: 'rgba(255, 255, 255, 0.08)',
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.3)',
        }}
      >
        {/* Decorative background element */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-yellow-400/20 blur-3xl rounded-full pointer-events-none" />

        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-3xl font-light text-white">22°</div>
            <div className="text-sm text-white/60">Madrid, ES</div>
          </div>
          <Sun size={36} className="text-yellow-400 drop-shadow-lg" strokeWidth={1.5} />
        </div>

        <div className="text-sm font-medium text-white/80 mb-6">Mostly Sunny</div>

        <div className="flex justify-between items-center text-xs text-white/50 border-t border-white/10 pt-4">
          <div className="flex items-center gap-1.5">
            <Thermometer size={14} />
            <span>18° / 24°</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Droplets size={14} />
            <span>45%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Wind size={14} />
            <span>12 km/h</span>
          </div>
        </div>
      </div>

    </div>
  );
}
