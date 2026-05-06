// ============================================================
// Desktop - strict grid, folders, drag preview, selection box
// ============================================================

import { useCallback, memo, useEffect, useMemo, useRef, useState } from 'react';
import type { DesktopIcon, Position } from '@/types';
import { useOS } from '@/hooks/useOSStore';
import {
  arrangeDesktopIcons,
  cellForPosition,
  cellKey,
  createDesktopGridMetrics,
  findIconAtCell,
  normalizePositionToGrid,
  positionForCell,
} from '@/lib/desktopLayoutEngine';
import AppIcon from './AppIcon';
import SystemIcon from './SystemIcon';

type DesktopInteraction =
  | {
      mode: 'select';
      start: Position;
      current: Position;
      additive: boolean;
      baseSelectedIds: string[];
    }
  | {
      mode: 'drag';
      ids: string[];
      startMouse: Position;
      currentMouse: Position;
      originalPositions: Record<string, Position>;
      primaryId: string;
    };

const rectFromPoints = (a: Position, b: Position) => ({
  x: Math.min(a.x, b.x),
  y: Math.min(a.y, b.y),
  width: Math.abs(a.x - b.x),
  height: Math.abs(a.y - b.y),
});

const rectsIntersect = (
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
) => (
  a.x < b.x + b.width &&
  a.x + a.width > b.x &&
  a.y < b.y + b.height &&
  a.y + a.height > b.y
);

const FolderIcon = memo(function FolderIcon({ icon, size }: { icon: DesktopIcon; size: number }) {
  const children = icon.children || [];
  const previews = children.slice(0, 4);
  return (
    <div
      className="relative flex items-center justify-center overflow-hidden"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.24),
        background: `linear-gradient(145deg, ${icon.folderAccent || '#7C4DFF'} 0%, rgba(15,23,42,0.92) 92%)`,
        boxShadow: `0 16px 30px ${(icon.folderAccent || '#7C4DFF')}35, inset 0 1px 0 rgba(255,255,255,0.34), inset 0 -18px 38px rgba(0,0,0,0.28)`,
        border: '1px solid rgba(255,255,255,0.2)',
      }}
    >
      <div className="absolute inset-1.5 rounded-[18px]" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }} />
      <div
        className="relative grid grid-cols-2 gap-1.5"
        style={{ width: size * 0.62, height: size * 0.62 }}
      >
        {previews.map((child) => (
          <div key={child.id} className="rounded-lg overflow-hidden shadow-sm">
            <AppIcon appId={child.appId || ''} size={size * 0.28} />
          </div>
        ))}
        {previews.length === 0 && (
          <SystemIcon name={icon.icon || 'Folder'} size={size * 0.42} style={{ color: 'white' }} />
        )}
      </div>
      <div
        className="absolute right-1.5 bottom-1.5 min-w-5 h-5 px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
        style={{ background: 'rgba(0,0,0,0.38)', border: '1px solid rgba(255,255,255,0.18)' }}
      >
        {children.length}
      </div>
    </div>
  );
});

