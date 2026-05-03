// ============================================================
// AppIcon — Colorful gradient app icons using lucide-react
// ============================================================

import { memo } from 'react';
import * as Icons from 'lucide-react';
import type { LucideProps } from 'lucide-react';

interface AppIconProps {
  appId: string;
  size?: number;
  className?: string;
}

const DynamicIcon = ({ name, ...props }: { name: string } & LucideProps) => {
  const IconComp = (Icons as unknown as Record<string, React.ComponentType<LucideProps>>)[name];
  return IconComp ? <IconComp {...props} /> : <Icons.HelpCircle {...props} />;
};

const APP_VISUALS: Record<string, { bg: string, icon: string, color: string }> = {
  ipmastercontrol: { bg: 'linear-gradient(135deg, #7C4DFF, #311B92)', icon: 'Activity', color: '#fff' },
  filemanager: { bg: 'linear-gradient(135deg, #42A5F5, #1565C0)', icon: 'Folder', color: '#fff' },
  terminal: { bg: 'linear-gradient(135deg, #263238, #000000)', icon: 'Terminal', color: '#4FC3F7' },
  texteditor: { bg: 'linear-gradient(135deg, #78909C, #37474F)', icon: 'FileText', color: '#fff' },
  calculator: { bg: 'linear-gradient(135deg, #FF7043, #D84315)', icon: 'Calculator', color: '#fff' },
  settings: { bg: 'linear-gradient(135deg, #78909C, #455A64)', icon: 'Settings', color: '#fff' },
  systemmonitor: { bg: 'linear-gradient(135deg, #66BB6A, #2E7D32)', icon: 'Cpu', color: '#fff' },
  browser: { bg: 'linear-gradient(135deg, #42A5F5, #0D47A1)', icon: 'Globe', color: '#fff' },
  calendar: { bg: 'linear-gradient(135deg, #EF5350, #C62828)', icon: 'Calendar', color: '#fff' },
  drawing: { bg: 'linear-gradient(135deg, #AB47BC, #4A148C)', icon: 'PenTool', color: '#fff' },
  codeeditor: { bg: 'linear-gradient(135deg, #5C6BC0, #1A237E)', icon: 'Code', color: '#fff' },
  minesweeper: { bg: 'linear-gradient(135deg, #ef4444, #7f1d1d)', icon: 'Grid', color: '#fff' },
  musicplayer: { bg: 'linear-gradient(135deg, #EC407A, #880E4F)', icon: 'Music', color: '#fff' },
  matrixrain: { bg: 'linear-gradient(135deg, #22c55e, #064e3b)', icon: 'Droplets', color: '#00FF00' },
  archivemanager: { bg: 'linear-gradient(135deg, #8D6E63, #3E2723)', icon: 'Package', color: '#fff' },
  notes: { bg: 'linear-gradient(135deg, #FFEE58, #F57F17)', icon: 'StickyNote', color: '#333' },
  todo: { bg: 'linear-gradient(135deg, #26A69A, #1B5E20)', icon: 'CheckSquare', color: '#fff' },
  clock: { bg: 'linear-gradient(135deg, #29B6F6, #01579B)', icon: 'Clock', color: '#fff' },
  spreadsheet: { bg: 'linear-gradient(135deg, #66BB6A, #1B5E20)', icon: 'Table2', color: '#fff' },
  documentviewer: { bg: 'linear-gradient(135deg, #BDBDBD, #424242)', icon: 'File', color: '#fff' },
  reminders: { bg: 'linear-gradient(135deg, #FFCA28, #E65100)', icon: 'Bell', color: '#fff' },
  contacts: { bg: 'linear-gradient(135deg, #5C6BC0, #1A237E)', icon: 'Users', color: '#fff' },
  passwordmanager: { bg: 'linear-gradient(135deg, #7E57C2, #311B92)', icon: 'Lock', color: '#fff' },
  whiteboard: { bg: 'linear-gradient(135deg, #FFB74D, #E65100)', icon: 'PenTool', color: '#fff' },
  email: { bg: 'linear-gradient(135deg, #42A5F5, #0D47A1)', icon: 'Mail', color: '#fff' },
  chat: { bg: 'linear-gradient(135deg, #66BB6A, #1B5E20)', icon: 'MessageSquare', color: '#fff' },
  weather: { bg: 'linear-gradient(135deg, #4FC3F7, #01579B)', icon: 'CloudSun', color: '#fff' },
  rssreader: { bg: 'linear-gradient(135deg, #FF9800, #E65100)', icon: 'Rss', color: '#fff' },
  ftpclient: { bg: 'linear-gradient(135deg, #26A69A, #004D40)', icon: 'Server', color: '#fff' },
  networktools: { bg: 'linear-gradient(135deg, #78909C, #263238)', icon: 'Network', color: '#fff' },
  videoplayer: { bg: 'linear-gradient(135deg, #EF5350, #b91c1c)', icon: 'Video', color: '#fff' },
  imageviewer: { bg: 'linear-gradient(135deg, #AB47BC, #4A148C)', icon: 'Image', color: '#fff' },
  photoeditor: { bg: 'linear-gradient(135deg, #FF7043, #BF360C)', icon: 'Crop', color: '#fff' },
  voicerecorder: { bg: 'linear-gradient(135deg, #EF5350, #C62828)', icon: 'Mic', color: '#fff' },
  screenrecorder: { bg: 'linear-gradient(135deg, #ef4444, #7f1d1d)', icon: 'Video', color: '#fff' },
  mediaconverter: { bg: 'linear-gradient(135deg, #7E57C2, #311B92)', icon: 'RefreshCw', color: '#fff' },
  snake: { bg: 'linear-gradient(135deg, #66BB6A, #1B5E20)', icon: 'Trello', color: '#fff' },
  tetris: { bg: 'linear-gradient(135deg, #AB47BC, #4A148C)', icon: 'Blocks', color: '#fff' },
  tictactoe: { bg: 'linear-gradient(135deg, #29B6F6, #01579B)', icon: 'Hash', color: '#fff' },
  game2048: { bg: 'linear-gradient(135deg, #FFCA28, #E65100)', icon: 'LayoutGrid', color: '#fff' },
  sudoku: { bg: 'linear-gradient(135deg, #26A69A, #004D40)', icon: 'Grid3x3', color: '#fff' },
  chess: { bg: 'linear-gradient(135deg, #BDBDBD, #424242)', icon: 'Sword', color: '#fff' },
  memory: { bg: 'linear-gradient(135deg, #EC407A, #880E4F)', icon: 'Brain', color: '#fff' },
  pong: { bg: 'linear-gradient(135deg, #263238, #000000)', icon: 'MonitorSpeaker', color: '#fff' },
  solitaire: { bg: 'linear-gradient(135deg, #66BB6A, #1B5E20)', icon: 'Spade', color: '#fff' },
  flappybird: { bg: 'linear-gradient(135deg, #FFCA28, #E65100)', icon: 'Bird', color: '#fff' },
  jsonformatter: { bg: 'linear-gradient(135deg, #78909C, #37474F)', icon: 'Braces', color: '#fff' },
  regextester: { bg: 'linear-gradient(135deg, #5C6BC0, #1A237E)', icon: 'SearchCode', color: '#fff' },
  markdownpreview: { bg: 'linear-gradient(135deg, #263238, #000000)', icon: 'FileCode', color: '#fff' },
  gitclient: { bg: 'linear-gradient(135deg, #EF5350, #C62828)', icon: 'GitBranch', color: '#fff' },
  apitester: { bg: 'linear-gradient(135deg, #26A69A, #004D40)', icon: 'Send', color: '#fff' },
  base64tool: { bg: 'linear-gradient(135deg, #AB47BC, #4A148C)', icon: 'Binary', color: '#fff' },
  colorpalette: { bg: 'linear-gradient(135deg, #FF7043, #BF360C)', icon: 'Palette', color: '#fff' },
  colorpicker: { bg: 'linear-gradient(135deg, #EC407A, #880E4F)', icon: 'Pipette', color: '#fff' },
  imagegallery: { bg: 'linear-gradient(135deg, #29B6F6, #01579B)', icon: 'Images', color: '#fff' },
  asciiart: { bg: 'linear-gradient(135deg, #263238, #000000)', icon: 'Type', color: '#4FC3F7' },
};

const AppIcon = memo(function AppIcon({ appId, size = 48, className = '' }: AppIconProps) {
  const visual = APP_VISUALS[appId.toLowerCase()] || { bg: 'linear-gradient(135deg, #78909C, #37474F)', icon: 'HelpCircle', color: '#fff' };

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        background: visual.bg,
        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4), 0 4px 8px rgba(0,0,0,0.2)',
        border: '1px solid rgba(255,255,255,0.15)',
      }}
    >
      <DynamicIcon name={visual.icon} size={size * 0.55} color={visual.color} strokeWidth={2} />
    </div>
  );
});

export default AppIcon;
