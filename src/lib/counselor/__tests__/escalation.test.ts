import { describe, it, expect } from 'vitest';
import {
  getEscalationTier,
  getEscalationActions,
  generateSupportMessage,
  anonymizeStudentId,
} from '../escalation';

describe('getEscalationTier', () => {
  it('returns self_help for green tier', () => {
    expect(getEscalationTier('green', false)).toBe('self_help');
    expect(getEscalationTier('green', true)).toBe('self_help');
  });

  it('returns suggest_contact for amber tier regardless of consent', () => {
    expect(getEscalationTier('amber', false)).toBe('suggest_contact');
    expect(getEscalationTier('amber', true)).toBe('suggest_contact');
  });

  it('returns suggest_contact for red tier without consent', () => {
    expect(getEscalationTier('red', false)).toBe('suggest_contact');
  });

  it('returns auto_notify for red tier with consent', () => {
    expect(getEscalationTier('red', true)).toBe('auto_notify');
  });
});

describe('getEscalationActions', () => {
  it('provides self-help actions for green', () => {
    const actions = getEscalationActions('green', false);
    expect(actions.tier).toBe('self_help');
    expect(actions.actions.length).toBeGreaterThan(0);
    expect(actions.label).toContain('Self-Help');
  });

  it('provides suggest_contact actions for amber', () => {
    const actions = getEscalationActions('amber', true);
    expect(actions.tier).toBe('suggest_contact');
    expect(actions.actions.some((a) => a.includes('friend') || a.includes('peer'))).toBe(true);
  });

  it('provides auto_notify actions for red with consent', () => {
    const actions = getEscalationActions('red', true);
    expect(actions.tier).toBe('auto_notify');
    expect(actions.actions.some((a) => a.includes('Counselor'))).toBe(true);
  });

  it('provides suggest_contact actions for red without consent', () => {
    const actions = getEscalationActions('red', false);
    expect(actions.tier).toBe('suggest_contact');
  });
});

describe('generateSupportMessage', () => {
  it('generates a message for amber tier', () => {
    const msg = generateSupportMessage({
      riskTier: 'amber',
      triggeredRules: ['engagement_drop'],
      timeline: [],
    });
    expect(msg).toContain('check in');
    expect(msg).toContain('engagement drop');
    expect(msg).toContain('Warm regards');
  });

  it('generates a message for red tier', () => {
    const msg = generateSupportMessage({
      riskTier: 'red',
      triggeredRules: ['late_night', 'assignment_churn'],
      timeline: [],
    });
    expect(msg).toContain('difficult time');
    expect(msg).toContain('late night');
    expect(msg).toContain('assignment churn');
  });

  it('includes triggered rules section when rules exist', () => {
    const msg = generateSupportMessage({
      riskTier: 'amber',
      triggeredRules: ['participation_gap'],
      timeline: [],
    });
    expect(msg).toContain('participation gap');
  });

  it('works without triggered rules', () => {
    const msg = generateSupportMessage({
      riskTier: 'amber',
      triggeredRules: [],
      timeline: [],
    });
    expect(msg).toContain('check in');
    expect(msg).not.toContain('Specifically');
  });
});

describe('anonymizeStudentId', () => {
  it('produces 8-char uppercase hash', () => {
    const hash = anonymizeStudentId('student-123');
    expect(hash.length).toBe(8);
    expect(hash).toMatch(/^[0-9A-F]+$/);
  });

  it('produces different hashes for different IDs', () => {
    const h1 = anonymizeStudentId('student-1');
    const h2 = anonymizeStudentId('student-2');
    expect(h1).not.toBe(h2);
  });

  it('produces same hash for same ID', () => {
    const h1 = anonymizeStudentId('same-id');
    const h2 = anonymizeStudentId('same-id');
    expect(h1).toBe(h2);
  });
});
