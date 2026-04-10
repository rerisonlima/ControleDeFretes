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
    // The distance of a trip is the odometer of the NEXT trip minus the current trip's odometer
    const tripsWithDistance = [];
    
    // Group trips by vehicle to easily find the next one
    const tripsByVehicle: Record<number, any[]> = {};
    trips.forEach(t => {
      if (!tripsByVehicle[t.vehicleId]) tripsByVehicle[t.vehicleId] = [];
      tripsByVehicle[t.vehicleId].push(t);
    });

    // For each vehicle, calculate distances
    for (const vIdStr of Object.keys(tripsByVehicle)) {
      const vId = Number(vIdStr);
      const vehicleTrips = tripsByVehicle[vId];
      
      for (let i = 0; i < vehicleTrips.length; i++) {
        const trip = vehicleTrips[i];
        let nextOdometer = null;
        
        if (i < vehicleTrips.length - 1) {
          // Next trip is in the current list
          nextOdometer = vehicleTrips[i + 1].odometer;
        } else {
          // Next trip is outside the current period, fetch from DB
          const nextTrip = await prisma.trip.findFirst({
            where: {
              vehicleId: vId,
              OR: [
                { scheduledAt: { gt: trip.scheduledAt } },
                { 
                  scheduledAt: trip.scheduledAt,
                  id: { gt: trip.id }
                }
              ]
            },
            orderBy: [
              { scheduledAt: 'asc' },
              { id: 'asc' }
            ],
            select: { odometer: true }
          });
          nextOdometer = nextTrip?.odometer || null;
        }
        
        const distance = (trip.odometer !== null && nextOdometer !== null) ? Math.max(0, nextOdometer - trip.odometer) : 0;
        
        tripsWithDistance.push({
          ...trip,
          distance: distance
        });
      }
    }

    // Sort back by scheduledAt and id to maintain consistent order
    tripsWithDistance.sort((a, b) => {
      const dateA = new Date(a.scheduledAt).getTime();
      const dateB = new Date(b.scheduledAt).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return a.id - b.id;
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

    return NextResponse.json({ trips: tripsWithDistance, expenses });
  } catch (error) {
    console.error('Failed to fetch report data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
