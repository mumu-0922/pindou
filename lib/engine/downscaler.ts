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

export function downscale(
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
