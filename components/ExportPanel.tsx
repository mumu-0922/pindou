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

  const handlePng = async () => {
    const canvas = renderPatternToCanvas(pattern, palette, 20, true, true);
    const blob = await canvasToBlob(canvas);
    downloadBlob(blob, `bead-pattern-${pattern.metadata.brand}-${pattern.metadata.width}x${pattern.metadata.height}.png`);
  };

  const handlePdf = () => {
    const doc = exportPdf({ pattern, palette, showCodes: true });
    downloadPdf(doc, `bead-pattern-${pattern.metadata.brand}-${pattern.metadata.width}x${pattern.metadata.height}.pdf`);
  };

  return (
    <div className="flex gap-3">
      <button onClick={handlePng}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
        📥 导出 PNG
      </button>
      <button onClick={handlePdf}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium">
        📄 导出 PDF
      </button>
    </div>
  );
}
