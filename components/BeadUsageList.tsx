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
        <h3 className="font-medium">用量统计 ({totalBeads(usage)} 颗)</h3>
        <button onClick={handleExportCsv} className="text-sm text-blue-600 hover:underline">导出 CSV</button>
      </div>
      <div className="max-h-64 overflow-y-auto border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="text-left px-3 py-1.5">颜色</th>
              <th className="text-left px-3 py-1.5">编号</th>
              <th className="text-left px-3 py-1.5">名称</th>
              <th className="text-right px-3 py-1.5">数量</th>
            </tr>
          </thead>
          <tbody>
            {usage.map(u => (
              <tr key={u.colorId} className="border-t hover:bg-gray-50">
                <td className="px-3 py-1.5">
                  <div className="w-5 h-5 rounded border" style={{ backgroundColor: u.color.hex }} />
                </td>
                <td className="px-3 py-1.5 font-mono">{u.color.code}</td>
                <td className="px-3 py-1.5">{u.color.name}</td>
                <td className="px-3 py-1.5 text-right font-mono">{u.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
