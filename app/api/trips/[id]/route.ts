import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        route: true,
        frete: {
          include: {
            categoria: true
          }
        },
        contratante: true,
        vehicle: true,
        driver: true,
        helper: true,
      },
    });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    return NextResponse.json(trip);
  } catch (error) {
    console.error('Failed to fetch trip:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    
    const trip = await prisma.trip.update({
      where: { id },
      data: {
        tripId: body.tripId,
        routeId: body.routeId ? parseInt(body.routeId) : null,
        freteId: body.freteId ? parseInt(body.freteId) : null,
        contratanteId: body.contratanteId ? parseInt(body.contratanteId) : null,
        vehicleId: parseInt(body.vehicleId),
        driverId: parseInt(body.driverId),
        helperId: body.helperId ? parseInt(body.helperId) : null,
        scheduledAt: new Date(`${body.scheduledAt}T12:00:00Z`),
        value: parseFloat(body.value),
        valor1aViagemMotorista: (body.valor1aViagemMotorista !== undefined && body.valor1aViagemMotorista !== '' && body.valor1aViagemMotorista !== null) ? parseFloat(body.valor1aViagemMotorista) : null,
        valor2aViagemMotorista: (body.valor2aViagemMotorista !== undefined && body.valor2aViagemMotorista !== '' && body.valor2aViagemMotorista !== null) ? parseFloat(body.valor2aViagemMotorista) : null,
        valor1aViagemAjudante: (body.valor1aViagemAjudante !== undefined && body.valor1aViagemAjudante !== '' && body.valor1aViagemAjudante !== null) ? parseFloat(body.valor1aViagemAjudante) : null,
        valor2aViagemAjudante: (body.valor2aViagemAjudante !== undefined && body.valor2aViagemAjudante !== '' && body.valor2aViagemAjudante !== null) ? parseFloat(body.valor2aViagemAjudante) : null,
        status: body.status,
        paid: body.paid,
        contract: body.contract,
        romaneio: body.romaneio,
        paymentDate: body.paymentDate ? new Date(`${body.paymentDate}T12:00:00Z`) : null,
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
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    await prisma.trip.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete trip:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
