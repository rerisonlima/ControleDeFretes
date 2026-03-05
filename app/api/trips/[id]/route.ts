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
        routeId: body.routeId ? parseInt(body.routeId) : null,
        freteId: body.freteId ? parseInt(body.freteId) : null,
        contratanteId: body.contratanteId ? parseInt(body.contratanteId) : null,
        vehicleId: body.vehicleId ? parseInt(body.vehicleId) : undefined,
        driverId: body.driverId ? parseInt(body.driverId) : undefined,
        helperId: body.helperId ? parseInt(body.helperId) : null,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
        value: body.value ? parseFloat(body.value) : undefined,
        valor1aViagemMotorista: body.valor1aViagemMotorista ? parseFloat(body.valor1aViagemMotorista) : null,
        valor2aViagemMotorista: body.valor2aViagemMotorista ? parseFloat(body.valor2aViagemMotorista) : null,
        valor1aViagemAjudante: body.valor1aViagemAjudante ? parseFloat(body.valor1aViagemAjudante) : null,
        valor2aViagemAjudante: body.valor2aViagemAjudante ? parseFloat(body.valor2aViagemAjudante) : null,
        status: body.status,
        paid: body.paid,
        contract: body.contract,
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : null,
      },
      include: {
        route: true,
        frete: true,
        contratante: true,
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
