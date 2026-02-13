'use client';
import type { BeadPattern, CompiledBeadColor } from '@/lib/types/bead';
import { renderPatternToCanvas, canvasToBlob, downloadBlob } from '@/lib/export/png-exporter';
import { exportPdf, downloadPdf } from '@/lib/export/pdf-exporter';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface Props {
  pattern: BeadPattern | null;
  palette: CompiledBeadColor[];
}

export default function ExportPanel({ pattern, palette }: Props) {
  const { t } = useI18n();
  if (!pattern) return null;
  const fname = `bead-${pattern.metadata.brand}-${pattern.metadata.width}x${pattern.metadata.height}`;
  const handlePng = async () => {
    const canvas = renderPatternToCanvas(pattern, palette, 50, true, true);
    const blob = await canvasToBlob(canvas);
    downloadBlob(blob, `${fname}.png`);
  };
  const handlePdf = () => {
    const doc = exportPdf({ pattern, palette, showCodes: true });
    downloadPdf(doc, `${fname}.pdf`);
  };
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('export.title')}</Label>
      <div className="flex gap-3">
        <Button onClick={handlePng} className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95">📥 PNG</Button>
        <Button onClick={handlePdf} className="flex-1 bg-rose-600 text-white hover:bg-rose-700 active:scale-95">📄 PDF</Button>
      </div>
    </div>
  );
}
