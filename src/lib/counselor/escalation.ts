import type { CompositeTier, RiskTimelineEntry } from '@/lib/risk/composite';
import type { EscalationAction, EscalationTier } from './types';

export function getEscalationTier(tier: CompositeTier, hasConsent: boolean): EscalationTier {
  if (tier === 'red' && hasConsent) return 'auto_notify';
  if (tier === 'amber' || tier === 'red') return 'suggest_contact';
  return 'self_help';
}

export function getEscalationActions(tier: CompositeTier, hasConsent: boolean): EscalationAction {
  const escalationTier = getEscalationTier(tier, hasConsent);

  const actions: Record<EscalationTier, EscalationAction> = {
    self_help: {
      tier: 'self_help',
      label: 'Self-Help Resources',
      description: 'Student is managing well. Provide wellness resources for continued support.',
      actions: [
        'Show guided breathing exercises',
        'Recommend study-life balance tips',
        'Share campus wellness center info',
        'Suggest mindfulness app download',
      ],
    },
    suggest_contact: {
      tier: 'suggest_contact',
      label: 'Suggest Human Contact',
      description: 'Early warning signs detected. Encourage reaching out to a trusted person.',
      actions: [
        'Prompt to talk to a friend or family member',
        'Share peer support group schedules',
        'Recommend scheduling with academic advisor',
        'Provide crisis text line number',
      ],
    },
    auto_notify: {
      tier: 'auto_notify',
      label: 'Auto-Notify Counselor',
      description: 'Significant risk detected with consent. Automated counselor alert triggered.',
      actions: [
        'Counselor dashboard alerted (anonymized)',
        'Risk report generated for review',
        'Supportive email queued for counselor review',
        'Intervention tracking initiated',
      ],
    },
  };

  return actions[escalationTier];
}

export function generateSupportMessage(student: {
  riskTier: CompositeTier;
  triggeredRules: string[];
  timeline: RiskTimelineEntry[];
}): string {
  const name = 'Student';
  const ruleDescriptions = student.triggeredRules.map((r) => r.replace(/_/g, ' ')).join(', ');

  const tierIntro: Record<string, string> = {
    red: "I'm reaching out because our wellness system has noticed some signs that suggest you might be going through a difficult time.",
    amber:
      "I wanted to check in because we've observed some changes in your academic patterns that might indicate you could use some support.",
  };

  const intro = tierIntro[student.riskTier] ?? tierIntro.amber;

  const ruleSection = ruleDescriptions ? ` Specifically, we've noticed: ${ruleDescriptions}.` : '';

  return `Hi ${name},

${intro}${ruleSection}

I want you to know that support is available, and reaching out is a sign of strength. Would you be open to a brief check-in conversation? We can discuss strategies that might help, and I can connect you with resources tailored to what you're experiencing.

You're not alone in this. Please let me know what time might work for you.

Warm regards,
Wellness Support Team`;
}

export function anonymizeStudentId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).slice(0, 8).toUpperCase();
}
