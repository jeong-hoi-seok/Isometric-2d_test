import rawMap from './model/island-map.json';
import type { IslandMapData } from './model/types';

export { cellKey, toPairs, toPlaceableSet } from './model/cell-key';
export type { IslandMapData } from './model/types';

export const defaultIslandMap = rawMap as IslandMapData;
