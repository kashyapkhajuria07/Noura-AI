'use client';

import type { InterventionEffectiveness } from '@/lib/admin/types';

interface MetricsPanelProps {
  data: InterventionEffectiveness;
}

export function MetricsPanel({ data }: MetricsPanelProps) {
  const improvementPct =
    data.totalInterventions > 0
      ? ((data.improved / data.totalInterventions) * 100).toFixed(0)
      : '0';
  const greenPct =
    data.totalInterventions > 0
      ? ((data.improvedToGreen / data.totalInterventions) * 100).toFixed(0)
      : '0';

  return (
    <div className="space-y-4">
      <h3 className="font-display text-subheading font-semibold">Intervention Effectiveness</h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border-brutal-sm border-ink rounded-brutal-sm p-4 space-y-1">
          <p className="font-mono text-caption text-ink-400 italic uppercase tracking-wider">
            Total
          </p>
          <p className="font-display text-display font-bold">{data.totalInterventions}</p>
          <p className="font-mono text-caption text-ink-400">Interventions</p>
        </div>
        <div className="border-brutal-sm border-chrome rounded-brutal-sm p-4 space-y-1 bg-chrome/5">
          <p className="font-mono text-caption text-chrome italic uppercase tracking-wider">
            Improved
          </p>
          <p className="font-display text-display font-bold text-chrome">{data.improved}</p>
          <p className="font-mono text-caption text-chrome/70">{improvementPct}% of total</p>
        </div>
        <div className="border-brutal-sm border-ink rounded-brutal-sm p-4 space-y-1">
          <p className="font-mono text-caption text-ink-400 italic uppercase tracking-wider">
            To Green
          </p>
          <p className="font-display text-display font-bold">{data.improvedToGreen}</p>
          <p className="font-mono text-caption text-ink-400">{greenPct}% reached green tier</p>
        </div>
        <div className="border-brutal-sm border-accent rounded-brutal-sm p-4 space-y-1 bg-accent/5">
          <p className="font-mono text-caption text-accent italic uppercase tracking-wider">
            Worsened
          </p>
          <p className="font-display text-display font-bold text-accent">{data.worsened}</p>
          <p className="font-mono text-caption text-accent/70">
            {data.totalInterventions > 0
              ? ((data.worsened / data.totalInterventions) * 100).toFixed(0)
              : '0'}
            %
          </p>
        </div>
      </div>

      <div className="border-brutal-sm border-ink rounded-brutal-sm p-4 space-y-3">
        <p className="font-mono text-caption uppercase tracking-wider text-ink-400 italic">
          Before vs After &mdash; Average Composite Score
        </p>
        <div className="flex items-center gap-6">
          <div>
            <p className="font-mono text-caption text-ink-400">Before</p>
            <p className="font-display text-display-sm font-bold">
              {data.details.beforeAvg.toFixed(2)}
            </p>
          </div>
          <div className="text-ink-300 text-2xl font-mono">&rarr;</div>
          <div>
            <p className="font-mono text-caption text-ink-400">After</p>
            <p
              className={`font-display text-display-sm font-bold ${data.details.afterAvg < data.details.beforeAvg ? 'text-chrome' : 'text-accent'}`}
            >
              {data.details.afterAvg.toFixed(2)}
            </p>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-3 bg-ink-100 rounded-brutal-sm overflow-hidden">
                <div
                  className="h-full bg-chrome transition-all duration-500 rounded-brutal-sm"
                  style={{ width: `${data.details.improvementRate * 100}%` }}
                />
              </div>
              <span className="font-mono text-body-sm text-chrome font-bold">
                {(data.details.improvementRate * 100).toFixed(0)}%
              </span>
            </div>
            <p className="font-mono text-caption text-ink-400 mt-1">Improvement rate</p>
          </div>
        </div>
      </div>
    </div>
  );
}
