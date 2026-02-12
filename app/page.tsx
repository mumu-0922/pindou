'use client';
import { useState, useMemo, useCallback, useEffect } from 'react';
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

const FEATURES = [
  { icon: '🎨', title: '155色真实色板', desc: '覆盖 Perler(70) / Hama(50) / Artkal(35)，每种颜色都能买到实物' },
  { icon: '🔬', title: 'CIEDE2000 色差匹配', desc: '感知色差金标准算法，肤色、渐变、阴影都精准还原' },
  { icon: '📐', title: '线性RGB下采样', desc: 'Gamma-correct 均值算法，避免传统下采样的亮度偏差' },
  { icon: '📄', title: 'PDF 1:1 标尺导出', desc: '校准框+十字准星+分板定位，打印即用' },
  { icon: '✏️', title: '逐格编辑+撤销', desc: '差量 patch 撤销/重做，内存占用极低' },
  { icon: '🔒', title: '100% 浏览器端处理', desc: '图片不上传服务器，隐私安全有保障' },
];

const STEPS = [
  { num: '01', title: '上传图片', desc: '拖拽或点击上传 PNG/JPG/WebP，支持透明图片' },
  { num: '02', title: '调整参数', desc: '选择品牌、尺寸、抖动模式，实时预览效果' },
  { num: '03', title: '导出图纸', desc: '下载 PNG/PDF 图纸，附带色号和用量清单' },
];

const REVIEWS = [
  { name: 'Emily', role: '手工爱好者', text: '终于找到颜色准确的生成器了！做了一个马里奥，颜色和实物完全一致。' },
  { name: 'Sarah', role: 'Etsy 卖家', text: '以前手绘图纸要几小时，现在几分钟搞定。用量清单帮我精确控制成本。' },
  { name: '小明', role: '拼豆新手', text: '第一次做拼豆就成功了！PDF打印出来跟着做就行，色号标得很清楚。' },
];

const FAQS = [
  { q: '需要注册账号吗？', a: '不需要。直接上传图片即可使用，无需注册、无需登录。' },
  { q: '支持哪些拼豆品牌？', a: '目前支持 Perler（70色）、Hama（50色）、Artkal S系列（35色），共155种颜色。' },
  { q: '图片会上传到服务器吗？', a: '不会。所有图像处理都在浏览器本地完成，你的图片不会离开你的设备。' },
  { q: '为什么颜色比其他工具更准？', a: '我们使用 CIEDE2000 感知色差算法 + 线性RGB下采样，这是色彩科学的金标准。' },
  { q: 'PDF 打印出来尺寸对吗？', a: '每页左上角有 10mm×10mm 校准框，打印后量一下即可验证缩放比例。' },
];

