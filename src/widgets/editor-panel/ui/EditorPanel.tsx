import type { GridParams } from '../../../shared/lib/iso/grid';

interface Props {
  grid: GridParams;
  onGridChange: (patch: Partial<GridParams>) => void;
  onExport: () => void;
  cellCount: number;
}

const SLIDERS: { key: keyof GridParams; min: number; max: number; step: number }[] = [
  { key: 'originX', min: 0, max: 2000, step: 1 },
  { key: 'originY', min: 0, max: 1500, step: 1 },
  { key: 'tileW', min: 20, max: 300, step: 2 },
  { key: 'cols', min: 4, max: 40, step: 1 },
  { key: 'rows', min: 4, max: 40, step: 1 },
];

export function EditorPanel({ grid, onGridChange, onExport, cellCount }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12, maxWidth: 480 }}>
      {SLIDERS.map(({ key, min, max, step }) => (
        <label key={key} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ width: 72 }}>{key}</span>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={grid[key]}
            onChange={(e) => onGridChange({ [key]: Number(e.target.value) })}
            style={{ flex: 1 }}
          />
          <span style={{ width: 48, textAlign: 'right' }}>{grid[key]}</span>
        </label>
      ))}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button onClick={onExport}>JSON 내보내기 (클립보드)</button>
        <span>마킹된 칸: {cellCount}</span>
      </div>
    </div>
  );
}
