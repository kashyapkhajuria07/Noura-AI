import { describe, it, expect } from 'vitest';
import { PROMPTS, getPromptsByCategory, getPromptById, getRandomPrompt } from '../prompts';

describe('PROMPTS', () => {
  it('has at least 20 prompts', () => {
    expect(PROMPTS.length).toBeGreaterThanOrEqual(20);
  });

  it('has all 5 categories represented', () => {
    const cats = new Set(PROMPTS.map((p) => p.category));
    expect(cats.has('energy')).toBe(true);
    expect(cats.has('gratitude')).toBe(true);
    expect(cats.has('reflection')).toBe(true);
    expect(cats.has('cbt')).toBe(true);
    expect(cats.has('goals')).toBe(true);
  });

  it('every prompt has a unique id', () => {
    const ids = PROMPTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every prompt has non-empty text', () => {
    for (const p of PROMPTS) {
      expect(p.text.length).toBeGreaterThan(0);
    }
  });
});

describe('getPromptsByCategory', () => {
  it('returns only prompts of given category', () => {
    const energy = getPromptsByCategory('energy');
    expect(energy.length).toBeGreaterThan(0);
    expect(energy.every((p) => p.category === 'energy')).toBe(true);
  });

  it('returns empty for non-existent category', () => {
    const result = getPromptsByCategory('nonexistent' as any);
    expect(result).toHaveLength(0);
  });
});

describe('getPromptById', () => {
  it('returns prompt for valid id', () => {
    const p = getPromptById('p01');
    expect(p).toBeDefined();
    expect(p!.id).toBe('p01');
  });

  it('returns undefined for invalid id', () => {
    expect(getPromptById('nonexistent')).toBeUndefined();
  });
});

describe('getRandomPrompt', () => {
  it('returns a valid prompt', () => {
    const p = getRandomPrompt();
    expect(p).toBeDefined();
    expect(p.text.length).toBeGreaterThan(0);
    expect(p.id).toBeDefined();
  });
});
