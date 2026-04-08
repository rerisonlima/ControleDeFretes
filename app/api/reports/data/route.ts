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

    // Calculate distance for each trip
    // We need the odometer of the trip immediately preceding each trip to calculate distance
    const vehicleIds = Array.from(new Set(trips.map(t => t.vehicleId)));
    
    // Get the odometer of the trip just before the start date for each vehicle
    const initialOdometers: Record<number, number> = {};
    await Promise.all(vehicleIds.map(async (vId) => {
      const prevTrip = await prisma.trip.findFirst({
        where: {
          vehicleId: vId,
          scheduledAt: { lt: startDate }
        },
        orderBy: { scheduledAt: 'desc' },
        select: { odometer: true }
      });
      if (prevTrip) {
        initialOdometers[vId] = prevTrip.odometer || 0;
      }
    }));

    const tripsWithDistance = [];
    const lastOdoByVehicle: Record<number, number> = { ...initialOdometers };

    for (const trip of trips) {
      const prevOdo = lastOdoByVehicle[trip.vehicleId];
      // Distance is current odometer minus previous odometer
      // If no previous odometer is known, we can't calculate distance accurately for the first trip in the sequence
      const distance = (trip.odometer && prevOdo !== undefined) ? Math.max(0, trip.odometer - prevOdo) : 0;
      
      tripsWithDistance.push({
        ...trip,
        distance: distance
      });
      
      if (trip.odometer) {
        lastOdoByVehicle[trip.vehicleId] = trip.odometer;
      }
    }

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

    return NextResponse.json({ trips: tripsWithDistance, expenses });
  } catch (error) {
    console.error('Failed to fetch report data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
