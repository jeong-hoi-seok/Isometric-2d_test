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

export interface EllipseMask {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

/** 타원 마스크를 꽉 채우는 n×n 그리드 유도 */
export function fitGridToMask(mask: EllipseMask, n: number): GridParams {
  // 마름모 |x|/a + |y|/b <= 1 (a = n·tileW/2, b = n·tileW/4)가 타원을 포함하려면
  // 접선 조건 √((rx/a)² + (ry/b)²) <= 1 이 필요 — 극점만 맞추면 대각선이 밖으로 샌다.
  const tileW = (2 * Math.sqrt(mask.rx ** 2 + 4 * mask.ry ** 2)) / n;
  return {
    originX: mask.cx,
    originY: mask.cy - (n * tileW) / 4,
    tileW,
    cols: n,
    rows: n,
  };
}

/** 칸 중심이 타원 내부(경계 포함)인 칸 목록 */
export function cellsInEllipse(p: GridParams, mask: EllipseMask): [number, number][] {
  const th = tileHeight(p);
  const cells: [number, number][] = [];
  for (let col = 0; col < p.cols; col++) {
    for (let row = 0; row < p.rows; row++) {
      const top = gridToScreen(p, col, row);
      const dx = (top.x - mask.cx) / mask.rx;
      const dy = (top.y + th / 2 - mask.cy) / mask.ry;
      if (dx * dx + dy * dy <= 1) cells.push([col, row]);
    }
  }
  return cells;
}
