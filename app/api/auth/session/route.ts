import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

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
    // Ensure ID is a number
    const userId = typeof session.id === 'string' ? parseInt(session.id, 10) : (session.id as number);
    
    if (isNaN(userId)) {
      console.error('Invalid user ID in session:', session.id);
      return NextResponse.json(userData);
    }

    // Attempt to fetch fresh data from DB
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      // @ts-expect-error - Prisma error details
      if (error.code) console.error('Prisma Error Code:', error.code);
      // @ts-expect-error - Prisma error details
      if (error.meta) console.error('Prisma Error Meta:', JSON.stringify(error.meta, null, 2));
    }
    // If DB fails, we still return the basic session data so the UI doesn't break
  }

  return NextResponse.json(userData);
}
