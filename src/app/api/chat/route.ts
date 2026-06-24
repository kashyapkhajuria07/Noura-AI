import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { prisma } from '@/lib/db/client';
import { chatCompletion, getQuickReplies } from '@/lib/chat/llm';
import type { ChatMessage } from '@/lib/chat/llm';

async function resolveStudentId(session: any): Promise<string | null> {
  const rawId = session.user?.id;
  if (!rawId) return null;

  const existing = await prisma.student.findUnique({ where: { id: rawId }, select: { id: true } });
  if (existing) return existing.id;

  const email = session.user?.email;
  if (email) {
    const byEmail = await prisma.student.findUnique({ where: { email }, select: { id: true } });
    if (byEmail) return byEmail.id;

    const created = await prisma.student.create({
      data: { email, name: session.user?.name ?? email.split('@')[0] },
      select: { id: true },
    });
    return created.id;
  }

  return null;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const studentId = await resolveStudentId(session);
  if (!studentId) return NextResponse.json({ error: 'No student ID' }, { status: 400 });

  const { message, history } = await request.json();
  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  const userMessage = await prisma.chatMessage.create({
    data: {
      student: { connect: { id: studentId } },
      role: 'user',
      content: message.trim(),
      encrypted: false,
    },
  });

  const messages: ChatMessage[] = (history ?? []).map((m: any) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));
  messages.push({ role: 'user', content: message.trim() });

  const llmResponse = await chatCompletion(messages);

  const botMessage = await prisma.chatMessage.create({
    data: {
      student: { connect: { id: studentId } },
      role: 'assistant',
      content: llmResponse.content,
      encrypted: false,
      metadata: { quickReplies: llmResponse.quickReplies },
    },
  });

  return NextResponse.json({
    data: {
      user: {
        id: userMessage.id,
        content: userMessage.content,
        role: 'user',
        createdAt: userMessage.createdAt,
      },
      bot: {
        id: botMessage.id,
        content: botMessage.content,
        role: 'assistant',
        createdAt: botMessage.createdAt,
      },
      quickReplies: llmResponse.quickReplies,
    },
  });
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const studentId = await resolveStudentId(session);
  if (!studentId) return NextResponse.json({ error: 'No student ID' }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);

  const messages = await prisma.chatMessage.findMany({
    where: { studentId },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });

  return NextResponse.json({ data: messages });
}
