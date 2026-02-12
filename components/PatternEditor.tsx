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
  const handleCellClick = (row: number, col: number) => {
    if (!selectedColorId) return;
    const oldColorId = pattern.cells[row][col].colorId;
    if (oldColorId === selectedColorId) return;

    const op: PatchOp = { type: 'set', row, col, oldColorId, newColorId: selectedColorId };
    history.push([op]);
    const newPattern = { ...pattern, cells: pattern.cells.map(r => [...r]) };
    newPattern.cells[row][col] = { colorId: selectedColorId };
    onPatternChange(newPattern);
  };

  const handleUndo = () => {
    const newPattern = { ...pattern, cells: pattern.cells.map(r => [...r]) };
    history.undo(newPattern);
    onPatternChange(newPattern);
  };

  const handleRedo = () => {
    const newPattern = { ...pattern, cells: pattern.cells.map(r => [...r]) };
    history.redo(newPattern);
    onPatternChange(newPattern);
  };

  return (
    <div className="flex items-center gap-2">
      <button onClick={handleUndo} disabled={!history.canUndo}
        className="px-3 py-1.5 border rounded text-sm disabled:opacity-30 hover:bg-gray-50">
        ↩ 撤销
      </button>
      <button onClick={handleRedo} disabled={!history.canRedo}
        className="px-3 py-1.5 border rounded text-sm disabled:opacity-30 hover:bg-gray-50">
        ↪ 重做
      </button>
      <span className="text-xs text-gray-400">选择颜色后点击图纸编辑</span>
    </div>
  );
}
