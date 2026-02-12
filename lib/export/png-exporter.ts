import type { BeadPattern, CompiledBeadColor } from '@/lib/types/bead';

export function renderPatternToCanvas(
  pattern: BeadPattern,
  palette: CompiledBeadColor[],
  cellSize: number = 20,
  showGrid: boolean = true,
  showCodes: boolean = false
): HTMLCanvasElement {
  const { width, height } = pattern.metadata;
  const canvas = document.createElement('canvas');
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
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }

      if (showCodes && color && cellSize >= 16) {
        ctx.fillStyle = luminance(color.rgb) > 0.5 ? '#000' : '#FFF';
        ctx.font = `${Math.max(8, cellSize * 0.35)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(color.code, x * cellSize + cellSize / 2, y * cellSize + cellSize / 2);
      }
    }
  }
  return canvas;
}

function luminance(rgb: [number, number, number]): number {
  return (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Failed to create blob')), 'image/png');
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
