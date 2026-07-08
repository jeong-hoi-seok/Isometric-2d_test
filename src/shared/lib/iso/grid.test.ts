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
  it('tileW = 2·√(rx²+4ry²)/n', () => {
    // rx 300, ry 200 → √(90000+160000) = 500 → tileW = 1000/20 = 50
    expect(fitGridToMask({ cx: 800, cy: 500, rx: 300, ry: 200 }, 20)).toEqual({
      originX: 800,
      originY: 500 - (20 * 50) / 4,
      tileW: 50,
      cols: 20,
      rows: 20,
    });
  });

  it('마름모가 타원 전체를 포함한다 — 대각선 방향 포함', () => {
    const mask = { cx: 0, cy: 0, rx: 700, ry: 430 };
    const grid = fitGridToMask(mask, 20);
    const halfW = (grid.cols * grid.tileW) / 2;
    const halfH = (grid.rows * grid.tileW) / 4;
    // 타원 위 점 (rx·cosθ, ry·sinθ)가 전부 마름모 |x|/a + |y|/b <= 1 안
    for (let deg = 0; deg < 360; deg += 5) {
      const t = (deg * Math.PI) / 180;
      const x = mask.rx * Math.cos(t);
      const y = mask.ry * Math.sin(t);
      expect(Math.abs(x) / halfW + Math.abs(y) / halfH).toBeLessThanOrEqual(1 + 1e-9);
    }
  });

  it('마름모 중심 = 타원 중심', () => {
    const grid = fitGridToMask({ cx: 825, cy: 550, rx: 700, ry: 430 }, 20);
    expect(grid.originX).toBe(825);
    expect(grid.originY + (grid.rows * grid.tileW) / 4).toBeCloseTo(550);
  });
});
