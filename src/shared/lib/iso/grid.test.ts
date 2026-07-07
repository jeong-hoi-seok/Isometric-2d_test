import { describe, expect, it } from 'vitest';
import { cellDiamond, cellsInEllipse, fitGridToMask, gridToScreen, isInside, screenToGrid, tileHeight } from './grid';

const p = { originX: 100, originY: 50, tileW: 64, cols: 10, rows: 8 };

describe('tileHeight', () => {
  it('tileW의 절반', () => {
    expect(tileHeight(p)).toBe(32);
  });
});

describe('gridToScreen', () => {
  it('(0,0)은 origin 그대로', () => {
    expect(gridToScreen(p, 0, 0)).toEqual({ x: 100, y: 50 });
  });
  it('col 증가는 오른쪽 아래로 반 타일', () => {
    expect(gridToScreen(p, 1, 0)).toEqual({ x: 132, y: 66 });
  });
  it('row 증가는 왼쪽 아래로 반 타일', () => {
    expect(gridToScreen(p, 0, 1)).toEqual({ x: 68, y: 66 });
  });
});

describe('screenToGrid', () => {
  it('칸 중심점을 해당 칸으로 되돌림', () => {
    // (2,3) 칸 중심 = 위 꼭짓점 + (0, tileH/2)
    const top = gridToScreen(p, 2, 3);
    expect(screenToGrid(p, top.x, top.y + 16)).toEqual({ col: 2, row: 3 });
  });
  it('마름모 왼쪽 절반 클릭도 같은 칸', () => {
    const top = gridToScreen(p, 4, 1);
    expect(screenToGrid(p, top.x - 10, top.y + 16)).toEqual({ col: 4, row: 1 });
  });
});

describe('isInside', () => {
  it('범위 안 true', () => {
    expect(isInside(p, 0, 0)).toBe(true);
    expect(isInside(p, 9, 7)).toBe(true);
  });
  it('범위 밖 false', () => {
    expect(isInside(p, -1, 0)).toBe(false);
    expect(isInside(p, 10, 0)).toBe(false);
    expect(isInside(p, 0, 8)).toBe(false);
  });
});

describe('cellDiamond', () => {
  it('위·오른쪽·아래·왼쪽 꼭짓점 순서', () => {
    expect(cellDiamond(p, 0, 0)).toEqual([
      { x: 100, y: 50 },
      { x: 132, y: 66 },
      { x: 100, y: 82 },
      { x: 68, y: 66 },
    ]);
  });
});

describe('cellsInEllipse', () => {
  const small = { originX: 100, originY: 50, tileW: 64, cols: 4, rows: 4 };

  it('칸 중심 하나만 덮는 작은 타원', () => {
    // (1,1) 칸 중심 = (100, 98)
    expect(cellsInEllipse(small, { cx: 100, cy: 98, rx: 10, ry: 10 })).toEqual([[1, 1]]);
  });

  it('거대 타원은 전 칸 포함', () => {
    expect(cellsInEllipse(small, { cx: 100, cy: 100, rx: 10000, ry: 10000 })).toHaveLength(16);
  });

  it('멀리 있는 타원은 빈 배열', () => {
    expect(cellsInEllipse(small, { cx: -5000, cy: -5000, rx: 10, ry: 10 })).toEqual([]);
  });

  it('경계값 포함(<=1)', () => {
    // (2,2) 칸 중심 = (100, 130). cy 98에서 dy=32 → ry 32면 정확히 경계
    const cells = cellsInEllipse(small, { cx: 100, cy: 98, rx: 5, ry: 32 });
    expect(cells).toContainEqual([2, 2]);
  });
});

describe('fitGridToMask', () => {
  it('가로 반지름이 지배하면 tileW = 2rx/n', () => {
    // rx 700, ry 300, n 20 → max(70, 60) = 70
    expect(fitGridToMask({ cx: 800, cy: 500, rx: 700, ry: 300 }, 20)).toEqual({
      originX: 800,
      originY: 500 - (20 * 70) / 4,
      tileW: 70,
      cols: 20,
      rows: 20,
    });
  });

  it('세로 반지름이 지배하면 tileW = 4ry/n', () => {
    // rx 700, ry 430, n 20 → max(70, 86) = 86
    const grid = fitGridToMask({ cx: 825, cy: 550, rx: 700, ry: 430 }, 20);
    expect(grid.tileW).toBe(86);
    expect(grid.originY).toBe(550 - (20 * 86) / 4); // 120
  });

  it('마름모가 타원을 포함한다 (반폭·반높이 >= 반지름)', () => {
    const mask = { cx: 0, cy: 0, rx: 333, ry: 217 };
    const grid = fitGridToMask(mask, 13);
    expect((grid.cols * grid.tileW) / 2).toBeGreaterThanOrEqual(mask.rx);
    expect((grid.rows * grid.tileW) / 4).toBeGreaterThanOrEqual(mask.ry);
  });
});
