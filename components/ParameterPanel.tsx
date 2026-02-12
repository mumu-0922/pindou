'use client';
import type { BeadBrand, DitheringMode } from '@/lib/types/bead';
import type { BackgroundMode } from '@/lib/engine/image-loader';
import { getAvailableBrands } from '@/lib/data/palettes/loader';
import { useI18n } from '@/lib/i18n/context';

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

const sel = 'border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors';
const lbl = 'text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide';

export default function ParameterPanel(props: Props) {
  const { t } = useI18n();
  const brands = getAvailableBrands();
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-5 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
      <label className="flex flex-col gap-1.5">
        <span className={lbl}>{t('param.brand')}</span>
        <select value={props.brand} onChange={e => props.onBrandChange(e.target.value as BeadBrand)} className={sel}>
          {brands.map(b => <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>)}
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={lbl}>{t('param.width')}</span>
        <input type="number" min={1} max={200} value={props.width}
          onChange={e => props.onWidthChange(+e.target.value)} className={sel} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={lbl}>{t('param.height')}</span>
        <input type="number" min={1} max={200} value={props.height}
          onChange={e => props.onHeightChange(+e.target.value)} className={sel} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={lbl}>{t('param.dithering')}</span>
        <select value={props.dithering} onChange={e => props.onDitheringChange(e.target.value as DitheringMode)} className={sel}>
          <option value="none">{t('param.dithOff')}</option>
          <option value="floyd-steinberg">Floyd-Steinberg</option>
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className={lbl}>{t('param.background')}</span>
        <select value={props.background} onChange={e => props.onBackgroundChange(e.target.value as BackgroundMode)} className={sel}>
          <option value="white">{t('param.bgWhite')}</option>
          <option value="black">{t('param.bgBlack')}</option>
          <option value="transparent">{t('param.bgTransparent')}</option>
        </select>
      </label>
    </div>
  );
}
