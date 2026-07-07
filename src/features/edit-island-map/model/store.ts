import { create } from 'zustand';
import { cellKey, defaultIslandMap, toPlaceableSet } from '../../../entities/island-map';
import { cellsInEllipse, type EllipseMask, type GridParams } from '../../../shared/lib/iso/grid';

interface MapState {
  grid: GridParams;
  placeable: Set<string>;
  ellipseMask: EllipseMask;
  setGridParam: (patch: Partial<GridParams>) => void;
  paintCell: (col: number, row: number, target: boolean) => void;
  setEllipseMask: (patch: Partial<EllipseMask>) => void;
  applyEllipseMask: () => void;
}

export const useMapStore = create<MapState>((set) => ({
  grid: defaultIslandMap.grid,
  placeable: toPlaceableSet(defaultIslandMap.placeable),
  ellipseMask: { cx: 825, cy: 550, rx: 700, ry: 430 },
  setGridParam: (patch) => set((state) => ({ grid: { ...state.grid, ...patch } })),
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
    set((state) => ({
      placeable: toPlaceableSet(cellsInEllipse(state.grid, state.ellipseMask)),
    })),
}));
