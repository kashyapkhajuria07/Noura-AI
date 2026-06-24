import { prisma } from './client';
import type {
  Student,
  LMSAccount,
  LMSActivity,
  RiskScore,
  ChatMessage,
  Intervention,
  ConsentSetting,
  Prisma,
} from '@/generated/prisma';

type StudentWithRelations = Prisma.StudentGetPayload<{
  include: { lmsAccounts: true; consentSettings: true };
}>;

export const studentQueries = {
  async findById(id: string): Promise<Student | null> {
    return prisma.student.findUnique({ where: { id } });
  },

  async findByEmail(email: string): Promise<Student | null> {
    return prisma.student.findUnique({ where: { email } });
  },

  async findWithAccounts(id: string): Promise<StudentWithRelations | null> {
    return prisma.student.findUnique({
      where: { id },
      include: { lmsAccounts: true, consentSettings: true },
    });
  },

  async list(limit = 50, offset = 0): Promise<Student[]> {
    return prisma.student.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });
  },

  async create(data: { email: string; name?: string; externalId?: string }): Promise<Student> {
    return prisma.student.create({ data });
  },

  async update(id: string, data: Partial<Pick<Student, 'name' | 'email' | 'encryptedData'>>): Promise<Student> {
    return prisma.student.update({ where: { id }, data });
  },

  async delete(id: string): Promise<Student> {
    return prisma.student.delete({ where: { id } });
  },

  async count(): Promise<number> {
    return prisma.student.count();
  },
};

export const activityQueries = {
  async findByStudent(
    studentId: string,
    opts: { limit?: number; offset?: number; type?: string } = {}
  ): Promise<LMSActivity[]> {
    const where: Prisma.LMSActivityWhereInput = { studentId };
    if (opts.type) where.type = opts.type;
    return prisma.lMSActivity.findMany({
      where,
      take: opts.limit ?? 50,
      skip: opts.offset ?? 0,
      orderBy: { timestamp: 'desc' },
    });
  },

  async findRecent(studentId: string, days = 7): Promise<LMSActivity[]> {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return prisma.lMSActivity.findMany({
      where: { studentId, timestamp: { gte: since } },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });
  },

  async upsertMany(data: Prisma.LMSActivityCreateManyInput[]): Promise<number> {
    const result = await prisma.lMSActivity.createMany({ data, skipDuplicates: true });
    return result.count;
  },
};

export const riskScoreQueries = {
  async latest(studentId: string): Promise<RiskScore | null> {
    return prisma.riskScore.findFirst({
      where: { studentId },
      orderBy: { computedAt: 'desc' },
    });
  },

  async history(studentId: string, limit = 30): Promise<RiskScore[]> {
    return prisma.riskScore.findMany({
      where: { studentId },
      orderBy: { computedAt: 'desc' },
      take: limit,
    });
  },

  async create(data: Prisma.RiskScoreCreateInput): Promise<RiskScore> {
    return prisma.riskScore.create({ data });
  },

  async studentsByLevel(level: string): Promise<(RiskScore & { student: Student })[]> {
    return prisma.riskScore.findMany({
      where: { level: level as any },
      orderBy: { computedAt: 'desc' },
      distinct: ['studentId'],
      include: { student: true },
    });
  },
};

export const interventionQueries = {
  async findByStudent(studentId: string): Promise<Intervention[]> {
    return prisma.intervention.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findActive(limit = 50): Promise<(Intervention & { student: Student })[]> {
    return prisma.intervention.findMany({
      where: { status: { in: ['PENDING', 'ACTIVE'] } },
      include: { student: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  async create(data: Prisma.InterventionCreateInput): Promise<Intervention> {
    return prisma.intervention.create({ data });
  },

  async updateStatus(id: string, status: string): Promise<Intervention> {
    return prisma.intervention.update({
      where: { id },
      data: {
        status: status as any,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
      },
    });
  },
};

export const consentQueries = {
  async findByStudent(studentId: string): Promise<ConsentSetting[]> {
    return prisma.consentSetting.findMany({ where: { studentId } });
  },

  async upsert(
    studentId: string,
    scope: string,
    granted: boolean
  ): Promise<ConsentSetting> {
    return prisma.consentSetting.upsert({
      where: { studentId_scope: { studentId, scope: scope as any } },
      update: { granted, grantedAt: granted ? new Date() : undefined, revokedAt: granted ? undefined : new Date() },
      create: { studentId, scope: scope as any, granted, grantedAt: granted ? new Date() : undefined },
    });
  },
};

export const chatQueries = {
  async findByStudent(studentId: string, limit = 50): Promise<ChatMessage[]> {
    return prisma.chatMessage.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  async create(data: Prisma.ChatMessageCreateInput): Promise<ChatMessage> {
    return prisma.chatMessage.create({ data });
  },
};
