import { describe, expect, it } from 'vitest';
import type { AssetDef } from '../../../entities/asset';
import { toPlaceableSet } from '../../../entities/island-map';
import { placeAssets } from './placement';

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
});
