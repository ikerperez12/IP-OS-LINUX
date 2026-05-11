// ============================================================
// ContextMenu — Dynamic right-click menu with edge detection
// ============================================================

import { useEffect, useRef, memo } from 'react';
import { useOS } from '@/hooks/useOSStore';
import { useFileSystem } from '@/hooks/useFileSystem';
import SystemIcon from './SystemIcon';
import type { OSAction, OSState } from '@/types';

const ContextMenu = memo(function ContextMenu() {
  const { state, dispatch } = useOS();
  const fs = useFileSystem();
  const menuRef = useRef<HTMLDivElement>(null);
  const { contextMenu } = state;

  useEffect(() => {
    if (!contextMenu.visible) return;
    const handleClick = () => dispatch({ type: 'HIDE_CONTEXT_MENU' });
    const timer = setTimeout(() => {
      window.addEventListener('click', handleClick, { once: true });
    }, 50);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleClick);
    };
  }, [contextMenu.visible, dispatch]);

  // Edge detection
  let x = contextMenu.x;
  let y = contextMenu.y;
  if (menuRef.current) {
    const rect = menuRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (x + rect.width > vw) x = vw - rect.width - 8;
    if (y + rect.height > vh) y = vh - rect.height - 8;
    if (x < 8) x = 8;
    if (y < 8) y = 8;
  }

  if (!contextMenu.visible) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-[4000] py-1.5 select-none"
      role="menu"
      aria-label="Context menu"
      onKeyDown={(event) => {
        if (event.key === 'Escape') dispatch({ type: 'HIDE_CONTEXT_MENU' });
      }}
      style={{
        left: x,
        top: y,
        minWidth: 180,
        maxWidth: 280,
        background: 'var(--bg-context-menu)',
        borderRadius: 8,
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-lg)',
        animation: 'ctxAppear 120ms cubic-bezier(0, 0, 0.2, 1)',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {contextMenu.items.map((item) => {
        if (item.divider) {
          return (
            <div
              key={item.id}
              className="my-1 mx-2"
              style={{ height: 1, background: 'var(--border-subtle)' }}
            />
          );
        }
        return (
          <button
            key={item.id}
            className="w-full flex items-center gap-2.5 px-3 h-8 text-sm transition-colors"
            style={{
              color: item.disabled ? 'var(--text-disabled)' : 'var(--text-primary)',
              borderRadius: 4,
              margin: '0 4px',
              width: 'calc(100% - 8px)',
              cursor: item.disabled ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!item.disabled) e.currentTarget.style.background = 'var(--bg-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            onClick={() => {
              if (item.disabled) return;
              dispatch({ type: 'HIDE_CONTEXT_MENU' });
              // Action dispatch handled by parent based on action string
              handleMenuAction(item.action, state, dispatch, fs);
            }}
          >
            {item.icon && (
              <SystemIcon name={item.icon} size={18} className="shrink-0 text-[var(--text-secondary)]" />
            )}
            <span className="flex-1 text-left truncate">{item.label}</span>
            {item.shortcut && (
              <span className="text-[10px] text-[var(--text-disabled)] ml-2">{item.shortcut}</span>
            )}
          </button>
        );
      })}

      <style>{`
        @keyframes ctxAppear {
          from { opacity: 0; transform: scale(0.95) translateY(-4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
});

function nextAvailableName(existingNames: string[], base: string, extension = '') {
  const taken = new Set(existingNames.map((name) => name.toLowerCase()));
  const first = `${base}${extension}`;
  if (!taken.has(first.toLowerCase())) return first;
  for (let index = 2; index < 1000; index += 1) {
    const candidate = `${base} ${index}${extension}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
  return `${base} ${Date.now()}${extension}`;
}

function getDesktopFolder(fs: ReturnType<typeof useFileSystem>) {
  return fs.findNodeByPath('/home/user/Desktop') || fs.findNodeByPath('/home/user');
}

function handleMenuAction(
  action: string,
  state: OSState,
  dispatch: React.Dispatch<OSAction>,
  fs: ReturnType<typeof useFileSystem>
) {
  const [cmd, ...args] = action.split(':');
  switch (cmd) {
    case 'OPEN_APP': {
      if (args[0]) dispatch({ type: 'OPEN_WINDOW', appId: args[0] });
      break;
    }
    case 'OPEN_DESKTOP_SELECTION': {
      state.desktopIcons
        .filter((icon) => icon.isSelected && icon.appId)
        .forEach((icon) => {
          if (icon.appId) dispatch({ type: 'OPEN_WINDOW', appId: icon.appId });
        });
      break;
    }
    case 'SELECT_ALL_DESKTOP': {
      dispatch({ type: 'SELECT_DESKTOP_ICONS', ids: state.desktopIcons.map((icon) => icon.id) });
      break;
    }
    case 'CLEAR_DESKTOP_SELECTION': {
      dispatch({ type: 'SELECT_DESKTOP_ICON', id: null });
      break;
    }
    case 'DELETE_DESKTOP_SELECTION': {
      dispatch({
        type: 'REMOVE_DESKTOP_ICONS',
        ids: state.desktopIcons.filter((icon) => icon.isSelected).map((icon) => icon.id),
      });
      break;
    }
    case 'NEW_FOLDER': {
      const existingNames = state.desktopIcons.map((icon) => icon.name);
      const name = nextAvailableName(existingNames, 'New Folder');
      const desktopFolder = getDesktopFolder(fs);
      const nodeId = desktopFolder ? fs.createFolder(desktopFolder.id, name) : undefined;
      dispatch({
        type: 'ADD_DESKTOP_ICON',
        icon: {
          name,
          icon: 'Folder',
          kind: 'folder',
          fileSystemNodeId: nodeId,
          position: { x: state.contextMenu.x, y: state.contextMenu.y },
          isSelected: true,
          children: [],
          folderAccent: state.theme.accent,
          folderLayout: 'grid',
        },
      });
      break;
    }
    case 'NEW_TEXT_FILE': {
      const existingNames = state.desktopIcons.map((icon) => icon.name);
      const name = nextAvailableName(existingNames, 'New Text File', '.txt');
      const desktopFolder = getDesktopFolder(fs);
      const nodeId = desktopFolder ? fs.createFile(desktopFolder.id, name, '') : undefined;
      dispatch({
        type: 'ADD_DESKTOP_ICON',
        icon: {
          name,
          icon: 'FileText',
          kind: 'app',
          appId: 'texteditor',
          fileSystemNodeId: nodeId,
          position: { x: state.contextMenu.x, y: state.contextMenu.y },
          isSelected: true,
        },
      });
      break;
    }
    case 'ARRANGE_ICONS': {
      dispatch({ type: 'ARRANGE_DESKTOP_ICONS' });
      break;
    }
    case 'CHANGE_BG':
    case 'SHOW_SETTINGS':
    case 'NEW_DOCUMENT':
    case 'OPEN_TERMINAL':
      dispatch({ type: 'OPEN_WINDOW', appId: 'settings' });
      break;
    case 'PIN_DOCK':
    case 'UNPIN_DOCK':
    case 'QUIT_APP': {
      // Placeholder: will be handled by the component that opens the menu
      break;
    }
    case 'MINIMIZE_ALL': {
      dispatch({ type: 'MINIMIZE_ALL' });
      break;
    }
    default:
      break;
  }
}

export default ContextMenu;
