// ============================================================
// App Router - lazy-loads app modules on first launch
// ============================================================

import { lazy, Suspense, type FC } from 'react';
import NotImplemented from '@/components/NotImplemented';
import AppIcon from '@/components/AppIcon';
import { getAppById } from './registry';

interface AppRouterProps {
  appId: string;
  windowId: string;
}

const appComponents: Record<string, ReturnType<typeof lazy<FC>>> = {
  ipmastercontrol: lazy(() => import('./IPMasterControl')),
  filemanager: lazy(() => import('./FileManager')),
  terminal: lazy(() => import('./Terminal')),
  calculator: lazy(() => import('./Calculator')),
  texteditor: lazy(() => import('./TextEditor')),
  settings: lazy(() => import('./Settings')),
  systemmonitor: lazy(() => import('./SystemMonitor')),
  calendar: lazy(() => import('./Calendar')),
  notes: lazy(() => import('./Notes')),
  todo: lazy(() => import('./Todo')),
  clock: lazy(() => import('./Clock')),
  spreadsheet: lazy(() => import('./Spreadsheet')),
  archivemanager: lazy(() => import('./ArchiveManager')),
  browser: lazy(() => import('./Browser')),
  email: lazy(() => import('./Email')),
  chat: lazy(() => import('./Chat')),
  weather: lazy(() => import('./Weather')),
  musicplayer: lazy(() => import('./MusicPlayer')),
  videoplayer: lazy(() => import('./VideoPlayer')),
  imageviewer: lazy(() => import('./ImageViewer')),
  photoeditor: lazy(() => import('./PhotoEditor')),
  voicerecorder: lazy(() => import('./VoiceRecorder')),
  screenrecorder: lazy(() => import('./ScreenRecorder')),
  minesweeper: lazy(() => import('./Minesweeper')),
  snake: lazy(() => import('./Snake')),
  tetris: lazy(() => import('./Tetris')),
  tictactoe: lazy(() => import('./TicTacToe')),
  game2048: lazy(() => import('./Game2048')),
  sudoku: lazy(() => import('./Sudoku')),
  chess: lazy(() => import('./Chess')),
  memory: lazy(() => import('./Memory')),
  pong: lazy(() => import('./Pong')),
  solitaire: lazy(() => import('./Solitaire')),
  codeeditor: lazy(() => import('./CodeEditor')),
  jsonformatter: lazy(() => import('./JsonFormatter')),
  regextester: lazy(() => import('./RegexTester')),
  markdownpreview: lazy(() => import('./MarkdownPreview')),
  gitclient: lazy(() => import('./GitClient')),
  apitester: lazy(() => import('./ApiTester')),
  base64tool: lazy(() => import('./Base64Tool')),
  colorpalette: lazy(() => import('./ColorPalette')),
  drawing: lazy(() => import('./Drawing')),
  colorpicker: lazy(() => import('./ColorPicker')),
  imagegallery: lazy(() => import('./ImageGallery')),
  asciiart: lazy(() => import('./AsciiArt')),
  documentviewer: lazy(() => import('./DocumentViewer')),
  reminders: lazy(() => import('./Reminders')),
  contacts: lazy(() => import('./Contacts')),
  passwordmanager: lazy(() => import('./PasswordManager')),
  whiteboard: lazy(() => import('./Whiteboard')),
  rssreader: lazy(() => import('./RssReader')),
  ftpclient: lazy(() => import('./FtpClient')),
  networktools: lazy(() => import('./NetworkTools')),
  mediaconverter: lazy(() => import('./MediaConverter')),
  flappybird: lazy(() => import('./FlappyBird')),
  matrixrain: lazy(() => import('./MatrixRain')),
};

function AppLoading({ appId }: { appId: string }) {
  const app = getAppById(appId);
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3" style={{ background: 'var(--bg-window)', color: 'var(--text-secondary)' }}>
      <AppIcon appId={appId} size={64} />
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full border-2 border-white/20 border-t-[var(--accent-primary)] animate-spin" />
        <span className="text-xs">Loading {app?.name || 'application'}...</span>
      </div>
    </div>
  );
}

const AppRouter: FC<AppRouterProps> = ({ appId }) => {
  const AppComponent = appComponents[appId];
  if (!AppComponent) return <NotImplemented appId={appId} />;

  return (
    <Suspense fallback={<AppLoading appId={appId} />}>
      <AppComponent />
    </Suspense>
  );
};

export default AppRouter;