export default function Home() {
  const [dark, setDark] = useState(false);
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
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [history] = useState(() => new HistoryManager());

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

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

  // 参数变更自动重新生成
  useEffect(() => {
    if (imageFile) generate(imageFile, brand, width, height, dithering, background);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand, width, height, dithering, background]);

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
    <div className={`min-h-screen transition-colors ${dark ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Nav */}
      <nav className={`sticky top-0 z-50 backdrop-blur-md border-b ${dark ? 'bg-gray-950/80 border-gray-800' : 'bg-white/80 border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎨</span>
            <span className="font-bold text-lg">PinDou</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${dark ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>155色</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#tool" className="text-sm hover:underline">开始创作</a>
            <a href="#features" className="text-sm hover:underline hidden sm:inline">特性</a>
            <a href="#faq" className="text-sm hover:underline hidden sm:inline">FAQ</a>
            <button onClick={() => setDark(!dark)} className={`p-2 rounded-lg ${dark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`}>
              {dark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-gradient text-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
            图片秒变拼豆图纸
          </h1>
          <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
            上传任意图片，CIEDE2000 感知色差算法精准匹配 155 种真实拼豆颜色。
            支持 Perler / Hama / Artkal，免费导出 PNG & PDF 图纸。
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            <span className="bg-white/20 backdrop-blur px-3 py-1.5 rounded-full">✅ 无需注册</span>
            <span className="bg-white/20 backdrop-blur px-3 py-1.5 rounded-full">✅ 浏览器端处理</span>
            <span className="bg-white/20 backdrop-blur px-3 py-1.5 rounded-full">✅ 完全免费</span>
          </div>
          <a href="#tool" className="inline-block mt-4 px-8 py-3 bg-white text-purple-700 font-bold rounded-full hover:shadow-lg hover:scale-105 transition-all">
            🚀 立即开始
          </a>
        </div>
      </section>

      {/* 3 Steps */}
      <section className={`py-16 px-6 ${dark ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">三步生成拼豆图纸</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map(s => (
              <div key={s.num} className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xl font-bold">{s.num}</div>
                <h3 className="font-semibold text-lg">{s.title}</h3>
                <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tool Section */}
      <section id="tool" className={`py-12 px-6 ${dark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold text-center">🛠️ 图纸生成器</h2>

          <ImageUploader onImageSelected={handleImageSelected} />

          <ParameterPanel
            brand={brand} width={width} height={height} dithering={dithering} background={background}
            onBrandChange={setBrand} onWidthChange={setWidth} onHeightChange={setHeight}
            onDitheringChange={setDithering} onBackgroundChange={setBackground}
          />

          {loading && (
            <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
              <span className="animate-spin">⏳</span> 生成中...
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className={`rounded-xl overflow-hidden ${dark ? 'bg-gray-900 border border-gray-800' : 'bg-white shadow-sm border border-gray-200'}`}>
                <PatternPreview pattern={pattern} palette={palette} onCellClick={handleCellClick} />
              </div>
            </div>
            <div className="space-y-4">
              {pattern && (
                <>
                  <div className={`p-4 rounded-xl ${dark ? 'bg-gray-900 border border-gray-800' : 'bg-white shadow-sm border border-gray-200'}`}>
                    <PatternEditor pattern={pattern} palette={palette} history={history}
                      selectedColorId={selectedColorId} onPatternChange={setPattern} />
                  </div>
                  <div className={`p-4 rounded-xl ${dark ? 'bg-gray-900 border border-gray-800' : 'bg-white shadow-sm border border-gray-200'}`}>
                    <ColorPicker palette={palette} selectedId={selectedColorId} onSelect={setSelectedColorId} />
                  </div>
                  <div className={`p-4 rounded-xl ${dark ? 'bg-gray-900 border border-gray-800' : 'bg-white shadow-sm border border-gray-200'}`}>
                    <ExportPanel pattern={pattern} palette={palette} />
                  </div>
                  <div className={`p-4 rounded-xl ${dark ? 'bg-gray-900 border border-gray-800' : 'bg-white shadow-sm border border-gray-200'}`}>
                    <BeadUsageList usage={usage} />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className={`py-16 px-6 ${dark ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-3">为什么选择 PinDou？</h2>
          <p className={`text-center mb-10 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>专为真实拼豆项目设计，不是通用像素画工具</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className={`feature-card p-6 rounded-xl ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-100'}`}>
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className={`py-16 px-6 ${dark ? 'bg-gray-950' : 'bg-gray-50'}`}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">用户评价</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {REVIEWS.map(r => (
              <div key={r.name} className={`p-6 rounded-xl ${dark ? 'bg-gray-900 border border-gray-800' : 'bg-white shadow-sm border border-gray-100'}`}>
                <div className="flex items-center gap-1 text-yellow-400 mb-3">{'★★★★★'}</div>
                <p className={`text-sm mb-4 ${dark ? 'text-gray-300' : 'text-gray-600'}`}>"{r.text}"</p>
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
      <section id="faq" className={`py-16 px-6 ${dark ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">常见问题</h2>
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <div key={i} className={`rounded-xl overflow-hidden ${dark ? 'border border-gray-800' : 'border border-gray-200'}`}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className={`w-full text-left px-5 py-4 flex items-center justify-between font-medium ${dark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}>
                  {f.q}
                  <span className={`transition-transform ${openFaq === i ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {openFaq === i && (
                  <div className={`px-5 pb-4 text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{f.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="hero-gradient text-white py-16 px-6 text-center">
        <h2 className="text-3xl font-bold mb-4">开始创作你的拼豆图纸</h2>
        <p className="opacity-90 mb-6">免费、无需注册、浏览器端处理</p>
        <a href="#tool" className="inline-block px-8 py-3 bg-white text-purple-700 font-bold rounded-full hover:shadow-lg hover:scale-105 transition-all">
          🎨 立即开始
        </a>
      </section>

      {/* Footer */}
      <footer className={`py-8 px-6 ${dark ? 'bg-gray-950 border-t border-gray-800' : 'bg-white border-t border-gray-200'}`}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎨</span>
            <span className="font-bold">PinDou</span>
            <span className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>拼豆图纸生成器</span>
          </div>
          <div className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
            CIEDE2000 感知色差匹配 · Perler / Hama / Artkal · 155色 · 开源免费
          </div>
        </div>
      </footer>
    </div>
  );
}
