// ============================================================
// Desktop - reactive wallpaper, icon grid, drag, and selection box
// ============================================================

import { useCallback, memo, useMemo, useRef, useState } from 'react';
import type { DesktopIcon, Position } from '@/types';
import { useOS } from '@/hooks/useOSStore';
import AppIcon from './AppIcon';
import ReactiveWallpaper from './ReactiveWallpaper';

const GRID_X = 120;
const GRID_Y = 130;

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
      originalPositions: Record<string, Position>;
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

const sameIds = (a: string[], b: string[]) => (
  a.length === b.length && a.every((id, idx) => id === b[idx])
);

const Desktop = memo(function Desktop() {
  const { state, dispatch } = useOS();
  const { desktopIcons } = state;
  const desktopRef = useRef<HTMLDivElement>(null);
  const selectionDraftRef = useRef<string>('');
  const dragMovedRef = useRef(false);
  const [interaction, setInteraction] = useState<DesktopInteraction | null>(null);

  const selectedIds = useMemo(
    () => desktopIcons.filter((icon) => icon.isSelected).map((icon) => icon.id),
    [desktopIcons]
  );

  const metrics = state.uiPreferences.tabletMode
    ? { width: 98, height: 112, tile: 82, icon: 76, maxX: 112, maxY: 190 }
    : { width: 88, height: 98, tile: 76, icon: 72, maxX: 100, maxY: 170 };

  const getLocalPoint = useCallback((e: React.MouseEvent): Position => {
    const rect = desktopRef.current?.getBoundingClientRect();
    return {
      x: rect ? e.clientX - rect.left : e.clientX,
      y: rect ? e.clientY - rect.top : e.clientY,
    };
  }, []);

  const clampPosition = useCallback(
    (position: Position): Position => ({
      x: Math.max(12, Math.min(position.x, window.innerWidth - metrics.maxX)),
      y: Math.max(12, Math.min(position.y, window.innerHeight - metrics.maxY)),
    }),
    [metrics.maxX, metrics.maxY]
  );

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

  const openIcons = useCallback(
    (icons: DesktopIcon[]) => {
      icons.forEach((icon) => {
        if (icon.appId) dispatch({ type: 'OPEN_WINDOW', appId: icon.appId });
      });
    },
    [dispatch]
  );

  const handleIconDoubleClick = useCallback(
    (icon: DesktopIcon) => openIcons([icon]),
    [openIcons]
  );

  const handleDesktopMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      if ((e.target as HTMLElement).closest('[data-desktop-icon="true"]')) return;

      desktopRef.current?.focus();
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
      desktopRef.current?.focus();

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
          .map((candidate) => [candidate.id, candidate.position])
      );

      dragMovedRef.current = false;
      setInteraction({
        mode: 'drag',
        ids: dragIds,
        startMouse: { x: e.clientX, y: e.clientY },
        originalPositions,
      });
    },
    [desktopIcons, selectIds, selectedIds]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!interaction) return;

      if (interaction.mode === 'select') {
        const current = getLocalPoint(e);
        const selectionRect = rectFromPoints(interaction.start, current);
        const hitIds = desktopIcons
          .filter((icon) => {
            const pos = clampPosition(icon.position);
            return rectsIntersect(selectionRect, {
              x: pos.x,
              y: pos.y,
              width: metrics.width,
              height: metrics.height,
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

      const positions: Record<string, Position> = {};
      interaction.ids.forEach((id) => {
        const original = interaction.originalPositions[id];
        if (!original) return;
        positions[id] = { x: original.x + dx, y: original.y + dy };
      });

      dispatch({ type: 'UPDATE_DESKTOP_ICON_POSITIONS', positions });
    },
    [clampPosition, desktopIcons, dispatch, getLocalPoint, interaction, metrics.height, metrics.width, selectIds]
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
      const positions: Record<string, Position> = {};
      desktopIcons
        .filter((icon) => interaction.ids.includes(icon.id))
        .forEach((icon) => {
          positions[icon.id] = {
            x: Math.max(16, Math.round((icon.position.x - 16) / GRID_X) * GRID_X + 16),
            y: Math.max(16, Math.round((icon.position.y - 16) / GRID_Y) * GRID_Y + 16),
          };
        });
      dispatch({ type: 'UPDATE_DESKTOP_ICON_POSITIONS', positions });
    }

    dragMovedRef.current = false;
    setInteraction(null);
  }, [desktopIcons, dispatch, interaction]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const selectedIcons = desktopIcons.filter((icon) => icon.isSelected);

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        selectIds(desktopIcons.map((icon) => icon.id));
        return;
      }

      if (e.key === 'Escape') {
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
    [desktopIcons, dispatch, openIcons, selectIds]
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
          { id: 'new-doc', label: 'New Document', icon: 'FilePlus', action: 'NEW_DOCUMENT' },
          { id: 'div1', label: '', action: '', divider: true },
          { id: 'open-term', label: 'Open in Terminal', icon: 'Terminal', action: 'OPEN_APP:terminal' },
          { id: 'open-master', label: 'IP Master Control', icon: 'Activity', action: 'OPEN_APP:ipmastercontrol' },
          { id: 'div2', label: '', action: '', divider: true },
          { id: 'change-bg', label: 'Change Background', icon: 'Image', action: 'CHANGE_BG' },
          { id: 'arrange', label: 'Arrange Icons', icon: 'LayoutGrid', action: 'ARRANGE_ICONS' },
          { id: 'div3', label: '', action: '', divider: true },
          { id: 'display-settings', label: 'Display Settings', icon: 'Monitor', action: 'SHOW_SETTINGS' },
        ],
      });
    },
    [dispatch, selectedIds.length]
  );

  const selectionRect = interaction?.mode === 'select'
    ? rectFromPoints(interaction.start, interaction.current)
    : null;

  return (
    <div
      ref={desktopRef}
      className="fixed inset-0 z-10 outline-none"
      style={{ top: 28, bottom: 56 }}
      tabIndex={0}
      onMouseDown={handleDesktopMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onKeyDown={handleKeyDown}
      onContextMenu={handleDesktopContextMenu}
    >
      <ReactiveWallpaper />

      {desktopIcons.map((icon, idx) => {
        const pos = clampPosition(icon.position);
        return (
          <div
            key={icon.id}
            data-desktop-icon="true"
            className="absolute flex flex-col items-center gap-1 cursor-pointer group"
            style={{
              left: pos.x,
              top: pos.y,
              width: metrics.width,
              opacity: interaction?.mode === 'drag' && interaction.ids.includes(icon.id) ? 0.72 : 1,
              animation: `iconAppear 300ms cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 30}ms both`,
              zIndex: icon.isSelected ? 50 : 1,
            }}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={() => handleIconDoubleClick(icon)}
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
                    label: groupSelected.length > 1 ? `Open ${groupSelected.length} Items` : 'Open',
                    icon: 'ExternalLink',
                    shortcut: 'Enter',
                    action: groupSelected.length > 1 ? 'OPEN_DESKTOP_SELECTION' : `OPEN_APP:${icon.appId}`,
                  },
                  { id: 'select-all', label: 'Select All', icon: 'SquareCheckBig', shortcut: 'Ctrl+A', action: 'SELECT_ALL_DESKTOP' },
                  { id: 'div1', label: '', action: '', divider: true },
                  { id: 'cut', label: 'Cut', icon: 'Scissors', action: 'CUT' },
                  { id: 'copy', label: 'Copy', icon: 'Copy', action: 'COPY' },
                  { id: 'rename', label: 'Rename', icon: 'Edit', action: 'RENAME', disabled: groupSelected.length > 1 },
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
              className="transition-transform duration-200 group-hover:scale-110 group-hover:-translate-y-1 flex items-center justify-center"
              style={{
                width: metrics.tile,
                height: metrics.tile,
                borderRadius: 18,
                padding: 2,
                background: icon.isSelected ? 'rgba(124,77,255,0.4)' : 'transparent',
                boxShadow: icon.isSelected ? '0 0 18px rgba(124,77,255,0.42), inset 0 0 0 1px rgba(255,255,255,0.18)' : 'none',
              }}
            >
              <AppIcon appId={icon.appId || ''} size={metrics.icon} />
            </div>

            <span
              className="text-[11px] font-semibold text-center px-1.5 py-0.5 rounded-md leading-tight"
              style={{
                maxWidth: metrics.width,
                color: '#FFFFFF',
                textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7)',
                background: icon.isSelected ? 'rgba(124,77,255,0.5)' : 'transparent',
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

      {selectionRect && (selectionRect.width > 3 || selectionRect.height > 3) && (
        <div
          className="absolute pointer-events-none z-[70] rounded-md"
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
