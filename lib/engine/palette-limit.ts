import type { CompiledBeadColor } from '@/lib/types/bead';

export function buildUsageMap(matched: CompiledBeadColor[]): Map<string, number> {
  const usage = new Map<string, number>();
  for (const color of matched) {
    usage.set(color.id, (usage.get(color.id) ?? 0) + 1);
  }
  return usage;
}

export function selectKeyColorIds(palette: CompiledBeadColor[], usage: Map<string, number>): Set<string> {
  const used = palette.filter(color => (usage.get(color.id) ?? 0) > 0);
  if (used.length === 0) return new Set<string>();

  const minUsage = used.some(color => (usage.get(color.id) ?? 0) >= 2) ? 2 : 1;
  const stable = used.filter(color => (usage.get(color.id) ?? 0) >= minUsage);
  const pool = stable.length > 0 ? stable : used;
  const keys = new Set<string>();

  const byLuma = [...pool].sort((a, b) => luminance(a) - luminance(b));
  keys.add(byLuma[0].id);
  keys.add(byLuma[byLuma.length - 1].id);

  let bestSatColor: CompiledBeadColor | null = null;
  let bestSatScore = -1;
  for (const color of pool) {
    const sat = saturation(color);
    const count = usage.get(color.id) ?? 0;
    const score = sat * 10 + count;
    if (score > bestSatScore) {
      bestSatScore = score;
      bestSatColor = color;
    }
  }
  if (bestSatColor && saturation(bestSatColor) >= 28) keys.add(bestSatColor.id);

  return keys;
}

export function limitPaletteWithKeyColors(
  palette: CompiledBeadColor[],
  usage: Map<string, number>,
  maxColors: number
): { limitedPalette: CompiledBeadColor[]; protectedIds: Set<string> } {
  if (maxColors <= 0 || maxColors >= palette.length) {
    return { limitedPalette: palette, protectedIds: new Set<string>() };
  }

  const used = palette.filter(color => (usage.get(color.id) ?? 0) > 0);
  const protectedIds = selectKeyColorIds(palette, usage);
  if (used.length <= maxColors) {
    const usedIds = new Set(used.map(color => color.id));
    const finalProtected = new Set([...protectedIds].filter(id => usedIds.has(id)));
    return {
      limitedPalette: palette.filter(color => usedIds.has(color.id)),
      protectedIds: finalProtected,
    };
  }

  const selected = new Set(
    [...used]
      .sort((a, b) => (usage.get(b.id) ?? 0) - (usage.get(a.id) ?? 0))
      .slice(0, maxColors)
      .map(color => color.id)
  );

  for (const id of protectedIds) selected.add(id);

  while (selected.size > maxColors) {
    let removeId: string | null = null;
    let minCount = Infinity;
    for (const id of selected) {
      if (protectedIds.has(id)) continue;
      const count = usage.get(id) ?? 0;
      if (count < minCount) {
        minCount = count;
        removeId = id;
      }
    }

    if (!removeId) {
      const trimmed = [...selected]
        .sort((a, b) => (usage.get(b) ?? 0) - (usage.get(a) ?? 0))
        .slice(0, maxColors);
      selected.clear();
      for (const id of trimmed) selected.add(id);
      break;
    }
    selected.delete(removeId);
  }

  const finalProtected = new Set([...protectedIds].filter(id => selected.has(id)));
  return {
    limitedPalette: palette.filter(color => selected.has(color.id)),
    protectedIds: finalProtected,
  };
}

function luminance(color: CompiledBeadColor): number {
  return 0.2126 * color.rgb[0] + 0.7152 * color.rgb[1] + 0.0722 * color.rgb[2];
}

function saturation(color: CompiledBeadColor): number {
  const [r, g, b] = color.rgb;
  return Math.max(r, g, b) - Math.min(r, g, b);
}
