import type { AnimatedWallpaperId } from '@/types';

export interface StaticWallpaperDefinition {
  id: string;
  name: string;
  preview: string;
  accent: string;
}

export interface AnimatedWallpaperDefinition {
  id: AnimatedWallpaperId;
  name: string;
  description: string;
  preview: string;
}

export const STATIC_WALLPAPERS: StaticWallpaperDefinition[] = [
  {
    id: 'default',
    name: 'Default',
    accent: '#7C4DFF',
    preview: 'radial-gradient(circle at 24% 20%, rgba(124,77,255,0.82), transparent 38%), radial-gradient(circle at 72% 38%, rgba(245,158,11,0.72), transparent 30%), linear-gradient(135deg, #0b1024, #1b0b2d 54%, #03121c)',
  },
  {
    id: 'light',
    name: 'Light',
    accent: '#38BDF8',
    preview: 'radial-gradient(circle at 22% 24%, rgba(56,189,248,0.65), transparent 34%), radial-gradient(circle at 75% 20%, rgba(168,85,247,0.42), transparent 32%), linear-gradient(135deg, #eaf6ff, #b7d8ff 48%, #f7f3ff)',
  },
  {
    id: 'nature',
    name: 'Nature',
    accent: '#22C55E',
    preview: 'radial-gradient(circle at 28% 30%, rgba(34,197,94,0.7), transparent 32%), radial-gradient(circle at 74% 65%, rgba(14,165,233,0.45), transparent 34%), linear-gradient(140deg, #071b16, #123f2e 48%, #07111f)',
  },
  {
    id: 'tech',
    name: 'Tech',
    accent: '#14B8A6',
    preview: 'linear-gradient(120deg, rgba(20,184,166,0.32) 0 1px, transparent 1px 24px), radial-gradient(circle at 70% 26%, rgba(59,130,246,0.55), transparent 34%), linear-gradient(135deg, #03131d, #071927 48%, #100c24)',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    accent: '#F97316',
    preview: 'radial-gradient(circle at 72% 30%, rgba(251,146,60,0.82), transparent 28%), radial-gradient(circle at 32% 72%, rgba(236,72,153,0.55), transparent 36%), linear-gradient(145deg, #1f1028, #3c1027 48%, #071321)',
  },
];

export const ANIMATED_WALLPAPERS: AnimatedWallpaperDefinition[] = [
  {
    id: 'aurora',
    name: 'Aurora',
    description: 'Soft northern-light ribbons with cursor drift',
    preview: 'radial-gradient(circle at 30% 24%, rgba(124,77,255,0.7), transparent 34%), radial-gradient(circle at 72% 42%, rgba(45,212,191,0.42), transparent 32%), linear-gradient(135deg, #050713, #11081f 48%, #03131a)',
  },
  {
    id: 'nebula',
    name: 'Nebula',
    description: 'Deep space clouds and slow parallax particles',
    preview: 'radial-gradient(circle at 60% 28%, rgba(236,72,153,0.62), transparent 32%), radial-gradient(circle at 28% 68%, rgba(59,130,246,0.48), transparent 34%), linear-gradient(135deg, #020617, #180925 54%, #020617)',
  },
  {
    id: 'particles',
    name: 'Particles',
    description: 'Clean nodes and lines reacting to the pointer',
    preview: 'radial-gradient(circle at 20% 30%, rgba(14,165,233,0.55), transparent 30%), radial-gradient(circle at 70% 72%, rgba(124,77,255,0.48), transparent 34%), linear-gradient(135deg, #041019, #071426 45%, #020617)',
  },
  {
    id: 'liquid',
    name: 'Liquid Glass',
    description: 'Fluid color fields with glassy bloom',
    preview: 'radial-gradient(circle at 30% 42%, rgba(34,197,94,0.5), transparent 34%), radial-gradient(circle at 72% 36%, rgba(236,72,153,0.55), transparent 32%), radial-gradient(circle at 52% 74%, rgba(250,204,21,0.34), transparent 28%), linear-gradient(135deg, #04111d, #15122a)',
  },
  {
    id: 'grid',
    name: 'Minimal Grid',
    description: 'Subtle technical grid with calm animated points',
    preview: 'linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px 30px), linear-gradient(0deg, rgba(255,255,255,0.07) 1px, transparent 1px 30px), linear-gradient(135deg, #020617, #08111f 52%, #050713)',
  },
];

export const getStaticWallpaper = (id: string) => (
  STATIC_WALLPAPERS.find((wallpaper) => wallpaper.id === id) || STATIC_WALLPAPERS[0]
);

export const getAnimatedWallpaper = (id: AnimatedWallpaperId) => (
  ANIMATED_WALLPAPERS.find((wallpaper) => wallpaper.id === id) || ANIMATED_WALLPAPERS[0]
);
