'use client';
import type { BeadUsageItem } from '@/lib/types/bead';
import { usageToCsv, totalBeads } from '@/lib/utils/usage-calculator';
import { useI18n } from '@/lib/i18n/context';
import { Button } from '@/components/ui/button';

interface Props { usage: BeadUsageItem[]; }

export default function BeadUsageList({ usage }: Props) {
  const { t } = useI18n();
  if (!usage.length) return null;
  const handleExportCsv = () => {
    const csv = usageToCsv(usage);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'bead-usage.csv'; a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {t('usage.title')} <span className="text-pink-500 dark:text-pink-400">({totalBeads(usage)} {t('usage.unit')})</span>
        </h3>
        <Button variant="link" size="sm" onClick={handleExportCsv} className="text-xs text-pink-500 dark:text-pink-400 font-medium">{t('usage.exportCsv')}</Button>
      </div>
      <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
            <tr>
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">{t('usage.color')}</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">{t('usage.code')}</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">{t('usage.name')}</th>
              <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">{t('usage.count')}</th>
            </tr>
          </thead>
          <tbody>
            {usage.map(u => (
              <tr key={u.colorId} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-3 py-1.5"><div className="w-5 h-5 rounded border border-gray-200 dark:border-gray-600" style={{ backgroundColor: u.color.hex }} /></td>
                <td className="px-3 py-1.5 font-mono text-xs">{u.color.code}</td>
                <td className="px-3 py-1.5 text-gray-700 dark:text-gray-300">{u.color.name}</td>
                <td className="px-3 py-1.5 text-right font-mono text-xs font-semibold">{u.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
