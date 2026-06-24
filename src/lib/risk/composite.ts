import { RuleEngine } from './engine';
import type { RiskAssessment, BatchResult } from './types';
import { analyzeSentiment, averageStressScores, type MLResult } from './ml-client';
import { studentQueries } from '@/lib/db/queries';
import { prisma } from '@/lib/db/client';
import { emitRiskNotification } from '@/lib/notifications/emitter';

export type CompositeTier = 'green' | 'amber' | 'red';

export interface RiskTimelineEntry {
  date: string;
  score: number;
  tier: CompositeTier;
  triggered_rules: string[];
}

export interface CompositeResult {
  studentId: string;
  ruleAssessment: Omit<RiskAssessment, 'studentId'>;
  mlScore: number;
  mlResults: MLResult[];
  compositeScore: number;
  tier: CompositeTier;
  timeline: RiskTimelineEntry[];
}

const RULE_WEIGHT = 0.6;
const ML_WEIGHT = 0.4;

export function computeTier(compositeScore: number): CompositeTier {
  if (compositeScore < 0.3) return 'green';
  if (compositeScore <= 0.7) return 'amber';
  return 'red';
}

export function normalizeRuleScore(ruleScore: number): number {
  return ruleScore / 100;
}

export async function assessComposite(
  studentId: string,
  textSubmissions?: string[]
): Promise<CompositeResult> {
  const engine = new RuleEngine();
  const activities = await prisma.lMSActivity.findMany({
    where: { studentId },
    orderBy: { timestamp: 'desc' },
    take: 500,
  });

  const ruleAssessment = engine.assess(activities);

  let mlScore = 0;
  let mlResults: MLResult[] = [];

  if (textSubmissions && textSubmissions.length > 0) {
    try {
      mlResults = (await analyzeSentiment(textSubmissions)).results;
      mlScore = averageStressScores(mlResults);
    } catch (e) {
      console.warn(`[Composite] ML service unavailable for ${studentId}:`, e);
    }
  }

  const normalizedRule = normalizeRuleScore(ruleAssessment.overallScore);
  const compositeScore = Math.min(RULE_WEIGHT * normalizedRule + ML_WEIGHT * mlScore, 1.0);
  const tier = computeTier(compositeScore);

  const triggeredRules = ruleAssessment.rules.filter((r) => r.triggered).map((r) => r.rule);

  const timelineEntry: RiskTimelineEntry = {
    date: new Date().toISOString(),
    score: Math.round(compositeScore * 100) / 100,
    tier,
    triggered_rules: triggeredRules,
  };

  const existingTimeline = await studentQueries.findById(studentId).then((s: any) => {
    const raw = s?.riskTimeline;
    if (Array.isArray(raw)) return raw as RiskTimelineEntry[];
    return [];
  });

  const updatedTimeline = [...existingTimeline, timelineEntry].slice(-90);

  await prisma.$transaction([
    prisma.student.update({
      where: { id: studentId },
      data: {
        riskTier: tier,
        compositeScore: Math.round(compositeScore * 100) / 100,
        riskTimeline: updatedTimeline as any,
      } as any,
    }),
    prisma.riskScore.create({
      data: {
        student: { connect: { id: studentId } },
        level: ruleAssessment.level,
        score: ruleAssessment.overallScore,
        compositeScore: Math.round(compositeScore * 100) / 100,
        tier,
        factors: ruleAssessment.factors as any,
        metadata: {
          mlScore,
          mlSamples: mlResults.length,
          triggeredRules: triggeredRules,
        } as any,
      } as any,
    }),
  ]);

  emitRiskNotification(studentId, tier, compositeScore, triggeredRules);

  return {
    studentId,
    ruleAssessment,
    mlScore,
    mlResults,
    compositeScore,
    tier,
    timeline: updatedTimeline,
  };
}

export async function assessAllComposite(batchSize = 50): Promise<{
  processed: number;
  results: CompositeResult[];
  durationMs: number;
  errors: string[];
}> {
  const start = performance.now();
  const results: CompositeResult[] = [];
  const errors: string[] = [];
  let processed = 0;

  let cursor: string | undefined;
  let hasMore = true;

  while (hasMore) {
    const students = await prisma.student.findMany({
      take: batchSize,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: 'asc' },
    });

    if (students.length === 0) break;

    const batchResults = await Promise.allSettled(students.map((s) => assessComposite(s.id)));

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
        processed++;
      } else {
        errors.push(result.reason?.message ?? 'Unknown error');
      }
    }

    cursor = students[students.length - 1].id;
    if (students.length < batchSize) hasMore = false;
  }

  return {
    processed,
    results,
    durationMs: Math.round(performance.now() - start),
    errors,
  };
}

export function getTierColor(tier: CompositeTier): string {
  switch (tier) {
    case 'red':
      return 'bg-accent text-paper';
    case 'amber':
      return 'bg-ink-300 text-ink';
    default:
      return 'bg-chrome/50 text-ink-600';
  }
}

export function getTierDot(tier: CompositeTier): string {
  switch (tier) {
    case 'red':
      return 'bg-accent';
    case 'amber':
      return 'bg-ink-300';
    default:
      return 'bg-chrome';
  }
}
