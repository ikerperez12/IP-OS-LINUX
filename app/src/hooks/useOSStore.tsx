// ============================================================
// OS State Management — React Context + useReducer
// ============================================================

import React, { createContext, useContext, useReducer, useCallback, useEffect, useState } from 'react';
import { storageGet, storageSet } from '@/lib/storage';
import {
  arrangeDesktopIcons,
  createDesktopGridMetrics,
  moveItemsToGrid,
  normalizePositionToGrid,
} from '@/lib/desktopLayoutEngine';
import type {
  OSState,
  OSAction,
  Window,
  DesktopIcon,
  DesktopFolderItem,
  Notification,
  DockItem,
  WindowState,
  UIPreferences,
  DockPreferences,
  SystemControlState,
  AppCategory,,
  ClipboardEntry,} from '@/types';
import { APP_REGISTRY, getAppById, getDefaultDockApps } from '@/apps/registry';

// ---- Helpers ----
const generateId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const TOP_PANEL_HEIGHT = 28;

const isTabletViewport = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 900 || window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
};

const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const defaultUIPreferences: UIPreferences = {
  reduceMotion: prefersReducedMotion(),
  blurIntensity: 28,
  wallpaperQuality: 'high',
  iconScale: 1,
  tabletMode: isTabletViewport(),
  screenFilter: 'none',
  acrylicNoise: true,
  wobblyWindows: true,
  audioVisualizer: true,
  dynamicShadows: true,
  edgeSheen: true,
};

const defaultDockPreferences: DockPreferences = {
  size: 52,
  magnification: 1.38,
  transparency: 0.55,
  position: 'bottom',
  showTasks: false,
  compact: false,
};

const defaultSystemControls: SystemControlState = {
  volume: 78,
  muted: false,
  networkEnabled: true,
  bluetoothEnabled: false,
  keyboardLayout: 'US',
  highContrast: false,
  batterySaver: false,
};

const createWindow = (state: OSState, appId: string, title?: string): Window => {
  const app = getAppById(appId);
  if (!app) throw new Error(`Unknown app: ${appId}`);
  const id = generateId();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const shouldMaximize = state.uiPreferences.tabletMode || isTabletViewport();
  const categoryRatio: Record<AppCategory, { w: number; h: number }> = {
    System: { w: 0.68, h: 0.66 },
    Productivity: { w: 0.72, h: 0.72 },
    Internet: { w: 0.78, h: 0.76 },
    Media: { w: 0.72, h: 0.7 },
    Games: { w: 0.56, h: 0.68 },
    DevTools: { w: 0.8, h: 0.78 },
    Creative: { w: 0.76, h: 0.76 },
  };
  const bottomReserve = 104;
  const availableW = Math.max(360, vw - 56);
  const availableH = Math.max(300, vh - TOP_PANEL_HEIGHT - bottomReserve - 24);
  const ratios = categoryRatio[app.category] || { w: 0.72, h: 0.7 };
  const width = Math.min(availableW, Math.max(app.defaultSize.width, Math.round(availableW * ratios.w)));
  const height = Math.min(availableH, Math.max(app.defaultSize.height, Math.round(availableH * ratios.h)));
  const visibleCount = state.windows.filter((w) => w.state !== 'minimized').length;
  const offset = (visibleCount % 6) * 28;
  const x = Math.max(18, Math.min(vw - width - 18, Math.round((vw - width) / 2) + offset));
  const y = Math.max(TOP_PANEL_HEIGHT + 12, Math.min(vh - bottomReserve - height, TOP_PANEL_HEIGHT + Math.round((availableH - height) / 2) + 22 + offset));
  return {
    id,
    appId,
    title: title || app.name,
    position: shouldMaximize ? { x: 0, y: TOP_PANEL_HEIGHT } : { x, y },
    size: shouldMaximize ? { width: vw, height: vh - TOP_PANEL_HEIGHT - 64 } : { width, height },
    state: shouldMaximize ? 'maximized' : 'normal',
    isFocused: true,
    workspaceId: state.activeWorkspace,
    zIndex: state.nextZIndex,
    icon: app.icon,
    createdAt: Date.now(),
  };
};

