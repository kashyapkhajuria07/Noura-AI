export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface RuleThresholds {
  engagementDropPercent: number;
  engagementWindowDays: number;
  lateNightHourStart: number;
  lateNightHourEnd: number;
  lateNightConsecutiveDays: number;
  lateNightMinSessions: number;
  assignmentChurnCount: number;
  assignmentChurnWindowDays: number;
  participationGapDays: number;
}

export const DEFAULT_THRESHOLDS: RuleThresholds = {
  engagementDropPercent: 30,
  engagementWindowDays: 14,
  lateNightHourStart: 23,
  lateNightHourEnd: 4,
  lateNightConsecutiveDays: 3,
  lateNightMinSessions: 1,
  assignmentChurnCount: 4,
  assignmentChurnWindowDays: 7,
  participationGapDays: 7,
};

export type RuleName = 'engagement_drop' | 'late_night' | 'assignment_churn' | 'participation_gap';

export interface RuleResult {
  rule: RuleName;
  triggered: boolean;
  score: number;
  details: string;
  severity: number;
}

export interface RiskAssessment {
  studentId: string;
  overallScore: number;
  level: RiskLevel;
  rules: RuleResult[];
  computedAt: string;
  factors: Record<string, unknown>;
}

export interface BatchResult {
  processed: number;
  assessments: RiskAssessment[];
  durationMs: number;
  errors: string[];
}
