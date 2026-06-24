import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { encrypt, decrypt } from '@/lib/db/encryption';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { encrypted } = body;

    if (!encrypted || typeof encrypted !== 'string') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Verify it can be decrypted
    try {
      decrypt(encrypted);
    } catch {
      return NextResponse.json({ error: 'Cannot verify encrypted data' }, { status: 400 });
    }

    return NextResponse.json({ success: true, size: encrypted.length });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    message: 'Backup server ready. Use POST to upload encrypted data.',
    supported: true,
  });
}
