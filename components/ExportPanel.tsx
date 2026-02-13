'use client';
import { useState } from 'react';
import type { BeadPattern, CompiledBeadColor } from '@/lib/types/bead';
import { renderPatternToCanvas, canvasToBlob, downloadBlob } from '@/lib/export/png-exporter';
import { exportPdf, downloadPdf } from '@/lib/export/pdf-exporter';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

const QUALITY = [
  { key: 'export.low', cellSize: 30 },
  { key: 'export.mid', cellSize: 60 },
  { key: 'export.high', cellSize: 100 },
  { key: 'export.ultra', cellSize: 150 },
] as const;

interface Props {
  pattern: BeadPattern | null;
  palette: CompiledBeadColor[];
}

export default function ExportPanel({ pattern, palette }: Props) {
  const { t } = useI18n();
  const [qi, setQi] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  if (!pattern) return null;
  const fname = `bead-${pattern.metadata.brand}-${pattern.metadata.width}x${pattern.metadata.height}`;
  const { width, height } = pattern.metadata;
  const cs = QUALITY[qi].cellSize;
  const px = width * cs;
  const py = height * cs;

  const handlePng = async () => {
    if (exporting) return;
    setExporting(true);
    setProgress(0);
    try {
      const canvas = await renderPatternToCanvas(pattern, palette, cs, true, true, setProgress);
      const blob = await canvasToBlob(canvas);
      downloadBlob(blob, `${fname}.png`);
    } finally {
      setExporting(false);
    }
  };
  const handlePdf = () => {
    const doc = exportPdf({ pattern, palette, showCodes: true });
    downloadPdf(doc, `${fname}.pdf`);
  };
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('export.title')}</Label>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{t('export.quality')}</span>
          <span>{px}×{py}px</span>
        </div>
        <div className="flex gap-1">
          {QUALITY.map((q, i) => (
            <button key={q.key} onClick={() => !exporting && setQi(i)}
              className={`flex-1 text-xs py-1 rounded transition ${i === qi ? 'bg-pink-500 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:opacity-80'} ${exporting ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {t(q.key as any)}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <Button onClick={handlePng} disabled={exporting} className="flex-1 bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 disabled:opacity-50">
          {exporting ? `⏳ ${progress}%` : '📥 PNG'}
        </Button>
        <Button onClick={handlePdf} disabled={exporting} className="flex-1 bg-fuchsia-500 text-white hover:bg-fuchsia-600 active:scale-95 disabled:opacity-50">📄 PDF</Button>
      </div>
    </div>
  );
}
