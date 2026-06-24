'use client';

import { useMemo } from 'react';
import type { HeatmapCell } from '@/lib/admin/types';

interface HeatmapProps {
  data: HeatmapCell[];
}

function scoreColor(score: number): string {
  if (score < 0.2) return 'bg-ink-50';
  if (score < 0.3) return 'bg-ink-100';
  if (score < 0.4) return 'bg-chrome/20';
  if (score < 0.5) return 'bg-chrome/40';
  if (score < 0.6) return 'bg-chrome/60';
  if (score < 0.7) return 'bg-chrome/80';
  return 'bg-chrome';
}

export function Heatmap({ data }: HeatmapProps) {
  const { weeks, departments, matrix } = useMemo(() => {
    const weekSet = new Set<number>();
    const deptSet = new Set<string>();
    for (const c of data) {
      weekSet.add(c.week);
      deptSet.add(c.department);
    }
    const w = [...weekSet].sort((a, b) => a - b);
    const d = [...deptSet].sort();
    const m = new Map<string, HeatmapCell>();
    for (const c of data) m.set(`${c.week}-${c.department}`, c);
    return { weeks: w, departments: d, matrix: m };
  }, [data]);

  const maxScore = Math.max(...data.map((c) => c.avgScore), 0.01);

  return (
    <div className="space-y-3">
      <h3 className="font-display text-subheading font-semibold">
        Risk Heatmap &mdash; Week vs Department
      </h3>
      <div className="overflow-x-auto">
        <table className="border-collapse">
          <thead>
            <tr>
              <th className="font-mono text-caption text-ink-400 italic text-left pr-3 pb-2">
                Dept
              </th>
              {weeks.map((w) => (
                <th
                  key={w}
                  className="font-mono text-caption text-ink-400 italic pb-2 px-1.5 text-center min-w-[52px]"
                >
                  W{w + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {departments.map((dept) => (
              <tr key={dept}>
                <td className="font-mono text-caption text-ink-500 pr-3 py-1 text-right whitespace-nowrap">
                  {dept}
                </td>
                {weeks.map((w) => {
                  const cell = matrix.get(`${w}-${dept}`);
                  const score = cell?.avgScore ?? 0;
                  const opacity = maxScore > 0 ? score / maxScore : 0;
                  return (
                    <td
                      key={`${w}-${dept}`}
                      className={`px-1.5 py-1 relative ${scoreColor(score)}`}
                      title={`${dept} Week ${w + 1}: ${(score * 100).toFixed(0)}% risk (${cell?.studentCount ?? 0} students)`}
                    >
                      <span className="font-mono text-[10px] text-ink-600">
                        {(score * 100).toFixed(0)}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2 font-mono text-[10px] text-ink-400">
        <span>Low</span>
        <div className="flex">
          {[
            'bg-ink-50',
            'bg-ink-100',
            'bg-chrome/20',
            'bg-chrome/40',
            'bg-chrome/60',
            'bg-chrome/80',
            'bg-chrome',
          ].map((c) => (
            <div key={c} className={`w-4 h-4 ${c}`} />
          ))}
        </div>
        <span>High</span>
      </div>
    </div>
  );
}
