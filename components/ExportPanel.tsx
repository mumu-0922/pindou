'use client';
import type { BeadPattern, CompiledBeadColor } from '@/lib/types/bead';
import { renderPatternToCanvas, canvasToBlob, downloadBlob } from '@/lib/export/png-exporter';
import { exportPdf, downloadPdf } from '@/lib/export/pdf-exporter';

interface Props {
  pattern: BeadPattern | null;
  palette: CompiledBeadColor[];
}

export default function ExportPanel({ pattern, palette }: Props) {
  if (!pattern) return null;

  const fname = `bead-${pattern.metadata.brand}-${pattern.metadata.width}x${pattern.metadata.height}`;

  const handlePng = async () => {
    const canvas = renderPatternToCanvas(pattern, palette, 20, true, true);
    const blob = await canvasToBlob(canvas);
    downloadBlob(blob, `${fname}.png`);
  };

  const handlePdf = () => {
    const doc = exportPdf({ pattern, palette, showCodes: true });
    downloadPdf(doc, `${fname}.pdf`);
  };

  const btn = 'flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all hover:shadow-md active:scale-95';

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">导出图纸</h3>
      <div className="flex gap-3">
        <button onClick={handlePng}
          className={`${btn} bg-emerald-600 text-white hover:bg-emerald-700`}>
          📥 PNG
        </button>
        <button onClick={handlePdf}
          className={`${btn} bg-rose-600 text-white hover:bg-rose-700`}>
          📄 PDF
        </button>
      </div>
    </div>
  );
}
