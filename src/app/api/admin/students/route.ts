import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { studentQueries } from '@/lib/db/queries';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const students = await studentQueries.list(100);
  const total = await studentQueries.count();
  return NextResponse.json({ data: students, total });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  if (!body.email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

  const student = await studentQueries.create({
    email: body.email,
    name: body.name,
    externalId: body.externalId,
  });
  return NextResponse.json({ data: student }, { status: 201 });
}
