export function cellKey(col: number, row: number): string {
  return `${col},${row}`;
}

export function toPlaceableSet(pairs: [number, number][]): Set<string> {
  return new Set(pairs.map(([col, row]) => cellKey(col, row)));
}

export function toPairs(set: Set<string>): [number, number][] {
  return [...set]
    .map((key) => key.split(',').map(Number) as [number, number])
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}
