import { useEffect, useRef, useState } from 'react';
import type { EllipseMask } from '../../../shared/lib/iso/grid';
import { serializeIslandMap } from '../model/serialize';
import { useMapStore } from '../model/store';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Slider } from '@/shared/ui/slider';

const MASK_SLIDERS: { key: keyof EllipseMask; label: string; min: number; max: number; step: number }[] = [
  { key: 'cx', label: '중심X', min: 0, max: 2000, step: 1 },
  { key: 'cy', label: '중심Y', min: 0, max: 1500, step: 1 },
  { key: 'rx', label: '반지름가로', min: 50, max: 1000, step: 5 },
  { key: 'ry', label: '반지름세로', min: 50, max: 800, step: 5 },
];

export function GridPanel() {
  const grid = useMapStore((s) => s.grid);
  const placeable = useMapStore((s) => s.placeable);
  const ellipseMask = useMapStore((s) => s.ellipseMask);
  const gridN = useMapStore((s) => s.gridN);
  const setGridN = useMapStore((s) => s.setGridN);
  const setEllipseMask = useMapStore((s) => s.setEllipseMask);
  const applyEllipseMask = useMapStore((s) => s.applyEllipseMask);
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
          <CardTitle>타원 마스크</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {MASK_SLIDERS.map(({ key, label, min, max, step }) => (
            <div key={key} className="flex flex-col gap-1">
              <div className="flex justify-between text-sm">
                <span>{label}</span>
                <span className="text-muted-foreground">{ellipseMask[key]}</span>
              </div>
              <Slider
                min={min}
                max={max}
                step={step}
                value={[ellipseMask[key]]}
                onValueChange={([value]) => setEllipseMask({ [key]: value })}
              />
            </div>
          ))}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-sm">
              <span>칸수 (n×n)</span>
              <span className="text-muted-foreground">{gridN}</span>
            </div>
            <Slider
              min={8}
              max={40}
              step={1}
              value={[gridN]}
              onValueChange={([value]) => setGridN(value)}
            />
          </div>
          <Button variant="secondary" onClick={applyEllipseMask}>
            타원 적용
          </Button>
        </CardContent>
      </Card>

      <p className="text-sm text-muted-foreground">마킹된 칸: {placeable.size}</p>
      <Button onClick={handleExport}>JSON 내보내기 (클립보드)</Button>
      {copied && <p className="text-sm text-emerald-600">클립보드에 복사됨</p>}
      <p className="text-xs text-muted-foreground">
        캔버스에서 칸을 클릭/드래그해 배치 가능 영역을 마킹합니다. 저장하려면 JSON을
        src/entities/island-map/model/island-map.json에 붙여넣으세요.
      </p>
    </div>
  );
}
