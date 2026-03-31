import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  
  if (!session || !session.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Baseline data from the session token
  const userData = {
    id: session.id,
    name: session.name || session.username,
    username: session.username,
    role: session.role,
    lastLogin: session.lastLogin,
  };

  return NextResponse.json(userData);
}
