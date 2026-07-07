import { toPairs } from '../../../entities/island-map';
import type { GridParams } from '../../../shared/lib/iso/grid';

export function serializeIslandMap(grid: GridParams, placeable: Set<string>): string {
  return JSON.stringify({ grid, placeable: toPairs(placeable) }, null, 2);
}
