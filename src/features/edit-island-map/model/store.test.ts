import { beforeEach, describe, expect, it } from 'vitest';
import { defaultIslandMap } from '../../../entities/island-map';
import { useMapStore } from './store';

const initialState = useMapStore.getState();

beforeEach(() => {
  useMapStore.setState(initialState, true);
});

describe('useMapStore', () => {
  it('초기값은 island-map.json', () => {
    const { grid, placeable } = useMapStore.getState();
    expect(grid).toEqual(defaultIslandMap.grid);
    expect(placeable.size).toBe(defaultIslandMap.placeable.length);
  });

  it('setGridParam 부분 갱신', () => {
    useMapStore.getState().setGridParam({ tileW: 120 });
    const { grid } = useMapStore.getState();
    expect(grid.tileW).toBe(120);
    expect(grid.cols).toBe(defaultIslandMap.grid.cols);
  });

  it('paintCell true로 추가, false로 제거', () => {
    useMapStore.getState().paintCell(-1, -1, true);
    expect(useMapStore.getState().placeable.has('-1,-1')).toBe(true);
    useMapStore.getState().paintCell(-1, -1, false);
    expect(useMapStore.getState().placeable.has('-1,-1')).toBe(false);
  });

  it('이미 target 상태면 Set 참조 유지', () => {
    const before = useMapStore.getState().placeable;
    const [col, row] = defaultIslandMap.placeable[0];
    useMapStore.getState().paintCell(col, row, true);
    expect(useMapStore.getState().placeable).toBe(before);
  });
});
