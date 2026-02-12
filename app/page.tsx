'use client';
import { useState, useMemo, useCallback } from 'react';
import type { BeadPattern, BeadBrand, DitheringMode, CompiledBeadColor, BeadUsageItem, PatchOp } from '@/lib/types/bead';
import type { BackgroundMode } from '@/lib/engine/image-loader';
import { loadImage, imageToPixels } from '@/lib/engine/image-loader';
import { downscale } from '@/lib/engine/downscaler';
import { matchColor, matchColors } from '@/lib/engine/color-matcher';
import { applyDithering } from '@/lib/engine/dithering';
import { loadPalette } from '@/lib/data/palettes/loader';
import { calculateUsage } from '@/lib/utils/usage-calculator';
import { HistoryManager } from '@/lib/utils/history';
import ImageUploader from '@/components/ImageUploader';
import ParameterPanel from '@/components/ParameterPanel';
import PatternPreview from '@/components/PatternPreview';
import PatternEditor from '@/components/PatternEditor';
import ColorPicker from '@/components/ColorPicker';
import BeadUsageList from '@/components/BeadUsageList';
import ExportPanel from '@/components/ExportPanel';

export default function Home() {
  const [brand, setBrand] = useState<BeadBrand>('perler');
  const [width, setWidth] = useState(29);
  const [height, setHeight] = useState(29);
  const [dithering, setDithering] = useState<DitheringMode>('none');
  const [background, setBackground] = useState<BackgroundMode>('white');
  const [pattern, setPattern] = useState<BeadPattern | null>(null);
  const [palette, setPalette] = useState<CompiledBeadColor[]>([]);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [history] = useState(() => new HistoryManager());

  const usage = useMemo<BeadUsageItem[]>(
    () => (pattern && palette.length ? calculateUsage(pattern, palette) : []),
    [pattern, palette]
  );

  const generate = useCallback(async (file: File, b: BeadBrand, w: number, h: number, dith: DitheringMode, bg: BackgroundMode) => {
    setLoading(true);
    try {
      const pal = await loadPalette(b);
      setPalette(pal);
      const img = await loadImage(file);
      const loaded = imageToPixels(img, bg);
      const pixels = downscale(loaded.data, loaded.width, loaded.height, w, h);

      const matchFn = (p: { r: number; g: number; b: number }) => {
        const c = matchColor(p, pal);
        return { r: c.rgb[0], g: c.rgb[1], b: c.rgb[2] };
      };
      const dithered = applyDithering(pixels, w, h, dith, matchFn);
      const matched = dith === 'none' ? matchColors(pixels, pal) : matchColors(dithered, pal);

      const cells = Array.from({ length: h }, (_, y) =>
        Array.from({ length: w }, (_, x) => ({ colorId: matched[y * w + x].id }))
      );

      setPattern({
        version: 1,
        metadata: { brand: b, width: w, height: h, dithering: dith, background: bg, createdAt: new Date().toISOString() },
        cells,
      });
      history.clear();
    } finally {
      setLoading(false);
    }
  }, [history]);

  const handleImageSelected = useCallback((file: File) => {
    setImageFile(file);
    generate(file, brand, width, height, dithering, background);
  }, [brand, width, height, dithering, background, generate]);

  const handleRegenerate = useCallback(() => {
    if (imageFile) generate(imageFile, brand, width, height, dithering, background);
  }, [imageFile, brand, width, height, dithering, background, generate]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (!pattern || !selectedColorId) return;
    const oldColorId = pattern.cells[row][col].colorId;
    if (oldColorId === selectedColorId) return;
    const op: PatchOp = { type: 'set', row, col, oldColorId, newColorId: selectedColorId };
    history.push([op]);
    const newCells = pattern.cells.map(r => [...r]);
    newCells[row][col] = { colorId: selectedColorId };
    setPattern({ ...pattern, cells: newCells });
  }, [pattern, selectedColorId, history]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <h1 className="text-2xl font-bold">🎨 拼豆图纸生成器</h1>
        <p className="text-sm text-gray-500">Perler / Hama / Artkal — CIEDE2000 色彩匹配</p>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <ImageUploader onImageSelected={handleImageSelected} />

        <ParameterPanel
          brand={brand} width={width} height={height} dithering={dithering} background={background}
          onBrandChange={b => { setBrand(b); if (imageFile) generate(imageFile, b, width, height, dithering, background); }}
          onWidthChange={setWidth} onHeightChange={setHeight}
          onDitheringChange={setDithering} onBackgroundChange={setBackground}
        />

        {imageFile && (
          <button onClick={handleRegenerate} disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium">
            {loading ? '⏳ 生成中...' : '🔄 重新生成'}
          </button>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PatternPreview pattern={pattern} palette={palette} onCellClick={handleCellClick} />
          </div>
          <div className="space-y-4">
            {pattern && (
              <>
                <PatternEditor pattern={pattern} palette={palette} history={history}
                  selectedColorId={selectedColorId} onPatternChange={setPattern} />
                <ColorPicker palette={palette} selectedId={selectedColorId} onSelect={setSelectedColorId} />
                <ExportPanel pattern={pattern} palette={palette} />
                <BeadUsageList usage={usage} />
              </>
            )}
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 py-6">
        拼豆图纸生成器 — 开源免费 — CIEDE2000 感知色差匹配
      </footer>
    </div>
  );
}
