import { beforeEach, describe, expect, it } from 'vitest';
import { defaultIslandMap, toPlaceableSet } from '../../../entities/island-map';
import { cellsInEllipse } from '../../../shared/lib/iso/grid';
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

describe('ellipseMask', () => {
  it('초기값', () => {
    expect(useMapStore.getState().ellipseMask).toEqual({ cx: 825, cy: 550, rx: 700, ry: 430 });
  });

  it('setEllipseMask 부분 갱신', () => {
    useMapStore.getState().setEllipseMask({ rx: 500 });
    const { ellipseMask } = useMapStore.getState();
    expect(ellipseMask.rx).toBe(500);
    expect(ellipseMask.cy).toBe(550);
  });

  it('applyEllipseMask가 placeable을 타원 내부 칸으로 교체', () => {
    useMapStore.getState().setEllipseMask({ cx: 825, cy: 550, rx: 300, ry: 200 });
    useMapStore.getState().applyEllipseMask();
    const { grid, placeable, ellipseMask } = useMapStore.getState();
    const expected = toPlaceableSet(cellsInEllipse(grid, ellipseMask));
    expect(placeable).toEqual(expected);
    expect(placeable.size).toBeGreaterThan(0);
    expect(placeable.size).toBeLessThan(grid.cols * grid.rows);
  });
});
