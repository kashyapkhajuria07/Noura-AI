export interface MLResult {
  text: string;
  sentiment: string;
  stress_score: number;
  confidence: number;
  level: string;
  probabilities: { positive: number; negative: number };
}

export interface MLAnalyzeResponse {
  results: MLResult[];
  processed_count: number;
  duration_ms: number;
}

const ML_API = process.env.ML_API_URL || 'http://localhost:8000';

export async function analyzeSentiment(texts: string[]): Promise<MLAnalyzeResponse> {
  const res = await fetch(`${ML_API}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => 'Unknown error');
    throw new Error(`ML service error (${res.status}): ${err}`);
  }

  return res.json();
}

export async function analyzeSingle(text: string): Promise<MLResult> {
  const res = await analyzeSentiment([text]);
  return res.results[0];
}

export function averageStressScores(results: MLResult[]): number {
  if (results.length === 0) return 0;
  const sum = results.reduce((acc, r) => acc + r.stress_score, 0);
  return sum / results.length;
}

export function maxStressScore(results: MLResult[]): number {
  if (results.length === 0) return 0;
  return Math.max(...results.map((r) => r.stress_score));
}
