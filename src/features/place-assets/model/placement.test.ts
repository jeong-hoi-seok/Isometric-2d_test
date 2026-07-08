import { describe, expect, it } from 'vitest';
import type { AssetDef } from '../../../entities/asset';
import { toPlaceableSet } from '../../../entities/island-map';
import { centerCell, characterPlacement, placeAssets } from './placement';

function asset(id: string, w: number, h: number): AssetDef {
  return { id, label: id, src: `/assets/${id}.png`, footprint: { w, h }, defaultCount: 1, scale: 1 };
}

/** 고정 수열을 순환 반환하는 결정적 RNG */
function seqRandom(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

describe('placeAssets', () => {
  it('칸 하나에 1x1 하나 배치', () => {
    const placeable = toPlaceableSet([[4, 4]]);
    const result = placeAssets(placeable, [{ asset: asset('tree', 1, 1), count: 1 }], seqRandom([0]));
    expect(result.placements).toEqual([
      { assetId: 'tree', col: 4, row: 4, footprint: { w: 1, h: 1 } },
    ]);
    expect(result.failedCount).toBe(0);
  });

  it('겹침 금지 — 칸 1개에 2개 요청하면 1개 실패', () => {
    const placeable = toPlaceableSet([[0, 0]]);
    const result = placeAssets(placeable, [{ asset: asset('tree', 1, 1), count: 2 }], seqRandom([0]));
    expect(result.placements).toHaveLength(1);
    expect(result.failedCount).toBe(1);
  });

  it('2x2는 footprint 전체가 배치 가능해야 확정', () => {
    // 2x2 블록: (0,0)~(1,1) 완비, (5,5)는 고립 칸
    const placeable = toPlaceableSet([
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
      [5, 5],
    ]);
    // random이 (5,5)를 먼저 뽑아도 fits 실패 → 재시도로 (0,0) 계열 선택
    const result = placeAssets(placeable, [{ asset: asset('home', 2, 2), count: 1 }], seqRandom([0.9, 0]));
    expect(result.placements).toEqual([
      { assetId: 'home', col: 0, row: 0, footprint: { w: 2, h: 2 } },
    ]);
  });

  it('placeable이 비면 전부 실패', () => {
    const result = placeAssets(new Set(), [{ asset: asset('tree', 1, 1), count: 3 }]);
    expect(result.placements).toHaveLength(0);
    expect(result.failedCount).toBe(3);
  });

  it('결과는 row+col 깊이 오름차순(뒤→앞) 정렬', () => {
    const placeable = toPlaceableSet([
      [0, 0],
      [3, 3],
    ]);
    // 앞쪽 칸(3,3)이 먼저 뽑히도록 유도
    const result = placeAssets(placeable, [{ asset: asset('tree', 1, 1), count: 2 }], seqRandom([0.9, 0]));
    const keys = result.placements.map((pl) => pl.col + pl.footprint.w + pl.row + pl.footprint.h);
    expect(keys).toEqual([...keys].sort((a, b) => a - b));
    expect(result.placements[0]).toMatchObject({ col: 0, row: 0 });
  });

  it('fixed 칸은 랜덤 배치가 점유 못함', () => {
    // placeable: (0,0), (1,0) 두 칸 중 (1,0)을 fixed로 고정
    const placeable = toPlaceableSet([[0, 0], [1, 0]]);
    const fixedPlacement = { assetId: 'char', col: 1, row: 0, footprint: { w: 1, h: 1 } };
    // 1x1 하나 요청 → fixed 칸(1,0)이 이미 점유됐으므로 (0,0)에 배치됨
    const result = placeAssets(placeable, [{ asset: asset('tree', 1, 1), count: 1 }], seqRandom([0.9, 0]), [fixedPlacement]);
    expect(result.placements).toContainEqual(expect.objectContaining({ assetId: 'tree', col: 0, row: 0 }));
    expect(result.placements).not.toContainEqual(expect.objectContaining({ assetId: 'tree', col: 1, row: 0 }));
  });

  it('ctx+zone 메타 — 선호 존 밖 후보는 사실상 배제되고 존 내 후보 선택', () => {
    const grid = { originX: 0, originY: 0, tileW: 2, cols: 20, rows: 20 };
    const mask = { cx: 0, cy: 10, rx: 20, ry: 20 };
    const placeable = toPlaceableSet([
      [10, 10], // 블록 중심 (0, 10.5) → r ≈ 0.025 → 존(0.8~1) 밖 → 점수 ≈ 0
      [18, 1], // 블록 중심 (17, 10) → r = 0.85 → 존 안 → 점수 1
    ]);
    const edgeAsset: AssetDef = {
      ...asset('lighthouse', 1, 1),
      placement: { zone: { min: 0.8, max: 1 } },
    };
    // rng=0.5여도 존 안 후보가 총점 대부분을 차지해 (18,1) 선택
    const result = placeAssets(
      placeable,
      [{ asset: edgeAsset, count: 1 }],
      seqRandom([0.5]),
      [],
      { grid, mask },
    );
    expect(result.placements).toEqual([
      { assetId: 'lighthouse', col: 18, row: 1, footprint: { w: 1, h: 1 } },
    ]);
  });

  it('ctx+cluster 메타 — 멤버가 시드 체비셰프 반경 내에 배치됨', () => {
    const grid = { originX: 0, originY: 0, tileW: 2, cols: 20, rows: 20 };
    const mask = { cx: 0, cy: 0, rx: 1e6, ry: 1e6 }; // 존 중립 대형 마스크
    // 3x3 블록 + 멀리 떨어진 고립 칸
    const pairs: [number, number][] = [];
    for (let c = 0; c <= 2; c++) for (let r = 0; r <= 2; r++) pairs.push([c, r]);
    pairs.push([15, 15]);
    const placeable = toPlaceableSet(pairs);
    const clusterAsset: AssetDef = {
      ...asset('bush', 1, 1),
      placement: { cluster: { min: 2, max: 2, radius: 2 } },
    };
    // splitGroups(2,2,2) = [2]: 시드 1 + 멤버 1
    const result = placeAssets(
      placeable,
      [{ asset: clusterAsset, count: 2 }],
      seqRandom([0]),
      [],
      { grid, mask },
    );
    expect(result.failedCount).toBe(0);
    const anchors = result.placements.map((pl) => ({ col: pl.col, row: pl.row }));
    expect(anchors).toHaveLength(2);
    // 두 앵커 간 체비셰프 거리 <= radius(2) — 고립 칸 (15,15)는 선택되지 않음
    const cheb = Math.max(
      Math.abs(anchors[0].col - anchors[1].col),
      Math.abs(anchors[0].row - anchors[1].row),
    );
    expect(cheb).toBeLessThanOrEqual(2);
  });

  it('fixed가 결과에 포함되고 깊이 정렬됨', () => {
    // fixed (5,5) + 랜덤 (0,0) → 결과 순서 [(0,0), (5,5)]
    const placeable = toPlaceableSet([[0, 0]]);
    const fixedPlacement = { assetId: 'char', col: 5, row: 5, footprint: { w: 1, h: 1 } };
    const result = placeAssets(placeable, [{ asset: asset('tree', 1, 1), count: 1 }], seqRandom([0]), [fixedPlacement]);
    expect(result.placements[0]).toMatchObject({ col: 0, row: 0 });
    expect(result.placements[1]).toMatchObject({ col: 5, row: 5 });
  });
});

describe('centerCell', () => {
  it('{cols:26,rows:26} → (12,12)', () => {
    const grid = { originX: 0, originY: 0, tileW: 64, cols: 26, rows: 26 };
    expect(centerCell(grid)).toEqual({ col: 12, row: 12 });
  });

  it('{cols:3,rows:3} → (1,1)', () => {
    const grid = { originX: 0, originY: 0, tileW: 64, cols: 3, rows: 3 };
    expect(centerCell(grid)).toEqual({ col: 1, row: 1 });
  });
});

describe('characterPlacement', () => {
  it('CHARACTER footprint가 그리드 중앙에 오도록 앵커 계산', () => {
    // 2x2 footprint, 26x26: anchor (12,12) → (12,12)~(13,13) 블록 중심 = 마름모 중심
    const grid = { originX: 0, originY: 0, tileW: 64, cols: 26, rows: 26 };
    const pl = characterPlacement(grid);
    expect(pl.col).toBe(12);
    expect(pl.row).toBe(12);
    expect(pl.assetId).toBe('character');
    expect(pl.footprint).toEqual({ w: 2, h: 2 });
  });
});
