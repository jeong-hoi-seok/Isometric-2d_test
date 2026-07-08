export interface PlacementMeta {
  /** 선호 정규화 반경 구간 (0=타원 중앙, 1=가장자리) */
  zone?: { min: number; max: number };
  /** 군집: 크기 범위·시드 기준 반경(체비셰프 칸 거리) */
  cluster?: { min: number; max: number; radius: number };
  /** 같은 종류 앵커 간 최소 체비셰프 칸 거리 */
  minDistSame?: number;
}

export interface AssetDef {
  id: string;
  /** UI 표시용 한글 이름 */
  label: string;
  src: string;
  footprint: { w: number; h: number };
  defaultCount: number;
  /** footprint 폭 대비 그림 폭 배율 (1 = 칸 폭에 딱 맞춤) */
  scale: number;
  /** 미적 배치 소프트 선호 — 없으면 균등 랜덤과 동일 */
  placement?: PlacementMeta;
  /** 깊이 동률 타이브레이커. 기본 0. 클수록 앞에 그림 */
  zBias?: number;
  /** 렌더 레이어. 기본 'object'. 'ground'는 깊이 무관 항상 object 아래 렌더 */
  layer?: 'ground' | 'object';
}

export const ASSETS: AssetDef[] = [
  {
    id: 'home',
    label: '집',
    src: '/assets/home.png',
    footprint: { w: 4, h: 4 },
    defaultCount: 1,
    scale: 1,
    placement: { zone: { min: 0.45, max: 0.9 }, minDistSame: 4 },
  },
  {
    id: 'tree',
    label: '나무',
    src: '/assets/tree.png',
    footprint: { w: 2, h: 2 },
    defaultCount: 1,
    scale: 1,
    placement: { zone: { min: 0.35, max: 1 }, cluster: { min: 2, max: 4, radius: 2 } },
  },
  {
    id: 'toast',
    label: '토스트',
    src: '/assets/toast.png',
    footprint: { w: 2, h: 2 },
    defaultCount: 1,
    scale: 1,
    placement: { zone: { min: 0.35, max: 1 }, cluster: { min: 2, max: 4, radius: 2 } },
  },
  {
    id: 'electric-fan',
    label: '선풍기',
    src: '/assets/electric-fan.png',
    footprint: { w: 2, h: 2 },
    defaultCount: 1,
    scale: 1,
    placement: { zone: { min: 0.35, max: 1 }, cluster: { min: 2, max: 4, radius: 2 } },
  },
]

export const CHARACTER: AssetDef = {
  id: 'character',
  label: '캐릭터',
  src: '/assets/character.png',
  footprint: { w: 2, h: 2 },
  defaultCount: 1,
  scale: 1,
};
