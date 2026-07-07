import type { AssetDef } from '../../../entities/asset';

interface Props {
  assets: AssetDef[];
  counts: Record<string, number>;
  onCountChange: (id: string, count: number) => void;
  onPlace: () => void;
  failedCount: number;
}

export function PlacementControls({ assets, counts, onCountChange, onPlace, failedCount }: Props) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 12 }}>
      {assets.map((asset) => (
        <label key={asset.id} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {asset.id}
          <input
            type="number"
            min={0}
            max={50}
            value={counts[asset.id] ?? 0}
            onChange={(e) => onCountChange(asset.id, Number(e.target.value))}
            style={{ width: 56 }}
          />
        </label>
      ))}
      <button onClick={onPlace}>배치</button>
      {failedCount > 0 && <span style={{ color: '#dc2626' }}>{failedCount}개 배치 실패</span>}
    </div>
  );
}
