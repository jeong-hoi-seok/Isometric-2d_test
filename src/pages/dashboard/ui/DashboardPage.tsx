import { useEffect, useRef, useState } from 'react';
import { ASSETS } from '../../../entities/asset';
import { cellKey } from '../../../entities/island-map';
import { useMapStore } from '../../../features/edit-island-map/model/store';
import { usePlacementStore } from '../../../features/place-assets/model/store';
import { loadImage } from '../../../shared/lib/load-image';
import { IslandCanvas } from '../../../widgets/island-canvas/ui/IslandCanvas';
import { OptionsAside, type AsideTab } from '../../../widgets/options-aside/ui/OptionsAside';

interface LoadedImages {
  island: HTMLImageElement;
  byAssetId: Record<string, HTMLImageElement>;
}

export function DashboardPage() {
  const [images, setImages] = useState<LoadedImages | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AsideTab>('place');
  const grid = useMapStore((s) => s.grid);
  const placeable = useMapStore((s) => s.placeable);
  const paintCell = useMapStore((s) => s.paintCell);
  const placements = usePlacementStore((s) => s.placements);
  const showGrid = usePlacementStore((s) => s.showGrid);
  const paintTargetRef = useRef<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadImage('/assets/island.png'), ...ASSETS.map((a) => loadImage(a.src))])
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

  useEffect(() => {
    const reset = () => {
      paintTargetRef.current = null;
    };
    window.addEventListener('pointerup', reset);
    return () => window.removeEventListener('pointerup', reset);
  }, []);

  const isGridTab = activeTab === 'grid';

  function handleCellPaint(col: number, row: number) {
    if (paintTargetRef.current === null) {
      paintTargetRef.current = !useMapStore.getState().placeable.has(cellKey(col, row));
    }
    paintCell(col, row, paintTargetRef.current);
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <OptionsAside activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex flex-1 items-center justify-center overflow-hidden p-6">
        {error && <p className="text-destructive">{error}</p>}
        {!error && !images && <p className="text-muted-foreground">이미지 로딩 중…</p>}
        {images && (
          <IslandCanvas
            islandImg={images.island}
            assetImgs={images.byAssetId}
            grid={grid}
            placements={placements}
            assets={ASSETS}
            showGrid={isGridTab || showGrid}
            placeableSet={isGridTab ? placeable : undefined}
            onCellPaint={isGridTab ? handleCellPaint : undefined}
          />
        )}
      </main>
    </div>
  );
}
