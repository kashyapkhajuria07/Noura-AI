'use client';

import { useMemo } from 'react';
import type { TrendPoint } from '@/lib/admin/types';

interface TrendChartProps {
  data: TrendPoint[];
}

const W = 600;
const H = 200;
const PAD = { top: 20, right: 20, bottom: 30, left: 40 };

export function TrendChart({ data }: TrendChartProps) {
  const chart = useMemo(() => {
    if (data.length === 0) return null;
    const maxScore = Math.max(...data.map((p) => p.avgScore), 0.01);
    const cw = W - PAD.left - PAD.right;
    const ch = H - PAD.top - PAD.bottom;

    const pts = data.map((p, i) => {
      const x = PAD.left + (i / Math.max(data.length - 1, 1)) * cw;
      const y = PAD.top + ch - (p.avgScore / maxScore) * ch;
      return { x, y, ...p };
    });

    const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    const yTicks = [0, 0.25, 0.5, 0.75, 1]
      .filter((v) => v <= maxScore)
      .map((v) => ({
        y: PAD.top + ch - (v / maxScore) * ch,
        label: v.toFixed(2),
      }));

    const xStep = Math.max(1, Math.floor(data.length / 7));
    const xLabels = data
      .filter((_, i) => i % xStep === 0 || i === data.length - 1)
      .map((p) => {
        const idx = data.indexOf(p);
        return {
          x: PAD.left + (idx / Math.max(data.length - 1, 1)) * cw,
          label: `W${idx + 1}`,
        };
      });

    return { pts, pathD, yTicks, xLabels, maxScore };
  }, [data]);

  if (!chart) {
    return (
      <div className="border-brutal-sm border-ink rounded-brutal-sm p-8 text-center font-mono text-caption text-ink-400">
        No trend data
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-display text-subheading font-semibold">Campus-Wide Risk Trend</h3>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full max-w-[600px] h-auto">
        {chart.yTicks.map((t) => (
          <g key={t.label}>
            <line
              x1={PAD.left}
              y1={t.y}
              x2={W - PAD.right}
              y2={t.y}
              stroke="#cccccc"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 6}
              y={t.y + 4}
              textAnchor="end"
              className="font-mono text-[10px] fill-ink-400 italic"
            >
              {t.label}
            </text>
          </g>
        ))}
        {chart.xLabels.map((t) => (
          <text
            key={t.label}
            x={t.x}
            y={H - 6}
            textAnchor="middle"
            className="font-mono text-[10px] fill-ink-400 italic"
          >
            {t.label}
          </text>
        ))}
        <text x={PAD.left} y={10} className="font-mono text-[10px] fill-ink-400 italic">
          Avg. Risk Score
        </text>
        <path
          d={chart.pathD}
          fill="none"
          stroke="#2563eb"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {chart.pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={3} fill="#2563eb" stroke="#fafaf9" strokeWidth={2} />
            <title>
              Week {p.week + 1}: {(p.avgScore * 100).toFixed(0)}%
            </title>
          </g>
        ))}
      </svg>
    </div>
  );
}
