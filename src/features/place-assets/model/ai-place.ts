import type { AssetDef } from '../../../entities/asset';
import { ASSETS } from '../../../entities/asset';
import { cellKey } from '../../../entities/island-map';
import type { EllipseMask, GridParams } from '../../../shared/lib/iso/grid';
import { blockCenter, normalizedRadius, zoneScore } from './scoring';
import { placeAssets, type Placement, type PlacementResult } from './placement';

// ---------------------------------------------------------------------------
// AiScene — POST /api/place 요청 body 타입
// ---------------------------------------------------------------------------
export interface AiScene {
  grid: GridParams;
  mask: EllipseMask;
  placeable: [number, number][];
  assets: { id: string; count: number; footprint: { w: number; h: number }; zone?: { min: number; max: number } }[];
  fixed: { col: number; row: number; footprint: { w: number; h: number } }[];
}

// ---------------------------------------------------------------------------
// RepairContext — repairPlacements에 필요한 컨텍스트
// ---------------------------------------------------------------------------
export interface RepairRequest {
  assetId: string;
  count: number;
  footprint: { w: number; h: number };
}

export interface RepairContext {
  placeable: Set<string>;
  grid: GridParams;
  mask: EllipseMask;
  requests: RepairRequest[];
  fixed: Placement[];
}

// ---------------------------------------------------------------------------
// fetchAiPlacements — POST /api/place 호출
// ---------------------------------------------------------------------------
export async function fetchAiPlacements(
  scene: AiScene,
  signal?: AbortSignal,
): Promise<{ assetId: string; col: number; row: number }[]> {
  const res = await fetch('/api/place', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(scene),
    signal,
  });

  if (!res.ok) {
    throw new Error(`/api/place returned ${res.status}`);
  }

  // Vite dev에서 /api가 SPA fallback(HTML 200)으로 오는 경우 감지
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new Error(`/api/place returned non-JSON content-type: ${contentType}`);
  }

  const data = (await res.json()) as { placements: { assetId: string; col: number; row: number }[] };
  return data.placements;
}

// ---------------------------------------------------------------------------
// 내부 유틸 — footprint 전체가 placeable & 비점유인지 검사
// ---------------------------------------------------------------------------
function fits(
  footprint: { w: number; h: number },
  col: number,
  row: number,
  placeable: Set<string>,
  occupied: Set<string>,
): boolean {
  for (let dc = 0; dc < footprint.w; dc++) {
    for (let dr = 0; dr < footprint.h; dr++) {
      const key = cellKey(col + dc, row + dr);
      if (!placeable.has(key) || occupied.has(key)) return false;
    }
  }
  return true;
}

function occupy(pl: { col: number; row: number; footprint: { w: number; h: number } }, occupied: Set<string>): void {
  for (let dc = 0; dc < pl.footprint.w; dc++) {
    for (let dr = 0; dr < pl.footprint.h; dr++) {
      occupied.add(cellKey(pl.col + dc, pl.row + dr));
    }
  }
}

/** 체비셰프 거리 */
function chebyshev(c1: number, r1: number, c2: number, r2: number): number {
  return Math.max(Math.abs(c1 - c2), Math.abs(r1 - r2));
}

