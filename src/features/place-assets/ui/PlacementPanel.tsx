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
  const aiStatus = usePlacementStore((s) => s.aiStatus);
  const aiEnabled = usePlacementStore((s) => s.aiEnabled);
  const setCount = usePlacementStore((s) => s.setCount);
  const toggleAi = usePlacementStore((s) => s.toggleAi);
  const runAiPlacement = usePlacementStore((s) => s.runAiPlacement);
  const placeable = useMapStore((s) => s.placeable);
  const grid = useMapStore((s) => s.grid);
  const ellipseMask = useMapStore((s) => s.ellipseMask);

  const isLoading = aiStatus === 'loading';

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

      <Button
        disabled={isLoading}
        onClick={() => void runAiPlacement(placeable, grid, ellipseMask)}
      >
        {isLoading ? '배치 중…' : '배치'}
      </Button>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={aiEnabled} onCheckedChange={() => toggleAi()} />
        AI 배치 보정
      </label>
      {aiStatus === 'fallback' && (
        <p className="text-sm text-muted-foreground">AI 응답 실패 — 기본 배치 사용</p>
      )}
      {failedCount > 0 && (
        <p className="text-sm text-destructive">{failedCount}개 배치 실패</p>
      )}
      {placeable.size === 0 && (
        <p className="text-sm text-muted-foreground">
          배치 가능 칸이 없습니다. 그리드 탭에서 칸을 마킹하세요.
        </p>
      )}

    </div>
  );
}
