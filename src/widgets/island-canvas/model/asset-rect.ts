import type { Placement } from '../../../features/place-assets/model/placement';
import { gridToScreen, tileHeight, type GridParams } from '../../../shared/lib/iso/grid';

export interface DrawRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function assetDrawRect(
  grid: GridParams,
  placement: Placement,
  scale: number,
  imgW: number,
  imgH: number,
): DrawRect {
  const { col, row, footprint } = placement;
  // footprint 영역의 바닥 꼭짓점 = 마지막 칸 (col+w-1, row+h-1)의 바닥 꼭짓점
  const lastCellTop = gridToScreen(grid, col + footprint.w - 1, row + footprint.h - 1);
  const bottomX = lastCellTop.x;
  const bottomY = lastCellTop.y + tileHeight(grid);
  const width = grid.tileW * footprint.w * scale;
  const height = width * (imgH / imgW);
  return { x: bottomX - width / 2, y: bottomY - height, width, height };
}
