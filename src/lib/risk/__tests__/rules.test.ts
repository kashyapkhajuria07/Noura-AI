import { describe, it, expect } from 'vitest';
import {
  engagementDropRule,
  lateNightRule,
  assignmentChurnRule,
  participationGapRule,
} from '../rules';
import type { RuleThresholds } from '../types';
import { DEFAULT_THRESHOLDS } from '../types';

function makeActivity(hoursAgo: number, type = 'course_access', courseId = 'c1') {
  const d = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
  return {
    id: `act-${hoursAgo}`,
    studentId: 's1',
    type,
    title: 'Test Activity',
    description: null,
    courseId,
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

const T = DEFAULT_THRESHOLDS;

describe('engagementDropRule', () => {
  it('flags >30% drop in activity', () => {
    const now = Date.now();
    const activities = [
      ...Array.from({ length: 20 }, (_, i) =>
        makeActivity((14 * 24) - i) // earlier window
      ),
      ...Array.from({ length: 5 }, (_, i) =>
        makeActivity(i) // recent window
      ),
    ];
    const result = engagementDropRule(activities, T);
    expect(result.triggered).toBe(true);
    expect(result.score).toBeGreaterThan(0);
  });

  it('does not flag normal activity levels', () => {
    const activities = Array.from({ length: 30 }, (_, i) => makeActivity(i));
    const result = engagementDropRule(activities, T);
    expect(result.triggered).toBe(false);
    expect(result.score).toBe(0);
  });

  it('does not flag when earlier window is empty', () => {
    const activities = Array.from({ length: 5 }, (_, i) => makeActivity(i));
    const result = engagementDropRule(activities, T);
    expect(result.triggered).toBe(false);
    expect(result.details).toContain('No activity data');
  });

  it('uses configurable threshold', () => {
    const activities = [
      ...Array.from({ length: 10 }, (_, i) => makeActivity((14 * 24) - i)),
      ...Array.from({ length: 8 }, (_, i) => makeActivity(i)),
    ];
    const strict = { ...T, engagementDropPercent: 10 };
    const result = engagementDropRule(activities, strict);
    expect(result.triggered).toBe(true);
  });
});

describe('lateNightRule', () => {
  function lateNightActivity(daysAgo: number) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(2, 0, 0, 0); // 2 AM
    return {
      id: `late-${daysAgo}`,
      studentId: 's1',
      type: 'course_access',
      title: 'Late Session',
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

  it('flags 3+ consecutive late nights', () => {
    const activities = [0, 1, 2, 3].map((d) => lateNightActivity(d));
    const result = lateNightRule(activities, T);
    expect(result.triggered).toBe(true);
    expect(result.score).toBeGreaterThan(0);
  });

  it('does not flag fewer than 3 consecutive nights', () => {
    const activities = [0, 1, 5, 6].map((d) => lateNightActivity(d));
    const result = lateNightRule(activities, T);
    expect(result.triggered).toBe(false);
  });

  it('does not flag no late-night activity', () => {
    const activities = Array.from({ length: 10 }, (_, i) => {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      d.setHours(14, 0, 0, 0);
      return {
        id: `day-${i}`,
        studentId: 's1',
        type: 'course_access',
        title: 'Day Session',
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
    });
    const result = lateNightRule(activities, T);
    expect(result.triggered).toBe(false);
  });

  it('handles empty activities', () => {
    const result = lateNightRule([], T);
    expect(result.triggered).toBe(false);
    expect(result.score).toBe(0);
  });
});

describe('assignmentChurnRule', () => {
  it('flags >4 submissions within window', () => {
    const activities = Array.from({ length: 6 }, (_, i) =>
      makeActivity(i, 'assignment_submitted')
    );
    const result = assignmentChurnRule(activities, T);
    expect(result.triggered).toBe(true);
  });

  it('does not flag low submission count', () => {
    const activities = Array.from({ length: 2 }, (_, i) =>
      makeActivity(i, 'assignment_submitted')
    );
    const result = assignmentChurnRule(activities, T);
    expect(result.triggered).toBe(false);
  });

  it('only counts assignment_submitted type', () => {
    const activities = [
      ...Array.from({ length: 6 }, (_, i) => makeActivity(i, 'course_access')),
      ...Array.from({ length: 2 }, (_, i) => makeActivity(i, 'assignment_submitted')),
    ];
    const result = assignmentChurnRule(activities, T);
    expect(result.triggered).toBe(false);
  });

  it('considers multiple courses', () => {
    const activities = [
      ...Array.from({ length: 3 }, (_, i) => makeActivity(i, 'assignment_submitted', 'c1')),
      ...Array.from({ length: 3 }, (_, i) => makeActivity(i, 'assignment_submitted', 'c2')),
    ];
    const result = assignmentChurnRule(activities, T);
    expect(result.triggered).toBe(true);
  });
});

describe('participationGapRule', () => {
  it('flags >7 days gap', () => {
    const activities = [makeActivity(10 * 24)]; // 10 days ago
    const result = participationGapRule(activities, T);
    expect(result.triggered).toBe(true);
    expect(result.score).toBeGreaterThan(0);
  });

  it('does not flag recent activity', () => {
    const activities = [makeActivity(1)]; // 1 hour ago
    const result = participationGapRule(activities, T);
    expect(result.triggered).toBe(false);
    expect(result.score).toBe(0);
  });

  it('flags max score on empty activities', () => {
    const result = participationGapRule([], T);
    expect(result.triggered).toBe(true);
    expect(result.score).toBe(100);
  });

  it('uses the most recent activity', () => {
    const activities = [
      makeActivity(10 * 24), // 10 days ago
      makeActivity(5 * 24),  // 5 days ago — should be used
    ];
    const result = participationGapRule(activities, T);
    expect(result.triggered).toBe(false);
  });
});
