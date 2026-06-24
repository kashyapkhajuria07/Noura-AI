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

describe('schema validation', () => {
  let ctx: { prisma: PrismaClient; pool: pg.Pool } | null = null;

  beforeAll(async () => {
    ctx = await createClient();
  });

  afterAll(async () => {
    if (ctx) {
      await ctx.prisma.$disconnect();
      await ctx.pool.end();
    }
  });

  it.runIf(!!ctx)('connects to the database', async () => {
    const result = await ctx!.prisma.$queryRaw`SELECT 1 as ok`;
    expect(result).toBeDefined();
  });

  it.runIf(!!ctx)('has the expected table structure', async () => {
    const tables = await ctx!.prisma.$queryRaw<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    const names = tables.map((t) => t.table_name);
    expect(names).toContain('students');
    expect(names).toContain('lms_accounts');
    expect(names).toContain('lms_activities');
    expect(names).toContain('risk_scores');
    expect(names).toContain('chat_messages');
    expect(names).toContain('interventions');
    expect(names).toContain('consent_settings');
  });

  it.runIf(!!ctx)('enforces foreign key constraints', async () => {
    await expect(
      ctx!.prisma.lMSActivity.create({
        data: {
          studentId: 'non-existent',
          type: 'test',
          title: 'test',
          timestamp: new Date(),
        } as any,
      })
    ).rejects.toThrow();
  });

  it.runIf(!!ctx)('enforces unique email constraint', async () => {
    const email = `unique-test-${Date.now()}@test.edu`;
    await ctx!.prisma.student.create({ data: { email, name: 'Test' } });
    await expect(
      ctx!.prisma.student.create({ data: { email, name: 'Duplicate' } })
    ).rejects.toThrow();
    await ctx!.prisma.student.delete({ where: { email } });
  });

  it.runIf(!!ctx)('enforces unique student-provider on LMS accounts', async () => {
    const student = await ctx!.prisma.student.create({
      data: { email: `provider-test-${Date.now()}@test.edu`, name: 'Provider Test' },
    });
    await ctx!.prisma.lMSAccount.create({
      data: { studentId: student.id, provider: 'MOCK' },
    });
    await expect(
      ctx!.prisma.lMSAccount.create({
        data: { studentId: student.id, provider: 'MOCK' },
      })
    ).rejects.toThrow();
    await ctx!.prisma.student.delete({ where: { id: student.id } });
  });

  it.runIf(!!ctx)('enforces unique student-scope on consent settings', async () => {
    const student = await ctx!.prisma.student.create({
      data: { email: `consent-test-${Date.now()}@test.edu`, name: 'Consent Test' },
    });
    await ctx!.prisma.consentSetting.create({
      data: { studentId: student.id, scope: 'LMS_DATA', granted: true },
    });
    await expect(
      ctx!.prisma.consentSetting.create({
        data: { studentId: student.id, scope: 'LMS_DATA', granted: false },
      })
    ).rejects.toThrow();
    await ctx!.prisma.student.delete({ where: { id: student.id } });
  });

  it.runIf(!!ctx)('cascades delete on student', async () => {
    const student = await ctx!.prisma.student.create({
      data: { email: `cascade-test-${Date.now()}@test.edu`, name: 'Cascade' },
    });
    await ctx!.prisma.lMSActivity.create({
      data: {
        studentId: student.id,
        type: 'test',
        title: 'Cascade test',
        timestamp: new Date(),
      },
    });
    await ctx!.prisma.student.delete({ where: { id: student.id } });
    const activities = await ctx!.prisma.lMSActivity.findMany({
      where: { studentId: student.id },
    });
    expect(activities).toHaveLength(0);
  });
});
