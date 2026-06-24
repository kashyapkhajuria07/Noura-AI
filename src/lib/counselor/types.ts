import type { CompositeTier, RiskTimelineEntry } from '@/lib/risk/composite';

export type EscalationTier = 'self_help' | 'suggest_contact' | 'auto_notify';

export interface EscalationAction {
  tier: EscalationTier;
  label: string;
  description: string;
  actions: string[];
}

export interface AnonymizedStudent {
  idHash: string;
  fullId: string;
  riskTier: CompositeTier;
  compositeScore: number;
  triggeredRules: string[];
  timeline: RiskTimelineEntry[];
  lastActivity: string | null;
  hasConsent: boolean;
  interventionCount: number;
}

export interface CounselorIntervention {
  id: string;
  studentId: string;
  type: string;
  status: string;
  title: string;
  note: string | null;
  createdAt: string;
}
