import { beforeEach, describe, expect, it } from 'vitest';
import { ASSETS } from '../../../entities/asset';
import { defaultIslandMap } from '../../../entities/island-map';
import { toPlaceableSet } from '../../../entities/island-map';
import { characterPlacement } from './placement';
import { usePlacementStore } from './store';

const initialState = usePlacementStore.getState();

beforeEach(() => {
  usePlacementStore.setState(initialState, true);
});

describe('usePlacementStore', () => {
  it('초기 counts는 defaultCount', () => {
    const { counts } = usePlacementStore.getState();
    for (const asset of ASSETS) {
      expect(counts[asset.id]).toBe(asset.defaultCount);
    }
  });

  it('setCount로 개수 변경', () => {
    usePlacementStore.getState().setCount('tree', 9);
    expect(usePlacementStore.getState().counts.tree).toBe(9);
  });

  it('toggleGrid 반전', () => {
    expect(usePlacementStore.getState().showGrid).toBe(false);
    usePlacementStore.getState().toggleGrid();
    expect(usePlacementStore.getState().showGrid).toBe(true);
  });

  it('초기 placements에 캐릭터 중앙 고정 포함', () => {
    const { placements } = usePlacementStore.getState();
    const charPl = characterPlacement(defaultIslandMap.grid);
    expect(placements).toContainEqual(charPl);
  });

  it('runPlacement가 placements·failedCount 갱신', () => {
    const { setCount, runPlacement } = usePlacementStore.getState();
    for (const asset of ASSETS) setCount(asset.id, 0);
    setCount('tree', 1);
    const grid = { originX: 0, originY: 0, tileW: 64, cols: 10, rows: 10 };
    // tree는 (3,3), character는 (4,4) = centerCell({cols:10,rows:10})
    runPlacement(toPlaceableSet([[3, 3]]), grid, () => 0);
    const { placements, failedCount } = usePlacementStore.getState();
    // character (4,4)와 tree (3,3) 모두 포함, 깊이 정렬: (3,3) depth=5, (4,4) depth=6 → tree 먼저
    expect(placements).toContainEqual(expect.objectContaining({ assetId: 'tree', col: 3, row: 3 }));
    expect(placements).toContainEqual(expect.objectContaining({ assetId: 'character', col: 4, row: 4 }));
    expect(failedCount).toBe(0);
  });

  it('빈 placeable이면 랜덤 배치 전부 실패, 캐릭터는 여전히 고정 배치', () => {
    const grid = defaultIslandMap.grid;
    usePlacementStore.getState().runPlacement(new Set(), grid);
    const { placements, failedCount } = usePlacementStore.getState();
    expect(placements).toHaveLength(1);
    expect(placements[0]).toMatchObject({ assetId: 'character' });
    expect(failedCount).toBe(ASSETS.reduce((sum, a) => sum + a.defaultCount, 0));
  });
});
