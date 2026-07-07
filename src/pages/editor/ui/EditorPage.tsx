import { useEffect, useRef, useState } from 'react';
import { ASSETS } from '../../../entities/asset';
import { cellKey, defaultIslandMap, toPlaceableSet } from '../../../entities/island-map';
import { serializeIslandMap } from '../../../features/edit-island-map/model/serialize';
import { loadImage } from '../../../shared/lib/load-image';
import type { GridParams } from '../../../shared/lib/iso/grid';
import { EditorPanel } from '../../../widgets/editor-panel/ui/EditorPanel';
import { IslandCanvas } from '../../../widgets/island-canvas/ui/IslandCanvas';

export function EditorPage() {
  const [islandImg, setIslandImg] = useState<HTMLImageElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [grid, setGrid] = useState<GridParams>(defaultIslandMap.grid);
  const [placeable, setPlaceable] = useState<Set<string>>(() =>
    toPlaceableSet(defaultIslandMap.placeable),
  );
  const [copied, setCopied] = useState(false);
  // 드래그 페인트: pointerdown 첫 칸의 반전값을 목표값으로 고정
  const paintValueRef = useRef<boolean | null>(null);

  useEffect(() => {
    loadImage('/assets/island.png')
      .then(setIslandImg)
      .catch((e: Error) => setError(e.message));
  }, []);

  function handleCellPaint(col: number, row: number) {
    const key = cellKey(col, row);
    setPlaceable((prev) => {
      if (paintValueRef.current === null) paintValueRef.current = !prev.has(key);
      const target = paintValueRef.current;
      if (prev.has(key) === target) return prev;
      const next = new Set(prev);
      if (target) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  async function handleExport() {
    await navigator.clipboard.writeText(serializeIslandMap(grid, placeable));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (error) return <p>{error}</p>;
  if (!islandImg) return <p>이미지 로딩 중…</p>;

  return (
    <main onPointerUp={() => (paintValueRef.current = null)}>
      <h1>맵 에디터</h1>
      <p>
        슬라이더로 그리드를 섬 상판에 정렬하고, 칸을 클릭/드래그해 배치 가능 영역을 마킹한 뒤
        JSON을 <code>src/entities/island-map/model/island-map.json</code>에 붙여넣는다.{' '}
        <a href="/">뷰어로</a>
      </p>
      <EditorPanel
        grid={grid}
        onGridChange={(patch) => setGrid((prev) => ({ ...prev, ...patch }))}
        onExport={handleExport}
        cellCount={placeable.size}
      />
      {copied && <p style={{ color: '#16a34a' }}>클립보드에 복사됨</p>}
      <IslandCanvas
        islandImg={islandImg}
        assetImgs={{}}
        grid={grid}
        placements={[]}
        assets={ASSETS}
        showGrid
        placeableSet={placeable}
        onCellPaint={handleCellPaint}
      />
    </main>
  );
}
