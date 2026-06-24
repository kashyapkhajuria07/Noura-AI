import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { getAnalytics } from '@/lib/admin/queries';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const report = await getAnalytics();
    return NextResponse.json({ data: report });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
