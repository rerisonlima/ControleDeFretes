import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const trips = await prisma.trip.findMany({
      include: {
        route: true,
        vehicle: true,
        driver: true,
        helper: true,
      },
      orderBy: { scheduledAt: 'desc' }
    });
    return NextResponse.json(trips);
  } catch (error) {
    console.error('Failed to fetch trips:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const trip = await prisma.trip.create({
      data: {
        tripId: body.tripId,
        routeId: parseInt(body.routeId),
        vehicleId: parseInt(body.vehicleId),
        driverId: parseInt(body.driverId),
        helperId: body.helperId ? parseInt(body.helperId) : null,
        scheduledAt: new Date(body.scheduledAt),
        value: parseFloat(body.value),
        status: body.status || 'SCHEDULED',
        paid: body.paid || 'não',
        contract: body.contract || null,
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : null,
      },
      include: {
        route: true,
        vehicle: true,
        driver: true,
        helper: true,
      }
    });
    return NextResponse.json(trip);
  } catch (error) {
    console.error('Failed to create trip:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
