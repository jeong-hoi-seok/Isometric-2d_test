export interface GridParams {
  originX: number;
  originY: number;
  tileW: number;
  cols: number;
  rows: number;
}

export interface Point {
  x: number;
  y: number;
}

export function tileHeight(p: GridParams): number {
  return p.tileW / 2;
}

export function gridToScreen(p: GridParams, col: number, row: number): Point {
  const th = tileHeight(p);
  return {
    x: p.originX + ((col - row) * p.tileW) / 2,
    y: p.originY + ((col + row) * th) / 2,
  };
}

export function screenToGrid(p: GridParams, x: number, y: number): { col: number; row: number } {
  const th = tileHeight(p);
  const u = (x - p.originX) / (p.tileW / 2);
  const v = (y - p.originY) / (th / 2);
  return {
    col: Math.floor((u + v) / 2),
    row: Math.floor((v - u) / 2),
  };
}

export function isInside(p: GridParams, col: number, row: number): boolean {
  return col >= 0 && row >= 0 && col < p.cols && row < p.rows;
}

export function cellDiamond(p: GridParams, col: number, row: number): [Point, Point, Point, Point] {
  const top = gridToScreen(p, col, row);
  const th = tileHeight(p);
  return [
    top,
    { x: top.x + p.tileW / 2, y: top.y + th / 2 },
    { x: top.x, y: top.y + th },
    { x: top.x - p.tileW / 2, y: top.y + th / 2 },
  ];
}
