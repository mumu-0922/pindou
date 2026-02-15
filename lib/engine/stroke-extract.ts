/**
 * 线稿提取：从全分辨率源图提取深色描边，下采样到目标网格生成布尔掩码。
 */
export function extractStrokeMask(
  srcData: Uint8ClampedArray,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  lumaThreshold = 80,
  coverageThreshold = 0.15,
): boolean[] {
  // 1. 标记源图描边像素 + 1px 膨胀
  const srcTotal = srcW * srcH;
  const raw = new Uint8Array(srcTotal);
  for (let i = 0; i < srcTotal; i++) {
    const off = i * 4;
    const luma = 0.2126 * srcData[off] + 0.7152 * srcData[off + 1] + 0.0722 * srcData[off + 2];
    if (luma < lumaThreshold) raw[i] = 1;
  }
  // 膨胀 (4-邻域)
  const dilated = new Uint8Array(srcTotal);
  for (let y = 0; y < srcH; y++) {
    for (let x = 0; x < srcW; x++) {
      const idx = y * srcW + x;
      if (raw[idx]) { dilated[idx] = 1; continue; }
      if ((y > 0 && raw[idx - srcW]) || (y + 1 < srcH && raw[idx + srcW]) ||
          (x > 0 && raw[idx - 1]) || (x + 1 < srcW && raw[idx + 1])) {
        dilated[idx] = 1;
      }
    }
  }
  // 2. 下采样：每个目标格子内描边占比 > 阈值则标记
  const mask: boolean[] = new Array(dstW * dstH);
  for (let dy = 0; dy < dstH; dy++) {
    const sy0 = Math.floor(dy * srcH / dstH);
    const sy1 = Math.floor((dy + 1) * srcH / dstH);
    for (let dx = 0; dx < dstW; dx++) {
      const sx0 = Math.floor(dx * srcW / dstW);
      const sx1 = Math.floor((dx + 1) * srcW / dstW);
      let count = 0, total = 0;
      for (let sy = sy0; sy < sy1; sy++) {
        for (let sx = sx0; sx < sx1; sx++) {
          total++;
          if (dilated[sy * srcW + sx]) count++;
        }
      }
      mask[dy * dstW + dx] = total > 0 && count / total > coverageThreshold;
    }
  }
  return mask;
}
