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
        routeId: body.routeId ? parseInt(body.routeId) : null,
        freteId: body.freteId ? parseInt(body.freteId) : null,
        contratanteId: body.contratanteId ? parseInt(body.contratanteId) : null,
        vehicleId: parseInt(body.vehicleId),
        driverId: parseInt(body.driverId),
        helperId: body.helperId ? parseInt(body.helperId) : null,
        scheduledAt: new Date(body.scheduledAt),
        value: parseFloat(body.value),
        valor1aViagemMotorista: body.valor1aViagemMotorista ? parseFloat(body.valor1aViagemMotorista) : null,
        valor2aViagemMotorista: body.valor2aViagemMotorista ? parseFloat(body.valor2aViagemMotorista) : null,
        valor1aViagemAjudante: body.valor1aViagemAjudante ? parseFloat(body.valor1aViagemAjudante) : null,
        valor2aViagemAjudante: body.valor2aViagemAjudante ? parseFloat(body.valor2aViagemAjudante) : null,
        status: body.status || 'SCHEDULED',
        paid: body.paid || 'não',
        contract: body.contract || null,
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
    console.error('Failed to create trip:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
