import { describe, it, expect } from 'vitest';
import { getQuickReplies, fallbackResponse } from '../llm';

describe('getQuickReplies', () => {
  it('returns planning replies when message mentions plan', () => {
    const replies = getQuickReplies('Can you help me plan my schedule?');
    expect(replies).toContain('Morning routine');
    expect(replies).toContain('Study schedule');
    expect(replies).toContain('Break timer');
    expect(replies).toContain('Not now');
  });

  it('returns planning replies for organize', () => {
    const replies = getQuickReplies('I need to organize my work');
    expect(replies).toContain('Morning routine');
  });

  it('returns breathing replies for anxiety', () => {
    const replies = getQuickReplies('I feel so anxious about exams');
    expect(replies).toContain('4-7-8 method');
    expect(replies).toContain('Box breathing');
    expect(replies).toContain('5-4-3-2-1 grounding');
  });

  it('returns breathing replies for stress', () => {
    const replies = getQuickReplies('I am so stressed out');
    expect(replies).toContain('4-7-8 method');
  });

  it('returns breathing replies for calm', () => {
    const replies = getQuickReplies('Need to calm down');
    expect(replies).toContain('4-7-8 method');
  });

  it('returns breathing replies for breath', () => {
    const replies = getQuickReplies('Can you help me with breathing?');
    expect(replies).toContain('4-7-8 method');
  });

  it('returns default replies for generic messages', () => {
    const replies = getQuickReplies('Hello, how are you?');
    expect(replies).toEqual(['Help me plan', 'Breathing exercise', 'Talk to someone', 'Not now']);
  });

  it('returns default replies for empty string', () => {
    const replies = getQuickReplies('');
    expect(replies).toEqual(['Help me plan', 'Breathing exercise', 'Talk to someone', 'Not now']);
  });
});

describe('fallbackResponse', () => {
  function makeMessages(content: string): any[] {
    return [{ role: 'user', content }];
  }

  it('returns breathing response for breath keywords', () => {
    const resp = fallbackResponse(makeMessages('Help me with breathing exercises'));
    expect(resp.content).toContain('breath');
    expect(resp.quickReplies).toBeDefined();
  });

  it('returns breathing response for anxiety', () => {
    const resp = fallbackResponse(makeMessages('I have anxiety about my exams'));
    expect(resp.content).toContain('breath');
  });

  it('returns planning response for planning', () => {
    const resp = fallbackResponse(makeMessages('Help me plan my day'));
    expect(resp.content).toContain('break it down');
    expect(resp.quickReplies).toContain('Morning routine');
  });

  it('returns talk response for alone', () => {
    const resp = fallbackResponse(makeMessages('I feel so alone'));
    expect(resp.content).toContain('alone');
    expect(resp.quickReplies).toContain('Talk to someone');
  });

  it('returns talk response for help', () => {
    const resp = fallbackResponse(makeMessages('I need help'));
    expect(resp.content).toContain('alone');
  });

  it('returns default response for generic message', () => {
    const resp = fallbackResponse(makeMessages('Hi there'));
    expect(resp.content).toContain('step');
    expect(resp.quickReplies).toEqual(['Help me plan', 'Breathing exercise', 'Talk to someone', 'Not now']);
  });

  it('handles no user messages', () => {
    const resp = fallbackResponse([]);
    expect(resp.content).toBeDefined();
    expect(resp.quickReplies).toBeDefined();
  });
});
