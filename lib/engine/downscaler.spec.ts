import { describe, expect, it } from 'vitest';
import { downscale } from './downscaler';

function createSolidRgba(width: number, height: number, r: number, g: number, b: number): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = 255;
  }
  return data;
}

describe('downscale edge-aware mode', () => {
  it('keeps solid colors stable', () => {
    const src = createSolidRgba(8, 8, 120, 150, 180);
    const average = downscale(src, 8, 8, 4, 4, 'average');
    const edgeAware = downscale(src, 8, 8, 4, 4, 'edge-aware');
    expect(edgeAware).toEqual(average);
  });

  it('preserves strong outline contrast better than average', () => {
    const src = createSolidRgba(6, 6, 255, 255, 255);
    for (let y = 0; y < 6; y++) {
      const i = (y * 6 + 2) * 4;
      src[i] = 0;
      src[i + 1] = 0;
      src[i + 2] = 0;
    }

    const average = downscale(src, 6, 6, 3, 3, 'average');
    const edgeAware = downscale(src, 6, 6, 3, 3, 'edge-aware');
    const middle = 1 * 3 + 1;

    expect(edgeAware[middle].r).toBeLessThanOrEqual(average[middle].r);
    expect(edgeAware[middle].g).toBeLessThanOrEqual(average[middle].g);
    expect(edgeAware[middle].b).toBeLessThanOrEqual(average[middle].b);
  });
});
