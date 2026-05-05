// Global audio bus: any app (MusicPlayer) can publish an analyser node
// and visualizers subscribe.

type Listener = (analyser: AnalyserNode | null) => void;

let currentAnalyser: AnalyserNode | null = null;
const listeners = new Set<Listener>();

export const audioBus = {
  publish(node: AnalyserNode | null) {
    currentAnalyser = node;
    listeners.forEach((l) => l(node));
  },
  subscribe(l: Listener) {
    listeners.add(l);
    l(currentAnalyser);
    return () => { listeners.delete(l); };
  },
  current() {
    return currentAnalyser;
  },
};
