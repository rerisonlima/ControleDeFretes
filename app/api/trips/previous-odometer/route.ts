import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get('vehicleId');
    const date = searchParams.get('date');
    const excludeTripId = searchParams.get('excludeTripId'); // This is the String tripId (e.g. TRIP-1234)

    if (!vehicleId || !date) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const vId = parseInt(vehicleId);
    const scheduledAt = new Date(`${date}T12:00:00Z`);

    // If we are editing, we need to find the trip's numeric ID first to use the same logic as in the [id] route
    let numericId: number | null = null;
    if (excludeTripId) {
      const trip = await prisma.trip.findUnique({
        where: { tripId: excludeTripId },
        select: { id: true }
      });
      numericId = trip?.id || null;
    }

    const where: any = {
      vehicleId: vId,
    };

    if (numericId) {
      where.OR = [
        {
          scheduledAt: {
            lt: scheduledAt
          }
        },
        {
          scheduledAt: scheduledAt,
          id: {
            lt: numericId
          }
        }
      ];
    } else {
      where.scheduledAt = {
        lt: scheduledAt
      };
    }

    const previousTrip = await prisma.trip.findFirst({
      where,
      orderBy: [
        { scheduledAt: 'desc' },
        { id: 'desc' }
      ],
      select: {
        odometer: true
      }
    });

    // If no previous trip found by date, and it's a new trip, maybe we want the absolute last odometer?
    // No, the user said "compare with registration before the date of the current trip".
    
    let odometer = previousTrip?.odometer || 0;
    
    // If it's a new trip and we found nothing before that date, 
    // we might want to check if there are trips AFTER that date? 
    // No, validation is usually against the past.

    return NextResponse.json({ odometer });
  } catch (error) {
    console.error('Error fetching previous odometer:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
