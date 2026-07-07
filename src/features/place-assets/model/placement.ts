import type { AssetDef } from '../../../entities/asset';
import { cellKey } from '../../../entities/island-map';

export interface Placement {
  assetId: string;
  col: number;
  row: number;
  footprint: { w: number; h: number };
}

export interface PlacementResult {
  placements: Placement[];
  failedCount: number;
}

const MAX_ATTEMPTS = 200;

export function placeAssets(
  placeable: Set<string>,
  requests: { asset: AssetDef; count: number }[],
  random: () => number = Math.random,
): PlacementResult {
  const cells = [...placeable].map((key) => key.split(',').map(Number) as [number, number]);
  const occupied = new Set<string>();
  const placements: Placement[] = [];
  let failedCount = 0;

  // 큰 footprint 먼저 배치해 성공률 확보
  const instances = requests
    .flatMap(({ asset, count }) => Array.from({ length: count }, () => asset))
    .sort((a, b) => b.footprint.w * b.footprint.h - a.footprint.w * a.footprint.h);

  for (const asset of instances) {
    let placed = false;
    for (let attempt = 0; attempt < MAX_ATTEMPTS && cells.length > 0 && !placed; attempt++) {
      const [col, row] = cells[Math.floor(random() * cells.length)];
      if (fits(asset.footprint, col, row, placeable, occupied)) {
        for (let dc = 0; dc < asset.footprint.w; dc++) {
          for (let dr = 0; dr < asset.footprint.h; dr++) {
            occupied.add(cellKey(col + dc, row + dr));
          }
        }
        placements.push({ assetId: asset.id, col, row, footprint: asset.footprint });
        placed = true;
      }
    }
    if (!placed) failedCount++;
  }

  // 깊이 정렬: footprint 앞쪽 모서리의 row+col 오름차순 = 뒤에서 앞으로 그림
  placements.sort(
    (a, b) =>
      a.col + a.footprint.w + a.row + a.footprint.h -
      (b.col + b.footprint.w + b.row + b.footprint.h),
  );

  return { placements, failedCount };
}

function fits(
  footprint: { w: number; h: number },
  col: number,
  row: number,
  placeable: Set<string>,
  occupied: Set<string>,
): boolean {
  for (let dc = 0; dc < footprint.w; dc++) {
    for (let dr = 0; dr < footprint.h; dr++) {
      const key = cellKey(col + dc, row + dr);
      if (!placeable.has(key) || occupied.has(key)) return false;
    }
  }
  return true;
}
