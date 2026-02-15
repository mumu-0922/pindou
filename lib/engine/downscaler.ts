// Linear RGB downscaling (敕令 #4)
// sRGB → gamma decode → linear RGB area average → gamma encode → sRGB

export function srgbToLinear(value: number): number {
  const s = value / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

export function linearToSrgb(value: number): number {
  const s = value <= 0.0031308 ? value * 12.92 : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
  return Math.round(Math.max(0, Math.min(255, s * 255)));
}

export interface DownscaledPixel {
  r: number; g: number; b: number; // sRGB 0-255
}

export type PixelationMode = 'average' | 'dominant' | 'edge-aware';

export function downscale(
  data: Uint8ClampedArray,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  mode: PixelationMode = 'average'
): DownscaledPixel[] {
  if (mode === 'dominant') return downscaleDominant(data, srcW, srcH, dstW, dstH);
  if (mode === 'edge-aware') return downscaleEdgeAware(data, srcW, srcH, dstW, dstH);
  return downscaleAverage(data, srcW, srcH, dstW, dstH);
}

function downscaleAverage(
  data: Uint8ClampedArray,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number
): DownscaledPixel[] {
  const result: DownscaledPixel[] = new Array(dstW * dstH);
  const scaleX = srcW / dstW;
  const scaleY = srcH / dstH;

  for (let dy = 0; dy < dstH; dy++) {
    for (let dx = 0; dx < dstW; dx++) {
      const sx0 = Math.floor(dx * scaleX);
      const sy0 = Math.floor(dy * scaleY);
      const sx1 = Math.min(Math.ceil((dx + 1) * scaleX), srcW);
      const sy1 = Math.min(Math.ceil((dy + 1) * scaleY), srcH);

      let linR = 0, linG = 0, linB = 0, count = 0;
      for (let sy = sy0; sy < sy1; sy++) {
        for (let sx = sx0; sx < sx1; sx++) {
          const i = (sy * srcW + sx) * 4;
          linR += srgbToLinear(data[i]);
          linG += srgbToLinear(data[i + 1]);
          linB += srgbToLinear(data[i + 2]);
          count++;
        }
      }

      result[dy * dstW + dx] = {
        r: linearToSrgb(linR / count),
        g: linearToSrgb(linG / count),
        b: linearToSrgb(linB / count),
      };
    }
  }
  return result;
}

function downscaleDominant(
  data: Uint8ClampedArray,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number
): DownscaledPixel[] {
  const result: DownscaledPixel[] = new Array(dstW * dstH);
  const scaleX = srcW / dstW;
  const scaleY = srcH / dstH;

  for (let dy = 0; dy < dstH; dy++) {
    for (let dx = 0; dx < dstW; dx++) {
      const sx0 = Math.floor(dx * scaleX);
      const sy0 = Math.floor(dy * scaleY);
      const sx1 = Math.min(Math.ceil((dx + 1) * scaleX), srcW);
      const sy1 = Math.min(Math.ceil((dy + 1) * scaleY), srcH);

      // Quantize to 6-bit per channel for frequency counting (64 levels, 4x precision vs 5-bit)
      const freq = new Map<number, { count: number; sumR: number; sumG: number; sumB: number }>();
      let bestKey = 0, bestCount = 0;
      for (let sy = sy0; sy < sy1; sy++) {
        for (let sx = sx0; sx < sx1; sx++) {
          const i = (sy * srcW + sx) * 4;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const key = ((r >> 2) << 12) | ((g >> 2) << 6) | (b >> 2);
          const entry = freq.get(key);
          if (entry) {
            entry.count++; entry.sumR += r; entry.sumG += g; entry.sumB += b;
            if (entry.count > bestCount) { bestCount = entry.count; bestKey = key; }
          } else {
            freq.set(key, { count: 1, sumR: r, sumG: g, sumB: b });
            if (1 > bestCount) { bestCount = 1; bestKey = key; }
          }
        }
      }
      const best = freq.get(bestKey)!;
      result[dy * dstW + dx] = {
        r: Math.round(best.sumR / best.count),
        g: Math.round(best.sumG / best.count),
        b: Math.round(best.sumB / best.count),
      };
    }
  }
  return result;
}

function downscaleEdgeAware(
  data: Uint8ClampedArray,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number
): DownscaledPixel[] {
  const result: DownscaledPixel[] = new Array(dstW * dstH);
  const scaleX = srcW / dstW;
  const scaleY = srcH / dstH;

  const luminanceAt = (x: number, y: number): number => {
    const i = (y * srcW + x) * 4;
    return 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  };

  for (let dy = 0; dy < dstH; dy++) {
    for (let dx = 0; dx < dstW; dx++) {
      const sx0 = Math.floor(dx * scaleX);
      const sy0 = Math.floor(dy * scaleY);
      const sx1 = Math.min(Math.ceil((dx + 1) * scaleX), srcW);
      const sy1 = Math.min(Math.ceil((dy + 1) * scaleY), srcH);

      const cx = (sx0 + sx1 - 1) / 2;
      const cy = (sy0 + sy1 - 1) / 2;
      const rx = Math.max(1, (sx1 - sx0) / 2);
      const ry = Math.max(1, (sy1 - sy0) / 2);

      // Contrast-aware dominant color:
      // Upweight edge pixels so thin outlines survive low-res patterns.
      const freq = new Map<number, { weight: number; sumR: number; sumG: number; sumB: number }>();
      let bestKey = 0;
      let bestWeight = -1;

      for (let sy = sy0; sy < sy1; sy++) {
        for (let sx = sx0; sx < sx1; sx++) {
          const i = (sy * srcW + sx) * 4;
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const lum = luminanceAt(sx, sy);
          const rightLum = luminanceAt(Math.min(sx + 1, srcW - 1), sy);
          const bottomLum = luminanceAt(sx, Math.min(sy + 1, srcH - 1));
          const edgeStrength = (Math.abs(lum - rightLum) + Math.abs(lum - bottomLum)) / 255;
          const nx = (sx - cx) / rx;
          const ny = (sy - cy) / ry;
          const centerWeight = 1 + Math.max(0, 1 - (nx * nx + ny * ny)) * 0.35;
          const edgeWeight = 1 + edgeStrength * 1.9;
          const w = centerWeight * edgeWeight;

          // Quantize to 6-bit per channel for stable histogram bins (same as dominant mode).
          const key = ((r >> 2) << 12) | ((g >> 2) << 6) | (b >> 2);
          const entry = freq.get(key);
          if (entry) {
            entry.weight += w;
            entry.sumR += r * w;
            entry.sumG += g * w;
            entry.sumB += b * w;
            if (entry.weight > bestWeight) {
              bestWeight = entry.weight;
              bestKey = key;
            }
          } else {
            freq.set(key, { weight: w, sumR: r * w, sumG: g * w, sumB: b * w });
            if (w > bestWeight) {
              bestWeight = w;
              bestKey = key;
            }
          }
        }
      }

      const best = freq.get(bestKey);
      if (!best || best.weight <= 0) {
        result[dy * dstW + dx] = { r: 0, g: 0, b: 0 };
        continue;
      }
      result[dy * dstW + dx] = {
        r: Math.round(best.sumR / best.weight),
        g: Math.round(best.sumG / best.weight),
        b: Math.round(best.sumB / best.weight),
      };
    }
  }

  return result;
}
