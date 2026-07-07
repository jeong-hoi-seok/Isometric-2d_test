import { describe, expect, it } from 'vitest';
import { toPlaceableSet } from '../../../entities/island-map';
import { serializeIslandMap } from './serialize';

describe('serializeIslandMap', () => {
  it('island-map.json 스키마로 직렬화, placeable 정렬', () => {
    const grid = { originX: 820, originY: 200, tileW: 100, cols: 12, rows: 12 };
    const json = serializeIslandMap(grid, toPlaceableSet([[5, 1], [2, 3]]));
    expect(JSON.parse(json)).toEqual({
      grid,
      placeable: [
        [2, 3],
        [5, 1],
      ],
    });
  });
});
