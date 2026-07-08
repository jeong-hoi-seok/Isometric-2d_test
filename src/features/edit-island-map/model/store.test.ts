import { beforeEach, describe, expect, it } from 'vitest';
import { defaultIslandMap, toPlaceableSet } from '../../../entities/island-map';
import { cellsInEllipse, fitGridToMask } from '../../../shared/lib/iso/grid';
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

  it('setGridN 갱신', () => {
    useMapStore.getState().setGridN(16);
    expect(useMapStore.getState().gridN).toBe(16);
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

describe('ellipseMask', () => {
  it('초기값', () => {
    expect(useMapStore.getState().ellipseMask).toEqual({ cx: 710, cy: 465, rx: 590, ry: 370 });
  });

  it('setEllipseMask 부분 갱신', () => {
    useMapStore.getState().setEllipseMask({ rx: 500 });
    const { ellipseMask } = useMapStore.getState();
    expect(ellipseMask.rx).toBe(500);
    expect(ellipseMask.cy).toBe(465);
  });

  it('applyEllipseMask가 grid를 마스크에 맞춰 유도하고 placeable 교체', () => {
    useMapStore.getState().setGridN(20);
    useMapStore.getState().applyEllipseMask();
    const { grid, placeable, ellipseMask, gridN } = useMapStore.getState();
    expect(grid).toEqual(fitGridToMask(ellipseMask, gridN));
    const expected = toPlaceableSet(cellsInEllipse(grid, ellipseMask));
    expect(placeable).toEqual(expected);
    expect(placeable.size).toBeGreaterThan(0);
  });
});
