# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Next.js dev server (Turbopack)
npm run build        # Production build (static export to out/)
npm run lint         # ESLint
npm test             # Vitest unit tests
npm run test:bench   # Vitest benchmarks
npx vitest run path/to/test.ts  # Run single test file
```

Build output is static (`output: 'export'` in next.config.ts) — no server runtime. All routes generate as static HTML.

## Architecture

**Browser-only bead pattern generator.** Images never leave the device. The processing pipeline is:

```
Image upload → downscale → adjust (brightness/contrast/saturation)
  → dither (optional Floyd-Steinberg) → CIEDE2000 color match → BeadPattern
```

### Core Pipeline (`lib/engine/`)

- `image-loader.ts` — Load File to RGBA pixels, alpha blending with background
- `downscaler.ts` — Linear RGB gamma-correct area averaging or dominant-color mode
- `adjustments.ts` — Brightness/contrast/saturation in RGB space
- `dithering.ts` — Floyd-Steinberg error diffusion
- `color-matcher.ts` — CIEDE2000 perceptual matching against bead palette (LAB color space)
- `pipeline.ts` — Orchestrates the full flow, returns `BeadPattern`

### Key Types (`lib/types/bead.ts`)

- `BeadPattern` — `{ version, metadata, cells: BeadCell[][] }` — the central data structure
- `CompiledBeadColor` — Palette entry with id, hex, rgb, lab, code, name
- `PatchOp` — Delta for undo/redo system

### Export (`lib/export/`)

- `png-exporter.ts` — Async chunked canvas rendering (8 rows/frame via requestAnimationFrame). Auto-clamps cellSize to browser canvas limits (16384px / 256M pixels).
- `pdf-exporter.ts` — jsPDF multi-page: overview page (if >1 board) + per-board detail pages with 10mm calibration box, crosshairs, color codes. Boards split at 29×29.

### Data Flow

- **Main page** (`app/page.tsx`): Generates pattern + palette, manages all editing state, undo/redo via `HistoryManager`
- **Focus mode** (`app/focus/page.tsx`): Receives data via `localStorage('pindou-focus-data')`, provides per-color guided assembly with BFS region marking
- **Palettes** (`lib/data/palettes/`): JSON files per brand, loaded async with caching via `loader.ts`. 8 brands, 155+ colors total.

### i18n (`lib/i18n/`)

- `context.tsx` — React context with `useI18n()` hook returning `{ t, lang, setLang }`
- `zh.ts` — Source of truth; exports `I18nKey` type
- `en.ts` — Must match all keys from zh.ts (`Record<I18nKey, string>`)

### UI Components

- `components/ui/` — shadcn/ui primitives (Radix + Tailwind, new-york style)
- `components/` — Domain components: ImageUploader, ParameterPanel, PatternPreview (canvas zoom/pan), PatternEditor (undo/redo + batch replace), ColorPicker, PaletteEditor, BeadUsageList, ExportPanel

## Key Conventions

- **Static export**: No API routes, no server components with dynamic data. `app/` pages must be statically exportable.
- **Path alias**: `@/` maps to project root.
- **Styling**: Tailwind CSS 4 via PostCSS. Dark mode via `.dark` class on `<html>`. CSS variables in `globals.css`.
- **i18n**: Adding features requires updating both `zh.ts` and `en.ts`. zh.ts defines the `I18nKey` type.
- **No external image processing**: Everything runs in-browser with Canvas API and typed arrays.
