import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export async function recordAuditLog(
  studentId: string,
  action: string,
  details?: string
): Promise<void> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return;

    const { prisma } = await import('@/lib/db/client');

    await prisma.auditLog.create({
      data: {
        studentId,
        actorId: session.user.id,
        actorRole: (session.user as any).role ?? 'unknown',
        action,
        details: details ?? null,
      },
    });
  } catch {
    // audit logging failures should never break the caller
  }
}
