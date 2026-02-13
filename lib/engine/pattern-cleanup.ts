import type { BeadCell } from '@/lib/types/bead';

function indexToCoord(index: number, width: number): [row: number, col: number] {
  return [Math.floor(index / width), index % width];
}

function coordToIndex(row: number, col: number, width: number): number {
  return row * width + col;
}

function neighbors4(row: number, col: number, width: number, height: number): Array<[number, number]> {
  const result: Array<[number, number]> = [];
  if (row > 0) result.push([row - 1, col]);
  if (row + 1 < height) result.push([row + 1, col]);
  if (col > 0) result.push([row, col - 1]);
  if (col + 1 < width) result.push([row, col + 1]);
  return result;
}

export function removeIsolatedNoise(
  cells: BeadCell[][],
  width: number,
  height: number,
  minComponentSize: number = 2
): BeadCell[][] {
  if (width <= 0 || height <= 0 || minComponentSize < 1) return cells;

  const source = cells.map(row => row.map(cell => cell.colorId));
  const output = cells.map(row => row.map(cell => ({ ...cell })));
  const total = width * height;
  const visited = new Uint8Array(total);

  for (let start = 0; start < total; start++) {
    if (visited[start]) continue;

    const [startRow, startCol] = indexToCoord(start, width);
    const targetColor = source[startRow][startCol];
    const queue: number[] = [start];
    const component: number[] = [];
    visited[start] = 1;

    while (queue.length > 0) {
      const idx = queue.shift()!;
      component.push(idx);
      const [row, col] = indexToCoord(idx, width);

      for (const [nr, nc] of neighbors4(row, col, width, height)) {
        const nIdx = coordToIndex(nr, nc, width);
        if (visited[nIdx]) continue;
        if (source[nr][nc] !== targetColor) continue;
        visited[nIdx] = 1;
        queue.push(nIdx);
      }
    }

    if (component.length > minComponentSize) continue;

    const neighborCount = new Map<string, number>();
    for (const idx of component) {
      const [row, col] = indexToCoord(idx, width);
      for (const [nr, nc] of neighbors4(row, col, width, height)) {
        const colorId = source[nr][nc];
        if (colorId === targetColor) continue;
        neighborCount.set(colorId, (neighborCount.get(colorId) ?? 0) + 1);
      }
    }

    if (neighborCount.size === 0) continue;

    let replaceColor = targetColor;
    let best = -1;
    for (const [colorId, count] of neighborCount.entries()) {
      if (count > best) {
        best = count;
        replaceColor = colorId;
      }
    }

    for (const idx of component) {
      const [row, col] = indexToCoord(idx, width);
      output[row][col].colorId = replaceColor;
    }
  }

  return output;
}
