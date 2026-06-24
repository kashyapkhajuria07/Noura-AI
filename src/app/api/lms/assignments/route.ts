import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { lmsService } from '@/lib/lms/service';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('courseId');
  const status = searchParams.get('status');
  const limit = Math.min(Number(searchParams.get('limit')) || 50, 200);

  const lms = (session.user as any).lms ?? 'mock';

  try {
    const data = await lmsService.fetch({
      provider: lms,
      accessToken: (session as any).accessToken,
      userId: session.user.id,
    });

    let assignments = data.assignments;

    if (courseId) assignments = assignments.filter((a) => a.courseId === courseId);
    if (status) assignments = assignments.filter((a) => a.status === status);

    return NextResponse.json({
      data: assignments.slice(0, limit),
      total: assignments.length,
      fetchedAt: data.fetchedAt,
    });
  } catch (error) {
    console.error('Failed to fetch assignments:', error);
    return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
  }
}
