export interface HeatmapCell {
  week: number;
  department: string;
  avgScore: number;
  studentCount: number;
}

export interface TrendPoint {
  week: number;
  weekLabel: string;
  avgScore: number;
  studentCount: number;
}

export interface InterventionEffectiveness {
  totalInterventions: number;
  improved: number;
  worsened: number;
  unchanged: number;
  improvedToGreen: number;
  avgScoreChange: number;
  details: {
    beforeAvg: number;
    afterAvg: number;
    improvementRate: number;
  };
}

export interface AnalyticsReport {
  heatmap: HeatmapCell[];
  trend: TrendPoint[];
  effectiveness: InterventionEffectiveness;
  generatedAt: string;
}

export interface CSVRow {
  week: string;
  department: string;
  avgRiskScore: number;
  studentCount: number;
  tier: string;
}
