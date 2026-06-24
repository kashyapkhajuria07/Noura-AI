import { ALL_RULES } from './rules';
import type { RuleThresholds, RiskAssessment } from './types';
import { DEFAULT_THRESHOLDS } from './types';

const RULE_WEIGHTS: Record<string, number> = {
  engagement_drop: 0.3,
  late_night: 0.2,
  assignment_churn: 0.25,
  participation_gap: 0.25,
};

function calculateLevel(score: number): RiskAssessment['level'] {
  if (score >= 75) return 'CRITICAL';
  if (score >= 50) return 'HIGH';
  if (score >= 25) return 'MEDIUM';
  return 'LOW';
}

export class RuleEngine {
  private thresholds: RuleThresholds;

  constructor(thresholds: Partial<RuleThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }

  updateThresholds(overrides: Partial<RuleThresholds>): void {
    this.thresholds = { ...this.thresholds, ...overrides };
  }

  assess(activities: any[]): Omit<RiskAssessment, 'studentId'> {
    const results = [];
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const [name, ruleFn] of Object.entries(ALL_RULES)) {
      const result = ruleFn(activities, this.thresholds);
      results.push(result);

      const weight = RULE_WEIGHTS[name] ?? 0.1;
      if (result.triggered) {
        totalWeightedScore += result.score * weight;
      }
      totalWeight += weight;
    }

    const overallScore = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 0;

    const level = calculateLevel(overallScore);

    const factors: Record<string, unknown> = {};
    for (const r of results) {
      if (r.triggered) {
        factors[r.rule] = { score: r.score, details: r.details, severity: r.severity };
      }
    }

    return {
      overallScore,
      level,
      rules: results,
      computedAt: new Date().toISOString(),
      factors,
    };
  }
}

export const defaultEngine = new RuleEngine();
