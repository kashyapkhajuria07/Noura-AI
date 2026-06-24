'use client';

import { useMemo } from 'react';
import type { MoodEntry } from '@/lib/reflection/types';

interface MoodChartProps {
  entries: MoodEntry[];
  days?: number;
}

const WIDTH = 600;
const HEIGHT = 200;
const PAD = { top: 20, right: 20, bottom: 30, left: 40 };

export function MoodChart({ entries, days = 30 }: MoodChartProps) {
  const chartData = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const cutoff = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);

    const dailyAverages = new Map<string, number[]>();
    for (const e of entries) {
      const d = new Date(e.timestamp);
      if (d < cutoff) continue;
      const key = d.toISOString().split('T')[0];
      if (!dailyAverages.has(key)) dailyAverages.set(key, []);
      dailyAverages.get(key)!.push(e.mood);
    }

    const points: { date: string; avg: number; count: number }[] = [];
    for (const [date, moods] of dailyAverages) {
      const avg = moods.reduce((s, m) => s + m, 0) / moods.length;
      points.push({ date, avg, count: moods.length });
    }
    points.sort((a, b) => a.date.localeCompare(b.date));

    if (points.length === 0) return null;

    const mins = Math.min(...points.map((p) => p.avg));
    const maxs = Math.max(...points.map((p) => p.avg));
    const range = Math.max(maxs - mins, 0.5);

    const chartW = WIDTH - PAD.left - PAD.right;
    const chartH = HEIGHT - PAD.top - PAD.bottom;

    const stepX = points.length > 1 ? chartW / (points.length - 1) : chartW / 2;

    const pathD = points
      .map((p, i) => {
        const x = PAD.left + i * stepX;
        const y = PAD.top + chartH - ((p.avg - mins + 0.2) / (range + 0.4)) * chartH;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    const areaD = points
      .map((p, i) => {
        const x = PAD.left + i * stepX;
        const y = PAD.top + chartH - ((p.avg - mins + 0.2) / (range + 0.4)) * chartH;
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ') + ` L ${PAD.left + (points.length - 1) * stepX} ${PAD.top + chartH} L ${PAD.left} ${PAD.top + chartH} Z`;

    const yTicks = [1, 2, 3, 4, 5];
    const xLabels = points.filter((_, i) => {
      if (points.length <= 7) return true;
      return i % Math.ceil(points.length / 7) === 0 || i === points.length - 1;
    });

    return { points, pathD, areaD, stepX, chartW, chartH, yTicks, xLabels, mins, range };
  }, [entries, days]);

  if (!chartData) {
    return (
      <div className="border-brutal-sm border-ink rounded-brutal-sm p-8 text-center">
        <p className="font-mono text-caption text-ink-400">
          Not enough data to show chart. Log moods to see trends.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-display text-subheading font-semibold">Mood Trend &mdash; Last {days} Days</h3>
      <div className="overflow-x-auto">
        <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="min-w-[600px]">
          {/* Grid lines */}
          {chartData.yTicks.map((tick) => {
            const y = PAD.top + chartData.chartH - ((tick - chartData.mins + 0.2) / (chartData.range + 0.4)) * chartData.chartH;
            return (
              <g key={tick}>
                <line x1={PAD.left} y1={y} x2={WIDTH - PAD.right} y2={y} stroke="#cccccc" strokeWidth={1} />
                <text x={PAD.left - 6} y={y + 4} textAnchor="end" className="font-mono text-[10px] fill-ink-400 italic">
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={chartData.areaD} fill="rgba(37, 99, 235, 0.08)" />

          {/* Line */}
          <path d={chartData.pathD} fill="none" stroke="#2563eb" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

          {/* Dots */}
          {chartData.points.map((p, i) => {
            const x = PAD.left + i * chartData.stepX;
            const y = PAD.top + chartData.chartH - ((p.avg - chartData.mins + 0.2) / (chartData.range + 0.4)) * chartData.chartH;
            return (
              <g key={p.date}>
                <circle cx={x} cy={y} r={3} fill="#2563eb" stroke="#fafaf9" strokeWidth={2} />
                <title>{`${p.date}: ${p.avg.toFixed(1)} (${p.count} entries)`}</title>
              </g>
            );
          })}

          {/* X-axis labels */}
          {chartData.xLabels.map((p) => {
            const idx = chartData.points.indexOf(p);
            const x = PAD.left + idx * chartData.stepX;
            return (
              <text
                key={p.date}
                x={x}
                y={HEIGHT - 6}
                textAnchor="middle"
                className="font-mono text-[10px] fill-ink-400 italic"
              >
                {new Date(p.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
