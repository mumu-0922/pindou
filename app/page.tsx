'use client';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import type { BeadPattern, BeadBrand, DitheringMode, CompiledBeadColor, BeadUsageItem, PatchOp } from '@/lib/types/bead';
import type { BackgroundMode } from '@/lib/engine/image-loader';
import { loadImage, imageToPixels } from '@/lib/engine/image-loader';
import { downscale } from '@/lib/engine/downscaler';
import type { PixelationMode } from '@/lib/engine/downscaler';
import { matchColor, matchColors } from '@/lib/engine/color-matcher';
import { applyDithering } from '@/lib/engine/dithering';
import { adjustPixels } from '@/lib/engine/adjustments';
import { loadPalette } from '@/lib/data/palettes/loader';
import { calculateUsage } from '@/lib/utils/usage-calculator';
import { HistoryManager } from '@/lib/utils/history';
import { useI18n } from '@/lib/i18n/context';
import ImageUploader from '@/components/ImageUploader';
import ParameterPanel from '@/components/ParameterPanel';
import PatternPreview from '@/components/PatternPreview';
import PatternEditor from '@/components/PatternEditor';
import ColorPicker from '@/components/ColorPicker';
import PaletteEditor from '@/components/PaletteEditor';
import BeadUsageList from '@/components/BeadUsageList';
import ExportPanel from '@/components/ExportPanel';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { t, lang, setLang } = useI18n();
  const [dark, setDark] = useState(false);
  const [brand, setBrand] = useState<BeadBrand>('perler');
  const [width, setWidth] = useState(29);
  const [height, setHeight] = useState(29);
  const [dithering, setDithering] = useState<DitheringMode>('none');
  const [background, setBackground] = useState<BackgroundMode>('white');
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [maxColors, setMaxColors] = useState(0);
  const [pixMode, setPixMode] = useState<PixelationMode>('average');
  const [lockRatio, setLockRatio] = useState(true);
  const [aspectRatio, setAspectRatio] = useState(1);
  const [pattern, setPattern] = useState<BeadPattern | null>(null);
  const [palette, setPalette] = useState<CompiledBeadColor[]>([]);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [customIds, setCustomIds] = useState<Set<string> | null>(null);
  const [showPaletteEditor, setShowPaletteEditor] = useState(false);
  const [fullPalette, setFullPalette] = useState<CompiledBeadColor[]>([]);
  const genId = useRef(0);

  const [history] = useState(() => new HistoryManager());

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const usage = useMemo<BeadUsageItem[]>(
    () => (pattern && palette.length ? calculateUsage(pattern, palette) : []),
    [pattern, palette]
  );

  const colorCount = useMemo(() => {
    if (!pattern) return 0;
    const ids = new Set<string>();
    for (const row of pattern.cells) for (const c of row) ids.add(c.colorId);
    return ids.size;
  }, [pattern]);

  const FEATURES = [
    { icon: '🎨', title: t('feat1.title'), desc: t('feat1.desc') },
    { icon: '🔬', title: t('feat2.title'), desc: t('feat2.desc') },
    { icon: '📐', title: t('feat3.title'), desc: t('feat3.desc') },
    { icon: '📄', title: t('feat4.title'), desc: t('feat4.desc') },
    { icon: '✏️', title: t('feat5.title'), desc: t('feat5.desc') },
    { icon: '🔒', title: t('feat6.title'), desc: t('feat6.desc') },
  ];

  const STEPS = [
    { num: '01', title: t('step1.title'), desc: t('step1.desc') },
    { num: '02', title: t('step2.title'), desc: t('step2.desc') },
    { num: '03', title: t('step3.title'), desc: t('step3.desc') },
  ];

  const REVIEWS = [
    { name: t('review1.name'), role: t('review1.role'), text: t('review1.text') },
    { name: t('review2.name'), role: t('review2.role'), text: t('review2.text') },
    { name: t('review3.name'), role: t('review3.role'), text: t('review3.text') },
  ];

  const FAQS = [
    { q: t('faq1.q'), a: t('faq1.a') },
    { q: t('faq2.q'), a: t('faq2.a') },
    { q: t('faq3.q'), a: t('faq3.a') },
    { q: t('faq4.q'), a: t('faq4.a') },
    { q: t('faq5.q'), a: t('faq5.a') },
  ];

  const generate = useCallback(async (file: File, b: BeadBrand, w: number, h: number, dith: DitheringMode, bg: BackgroundMode, bri: number, con: number, sat: number, mc: number, cIds: Set<string> | null = null, pm: PixelationMode = 'average') => {
    const myId = ++genId.current;
    setLoading(true);
    try {
      const fullPal = await loadPalette(b);
      if (myId !== genId.current) return;
      setFullPalette(fullPal);
      let pal = cIds && cIds.size > 0 ? fullPal.filter(c => cIds.has(c.id)) : fullPal;
      if (pal.length === 0) pal = fullPal;

      // maxColors: keep only the top N most-used colors after initial match
      const img = await loadImage(file);
      if (myId !== genId.current) return;
      const loaded = imageToPixels(img, bg);
      const pixels = downscale(loaded.data, loaded.width, loaded.height, w, h, pm);

      // Apply brightness/contrast/saturation
      const adjusted = adjustPixels(pixels, bri, con, sat);

      const matchFn = (p: { r: number; g: number; b: number }) => {
        const c = matchColor(p, pal);
        return { r: c.rgb[0], g: c.rgb[1], b: c.rgb[2] };
      };
      const dithered = applyDithering(adjusted, w, h, dith, matchFn);
      let matched = dith === 'none' ? matchColors(adjusted, pal) : matchColors(dithered, pal);

      // Limit max colors
      if (mc > 0 && mc < pal.length) {
        const freq = new Map<string, number>();
        for (const c of matched) freq.set(c.id, (freq.get(c.id) || 0) + 1);
        const topIds = new Set(
          [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, mc).map(e => e[0])
        );
        const limitedPal = pal.filter(c => topIds.has(c.id));
        matched = dith === 'none' ? matchColors(adjusted, limitedPal) : matchColors(dithered, limitedPal);
        pal = limitedPal;
      }

      if (myId !== genId.current) return;
      setPalette(pal);

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
      if (myId === genId.current) setLoading(false);
    }
  }, [history]);

  const handleImageSelected = useCallback((file: File) => {
    setImageFile(file);
    // Compute aspect ratio from image
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const ar = img.naturalWidth / img.naturalHeight;
      setAspectRatio(ar);
      const newH = Math.round(width / ar);
      setHeight(Math.max(1, Math.min(200, newH)));
      generate(file, brand, width, Math.max(1, Math.min(200, newH)), dithering, background, brightness, contrast, saturation, maxColors, customIds, pixMode);
    };
    img.src = URL.createObjectURL(file);
  }, [brand, width, dithering, background, brightness, contrast, saturation, maxColors, customIds, pixMode, generate]);

  // 参数变更自动重新生成
  useEffect(() => {
    if (imageFile) generate(imageFile, brand, width, height, dithering, background, brightness, contrast, saturation, maxColors, customIds, pixMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand, width, height, dithering, background, brightness, contrast, saturation, maxColors, customIds, pixMode]);

  // 品牌切换时重置自定义色板
  useEffect(() => {
    const key = `pindou-custom-palette-${brand}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try { setCustomIds(new Set(JSON.parse(saved))); } catch { setCustomIds(null); }
    } else {
      setCustomIds(null);
    }
  }, [brand]);

  const handleApplyCustomPalette = useCallback((ids: Set<string>) => {
    setCustomIds(ids.size === fullPalette.length ? null : ids);
    const key = `pindou-custom-palette-${brand}`;
    if (ids.size === fullPalette.length) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify([...ids]));
    }
  }, [brand, fullPalette]);

  const handleCellClick = useCallback((row: number, col: number, shiftKey: boolean) => {
    if (!pattern || !selectedColorId) return;
    const oldColorId = pattern.cells[row][col].colorId;
    if (oldColorId === selectedColorId) return;

    const newCells = pattern.cells.map(r => [...r]);
    const ops: PatchOp[] = [];

    if (shiftKey) {
      // Flood fill BFS
      const { width: w, height: h } = pattern.metadata;
      const visited = new Set<number>();
      const queue = [row * w + col];
      visited.add(row * w + col);
      while (queue.length) {
        const idx = queue.shift()!;
        const r = Math.floor(idx / w), c = idx % w;
        ops.push({ type: 'set', row: r, col: c, oldColorId, newColorId: selectedColorId });
        newCells[r][c] = { colorId: selectedColorId };
        for (const [dr, dc] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
          const nr = r + dr, nc = c + dc;
          const ni = nr * w + nc;
          if (nr >= 0 && nr < h && nc >= 0 && nc < w && !visited.has(ni) && pattern.cells[nr][nc].colorId === oldColorId) {
            visited.add(ni);
            queue.push(ni);
          }
        }
      }
    } else {
      ops.push({ type: 'set', row, col, oldColorId, newColorId: selectedColorId });
      newCells[row][col] = { colorId: selectedColorId };
    }

    history.push(ops);
    setPattern({ ...pattern, cells: newCells });
  }, [pattern, selectedColorId, history]);

  return (
    <div className={`min-h-screen transition-colors ${dark ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Nav */}
      <nav className={`sticky top-0 z-50 backdrop-blur-md border-b ${dark ? 'bg-gray-950/80 border-gray-800' : 'bg-white/80 border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎨</span>
            <span className="font-bold text-lg">PinDou</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${dark ? 'bg-pink-900 text-pink-300' : 'bg-pink-100 text-pink-600'}`}>{t('nav.colors')}</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#tool" className="text-sm hover:underline">{t('nav.start')}</a>
            <a href="#features" className="text-sm hover:underline hidden sm:inline">{t('nav.features')}</a>
            <a href="#faq" className="text-sm hover:underline hidden sm:inline">{t('nav.faq')}</a>
            <Button variant="ghost" size="sm" onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}>
              {lang === 'zh' ? 'EN' : '中'}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setDark(!dark)}>
              {dark ? '☀️' : '🌙'}
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-gradient text-white py-24 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight animate-fade-up">
            {t('hero.title')}
          </h1>
          <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto animate-fade-up-d1">
            {t('hero.desc')}
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm animate-fade-up-d2">
            <span className="bg-white/20 backdrop-blur px-4 py-2 rounded-full">{t('hero.noReg')}</span>
            <span className="bg-white/20 backdrop-blur px-4 py-2 rounded-full">{t('hero.local')}</span>
            <span className="bg-white/20 backdrop-blur px-4 py-2 rounded-full">{t('hero.free')}</span>
          </div>
          <a href="#tool" className="btn-glow inline-block mt-4 px-10 py-4 bg-white text-pink-600 font-bold rounded-full text-lg animate-fade-up-d3">
            {t('hero.cta')}
          </a>
        </div>
      </section>

      {/* 3 Steps */}
      <section className={`py-20 px-6 ${dark ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">{t('steps.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map(s => (
              <div key={s.num} className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-fuchsia-500 text-white text-xl font-bold shadow-lg">{s.num}</div>
                <h3 className="font-semibold text-lg">{s.title}</h3>
                <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tool Section */}
      <section id="tool" className={`py-16 px-6 ${dark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold text-center">{t('tool.title')}</h2>

          <ImageUploader onImageSelected={handleImageSelected} />

          <ParameterPanel
            brand={brand} width={width} height={height} dithering={dithering} background={background}
            brightness={brightness} contrast={contrast} saturation={saturation}
            maxColors={maxColors} pixMode={pixMode} lockRatio={lockRatio} aspectRatio={aspectRatio}
            onBrandChange={setBrand} onWidthChange={setWidth} onHeightChange={setHeight}
            onDitheringChange={setDithering} onBackgroundChange={setBackground}
            onBrightnessChange={setBrightness} onContrastChange={setContrast}
            onSaturationChange={setSaturation} onMaxColorsChange={setMaxColors}
            onPixModeChange={setPixMode} onLockRatioChange={setLockRatio}
          />

          {fullPalette.length > 0 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowPaletteEditor(true)}>
                🎨 {t('palette.edit')} {customIds ? `(${customIds.size}/${fullPalette.length})` : ''}
              </Button>
              {customIds && (
                <Button variant="ghost" size="sm" className="text-xs text-pink-500 dark:text-pink-400" onClick={() => { setCustomIds(null); localStorage.removeItem(`pindou-custom-palette-${brand}`); }}>
                  ↺ {t('param.reset')}
                </Button>
              )}
            </div>
          )}

          {showPaletteEditor && (
            <PaletteEditor
              palette={fullPalette}
              selectedIds={customIds ?? new Set(fullPalette.map(c => c.id))}
              onApply={handleApplyCustomPalette}
              onClose={() => setShowPaletteEditor(false)}
            />
          )}

          {loading && (
            <div className="flex items-center gap-2 text-sm text-pink-500 dark:text-pink-400">
              <span className="animate-spin">⏳</span> {t('tool.generating')}
            </div>
          )}

          {/* Focus mode button + Stats ribbon */}
          {pattern && (
            <div className="flex flex-wrap gap-4 text-sm items-center">
              <button
                onClick={() => {
                  localStorage.setItem('pindou-focus-data', JSON.stringify({ pattern, palette }));
                  window.location.href = '/focus';
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500 text-white font-medium hover:bg-pink-600 transition text-sm"
              >
                {t('focus.enter')}
              </button>
            </div>
          )}
          {pattern && (
            <div className="flex flex-wrap gap-4 text-sm">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${dark ? 'bg-gray-800' : 'bg-white shadow-sm border border-gray-200'}`}>
                <span>🎨</span> <span>{t('param.colorCount')}: <b className="text-pink-500 dark:text-pink-400">{colorCount}</b></span>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${dark ? 'bg-gray-800' : 'bg-white shadow-sm border border-gray-200'}`}>
                <span>📐</span> <span>{width}×{height} = <b className="text-pink-500 dark:text-pink-400">{(width * height).toLocaleString()}</b> {t('usage.unit')}</span>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${dark ? 'bg-gray-800' : 'bg-white shadow-sm border border-gray-200'}`}>
                <span>🧩</span> <span>{t('param.boardCount')}: <b className="text-pink-500 dark:text-pink-400">{Math.ceil(width / 29) * Math.ceil(height / 29)}</b> {t('param.boardUnit')}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className={`card-premium overflow-hidden ${dark ? 'bg-gray-900' : 'bg-white'}`}>
                <PatternPreview pattern={pattern} palette={palette} onCellClick={handleCellClick} />
              </div>
            </div>
            <div className="space-y-4">
              {pattern && (
                <>
                  <div className={`card-premium p-4 ${dark ? 'bg-gray-900' : 'bg-white'}`}>
                    <PatternEditor pattern={pattern} palette={palette} history={history}
                      selectedColorId={selectedColorId} onPatternChange={setPattern} />
                  </div>
                  <div className={`card-premium p-4 ${dark ? 'bg-gray-900' : 'bg-white'}`}>
                    <ColorPicker palette={palette} selectedId={selectedColorId} onSelect={setSelectedColorId} />
                  </div>
                  <div className={`card-premium p-4 ${dark ? 'bg-gray-900' : 'bg-white'}`}>
                    <ExportPanel pattern={pattern} palette={palette} />
                  </div>
                  <div className={`card-premium p-4 ${dark ? 'bg-gray-900' : 'bg-white'}`}>
                    <BeadUsageList usage={usage} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className={`py-20 px-6 ${dark ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-3">{t('features.title')}</h2>
          <p className={`text-center mb-12 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{t('features.subtitle')}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className={`feature-card card-premium p-6 ${dark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className={`py-20 px-6 ${dark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">{t('reviews.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {REVIEWS.map(r => (
              <div key={r.name} className={`card-premium p-6 ${dark ? 'bg-gray-900' : 'bg-white'}`}>
                <div className="flex items-center gap-1 text-pink-400 mb-3">{'★★★★★'}</div>
                <p className={`text-sm mb-4 ${dark ? 'text-gray-300' : 'text-gray-600'}`}>&ldquo;{r.text}&rdquo;</p>
                <div>
                  <div className="font-semibold text-sm">{r.name}</div>
                  <div className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{r.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className={`py-20 px-6 ${dark ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">{t('faq.title')}</h2>
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <div key={i} className={`card-premium overflow-hidden ${dark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className={`w-full text-left px-6 py-4 flex items-center justify-between font-medium ${dark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'}`}>
                  {f.q}
                  <span className={`transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {openFaq === i && (
                  <div className={`px-6 pb-4 text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="hero-gradient text-white py-20 px-6 text-center">
        <h2 className="text-4xl font-bold mb-4">{t('cta.title')}</h2>
        <p className="opacity-90 mb-8 text-lg">{t('cta.subtitle')}</p>
        <a href="#tool" className="btn-glow inline-block px-10 py-4 bg-white text-pink-600 font-bold rounded-full text-lg">
          {t('cta.btn')}
        </a>
      </section>

      {/* Footer */}
      <footer className={`py-10 px-6 ${dark ? 'bg-gray-950 border-t border-gray-800' : 'bg-white border-t border-gray-200'}`}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎨</span>
            <span className="font-bold">PinDou</span>
            <span className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{t('footer.tagline')}</span>
          </div>
          <div className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
            {t('footer.desc')}
          </div>
        </div>
      </footer>
    </div>
  );
}
