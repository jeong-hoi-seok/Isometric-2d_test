import {
  gridToScreen,
  tileHeight,
  type EllipseMask,
  type GridParams,
  type Point,
} from '../../../shared/lib/iso/grid';

/**
 * footprint 블록 중심의 화면 좌표
 * gridToScreen(col+(w−1)/2, row+(h−1)/2) + (0, tileH/2) — gridToScreen은 소수 좌표 허용
 */
export function blockCenter(
  grid: GridParams,
  col: number,
  row: number,
  footprint: { w: number; h: number },
): Point {
  const top = gridToScreen(grid, col + (footprint.w - 1) / 2, row + (footprint.h - 1) / 2);
  return { x: top.x, y: top.y + tileHeight(grid) / 2 };
}

/** 타원 마스크 기준 정규화 반경 — √((dx/rx)² + (dy/ry)²), 0=중앙 1=가장자리 */
export function normalizedRadius(mask: EllipseMask, point: Point): number {
  const dx = (point.x - mask.cx) / mask.rx;
  const dy = (point.y - mask.cy) / mask.ry;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 존 점수 — 구간 안 1, 밖은 exp(−(d/0.15)²) (d = 가까운 경계까지 거리)
 * zone 없으면 1 (균등)
 */
export function zoneScore(r: number, zone?: { min: number; max: number }): number {
  if (!zone) return 1;
  if (r >= zone.min && r <= zone.max) return 1;
  const d = r < zone.min ? zone.min - r : r - zone.max;
  return Math.exp(-((d / 0.15) ** 2));
}

/**
 * 같은 종류 앵커들과 체비셰프 거리 max(|Δcol|,|Δrow|) ≥ minDist 확인
 * minDist 없으면 항상 true
 */
export function minDistOk(
  anchor: { col: number; row: number },
  placedSameAnchors: { col: number; row: number }[],
  minDist?: number,
): boolean {
  if (minDist === undefined) return true;
  return placedSameAnchors.every(
    (p) => Math.max(Math.abs(anchor.col - p.col), Math.abs(anchor.row - p.row)) >= minDist,
  );
}

/**
 * 점수 비례 룰렛 선택 — pick = rng()×Σscore, 누적 합 순회
 * 총점 0이면 점수 무시 균등 폴백 (전멸 방지)
 */
export function roulette(scores: number[], rng: () => number): number {
  const total = scores.reduce((sum, s) => sum + s, 0);
  if (total === 0) {
    return Math.min(Math.floor(rng() * scores.length), scores.length - 1);
  }
  const pick = rng() * total;
  let cum = 0;
  for (let i = 0; i < scores.length; i++) {
    cum += scores[i];
    if (cum > pick) return i;
  }
  return scores.length - 1;
}

/**
 * count를 [min..max] 균등 랜덤 크기 그룹으로 분할 — 마지막 그룹은 잔여(≥1)
 */
export function splitGroups(
  count: number,
  min: number,
  max: number,
  rng: () => number,
): number[] {
  const groups: number[] = [];
  let remaining = count;
  while (remaining > 0) {
    const size = Math.floor(rng() * (max - min + 1)) + min;
    if (size >= remaining) {
      // 마지막 그룹은 잔여 (≥1)
      groups.push(remaining);
      break;
    }
    groups.push(size);
    remaining -= size;
  }
  return groups;
}
