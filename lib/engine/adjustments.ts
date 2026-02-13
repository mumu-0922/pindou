export interface Pixel { r: number; g: number; b: number }

export function sharpenPixels(
  pixels: Pixel[], width: number, height: number, amount: number
): Pixel[] {
  if (amount <= 0) return pixels;
  const a = amount / 100;
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const out = new Array<Pixel>(pixels.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
        out[i] = pixels[i]; continue;
      }
      const c = pixels[i];
      const t = pixels[i - width], b = pixels[i + width];
      const l = pixels[i - 1], r = pixels[i + 1];
      // Laplacian: center*4 - neighbors, then blend
      out[i] = {
        r: clamp(c.r + a * (4 * c.r - t.r - b.r - l.r - r.r)),
        g: clamp(c.g + a * (4 * c.g - t.g - b.g - l.g - r.g)),
        b: clamp(c.b + a * (4 * c.b - t.b - b.b - l.b - r.b)),
      };
    }
  }
  return out;
}

export function adjustPixels(
  pixels: Pixel[],
  brightness: number,
  contrast: number,
  saturation: number,
): Pixel[] {
  if (!brightness && !contrast && !saturation) return pixels;
  const b = brightness * 2.55;
  const c = (100 + contrast) / 100;
  const s = (100 + saturation) / 100;
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return pixels.map(p => {
    let r = p.r + b, g = p.g + b, bl = p.b + b;
    r = (r - 128) * c + 128;
    g = (g - 128) * c + 128;
    bl = (bl - 128) * c + 128;
    const gray = 0.2126 * r + 0.7152 * g + 0.0722 * bl;
    return {
      r: clamp(gray + (r - gray) * s),
      g: clamp(gray + (g - gray) * s),
      b: clamp(gray + (bl - gray) * s),
    };
  });
}
