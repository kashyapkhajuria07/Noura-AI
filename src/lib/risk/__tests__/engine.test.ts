import { describe, it, expect } from 'vitest';
import { RuleEngine } from '../engine';

function act(hoursAgo: number, type = 'course_access') {
  const d = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  return {
    id: `a-${Math.random()}`,
    studentId: 's1',
    type,
    title: 'T',
    description: null,
    courseId: 'c1',
    courseName: 'CS 301',
    score: null,
    maxScore: null,
    url: null,
    metadata: null,
    timestamp: d,
    createdAt: d,
    externalId: null,
  } as any;
}

describe('RuleEngine', () => {
  it('LOW risk for normal activity', () => {
    const e = new RuleEngine();
    const r = e.assess(Array.from({ length: 30 }, (_, i) => act(i)));
    expect(r.level).toBe('LOW');
    expect(r.overallScore).toBeLessThan(25);
    expect(r.rules).toHaveLength(4);
  });

  it('engagement drop triggers with custom threshold', () => {
    const e = new RuleEngine({ engagementDropPercent: 5 });
    const early = Array.from({ length: 20 }, (_, i) => act(192 + i));
    const recent = Array.from({ length: 2 }, (_, i) => act(i));
    const r = e.assess([...early, ...recent]);
    expect(r.rules[0].triggered).toBe(true);
    expect(r.overallScore).toBeGreaterThan(0);
  });

  it('returns all 4 rule results', () => {
    const e = new RuleEngine();
    const r = e.assess([act(1)]);
    expect(r.rules.map((x) => x.rule)).toEqual([
      'engagement_drop',
      'late_night',
      'assignment_churn',
      'participation_gap',
    ]);
  });

  it('triggers assignment churn with many resubmissions', () => {
    const e = new RuleEngine({ assignmentChurnCount: 3 });
    const r = e.assess(Array.from({ length: 6 }, (_, i) => act(i, 'assignment_submitted')));
    expect(r.rules[2].triggered).toBe(true);
  });

  it('triggers participation gap with old last activity', () => {
    const e = new RuleEngine({ participationGapDays: 5 });
    const r = e.assess([act(200)]);
    expect(r.rules[3].triggered).toBe(true);
  });
});
