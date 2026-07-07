import { describe, expect, it } from 'vitest';
import { cellDiamond, gridToScreen, isInside, screenToGrid, tileHeight } from './grid';

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
