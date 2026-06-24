import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { riskScoreQueries } from '@/lib/db/queries';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const level = searchParams.get('level');

  if (level) {
    const data = await riskScoreQueries.studentsByLevel(level);
    return NextResponse.json({ data });
  }

  return NextResponse.json({ error: 'Specify a level filter' }, { status: 400 });
}
