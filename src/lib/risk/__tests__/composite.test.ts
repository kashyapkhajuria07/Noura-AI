import { describe, it, expect } from 'vitest';
import { computeTier, normalizeRuleScore } from '../composite';
import { averageStressScores } from '../ml-client';

describe('computeTier', () => {
  it('returns green for score < 0.3', () => {
    expect(computeTier(0)).toBe('green');
    expect(computeTier(0.1)).toBe('green');
    expect(computeTier(0.29)).toBe('green');
    expect(computeTier(0.299)).toBe('green');
  });

  it('returns amber for score 0.3–0.7', () => {
    expect(computeTier(0.3)).toBe('amber');
    expect(computeTier(0.5)).toBe('amber');
    expect(computeTier(0.7)).toBe('amber');
  });

  it('returns red for score > 0.7', () => {
    expect(computeTier(0.71)).toBe('red');
    expect(computeTier(0.9)).toBe('red');
    expect(computeTier(1.0)).toBe('red');
  });

  it('handles boundary edge cases', () => {
    expect(computeTier(0.29999)).toBe('green');
    expect(computeTier(0.3)).toBe('amber');
    expect(computeTier(0.70001)).toBe('red');
  });
});

describe('normalizeRuleScore', () => {
  it('converts 0 to 0', () => {
    expect(normalizeRuleScore(0)).toBe(0);
  });

  it('converts 100 to 1', () => {
    expect(normalizeRuleScore(100)).toBe(1);
  });

  it('converts 50 to 0.5', () => {
    expect(normalizeRuleScore(50)).toBe(0.5);
  });

  it('converts 25 to 0.25', () => {
    expect(normalizeRuleScore(25)).toBe(0.25);
  });

  it('handles scores above 100', () => {
    expect(normalizeRuleScore(150)).toBe(1.5);
  });
});

describe('composite score formula', () => {
  it('computes with only rule score (no ML)', () => {
    const ruleScore = 0.5;
    const mlScore = 0;
    const composite = 0.6 * ruleScore + 0.4 * mlScore;
    expect(composite).toBe(0.3);
    expect(computeTier(composite)).toBe('amber');
  });

  it('computes with only ML score (no rules)', () => {
    const ruleScore = 0;
    const mlScore = 0.8;
    const composite = 0.6 * ruleScore + 0.4 * mlScore;
    expect(composite).toBeCloseTo(0.32, 5);
    expect(computeTier(composite)).toBe('amber');
  });

  it('computes with both scores', () => {
    const ruleScore = 0.75;
    const mlScore = 0.5;
    const composite = 0.6 * ruleScore + 0.4 * mlScore;
    expect(composite).toBeCloseTo(0.65, 5);
    expect(computeTier(composite)).toBe('amber');
  });

  it('caps composite at 1.0', () => {
    const raw = 0.6 * 1.5 + 0.4 * 1.0;
    const capped = Math.min(raw, 1.0);
    expect(capped).toBe(1.0);
    expect(computeTier(capped)).toBe('red');
  });

  it('produces green for low rule + low ML', () => {
    const ruleScore = 0.2;
    const mlScore = 0.1;
    const composite = 0.6 * ruleScore + 0.4 * mlScore;
    expect(composite).toBeCloseTo(0.16, 5);
    expect(computeTier(composite)).toBe('green');
  });

  it('produces red for high rule + high ML', () => {
    const ruleScore = 1.0;
    const mlScore = 1.0;
    const composite = 0.6 * ruleScore + 0.4 * mlScore;
    expect(composite).toBeCloseTo(1.0, 5);
    expect(computeTier(composite)).toBe('red');
  });
});

describe('edge cases', () => {
  it('handles zero activities (no rule engine score)', () => {
    const ruleScore = 0;
    const mlScore = 0;
    const composite = 0.6 * ruleScore + 0.4 * mlScore;
    expect(composite).toBe(0);
    expect(computeTier(composite)).toBe('green');
  });

  it('handles extreme ML score', () => {
    const ruleScore = 0;
    const mlScore = 1.0;
    const composite = 0.6 * ruleScore + 0.4 * mlScore;
    expect(composite).toBe(0.4);
    expect(computeTier(composite)).toBe('amber');
  });

  it('handles max rule + zero ML', () => {
    const ruleScore = 1.0;
    const mlScore = 0;
    const composite = 0.6 * 1.0 + 0.4 * 0;
    expect(composite).toBe(0.6);
    expect(computeTier(composite)).toBe('amber');
  });
});

describe('averageStressScores', () => {
  it('returns 0 for empty array', () => {
    expect(averageStressScores([])).toBe(0);
  });

  it('averages multiple scores', () => {
    const results = [{ stress_score: 0.8 }, { stress_score: 0.2 }, { stress_score: 0.5 }] as any;
    expect(averageStressScores(results)).toBeCloseTo(0.5, 5);
  });

  it('handles single result', () => {
    const results = [{ stress_score: 0.9 }] as any;
    expect(averageStressScores(results)).toBeCloseTo(0.9, 5);
  });
});

describe('getTierColor', () => {
  it('returns red styling for red tier', async () => {
    const { getTierColor } = await import('../composite');
    expect(getTierColor('red')).toContain('bg-accent');
  });

  it('returns amber styling for amber tier', async () => {
    const { getTierColor } = await import('../composite');
    expect(getTierColor('amber')).toContain('bg-ink-300');
  });

  it('returns green styling for green tier', async () => {
    const { getTierColor } = await import('../composite');
    expect(getTierColor('green')).toContain('bg-chrome');
  });
});

describe('getTierDot', () => {
  it('returns accent dot for red tier', async () => {
    const { getTierDot } = await import('../composite');
    expect(getTierDot('red')).toBe('bg-accent');
  });

  it('returns ink-300 dot for amber tier', async () => {
    const { getTierDot } = await import('../composite');
    expect(getTierDot('amber')).toBe('bg-ink-300');
  });

  it('returns chrome dot for green tier', async () => {
    const { getTierDot } = await import('../composite');
    expect(getTierDot('green')).toBe('bg-chrome');
  });
});
