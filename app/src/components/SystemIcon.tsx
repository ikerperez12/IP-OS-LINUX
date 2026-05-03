import type { CSSProperties } from 'react';
import type { IconType } from '@react-icons/all-files/lib';
import { FaArchive } from '@react-icons/all-files/fa/FaArchive';
import { FaBatteryFull } from '@react-icons/all-files/fa/FaBatteryFull';
import { FaBell } from '@react-icons/all-files/fa/FaBell';
import { FaBluetoothB } from '@react-icons/all-files/fa/FaBluetoothB';
import { FaBomb } from '@react-icons/all-files/fa/FaBomb';
import { FaBrain } from '@react-icons/all-files/fa/FaBrain';
import { FaCalculator } from '@react-icons/all-files/fa/FaCalculator';
import { FaCalendarAlt } from '@react-icons/all-files/fa/FaCalendarAlt';
import { FaCheckSquare } from '@react-icons/all-files/fa/FaCheckSquare';
import { FaChessKnight } from '@react-icons/all-files/fa/FaChessKnight';
import { FaChalkboard } from '@react-icons/all-files/fa/FaChalkboard';
import { FaCircle } from '@react-icons/all-files/fa/FaCircle';
import { FaClock } from '@react-icons/all-files/fa/FaClock';
import { FaCloud } from '@react-icons/all-files/fa/FaCloud';
import { FaCloudSun } from '@react-icons/all-files/fa/FaCloudSun';
import { FaCloudUploadAlt } from '@react-icons/all-files/fa/FaCloudUploadAlt';
import { FaCode } from '@react-icons/all-files/fa/FaCode';
import { FaCog } from '@react-icons/all-files/fa/FaCog';
import { FaColumns } from '@react-icons/all-files/fa/FaColumns';
import { FaComments } from '@react-icons/all-files/fa/FaComments';
import { FaCopy } from '@react-icons/all-files/fa/FaCopy';
import { FaCropAlt } from '@react-icons/all-files/fa/FaCropAlt';
import { FaCut } from '@react-icons/all-files/fa/FaCut';
import { FaDesktop } from '@react-icons/all-files/fa/FaDesktop';
import { FaEdit } from '@react-icons/all-files/fa/FaEdit';
import { FaEnvelope } from '@react-icons/all-files/fa/FaEnvelope';
import { FaExternalLinkAlt } from '@react-icons/all-files/fa/FaExternalLinkAlt';
import { FaExpand } from '@react-icons/all-files/fa/FaExpand';
import { FaEyeDropper } from '@react-icons/all-files/fa/FaEyeDropper';
import { FaFeatherAlt } from '@react-icons/all-files/fa/FaFeatherAlt';
import { FaFileAlt } from '@react-icons/all-files/fa/FaFileAlt';
import { FaFileMedical } from '@react-icons/all-files/fa/FaFileMedical';
import { FaFilePdf } from '@react-icons/all-files/fa/FaFilePdf';
import { FaFolderOpen } from '@react-icons/all-files/fa/FaFolderOpen';
import { FaFolderPlus } from '@react-icons/all-files/fa/FaFolderPlus';
import { FaFont } from '@react-icons/all-files/fa/FaFont';
import { FaGamepad } from '@react-icons/all-files/fa/FaGamepad';
import { FaGitAlt } from '@react-icons/all-files/fa/FaGitAlt';
import { FaGlobe } from '@react-icons/all-files/fa/FaGlobe';
import { FaHome } from '@react-icons/all-files/fa/FaHome';
import { FaImage } from '@react-icons/all-files/fa/FaImage';
import { FaImages } from '@react-icons/all-files/fa/FaImages';
import { FaKeyboard } from '@react-icons/all-files/fa/FaKeyboard';
import { FaLayerGroup } from '@react-icons/all-files/fa/FaLayerGroup';
import { FaLock } from '@react-icons/all-files/fa/FaLock';
import { FaMagic } from '@react-icons/all-files/fa/FaMagic';
import { FaMicrochip } from '@react-icons/all-files/fa/FaMicrochip';
import { FaMicrophone } from '@react-icons/all-files/fa/FaMicrophone';
import { FaMinus } from '@react-icons/all-files/fa/FaMinus';
import { FaMusic } from '@react-icons/all-files/fa/FaMusic';
import { FaNetworkWired } from '@react-icons/all-files/fa/FaNetworkWired';
import { FaPaintBrush } from '@react-icons/all-files/fa/FaPaintBrush';
import { FaPalette } from '@react-icons/all-files/fa/FaPalette';
import { FaPaperPlane } from '@react-icons/all-files/fa/FaPaperPlane';
import { FaPause } from '@react-icons/all-files/fa/FaPause';
import { FaPlay } from '@react-icons/all-files/fa/FaPlay';
import { FaPowerOff } from '@react-icons/all-files/fa/FaPowerOff';
import { FaRandom } from '@react-icons/all-files/fa/FaRandom';
import { FaRobot } from '@react-icons/all-files/fa/FaRobot';
import { FaRss } from '@react-icons/all-files/fa/FaRss';
import { FaSearch } from '@react-icons/all-files/fa/FaSearch';
import { FaServer } from '@react-icons/all-files/fa/FaServer';
import { FaSignOutAlt } from '@react-icons/all-files/fa/FaSignOutAlt';
import { FaStickyNote } from '@react-icons/all-files/fa/FaStickyNote';
import { FaTable } from '@react-icons/all-files/fa/FaTable';
import { FaTerminal } from '@react-icons/all-files/fa/FaTerminal';
import { FaTimes } from '@react-icons/all-files/fa/FaTimes';
import { FaTrash } from '@react-icons/all-files/fa/FaTrash';
import { FaUniversalAccess } from '@react-icons/all-files/fa/FaUniversalAccess';
import { FaUsers } from '@react-icons/all-files/fa/FaUsers';
import { FaVideo } from '@react-icons/all-files/fa/FaVideo';
import { FaVolumeUp } from '@react-icons/all-files/fa/FaVolumeUp';
import { FaWifi } from '@react-icons/all-files/fa/FaWifi';
import { FaWindowRestore } from '@react-icons/all-files/fa/FaWindowRestore';

