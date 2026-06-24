import 'dotenv/config';
import cron, { type ScheduledTask } from 'node-cron';
import { runDailyRiskAssessment } from './batch';
import { prisma } from '@/lib/db/client';

export function registerJobs(): ScheduledTask[] {
  const jobs: ScheduledTask[] = [];

  // Daily risk assessment at midnight (00:00)
  const dailyTask = cron.schedule('0 0 * * *', async () => {
    console.log(`[Scheduler] Triggering daily risk assessment at ${new Date().toISOString()}`);
    try {
      const result = await runDailyRiskAssessment();
      console.log(
        `[Scheduler] Daily assessment complete: ${result.processed} processed, ${result.durationMs}ms` +
          (result.errors.length > 0 ? `, ${result.errors.length} errors` : '')
      );
    } catch (err) {
      console.error('[Scheduler] Daily assessment failed:', err);
    }
  });

  jobs.push(dailyTask);
  console.log('[Scheduler] Registered daily risk assessment job (00:00)');
  return jobs;
}

async function runImmediateAndExit() {
  console.log(`[Scheduler] Running immediate assessment at ${new Date().toISOString()}`);
  const beforeCount = await prisma.riskScore.count();
  console.log(`[Scheduler] Risk scores before: ${beforeCount}`);

  const result = await runDailyRiskAssessment();

  const afterCount = await prisma.riskScore.count();
  const newScores = afterCount - beforeCount;
  console.log(`[Scheduler] Risk scores after: ${afterCount} (+${newScores})`);
  console.log(`[Scheduler] Students processed: ${result.processed}`);
  console.log(`[Scheduler] Duration: ${result.durationMs}ms`);

  const student = await prisma.student.findFirst({
    where: { compositeScore: { not: null } },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, riskTier: true, compositeScore: true, updatedAt: true },
  });
  console.log(`[Scheduler] Latest updated student:`, JSON.stringify(student, null, 2));

  await prisma.$disconnect();
  process.exit(result.errors.length > 0 ? 1 : 0);
}

if (require.main === module) {
  runImmediateAndExit().catch((err) => {
    console.error('[Scheduler] Fatal:', err);
    prisma.$disconnect();
    process.exit(1);
  });
}