// ---------------------------------------------------------------------------
// repairPlacements — 순수 함수 (TDD)
// ---------------------------------------------------------------------------
export function repairPlacements(
  raw: { assetId: string; col: number; row: number }[],
  ctx: RepairContext,
): PlacementResult {
  const { placeable, grid, mask, requests, fixed } = ctx;

  // 점유 집합 초기화 (fixed 칸 선점유)
  const occupied = new Set<string>();
  for (const fp of fixed) {
    occupy(fp, occupied);
  }

  // footprint 맵 — assetId → footprint
  const footprintMap = new Map<string, { w: number; h: number }>();
  for (const r of requests) {
    footprintMap.set(r.assetId, r.footprint);
  }

  // 요청 개수 맵
  const countMap = new Map<string, number>();
  for (const r of requests) {
    countMap.set(r.assetId, r.count);
  }

  // 단계 1: 미지 assetId 폐기
  const knownIds = new Set(requests.map((r) => r.assetId));
  const filtered = raw.filter((item) => knownIds.has(item.assetId));

  // 단계 2: 요청 개수 초과분 폐기 (먼저 나온 것 우선)
  const usedCount = new Map<string, number>();
  const withinCount = filtered.filter((item) => {
    const used = usedCount.get(item.assetId) ?? 0;
    const limit = countMap.get(item.assetId) ?? 0;
    if (used < limit) {
      usedCount.set(item.assetId, used + 1);
      return true;
    }
    return false;
  });

  // 단계 3 & 4: 유효 앵커 채택 + 무효 앵커 스냅
  const accepted: Placement[] = [];

  // placeable 칸 목록 (스냅 후보용)
  const placeableCells = [...placeable].map((key) => key.split(',').map(Number) as [number, number]);

  for (const item of withinCount) {
    const footprint = footprintMap.get(item.assetId)!;

    if (fits(footprint, item.col, item.row, placeable, occupied)) {
      // 유효 — 그대로 채택
      const pl: Placement = { assetId: item.assetId, col: item.col, row: item.row, footprint };
      accepted.push(pl);
      occupy(pl, occupied);
    } else {
      // 무효 — 가장 가까운 유효 앵커로 스냅
      // 후보: placeable 내 유효한 앵커 전수 열거
      const validCandidates = placeableCells.filter(
        ([col, row]) => fits(footprint, col, row, placeable, occupied),
      );

      if (validCandidates.length === 0) {
        // 유효 앵커 없음 — 부족분으로 처리 (나중에 placeAssets가 채움)
        continue;
      }

      // 체비셰프 최소 거리 후보 추출
      let minDist = Infinity;
      for (const [col, row] of validCandidates) {
        const d = chebyshev(col, row, item.col, item.row);
        if (d < minDist) minDist = d;
      }
      const nearest = validCandidates.filter(
        ([col, row]) => chebyshev(col, row, item.col, item.row) === minDist,
      );

      // 동률 시 zone 점수 높은 쪽 선택
      // asset의 zone 정보를 ASSETS에서 조회 (없으면 균등)
      const assetDef = ASSETS.find((a) => a.id === item.assetId);
      const zone = assetDef?.placement?.zone;

      let bestCol = nearest[0][0];
      let bestRow = nearest[0][1];
      let bestScore = -Infinity;
      for (const [col, row] of nearest) {
        const r = normalizedRadius(mask, blockCenter(grid, col, row, footprint));
        const score = zoneScore(r, zone);
        if (score > bestScore) {
          bestScore = score;
          bestCol = col;
          bestRow = row;
        }
      }

      const pl: Placement = { assetId: item.assetId, col: bestCol, row: bestRow, footprint };
      accepted.push(pl);
      occupy(pl, occupied);
    }
  }

  // 단계 5: 부족분 계산 — 채택된 것과 requests의 차이
  const acceptedCount = new Map<string, number>();
  for (const pl of accepted) {
    acceptedCount.set(pl.assetId, (acceptedCount.get(pl.assetId) ?? 0) + 1);
  }

  // 단계 6: 부족분을 placeAssets로 채움
  // accepted를 fixed로 전달 (이미 occupied 상태)
  const allFixed = [...fixed, ...accepted];

  // 부족분 requests 생성 — requests의 footprint 우선 사용 (ASSETS footprint 무시)
  const validShortfall: { asset: AssetDef; count: number }[] = [];
  for (const r of requests) {
    const have = acceptedCount.get(r.assetId) ?? 0;
    const need = r.count - have;
    if (need <= 0) continue;
    // ASSETS에서 메타(placement zone 등)는 가져오되, footprint는 request 기반으로 오버라이드
    const base = ASSETS.find((a) => a.id === r.assetId);
    const assetDef: AssetDef = base
      ? { ...base, footprint: r.footprint }
      : {
          id: r.assetId,
          label: r.assetId,
          src: '',
          footprint: r.footprint,
          defaultCount: 0,
          scale: 1,
        };
    validShortfall.push({ asset: assetDef, count: need });
  }

  const filled = placeAssets(placeable, validShortfall, Math.random, allFixed, { grid, mask });

  // 단계 7: 병합 + 깊이 정렬 (fixed 제외, accepted + filled 결과 조합)
  // filled.placements에는 allFixed도 포함되어 있음
  const merged = filled.placements;

  // 깊이 정렬: col+w+row+h 오름차순
  merged.sort(
    (a, b) =>
      a.col + a.footprint.w + a.row + a.footprint.h -
      (b.col + b.footprint.w + b.row + b.footprint.h),
  );

  return {
    placements: merged,
    failedCount: filled.failedCount,
  };
}