// ---- Initial State ----
const categoryMeta: Record<AppCategory, { name: string; icon: string; accent: string; order: number }> = {
  System: { name: 'System', icon: 'Cpu', accent: '#64748B', order: 0 },
  Internet: { name: 'Internet', icon: 'Globe', accent: '#0EA5E9', order: 1 },
  Productivity: { name: 'Productivity', icon: 'Briefcase', accent: '#8B5CF6', order: 2 },
  Media: { name: 'Media', icon: 'Music', accent: '#EC4899', order: 3 },
  Games: { name: 'Games', icon: 'Gamepad2', accent: '#22C55E', order: 4 },
  Creative: { name: 'Creative', icon: 'Palette', accent: '#F97316', order: 5 },
  DevTools: { name: 'Dev Tools', icon: 'Code2', accent: '#14B8A6', order: 6 },
};

const toFolderItem = (app: typeof APP_REGISTRY[number]): DesktopFolderItem => ({
  id: `child-${app.id}`,
  name: app.name,
  icon: app.icon,
  appId: app.id,
});

const createDefaultDesktopIcons = (): DesktopIcon[] => {
  const grouped = APP_REGISTRY.reduce((acc, app) => {
    const key = app.category;
    acc[key] = [...(acc[key] || []), toFolderItem(app)];
    return acc;
  }, {} as Record<AppCategory, DesktopFolderItem[]>);

  const folders = (Object.keys(categoryMeta) as AppCategory[])
    .sort((a, b) => categoryMeta[a].order - categoryMeta[b].order)
    .map((category, index) => {
      const meta = categoryMeta[category];
      return {
        id: `desk-folder-${category.toLowerCase()}`,
        name: meta.name,
        icon: meta.icon,
        kind: 'folder' as const,
        position: { x: 26 + (index % 4) * 126, y: 18 + Math.floor(index / 4) * 136 },
        isSelected: false,
        children: grouped[category] || [],
        folderAccent: meta.accent,
        folderLayout: 'grid' as const,
      };
    });

  return folders;
};

const defaultDesktopIcons: DesktopIcon[] = createDefaultDesktopIcons();

const createInitialDockItems = (): DockItem[] => {
  const pinned = getDefaultDockApps();
  return APP_REGISTRY.map((app) => ({
    appId: app.id,
    isPinned: pinned.includes(app.id),
    isOpen: false,
    isFocused: false,
    bounce: false,
  }));
};

const loadDesktopIcons = (): DesktopIcon[] => {
  return defaultDesktopIcons;
};

const desktopMetricsForViewport = (state: OSState) => (
  createDesktopGridMetrics(
    window.innerWidth,
    Math.max(320, window.innerHeight - TOP_PANEL_HEIGHT - 96),
    state.uiPreferences.tabletMode,
    state.uiPreferences.iconScale
  )
);

const iconToFolderItem = (icon: DesktopIcon): DesktopFolderItem[] => {
  if (icon.kind === 'folder') return icon.children || [];
  return [{
    id: `child-${icon.id}`,
    name: icon.name,
    icon: icon.icon,
    appId: icon.appId,
  }];
};

const compactFolders = (icons: DesktopIcon[], metrics: ReturnType<typeof desktopMetricsForViewport>): DesktopIcon[] => {
  const expanded = icons.flatMap((icon) => {
    if (icon.kind !== 'folder' || !icon.children) return [icon];
    if (icon.children.length === 0) return [];
    if (icon.children.length === 1) {
      const child = icon.children[0];
      return [{
        id: `desk-${child.appId || child.id}-${generateId()}`,
        name: child.name,
        icon: child.icon,
        kind: 'app' as const,
        appId: child.appId,
        position: icon.position,
        isSelected: icon.isSelected,
      }];
    }
    return [icon];
  });
  return arrangeDesktopIcons(expanded, metrics);
};

