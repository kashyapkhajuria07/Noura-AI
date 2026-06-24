import { prisma, riskScoreQueries } from '@/lib/db';
import { RuleEngine } from './engine';
import type { RiskAssessment, BatchResult } from './types';

export async function assessStudentDb(studentId: string): Promise<RiskAssessment> {
  const engine = new RuleEngine();
  const activities = await prisma.lMSActivity.findMany({
    where: { studentId },
    orderBy: { timestamp: 'desc' },
    take: 500,
  });

  const assessment = { studentId, ...engine.assess(activities) };

  await riskScoreQueries.create({
    student: { connect: { id: studentId } },
    level: assessment.level,
    score: assessment.overallScore,
    factors: assessment.factors as any,
    computedAt: new Date(),
  });

  return assessment;
}

export async function assessAllStudentsDb(batchSize = 50): Promise<BatchResult> {
  const engine = new RuleEngine();
  const start = performance.now();
  const assessments: RiskAssessment[] = [];
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

    const batchResults = await Promise.allSettled(
      students.map((s) => assessStudentDb(s.id))
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        assessments.push(result.value);
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
    assessments,
    durationMs: Math.round(performance.now() - start),
    errors,
  };
}
