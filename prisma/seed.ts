import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { encrypt } from '../src/lib/db/encryption';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const studentData = [
  { email: 'alex.chen@student.edu', name: 'Alex Chen' },
  { email: 'maya.rodriguez@student.edu', name: 'Maya Rodriguez' },
  { email: 'jordan.smith@student.edu', name: 'Jordan Smith' },
  { email: 'taylor.wu@student.edu', name: 'Taylor Wu' },
  { email: 'sam.patel@student.edu', name: 'Sam Patel' },
  { email: 'riley.johnson@student.edu', name: 'Riley Johnson' },
  { email: 'casey.kim@student.edu', name: 'Casey Kim' },
  { email: 'jessica.lee@student.edu', name: 'Jessica Lee' },
];

const activityTypes = ['assignment_submitted', 'assignment_graded', 'course_access', 'discussion_post', 'file_view', 'quiz_taken', 'module_completed'];
const courseNames = [
  'CS 301: Data Structures & Algorithms',
  'MATH 201: Linear Algebra',
  'ENG 110: Composition & Rhetoric',
  'PHYS 101: Classical Mechanics',
];

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randItem<T>(arr: readonly T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function recentDate(daysBack: number) {
  const d = new Date();
  d.setDate(d.getDate() - rand(0, daysBack));
  d.setHours(rand(8, 22), rand(0, 59));
  return d;
}

async function seed() {
  console.log('Seeding database...');

  for (const s of studentData) {
    const student = await prisma.student.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        name: s.name,
        encryptedData: encrypt(JSON.stringify({ phone: `+1${rand(200, 999)}${rand(1000000, 9999999)}`, ssnLast4: String(rand(1000, 9999)) })),
      },
    });

    await prisma.lMSAccount.upsert({
      where: { studentId_provider: { studentId: student.id, provider: 'MOCK' } },
      update: {},
      create: {
        studentId: student.id,
        provider: 'MOCK',
        providerId: `mock-${student.id.slice(0, 8)}`,
        enabled: true,
      },
    });

    const activities = Array.from({ length: rand(5, 15) }, () => ({
      studentId: student.id,
      type: randItem(activityTypes),
      title: `${randItem(['Homework', 'Quiz', 'Lab', 'Project', 'Reading', 'Discussion'])} ${rand(1, 10)}`,
      courseId: `course-${rand(1, 4)}`,
      courseName: randItem(courseNames),
      score: Math.random() > 0.3 ? rand(40, 100) : undefined,
      maxScore: 100,
      timestamp: recentDate(14),
    }));
    await prisma.lMSActivity.createMany({ data: activities, skipDuplicates: true });

    const riskLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
    const scores = Array.from({ length: rand(3, 8) }, () => ({
      studentId: student.id,
      level: riskLevels[Math.floor(Math.random() * riskLevels.length)],
      score: Math.random() * 100,
      factors: { missedAssignments: rand(0, 5), lowScores: rand(0, 3), loginFrequency: rand(0, 20) },
      computedAt: recentDate(14),
    }));
    await prisma.riskScore.createMany({ data: scores, skipDuplicates: true });

    const convo = [
      { role: 'assistant', content: 'Hi! How are you feeling about your coursework today?' },
      { role: 'user', content: 'I\'m feeling a bit overwhelmed with the assignments.' },
      { role: 'assistant', content: 'That\'s completely understandable. Would you like to talk about what\'s been the most challenging?' },
      { role: 'user', content: 'The data structures project is really tough. I don\'t think I\'ll finish on time.' },
      { role: 'assistant', content: 'I hear you. Let me check on your current progress and see what support options are available.' },
    ];
    for (const msg of convo) {
      await prisma.chatMessage.create({
        data: {
          studentId: student.id,
          role: msg.role,
          content: msg.content,
          encrypted: false,
        },
      });
    }

    if (Math.random() > 0.4) {
      await prisma.intervention.create({
        data: {
          studentId: student.id,
          type: randItem(['EMAIL', 'MEETING', 'ACADEMIC_ALERT', 'CHECK_IN']),
          status: randItem(['PENDING', 'ACTIVE', 'COMPLETED']),
          title: `${randItem(['Follow-up', 'Check-in', 'Support', 'Outreach'])} for ${s.name}`,
          note: `Student reported feeling ${randItem(['overwhelmed', 'behind', 'stressed', 'motivated'])}`,
          assignedTo: randItem(['Dr. Sarah Chen', 'Prof. James Murphy', 'Advisor Kim']),
          dueDate: Math.random() > 0.5 ? recentDate(7) : undefined,
        },
      });
    }

    for (const scope of ['LMS_DATA', 'CHAT_LOGS', 'ANALYTICS']) {
      await prisma.consentSetting.upsert({
        where: { studentId_scope: { studentId: student.id, scope: scope as any } },
        update: {},
        create: {
          studentId: student.id,
          scope: scope as any,
          granted: Math.random() > 0.2,
          grantedAt: new Date(),
        },
      });
    }
  }

  console.log('Seed complete!');
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
