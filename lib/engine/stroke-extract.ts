/**
 * 线稿提取：从全分辨率源图提取描边掩码，下采样到目标网格。
 * 策略：亮度阈值检测描边像素（不膨胀），下采样时用占比判定。
 */
export function extractStrokeMask(
  srcData: Uint8ClampedArray,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  lumaThreshold = 50,
  coverageThreshold = 0.20,
): boolean[] {
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
          const off = (sy * srcW + sx) * 4;
          const luma = 0.2126 * srcData[off] + 0.7152 * srcData[off + 1] + 0.0722 * srcData[off + 2];
          if (luma < lumaThreshold) count++;
        }
      }
      mask[dy * dstW + dx] = total > 0 && count / total > coverageThreshold;
    }
  }
  return mask;
}
