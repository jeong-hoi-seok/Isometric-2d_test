import { describe, expect, it } from 'vitest';
import { cellKey, toPairs, toPlaceableSet } from './cell-key';

describe('cellKey', () => {
  it('col,row 문자열 생성', () => {
    expect(cellKey(3, 7)).toBe('3,7');
  });
});

describe('toPlaceableSet / toPairs', () => {
  it('쌍 배열 → Set → 쌍 배열 왕복', () => {
    const pairs: [number, number][] = [
      [1, 2],
      [0, 5],
      [1, 1],
    ];
    const set = toPlaceableSet(pairs);
    expect(set.has('1,2')).toBe(true);
    expect(set.size).toBe(3);
    // toPairs는 col, row 순 정렬
    expect(toPairs(set)).toEqual([
      [0, 5],
      [1, 1],
      [1, 2],
    ]);
  });
});
