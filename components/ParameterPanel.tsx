'use client';
import { useState, useEffect } from 'react';
import type { BeadBrand, DitheringMode } from '@/lib/types/bead';
import type { BackgroundMode } from '@/lib/engine/image-loader';
import type { PixelationMode } from '@/lib/engine/downscaler';
import { getAvailableBrands } from '@/lib/data/palettes/loader';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

interface Props {
  brand: BeadBrand;
  width: number;
  height: number;
  dithering: DitheringMode;
  background: BackgroundMode;
  brightness: number;
  contrast: number;
  saturation: number;
  sharpness: number;
  maxColors: number;
  pixMode: PixelationMode;
  lowResOptimize: boolean;
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
  onSharpnessChange: (v: number) => void;
  onMaxColorsChange: (v: number) => void;
  onPixModeChange: (v: PixelationMode) => void;
  onLowResOptimizeChange: (v: boolean) => void;
  onLockRatioChange: (v: boolean) => void;
}

function NumInput({ value, onChange, min = 1, max = 200 }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number;
}) {
  const [raw, setRaw] = useState(String(value));
  useEffect(() => { setRaw(String(value)); }, [value]);
  return (
    <Input
      type="text"
      inputMode="numeric"
      value={raw}
      onChange={e => {
        const v = e.target.value.replace(/[^0-9]/g, '');
        setRaw(v);
        const n = parseInt(v, 10);
        if (!isNaN(n) && n >= min && n <= max) onChange(n);
      }}
      onBlur={() => {
        const n = parseInt(raw, 10);
        if (isNaN(n) || n < min) { setRaw(String(min)); onChange(min); }
        else if (n > max) { setRaw(String(max)); onChange(max); }
        else setRaw(String(n));
      }}
    />
  );
}

function SectionHeader({ icon, title, open, onToggle }: { icon: string; title: string; open: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="w-full flex items-center justify-between py-2.5 text-sm font-bold text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition-colors">
      <span className="flex items-center gap-1.5">{icon} {title}</span>
      <span className={`transition-transform duration-200 text-xs ${open ? 'rotate-180' : ''}`}>▼</span>
    </button>
  );
}

