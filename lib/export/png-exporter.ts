import type { BeadPattern, CompiledBeadColor } from '@/lib/types/bead';

const ROWS_PER_CHUNK = 8;
const MAX_CANVAS_DIM = 16384;
const MAX_CANVAS_PIXELS = 268435456; // 256M

function yieldFrame(): Promise<void> {
  return new Promise(r => requestAnimationFrame(() => r()));
}

export async function renderPatternToCanvas(
  pattern: BeadPattern,
  palette: CompiledBeadColor[],
  cellSize: number = 20,
  showGrid: boolean = true,
  showCodes: boolean = false,
  onProgress?: (pct: number) => void,
): Promise<HTMLCanvasElement> {
  const { width, height } = pattern.metadata;
  // Clamp cellSize to stay within browser canvas limits
  const maxByDim = Math.floor(MAX_CANVAS_DIM / Math.max(width, height));
  const maxByPixels = Math.floor(Math.sqrt(MAX_CANVAS_PIXELS / (width * height)));
  cellSize = Math.min(cellSize, maxByDim, maxByPixels);
  const canvas = document.createElement('canvas');
  canvas.width = width * cellSize;
  canvas.height = height * cellSize;
  const ctx = canvas.getContext('2d')!;
  const colorMap = new Map(palette.map(c => [c.id, c]));
  const font = `${Math.max(8, cellSize * 0.35)}px monospace`;

  for (let y0 = 0; y0 < height; y0 += ROWS_PER_CHUNK) {
    const yEnd = Math.min(y0 + ROWS_PER_CHUNK, height);
    for (let y = y0; y < yEnd; y++) {
      for (let x = 0; x < width; x++) {
        const cell = pattern.cells[y][x];
        const color = colorMap.get(cell.colorId);
        const px = x * cellSize, py = y * cellSize;
        ctx.fillStyle = color?.hex ?? '#FF00FF';
        ctx.fillRect(px, py, cellSize, cellSize);
        if (showGrid) {
          ctx.strokeStyle = 'rgba(0,0,0,0.15)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(px, py, cellSize, cellSize);
        }
        if (showCodes && color && cellSize >= 16) {
          ctx.fillStyle = luminance(color.rgb) > 0.5 ? '#000' : '#FFF';
          ctx.font = font;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(color.code, px + cellSize / 2, py + cellSize / 2);
        }
      }
    }
    onProgress?.(Math.round(yEnd / height * 100));
    if (y0 + ROWS_PER_CHUNK < height) await yieldFrame();
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