export interface AppVisual {
  bg: string;
  fg: string;
  glow: string;
  icon: IconType;
}

const DEFAULT_VISUAL: AppVisual = {
  bg: 'linear-gradient(145deg, #64748B 0%, #1F2937 100%)',
  fg: '#FFFFFF',
  glow: 'rgba(100,116,139,0.34)',
  icon: FaMagic,
};

export const APP_VISUALS: Record<string, AppVisual> = {
  ipmastercontrol: { bg: 'linear-gradient(145deg, #A855F7 0%, #4F46E5 58%, #111827 100%)', fg: '#FFFFFF', glow: 'rgba(168,85,247,0.45)', icon: FaMicrochip },
  filemanager: { bg: 'linear-gradient(145deg, #38BDF8 0%, #2563EB 52%, #1E3A8A 100%)', fg: '#FFFFFF', glow: 'rgba(56,189,248,0.42)', icon: FaFolderOpen },
  terminal: { bg: 'linear-gradient(145deg, #111827 0%, #020617 70%, #0F766E 100%)', fg: '#5EEAD4', glow: 'rgba(20,184,166,0.35)', icon: FaTerminal },
  texteditor: { bg: 'linear-gradient(145deg, #94A3B8 0%, #475569 58%, #111827 100%)', fg: '#FFFFFF', glow: 'rgba(148,163,184,0.32)', icon: FaFileAlt },
  calculator: { bg: 'linear-gradient(145deg, #FB923C 0%, #EA580C 58%, #7C2D12 100%)', fg: '#FFFFFF', glow: 'rgba(251,146,60,0.42)', icon: FaCalculator },
  settings: { bg: 'linear-gradient(145deg, #CBD5E1 0%, #64748B 52%, #334155 100%)', fg: '#FFFFFF', glow: 'rgba(148,163,184,0.36)', icon: FaCog },
  systemmonitor: { bg: 'linear-gradient(145deg, #34D399 0%, #059669 58%, #064E3B 100%)', fg: '#ECFDF5', glow: 'rgba(52,211,153,0.42)', icon: FaMicrochip },
  archivemanager: { bg: 'linear-gradient(145deg, #B45309 0%, #78350F 60%, #292524 100%)', fg: '#FFF7ED', glow: 'rgba(180,83,9,0.38)', icon: FaArchive },
  calendar: { bg: 'linear-gradient(145deg, #FB7185 0%, #E11D48 58%, #881337 100%)', fg: '#FFFFFF', glow: 'rgba(251,113,133,0.42)', icon: FaCalendarAlt },
  notes: { bg: 'linear-gradient(145deg, #FDE047 0%, #F59E0B 58%, #92400E 100%)', fg: '#1F2937', glow: 'rgba(250,204,21,0.38)', icon: FaStickyNote },
  todo: { bg: 'linear-gradient(145deg, #2DD4BF 0%, #0F766E 58%, #134E4A 100%)', fg: '#FFFFFF', glow: 'rgba(45,212,191,0.38)', icon: FaCheckSquare },
  clock: { bg: 'linear-gradient(145deg, #60A5FA 0%, #2563EB 58%, #1E3A8A 100%)', fg: '#EFF6FF', glow: 'rgba(96,165,250,0.42)', icon: FaClock },
  spreadsheet: { bg: 'linear-gradient(145deg, #86EFAC 0%, #16A34A 58%, #14532D 100%)', fg: '#FFFFFF', glow: 'rgba(134,239,172,0.38)', icon: FaTable },
  documentviewer: { bg: 'linear-gradient(145deg, #F87171 0%, #B91C1C 58%, #7F1D1D 100%)', fg: '#FFFFFF', glow: 'rgba(248,113,113,0.38)', icon: FaFilePdf },
  reminders: { bg: 'linear-gradient(145deg, #FACC15 0%, #F97316 58%, #9A3412 100%)', fg: '#FFFFFF', glow: 'rgba(250,204,21,0.38)', icon: FaBell },
  contacts: { bg: 'linear-gradient(145deg, #818CF8 0%, #4F46E5 58%, #312E81 100%)', fg: '#FFFFFF', glow: 'rgba(129,140,248,0.42)', icon: FaUsers },
  passwordmanager: { bg: 'linear-gradient(145deg, #C084FC 0%, #7C3AED 58%, #3B0764 100%)', fg: '#FFFFFF', glow: 'rgba(192,132,252,0.42)', icon: FaLock },
  whiteboard: { bg: 'linear-gradient(145deg, #FDBA74 0%, #F97316 58%, #7C2D12 100%)', fg: '#FFFFFF', glow: 'rgba(251,146,60,0.38)', icon: FaChalkboard },
  browser: { bg: 'linear-gradient(145deg, #22D3EE 0%, #2563EB 52%, #172554 100%)', fg: '#FFFFFF', glow: 'rgba(34,211,238,0.42)', icon: FaGlobe },
  email: { bg: 'linear-gradient(145deg, #38BDF8 0%, #2563EB 58%, #1D4ED8 100%)', fg: '#FFFFFF', glow: 'rgba(56,189,248,0.42)', icon: FaEnvelope },
  chat: { bg: 'linear-gradient(145deg, #4ADE80 0%, #16A34A 58%, #14532D 100%)', fg: '#FFFFFF', glow: 'rgba(74,222,128,0.38)', icon: FaComments },
  weather: { bg: 'linear-gradient(145deg, #7DD3FC 0%, #0EA5E9 58%, #075985 100%)', fg: '#FFFFFF', glow: 'rgba(125,211,252,0.42)', icon: FaCloudSun },
  rssreader: { bg: 'linear-gradient(145deg, #FDBA74 0%, #F97316 58%, #9A3412 100%)', fg: '#FFFFFF', glow: 'rgba(251,146,60,0.38)', icon: FaRss },
  ftpclient: { bg: 'linear-gradient(145deg, #2DD4BF 0%, #0D9488 58%, #134E4A 100%)', fg: '#FFFFFF', glow: 'rgba(45,212,191,0.38)', icon: FaServer },
  networktools: { bg: 'linear-gradient(145deg, #94A3B8 0%, #334155 58%, #020617 100%)', fg: '#FFFFFF', glow: 'rgba(148,163,184,0.34)', icon: FaNetworkWired },
  musicplayer: { bg: 'linear-gradient(145deg, #F472B6 0%, #DB2777 58%, #831843 100%)', fg: '#FFFFFF', glow: 'rgba(244,114,182,0.42)', icon: FaMusic },
  videoplayer: { bg: 'linear-gradient(145deg, #F87171 0%, #DC2626 58%, #7F1D1D 100%)', fg: '#FFFFFF', glow: 'rgba(248,113,113,0.38)', icon: FaVideo },
  imageviewer: { bg: 'linear-gradient(145deg, #C084FC 0%, #9333EA 58%, #581C87 100%)', fg: '#FFFFFF', glow: 'rgba(192,132,252,0.42)', icon: FaImage },
  photoeditor: { bg: 'linear-gradient(145deg, #FB923C 0%, #EA580C 58%, #7C2D12 100%)', fg: '#FFFFFF', glow: 'rgba(251,146,60,0.38)', icon: FaCropAlt },
  voicerecorder: { bg: 'linear-gradient(145deg, #FB7185 0%, #E11D48 58%, #881337 100%)', fg: '#FFFFFF', glow: 'rgba(251,113,133,0.42)', icon: FaMicrophone },
  screenrecorder: { bg: 'linear-gradient(145deg, #F87171 0%, #B91C1C 58%, #450A0A 100%)', fg: '#FFFFFF', glow: 'rgba(248,113,113,0.38)', icon: FaDesktop },
  mediaconverter: { bg: 'linear-gradient(145deg, #A78BFA 0%, #7C3AED 58%, #3B0764 100%)', fg: '#FFFFFF', glow: 'rgba(167,139,250,0.42)', icon: FaRandom },
  minesweeper: { bg: 'linear-gradient(145deg, #F43F5E 0%, #BE123C 58%, #4C0519 100%)', fg: '#FFFFFF', glow: 'rgba(244,63,94,0.42)', icon: FaBomb },
  snake: { bg: 'linear-gradient(145deg, #86EFAC 0%, #16A34A 58%, #14532D 100%)', fg: '#FFFFFF', glow: 'rgba(134,239,172,0.38)', icon: FaGamepad },
  tetris: { bg: 'linear-gradient(145deg, #C084FC 0%, #9333EA 58%, #581C87 100%)', fg: '#FFFFFF', glow: 'rgba(192,132,252,0.42)', icon: FaColumns },
  tictactoe: { bg: 'linear-gradient(145deg, #60A5FA 0%, #2563EB 58%, #1E3A8A 100%)', fg: '#FFFFFF', glow: 'rgba(96,165,250,0.38)', icon: FaTimes },
  game2048: { bg: 'linear-gradient(145deg, #FDE047 0%, #F59E0B 58%, #92400E 100%)', fg: '#1F2937', glow: 'rgba(250,204,21,0.38)', icon: FaTable },
  sudoku: { bg: 'linear-gradient(145deg, #2DD4BF 0%, #0D9488 58%, #134E4A 100%)', fg: '#FFFFFF', glow: 'rgba(45,212,191,0.38)', icon: FaTable },
  chess: { bg: 'linear-gradient(145deg, #E5E7EB 0%, #6B7280 58%, #111827 100%)', fg: '#FFFFFF', glow: 'rgba(229,231,235,0.32)', icon: FaChessKnight },
  memory: { bg: 'linear-gradient(145deg, #F472B6 0%, #DB2777 58%, #831843 100%)', fg: '#FFFFFF', glow: 'rgba(244,114,182,0.42)', icon: FaBrain },
  pong: { bg: 'linear-gradient(145deg, #334155 0%, #020617 62%, #111827 100%)', fg: '#FFFFFF', glow: 'rgba(71,85,105,0.36)', icon: FaCircle },
  solitaire: { bg: 'linear-gradient(145deg, #4ADE80 0%, #15803D 58%, #14532D 100%)', fg: '#FFFFFF', glow: 'rgba(74,222,128,0.38)', icon: FaLayerGroup },
  flappybird: { bg: 'linear-gradient(145deg, #FDE047 0%, #F97316 58%, #9A3412 100%)', fg: '#FFFFFF', glow: 'rgba(250,204,21,0.38)', icon: FaFeatherAlt },
  codeeditor: { bg: 'linear-gradient(145deg, #818CF8 0%, #4F46E5 58%, #1E1B4B 100%)', fg: '#FFFFFF', glow: 'rgba(129,140,248,0.42)', icon: FaCode },
  jsonformatter: { bg: 'linear-gradient(145deg, #94A3B8 0%, #475569 58%, #111827 100%)', fg: '#FFFFFF', glow: 'rgba(148,163,184,0.34)', icon: FaCode },
  regextester: { bg: 'linear-gradient(145deg, #818CF8 0%, #4F46E5 58%, #312E81 100%)', fg: '#FFFFFF', glow: 'rgba(129,140,248,0.42)', icon: FaSearch },
  markdownpreview: { bg: 'linear-gradient(145deg, #334155 0%, #020617 62%, #111827 100%)', fg: '#FFFFFF', glow: 'rgba(51,65,85,0.36)', icon: FaFileAlt },
  gitclient: { bg: 'linear-gradient(145deg, #F87171 0%, #DC2626 58%, #7F1D1D 100%)', fg: '#FFFFFF', glow: 'rgba(248,113,113,0.38)', icon: FaGitAlt },
  apitester: { bg: 'linear-gradient(145deg, #2DD4BF 0%, #0D9488 58%, #134E4A 100%)', fg: '#FFFFFF', glow: 'rgba(45,212,191,0.38)', icon: FaPaperPlane },
  base64tool: { bg: 'linear-gradient(145deg, #C084FC 0%, #7C3AED 58%, #3B0764 100%)', fg: '#FFFFFF', glow: 'rgba(192,132,252,0.42)', icon: FaCode },
  colorpalette: { bg: 'linear-gradient(145deg, #FB923C 0%, #EA580C 58%, #7C2D12 100%)', fg: '#FFFFFF', glow: 'rgba(251,146,60,0.38)', icon: FaPalette },
  drawing: { bg: 'linear-gradient(145deg, #A855F7 0%, #7C3AED 58%, #3B0764 100%)', fg: '#FFFFFF', glow: 'rgba(168,85,247,0.42)', icon: FaPaintBrush },
  colorpicker: { bg: 'linear-gradient(145deg, #F472B6 0%, #DB2777 58%, #831843 100%)', fg: '#FFFFFF', glow: 'rgba(244,114,182,0.42)', icon: FaEyeDropper },
  imagegallery: { bg: 'linear-gradient(145deg, #7DD3FC 0%, #0EA5E9 58%, #075985 100%)', fg: '#FFFFFF', glow: 'rgba(125,211,252,0.42)', icon: FaImages },
  asciiart: { bg: 'linear-gradient(145deg, #111827 0%, #020617 62%, #0F766E 100%)', fg: '#5EEAD4', glow: 'rgba(20,184,166,0.35)', icon: FaFont },
  matrixrain: { bg: 'linear-gradient(145deg, #22C55E 0%, #15803D 58%, #052E16 100%)', fg: '#BBF7D0', glow: 'rgba(34,197,94,0.46)', icon: FaCloud },
};

