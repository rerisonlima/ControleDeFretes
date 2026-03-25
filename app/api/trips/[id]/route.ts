import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const body = await req.json();
    console.log('Updating trip with body:', body);
    const id = parseInt(idStr);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

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
        scheduledAt: body.scheduledAt ? new Date(`${body.scheduledAt}T12:00:00Z`) : undefined,
        value: body.value ? parseFloat(body.value) : undefined,
        valor1aViagemMotorista: (body.valor1aViagemMotorista !== undefined && body.valor1aViagemMotorista !== '' && body.valor1aViagemMotorista !== null) ? parseFloat(body.valor1aViagemMotorista) : null,
        valor2aViagemMotorista: (body.valor2aViagemMotorista !== undefined && body.valor2aViagemMotorista !== '' && body.valor2aViagemMotorista !== null) ? parseFloat(body.valor2aViagemMotorista) : null,
        valor1aViagemAjudante: (body.valor1aViagemAjudante !== undefined && body.valor1aViagemAjudante !== '' && body.valor1aViagemAjudante !== null) ? parseFloat(body.valor1aViagemAjudante) : null,
        valor2aViagemAjudante: (body.valor2aViagemAjudante !== undefined && body.valor2aViagemAjudante !== '' && body.valor2aViagemAjudante !== null) ? parseFloat(body.valor2aViagemAjudante) : null,
        status: body.status,
        paid: body.paid,
        contract: body.contract,
        odometer: body.odometer ? parseFloat(body.odometer) : null,
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
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Viagem não encontrada' }, { status: 404 });
      }
    }
    console.error('Failed to update trip:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    
    await prisma.trip.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json({ error: 'Viagem não encontrada ou já excluída' }, { status: 404 });
      }
    }
    console.error('Failed to delete trip:', error);
    return NextResponse.json({ 
      error: 'Erro ao excluir viagem', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
