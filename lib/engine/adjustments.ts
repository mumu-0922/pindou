export interface Pixel { r: number; g: number; b: number }

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
