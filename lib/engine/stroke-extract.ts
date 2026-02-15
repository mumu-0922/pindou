/**
 * 线稿提取：用 Sobel 梯度 + 暗度双条件检测描边像素，下采样到目标网格生成布尔掩码。
 * 仅标记"又暗又是边缘"的像素为描边，避免把深色填充区域误判。
 */
export function extractStrokeMask(
  srcData: Uint8ClampedArray,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
  lumaThreshold = 60,
  gradientThreshold = 40,
  coverageThreshold = 0.25,
): boolean[] {
  const srcTotal = srcW * srcH;
  // 计算亮度图
  const luma = new Float32Array(srcTotal);
  for (let i = 0; i < srcTotal; i++) {
    const off = i * 4;
    luma[i] = 0.2126 * srcData[off] + 0.7152 * srcData[off + 1] + 0.0722 * srcData[off + 2];
  }
  // Sobel 梯度幅值 + 暗度双条件
  const stroke = new Uint8Array(srcTotal);
  for (let y = 1; y < srcH - 1; y++) {
    for (let x = 1; x < srcW - 1; x++) {
      const idx = y * srcW + x;
      if (luma[idx] >= lumaThreshold) continue; // 不够暗，跳过
      // Sobel 3x3
      const tl = luma[idx - srcW - 1], tc = luma[idx - srcW], tr = luma[idx - srcW + 1];
      const ml = luma[idx - 1],                                mr = luma[idx + 1];
      const bl = luma[idx + srcW - 1], bc = luma[idx + srcW], br = luma[idx + srcW + 1];
      const gx = (tr + 2 * mr + br) - (tl + 2 * ml + bl);
      const gy = (bl + 2 * bc + br) - (tl + 2 * tc + tr);
      if (Math.sqrt(gx * gx + gy * gy) >= gradientThreshold) stroke[idx] = 1;
    }
  }
  // 下采样到目标网格
  const mask: boolean[] = new Array(dstW * dstH);
  for (let dy = 0; dy < dstH; dy++) {
    const sy0 = Math.floor(dy * srcH / dstH);
    const sy1 = Math.floor((dy + 1) * srcH / dstH);
    for (let dx = 0; dx < dstW; dx++) {
      const sx0 = Math.floor(dx * srcW / dstW);
      const sx1 = Math.floor((dx + 1) * srcW / dstW);
      let count = 0, total = 0;
      for (let sy = sy0; sy < sy1; sy++) {
        for (let sx = sx0; sx < sx1; sx++) { total++; if (stroke[sy * srcW + sx]) count++; }
      }
      mask[dy * dstW + dx] = total > 0 && count / total > coverageThreshold;
    }
  }
  return mask;
}