const ICON_ALIASES: Record<string, IconType> = {
  Accessibility: FaUniversalAccess,
  Activity: FaMicrochip,
  Battery: FaBatteryFull,
  Bell: FaBell,
  Binary: FaCode,
  Bluetooth: FaBluetoothB,
  Bomb: FaBomb,
  Brain: FaBrain,
  Braces: FaCode,
  Calculator: FaCalculator,
  Calendar: FaCalendarAlt,
  CheckSquare: FaCheckSquare,
  Circle: FaCircle,
  Cloud: FaCloud,
  CloudSun: FaCloudSun,
  Code: FaCode,
  Code2: FaCode,
  Columns2: FaColumns,
  Copy: FaCopy,
  Cpu: FaMicrochip,
  Crop: FaCropAlt,
  Crown: FaChessKnight,
  Edit: FaEdit,
  ExternalLink: FaExternalLinkAlt,
  Feather: FaFeatherAlt,
  File: FaFileAlt,
  FileCode: FaFileAlt,
  FilePlus: FaFileMedical,
  FileText: FaFileAlt,
  Folder: FaFolderOpen,
  FolderPlus: FaFolderPlus,
  Gamepad2: FaGamepad,
  GitBranch: FaGitAlt,
  Globe: FaGlobe,
  Grid: FaTable,
  Grid2x2: FaTable,
  Grid3x3: FaTable,
  Hash: FaTable,
  Home: FaHome,
  Image: FaImage,
  Images: FaImages,
  Keyboard: FaKeyboard,
  Layout: FaChalkboard,
  LayoutGrid: FaTable,
  Layers: FaLayerGroup,
  Lock: FaLock,
  LockKeyhole: FaLock,
  LogOut: FaSignOutAlt,
  Mail: FaEnvelope,
  MessageSquare: FaComments,
  Mic: FaMicrophone,
  Monitor: FaDesktop,
  Music: FaMusic,
  Network: FaNetworkWired,
  Package: FaArchive,
  Paintbrush: FaPaintBrush,
  Palette: FaPalette,
  PenTool: FaPaintBrush,
  Pipette: FaEyeDropper,
  Play: FaPlay,
  PlayCircle: FaPlay,
  Power: FaPowerOff,
  RefreshCw: FaRandom,
  Rss: FaRss,
  Scissors: FaCut,
  Search: FaSearch,
  SearchCode: FaSearch,
  Send: FaPaperPlane,
  Server: FaServer,
  Settings: FaCog,
  Shuffle: FaRandom,
  StickyNote: FaStickyNote,
  Table2: FaTable,
  Terminal: FaTerminal,
  Trash2: FaTrash,
  Trello: FaTable,
  Type: FaFont,
  Users: FaUsers,
  Video: FaVideo,
  Volume2: FaVolumeUp,
  Wifi: FaWifi,
  WindowRestore: FaWindowRestore,
  X: FaTimes,
  CloudUpload: FaCloudUploadAlt,
  Robot: FaRobot,
  Minus: FaMinus,
  Pause: FaPause,
};

export function getAppVisual(appId?: string): AppVisual {
  if (!appId) return DEFAULT_VISUAL;
  return APP_VISUALS[appId.toLowerCase()] || DEFAULT_VISUAL;
}

export function getSystemIcon(name?: string, appId?: string): IconType {
  if (appId) return getAppVisual(appId).icon;
  if (!name) return DEFAULT_VISUAL.icon;
  return ICON_ALIASES[name] || ICON_ALIASES[name.replace(/\s/g, '')] || DEFAULT_VISUAL.icon;
}

interface SystemIconProps {
  name?: string;
  appId?: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
  title?: string;
}

export default function SystemIcon({ name, appId, size = 18, className = '', style, title }: SystemIconProps) {
  const Icon = getSystemIcon(name, appId);
  return <Icon size={size} className={className} style={style} title={title} aria-hidden={title ? undefined : true} />;
}
