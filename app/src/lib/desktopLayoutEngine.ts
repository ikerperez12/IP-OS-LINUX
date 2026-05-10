import type { DesktopIcon, Position } from '@/types';

export interface DesktopGridMetrics {
  originX: number;
  originY: number;
  cellWidth: number;
  cellHeight: number;
  itemWidth: number;
  itemHeight: number;
  tileSize: number;
  iconSize: number;
  columns: number;
  rows: number;
  width: number;
  height: number;
}

export interface GridCell {
  col: number;
  row: number;
}

export const cellKey = (cell: GridCell) => `${cell.col}:${cell.row}`;

export const createDesktopGridMetrics = (
  width: number,
  height: number,
  tabletMode = false,
  iconScale = 1
): DesktopGridMetrics => {
  const isPhone = width <= 640;
  const isCompactPhone = width <= 374;
  const isRegularPhone = width > 374 && width <= 430;
  const isShortPhone = isPhone && height <= 620;
  const scale = isPhone
    ? Math.min(1, Math.max(0.8, iconScale || 1))
    : Math.min(1.18, Math.max(0.9, iconScale || 1));
  const phoneProfile = isCompactPhone
    ? { originX: 8, cellWidth: 84, cellHeight: isShortPhone ? 86 : 92, itemWidth: 72, itemHeight: isShortPhone ? 78 : 84, tileSize: 46, iconSize: 42 }
    : isRegularPhone
      ? { originX: 10, cellWidth: 88, cellHeight: isShortPhone ? 90 : 98, itemWidth: 76, itemHeight: isShortPhone ? 82 : 88, tileSize: 50, iconSize: 46 }
      : { originX: 12, cellWidth: 96, cellHeight: isShortPhone ? 96 : 104, itemWidth: 82, itemHeight: isShortPhone ? 88 : 94, tileSize: 54, iconSize: 50 };
  const originX = isPhone ? phoneProfile.originX : tabletMode ? 24 : 26;
  const originY = isPhone ? 12 : tabletMode ? 20 : 18;
  const cellWidth = Math.round((isPhone ? phoneProfile.cellWidth : tabletMode ? 138 : 126) * scale);
  const cellHeight = Math.round((isPhone ? phoneProfile.cellHeight : tabletMode ? 148 : 136) * scale);
  const itemWidth = Math.round((isPhone ? phoneProfile.itemWidth : tabletMode ? 108 : 98) * scale);
  const itemHeight = Math.round((isPhone ? phoneProfile.itemHeight : tabletMode ? 124 : 112) * scale);
  const tileSize = Math.round((isPhone ? phoneProfile.tileSize : tabletMode ? 88 : 78) * scale);
  const iconSize = Math.round((isPhone ? phoneProfile.iconSize : tabletMode ? 80 : 72) * scale);
  const columns = Math.max(1, Math.floor((Math.max(1, width) - originX * 2) / cellWidth));
  const rows = Math.max(1, Math.floor((Math.max(1, height) - originY * 2) / cellHeight));

  return {
    originX,
    originY,
    cellWidth,
    cellHeight,
    itemWidth,
    itemHeight,
    tileSize,
    iconSize,
    columns,
    rows,
    width,
    height,
  };
};

export const clampCell = (cell: GridCell, metrics: DesktopGridMetrics): GridCell => ({
  col: Math.max(0, Math.min(metrics.columns - 1, cell.col)),
  row: Math.max(0, Math.min(metrics.rows - 1, cell.row)),
});

export const positionForCell = (cell: GridCell, metrics: DesktopGridMetrics): Position => {
  const safe = clampCell(cell, metrics);
  return {
    x: metrics.originX + safe.col * metrics.cellWidth,
    y: metrics.originY + safe.row * metrics.cellHeight,
  };
};

