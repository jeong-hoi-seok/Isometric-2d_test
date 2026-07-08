import type { AssetDef } from '../../../entities/asset';
import { CHARACTER } from '../../../entities/asset';
import { cellKey } from '../../../entities/island-map';
import type { EllipseMask, GridParams } from '../../../shared/lib/iso/grid';
import { blockCenter, minDistOk, normalizedRadius, roulette, splitGroups, zoneScore } from './scoring';

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

/** 점수 계산에 필요한 컨텍스트 — 없으면 전 후보 균등(하위 호환) */
export interface PlacementContext {
  grid: GridParams;
  mask: EllipseMask;
}

/** 그리드 중앙 칸 좌표 반환 */
export function centerCell(grid: GridParams): { col: number; row: number } {
  return {
    col: Math.floor((grid.cols - 1) / 2),
    row: Math.floor((grid.rows - 1) / 2),
  };
}

/** CHARACTER footprint 블록이 그리드 중앙에 오도록 고정 배치하는 Placement 반환 */
export function characterPlacement(grid: GridParams): Placement {
  return {
    assetId: CHARACTER.id,
    col: Math.floor((grid.cols - CHARACTER.footprint.w) / 2),
    row: Math.floor((grid.rows - CHARACTER.footprint.h) / 2),
    footprint: CHARACTER.footprint,
  };
}

export function placeAssets(
  placeable: Set<string>,
  requests: { asset: AssetDef; count: number }[],
  random: () => number = Math.random,
  fixed: Placement[] = [],
  ctx?: PlacementContext,
): PlacementResult {
  // 후보 열거 순서 = placeable 삽입 순서 (결정성 보장)
  const cells = [...placeable].map((key) => key.split(',').map(Number) as [number, number]);
  const occupied = new Set<string>();
  const placements: Placement[] = [...fixed];
  let failedCount = 0;

  // fixed 칸을 먼저 점유 처리 (placeable 여부 무관)
  for (const fp of fixed) {
    occupy(fp, occupied);
  }

  // 큰 footprint 먼저 배치해 성공률 확보
  const sorted = [...requests].sort(
    (a, b) => b.asset.footprint.w * b.asset.footprint.h - a.asset.footprint.w * a.asset.footprint.h,
  );

  for (const { asset, count } of sorted) {
    // 같은 종류 앵커 목록 (minDistSame 점수용)
    const sameAnchors: { col: number; row: number }[] = [];

    const commit = (pl: Placement) => {
      occupy(pl, occupied);
      placements.push(pl);
      sameAnchors.push({ col: pl.col, row: pl.row });
    };

    const cluster = asset.placement?.cluster;
    if (cluster && count > 0) {
      // 군집: count를 [min..max] 랜덤 크기 그룹으로 분할 (마지막 그룹은 잔여)
      const groups = splitGroups(count, cluster.min, cluster.max, random);
      for (const groupSize of groups) {
        // 그룹 시드: 전역 룰렛
        const seed = pickPlacement(asset, cells, placeable, occupied, sameAnchors, random, ctx);
        if (!seed) {
          failedCount += groupSize;
          continue;
        }
        commit(seed);

        // 멤버: 시드 앵커 기준 체비셰프 radius 내 후보로 제한, 없으면 전역 폴백
        for (let m = 1; m < groupSize; m++) {
          const nearSeed = cells.filter(
            ([col, row]) =>
              Math.max(Math.abs(col - seed.col), Math.abs(row - seed.row)) <= cluster.radius,
          );
          const member =
            pickPlacement(asset, nearSeed, placeable, occupied, sameAnchors, random, ctx) ??
            pickPlacement(asset, cells, placeable, occupied, sameAnchors, random, ctx);
          if (member) commit(member);
          else failedCount++;
        }
      }
    } else {
      for (let i = 0; i < count; i++) {
        const pl = pickPlacement(asset, cells, placeable, occupied, sameAnchors, random, ctx);
        if (pl) commit(pl);
        else failedCount++;
      }
    }
  }

  // 깊이 정렬: footprint 앞쪽 모서리의 row+col 오름차순 = 뒤에서 앞으로 그림
  placements.sort(
    (a, b) =>
      a.col + a.footprint.w + a.row + a.footprint.h -
      (b.col + b.footprint.w + b.row + b.footprint.h),
  );

  return { placements, failedCount };
}

/**
 * 유효 앵커 전수 열거 → 점수 룰렛으로 하나 선택
 * ctx 또는 메타가 없으면 전 후보 점수 1(균등) — 기존 동작과 하위 호환
 */
function pickPlacement(
  asset: AssetDef,
  cells: [number, number][],
  placeable: Set<string>,
  occupied: Set<string>,
  sameAnchors: { col: number; row: number }[],
  random: () => number,
  ctx?: PlacementContext,
): Placement | null {
  const candidates = cells.filter(([col, row]) =>
    fits(asset.footprint, col, row, placeable, occupied),
  );
  if (candidates.length === 0) return null;

  const meta = asset.placement;
  const scores = candidates.map(([col, row]) => {
    if (!ctx || !meta) return 1;
    const r = normalizedRadius(ctx.mask, blockCenter(ctx.grid, col, row, asset.footprint));
    const distOk = minDistOk({ col, row }, sameAnchors, meta.minDistSame);
    return zoneScore(r, meta.zone) * (distOk ? 1 : 0);
  });

  const [col, row] = candidates[roulette(scores, random)];
  return { assetId: asset.id, col, row, footprint: asset.footprint };
}

function occupy(pl: Placement, occupied: Set<string>): void {
  for (let dc = 0; dc < pl.footprint.w; dc++) {
    for (let dr = 0; dr < pl.footprint.h; dr++) {
      occupied.add(cellKey(pl.col + dc, pl.row + dr));
    }
  }
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
