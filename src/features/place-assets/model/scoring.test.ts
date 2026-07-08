import { describe, expect, it } from 'vitest';
import type { EllipseMask, GridParams } from '../../../shared/lib/iso/grid';
import {
  blockCenter,
  minDistOk,
  normalizedRadius,
  roulette,
  splitGroups,
  zoneScore,
} from './scoring';

const grid: GridParams = { originX: 0, originY: 0, tileW: 64, cols: 10, rows: 10 };

/** 고정 수열을 순환 반환하는 결정적 RNG */
function seqRandom(values: number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

describe('blockCenter', () => {
  it('1x1 footprint → gridToScreen(col, row) + (0, tileH/2)', () => {
    // gridToScreen(3,2) = {x: (3-2)*32 = 32... } — tileW=64: x=(3-2)*64/2=32? 아니 (col-row)*tileW/2 = 32
    // 계산: x = 0 + ((3-2)*64)/2 = 32, y = 0 + ((3+2)*32)/2 = 80 → +tileH/2=16 → 96
    const pt = blockCenter(grid, 3, 2, { w: 1, h: 1 });
    expect(pt.x).toBeCloseTo(32);
    expect(pt.y).toBeCloseTo(96);
  });

  it('2x2 footprint → (0.5,0.5) 오프셋 블록 중심', () => {
    // col+0.5=3.5, row+0.5=2.5 → x=((3.5-2.5)*64)/2=32, y=((3.5+2.5)*32)/2=96 → +16=112
    const pt = blockCenter(grid, 3, 2, { w: 2, h: 2 });
    expect(pt.x).toBeCloseTo(32);
    expect(pt.y).toBeCloseTo(112);
  });
});

describe('normalizedRadius', () => {
  const mask: EllipseMask = { cx: 0, cy: 0, rx: 100, ry: 50 };

  it('중심점 → 0', () => {
    expect(normalizedRadius({ cx: 10, cy: 20, rx: 100, ry: 50 }, { x: 10, y: 20 })).toBeCloseTo(0);
  });

  it('가장자리 → 1', () => {
    expect(normalizedRadius(mask, { x: 100, y: 0 })).toBeCloseTo(1);
    expect(normalizedRadius(mask, { x: 0, y: 50 })).toBeCloseTo(1);
  });

  it('바깥 → 1 초과', () => {
    expect(normalizedRadius(mask, { x: 200, y: 0 })).toBeCloseTo(2);
  });
});

describe('zoneScore', () => {
  it('zone 없으면 항상 1', () => {
    expect(zoneScore(0)).toBe(1);
    expect(zoneScore(0.5)).toBe(1);
    expect(zoneScore(1.5)).toBe(1);
  });

  it('구간 내(경계 포함) → 1', () => {
    const zone = { min: 0.3, max: 0.8 };
    expect(zoneScore(0.3, zone)).toBe(1);
    expect(zoneScore(0.55, zone)).toBe(1);
    expect(zoneScore(0.8, zone)).toBe(1);
  });

  it('구간 아래 → exp(-(d/0.15)^2) 감쇠 (d = min까지 거리)', () => {
    const zone = { min: 0.3, max: 0.8 };
    const expected = Math.exp(-((0.3 / 0.15) ** 2)); // r=0 → d=0.3
    expect(zoneScore(0, zone)).toBeCloseTo(expected, 6);
  });

  it('구간 위 → exp(-(d/0.15)^2) 감쇠 (d = max까지 거리)', () => {
    const zone = { min: 0.3, max: 0.8 };
    const expected = Math.exp(-((0.2 / 0.15) ** 2)); // r=1.0 → d=0.2
    expect(zoneScore(1.0, zone)).toBeCloseTo(expected, 6);
  });

  it('경계에서 멀수록 점수 감소 (단조 감쇠)', () => {
    const zone = { min: 0.3, max: 0.8 };
    expect(zoneScore(0.9, zone)).toBeGreaterThan(zoneScore(1.0, zone));
    expect(zoneScore(0.2, zone)).toBeGreaterThan(zoneScore(0.1, zone));
  });
});

describe('minDistOk', () => {
  it('minDist 없으면 항상 true', () => {
    expect(minDistOk({ col: 0, row: 0 }, [{ col: 0, row: 0 }])).toBe(true);
  });

  it('빈 placed → 항상 true', () => {
    expect(minDistOk({ col: 0, row: 0 }, [], 99)).toBe(true);
  });

  it('체비셰프 거리 >= minDist → true (경계 포함)', () => {
    // max(|4|,|4|) = 4 >= 4
    expect(minDistOk({ col: 4, row: 4 }, [{ col: 0, row: 0 }], 4)).toBe(true);
  });

  it('체비셰프 거리 < minDist → false', () => {
    // max(|3|,|3|) = 3 < 4
    expect(minDistOk({ col: 5, row: 5 }, [{ col: 2, row: 2 }], 4)).toBe(false);
  });

  it('여러 앵커 중 하나라도 가까우면 false', () => {
    const placed = [
      { col: 10, row: 10 },
      { col: 1, row: 0 },
    ];
    expect(minDistOk({ col: 0, row: 0 }, placed, 4)).toBe(false);
  });
});

describe('roulette', () => {
  it('균등 점수 [1,1] rng=0 → 첫 번째 인덱스', () => {
    expect(roulette([1, 1], seqRandom([0]))).toBe(0);
  });

  it('균등 점수 [1,1] rng=0.5 → 두 번째 인덱스 (pick=1.0, 누적 1<=1.0)', () => {
    expect(roulette([1, 1], seqRandom([0.5]))).toBe(1);
  });

  it('가중 점수 [3,1] rng=0.25 → pick=1.0 → 인덱스 0 (누적 3>1)', () => {
    expect(roulette([3, 1], seqRandom([0.25]))).toBe(0);
  });

  it('가중 점수 [3,1] rng=0.9 → pick=3.6 → 인덱스 1', () => {
    expect(roulette([3, 1], seqRandom([0.9]))).toBe(1);
  });

  it('총점 0 → 균등 폴백 rng=0 → 인덱스 0', () => {
    expect(roulette([0, 0, 0], seqRandom([0]))).toBe(0);
  });

  it('총점 0 → 균등 폴백 rng=0.999 → 마지막 인덱스', () => {
    expect(roulette([0, 0, 0], seqRandom([0.999]))).toBe(2);
  });
});

describe('splitGroups', () => {
  it('count=5, [2,4], rng=0 → [2,2,1] (마지막은 잔여)', () => {
    expect(splitGroups(5, 2, 4, seqRandom([0]))).toEqual([2, 2, 1]);
  });

  it('count=6, [2,4], rng=0.999 → [4,2] (잔여 2 <= max라 그대로)', () => {
    expect(splitGroups(6, 2, 4, seqRandom([0.999]))).toEqual([4, 2]);
  });

  it('count=1 → [1] (마지막 그룹 ≥1 보장)', () => {
    expect(splitGroups(1, 2, 4, seqRandom([0]))).toEqual([1]);
  });

  it('count=3, [2,4] → [3] (count <= max면 그룹 하나)', () => {
    expect(splitGroups(3, 2, 4, seqRandom([0.5]))).toEqual([3]);
  });

  it('그룹 합계 = count, 마지막 제외 모든 그룹 크기가 [min,max] 내', () => {
    const groups = splitGroups(20, 2, 5, seqRandom([0.1, 0.7, 0.3, 0.9]));
    expect(groups.reduce((s, g) => s + g, 0)).toBe(20);
    for (const g of groups.slice(0, -1)) {
      expect(g).toBeGreaterThanOrEqual(2);
      expect(g).toBeLessThanOrEqual(5);
    }
    expect(groups.at(-1)).toBeGreaterThanOrEqual(1);
  });
});
