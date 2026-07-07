import { useEffect, useRef, useState } from 'react';
import type { GridParams } from '../../../shared/lib/iso/grid';
import { serializeIslandMap } from '../model/serialize';
import { useMapStore } from '../model/store';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Slider } from '@/shared/ui/slider';

const SLIDERS: { key: keyof GridParams; min: number; max: number; step: number }[] = [
  { key: 'originX', min: 0, max: 2000, step: 1 },
  { key: 'originY', min: 0, max: 1500, step: 1 },
  { key: 'tileW', min: 20, max: 300, step: 2 },
  { key: 'cols', min: 4, max: 40, step: 1 },
  { key: 'rows', min: 4, max: 40, step: 1 },
];

export function GridPanel() {
  const grid = useMapStore((s) => s.grid);
  const placeable = useMapStore((s) => s.placeable);
  const setGridParam = useMapStore((s) => s.setGridParam);
  const [copied, setCopied] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    };
  }, []);

  async function handleExport() {
    try {
      await navigator.clipboard.writeText(serializeIslandMap(grid, placeable));
      setCopied(true);
      copiedTimerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      alert('클립보드 복사에 실패했습니다. 직접 붙여넣기 해주세요.');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>그리드 캘리브레이션</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {SLIDERS.map(({ key, min, max, step }) => (
            <div key={key} className="flex flex-col gap-1">
              <div className="flex justify-between text-sm">
                <span>{key}</span>
                <span className="text-muted-foreground">{grid[key]}</span>
              </div>
              <Slider
                min={min}
                max={max}
                step={step}
                value={[grid[key]]}
                onValueChange={([value]) => setGridParam({ [key]: value })}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">마킹된 칸: {placeable.size}</p>
      <Button onClick={handleExport}>JSON 내보내기 (클립보드)</Button>
      {copied && <p className="text-sm text-emerald-400">클립보드에 복사됨</p>}
      <p className="text-xs text-muted-foreground">
        캔버스에서 칸을 클릭/드래그해 배치 가능 영역을 마킹합니다. 저장하려면 JSON을
        src/entities/island-map/model/island-map.json에 붙여넣으세요.
      </p>
    </div>
  );
}
