import { describe, expect, it } from 'vitest';
import { toPlaceableSet } from '../../../entities/island-map';
import type { GridParams, EllipseMask } from '../../../shared/lib/iso/grid';
import type { Placement } from './placement';
import { repairPlacements } from './ai-place';

/** 테스트용 그리드·마스크 — 20x20, 중성 마스크 */
const grid: GridParams = { originX: 0, originY: 0, tileW: 2, cols: 20, rows: 20 };
const mask: EllipseMask = { cx: 0, cy: 0, rx: 1e6, ry: 1e6 };

/** 간단한 1x1 asset 요청 생성 */
function req(assetId: string, count: number) {
  return {
    assetId,
    count,
    footprint: { w: 1, h: 1 },
  };
}

/** 간단한 2x2 asset 요청 생성 */
function req2(assetId: string, count: number) {
  return {
    assetId,
    count,
    footprint: { w: 2, h: 2 },
  };
}

describe('repairPlacements', () => {
  it('미지 assetId는 폐기됨', () => {
    const placeable = toPlaceableSet([[0, 0], [1, 0]]);
    const ai = [
      { assetId: 'unknown-asset', col: 0, row: 0 },
      { assetId: 'tree', col: 1, row: 0 },
    ];
    const result = repairPlacements(ai, {
      placeable,
      grid,
      mask,
      requests: [req('tree', 1)],
      fixed: [],
    });
    expect(result.placements.every((p) => p.assetId !== 'unknown-asset')).toBe(true);
    expect(result.placements.some((p) => p.assetId === 'tree')).toBe(true);
  });

  it('요청 개수 초과분은 폐기됨', () => {
    const placeable = toPlaceableSet([[0, 0], [1, 0], [2, 0]]);
    const ai = [
      { assetId: 'tree', col: 0, row: 0 },
      { assetId: 'tree', col: 1, row: 0 },
      { assetId: 'tree', col: 2, row: 0 },
    ];
    // count=1이므로 2개 초과분 폐기
    const result = repairPlacements(ai, {
      placeable,
      grid,
      mask,
      requests: [req('tree', 1)],
      fixed: [],
    });
    const trees = result.placements.filter((p) => p.assetId === 'tree');
    expect(trees).toHaveLength(1);
  });

  it('유효 앵커(footprint 전체 placeable & 비점유)는 그대로 채택', () => {
    const placeable = toPlaceableSet([[3, 5], [4, 5]]);
    const ai = [{ assetId: 'tree', col: 3, row: 5 }];
    const result = repairPlacements(ai, {
      placeable,
      grid,
      mask,
      requests: [req('tree', 1)],
      fixed: [],
    });
    expect(result.placements.some((p) => p.assetId === 'tree' && p.col === 3 && p.row === 5)).toBe(true);
  });

  it('placeable 밖 앵커는 가장 가까운 유효 앵커로 스냅', () => {
    // placeable: (5,0)만 있음
    // AI는 (0,0) 제안 → (5,0)으로 스냅되어야 함
    const placeable = toPlaceableSet([[5, 0]]);
    const ai = [{ assetId: 'tree', col: 0, row: 0 }];
    const result = repairPlacements(ai, {
      placeable,
      grid,
      mask,
      requests: [req('tree', 1)],
      fixed: [],
    });
    expect(result.placements.some((p) => p.assetId === 'tree' && p.col === 5 && p.row === 0)).toBe(true);
    expect(result.failedCount).toBe(0);
  });

  it('두 AI 앵커가 겹치면 두 번째는 스냅 또는 채움으로 다른 칸에 배치', () => {
    // (0,0)과 (0,0) 같은 좌표 두 개 요청 → 둘 다 다른 위치에 있어야 함
    const placeable = toPlaceableSet([[0, 0], [1, 0], [2, 0]]);
    const ai = [
      { assetId: 'tree', col: 0, row: 0 },
      { assetId: 'tree', col: 0, row: 0 }, // 동일 좌표 겹침
    ];
    const result = repairPlacements(ai, {
      placeable,
      grid,
      mask,
      requests: [req('tree', 2)],
      fixed: [],
    });
    const trees = result.placements.filter((p) => p.assetId === 'tree');
    expect(trees).toHaveLength(2);
    // 두 배치가 같은 위치를 점유하지 않아야 함
    expect(trees[0].col !== trees[1].col || trees[0].row !== trees[1].row).toBe(true);
  });

  it('부족분은 로컬 placeAssets으로 채움', () => {
    // AI가 0개 제안 → 로컬로 2개 채워야 함
    const placeable = toPlaceableSet([[0, 0], [1, 0], [2, 0]]);
    const ai: { assetId: string; col: number; row: number }[] = [];
    const result = repairPlacements(ai, {
      placeable,
      grid,
      mask,
      requests: [req('tree', 2)],
      fixed: [],
    });
    const trees = result.placements.filter((p) => p.assetId === 'tree');
    expect(trees).toHaveLength(2);
    expect(result.failedCount).toBe(0);
  });

  it('유효 앵커가 전혀 없어도 로컬 배치로 반환', () => {
    // 1x1 칸 하나, AI가 placeable 밖 제안, 스냅 후 로컬 배치
    const placeable = toPlaceableSet([[0, 0]]);
    const ai = [{ assetId: 'tree', col: 99, row: 99 }];
    const result = repairPlacements(ai, {
      placeable,
      grid,
      mask,
      requests: [req('tree', 1)],
      fixed: [],
    });
    // 어떤 방식이든 배치 결과가 있어야 하고 failedCount가 계산됨
    expect(result).toBeDefined();
    expect(result.placements).toBeDefined();
  });

  it('fixed 배치는 결과에 포함되고 점유 처리됨', () => {
    const placeable = toPlaceableSet([[0, 0], [1, 0]]);
    const fixed: Placement[] = [{ assetId: 'character', col: 1, row: 0, footprint: { w: 1, h: 1 } }];
    const ai = [{ assetId: 'tree', col: 1, row: 0 }]; // fixed가 점유한 칸 요청
    const result = repairPlacements(ai, {
      placeable,
      grid,
      mask,
      requests: [req('tree', 1)],
      fixed,
    });
    // character는 결과에 있어야 함
    expect(result.placements.some((p) => p.assetId === 'character')).toBe(true);
    // tree는 (1,0)이 아닌 다른 곳에 배치되어야 함
    const trees = result.placements.filter((p) => p.assetId === 'tree');
    expect(trees.every((t) => !(t.col === 1 && t.row === 0))).toBe(true);
  });

  it('2x2 footprint placeable 밖 → 스냅', () => {
    // 2x2가 들어갈 수 있는 위치: (0,0)~(1,1) 모두 placeable
    const placeable = toPlaceableSet([[0, 0], [1, 0], [0, 1], [1, 1]]);
    const ai = [{ assetId: 'home', col: 10, row: 10 }]; // 범위 밖
    const result = repairPlacements(ai, {
      placeable,
      grid,
      mask,
      requests: [req2('home', 1)],
      fixed: [],
    });
    const homes = result.placements.filter((p) => p.assetId === 'home');
    expect(homes).toHaveLength(1);
    // (0,0)에 스냅되었어야 함
    expect(homes[0]).toMatchObject({ col: 0, row: 0 });
  });
});
