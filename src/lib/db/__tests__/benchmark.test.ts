import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

async function createClient() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    idleTimeoutMillis: 3000,
    connectionTimeoutMillis: 3000,
  });
  try {
    const client = await pool.connect();
    client.release();
  } catch {
    pool.end();
    return null;
  }
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });
  await prisma.$connect();
  return { prisma, pool };
}

const STUDENT_ID = 'benchmark-test-student';

describe('query performance', () => {
  let ctx: { prisma: PrismaClient; pool: pg.Pool } | null = null;

  beforeAll(async () => {
    ctx = await createClient();
    if (!ctx) return;
    await ctx.prisma.student.upsert({
      where: { id: STUDENT_ID },
      update: {},
      create: { id: STUDENT_ID, email: 'benchmark@test.edu', name: 'Benchmark' },
    });

    const activities = Array.from({ length: 100 }, (_, i) => ({
      studentId: STUDENT_ID,
      type: i % 2 === 0 ? 'assignment_submitted' : 'course_access',
      title: `Benchmark Activity ${i}`,
      courseId: 'course-1',
      courseName: 'CS 301',
      score: i % 3 === 0 ? Math.random() * 100 : undefined,
      maxScore: 100,
      timestamp: new Date(Date.now() - i * 3600000),
    }));
    await ctx.prisma.lMSActivity.createMany({ data: activities, skipDuplicates: true });

    const scores = Array.from({ length: 20 }, (_, i) => ({
      studentId: STUDENT_ID,
      level: (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const)[i % 4],
      score: Math.random() * 100,
      factors: { sample: true },
      computedAt: new Date(Date.now() - i * 86400000),
    }));
    await ctx.prisma.riskScore.createMany({ data: scores, skipDuplicates: true });
  });

  afterAll(async () => {
    if (ctx) {
      await ctx.prisma.student.delete({ where: { id: STUDENT_ID } }).catch(() => {});
      await ctx.prisma.$disconnect();
      await ctx.pool.end();
    }
  });

  it.runIf(!!ctx)('fetches student by ID under 50ms', async () => {
    const start = performance.now();
    const student = await ctx!.prisma.student.findUnique({ where: { id: STUDENT_ID } });
    const duration = performance.now() - start;
    expect(student).not.toBeNull();
    expect(duration).toBeLessThan(50);
  });

  it.runIf(!!ctx)('fetches recent activities under 50ms', async () => {
    const start = performance.now();
    const activities = await ctx!.prisma.lMSActivity.findMany({
      where: { studentId: STUDENT_ID },
      orderBy: { timestamp: 'desc' },
      take: 20,
    });
    const duration = performance.now() - start;
    expect(activities.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(50);
  });

  it.runIf(!!ctx)('fetches risk score history under 50ms', async () => {
    const start = performance.now();
    const scores = await ctx!.prisma.riskScore.findMany({
      where: { studentId: STUDENT_ID },
      orderBy: { computedAt: 'desc' },
      take: 10,
    });
    const duration = performance.now() - start;
    expect(scores.length).toBeGreaterThan(0);
    expect(duration).toBeLessThan(50);
  });

  it.runIf(!!ctx)('performs student lookup by email under 50ms', async () => {
    const start = performance.now();
    const student = await ctx!.prisma.student.findUnique({ where: { email: 'benchmark@test.edu' } });
    const duration = performance.now() - start;
    expect(student).not.toBeNull();
    expect(duration).toBeLessThan(50);
  });
});
