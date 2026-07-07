import { create } from 'zustand';
import { ASSETS } from '../../../entities/asset';
import { placeAssets, type Placement } from './placement';

interface PlacementState {
  counts: Record<string, number>;
  placements: Placement[];
  failedCount: number;
  showGrid: boolean;
  setCount: (id: string, count: number) => void;
  toggleGrid: () => void;
  runPlacement: (placeable: Set<string>, random?: () => number) => void;
}

export const usePlacementStore = create<PlacementState>((set, get) => ({
  counts: Object.fromEntries(ASSETS.map((a) => [a.id, a.defaultCount])),
  placements: [],
  failedCount: 0,
  showGrid: false,
  setCount: (id, count) =>
    set((state) => ({ counts: { ...state.counts, [id]: count } })),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  runPlacement: (placeable, random = Math.random) => {
    const requests = ASSETS.map((asset) => ({
      asset,
      count: get().counts[asset.id] ?? 0,
    }));
    const result = placeAssets(placeable, requests, random);
    set({ placements: result.placements, failedCount: result.failedCount });
  },
}));
