import type { GridParams } from '../../../shared/lib/iso/grid';

export interface IslandMapData {
  grid: GridParams;
  placeable: [number, number][];
}
