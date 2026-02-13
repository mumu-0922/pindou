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
  const weakEdgeThreshold = 18;
  const strongEdgeThreshold = 56;
  const tinyClusterRatio = 0.12;

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

      const lumSamples: number[] = [];
      const linRSamples: number[] = [];
      const linGSamples: number[] = [];
      const linBSamples: number[] = [];
      const centerWeights: number[] = [];
      let lumSum = 0;
      let lumMin = Number.POSITIVE_INFINITY;
      let lumMax = Number.NEGATIVE_INFINITY;

      for (let sy = sy0; sy < sy1; sy++) {
        for (let sx = sx0; sx < sx1; sx++) {
          const i = (sy * srcW + sx) * 4;
          const lum = luminanceAt(sx, sy);
          const nx = (sx - cx) / rx;
          const ny = (sy - cy) / ry;
          const centerWeight = 1 + Math.max(0, 1 - (nx * nx + ny * ny)) * 0.35;

          lumSamples.push(lum);
          linRSamples.push(srgbToLinear(data[i]));
          linGSamples.push(srgbToLinear(data[i + 1]));
          linBSamples.push(srgbToLinear(data[i + 2]));
          centerWeights.push(centerWeight);
          lumSum += lum;
          if (lum < lumMin) lumMin = lum;
          if (lum > lumMax) lumMax = lum;
        }
      }

      const sampleCount = lumSamples.length;
      if (sampleCount === 0) {
        result[dy * dstW + dx] = { r: 0, g: 0, b: 0 };
        continue;
      }

      const lumRange = lumMax - lumMin;
      if (sampleCount < 4 || lumRange < weakEdgeThreshold) {
        let sumR = 0;
        let sumG = 0;
        let sumB = 0;
        let sumW = 0;
        for (let i = 0; i < sampleCount; i++) {
          const w = centerWeights[i];
          sumR += linRSamples[i] * w;
          sumG += linGSamples[i] * w;
          sumB += linBSamples[i] * w;
          sumW += w;
        }
        const inv = sumW > 0 ? 1 / sumW : 0;
        result[dy * dstW + dx] = {
          r: linearToSrgb(sumR * inv),
          g: linearToSrgb(sumG * inv),
          b: linearToSrgb(sumB * inv),
        };
        continue;
      }

      const lumMean = lumSum / sampleCount;
      const cluster = [
        { count: 0, weight: 0, centerScore: 0, sumLum: 0, sumR: 0, sumG: 0, sumB: 0 },
        { count: 0, weight: 0, centerScore: 0, sumLum: 0, sumR: 0, sumG: 0, sumB: 0 },
      ];

      for (let i = 0; i < sampleCount; i++) {
        const lum = lumSamples[i];
        const idx = lum <= lumMean ? 0 : 1;
        const edgeBias = Math.abs(lum - lumMean) / Math.max(1, lumRange);
        const w = centerWeights[i] * (1 + edgeBias * 0.35);
        const target = cluster[idx];
        target.count++;
        target.weight += w;
        target.centerScore += centerWeights[i];
        target.sumLum += lum;
        target.sumR += linRSamples[i] * w;
        target.sumG += linGSamples[i] * w;
        target.sumB += linBSamples[i] * w;
      }

      if (cluster[0].count === 0 || cluster[1].count === 0) {
        const mono = cluster[0].count > 0 ? cluster[0] : cluster[1];
        const inv = mono.weight > 0 ? 1 / mono.weight : 0;
        result[dy * dstW + dx] = {
          r: linearToSrgb(mono.sumR * inv),
          g: linearToSrgb(mono.sumG * inv),
          b: linearToSrgb(mono.sumB * inv),
        };
        continue;
      }

      const c0 = cluster[0];
      const c1 = cluster[1];
      const minorRatio = Math.min(c0.count, c1.count) / sampleCount;
      const avgLum0 = c0.sumLum / c0.count;
      const avgLum1 = c1.sumLum / c1.count;
      const darkerIdx = avgLum0 <= avgLum1 ? 0 : 1;

      let chosen = 0;
      if (minorRatio < tinyClusterRatio) {
        chosen = c0.count >= c1.count ? 0 : 1;
        if (
          lumRange >= strongEdgeThreshold &&
          cluster[darkerIdx].centerScore >= cluster[chosen].centerScore * 0.6
        ) {
          chosen = darkerIdx;
        }
      } else {
        chosen = c0.centerScore >= c1.centerScore ? 0 : 1;
        if (
          lumRange >= strongEdgeThreshold &&
          Math.abs(c0.centerScore - c1.centerScore) < 0.35
        ) {
          chosen = darkerIdx;
        }
      }

      const pick = cluster[chosen];
      const inv = pick.weight > 0 ? 1 / pick.weight : 0;
      result[dy * dstW + dx] = {
        r: linearToSrgb(pick.sumR * inv),
        g: linearToSrgb(pick.sumG * inv),
        b: linearToSrgb(pick.sumB * inv),
      };
    }
  }

  return result;
}
