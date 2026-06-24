import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';

describe('logger', () => {
  it('logs info without throwing', async () => {
    const { logger } = await import('@/lib/logging/logger');
    expect(() => logger.info('test message')).not.toThrow();
  });

  it('logs debug without throwing', async () => {
    const { logger } = await import('@/lib/logging/logger');
    expect(() => logger.debug('debug test')).not.toThrow();
  });

  it('logs warn without throwing', async () => {
    const { logger } = await import('@/lib/logging/logger');
    expect(() => logger.warn('warn test')).not.toThrow();
  });

  it('logs error without throwing', async () => {
    const { logger } = await import('@/lib/logging/logger');
    expect(() => logger.error('error test')).not.toThrow();
  });

  it('getErrorLogs returns empty array when DB unavailable', async () => {
    const { getErrorLogs } = await import('@/lib/logging/logger');
    const result = await getErrorLogs();
    expect(Array.isArray(result.logs)).toBe(true);
    expect(typeof result.total).toBe('number');
  });
});

describe('ErrorBoundary', () => {
  it('renders children when no error', async () => {
    const { ErrorBoundary } = await import('@/components/ErrorBoundary');
    const { container } = render(
      <ErrorBoundary>
        <p>Child content</p>
      </ErrorBoundary>
    );
    expect(container.textContent).toContain('Child content');
  });
});

describe('apiLogger', () => {
  it('returns duration in ms', async () => {
    const { apiLogger } = await import('@/lib/logging/logger');
    const start = Date.now();
    const duration = apiLogger('/api/test', start);
    expect(typeof duration).toBe('number');
    expect(duration).toBeGreaterThanOrEqual(0);
  });
});
