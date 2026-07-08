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
    const grid = { originX: 0, originY: 0, tileW: 64, cols: 12, rows: 12 };
    // 캐릭터 고정 블록(중앙) 밖에 나무 footprint가 들어갈 넉넉한 영역 제공
    // — 에셋 footprint 튜닝에 깨지지 않도록 좌표를 고정 단언하지 않는다
    const pairs: [number, number][] = [];
    for (let c = 0; c <= 3; c++) for (let r = 0; r <= 3; r++) pairs.push([c, r]);
    runPlacement(toPlaceableSet(pairs), grid, () => 0);
    const { placements, failedCount } = usePlacementStore.getState();
    expect(placements).toContainEqual(expect.objectContaining({ assetId: 'tree' }));
    expect(placements).toContainEqual(expect.objectContaining({ assetId: 'character' }));
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
