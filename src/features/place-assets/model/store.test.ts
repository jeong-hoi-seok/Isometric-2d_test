import { beforeEach, describe, expect, it } from 'vitest';
import { ASSETS } from '../../../entities/asset';
import { toPlaceableSet } from '../../../entities/island-map';
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

  it('runPlacement가 placements·failedCount 갱신', () => {
    const { setCount, runPlacement } = usePlacementStore.getState();
    for (const asset of ASSETS) setCount(asset.id, 0);
    setCount('tree', 1);
    runPlacement(toPlaceableSet([[3, 3]]), () => 0);
    const { placements, failedCount } = usePlacementStore.getState();
    expect(placements).toEqual([
      { assetId: 'tree', col: 3, row: 3, footprint: { w: 1, h: 1 } },
    ]);
    expect(failedCount).toBe(0);
  });

  it('빈 placeable이면 전부 실패 카운트', () => {
    usePlacementStore.getState().runPlacement(new Set());
    expect(usePlacementStore.getState().failedCount).toBe(
      ASSETS.reduce((sum, a) => sum + a.defaultCount, 0),
    );
  });
});
