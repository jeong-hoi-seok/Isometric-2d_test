export interface AssetDef {
  id: string;
  /** UI 표시용 한글 이름 */
  label: string;
  src: string;
  footprint: { w: number; h: number };
  defaultCount: number;
  /** footprint 폭 대비 그림 폭 배율 (1 = 칸 폭에 딱 맞춤) */
  scale: number;
}

export const ASSETS: AssetDef[] = [
  { id: 'home', label: '집', src: '/assets/home.png', footprint: { w: 2, h: 2 }, defaultCount: 1, scale: 1 },
  { id: 'home2', label: '집2', src: '/assets/home2.png', footprint: { w: 2, h: 2 }, defaultCount: 1, scale: 1 },
  { id: 'fountain', label: '분수', src: '/assets/fountain.png', footprint: { w: 2, h: 2 }, defaultCount: 1, scale: 1 },
  { id: 'tree', label: '나무', src: '/assets/tree.png', footprint: { w: 1, h: 1 }, defaultCount: 1, scale: 1 },
  { id: 'tree2', label: '나무2', src: '/assets/tree2.png', footprint: { w: 1, h: 1 }, defaultCount: 1, scale: 1.2 },
  { id: 'character', label: '캐릭터', src: '/assets/character.png', footprint: { w: 1, h: 1 }, defaultCount: 1, scale: 0.8 },
];
