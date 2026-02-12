'use client';
import { useState } from 'react';
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
  brightness: number;
  contrast: number;
  saturation: number;
  maxColors: number;
  lockRatio: boolean;
  aspectRatio: number;
  onBrandChange: (b: BeadBrand) => void;
  onWidthChange: (w: number) => void;
  onHeightChange: (h: number) => void;
  onDitheringChange: (d: DitheringMode) => void;
  onBackgroundChange: (bg: BackgroundMode) => void;
  onBrightnessChange: (v: number) => void;
  onContrastChange: (v: number) => void;
  onSaturationChange: (v: number) => void;
  onMaxColorsChange: (v: number) => void;
  onLockRatioChange: (v: boolean) => void;
}

const sel = 'border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 outline-none transition-colors w-full';
const lbl = 'text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide';

function Slider({ label, value, min, max, onChange, unit = '' }: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void; unit?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <div className="flex justify-between">
        <span className={lbl}>{label}</span>
        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{value > 0 ? '+' : ''}{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(+e.target.value)}
        className="slider-track w-full h-1.5 rounded-full appearance-none cursor-pointer accent-purple-600" />
    </label>
  );
}

function SectionHeader({ title, open, onToggle }: { title: string; open: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="w-full flex items-center justify-between py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
      {title}
      <span className={`transition-transform text-xs ${open ? 'rotate-180' : ''}`}>▼</span>
    </button>
  );
}

export default function ParameterPanel(props: Props) {
  const { t } = useI18n();
  const brands = getAvailableBrands();
  const [openSize, setOpenSize] = useState(true);
  const [openImage, setOpenImage] = useState(false);
  const [openAdvanced, setOpenAdvanced] = useState(false);

  const boardSize = 29;
  const boardCols = Math.ceil(props.width / boardSize);
  const boardRows = Math.ceil(props.height / boardSize);
  const boardCount = boardCols * boardRows;
  const totalBeads = props.width * props.height;

  const handleWidthChange = (w: number) => {
    props.onWidthChange(w);
    if (props.lockRatio && props.aspectRatio > 0) {
      props.onHeightChange(Math.round(w / props.aspectRatio));
    }
  };

  const handleHeightChange = (h: number) => {
    props.onHeightChange(h);
    if (props.lockRatio && props.aspectRatio > 0) {
      props.onWidthChange(Math.round(h * props.aspectRatio));
    }
  };

  const resetBCS = () => {
    props.onBrightnessChange(0);
    props.onContrastChange(0);
    props.onSaturationChange(0);
  };

  return (
    <div className="card-premium p-4 space-y-1 bg-white dark:bg-gray-900">
      {/* Brand row — always visible */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
        <label className="flex flex-col gap-1.5">
          <span className={lbl}>{t('param.brand')}</span>
          <select value={props.brand} onChange={e => props.onBrandChange(e.target.value as BeadBrand)} className={sel}>
            {brands.map(b => <option key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</option>)}
          </select>
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
        <label className="flex flex-col gap-1.5">
          <span className={lbl}>{t('param.maxColors')}</span>
          <select value={props.maxColors} onChange={e => props.onMaxColorsChange(+e.target.value)} className={sel}>
            <option value={0}>{t('param.maxColorsAll')}</option>
            {[5, 10, 15, 20, 30, 50].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      </div>

      {/* Size section */}
      <SectionHeader title={t('param.sizeGroup')} open={openSize} onToggle={() => setOpenSize(!openSize)} />
      {openSize && (
        <div className="pb-3 border-b border-gray-100 dark:border-gray-800 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 items-end">
            <label className="flex flex-col gap-1.5">
              <span className={lbl}>{t('param.width')}</span>
              <input type="number" min={1} max={200} value={props.width}
                onChange={e => handleWidthChange(+e.target.value)} className={sel} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={lbl}>{t('param.height')}</span>
              <input type="number" min={1} max={200} value={props.height}
                onChange={e => handleHeightChange(+e.target.value)} className={sel} />
            </label>
            <label className="flex items-center gap-2 cursor-pointer self-end pb-2">
              <input type="checkbox" checked={props.lockRatio} onChange={e => props.onLockRatioChange(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">🔗 {t('param.lock')}</span>
            </label>
          </div>
          {/* Stats bar */}
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2">
            <span>{t('param.boardSize')}: {boardSize}×{boardSize}</span>
            <span>{t('param.boardCount')}: <b className="text-purple-600 dark:text-purple-400">{boardCount}</b> {t('param.boardUnit')}</span>
            <span>{t('param.totalBeads')}: <b className="text-purple-600 dark:text-purple-400">{totalBeads.toLocaleString()}</b></span>
          </div>
        </div>
      )}

      {/* Image adjustments */}
      <SectionHeader title={t('param.imageGroup')} open={openImage} onToggle={() => setOpenImage(!openImage)} />
      {openImage && (
        <div className="pb-3 border-b border-gray-100 dark:border-gray-800 space-y-3">
          <Slider label={t('param.brightness')} value={props.brightness} min={-50} max={50} onChange={props.onBrightnessChange} />
          <Slider label={t('param.contrast')} value={props.contrast} min={-50} max={50} onChange={props.onContrastChange} />
          <Slider label={t('param.saturation')} value={props.saturation} min={-50} max={50} onChange={props.onSaturationChange} />
          {(props.brightness !== 0 || props.contrast !== 0 || props.saturation !== 0) && (
            <button onClick={resetBCS}
              className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium">
              ↺ {t('param.reset')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
