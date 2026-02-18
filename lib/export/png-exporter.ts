import type { BeadPattern, CompiledBeadColor } from '@/lib/types/bead';

const ROWS_PER_CHUNK = 8;
const MAX_CANVAS_DIM = 16384;
const MAX_CANVAS_PIXELS = 268435456; // 256M
const BOARD_SIZE = 29;
const BORDER_COLOR = '#6870B8'; // blue-purple border
const SUB_GRID = 5; // thicker line every N cells

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

  const colorMap = new Map(palette.map(c => [c.id, c]));

  // Collect used colors for legend
  const usedColors = getUsedColors(pattern, colorMap);

  // Layout dimensions
  const borderW = Math.max(2, Math.round(cellSize * 0.4));
  const gridW = width * cellSize;
  const gridH = height * cellSize;
  const legendH = usedColors.length > 0 ? Math.round(cellSize * 1.8) : 0;
  const totalW = gridW + borderW * 2;
  const totalH = gridH + borderW * 2 + legendH;

  const canvas = document.createElement('canvas');
  canvas.width = totalW;
  canvas.height = totalH;
  const ctx = canvas.getContext('2d')!;

  // Fill background white
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, totalW, totalH);

  const font = `${Math.max(8, cellSize * 0.35)}px monospace`;
  const ox = borderW, oy = borderW;

  // Draw cells
  for (let y0 = 0; y0 < height; y0 += ROWS_PER_CHUNK) {
    const yEnd = Math.min(y0 + ROWS_PER_CHUNK, height);
    for (let y = y0; y < yEnd; y++) {
      for (let x = 0; x < width; x++) {
        const cell = pattern.cells[y][x];
        const color = colorMap.get(cell.colorId);
        const px = ox + x * cellSize, py = oy + y * cellSize;
        ctx.fillStyle = color?.hex ?? '#FF00FF';
        ctx.fillRect(px, py, cellSize, cellSize);
        if (showGrid) {
          ctx.strokeStyle = 'rgba(0,0,0,0.25)';
          ctx.lineWidth = 1;
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
    onProgress?.(Math.round(yEnd / height * 90));
    if (y0 + ROWS_PER_CHUNK < height) await yieldFrame();
  }

  // Sub-grid lines (every SUB_GRID cells) + Board separator lines
  if (showGrid) {
    // Sub-grid lines (medium thickness)
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = Math.max(1, cellSize * 0.04);
    for (let bx = SUB_GRID; bx < width; bx += SUB_GRID) {
      if (bx % BOARD_SIZE === 0) continue; // skip board lines
      const px = ox + bx * cellSize;
      ctx.beginPath();
      ctx.moveTo(px, oy);
      ctx.lineTo(px, oy + gridH);
      ctx.stroke();
    }
    for (let by = SUB_GRID; by < height; by += SUB_GRID) {
      if (by % BOARD_SIZE === 0) continue;
      const py = oy + by * cellSize;
      ctx.beginPath();
      ctx.moveTo(ox, py);
      ctx.lineTo(ox + gridW, py);
      ctx.stroke();
    }

    // Board separator lines (thickest)
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = Math.max(2, cellSize * 0.08);
    // Vertical board lines
    for (let bx = 0; bx <= width; bx += BOARD_SIZE) {
      const px = ox + Math.min(bx, width) * cellSize;
      ctx.beginPath();
      ctx.moveTo(px, oy);
      ctx.lineTo(px, oy + gridH);
      ctx.stroke();
    }
    // Horizontal board lines
    for (let by = 0; by <= height; by += BOARD_SIZE) {
      const py = oy + Math.min(by, height) * cellSize;
      ctx.beginPath();
      ctx.moveTo(ox, py);
      ctx.lineTo(ox + gridW, py);
      ctx.stroke();
    }
  }

  // Blue-purple border
  ctx.strokeStyle = BORDER_COLOR;
  ctx.lineWidth = borderW;
  ctx.strokeRect(borderW / 2, borderW / 2, totalW - borderW, gridH + borderW);

  // Legend at bottom
  if (legendH > 0) {
    const legendY = oy + gridH + borderW + Math.round(cellSize * 0.3);
    const swatchSize = Math.round(cellSize * 0.8);
    const legendFont = `bold ${Math.max(8, cellSize * 0.28)}px sans-serif`;
    ctx.font = legendFont;
    let lx = borderW + 4;
    for (const color of usedColors) {
      ctx.fillStyle = color.hex;
      ctx.fillRect(lx, legendY, swatchSize, swatchSize);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(lx, legendY, swatchSize, swatchSize);
      const label = `${color.code} ${color.name}`;
      ctx.fillStyle = '#000';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.font = legendFont;
      ctx.fillText(label, lx + swatchSize + 4, legendY + swatchSize / 2);
      lx += swatchSize + ctx.measureText(label).width + 18;
      if (lx > totalW - borderW * 2) break;
    }
  }

  onProgress?.(100);
  return canvas;
}

function getUsedColors(
  pattern: BeadPattern,
  colorMap: Map<string, CompiledBeadColor>,
): CompiledBeadColor[] {
  const counts = new Map<string, number>();
  for (const row of pattern.cells)
    for (const cell of row)
      counts.set(cell.colorId, (counts.get(cell.colorId) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => colorMap.get(id))
    .filter((c): c is CompiledBeadColor => !!c);
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
