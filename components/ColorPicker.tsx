'use client';
import { useState } from 'react';
import type { CompiledBeadColor } from '@/lib/types/bead';

interface Props {
  palette: CompiledBeadColor[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function ColorPicker({ palette, selectedId, onSelect }: Props) {
  const [search, setSearch] = useState('');
  const filtered = search
    ? palette.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()))
    : palette;

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">色板选择器</h3>
      <input
        type="text"
        placeholder="搜索颜色名称或编号..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-purple-500"
      />
      <div className="flex flex-wrap gap-1.5 max-h-44 overflow-y-auto p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        {filtered.map(c => (
          <button
            key={c.id}
            title={`${c.code} - ${c.name}`}
            onClick={() => onSelect(c.id)}
            className={`w-7 h-7 rounded-md border-2 transition-all hover:scale-110 ${
              selectedId === c.id ? 'border-purple-500 scale-110 ring-2 ring-purple-300 dark:ring-purple-700' : 'border-gray-200 dark:border-gray-600'
            }`}
            style={{ backgroundColor: c.hex }}
          />
        ))}
        {filtered.length === 0 && <p className="text-xs text-gray-400 py-2">无匹配颜色</p>}
      </div>
    </div>
  );
}
