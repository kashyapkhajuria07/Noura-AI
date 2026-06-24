type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  route?: string;
  duration?: number;
  userId?: string;
  stack?: string;
}

function formatTimestamp(): string {
  return new Date().toISOString();
}

function shouldLog(level: LogLevel): boolean {
  const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  const configured: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
  return levels.indexOf(level) >= levels.indexOf(configured);
}

function log(entry: LogEntry): void {
  if (!shouldLog(entry.level)) return;

  const prefix = `[${formatTimestamp()}] [${entry.level.toUpperCase()}]`;
  const message = `${prefix} ${entry.message}`;

  switch (entry.level) {
    case 'error':
      console.error(message, entry.context ?? '', entry.stack ?? '');
      break;
    case 'warn':
      console.warn(message, entry.context ?? '');
      break;
    case 'debug':
      console.debug(message, entry.context ?? '');
      break;
    default:
      console.log(message, entry.context ?? '');
  }
}

async function persistError(entry: LogEntry): Promise<void> {
  if (entry.level !== 'error') return;
  try {
    const { prisma } = await import('@/lib/db/client');
    const { Prisma } = await import('@/generated/prisma/client');
    await prisma.errorLog.create({
      data: {
        level: entry.level,
        message: entry.message,
        stack: entry.stack ?? null,
        context: (entry.context as any) ?? Prisma.DbNull,
        route: entry.route ?? null,
        duration: entry.duration ?? null,
        userId: entry.userId ?? null,
      },
    });
  } catch {
    console.error('[Logger] Failed to persist error to database');
  }
}

export const logger = {
  debug(message: string, context?: Record<string, unknown>) {
    log({ level: 'debug', message, context });
  },

  info(message: string, context?: Record<string, unknown>) {
    log({ level: 'info', message, context });
  },

  warn(message: string, context?: Record<string, unknown>) {
    log({ level: 'warn', message, context });
  },

  error(message: string, context?: Record<string, unknown>, stack?: string) {
    const entry: LogEntry = { level: 'error', message, context, stack };
    log(entry);
    persistError(entry);
  },
};

export async function getErrorLogs(limit = 50, offset = 0) {
  try {
    const { prisma } = await import('@/lib/db/client');
    const [logs, total] = await Promise.all([
      prisma.errorLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.errorLog.count(),
    ]);
    return { logs, total };
  } catch {
    return { logs: [], total: 0 };
  }
}

export function apiLogger(route: string, startTime: number, userId?: string) {
  const duration = Date.now() - startTime;
  if (duration > 100) {
    logger.warn(`Slow API response`, { route, durationMs: duration, userId });
  }
  return duration;
}
