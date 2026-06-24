import { describe, it, expect } from 'vitest';
import { generateCSV } from '../queries';
import type { AnalyticsReport } from '../types';

const mockReport: AnalyticsReport = {
  heatmap: [
    { week: 0, department: 'Computer Science', avgScore: 0.25, studentCount: 20 },
    { week: 1, department: 'Computer Science', avgScore: 0.45, studentCount: 22 },
    { week: 0, department: 'Mathematics', avgScore: 0.3, studentCount: 15 },
  ],
  trend: [
    { week: 0, weekLabel: 'Week 1', avgScore: 0.25, studentCount: 80 },
    { week: 1, weekLabel: 'Week 2', avgScore: 0.35, studentCount: 85 },
  ],
  effectiveness: {
    totalInterventions: 48,
    improved: 28,
    worsened: 8,
    unchanged: 12,
    improvedToGreen: 19,
    avgScoreChange: -0.12,
    details: { beforeAvg: 0.58, afterAvg: 0.46, improvementRate: 0.583 },
  },
  generatedAt: new Date().toISOString(),
};

describe('generateCSV', () => {
  it('returns CSV string with headers', () => {
    const csv = generateCSV(mockReport);
    expect(csv).toContain('Week,Department,Average Risk Score,Student Count,Tier');
  });

  it('contains heatmap data rows', () => {
    const csv = generateCSV(mockReport);
    expect(csv).toContain('Week 1,Computer Science');
    expect(csv).toContain('Week 2,Computer Science');
    expect(csv).toContain('Mathematics');
  });

  it('has correct tier classification', () => {
    const csv = generateCSV(mockReport);
    expect(csv).toContain(',green');
    const report2: AnalyticsReport = {
      ...mockReport,
      heatmap: [{ week: 0, department: 'Test', avgScore: 0.85, studentCount: 10 }],
    };
    const csv2 = generateCSV(report2);
    expect(csv2).toContain(',red');
  });

  it('handles empty heatmap', () => {
    const empty: AnalyticsReport = {
      ...mockReport,
      heatmap: [],
    };
    const csv = generateCSV(empty);
    expect(csv).toBe('Week,Department,Average Risk Score,Student Count,Tier');
  });

  it('has correct number of data rows', () => {
    const csv = generateCSV(mockReport);
    const rows = csv.split('\n');
    expect(rows.length - 1).toBe(mockReport.heatmap.length);
  });
});

describe('getAnalytics (mock fallback)', () => {
  it('generates valid report structure', async () => {
    const { getAnalytics } = await import('../queries');
    const report = await getAnalytics();
    expect(report).toBeDefined();
    expect(Array.isArray(report.heatmap)).toBe(true);
    expect(Array.isArray(report.trend)).toBe(true);
    expect(report.effectiveness).toBeDefined();
    expect(typeof report.effectiveness.totalInterventions).toBe('number');
    expect(report.generatedAt).toBeDefined();
  });

  it('generates 16 weeks of trend data', async () => {
    const { getAnalytics } = await import('../queries');
    const report = await getAnalytics();
    expect(report.trend.length).toBe(16);
  });

  it('generates heatmap with all departments', async () => {
    const { getAnalytics } = await import('../queries');
    const report = await getAnalytics();
    const depts = new Set(report.heatmap.map((c) => c.department));
    expect(depts.size).toBeGreaterThanOrEqual(5);
  });

  it('generates intervention effectiveness metrics', async () => {
    const { getAnalytics } = await import('../queries');
    const report = await getAnalytics();
    expect(report.effectiveness.totalInterventions).toBeGreaterThan(0);
    expect(
      report.effectiveness.improved + report.effectiveness.worsened + report.effectiveness.unchanged
    ).toBe(report.effectiveness.totalInterventions);
  });

  it('trend weeks are in ascending order', async () => {
    const { getAnalytics } = await import('../queries');
    const report = await getAnalytics();
    for (let i = 1; i < report.trend.length; i++) {
      expect(report.trend[i].week).toBeGreaterThan(report.trend[i - 1].week);
    }
  });

  it('scores are within valid range', async () => {
    const { getAnalytics } = await import('../queries');
    const report = await getAnalytics();
    for (const c of report.heatmap) {
      expect(c.avgScore).toBeGreaterThanOrEqual(0);
      expect(c.avgScore).toBeLessThanOrEqual(1);
    }
    for (const t of report.trend) {
      expect(t.avgScore).toBeGreaterThanOrEqual(0);
      expect(t.avgScore).toBeLessThanOrEqual(1);
    }
  });
});
