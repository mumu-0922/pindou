'use client';
import type { BeadBrand, DitheringMode } from '@/lib/types/bead';
import type { BackgroundMode } from '@/lib/engine/image-loader';
import { getAvailableBrands } from '@/lib/data/palettes/loader';

interface Props {
  brand: BeadBrand;
  width: number;
  height: number;
  dithering: DitheringMode;
  background: BackgroundMode;
  onBrandChange: (b: BeadBrand) => void;
  onWidthChange: (w: number) => void;
  onHeightChange: (h: number) => void;
  onDitheringChange: (d: DitheringMode) => void;
  onBackgroundChange: (bg: BackgroundMode) => void;
}

export default function ParameterPanel(props: Props) {
  const brands = getAvailableBrands();
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 bg-gray-50 rounded-lg">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-500">品牌</span>
        <select value={props.brand} onChange={e => props.onBrandChange(e.target.value as BeadBrand)}
          className="border rounded px-2 py-1.5 text-sm">
          {brands.map(b => <option key={b} value={b}>{b.toUpperCase()}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-500">宽度</span>
        <input type="number" min={1} max={200} value={props.width}
          onChange={e => props.onWidthChange(+e.target.value)}
          className="border rounded px-2 py-1.5 text-sm" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-500">高度</span>
        <input type="number" min={1} max={200} value={props.height}
          onChange={e => props.onHeightChange(+e.target.value)}
          className="border rounded px-2 py-1.5 text-sm" />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-500">抖动</span>
        <select value={props.dithering} onChange={e => props.onDitheringChange(e.target.value as DitheringMode)}
          className="border rounded px-2 py-1.5 text-sm">
          <option value="none">关闭</option>
          <option value="floyd-steinberg">Floyd-Steinberg</option>
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-gray-500">底色</span>
        <select value={props.background} onChange={e => props.onBackgroundChange(e.target.value as BackgroundMode)}
          className="border rounded px-2 py-1.5 text-sm">
          <option value="white">白色</option>
          <option value="black">黑色</option>
          <option value="transparent">透明</option>
        </select>
      </label>
    </div>
  );
}
