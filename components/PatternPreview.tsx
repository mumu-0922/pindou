'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import type { BeadPattern, CompiledBeadColor } from '@/lib/types/bead';
import { useI18n } from '@/lib/i18n/context';

interface Props {
  pattern: BeadPattern | null;
  palette: CompiledBeadColor[];
  onCellClick?: (row: number, col: number) => void;
}

export default function PatternPreview({ pattern, palette, onCellClick }: Props) {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const dragState = useRef<{ dragging: boolean; startX: number; startY: number; scrollX: number; scrollY: number; moved: boolean }>({ dragging: false, startX: 0, startY: 0, scrollX: 0, scrollY: 0, moved: false });

  // Ref callback — wheel zoom + drag pan
  const wheelCleanup = useRef<(() => void) | null>(null);
  const wrapRefCb = useCallback((el: HTMLDivElement | null) => {
    if (wheelCleanup.current) { wheelCleanup.current(); wheelCleanup.current = null; }
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setZoom(z => {
        const step = e.deltaY < 0 ? 0.15 : -0.15;
        return Math.round(Math.max(0.1, Math.min(5, z + step)) * 100) / 100;
      });
    };

    const onMouseDown = (e: MouseEvent) => {
      // left button only
      if (e.button !== 0) return;
      dragState.current = { dragging: true, startX: e.clientX, startY: e.clientY, scrollX: el.scrollLeft, scrollY: el.scrollTop, moved: false };
      el.style.cursor = 'grabbing';
    };

    const onMouseMove = (e: MouseEvent) => {
      const ds = dragState.current;
      if (!ds.dragging) return;
      const dx = e.clientX - ds.startX;
      const dy = e.clientY - ds.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) ds.moved = true;
      el.scrollLeft = ds.scrollX - dx;
      el.scrollTop = ds.scrollY - dy;
    };

    const onMouseUp = () => {
      dragState.current.dragging = false;
      el.style.cursor = '';
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    wheelCleanup.current = () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

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
        if (showGrid) {
          ctx.strokeStyle = 'rgba(0,0,0,0.1)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }
  }, [pattern, palette, showGrid]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Ignore click if user was dragging
    if (dragState.current.moved) { dragState.current.moved = false; return; }
    if (!pattern || !onCellClick || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cellSize = 20 * zoom;
    const col = Math.floor((e.clientX - rect.left) / cellSize);
    const row = Math.floor((e.clientY - rect.top) / cellSize);
    if (row >= 0 && row < pattern.metadata.height && col >= 0 && col < pattern.metadata.width) {
      onCellClick(row, col);
    }
  };

  if (!pattern) return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-600">
      <div className="text-5xl mb-3">🎨</div>
      <p>{t('preview.empty')}</p>
    </div>
  );

  const btn = 'px-2.5 py-1 rounded-lg text-sm font-medium transition-colors';

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setZoom(z => Math.max(0.1, +(z - 0.25).toFixed(2)))}
          className={`${btn} bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700`}>−</button>
        <span className="text-sm text-gray-500 dark:text-gray-400 font-mono min-w-[3rem] text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(z => Math.min(5, +(z + 0.25).toFixed(2)))}
          className={`${btn} bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700`}>+</button>
        <div className="w-px h-5 bg-gray-300 dark:bg-gray-700 mx-1" />
        <button onClick={() => setShowGrid(g => !g)}
          className={`${btn} ${showGrid ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300' : 'bg-gray-100 dark:bg-gray-800'}`}>
          {showGrid ? '▦' : '▢'} {t('preview.grid')}
        </button>
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
          {pattern.metadata.width}×{pattern.metadata.height} · 🖱️scroll · drag
        </span>
      </div>
      <div
        ref={wrapRefCb}
        className="overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 cursor-grab select-none"
        style={{ maxHeight: '70vh' }}
      >
        <div style={{ width: pattern.metadata.width * 20 * zoom, height: pattern.metadata.height * 20 * zoom }}>
          <canvas
            ref={canvasRef}
            onClick={handleClick}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
          />
        </div>
      </div>
    </div>
  );
}