const initialState: OSState = {
  bootPhase: 'off',
  auth: { isAuthenticated: false, isGuest: false, userName: 'User' },
  windows: [],
  apps: APP_REGISTRY,
  desktopIcons: loadDesktopIcons(),
  theme: {
    mode: 'dark',
    accent: '#7C4DFF',
    wallpaper: 'default',
    wallpaperMode: 'animated',
    animatedWallpaper: 'aurora',
  },
  uiPreferences: defaultUIPreferences,
  dockPreferences: defaultDockPreferences,
  systemControls: defaultSystemControls,
  clipboard: [],
  workspaces: [
    { id: 1, name: 'Workspace 1' },
    { id: 2, name: 'Workspace 2' },
    { id: 3, name: 'Workspace 3' },
  ],
  activeWorkspace: 1,
  appHandoff: ((): Record<string, unknown> => {
    try {
      const raw = localStorage.getItem('iplinux_app_handoff_v1');
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  })(),
  notifications: [],
  dockItems: createInitialDockItems(),
  contextMenu: {
    visible: false,
    x: 0,
    y: 0,
    type: 'desktop',
    items: [],
  },
  appLauncherOpen: false,
  notificationCenterOpen: false,
  activeWindowId: null,
  nextZIndex: 100,
  isAltTabbing: false,
  altTabIndex: 0,
};

// ---- Reducer ----
function osReducer(state: OSState, action: OSAction): OSState {
  switch (action.type) {
    case 'SET_BOOT_PHASE': {
      return { ...state, bootPhase: action.phase };
    }

    case 'LOGIN': {
      return {
        ...state,
        auth: { isAuthenticated: true, isGuest: action.isGuest, userName: action.isGuest ? 'Guest' : 'User' },
        bootPhase: 'desktop',
      };
    }

    case 'LOGOUT': {
      return {
        ...state,
        auth: { isAuthenticated: false, isGuest: false, userName: 'User' },
        windows: [],
        bootPhase: 'login',
        activeWindowId: null,
      };
    }

    case 'OPEN_WINDOW': {
      const win = createWindow(state, action.appId, action.title);
      const newWindows = state.windows.map((w) => ({ ...w, isFocused: false }));
      const updatedDock = state.dockItems.map((d) =>
        d.appId === action.appId ? { ...d, isOpen: true, isFocused: true, bounce: true } : { ...d, isFocused: false }
      );
      return {
        ...state,
        windows: [...newWindows, win],
        activeWindowId: win.id,
        nextZIndex: state.nextZIndex + 1,
        dockItems: updatedDock,
      };
    }

    case 'RESTORE_OR_FOCUS_APP_WINDOW': {
      const existing = [...state.windows]
        .reverse()
        .find((w) => w.appId === action.appId);

      if (!existing) {
        const win = createWindow(state, action.appId);
        const newWindows = state.windows.map((w) => ({ ...w, isFocused: false }));
        const updatedDock = state.dockItems.map((d) =>
          d.appId === action.appId ? { ...d, isOpen: true, isFocused: true, bounce: true } : { ...d, isFocused: false }
        );
        return {
          ...state,
          windows: [...newWindows, win],
          activeWindowId: win.id,
          nextZIndex: state.nextZIndex + 1,
          dockItems: updatedDock,
        };
      }

      const nextZ = state.nextZIndex + 1;
      const restoredPosition = existing.prevPosition || existing.position;
      const restoredSize = existing.prevSize || existing.size;
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === existing.id
            ? {
                ...w,
                state: w.state === 'minimized' ? 'normal' as WindowState : w.state,
                position: w.state === 'minimized' ? restoredPosition : w.position,
                size: w.state === 'minimized' ? restoredSize : w.size,
                prevPosition: undefined,
                prevSize: undefined,
                isFocused: true,
                zIndex: nextZ,
              }
            : { ...w, isFocused: false }
        ),
        activeWindowId: existing.id,
        nextZIndex: nextZ,
        dockItems: state.dockItems.map((d) =>
          d.appId === action.appId ? { ...d, isOpen: true, isFocused: true } : { ...d, isFocused: false }
        ),
      };
    }

    case 'CLOSE_WINDOW': {
      const appId = state.windows.find((w) => w.id === action.windowId)?.appId;
      const remaining = state.windows.filter((w) => w.id !== action.windowId);
      const hasOtherWindows = remaining.some((w) => w.appId === appId);
      const hasVisible = remaining.some((w) => w.appId === appId && w.state !== 'minimized');
      let updatedDock = state.dockItems;
      if (appId) {
        updatedDock = state.dockItems.map((d) =>
          d.appId === appId ? { ...d, isOpen: hasOtherWindows, isFocused: hasVisible } : d
        );
      }
      const newActiveId = remaining.length > 0
        ? remaining.reduce((a, b) => (a.zIndex > b.zIndex ? a : b)).id
        : null;
      return {
        ...state,
        windows: remaining,
        activeWindowId: newActiveId,
        dockItems: updatedDock,
      };
    }

    case 'MINIMIZE_WINDOW': {
      const win = state.windows.find((w) => w.id === action.windowId);
      if (!win) return state;
      const updated = state.windows.map((w) =>
        w.id === action.windowId
          ? { ...w, state: 'minimized' as WindowState, isFocused: false, prevPosition: { ...w.position }, prevSize: { ...w.size } }
          : w
      );
      const appId = win.appId;
      const hasVisible = updated.some((w) => w.appId === appId && w.state !== 'minimized');
      const updatedDock = state.dockItems.map((d) =>
        d.appId === appId ? { ...d, isFocused: hasVisible, isOpen: true } : d
      );
      const newActiveId = updated
        .filter((w) => w.state !== 'minimized')
        .reduce((a, b) => (a && a.zIndex > b.zIndex ? a : b), null as Window | null);
      return { ...state, windows: updated, activeWindowId: newActiveId?.id ?? null, dockItems: updatedDock };
    }

    case 'MAXIMIZE_WINDOW': {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === action.windowId
            ? {
                ...w,
                state: 'maximized' as WindowState,
                prevPosition: { ...w.position },
                prevSize: { ...w.size },
                position: { x: 0, y: TOP_PANEL_HEIGHT },
                size: { width: vw, height: vh - TOP_PANEL_HEIGHT - 48 },
              }
            : w
        ),
      };
    }

    case 'RESTORE_WINDOW': {
      const win = state.windows.find((w) => w.id === action.windowId);
      if (!win) return state;
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === action.windowId
            ? {
                ...w,
                state: 'normal' as WindowState,
                position: win.prevPosition || w.position,
                size: win.prevSize || w.size,
                prevPosition: undefined,
                prevSize: undefined,
              }
            : w
        ),
      };
    }

    case 'FOCUS_WINDOW': {
      const nextZ = state.nextZIndex + 1;
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === action.windowId
            ? { ...w, isFocused: true, zIndex: nextZ }
            : { ...w, isFocused: false }
        ),
        activeWindowId: action.windowId,
        nextZIndex: nextZ,
        dockItems: state.dockItems.map((d) => {
          const isThisApp = state.windows.some((w) => w.id === action.windowId && w.appId === d.appId);
          return { ...d, isFocused: isThisApp };
        }),
      };
    }

    case 'MOVE_WINDOW': {
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === action.windowId ? { ...w, position: action.position } : w
        ),
      };
    }

    case 'RESIZE_WINDOW': {
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === action.windowId ? { ...w, size: action.size } : w
        ),
      };
    }

    case 'SET_ACTIVE_WINDOW': {
      return {
        ...state,
        activeWindowId: action.windowId,
        windows: state.windows.map((w) => ({ ...w, isFocused: w.id === action.windowId })),
      };
    }

    case 'TOGGLE_APP_LAUNCHER': {
      return { ...state, appLauncherOpen: !state.appLauncherOpen };
    }

    case 'SET_APP_LAUNCHER': {
      return { ...state, appLauncherOpen: action.open };
    }

    case 'TOGGLE_NOTIFICATION_CENTER': {
      return { ...state, notificationCenterOpen: !state.notificationCenterOpen };
    }

    case 'ADD_NOTIFICATION': {
      const notif: Notification = {
        ...action.notification,
        id: generateId(),
        timestamp: Date.now(),
        isRead: false,
      };
      return { ...state, notifications: [notif, ...state.notifications].slice(0, 50) };
    }

    case 'REMOVE_NOTIFICATION': {
      return { ...state, notifications: state.notifications.filter((n) => n.id !== action.id) };
    }

    case 'CLEAR_NOTIFICATIONS': {
      return { ...state, notifications: [] };
    }

    case 'MARK_NOTIFICATION_READ': {
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.id ? { ...n, isRead: true } : n
        ),
      };
    }

    case 'ADD_DESKTOP_ICON': {
      const metrics = desktopMetricsForViewport(state);
      const icon: DesktopIcon = {
        ...action.icon,
        id: generateId(),
        kind: action.icon.kind || 'app',
        position: normalizePositionToGrid(action.icon.position, metrics),
      };
      const next = arrangeDesktopIcons([...state.desktopIcons, icon], metrics);
      return { ...state, desktopIcons: next };
    }

    case 'REMOVE_DESKTOP_ICON': {
      const next = state.desktopIcons.filter((i) => i.id !== action.id);
      return { ...state, desktopIcons: next };
    }

    case 'REMOVE_DESKTOP_ICONS': {
      const removeIds = new Set(action.ids);
      const next = state.desktopIcons.filter((i) => !removeIds.has(i.id));
      return { ...state, desktopIcons: next };
    }

    case 'UPDATE_DESKTOP_ICON_POSITION': {
      const metrics = desktopMetricsForViewport(state);
      const next = state.desktopIcons.map((i) =>
        i.id === action.id ? { ...i, position: normalizePositionToGrid(action.position, metrics) } : i
      );
      return { ...state, desktopIcons: next };
    }

    case 'UPDATE_DESKTOP_ICON_POSITIONS': {
      const metrics = desktopMetricsForViewport(state);
      const next = state.desktopIcons.map((i) =>
        action.positions[i.id] ? { ...i, position: normalizePositionToGrid(action.positions[i.id], metrics) } : i
      );
      return { ...state, desktopIcons: arrangeDesktopIcons(next, metrics) };
    }

    case 'MOVE_DESKTOP_ITEMS_TO_CELL': {
      const metrics = desktopMetricsForViewport(state);
      return {
        ...state,
        desktopIcons: moveItemsToGrid(state.desktopIcons, action.ids, action.anchorPosition, metrics),
      };
    }

    case 'CREATE_DESKTOP_FOLDER': {
      const metrics = desktopMetricsForViewport(state);
      const sourceSet = new Set(action.sourceIds);
      if (action.targetId) sourceSet.add(action.targetId);
      const sourceIcons = state.desktopIcons.filter((icon) => sourceSet.has(icon.id));
      if (sourceIcons.length < 2) return state;
      const folderPosition = normalizePositionToGrid(action.position || sourceIcons[0].position, metrics);
      const children = sourceIcons.flatMap(iconToFolderItem);
      const folder: DesktopIcon = {
        id: `desk-folder-${generateId()}`,
        name: action.name || 'New Folder',
        icon: 'Folder',
        kind: 'folder',
        position: folderPosition,
        isSelected: true,
        children,
        folderAccent: '#7C4DFF',
        folderLayout: 'grid',
      };
      const next = state.desktopIcons
        .filter((icon) => !sourceSet.has(icon.id))
        .map((icon) => ({ ...icon, isSelected: false }));
      return { ...state, desktopIcons: moveItemsToGrid([...next, folder], [folder.id], folderPosition, metrics) };
    }

    case 'MOVE_DESKTOP_ITEM_TO_FOLDER': {
      const metrics = desktopMetricsForViewport(state);
      const source = state.desktopIcons.find((icon) => icon.id === action.sourceId);
      const folder = state.desktopIcons.find((icon) => icon.id === action.folderId && icon.kind === 'folder');
      if (!source || !folder || source.id === folder.id) return state;
      const sourceChildren = iconToFolderItem(source);
      const next = state.desktopIcons
        .filter((icon) => icon.id !== source.id)
        .map((icon) => icon.id === folder.id
          ? {
              ...icon,
              children: [...(icon.children || []), ...sourceChildren],
              isSelected: true,
            }
          : { ...icon, isSelected: false });
      return { ...state, desktopIcons: compactFolders(next, metrics) };
    }

    case 'REMOVE_DESKTOP_ITEM_FROM_FOLDER': {
      const metrics = desktopMetricsForViewport(state);
      const folder = state.desktopIcons.find((icon) => icon.id === action.folderId && icon.kind === 'folder');
      const child = folder?.children?.find((item) => item.id === action.childId);
      if (!folder || !child) return state;
      const nextFolderChildren = (folder.children || []).filter((item) => item.id !== child.id);
      const newIcon: DesktopIcon = {
        id: `desk-${child.appId || child.id}-${generateId()}`,
        name: child.name,
        icon: child.icon,
        kind: 'app',
        appId: child.appId,
        position: normalizePositionToGrid(action.position || folder.position, metrics),
        isSelected: true,
      };
      const next = state.desktopIcons
        .map((icon) => icon.id === folder.id ? { ...icon, children: nextFolderChildren, isSelected: false } : icon)
        .concat(newIcon);
      return { ...state, desktopIcons: compactFolders(next, metrics) };
    }

    case 'SELECT_DESKTOP_ICON': {
      return {
        ...state,
        desktopIcons: state.desktopIcons.map((i) =>
          ({ ...i, isSelected: i.id === action.id })
        ),
      };
    }

    case 'SELECT_DESKTOP_ICONS': {
      const selectedIds = new Set(action.ids);
      return {
        ...state,
        desktopIcons: state.desktopIcons.map((i) =>
          ({ ...i, isSelected: selectedIds.has(i.id) })
        ),
      };
    }

    case 'SET_THEME': {
      return { ...state, theme: { ...state.theme, ...action.theme } };
    }

    case 'SET_UI_PREFERENCES': {
      return { ...state, uiPreferences: { ...state.uiPreferences, ...action.preferences } };
    }

    case 'SET_WALLPAPER_MODE': {
      return { ...state, theme: { ...state.theme, wallpaperMode: action.mode } };
    }

    case 'SET_ANIMATED_WALLPAPER': {
      return { ...state, theme: { ...state.theme, animatedWallpaper: action.wallpaper, wallpaperMode: 'animated' } };
    }

    case 'SET_DOCK_PREFERENCES': {
      return { ...state, dockPreferences: { ...state.dockPreferences, ...action.preferences } };
    }

    case 'SET_SYSTEM_CONTROLS': {
      const controls = { ...state.systemControls, ...action.controls };
      const nextPrefs = action.controls.batterySaver === undefined
        ? state.uiPreferences
        : {
            ...state.uiPreferences,
            reduceMotion: action.controls.batterySaver ? true : state.uiPreferences.reduceMotion,
            wallpaperQuality: action.controls.batterySaver ? 'low' as const : state.uiPreferences.wallpaperQuality,
          };
      return { ...state, systemControls: controls, uiPreferences: nextPrefs };
    }

    case 'SET_TABLET_MODE': {
      return { ...state, uiPreferences: { ...state.uiPreferences, tabletMode: action.tabletMode } };
    }

    case 'PUSH_CLIPBOARD': {
      const id = generateId();
      const next: ClipboardEntry = { id, createdAt: Date.now(), ...action.entry };
      const filtered = state.clipboard.filter((e) => e.payload !== next.payload);
      return { ...state, clipboard: [next, ...filtered].slice(0, 10) };
    }

    case 'CLEAR_CLIPBOARD': {
      return { ...state, clipboard: [] };
    }

    case 'REMOVE_CLIPBOARD': {
      return { ...state, clipboard: state.clipboard.filter((e) => e.id !== action.id) };
    }

    case 'SET_ACTIVE_WORKSPACE': {
      return { ...state, activeWorkspace: action.id };
    }

    case 'ADD_WORKSPACE': {
      const id = (state.workspaces[state.workspaces.length - 1]?.id || 0) + 1;
      return { ...state, workspaces: [...state.workspaces, { id, name: `Workspace ${id}` }] };
    }

    case 'REMOVE_WORKSPACE': {
      if (state.workspaces.length <= 1) return state;
      const remaining = state.workspaces.filter((w) => w.id !== action.id);
      const fallback = remaining[0]?.id || 1;
      const windows = state.windows.map((w) =>
        (w.workspaceId || 1) === action.id ? { ...w, workspaceId: fallback } : w
      );
      return {
        ...state,
        workspaces: remaining,
        windows,
        activeWorkspace: state.activeWorkspace === action.id ? fallback : state.activeWorkspace,
      };
    }

    case 'MOVE_WINDOW_TO_WORKSPACE': {
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.id === action.windowId ? { ...w, workspaceId: action.workspaceId } : w
        ),
      };
    }

    case 'SET_APP_HANDOFF': {
      const next = { ...state.appHandoff, [action.appId]: action.state };
      try { localStorage.setItem('iplinux_app_handoff_v1', JSON.stringify(next)); } catch {}
      return { ...state, appHandoff: next };
    }

    case 'TOGGLE_THEME': {
      const mode = state.theme.mode === 'dark' ? 'light' : 'dark';
      return { ...state, theme: { ...state.theme, mode } };
    }

    case 'PIN_DOCK_ITEM': {
      return {
        ...state,
        dockItems: state.dockItems.map((d) =>
          d.appId === action.appId ? { ...d, isPinned: true } : d
        ),
      };
    }

    case 'UNPIN_DOCK_ITEM': {
      return {
        ...state,
        dockItems: state.dockItems.map((d) =>
          d.appId === action.appId ? { ...d, isPinned: false } : d
        ),
      };
    }

    case 'BOUNCE_DOCK_ITEM': {
      return {
        ...state,
        dockItems: state.dockItems.map((d) =>
          d.appId === action.appId ? { ...d, bounce: true } : { ...d, bounce: false }
        ),
      };
    }

    case 'CLEAR_DOCK_BOUNCE': {
      return {
        ...state,
        dockItems: state.dockItems.map((d) =>
          action.appId && d.appId !== action.appId ? d : { ...d, bounce: false }
        ),
      };
    }

    case 'SHOW_CONTEXT_MENU': {
      return {
        ...state,
        contextMenu: {
          visible: true,
          x: action.x,
          y: action.y,
          type: action.menuType,
          items: action.items,
          contextData: action.contextData,
        },
      };
    }

    case 'HIDE_CONTEXT_MENU': {
      return { ...state, contextMenu: { ...state.contextMenu, visible: false } };
    }

    case 'START_ALT_TAB': {
      const visibleWins = state.windows.filter((w) => w.state !== 'minimized');
      return {
        ...state,
        isAltTabbing: true,
        altTabIndex: visibleWins.length > 0 ? visibleWins.length - 1 : 0,
      };
    }

    case 'CYCLE_ALT_TAB': {
      const visibleWins = state.windows.filter((w) => w.state !== 'minimized');
      return {
        ...state,
        altTabIndex: visibleWins.length > 0
          ? (state.altTabIndex + 1) % visibleWins.length
          : 0,
      };
    }

    case 'END_ALT_TAB': {
      const visibleWins = state.windows.filter((w) => w.state !== 'minimized');
      const target = visibleWins[state.altTabIndex];
      return {
        ...state,
        isAltTabbing: false,
        altTabIndex: 0,
        ...(target ? {
          activeWindowId: target.id,
          windows: state.windows.map((w) =>
            w.id === target.id ? { ...w, isFocused: true, zIndex: state.nextZIndex } : { ...w, isFocused: false }
          ),
          nextZIndex: state.nextZIndex + 1,
        } : {}),
      };
    }

    case 'CASCADE_WINDOWS': {
      let z = state.nextZIndex;
      const updated = state.windows.map((w, i) => ({
        ...w,
        position: { x: 40 + i * 30, y: TOP_PANEL_HEIGHT + 20 + i * 30 },
        zIndex: z++,
        isFocused: i === state.windows.length - 1,
      }));
      return {
        ...state,
        windows: updated,
        activeWindowId: updated.length > 0 ? updated[updated.length - 1].id : null,
        nextZIndex: z,
      };
    }

    case 'MINIMIZE_ALL': {
      return {
        ...state,
        windows: state.windows.map((w) =>
          w.state !== 'minimized'
            ? { ...w, state: 'minimized' as WindowState, isFocused: false }
            : w
        ),
        activeWindowId: null,
        dockItems: state.dockItems.map((d) => ({ ...d, isFocused: false })),
      };
    }

    case 'ARRANGE_DESKTOP_ICONS': {
      const metrics = desktopMetricsForViewport(state);
      return { ...state, desktopIcons: arrangeDesktopIcons(state.desktopIcons, metrics) };
    }

    case 'SET_DESKTOP_ICONS': {
      const metrics = desktopMetricsForViewport(state);
      return { ...state, desktopIcons: arrangeDesktopIcons(action.icons, metrics) };
    }

    default:
      return state;
  }
}