function SliderRow({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between">
        <Label className="text-xs uppercase tracking-wide">{label}</Label>
        <span className="text-xs font-mono text-muted-foreground">{value > 0 ? '+' : ''}{value}</span>
      </div>
      <Slider min={min} max={max} step={1} value={[value]} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}

export default function ParameterPanel(props: Props) {
  const { t } = useI18n();
  const brands = getAvailableBrands();
  const [openSize, setOpenSize] = useState(true);
  const [openImage, setOpenImage] = useState(false);

  const boardSize = 29;
  const boardCols = Math.ceil(props.width / boardSize);
  const boardRows = Math.ceil(props.height / boardSize);
  const boardCount = boardCols * boardRows;
  const totalBeads = props.width * props.height;
  const isSmallPattern = props.width <= 40 && props.height <= 40;

  const handleWidthChange = (w: number) => {
    props.onWidthChange(w);
    if (props.lockRatio && props.aspectRatio > 0) {
      props.onHeightChange(Math.max(1, Math.min(200, Math.round(w / props.aspectRatio))));
    }
  };

  const handleHeightChange = (h: number) => {
    props.onHeightChange(h);
    if (props.lockRatio && props.aspectRatio > 0) {
      props.onWidthChange(Math.max(1, Math.min(200, Math.round(h * props.aspectRatio))));
    }
  };

  const resetBCS = () => {
    props.onBrightnessChange(0);
    props.onContrastChange(0);
    props.onSaturationChange(0);
    props.onSharpnessChange(0);
  };

  return (
    <div className="card-premium p-5 space-y-1 bg-gradient-to-br from-white to-pink-50/50 dark:from-gray-900 dark:to-pink-950/10">
      {/* Brand row */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">⚙️</span>
        <span className="text-sm font-bold bg-gradient-to-r from-pink-500 to-fuchsia-500 bg-clip-text text-transparent">{t('param.brand')}</span>
        <div className="flex-1 h-px bg-gradient-to-r from-pink-200 to-transparent dark:from-pink-800" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pb-3 border-b border-pink-100 dark:border-pink-900/30">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs uppercase tracking-wide">{t('param.brand')}</Label>
          <Select value={props.brand} onValueChange={v => props.onBrandChange(v as BeadBrand)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {brands.map(b => <SelectItem key={b} value={b}>{b.charAt(0).toUpperCase() + b.slice(1)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs uppercase tracking-wide">{t('param.pixMode')}</Label>
            <Select value={props.pixMode} onValueChange={v => props.onPixModeChange(v as PixelationMode)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="average">{t('param.pixAverage')}</SelectItem>
                <SelectItem value="dominant">{t('param.pixDominant')}</SelectItem>
                <SelectItem value="edge-aware">{t('param.pixEdgeAware')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs uppercase tracking-wide">{t('param.dithering')}</Label>
          <Select value={props.dithering} onValueChange={v => props.onDitheringChange(v as DitheringMode)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('param.dithOff')}</SelectItem>
              <SelectItem value="floyd-steinberg">Floyd-Steinberg</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs uppercase tracking-wide">{t('param.background')}</Label>
          <Select value={props.background} onValueChange={v => props.onBackgroundChange(v as BackgroundMode)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="white">{t('param.bgWhite')}</SelectItem>
              <SelectItem value="black">{t('param.bgBlack')}</SelectItem>
              <SelectItem value="transparent">{t('param.bgTransparent')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs uppercase tracking-wide">{t('param.maxColors')}</Label>
          <Select value={String(props.maxColors)} onValueChange={v => props.onMaxColorsChange(+v)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">{t('param.maxColorsAll')}</SelectItem>
              {[5, 10, 15, 20, 30, 50].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Size section */}
      <SectionHeader icon="📐" title={t('param.sizeGroup')} open={openSize} onToggle={() => setOpenSize(!openSize)} />
      {openSize && (
        <div className="pb-3 border-b border-pink-100 dark:border-pink-900/30 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 items-end">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs uppercase tracking-wide">{t('param.width')}</Label>
              <NumInput value={props.width} onChange={handleWidthChange} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs uppercase tracking-wide">{t('param.height')}</Label>
              <NumInput value={props.height} onChange={handleHeightChange} />
            </div>
            <div className="flex items-center gap-2 self-end pb-2">
              <Switch id="lock-ratio" checked={props.lockRatio} onCheckedChange={props.onLockRatioChange} />
              <Label htmlFor="lock-ratio" className="text-sm cursor-pointer">{t('param.lock')}</Label>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground bg-gradient-to-r from-pink-50 to-fuchsia-50 dark:from-pink-950/20 dark:to-fuchsia-950/20 rounded-xl px-3 py-2.5 border border-pink-100 dark:border-pink-900/30">
            <span>{t('param.boardSize')}: {boardSize}×{boardSize}</span>
            <span>{t('param.boardCount')}: <b className="text-pink-500 dark:text-pink-400">{boardCount}</b> {t('param.boardUnit')}</span>
            <span>{t('param.totalBeads')}: <b className="text-pink-500 dark:text-pink-400">{totalBeads.toLocaleString()}</b></span>
          </div>
        </div>
      )}

      {/* Image adjustments */}
      <SectionHeader icon="🎨" title={t('param.imageGroup')} open={openImage} onToggle={() => setOpenImage(!openImage)} />
      {openImage && (
        <div className="pb-3 border-b border-pink-100 dark:border-pink-900/30 space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-pink-100 bg-white/70 px-3 py-2 dark:border-pink-900/30 dark:bg-gray-900/60">
            <Label htmlFor="low-res-opt" className="text-xs uppercase tracking-wide cursor-pointer">{t('param.lowResOptimize')}</Label>
            <Switch id="low-res-opt" checked={props.lowResOptimize} onCheckedChange={props.onLowResOptimizeChange} />
          </div>
          {isSmallPattern && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400">{t('param.lowResOptimizeHint')}</p>
          )}
          <SliderRow label={t('param.brightness')} value={props.brightness} min={-50} max={50} onChange={props.onBrightnessChange} />
          <SliderRow label={t('param.contrast')} value={props.contrast} min={-50} max={50} onChange={props.onContrastChange} />
          <SliderRow label={t('param.saturation')} value={props.saturation} min={-50} max={50} onChange={props.onSaturationChange} />
          <SliderRow label={t('param.sharpness')} value={props.sharpness} min={0} max={100} onChange={props.onSharpnessChange} />
          {(props.brightness !== 0 || props.contrast !== 0 || props.saturation !== 0 || props.sharpness !== 0) && (
            <Button variant="link" size="sm" onClick={resetBCS} className="text-xs text-pink-500 dark:text-pink-400 p-0 h-auto">
              ↺ {t('param.reset')}
            </Button>
          )}
          {isSmallPattern && (
            <p className="text-xs text-amber-600 dark:text-amber-400">{t('param.sharpnessHint')}</p>
          )}
        </div>
      )}
    </div>
  );
}
