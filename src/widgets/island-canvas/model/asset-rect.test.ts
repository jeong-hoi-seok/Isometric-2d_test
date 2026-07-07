import { describe, expect, it } from 'vitest';
import { assetDrawRect } from './asset-rect';

const grid = { originX: 100, originY: 50, tileW: 64, cols: 10, rows: 10 };

describe('assetDrawRect', () => {
  it('1x1: 바닥 꼭짓점 중앙 앵커, 폭 = tileW', () => {
    // (2,3) 칸: 위 꼭짓점 (68,130) → 바닥 꼭짓점 (68,162)
    const rect = assetDrawRect(
      grid,
      { assetId: 'tree', col: 2, row: 3, footprint: { w: 1, h: 1 } },
      1,
      100,
      200,
    );
    expect(rect.width).toBe(64);
    expect(rect.height).toBe(128); // 64 * (200/100)
    expect(rect.x).toBe(68 - 32); // 바닥 x - 폭/2
    expect(rect.y).toBe(162 - 128); // 바닥 y - 높이
  });

  it('2x2: 폭 = 2 tileW, 바닥은 마지막 칸의 바닥 꼭짓점', () => {
    // footprint (0,0)~(1,1), 마지막 칸 (1,1): 위 꼭짓점 (100,82) → 바닥 (100,114)
    const rect = assetDrawRect(
      grid,
      { assetId: 'home', col: 0, row: 0, footprint: { w: 2, h: 2 } },
      1,
      100,
      100,
    );
    expect(rect.width).toBe(128);
    expect(rect.height).toBe(128);
    expect(rect.x).toBe(100 - 64);
    expect(rect.y).toBe(114 - 128);
  });

  it('scale 0.5는 폭 절반', () => {
    const rect = assetDrawRect(
      grid,
      { assetId: 'character', col: 0, row: 0, footprint: { w: 1, h: 1 } },
      0.5,
      100,
      100,
    );
    expect(rect.width).toBe(32);
  });
});
