import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const body = await req.json();
    const id = parseInt(idStr);
    const trip = await prisma.trip.update({
      where: { id },
      data: {
        tripId: body.tripId,
        routeId: body.routeId ? parseInt(body.routeId) : undefined,
        vehicleId: body.vehicleId ? parseInt(body.vehicleId) : undefined,
        driverId: body.driverId ? parseInt(body.driverId) : undefined,
        helperId: body.helperId ? parseInt(body.helperId) : null,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
        value: body.value ? parseFloat(body.value) : undefined,
        status: body.status,
        paid: body.paid,
        contract: body.contract,
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
    console.error('Failed to update trip:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    await prisma.trip.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete trip:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
