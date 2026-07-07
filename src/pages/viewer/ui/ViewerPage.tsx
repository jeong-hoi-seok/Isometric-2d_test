import { useEffect, useMemo, useState } from 'react';
import { ASSETS } from '../../../entities/asset';
import { defaultIslandMap, toPlaceableSet } from '../../../entities/island-map';
import { placeAssets, type Placement } from '../../../features/place-assets/model/placement';
import { PlacementControls } from '../../../features/place-assets/ui/PlacementControls';
import { loadImage } from '../../../shared/lib/load-image';
import { IslandCanvas } from '../../../widgets/island-canvas/ui/IslandCanvas';

interface LoadedImages {
  island: HTMLImageElement;
  byAssetId: Record<string, HTMLImageElement>;
}

export function ViewerPage() {
  const [images, setImages] = useState<LoadedImages | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(ASSETS.map((a) => [a.id, a.defaultCount])),
  );
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [failedCount, setFailedCount] = useState(0);
  const [showGrid, setShowGrid] = useState(false);

  const placeableSet = useMemo(() => toPlaceableSet(defaultIslandMap.placeable), []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      loadImage('/assets/island.png'),
      ...ASSETS.map((a) => loadImage(a.src)),
    ])
      .then(([island, ...assetImages]) => {
        if (cancelled) return;
        setImages({
          island,
          byAssetId: Object.fromEntries(ASSETS.map((a, i) => [a.id, assetImages[i]])),
        });
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handlePlace() {
    const requests = ASSETS.map((asset) => ({ asset, count: counts[asset.id] ?? 0 }));
    const result = placeAssets(placeableSet, requests);
    setPlacements(result.placements);
    setFailedCount(result.failedCount);
  }

  if (error) return <p>{error}</p>;
  if (!images) return <p>이미지 로딩 중…</p>;

  return (
    <main>
      <h1>아이소메트릭 섬 랜덤 배치</h1>
      {placeableSet.size === 0 && (
        <p>
          배치 가능 칸이 없습니다. <a href="?editor">에디터</a>에서 칸을 마킹한 뒤
          island-map.json을 갱신하세요.
        </p>
      )}
      <PlacementControls
        assets={ASSETS}
        counts={counts}
        onCountChange={(id, count) => setCounts((prev) => ({ ...prev, [id]: count }))}
        onPlace={handlePlace}
        failedCount={failedCount}
      />
      <label style={{ display: 'block', marginBottom: 12 }}>
        <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
        디버그 그리드
      </label>
      <IslandCanvas
        islandImg={images.island}
        assetImgs={images.byAssetId}
        grid={defaultIslandMap.grid}
        placements={placements}
        assets={ASSETS}
        showGrid={showGrid}
      />
    </main>
  );
}