// ---- Context ----
interface OSContextType {
  state: OSState;
  dispatch: React.Dispatch<OSAction>;
}

const OSContext = createContext<OSContextType | null>(null);

export const OSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(osReducer, initialState);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      storageGet<DesktopIcon[]>('iplinux_desktop_icons_v6'),
      storageGet<OSState['theme']>('iplinux_theme_v2'),
      storageGet<UIPreferences>('iplinux_ui_preferences_v2'),
      storageGet<DockPreferences>('iplinux_dock_preferences_v2'),
      storageGet<SystemControlState>('iplinux_system_controls_v1'),
    ]).then(([savedIcons, savedTheme, savedUIPrefs, savedDockPrefs, savedControls]) => {
      if (savedTheme) dispatch({ type: 'SET_THEME', theme: savedTheme });
      if (savedUIPrefs) dispatch({ type: 'SET_UI_PREFERENCES', preferences: savedUIPrefs });
      if (savedDockPrefs) dispatch({ type: 'SET_DOCK_PREFERENCES', preferences: savedDockPrefs });
      if (savedControls) dispatch({ type: 'SET_SYSTEM_CONTROLS', controls: savedControls });
      if (savedIcons) {
        const metrics = desktopMetricsForViewport(initialState);
        dispatch({ type: 'SET_DESKTOP_ICONS', icons: arrangeDesktopIcons(savedIcons, metrics) });
      }
      setIsLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (isLoaded) {
      storageSet('iplinux_desktop_icons_v6', state.desktopIcons);
    }
  }, [state.desktopIcons, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    storageSet('iplinux_theme_v2', state.theme);
  }, [isLoaded, state.theme]);

  useEffect(() => {
    if (!isLoaded) return;
    storageSet('iplinux_ui_preferences_v2', state.uiPreferences);
  }, [isLoaded, state.uiPreferences]);

  useEffect(() => {
    if (!isLoaded) return;
    storageSet('iplinux_dock_preferences_v2', state.dockPreferences);
  }, [isLoaded, state.dockPreferences]);

  useEffect(() => {
    if (!isLoaded) return;
    storageSet('iplinux_system_controls_v1', state.systemControls);
  }, [isLoaded, state.systemControls]);

  return (
    <OSContext.Provider value={{ state, dispatch }}>
      {children}
    </OSContext.Provider>
  );
};

