'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { GridOverlay } from '@/components/GridOverlay';

const ML_API = process.env.NEXT_PUBLIC_ML_API || 'http://localhost:8000';

interface AnalyzeResult {
  text: string;
  sentiment: string;
  stress_score: number;
  confidence: number;
  level: string;
  probabilities: { positive: number; negative: number };
}

function levelColor(level: string): string {
  switch (level) {
    case 'HIGH':
      return 'bg-accent text-paper';
    case 'MODERATE':
      return 'bg-ink-300 text-ink';
    default:
      return 'bg-chrome/50 text-ink-600';
  }
}

function levelBorder(level: string): string {
  switch (level) {
    case 'HIGH':
      return 'border-accent shadow-brutal-accent';
    case 'MODERATE':
      return 'border-ink-300';
    default:
      return 'border-chrome';
  }
}

function ResultCard({ result }: { result: AnalyzeResult }) {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div
        className={`p-6 border-brutal border-ink rounded-brutal shadow-brutal-sm ${levelBorder(result.level)} space-y-4`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex-1 p-3 border-brutal border-ink rounded-brutal-sm ${levelColor(result.level)}`}
          >
            <p className="font-mono text-caption uppercase tracking-wider">Stress Level</p>
            <p className="font-display text-display-sm font-bold">{result.level}</p>
          </div>
          <div className="flex-1 p-3 border-brutal border-ink rounded-brutal-sm">
            <p className="font-mono text-caption uppercase tracking-wider">Score</p>
            <p className="font-display text-display-sm font-bold">
              {(result.stress_score * 100).toFixed(0)}
            </p>
          </div>
          <div className="flex-1 p-3 border-brutal border-ink rounded-brutal-sm">
            <p className="font-mono text-caption uppercase tracking-wider">Confidence</p>
            <p className="font-display text-display-sm font-bold">
              {(result.confidence * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="font-mono text-caption uppercase tracking-wider italic text-ink-400">
            Sentiment Distribution
          </p>
          <div className="flex h-6 border-brutal border-ink rounded-brutal-sm overflow-hidden">
            <div
              className="bg-accent transition-all duration-500 flex items-center justify-center"
              style={{ width: `${result.probabilities.negative * 100}%` }}
            >
              <span className="font-mono text-caption text-paper">
                {result.probabilities.negative > 0.1
                  ? `${(result.probabilities.negative * 100).toFixed(0)}%`
                  : ''}
              </span>
            </div>
            <div
              className="bg-chrome transition-all duration-500 flex items-center justify-center"
              style={{ width: `${result.probabilities.positive * 100}%` }}
            >
              <span className="font-mono text-caption text-ink">
                {result.probabilities.positive > 0.1
                  ? `${(result.probabilities.positive * 100).toFixed(0)}%`
                  : ''}
              </span>
            </div>
          </div>
          <div className="flex justify-between font-mono text-caption text-ink-400">
            <span>Negative (stress)</span>
            <span>Positive</span>
          </div>
        </div>

        <div className="p-3 border-brutal border-ink rounded-brutal-sm bg-ink-50">
          <p className="font-mono text-caption text-ink-400 mb-1">Analyzed text</p>
          <p className="font-mono text-caption text-ink">{result.text}</p>
        </div>
      </div>
    </div>
  );
}

export default function SentimentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  const analyze = useCallback(async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${ML_API}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setResult(data.results[0]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [input]);

  if (status === 'loading') {
    return (
      <main className="brutal-container min-h-screen py-16">
        <div className="skeleton-pulse h-12 w-64 rounded-brutal-sm mb-8" />
        <div className="skeleton-pulse h-48 w-full rounded-brutal-sm" />
      </main>
    );
  }

  if (status === 'unauthenticated') return null;

  return (
    <>
      <GridOverlay />
      <main className="brutal-container min-h-screen py-16 space-y-10">
        <header className="animate-fade-in">
          <p className="font-mono text-caption uppercase tracking-widest text-ink-400">
            ML Sentiment Analysis
          </p>
          <h1 className="font-display text-heading font-bold">Stress Detector</h1>
          <p className="font-mono text-caption text-ink-400 mt-2">
            Submit text to analyze for signs of stress and burnout
          </p>
        </header>

        <div className="max-w-2xl space-y-4 animate-fade-in-up">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste student text submission here..."
            rows={5}
            className="w-full bg-paper border-brutal border-ink rounded-brutal-sm shadow-brutal-sm p-4 font-mono text-body-sm text-ink placeholder:text-ink-300 resize-y focus:outline-none focus:ring-2 focus:ring-ink"
          />

          <div className="flex items-center gap-4">
            <button
              onClick={analyze}
              disabled={loading || !input.trim()}
              className="relative font-display text-body-sm font-semibold bg-ink text-paper border-brutal border-ink rounded-brutal-sm shadow-brutal-sm px-6 py-3 hover:shadow-brutal active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>

            {result && (
              <button
                onClick={() => {
                  setInput('');
                  setResult(null);
                  setError(null);
                }}
                className="font-mono text-caption text-ink-400 hover:text-accent border-b border-ink-200 hover:border-accent transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="max-w-2xl p-4 border-brutal border-accent rounded-brutal-sm bg-accent/5 shadow-brutal-accent">
            <p className="font-mono text-caption text-accent">{error}</p>
            <p className="font-mono text-caption text-ink-400 mt-1">
              Make sure the ML service is running on port 8000
            </p>
          </div>
        )}

        {result && <ResultCard result={result} />}
      </main>
    </>
  );
}
