import { create } from 'zustand';
import { ASSETS, CHARACTER } from '../../../entities/asset';
import { defaultIslandMap } from '../../../entities/island-map';
import type { EllipseMask, GridParams } from '../../../shared/lib/iso/grid';
import { characterPlacement, placeAssets, type Placement } from './placement';
import { fetchAiPlacements, repairPlacements } from './ai-place';

/** 레지스트리 전체 에셋의 깊이 메타를 ID 맵으로 구성 */
const ALL_ASSET_DEFS = [...ASSETS, CHARACTER];
const META_BY_ID = Object.fromEntries(
  ALL_ASSET_DEFS.map((a) => [a.id, { zBias: a.zBias, layer: a.layer }]),
);

type AiStatus = 'idle' | 'loading' | 'fallback';

interface PlacementState {
  counts: Record<string, number>;
  placements: Placement[];
  failedCount: number;
  showGrid: boolean;
  aiStatus: AiStatus;
  /** AI 배치 사용 여부 — 끄면 항상 로컬 룰렛 */
  aiEnabled: boolean;
  setCount: (id: string, count: number) => void;
  toggleGrid: () => void;
  toggleAi: () => void;
  runPlacement: (
    placeable: Set<string>,
    grid: GridParams,
    mask: EllipseMask,
    random?: () => number,
  ) => void;
  runAiPlacement: (
    placeable: Set<string>,
    grid: GridParams,
    mask: EllipseMask,
  ) => Promise<void>;
}

export const usePlacementStore = create<PlacementState>((set, get) => ({
  counts: Object.fromEntries(ASSETS.map((a) => [a.id, a.defaultCount])),
  placements: [characterPlacement(defaultIslandMap.grid)],
  failedCount: 0,
  showGrid: false,
  aiStatus: 'idle',
  aiEnabled: true,
  setCount: (id, count) =>
    set((state) => ({ counts: { ...state.counts, [id]: count } })),
  toggleGrid: () => set((state) => ({ showGrid: !state.showGrid })),
  toggleAi: () => set((state) => ({ aiEnabled: !state.aiEnabled })),
  runPlacement: (placeable, grid, mask, random = Math.random) => {
    const requests = ASSETS.map((asset) => ({
      asset,
      count: get().counts[asset.id] ?? 0,
    }));
    const fixed = [characterPlacement(grid)];
    const result = placeAssets(placeable, requests, random, fixed, { grid, mask }, META_BY_ID);
    set({ placements: result.placements, failedCount: result.failedCount });
  },
  runAiPlacement: async (placeable, grid, mask) => {
    if (!get().aiEnabled) {
      get().runPlacement(placeable, grid, mask);
      set({ aiStatus: 'idle' });
      return;
    }
    set({ aiStatus: 'loading' });

    const counts = get().counts;
    const fixed = [characterPlacement(grid)];

    // 씬 요약 빌드
    const placeablePairs: [number, number][] = [...placeable].map(
      (key) => key.split(',').map(Number) as [number, number],
    );
    const assetsForScene = ASSETS.filter((a) => (counts[a.id] ?? 0) > 0).map((a) => ({
      id: a.id,
      count: counts[a.id] ?? 0,
      footprint: a.footprint,
      zone: a.placement?.zone,
    }));
    const scene = {
      grid,
      mask,
      placeable: placeablePairs,
      assets: assetsForScene,
      fixed: fixed.map((f) => ({ col: f.col, row: f.row, footprint: f.footprint })),
    };

    try {
      // 8초 타임아웃
      const controller = new AbortController();
      // reason 서술 생성 때문에 응답이 길어질 수 있어 30초까지 허용
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      let response: Awaited<ReturnType<typeof fetchAiPlacements>>;
      try {
        response = await fetchAiPlacements(scene, controller.signal);
      } finally {
        clearTimeout(timeoutId);
      }
      const rawPlacements = response.placements;

      // 배치 근거 콘솔 노출
      if (response.rationale) console.log('[AI 배치] 컨셉:', response.rationale);
      for (const pl of rawPlacements) {
        if (pl.reason) console.log(`[AI 배치] ${pl.assetId} (${pl.col},${pl.row}):`, pl.reason);
      }

      // requests를 repairPlacements 형식으로 변환
      const requests = ASSETS.map((a) => ({
        assetId: a.id,
        count: counts[a.id] ?? 0,
        footprint: a.footprint,
      }));

      const result = repairPlacements(rawPlacements, {
        placeable,
        grid,
        mask,
        requests,
        fixed,
        metaById: META_BY_ID,
      });

      set({ placements: result.placements, failedCount: result.failedCount, aiStatus: 'idle' });
    } catch {
      // 폴백: 로컬 룰렛 배치
      get().runPlacement(placeable, grid, mask);
      set({ aiStatus: 'fallback' });
    }
  },
}));