export const useOS = () => {
  const ctx = useContext(OSContext);
  if (!ctx) throw new Error('useOS must be used within OSProvider');
  return ctx;
};

// ---- Convenience hooks ----
export const useWindows = () => {
  const { state, dispatch } = useOS();
  return {
    windows: state.windows,
    openWindow: useCallback((appId: string, title?: string) => dispatch({ type: 'OPEN_WINDOW', appId, title }), [dispatch]),
    closeWindow: useCallback((windowId: string) => dispatch({ type: 'CLOSE_WINDOW', windowId }), [dispatch]),
    minimizeWindow: useCallback((windowId: string) => dispatch({ type: 'MINIMIZE_WINDOW', windowId }), [dispatch]),
    maximizeWindow: useCallback((windowId: string) => dispatch({ type: 'MAXIMIZE_WINDOW', windowId }), [dispatch]),
    restoreWindow: useCallback((windowId: string) => dispatch({ type: 'RESTORE_WINDOW', windowId }), [dispatch]),
    focusWindow: useCallback((windowId: string) => dispatch({ type: 'FOCUS_WINDOW', windowId }), [dispatch]),
    moveWindow: useCallback((windowId: string, position: { x: number; y: number }) => dispatch({ type: 'MOVE_WINDOW', windowId, position }), [dispatch]),
    resizeWindow: useCallback((windowId: string, size: { width: number; height: number }) => dispatch({ type: 'RESIZE_WINDOW', windowId, size }), [dispatch]),
    activeWindowId: state.activeWindowId,
  };
};

export const useNotifications = () => {
  const { state, dispatch } = useOS();
  return {
    notifications: state.notifications,
    addNotification: useCallback(
      (n: Omit<Notification, 'id' | 'timestamp'>) => dispatch({ type: 'ADD_NOTIFICATION', notification: n }),
      [dispatch]
    ),
    removeNotification: useCallback((id: string) => dispatch({ type: 'REMOVE_NOTIFICATION', id }), [dispatch]),
    clearNotifications: useCallback(() => dispatch({ type: 'CLEAR_NOTIFICATIONS' }), [dispatch]),
  };
};
