# PinDou 拼豆图纸生成器

[English](#english) | [中文](#中文)

---

<a id="中文"></a>

## 🎨 简介

PinDou 是一款免费的在线拼豆图纸生成器。上传任意图片，使用 CIEDE2000 感知色差算法精准匹配真实拼豆颜色，支持导出 PNG / PDF 图纸。

**所有处理都在浏览器本地完成，图片不会上传到任何服务器。**

## ✨ 特性

- 🎨 **8 品牌真实色板** — Perler / Hama / Artkal S / MARD / COCO / 漫漫 / 盼盼 / 咪小窝
- 🔬 **CIEDE2000 色差匹配** — 感知色差金标准，肤色渐变阴影精准还原
- 📐 **线性 RGB 下采样** — Gamma-correct 均值 / 主色模式，避免亮度偏差
- 📄 **PDF 导出** — 全图总览 + 分板详情，校准框 + 十字准星，打印即用
- 📥 **PNG 多画质导出** — 标准 / 高清 / 超清 / 印刷级，异步渲染不卡顿
- ✏️ **逐格编辑 + 撤销** — 单击编辑、Shift+点击油漆桶填充、批量替换颜色
- 🧩 **专注拼装模式** — 逐色引导、BFS 区域标记、进度追踪、计时器
- 🎛️ **自定义色板** — 按品牌筛选可用颜色，精确控制用色
- 🔒 **100% 浏览器端处理** — 隐私安全有保障
- 🌐 **中英文切换** — 一键切换界面语言

## 🚀 快速开始

```bash
npm install
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可使用。

```bash
npm run build    # 构建静态站点 (out/)
npm test         # 运行测试
npm run lint     # 代码检查
```

## 📖 使用方法

1. **上传图片** — 拖拽或点击上传 PNG / JPG / WebP
2. **调整参数** — 选择品牌、尺寸、抖动模式、亮度/对比度/饱和度
3. **编辑图纸** — 逐格修改颜色、油漆桶填充、批量替换
4. **导出图纸** — 选择画质，下载 PNG / PDF，附带色号和用量清单
5. **专注拼装** — 进入 Focus 模式，逐色引导完成实际拼豆

## 🛠️ 技术栈

- **Next.js 16** + React 19（静态导出）
- **Tailwind CSS 4** + shadcn/ui
- **CIEDE2000** 色差算法 (color-diff)
- **jsPDF** PDF 导出
- **Vitest** 测试框架

## 📄 许可证

MIT

---

<a id="english"></a>

## 🎨 Introduction

PinDou is a free online bead pattern generator. Upload any image and use the CIEDE2000 perceptual color difference algorithm to accurately match real bead colors. Export patterns as PNG or PDF.

**All processing happens locally in your browser — images are never uploaded to any server.**

## ✨ Features

- 🎨 **8 Bead Brands** — Perler / Hama / Artkal S / MARD / COCO / Manman / Panpan / Mixiaowo
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
