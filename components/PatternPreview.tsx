'use client';
import { useEffect, useRef, useState } from 'react';
import type { BeadPattern, CompiledBeadColor } from '@/lib/types/bead';

interface Props {
  pattern: BeadPattern | null;
  palette: CompiledBeadColor[];
  onCellClick?: (row: number, col: number) => void;
}

export default function PatternPreview({ pattern, palette, onCellClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!pattern || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const { width, height } = pattern.metadata;
    const cellSize = 20;
    canvas.width = width * cellSize;
    canvas.height = height * cellSize;
    const ctx = canvas.getContext('2d')!;
    const colorMap = new Map(palette.map(c => [c.id, c]));

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const cell = pattern.cells[y][x];
        const color = colorMap.get(cell.colorId);
        ctx.fillStyle = color?.hex ?? '#FF00FF';
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        ctx.strokeStyle = 'rgba(0,0,0,0.12)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }, [pattern, palette]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!pattern || !onCellClick || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cellSize = 20 * zoom;
    const col = Math.floor((e.clientX - rect.left) / cellSize);
    const row = Math.floor((e.clientY - rect.top) / cellSize);
    if (row >= 0 && row < pattern.metadata.height && col >= 0 && col < pattern.metadata.width) {
      onCellClick(row, col);
    }
  };

  if (!pattern) return <div className="text-center text-gray-400 py-20">上传图片后生成图纸预览</div>;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="px-2 py-1 border rounded text-sm">-</button>
        <span className="text-sm text-gray-500">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(z => Math.min(4, z + 0.25))} className="px-2 py-1 border rounded text-sm">+</button>
      </div>
      <div className="overflow-auto border rounded-lg bg-white" style={{ maxHeight: '70vh' }}>
        <canvas
          ref={canvasRef}
          onClick={handleClick}
          className="cursor-crosshair"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
        />
      </div>
    </div>
  );
}
