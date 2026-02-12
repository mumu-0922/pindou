# PinDou 拼豆图纸生成器

[English](#english) | [中文](#中文)

---

<a id="中文"></a>

## 🎨 简介

PinDou 是一款免费的在线拼豆图纸生成器。上传任意图片，使用 CIEDE2000 感知色差算法精准匹配 155 种真实拼豆颜色，支持导出 PNG / PDF 图纸。

**所有处理都在浏览器本地完成，图片不会上传到任何服务器。**

## ✨ 特性

- 🎨 **155 色真实色板** — Perler (70) / Hama (50) / Artkal S (35)
- 🔬 **CIEDE2000 色差匹配** — 感知色差金标准，肤色渐变阴影精准还原
- 📐 **线性 RGB 下采样** — Gamma-correct 均值算法，避免亮度偏差
- 📄 **PDF 1:1 标尺导出** — 校准框 + 十字准星 + 分板定位，打印即用
- ✏️ **逐格编辑 + 撤销** — 差量 patch 撤销/重做，内存占用极低
- 🔒 **100% 浏览器端处理** — 隐私安全有保障
- 🌐 **中英文切换** — 一键切换界面语言

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

打开 [http://localhost:3000](http://localhost:3000) 即可使用。

## 📖 使用方法

1. **上传图片** — 拖拽或点击上传 PNG / JPG / WebP
2. **调整参数** — 选择品牌、尺寸、抖动模式
3. **导出图纸** — 下载 PNG / PDF，附带色号和用量清单

## 🛠️ 技术栈

- **Next.js 16** + React 19
- **Tailwind CSS 4**
- **CIEDE2000** 色差算法 (color-diff)
- **jsPDF** PDF 导出
- **Vitest** 测试框架

## 📄 许可证

MIT

---

<a id="english"></a>

## 🎨 Introduction

PinDou is a free online bead pattern generator. Upload any image and use the CIEDE2000 perceptual color difference algorithm to accurately match 155 real bead colors. Export patterns as PNG or PDF.

**All processing happens locally in your browser — images are never uploaded to any server.**

## ✨ Features

- 🎨 **155 Real Bead Colors** — Perler (70) / Hama (50) / Artkal S (35)
- 🔬 **CIEDE2000 Color Matching** — Gold-standard perceptual color difference
- 📐 **Linear RGB Downsampling** — Gamma-correct averaging, no brightness bias
- 📄 **PDF 1:1 Ruler Export** — Calibration box + crosshair + board positioning
- ✏️ **Per-cell Edit + Undo** — Delta patch undo/redo with minimal memory
- 🔒 **100% Browser Processing** — Your images never leave your device
- 🌐 **Bilingual UI** — Switch between Chinese and English

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Production build
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

## 📖 Usage

1. **Upload Image** — Drag & drop or click to upload PNG / JPG / WebP
2. **Adjust Settings** — Choose brand, size, and dithering mode
3. **Export Pattern** — Download PNG / PDF with color codes and usage list

## 🛠️ Tech Stack

- **Next.js 16** + React 19
- **Tailwind CSS 4**
- **CIEDE2000** color difference (color-diff)
- **jsPDF** for PDF export
- **Vitest** for testing

## 📄 License

MIT
