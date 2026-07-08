import { create } from 'zustand';
import { ASSETS } from '../../../entities/asset';
import { defaultIslandMap } from '../../../entities/island-map';
import type { GridParams } from '../../../shared/lib/iso/grid';
import { characterPlacement, placeAssets, type Placement } from './placement';

interface PlacementState {
  counts: Record<string, number>;
  placements: Placement[];
  failedCount: number;
  showGrid: boolean;
  setCount: (id: string, count: number) => void;
  toggleGrid: () => void;
  runPlacement: (placeable: Set<string>, grid: GridParams, random?: () => number) => void;
}

export const usePlacementStore = create<PlacementState>((set, get) => ({
  counts: Object.fromEntries(ASSETS.map((a) => [a.id, a.defaultCount])),
  placements: [characterPlacement(defaultIslandMap.grid)],
  failedCount: 0,
  showGrid: false,
  setCount: (id, count) =>
    set((state) => ({ counts: { ...state.counts, [id]: count } })),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  runPlacement: (placeable, grid, random = Math.random) => {
    const requests = ASSETS.map((asset) => ({
      asset,
      count: get().counts[asset.id] ?? 0,
    }));
    const fixed = [characterPlacement(grid)];
    const result = placeAssets(placeable, requests, random, fixed);
    set({ placements: result.placements, failedCount: result.failedCount });
  },
}));
