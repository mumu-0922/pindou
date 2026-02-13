# 🎨 PinDou — Bead Pattern Generator

> [📖 中文版](./README.md)

Free online bead pattern generator. Upload any image and use the CIEDE2000 perceptual color difference algorithm to accurately match real bead colors. Export patterns as PNG or PDF.

**All processing happens locally in your browser — images are never uploaded to any server.**

🌐 Live Demo: [pindou-e90.pages.dev](https://pindou-e90.pages.dev/)

## ✨ Features

- 🎨 **8 Brands, 1600+ Real Colors** — Perler / Hama / Artkal S / MARD / COCO / Manman / Panpan / Mixiaowo
- 🔬 **CIEDE2000 Color Matching** — Gold-standard perceptual color difference
- 📐 **Linear RGB Downsampling** — Gamma-correct average / dominant mode, no brightness bias
- 📄 **PDF Export** — Full overview + per-board detail pages with calibration box & crosshairs
- 📥 **PNG Multi-Quality Export** — Standard / HD / Ultra HD / Print, async rendering
- ✏️ **Per-cell Edit + Undo** — Click edit, Shift+click flood fill, batch color replace
- 🧩 **Focus Assembly Mode** — Per-color guidance, BFS region marking, progress tracking, timer
- 🎛️ **Custom Palette** — Filter available colors per brand for precise color control
- 🔒 **100% Browser Processing** — Your images never leave your device
- 🌐 **Bilingual UI** — Switch between Chinese and English

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

```bash
npm run build    # Static site build (out/)
npm test         # Run tests
npm run lint     # Lint check
```

## 📖 Usage

1. **Upload Image** — Drag & drop or click to upload PNG / JPG / WebP
2. **Adjust Settings** — Choose brand, size, dithering, brightness/contrast/saturation
3. **Edit Pattern** — Per-cell color editing, flood fill, batch replace
4. **Export Pattern** — Select quality, download PNG / PDF with color codes and usage list
5. **Focus Assembly** — Enter Focus mode for per-color guided bead placement

## 🛠️ Tech Stack

- **Next.js 16** + React 19 (static export)
- **Tailwind CSS 4** + shadcn/ui
- **CIEDE2000** color difference (color-diff)
- **jsPDF** for PDF export
- **Vitest** for testing

## 📄 License

MIT
