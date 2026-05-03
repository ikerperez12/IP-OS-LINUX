// ============================================================
// Desktop — Animated wallpaper + draggable icons + context menu
// ============================================================

import { useCallback, memo, useState, useRef, useEffect } from 'react';
import { useOS } from '@/hooks/useOSStore';
import AppIcon from './AppIcon';

const GRID_X = 120;
const GRID_Y = 130;

// Animated wallpaper using canvas
const AnimatedWallpaper = memo(function AnimatedWallpaper() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const resize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = '100%';
      canvas.style.height = '100%';
    };
    resize();
    window.addEventListener('resize', resize);

    // Orbs for ambient motion
    const orbs = Array.from({ length: 6 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.15 + Math.random() * 0.25,
      vx: (Math.random() - 0.5) * 0.0003,
      vy: (Math.random() - 0.5) * 0.0003,
      hue: Math.floor(Math.random() * 60) + 240, // purple-blue range
    }));

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      t += 0.003;

      // Dark base
      ctx.fillStyle = '#08001a';
      ctx.fillRect(0, 0, w, h);

      // Draw ambient orbs
      orbs.forEach((orb) => {
        orb.x += orb.vx + Math.sin(t * 0.5) * 0.0001;
        orb.y += orb.vy + Math.cos(t * 0.7) * 0.0001;
        if (orb.x < -0.2) orb.x = 1.2;
        if (orb.x > 1.2) orb.x = -0.2;
        if (orb.y < -0.2) orb.y = 1.2;
        if (orb.y > 1.2) orb.y = -0.2;

        const grd = ctx.createRadialGradient(
          orb.x * w, orb.y * h, 0,
          orb.x * w, orb.y * h, orb.r * Math.min(w, h)
        );
        grd.addColorStop(0, `hsla(${orb.hue + Math.sin(t) * 20}, 70%, 50%, 0.12)`);
        grd.addColorStop(0.5, `hsla(${orb.hue + 30}, 60%, 40%, 0.05)`);
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, w, h);
      });

      // Subtle star field
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      for (let i = 0; i < 80; i++) {
        const sx = ((i * 7919 + Math.sin(t * 0.1 + i) * 2) % w + w) % w;
        const sy = ((i * 6271 + Math.cos(t * 0.08 + i) * 2) % h + h) % h;
        const sr = 0.3 + Math.sin(t + i) * 0.2;
        ctx.beginPath();
        ctx.arc(sx, sy, sr * window.devicePixelRatio, 0, Math.PI * 2);
        ctx.fill();
      }

      // Soft vignette
      const vgrd = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.7);
      vgrd.addColorStop(0, 'transparent');
      vgrd.addColorStop(1, 'rgba(0,0,0,0.4)');
      ctx.fillStyle = vgrd;
      ctx.fillRect(0, 0, w, h);

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-0" />;
});

const Desktop = memo(function Desktop() {
  const { state, dispatch } = useOS();
  const { desktopIcons } = state;
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const desktopRef = useRef<HTMLDivElement>(null);

  const handleIconDoubleClick = useCallback(
    (icon: typeof desktopIcons[0]) => {
      if (icon.appId) {
        dispatch({ type: 'OPEN_WINDOW', appId: icon.appId });
      }
    },
    [dispatch]
  );

  const handleIconMouseDown = useCallback(
    (e: React.MouseEvent, icon: typeof desktopIcons[0]) => {
      e.stopPropagation();
      dispatch({ type: 'SELECT_DESKTOP_ICON', id: icon.id });
      if (icon.appId) {
        setDraggingId(icon.id);
        // Track the offset of the mouse relative to the icon's top-left corner
        setDragOffset({ x: e.clientX - icon.position.x, y: e.clientY - icon.position.y });
      }
    },
    [dispatch]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggingId) return;
      
      // Calculate new smooth coordinates based on mouse position minus initial offset within the icon
      const rawX = e.clientX - dragOffset.x;
      const rawY = e.clientY - dragOffset.y;

      // Make snapping optional: free dragging until mouse up, or snap while dragging.
      // Free dragging feels more natural:
      dispatch({
        type: 'UPDATE_DESKTOP_ICON_POSITION',
        id: draggingId,
        position: { x: rawX, y: rawY },
      });
    },
    [draggingId, dragOffset, dispatch]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (draggingId) {
        // Snap to grid on mouse up
        const icon = desktopIcons.find((i) => i.id === draggingId);
        if (icon) {
           const snapX = Math.max(16, Math.round((icon.position.x - 16) / GRID_X) * GRID_X + 16);
           const snapY = Math.max(16, Math.round((icon.position.y - 16) / GRID_Y) * GRID_Y + 16);
           dispatch({
             type: 'UPDATE_DESKTOP_ICON_POSITION',
             id: draggingId,
             position: { x: snapX, y: snapY },
           });
        }
      }
      setDraggingId(null);
    },
    [draggingId, desktopIcons, dispatch]
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
    [dispatch]
  );

  return (
    <div
      ref={desktopRef}
      className="fixed inset-0 z-10"
      style={{ top: 28, bottom: 56 }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onContextMenu={handleDesktopContextMenu}
      onClick={() => dispatch({ type: 'SELECT_DESKTOP_ICON', id: null })}
    >
      {/* Animated wallpaper */}
      <AnimatedWallpaper />

      {/* Desktop Icons */}
      {desktopIcons.map((icon, idx) => (
        <div
          key={icon.id}
          className="absolute flex flex-col items-center gap-1 cursor-pointer group"
          style={{
            left: icon.position.x,
            top: icon.position.y,
            width: 78,
            opacity: draggingId === icon.id ? 0.5 : 1,
            animation: `iconAppear 300ms cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 30}ms both`,
            zIndex: icon.isSelected ? 50 : 1,
          }}
          onDoubleClick={() => handleIconDoubleClick(icon)}
          onMouseDown={(e) => handleIconMouseDown(e, icon)}
          onContextMenu={(e) => {
            e.stopPropagation();
            dispatch({
              type: 'SHOW_CONTEXT_MENU',
              x: e.clientX,
              y: e.clientY,
              menuType: 'file',
              items: [
                { id: 'open', label: 'Open', icon: 'ExternalLink', action: `OPEN_APP:${icon.appId}` },
                { id: 'div1', label: '', action: '', divider: true },
                { id: 'cut', label: 'Cut', icon: 'Scissors', action: 'CUT' },
                { id: 'copy', label: 'Copy', icon: 'Copy', action: 'COPY' },
                { id: 'rename', label: 'Rename', icon: 'Edit', action: 'RENAME' },
                { id: 'div2', label: '', action: '', divider: true },
                { id: 'trash', label: 'Move to Trash', icon: 'Trash2', action: 'TRASH' },
              ],
              contextData: { iconId: icon.id },
            });
          }}
        >
          {/* Colorful app icon */}
          <div
            className="transition-transform duration-200 group-hover:scale-110 group-hover:-translate-y-1 w-16 h-16 flex items-center justify-center"
            style={{
              borderRadius: 14,
              padding: 2,
              background: icon.isSelected ? 'rgba(124,77,255,0.4)' : 'transparent',
              boxShadow: icon.isSelected ? '0 0 16px rgba(124,77,255,0.3)' : 'none',
            }}
          >
            <AppIcon appId={icon.appId || ''} size={64} />
          </div>

          {/* Label */}
          <span
            className="text-[11px] font-semibold text-center px-1.5 py-0.5 rounded-md max-w-[80px] leading-tight"
            style={{
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
      ))}

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
