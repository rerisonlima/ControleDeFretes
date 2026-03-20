import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const paymentStatus = searchParams.get('paymentStatus');

    const where: Prisma.TripWhereInput = {};

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
      where.scheduledAt = {
        gte: startDate,
        lte: endDate
      };
    }

    if (paymentStatus === 'unpaid') {
      where.paid = 'não';
    } else if (paymentStatus === 'paid') {
      where.paid = 'sim';
    }

    const trips = await prisma.trip.findMany({
      where,
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
    console.log('Creating trip with body:', body);
    const trip = await prisma.trip.create({
      data: {
        tripId: body.tripId || `TRIP-${Math.floor(1000 + Math.random() * 9000)}`,
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
        status: body.status || 'SCHEDULED',
        paid: body.paid || 'não',
        contract: body.contract || null,
        odometer: body.odometer ? parseFloat(body.odometer) : null,
        romaneio: body.romaneio || null,
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
    console.error('Failed to create trip:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
