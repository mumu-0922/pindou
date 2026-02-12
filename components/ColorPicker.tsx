'use client';
import type { CompiledBeadColor } from '@/lib/types/bead';

interface Props {
  palette: CompiledBeadColor[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function ColorPicker({ palette, selectedId, onSelect }: Props) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-500">色板选择器</h3>
      <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto p-2 border rounded">
        {palette.map(c => (
          <button
            key={c.id}
            title={`${c.code} - ${c.name}`}
            onClick={() => onSelect(c.id)}
            className={`w-6 h-6 rounded border-2 transition-transform hover:scale-125 ${
              selectedId === c.id ? 'border-blue-500 scale-125 ring-2 ring-blue-300' : 'border-gray-200'
            }`}
            style={{ backgroundColor: c.hex }}
          />
        ))}
      </div>
    </div>
  );
}
