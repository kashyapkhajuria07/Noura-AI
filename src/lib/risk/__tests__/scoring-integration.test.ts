import { describe, it, expect } from 'vitest';
import { RuleEngine } from '../engine';
import { computeTier, normalizeRuleScore } from '../composite';
import { averageStressScores } from '../ml-client';

function act(hoursAgo: number, type = 'course_access') {
  return {
    id: `a-${Math.random()}`,
    studentId: 's1',
    type,
    title: 'Activity',
    description: null,
    courseId: 'c1',
    courseName: 'CS 301',
    score: null, maxScore: null, url: null, metadata: null,
    timestamp: new Date(Date.now() - hoursAgo * 3600000),
    createdAt: new Date(Date.now() - hoursAgo * 3600000),
    externalId: null,
  } as any;
}

function lateNightAct(dayOffset: number) {
  const d = new Date(Date.now() - dayOffset * 86400000);
  d.setHours(23, 0, 0, 0);
  return {
    id: `ln-${dayOffset}`,
    studentId: 's1', type: 'assignment_submitted', title: `Late night ${dayOffset}`,
    description: null, courseId: 'c1', courseName: 'CS 301',
    score: null, maxScore: null, url: null, metadata: null,
    timestamp: d, createdAt: d, externalId: null,
  } as any;
}

describe('Risk Scoring Integration', () => {
  describe('Full Pipeline: Engine → Normalize → Composite → Tier', () => {
    it('green tier when all rules silenced and ML score low', () => {
      const engine = new RuleEngine({
        engagementDropPercent: 100,
        lateNightHourStart: 0, lateNightHourEnd: 0,
        lateNightConsecutiveDays: 999,
        assignmentChurnCount: 999,
        participationGapDays: 999,
      });
      const activities = Array.from({ length: 10 }, (_, i) => act(i));
      const result = engine.assess(activities);
      const triggered = result.rules.filter(r => r.triggered);
      expect(triggered).toHaveLength(0);
      expect(result.level).toBe('LOW');

      const normalizedRule = normalizeRuleScore(result.overallScore);
      const mlScore = 0.1;
      const composite = Math.min(0.6 * normalizedRule + 0.4 * mlScore, 1.0);
      const tier = computeTier(composite);
      expect(tier).toBe('green');
      expect(composite).toBeLessThan(0.3);
    });

    it('amber tier for engagement drop with moderate ML', () => {
      const engine = new RuleEngine({
        engagementDropPercent: 5,
        lateNightHourStart: 0, lateNightHourEnd: 0,
        lateNightConsecutiveDays: 999,
        assignmentChurnCount: 999,
        participationGapDays: 999,
      });
      const early = Array.from({ length: 20 }, (_, i) => act(200 + i));
      const recent = Array.from({ length: 3 }, (_, i) => act(i));
      const activities = [...early, ...recent];
      const result = engine.assess(activities);

      expect(result.rules[0].triggered).toBe(true);
      expect(result.rules.filter(r => r.triggered)).toHaveLength(1);

      const normalizedRule = normalizeRuleScore(result.overallScore);
      const mlScore = 0.3;
      const composite = Math.min(0.6 * normalizedRule + 0.4 * mlScore, 1.0);
      expect(composite).toBeGreaterThanOrEqual(0.3);
      expect(computeTier(composite)).toBe('amber');
    });

    it('red tier for high stress + multiple rule triggers', () => {
      const engine = new RuleEngine({
        engagementDropPercent: 5,
        lateNightConsecutiveDays: 1,
        assignmentChurnCount: 1,
        participationGapDays: 999,
      });
      const early = Array.from({ length: 20 }, (_, i) => act(200 + i));
      const nights = [0, 1, 2, 3, 4].map(lateNightAct);
      const churnActivities = [
        { ...act(1, 'assignment_submitted'), courseId: 'c1' },
        { ...act(2, 'assignment_submitted'), courseId: 'c1' },
      ];
      const activities = [...early, ...nights, ...churnActivities];
      const result = engine.assess(activities);

      const triggeredCount = result.rules.filter(r => r.triggered).length;
      expect(triggeredCount).toBe(3);

      const normalizedRule = normalizeRuleScore(result.overallScore);
      const mlScore = 0.9;
      const composite = Math.min(0.6 * normalizedRule + 0.4 * mlScore, 1.0);
      expect(composite).toBeGreaterThan(0.7);
      expect(computeTier(composite)).toBe('red');
    });
  });

  describe('ML Score Integration', () => {
    it('ML score of 0 does not affect composite', () => {
      const composite = 0.6 * normalizeRuleScore(50) + 0.4 * 0;
      expect(composite).toBe(0.3);
      expect(computeTier(composite)).toBe('amber');
    });

    it('high ML score pushes composite into red', () => {
      const composite = 0.6 * normalizeRuleScore(60) + 0.4 * 0.95;
      expect(composite).toBe(0.74);
      expect(computeTier(composite)).toBe('red');
    });

    it('low ML score keeps composite green', () => {
      const composite = 0.6 * normalizeRuleScore(30) + 0.4 * 0.05;
      expect(composite).toBe(0.2);
      expect(computeTier(composite)).toBe('green');
    });
  });

  describe('averageStressScores', () => {
    it('averages varied scores', () => {
      expect(averageStressScores([
        { stress_score: 0.95 }, { stress_score: 0.85 },
        { stress_score: 0.75 }, { stress_score: 0.65 },
      ] as any)).toBeCloseTo(0.8, 5);
    });

    it('handles extreme values', () => {
      expect(averageStressScores([
        { stress_score: 0.9999 }, { stress_score: 0.0001 },
      ] as any)).toBeCloseTo(0.5, 2);
    });

    it('empty returns 0', () => {
      expect(averageStressScores([])).toBe(0);
    });
  });
});
