import { describe, it, expect, vi } from 'vitest';

describe('ml-client', () => {
  it('exports expected functions and types', async () => {
    const mod = await import('../ml-client');
    expect(typeof mod.analyzeSentiment).toBe('function');
    expect(typeof mod.analyzeSingle).toBe('function');
    expect(typeof mod.averageStressScores).toBe('function');
    expect(typeof mod.maxStressScore).toBe('function');
  });

  it('averageStressScores returns 0 for empty array', async () => {
    const { averageStressScores } = await import('../ml-client');
    expect(averageStressScores([])).toBe(0);
  });

  it('averageStressScores computes average', async () => {
    const { averageStressScores } = await import('../ml-client');
    const results = [
      {
        text: 'a',
        sentiment: 'NEGATIVE',
        stress_score: 0.8,
        confidence: 0.9,
        level: 'high',
        probabilities: { positive: 0.2, negative: 0.8 },
      },
      {
        text: 'b',
        sentiment: 'POSITIVE',
        stress_score: 0.2,
        confidence: 0.9,
        level: 'low',
        probabilities: { positive: 0.8, negative: 0.2 },
      },
    ];
    expect(averageStressScores(results)).toBe(0.5);
  });

  it('maxStressScore returns 0 for empty array', async () => {
    const { maxStressScore } = await import('../ml-client');
    expect(maxStressScore([])).toBe(0);
  });

  it('maxStressScore returns maximum', async () => {
    const { maxStressScore } = await import('../ml-client');
    const results = [
      {
        text: 'a',
        sentiment: 'NEGATIVE',
        stress_score: 0.3,
        confidence: 0.9,
        level: 'low',
        probabilities: { positive: 0.7, negative: 0.3 },
      },
      {
        text: 'b',
        sentiment: 'NEGATIVE',
        stress_score: 0.9,
        confidence: 0.95,
        level: 'high',
        probabilities: { positive: 0.1, negative: 0.9 },
      },
    ];
    expect(maxStressScore(results)).toBe(0.9);
  });
});
