'use client';
import type { BeadUsageItem } from '@/lib/types/bead';
import { usageToCsv, totalBeads } from '@/lib/utils/usage-calculator';

interface Props {
  usage: BeadUsageItem[];
}

export default function BeadUsageList({ usage }: Props) {
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
          用量统计 <span className="text-purple-600 dark:text-purple-400">({totalBeads(usage)} 颗)</span>
        </h3>
        <button onClick={handleExportCsv} className="text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium">导出 CSV</button>
      </div>
      <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
            <tr>
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">颜色</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">编号</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">名称</th>
              <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">数量</th>
            </tr>
          </thead>
          <tbody>
            {usage.map(u => (
              <tr key={u.colorId} className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-3 py-1.5">
                  <div className="w-5 h-5 rounded border border-gray-200 dark:border-gray-600" style={{ backgroundColor: u.color.hex }} />
                </td>
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
