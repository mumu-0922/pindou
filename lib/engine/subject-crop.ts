import type { BackgroundMode } from './image-loader';

export interface SubjectCropOptions {
  background: BackgroundMode;
  alphaThreshold?: number;
  colorTolerance?: number;
  paddingRatio?: number;
  minForegroundPixels?: number;
  minCropFillRatio?: number;
}

export interface SubjectCropResult {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  offsetX: number;
  offsetY: number;
  cropped: boolean;
}

const DEFAULT_ALPHA_THRESHOLD = 20;
const DEFAULT_COLOR_TOLERANCE = 20;
const DEFAULT_PADDING_RATIO = 0.02;
const DEFAULT_MIN_CROP_FILL_RATIO = 0.96;

export function cropToSubject(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  options: SubjectCropOptions
): SubjectCropResult {
  if (width <= 0 || height <= 0 || data.length !== width * height * 4) {
    return { data, width, height, offsetX: 0, offsetY: 0, cropped: false };
  }

  const alphaThreshold = options.alphaThreshold ?? DEFAULT_ALPHA_THRESHOLD;
  const colorTolerance = options.colorTolerance ?? DEFAULT_COLOR_TOLERANCE;
  const paddingRatio = options.paddingRatio ?? DEFAULT_PADDING_RATIO;
  const minCropFillRatio = options.minCropFillRatio ?? DEFAULT_MIN_CROP_FILL_RATIO;
  const minForegroundPixels = options.minForegroundPixels ?? Math.max(12, Math.floor(width * height * 0.0015));
  const tol2 = colorTolerance * colorTolerance;

  const [bgR, bgG, bgB] = estimateBorderBackground(data, width, height);
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let foregroundCount = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const a = data[i + 3];
      if (!isForegroundPixel(data[i], data[i + 1], data[i + 2], a, options.background, bgR, bgG, bgB, alphaThreshold, tol2)) {
        continue;
      }
      foregroundCount++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  if (foregroundCount < minForegroundPixels || maxX < minX || maxY < minY) {
    return { data, width, height, offsetX: 0, offsetY: 0, cropped: false };
  }

  const pad = Math.max(0, Math.round(Math.min(width, height) * paddingRatio));
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(width - 1, maxX + pad);
  maxY = Math.min(height - 1, maxY + pad);

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  if (cropW >= width || cropH >= height) {
    return { data, width, height, offsetX: 0, offsetY: 0, cropped: false };
  }
  if ((cropW * cropH) / (width * height) >= minCropFillRatio) {
    return { data, width, height, offsetX: 0, offsetY: 0, cropped: false };
  }

  const cropped = new Uint8ClampedArray(cropW * cropH * 4);
  for (let y = 0; y < cropH; y++) {
    const srcStart = ((minY + y) * width + minX) * 4;
    const srcEnd = srcStart + cropW * 4;
    const dstStart = y * cropW * 4;
    cropped.set(data.subarray(srcStart, srcEnd), dstStart);
  }

  return { data: cropped, width: cropW, height: cropH, offsetX: minX, offsetY: minY, cropped: true };
}

function isForegroundPixel(
  r: number,
  g: number,
  b: number,
  a: number,
  background: BackgroundMode,
  bgR: number,
  bgG: number,
  bgB: number,
  alphaThreshold: number,
  tol2: number
): boolean {
  if (background === 'transparent') {
    return a > alphaThreshold;
  }
  if (a <= alphaThreshold / 2) return false;
  const dr = r - bgR;
  const dg = g - bgG;
  const db = b - bgB;
  return dr * dr + dg * dg + db * db >= tol2;
}

function estimateBorderBackground(data: Uint8ClampedArray, width: number, height: number): [number, number, number] {
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let count = 0;

  const visit = (x: number, y: number) => {
    const i = (y * width + x) * 4;
    const a = data[i + 3] / 255;
    if (a <= 0) return;
    sumR += data[i] * a;
    sumG += data[i + 1] * a;
    sumB += data[i + 2] * a;
    count++;
  };

  for (let x = 0; x < width; x++) {
    visit(x, 0);
    if (height > 1) visit(x, height - 1);
  }
  for (let y = 1; y < height - 1; y++) {
    visit(0, y);
    if (width > 1) visit(width - 1, y);
  }

  if (count === 0) return [255, 255, 255];
  return [Math.round(sumR / count), Math.round(sumG / count), Math.round(sumB / count)];
}
