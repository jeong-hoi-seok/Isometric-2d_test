import { ASSETS } from '../../../entities/asset';
import { useMapStore } from '../../edit-island-map/model/store';
import { usePlacementStore } from '../model/store';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Checkbox } from '@/shared/ui/checkbox';
import { Input } from '@/shared/ui/input';

export function PlacementPanel() {
  const counts = usePlacementStore((s) => s.counts);
  const failedCount = usePlacementStore((s) => s.failedCount);
  const showGrid = usePlacementStore((s) => s.showGrid);
  const setCount = usePlacementStore((s) => s.setCount);
  const toggleGrid = usePlacementStore((s) => s.toggleGrid);
  const runPlacement = usePlacementStore((s) => s.runPlacement);
  const placeable = useMapStore((s) => s.placeable);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>오브젝트 에셋</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {ASSETS.map((asset) => (
            <label key={asset.id} className="flex items-center justify-between gap-2 text-sm">
              <span>{asset.label}</span>
              <Input
                type="number"
                min={0}
                max={50}
                value={counts[asset.id] ?? 0}
                onChange={(e) => setCount(asset.id, Number(e.target.value))}
                className="w-20"
              />
            </label>
          ))}
        </CardContent>
      </Card>

      <Button onClick={() => runPlacement(placeable)}>배치</Button>
      {failedCount > 0 && (
        <p className="text-sm text-destructive">{failedCount}개 배치 실패</p>
      )}
      {placeable.size === 0 && (
        <p className="text-sm text-muted-foreground">
          배치 가능 칸이 없습니다. 그리드 탭에서 칸을 마킹하세요.
        </p>
      )}

      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={showGrid} onCheckedChange={() => toggleGrid()} />
        디버그 그리드
      </label>
    </div>
  );
}
