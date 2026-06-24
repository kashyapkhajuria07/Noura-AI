import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

afterEach(cleanup);
import { MetricsPanel } from '@/components/admin/MetricsPanel';
import { Heatmap } from '@/components/admin/Heatmap';
import { TrendChart } from '@/components/admin/TrendChart';

const mockEffectiveness = {
  totalInterventions: 100,
  improved: 60,
  improvedToGreen: 30,
  worsened: 10,
  details: {
    beforeAvg: 0.65,
    afterAvg: 0.45,
    improvementRate: 0.3,
  },
};

const mockHeatmapCells = [
  { week: 0, department: 'CS', avgScore: 0.2, studentCount: 10 },
  { week: 0, department: 'Math', avgScore: 0.6, studentCount: 8 },
  { week: 1, department: 'CS', avgScore: 0.3, studentCount: 12 },
  { week: 1, department: 'Math', avgScore: 0.5, studentCount: 9 },
];

const mockTrendPoints = [
  { week: 0, avgScore: 0.5 },
  { week: 1, avgScore: 0.45 },
  { week: 2, avgScore: 0.4 },
];

describe('MetricsPanel', () => {
  it('renders KPI cards', () => {
    render(<MetricsPanel data={mockEffectiveness} />);
    expect(screen.getByText('100')).toBeDefined();
    expect(screen.getByText('60')).toBeDefined();
    expect(screen.getByText('30')).toBeDefined();
    expect(screen.getByText('10')).toBeDefined();
  });

  it('renders before/after scores', () => {
    render(<MetricsPanel data={mockEffectiveness} />);
    const allSixtyFive = screen.getAllByText('0.65');
    expect(allSixtyFive.length).toBeGreaterThanOrEqual(1);
    const allFortyFive = screen.getAllByText('0.45');
    expect(allFortyFive.length).toBeGreaterThanOrEqual(1);
  });

  it('renders improvement rate', () => {
    render(<MetricsPanel data={mockEffectiveness} />);
    const allPct = screen.getAllByText('30%');
    expect(allPct.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Heatmap', () => {
  it('renders weeks and departments', () => {
    render(<Heatmap data={mockHeatmapCells} />);
    expect(screen.getByText('W1')).toBeDefined();
    expect(screen.getByText('W2')).toBeDefined();
    expect(screen.getByText('CS')).toBeDefined();
    expect(screen.getByText('Math')).toBeDefined();
  });

  it('renders legend', () => {
    const { container } = render(<Heatmap data={mockHeatmapCells} />);
    expect(screen.getAllByText('Low').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('High').length).toBeGreaterThanOrEqual(1);
  });
});

describe('TrendChart', () => {
  it('renders trend data svg', () => {
    const { container } = render(<TrendChart data={mockTrendPoints} />);
    expect(container.querySelector('svg')).toBeDefined();
    expect(container.querySelector('path')).toBeDefined();
  });

  it('shows empty state when no data', () => {
    render(<TrendChart data={[]} />);
    expect(screen.getByText('No trend data')).toBeDefined();
  });
});