const Desktop = memo(function Desktop() {
  const { state, dispatch } = useOS();
  const disabledAppIds = state.disabledAppIds;
  const rawDesktopIcons = useMemo(
    () => state.desktopIcons
      .map((icon) => icon.kind === 'folder'
        ? { ...icon, children: (icon.children || []).filter((child) => !child.appId || !disabledAppIds.includes(child.appId)) }
        : icon)
      .filter((icon) => {
        if (icon.kind === 'folder') return true;
        return !icon.appId || !disabledAppIds.includes(icon.appId);
      }),
    [disabledAppIds, state.desktopIcons]
  );
  const desktopRef = useRef<HTMLDivElement>(null);
  const selectionDraftRef = useRef<string>('');
  const dragMovedRef = useRef(false);
  const [interaction, setInteraction] = useState<DesktopInteraction | null>(null);
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight - 120 });

  useEffect(() => {
    const measure = () => {
      const rect = desktopRef.current?.getBoundingClientRect();
      setViewport({
        width: rect?.width || window.innerWidth,
        height: rect?.height || Math.max(320, window.innerHeight - 120),
      });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const metrics = useMemo(
    () => createDesktopGridMetrics(
      viewport.width,
      viewport.height,
      state.uiPreferences.tabletMode,
      state.uiPreferences.iconScale
    ),
    [state.uiPreferences.iconScale, state.uiPreferences.tabletMode, viewport.height, viewport.width]
  );

  const desktopIcons = useMemo(() => {
    const occupied = new Set<string>();
    const hasCollision = rawDesktopIcons.some((icon) => {
      const key = cellKey(cellForPosition(icon.position, metrics));
      if (occupied.has(key)) return true;
      occupied.add(key);
      return false;
    });
    return hasCollision ? arrangeDesktopIcons(rawDesktopIcons, metrics) : rawDesktopIcons;
  }, [metrics, rawDesktopIcons]);

  const selectedIds = useMemo(
    () => desktopIcons.filter((icon) => icon.isSelected).map((icon) => icon.id),
    [desktopIcons]
  );

  const openFolder = desktopIcons.find((icon) => icon.id === openFolderId && icon.kind === 'folder');

  const getLocalPoint = useCallback((e: React.MouseEvent): Position => {
    const rect = desktopRef.current?.getBoundingClientRect();
    return {
      x: rect ? e.clientX - rect.left : e.clientX,
      y: rect ? e.clientY - rect.top : e.clientY,
    };
  }, []);

  const selectIds = useCallback(
    (ids: string[]) => {
      const uniqueIds = Array.from(new Set(ids));
      const key = uniqueIds.join('|');
      if (selectionDraftRef.current === key) return;
      selectionDraftRef.current = key;
      dispatch({ type: 'SELECT_DESKTOP_ICONS', ids: uniqueIds });
    },
    [dispatch]
  );

  const openIcon = useCallback(
    (icon: DesktopIcon) => {
      if (icon.kind === 'folder') {
        if ((icon.children || []).length > 0) {
          setOpenFolderId(icon.id);
        } else {
          dispatch({ type: 'OPEN_WINDOW', appId: 'filemanager' });
        }
        return;
      }
      if (icon.appId) dispatch({ type: 'OPEN_WINDOW', appId: icon.appId });
    },
    [dispatch]
  );

  const openIcons = useCallback(
    (icons: DesktopIcon[]) => icons.forEach(openIcon),
    [openIcon]
  );

  const handleDesktopMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      if ((e.target as HTMLElement).closest('[data-desktop-icon="true"], [data-folder-panel="true"]')) return;

      const start = getLocalPoint(e);
      const additive = e.ctrlKey || e.metaKey || e.shiftKey;
      selectionDraftRef.current = additive ? selectedIds.join('|') : '';
      if (!additive) dispatch({ type: 'SELECT_DESKTOP_ICON', id: null });
      setInteraction({
        mode: 'select',
        start,
        current: start,
        additive,
        baseSelectedIds: additive ? selectedIds : [],
      });
    },
    [dispatch, getLocalPoint, selectedIds]
  );

  const handleIconMouseDown = useCallback(
    (e: React.MouseEvent, icon: DesktopIcon) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      const additive = e.ctrlKey || e.metaKey || e.shiftKey;
      let nextSelectedIds: string[];

      if (additive) {
        if ((e.ctrlKey || e.metaKey) && icon.isSelected) {
          nextSelectedIds = selectedIds.filter((id) => id !== icon.id);
        } else {
          nextSelectedIds = Array.from(new Set([...selectedIds, icon.id]));
        }
      } else if (icon.isSelected && selectedIds.length > 1) {
        nextSelectedIds = selectedIds;
      } else {
        nextSelectedIds = [icon.id];
      }

      selectIds(nextSelectedIds);

      const dragIds = nextSelectedIds.includes(icon.id) ? nextSelectedIds : [icon.id];
      const originalPositions = Object.fromEntries(
        desktopIcons
          .filter((candidate) => dragIds.includes(candidate.id))
          .map((candidate) => [candidate.id, normalizePositionToGrid(candidate.position, metrics)])
      );

      dragMovedRef.current = false;
      setInteraction({
        mode: 'drag',
        ids: dragIds,
        primaryId: icon.id,
        startMouse: { x: e.clientX, y: e.clientY },
        currentMouse: { x: e.clientX, y: e.clientY },
        originalPositions,
      });
    },
    [desktopIcons, metrics, selectIds, selectedIds]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!interaction) return;

      if (interaction.mode === 'select') {
        const current = getLocalPoint(e);
        const selectionRect = rectFromPoints(interaction.start, current);
        const hitIds = desktopIcons
          .filter((icon) => {
            const pos = normalizePositionToGrid(icon.position, metrics);
            return rectsIntersect(selectionRect, {
              x: pos.x,
              y: pos.y,
              width: metrics.itemWidth,
              height: metrics.itemHeight,
            });
          })
          .map((icon) => icon.id);

        selectIds(interaction.additive ? [...interaction.baseSelectedIds, ...hitIds] : hitIds);
        setInteraction({ ...interaction, current });
        return;
      }

      const dx = e.clientX - interaction.startMouse.x;
      const dy = e.clientY - interaction.startMouse.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragMovedRef.current = true;
      setInteraction({ ...interaction, currentMouse: { x: e.clientX, y: e.clientY } });
    },
    [desktopIcons, getLocalPoint, interaction, metrics, selectIds]
  );

  const handleMouseUp = useCallback(() => {
    if (!interaction) return;

    if (interaction.mode === 'select') {
      const rect = rectFromPoints(interaction.start, interaction.current);
      if (rect.width < 5 && rect.height < 5 && !interaction.additive) {
        dispatch({ type: 'SELECT_DESKTOP_ICON', id: null });
      }
      setInteraction(null);
      return;
    }

    if (dragMovedRef.current) {
      const dx = interaction.currentMouse.x - interaction.startMouse.x;
      const dy = interaction.currentMouse.y - interaction.startMouse.y;
      const primaryOriginal = interaction.originalPositions[interaction.primaryId] || { x: 0, y: 0 };
      const anchorPosition = normalizePositionToGrid({ x: primaryOriginal.x + dx, y: primaryOriginal.y + dy }, metrics);
      const targetCell = cellForPosition(anchorPosition, metrics);
      const target = findIconAtCell(desktopIcons, targetCell, metrics, interaction.ids);

      if (target && interaction.ids.length === 1) {
        if (target.kind === 'folder') {
          dispatch({ type: 'MOVE_DESKTOP_ITEM_TO_FOLDER', sourceId: interaction.ids[0], folderId: target.id });
        } else {
          dispatch({
            type: 'CREATE_DESKTOP_FOLDER',
            sourceIds: interaction.ids,
            targetId: target.id,
            position: target.position,
            name: 'New Folder',
          });
        }
      } else {
        dispatch({ type: 'MOVE_DESKTOP_ITEMS_TO_CELL', ids: interaction.ids, anchorPosition });
      }
    }

    dragMovedRef.current = false;
    setInteraction(null);
  }, [desktopIcons, dispatch, interaction, metrics]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      // never react when the keystroke originated from an editable widget
      const t = e.target as HTMLElement | null;
      if (t) {
        if (t.isContentEditable) return;
        const tag = t.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      }

      const selectedIcons = desktopIcons.filter((icon) => icon.isSelected);

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        selectIds(desktopIcons.map((icon) => icon.id));
        return;
      }

      if (e.key === 'Escape') {
        if (openFolderId) {
          setOpenFolderId(null);
          return;
        }
        dispatch({ type: 'SELECT_DESKTOP_ICON', id: null });
        selectionDraftRef.current = '';
        return;
      }

      if (e.key === 'Enter' && selectedIcons.length > 0) {
        e.preventDefault();
        openIcons(selectedIcons);
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIcons.length > 0) {
        e.preventDefault();
        dispatch({ type: 'REMOVE_DESKTOP_ICONS', ids: selectedIcons.map((icon) => icon.id) });
      }
    },
    [desktopIcons, dispatch, openFolderId, openIcons, selectIds]
  );

  const handleDesktopContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dispatch({
        type: 'SHOW_CONTEXT_MENU',
        x: e.clientX,
        y: e.clientY,
        menuType: 'desktop',
        items: [
          { id: 'select-all', label: 'Select All', icon: 'SquareCheckBig', shortcut: 'Ctrl+A', action: 'SELECT_ALL_DESKTOP' },
          { id: 'clear-selection', label: 'Clear Selection', icon: 'CircleX', shortcut: 'Esc', action: 'CLEAR_DESKTOP_SELECTION', disabled: selectedIds.length === 0 },
          { id: 'div0', label: '', action: '', divider: true },
          { id: 'new-folder', label: 'New Folder', icon: 'FolderPlus', action: 'NEW_FOLDER' },
          { id: 'new-file', label: 'New Text File', icon: 'FilePlus', action: 'NEW_TEXT_FILE' },
          { id: 'div1', label: '', action: '', divider: true },
          { id: 'open-term', label: 'Open in Terminal', icon: 'Terminal', action: 'OPEN_APP:terminal' },
          { id: 'change-bg', label: 'Change Background', icon: 'Image', action: 'CHANGE_BG' },
          { id: 'arrange', label: 'Arrange Icons to Grid', icon: 'LayoutGrid', action: 'ARRANGE_ICONS' },
          { id: 'display-settings', label: 'Display Settings', icon: 'Monitor', action: 'SHOW_SETTINGS' },
        ],
      });
    },
    [dispatch, selectedIds.length]
  );

  const selectionRect = interaction?.mode === 'select'
    ? rectFromPoints(interaction.start, interaction.current)
    : null;

  const dragPreview = useMemo(() => {
    if (!interaction || interaction.mode !== 'drag' || !dragMovedRef.current) return null;
    const dx = interaction.currentMouse.x - interaction.startMouse.x;
    const dy = interaction.currentMouse.y - interaction.startMouse.y;
    const primaryOriginal = interaction.originalPositions[interaction.primaryId] || { x: 0, y: 0 };
    const cell = cellForPosition({ x: primaryOriginal.x + dx, y: primaryOriginal.y + dy }, metrics);
    const target = findIconAtCell(desktopIcons, cell, metrics, interaction.ids);
    return {
      position: positionForCell(cell, metrics),
      target,
    };
  }, [desktopIcons, interaction, metrics]);

  return (
    <div
      ref={desktopRef}
      className="fixed inset-0 z-10 outline-none overflow-hidden"
      style={{ top: 28, bottom: 76 }}
      tabIndex={-1}
      onMouseDown={handleDesktopMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onKeyDown={handleKeyDown}
      onContextMenu={handleDesktopContextMenu}
    >
      {desktopIcons.map((icon, idx) => {
        const gridPosition = normalizePositionToGrid(icon.position, metrics);
        let displayPosition = gridPosition;
        const dragging = interaction?.mode === 'drag' && interaction.ids.includes(icon.id);
        if (dragging) {
          const original = interaction.originalPositions[icon.id] || gridPosition;
          displayPosition = {
            x: original.x + interaction.currentMouse.x - interaction.startMouse.x,
            y: original.y + interaction.currentMouse.y - interaction.startMouse.y,
          };
        }

        return (
          <div
            key={icon.id}
            data-desktop-icon="true"
            className="absolute flex flex-col items-center gap-1 cursor-pointer group"
            style={{
              left: displayPosition.x,
              top: displayPosition.y,
              width: metrics.itemWidth,
              opacity: dragging ? 0.82 : 1,
              animation: `iconAppear 300ms cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 24}ms both`,
              zIndex: dragging || icon.isSelected ? 70 : 1,
              transition: dragging ? 'none' : 'left 180ms ease, top 180ms ease, transform 180ms ease',
            }}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={() => openIcon(icon)}
            onMouseDown={(e) => handleIconMouseDown(e, icon)}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const groupSelected = icon.isSelected ? selectedIds : [icon.id];
              if (!icon.isSelected) selectIds([icon.id]);
              dispatch({
                type: 'SHOW_CONTEXT_MENU',
                x: e.clientX,
                y: e.clientY,
                menuType: 'file',
                items: [
                  {
                    id: 'open',
                    label: icon.kind === 'folder' ? 'Open Folder' : groupSelected.length > 1 ? `Open ${groupSelected.length} Items` : 'Open',
                    icon: 'ExternalLink',
                    shortcut: 'Enter',
                    action: icon.kind === 'folder' ? 'OPEN_DESKTOP_FOLDER' : groupSelected.length > 1 ? 'OPEN_DESKTOP_SELECTION' : `OPEN_APP:${icon.appId}`,
                  },
                  { id: 'select-all', label: 'Select All', icon: 'SquareCheckBig', shortcut: 'Ctrl+A', action: 'SELECT_ALL_DESKTOP' },
                  { id: 'div1', label: '', action: '', divider: true },
                  { id: 'rename', label: 'Rename', icon: 'Edit', action: 'RENAME', disabled: true },
                  { id: 'arrange', label: 'Arrange Icons to Grid', icon: 'LayoutGrid', action: 'ARRANGE_ICONS' },
                  { id: 'div2', label: '', action: '', divider: true },
                  {
                    id: 'remove',
                    label: groupSelected.length > 1 ? 'Remove Shortcuts' : 'Remove Shortcut',
                    icon: 'Trash2',
                    shortcut: 'Del',
                    action: 'DELETE_DESKTOP_SELECTION',
                  },
                ],
                contextData: { iconId: icon.id, selectedIds: groupSelected },
              });
            }}
          >
            <div
              className="transition-transform duration-200 group-hover:scale-105 group-hover:-translate-y-1 flex items-center justify-center"
              style={{
                width: metrics.tileSize,
                height: metrics.tileSize,
                borderRadius: 20,
                padding: 2,
                background: icon.isSelected ? 'rgba(124,77,255,0.42)' : 'transparent',
                boxShadow: icon.isSelected ? '0 0 22px rgba(124,77,255,0.45), inset 0 0 0 1px rgba(255,255,255,0.2)' : 'none',
              }}
            >
              {icon.kind === 'folder'
                ? <FolderIcon icon={icon} size={metrics.iconSize} />
                : <AppIcon appId={icon.appId || ''} size={metrics.iconSize} />}
            </div>

            <span
              className="text-[11px] font-semibold text-center px-1.5 py-0.5 rounded-md leading-tight"
              style={{
                maxWidth: metrics.itemWidth,
                color: '#FFFFFF',
                textShadow: '0 1px 4px rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,0.72)',
                background: icon.isSelected ? 'rgba(124,77,255,0.55)' : 'rgba(0,0,0,0.08)',
                WebkitLineClamp: 2,
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                wordBreak: 'break-word',
              }}
            >
              {icon.name}
            </span>
          </div>
        );
      })}

      {dragPreview && (
        <div
          className="absolute pointer-events-none z-[60] rounded-2xl"
          style={{
            left: dragPreview.position.x - 6,
            top: dragPreview.position.y - 6,
            width: metrics.itemWidth + 12,
            height: metrics.itemHeight + 12,
            background: dragPreview.target ? 'rgba(124,77,255,0.22)' : 'rgba(255,255,255,0.06)',
            border: dragPreview.target ? '1px solid rgba(196,181,253,0.95)' : '1px dashed rgba(255,255,255,0.28)',
            boxShadow: dragPreview.target ? '0 0 28px rgba(124,77,255,0.35)' : 'none',
          }}
        />
      )}

      {selectionRect && (selectionRect.width > 3 || selectionRect.height > 3) && (
        <div
          className="absolute pointer-events-none z-[80] rounded-md"
          style={{
            left: selectionRect.x,
            top: selectionRect.y,
            width: selectionRect.width,
            height: selectionRect.height,
            background: 'rgba(124,77,255,0.18)',
            border: '1px solid rgba(196,181,253,0.82)',
            boxShadow: '0 0 24px rgba(124,77,255,0.22), inset 0 0 18px rgba(255,255,255,0.08)',
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {openFolder && (
        <div
          className="fixed inset-0 z-[260] flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.18)', backdropFilter: 'blur(2px)' }}
          onMouseDown={(e) => {
            e.stopPropagation();
            setOpenFolderId(null);
          }}
        >
          <div
            data-folder-panel="true"
            className="w-[min(620px,calc(100vw-32px))] max-h-[min(620px,calc(100vh-150px))] rounded-3xl overflow-hidden"
            style={{
              background: 'rgba(18,20,30,0.78)',
              border: '1px solid rgba(255,255,255,0.14)',
              boxShadow: `0 24px 80px rgba(0,0,0,0.5), 0 0 50px ${(openFolder.folderAccent || '#7C4DFF')}30`,
              backdropFilter: `blur(${state.uiPreferences.blurIntensity}px) saturate(210%)`,
            }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <FolderIcon icon={openFolder} size={46} />
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold truncate text-[var(--text-primary)]">{openFolder.name}</h2>
                <p className="text-xs text-[var(--text-secondary)]">{openFolder.children?.length || 0} apps</p>
              </div>
              <button
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-[var(--bg-hover)]"
                onClick={() => setOpenFolderId(null)}
                aria-label="Close folder"
              >
                <SystemIcon name="X" size={16} />
              </button>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-4 p-5 overflow-y-auto custom-scrollbar">
              {(openFolder.children || []).map((child) => (
                <button
                  key={child.id}
                  className="flex flex-col items-center gap-2 rounded-2xl p-2 transition-all hover:scale-105 hover:bg-[rgba(255,255,255,0.07)]"
                  onClick={() => {
                    if (child.appId) {
                      dispatch({ type: 'OPEN_WINDOW', appId: child.appId });
                      setOpenFolderId(null);
                    }
                  }}
                >
                  <AppIcon appId={child.appId || ''} size={64} />
                  <span className="text-[11px] font-semibold text-center leading-tight text-[var(--text-primary)] line-clamp-2">
                    {child.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes iconAppear {
          from { opacity: 0; transform: translateY(20px) scale(0.8); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
});

export default Desktop;
