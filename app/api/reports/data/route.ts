import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    if (!startDateStr || !endDateStr) {
      return NextResponse.json({ error: 'Datas de início e fim são obrigatórias' }, { status: 400 });
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);
    endDate.setHours(23, 59, 59, 999);

    // Fetch all trips in the period
    const trips = await prisma.trip.findMany({
      where: {
        scheduledAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        vehicle: true,
        frete: true,
        expenses: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });

    // Fetch all expenses in the period (not just those linked to trips)
    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        vehicle: true,
      },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({ trips, expenses });
  } catch (error) {
    console.error('Failed to fetch report data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
