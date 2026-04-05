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
        expenses: {
          where: {
            reimbursable: true,
            reimbursementDate: null,
            status: 'PENDING'
          }
        }
      },
    });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Find the previous trip for the same vehicle to get the correct odometer for validation
    const previousTrip = await prisma.trip.findFirst({
      where: {
        vehicleId: trip.vehicleId,
        OR: [
          {
            scheduledAt: {
              lt: trip.scheduledAt
            }
          },
          {
            scheduledAt: trip.scheduledAt,
            id: {
              lt: trip.id
            }
          }
        ]
      },
      orderBy: [
        { scheduledAt: 'desc' },
        { id: 'desc' }
      ],
      select: {
        odometer: true
      }
    });

    return NextResponse.json({
      ...trip,
      previousTripOdometer: previousTrip?.odometer || 0
    });
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
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID de viagem inválido' }, { status: 400 });
    }

    const body = await request.json();
    
    // Validate required fields
    const vehicleId = parseInt(body.vehicleId);
    const driverId = parseInt(body.driverId);
    const value = parseFloat(body.value);
    const scheduledAt = body.scheduledAt ? new Date(`${body.scheduledAt}T12:00:00Z`) : new Date();

    if (isNaN(vehicleId)) return NextResponse.json({ error: 'Veículo é obrigatório' }, { status: 400 });
    if (isNaN(driverId)) return NextResponse.json({ error: 'Motorista é obrigatório' }, { status: 400 });
    if (isNaN(value)) return NextResponse.json({ error: 'Valor do frete inválido' }, { status: 400 });
    if (isNaN(scheduledAt.getTime())) return NextResponse.json({ error: 'Data da viagem inválida' }, { status: 400 });

    const trip = await prisma.$transaction(async (tx) => {
      const updatedTrip = await tx.trip.update({
        where: { id },
        data: {
          tripId: body.tripId,
          routeId: (body.routeId && body.routeId !== '') ? parseInt(body.routeId) : null,
          freteId: (body.freteId && body.freteId !== '') ? parseInt(body.freteId) : null,
          contratanteId: (body.contratanteId && body.contratanteId !== '') ? parseInt(body.contratanteId) : null,
          vehicleId,
          driverId,
          helperId: (body.helperId && body.helperId !== '') ? parseInt(body.helperId) : null,
          scheduledAt,
          value,
          valor1aViagemMotorista: (body.valor1aViagemMotorista !== undefined && body.valor1aViagemMotorista !== '' && body.valor1aViagemMotorista !== null) ? parseFloat(body.valor1aViagemMotorista) : null,
          valor2aViagemMotorista: (body.valor2aViagemMotorista !== undefined && body.valor2aViagemMotorista !== '' && body.valor2aViagemMotorista !== null) ? parseFloat(body.valor2aViagemMotorista) : null,
          valor1aViagemAjudante: (body.valor1aViagemAjudante !== undefined && body.valor1aViagemAjudante !== '' && body.valor1aViagemAjudante !== null) ? parseFloat(body.valor1aViagemAjudante) : null,
          valor2aViagemAjudante: (body.valor2aViagemAjudante !== undefined && body.valor2aViagemAjudante !== '' && body.valor2aViagemAjudante !== null) ? parseFloat(body.valor2aViagemAjudante) : null,
          status: body.status,
          paid: body.paid,
          contract: body.contract,
          odometer: (body.odometer !== undefined && body.odometer !== '' && body.odometer !== null) ? parseFloat(body.odometer.toString()) : null,
          romaneio: body.romaneio,
          paymentDate: (body.paymentDate && body.paymentDate !== '') ? new Date(`${body.paymentDate}T12:00:00Z`) : null,
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

      if (body.reimbursementPaid === 'sim' && body.reimbursementDate) {
        await tx.expense.updateMany({
          where: {
            tripId: id,
            reimbursable: true,
            reimbursementDate: null,
            status: 'PENDING'
          },
          data: {
            reimbursementDate: new Date(`${body.reimbursementDate}T12:00:00Z`),
            status: 'PAID'
          }
        });
      }

      return updatedTrip;
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
