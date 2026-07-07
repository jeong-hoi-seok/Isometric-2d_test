export interface AssetDef {
  id: string;
  src: string;
  footprint: { w: number; h: number };
  defaultCount: number;
  /** footprint 폭 대비 그림 폭 배율 (1 = 칸 폭에 딱 맞춤) */
  scale: number;
}

export const ASSETS: AssetDef[] = [
  { id: 'home', src: '/assets/home.png', footprint: { w: 2, h: 2 }, defaultCount: 2, scale: 1 },
  { id: 'tree', src: '/assets/tree.png', footprint: { w: 1, h: 1 }, defaultCount: 5, scale: 1 },
  { id: 'character', src: '/assets/character.png', footprint: { w: 1, h: 1 }, defaultCount: 3, scale: 0.8 },
];
