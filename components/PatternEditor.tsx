'use client';
import { useState } from 'react';
import type { BeadPattern, CompiledBeadColor, PatchOp } from '@/lib/types/bead';
import { HistoryManager } from '@/lib/utils/history';

interface Props {
  pattern: BeadPattern;
  palette: CompiledBeadColor[];
  history: HistoryManager;
  selectedColorId: string | null;
  onPatternChange: (p: BeadPattern) => void;
}

export default function PatternEditor({ pattern, palette, history, selectedColorId, onPatternChange }: Props) {
  const [replaceFrom, setReplaceFrom] = useState<string>('');
  const [replaceTo, setReplaceTo] = useState<string>('');

  // 收集图纸中实际使用的颜色
  const usedIds = new Set<string>();
  for (const row of pattern.cells) for (const c of row) usedIds.add(c.colorId);
  const usedColors = palette.filter(c => usedIds.has(c.id));

  const handleUndo = () => {
    const np = { ...pattern, cells: pattern.cells.map(r => [...r]) };
    history.undo(np);
    onPatternChange(np);
  };

  const handleRedo = () => {
    const np = { ...pattern, cells: pattern.cells.map(r => [...r]) };
    history.redo(np);
    onPatternChange(np);
  };

  const handleBatchReplace = () => {
    if (!replaceFrom || !replaceTo || replaceFrom === replaceTo) return;
    const ops: PatchOp[] = [];
    const np = { ...pattern, cells: pattern.cells.map(r => [...r]) };
    for (let y = 0; y < np.metadata.height; y++) {
      for (let x = 0; x < np.metadata.width; x++) {
        if (np.cells[y][x].colorId === replaceFrom) {
          ops.push({ type: 'set', row: y, col: x, oldColorId: replaceFrom, newColorId: replaceTo });
          np.cells[y][x] = { colorId: replaceTo };
        }
      }
    }
    if (ops.length) {
      history.push(ops);
      onPatternChange(np);
    }
  };

  const btn = 'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-30';

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={handleUndo} disabled={!history.canUndo}
          className={`${btn} bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700`}>
          ↩ 撤销
        </button>
        <button onClick={handleRedo} disabled={!history.canRedo}
          className={`${btn} bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700`}>
          ↪ 重做
        </button>
        <span className="text-xs text-gray-400 dark:text-gray-500">选择颜色后点击图纸编辑</span>
      </div>

      {/* 批量替换 */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">批量替换颜色</p>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={replaceFrom} onChange={e => setReplaceFrom(e.target.value)}
            className="border rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 min-w-0 flex-1">
            <option value="">替换源...</option>
            {usedColors.map(c => (
              <option key={c.id} value={c.id}>{c.code} {c.name}</option>
            ))}
          </select>
          <span className="text-gray-400">→</span>
          <select value={replaceTo} onChange={e => setReplaceTo(e.target.value)}
            className="border rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 min-w-0 flex-1">
            <option value="">目标色...</option>
            {palette.map(c => (
              <option key={c.id} value={c.id}>{c.code} {c.name}</option>
            ))}
          </select>
          <button onClick={handleBatchReplace}
            disabled={!replaceFrom || !replaceTo || replaceFrom === replaceTo}
            className={`${btn} bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-700`}>
            替换全部
          </button>
        </div>
      </div>
    </div>
  );
}