export const cellForPosition = (position: Position, metrics: DesktopGridMetrics): GridCell => (
  clampCell({
    col: Math.round((position.x - metrics.originX) / metrics.cellWidth),
    row: Math.round((position.y - metrics.originY) / metrics.cellHeight),
  }, metrics)
);

export const normalizePositionToGrid = (position: Position, metrics: DesktopGridMetrics): Position => (
  positionForCell(cellForPosition(position, metrics), metrics)
);

export const buildOccupiedCells = (
  icons: DesktopIcon[],
  metrics: DesktopGridMetrics,
  ignoreIds: string[] = []
): Set<string> => {
  const ignored = new Set(ignoreIds);
  const occupied = new Set<string>();
  icons.forEach((icon) => {
    if (ignored.has(icon.id)) return;
    occupied.add(cellKey(cellForPosition(icon.position, metrics)));
  });
  return occupied;
};

export const findNearestFreeCell = (
  preferred: GridCell,
  metrics: DesktopGridMetrics,
  occupied: Set<string>
): GridCell => {
  const start = clampCell(preferred, metrics);
  if (!occupied.has(cellKey(start))) return start;

  const maxRadius = Math.max(metrics.columns, metrics.rows);
  for (let radius = 1; radius <= maxRadius; radius += 1) {
    let best: GridCell | null = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let row = start.row - radius; row <= start.row + radius; row += 1) {
      for (let col = start.col - radius; col <= start.col + radius; col += 1) {
        if (col < 0 || row < 0 || col >= metrics.columns || row >= metrics.rows) continue;
        if (Math.abs(col - start.col) !== radius && Math.abs(row - start.row) !== radius) continue;
        const candidate = { col, row };
        if (occupied.has(cellKey(candidate))) continue;
        const distance = Math.hypot(col - start.col, row - start.row);
        if (distance < bestDistance) {
          best = candidate;
          bestDistance = distance;
        }
      }
    }

    if (best) return best;
  }

  return start;
};

export const findIconAtCell = (
  icons: DesktopIcon[],
  cell: GridCell,
  metrics: DesktopGridMetrics,
  ignoreIds: string[] = []
): DesktopIcon | undefined => {
  const ignored = new Set(ignoreIds);
  const key = cellKey(cell);
  return icons.find((icon) => !ignored.has(icon.id) && cellKey(cellForPosition(icon.position, metrics)) === key);
};

export const arrangeDesktopIcons = (
  icons: DesktopIcon[],
  metrics: DesktopGridMetrics
): DesktopIcon[] => {
  const occupied = new Set<string>();
  return icons.map((icon, index) => {
    const preferred = {
      col: index % metrics.columns,
      row: Math.floor(index / metrics.columns),
    };
    const cell = findNearestFreeCell(preferred, metrics, occupied);
    occupied.add(cellKey(cell));
    return {
      ...icon,
      position: positionForCell(cell, metrics),
      isSelected: false,
    };
  });
};

export const moveItemsToGrid = (
  icons: DesktopIcon[],
  ids: string[],
  anchorPosition: Position,
  metrics: DesktopGridMetrics
): DesktopIcon[] => {
  const movingIds = ids.filter(Boolean);
  const occupied = buildOccupiedCells(icons, metrics, movingIds);
  const anchorCell = cellForPosition(anchorPosition, metrics);
  const nextPositions = new Map<string, Position>();

  movingIds.forEach((id, index) => {
    const preferred = clampCell({
      col: anchorCell.col + (index % Math.max(1, metrics.columns)),
      row: anchorCell.row + Math.floor(index / Math.max(1, metrics.columns)),
    }, metrics);
    const cell = findNearestFreeCell(preferred, metrics, occupied);
    occupied.add(cellKey(cell));
    nextPositions.set(id, positionForCell(cell, metrics));
  });

  return icons.map((icon) => (
    nextPositions.has(icon.id)
      ? { ...icon, position: nextPositions.get(icon.id)!, isSelected: movingIds.includes(icon.id) }
      : icon
  ));
};
