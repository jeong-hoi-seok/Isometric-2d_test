import { useEffect, useRef } from 'react';
import type { AssetDef } from '../../../entities/asset';
import { cellKey } from '../../../entities/island-map';
import type { Placement } from '../../../features/place-assets/model/placement';
import {
  cellDiamond,
  isInside,
  screenToGrid,
  type GridParams,
} from '../../../shared/lib/iso/grid';
import { assetDrawRect } from '../model/asset-rect';

interface Props {
  islandImg: HTMLImageElement;
  assetImgs: Record<string, HTMLImageElement>;
  grid: GridParams;
  placements: Placement[];
  assets: AssetDef[];
  showGrid?: boolean;
  /** 에디터: 배치 가능 칸 하이라이트 */
  placeableSet?: Set<string>;
  /** 에디터: 클릭·드래그로 지나간 칸 (col,row) 콜백 */
  onCellPaint?: (col: number, row: number) => void;
}

export function IslandCanvas({
  islandImg,
  assetImgs,
  grid,
  placements,
  assets,
  showGrid = false,
  placeableSet,
  onCellPaint,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const paintingRef = useRef(false);
  const scaleById = Object.fromEntries(assets.map((a) => [a.id, a.scale]));

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    canvas.width = islandImg.naturalWidth;
    canvas.height = islandImg.naturalHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(islandImg, 0, 0);

    if (showGrid) drawGridOverlay(ctx, grid, placeableSet);

    for (const placement of placements) {
      const img = assetImgs[placement.assetId];
      if (!img) continue;
      const rect = assetDrawRect(
        grid,
        placement,
        scaleById[placement.assetId] ?? 1,
        img.naturalWidth,
        img.naturalHeight,
      );
      ctx.drawImage(img, rect.x, rect.y, rect.width, rect.height);
    }
  });

  function paintAt(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas || !onCellPaint) return;
    const domRect = canvas.getBoundingClientRect();
    const x = ((clientX - domRect.left) * canvas.width) / domRect.width;
    const y = ((clientY - domRect.top) * canvas.height) / domRect.height;
    const { col, row } = screenToGrid(grid, x, y);
    if (isInside(grid, col, row)) onCellPaint(col, row);
  }

  return (
    <canvas
      ref={canvasRef}
      className="block h-auto max-h-[calc(100vh-3rem)] w-auto max-w-full"
      style={{ touchAction: 'none' }}
      onPointerDown={(e) => {
        paintingRef.current = true;
        paintAt(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (paintingRef.current) paintAt(e.clientX, e.clientY);
      }}
      onPointerUp={() => {
        paintingRef.current = false;
      }}
      onPointerLeave={() => {
        paintingRef.current = false;
      }}
    />
  );
}

function drawGridOverlay(
  ctx: CanvasRenderingContext2D,
  grid: GridParams,
  placeableSet?: Set<string>,
) {
  for (let col = 0; col < grid.cols; col++) {
    for (let row = 0; row < grid.rows; row++) {
      const [top, right, bottom, left] = cellDiamond(grid, col, row);
      ctx.beginPath();
      ctx.moveTo(top.x, top.y);
      ctx.lineTo(right.x, right.y);
      ctx.lineTo(bottom.x, bottom.y);
      ctx.lineTo(left.x, left.y);
      ctx.closePath();
      if (placeableSet?.has(cellKey(col, row))) {
        ctx.fillStyle = 'rgba(46, 204, 113, 0.35)';
        ctx.fill();
      }
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
}
