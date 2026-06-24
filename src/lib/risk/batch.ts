import { assessAllComposite } from './composite';

export async function runDailyRiskAssessment(): Promise<{
  processed: number;
  durationMs: number;
  errors: string[];
}> {
  console.log(`[RiskBatch] Starting composite daily assessment at ${new Date().toISOString()}`);
  const result = await assessAllComposite(50);

  console.log(
    `[RiskBatch] Complete: ${result.processed} students processed in ${result.durationMs}ms` +
      (result.errors.length > 0 ? ` (${result.errors.length} errors)` : '')
  );

  return {
    processed: result.processed,
    durationMs: result.durationMs,
    errors: result.errors,
  };
}

if (require.main === module) {
  runDailyRiskAssessment()
    .then((r) => {
      console.log(`Done. Processed ${r.processed} students in ${r.durationMs}ms`);
      process.exit(0);
    })
    .catch((e) => {
      console.error('Batch failed:', e);
      process.exit(1);
    });
}
