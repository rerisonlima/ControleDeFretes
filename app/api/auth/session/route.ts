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
  };

  try {
    // Attempt to fetch fresh data from DB
    const user = await prisma.user.findUnique({
      where: { id: session.id as number },
      select: {
        id: true,
        name: true,
        username: true,
        role: true,
        lastLogin: true,
        email: true,
      }
    });

    if (user) {
      return NextResponse.json(user);
    }
  } catch (error) {
    console.error('Error fetching user session from DB:', error);
    // If DB fails, we still return the basic session data so the UI doesn't break
  }

  return NextResponse.json(userData);
}
