import { create } from 'zustand';
import { cellKey, defaultIslandMap, toPlaceableSet } from '../../../entities/island-map';
import { cellsInEllipse, fitGridToMask, type EllipseMask, type GridParams } from '../../../shared/lib/iso/grid';

interface MapState {
  grid: GridParams;
  placeable: Set<string>;
  ellipseMask: EllipseMask;
  gridN: number;
  setGridN: (n: number) => void;
  paintCell: (col: number, row: number, target: boolean) => void;
  setEllipseMask: (patch: Partial<EllipseMask>) => void;
  applyEllipseMask: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  grid: defaultIslandMap.grid,
  placeable: toPlaceableSet(defaultIslandMap.placeable),
  ellipseMask: { cx: 715, cy: 485, rx: 600, ry: 380 },
  gridN: 18,
  setGridN: (n) => set({ gridN: n }),
  paintCell: (col, row, target) =>
    set((state) => {
      const key = cellKey(col, row);
      if (state.placeable.has(key) === target) return state;
      const next = new Set(state.placeable);
      if (target) next.add(key);
      else next.delete(key);
      return { placeable: next };
    }),
  setEllipseMask: (patch) =>
    set((state) => ({ ellipseMask: { ...state.ellipseMask, ...patch } })),
  applyEllipseMask: () =>
    set((state) => {
      const grid = fitGridToMask(state.ellipseMask, state.gridN);
      return { grid, placeable: toPlaceableSet(cellsInEllipse(grid, state.ellipseMask)) };
    }),
}));
