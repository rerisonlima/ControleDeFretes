import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const paymentStatus = searchParams.get('paymentStatus');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    const skip = (page - 1) * limit;

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

    const [tripsData, total] = await Promise.all([
      prisma.trip.findMany({
        where,
        select: {
          id: true,
          tripId: true,
          routeId: true,
          freteId: true,
          contratanteId: true,
          vehicleId: true,
          driverId: true,
          helperId: true,
          scheduledAt: true,
          value: true,
          valor1aViagemMotorista: true,
          valor2aViagemMotorista: true,
          valor1aViagemAjudante: true,
          valor2aViagemAjudante: true,
          status: true,
          paid: true,
          contract: true,
          romaneio: true,
          odometer: true,
          paymentDate: true,
          route: {
            select: {
              id: true,
              destination: true,
              freightValue: true
            }
          },
          frete: {
            select: {
              id: true,
              cidade: true,
              valorFrete: true,
              categoria: {
                select: {
                  id: true,
                  CategoriaNome: true
                }
              }
            }
          },
          contratante: {
            select: {
              id: true,
              ContratanteNome: true
            }
          },
          vehicle: {
            select: {
              id: true,
              plate: true,
              model: true
            }
          },
          driver: {
            select: {
              id: true,
              name: true
            }
          },
          helper: {
            select: {
              id: true,
              name: true
            }
          },
          createdBy: {
            select: {
              id: true,
              username: true,
              name: true
            }
          },
        },
        orderBy: { scheduledAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.trip.count({ where })
    ]);

    return NextResponse.json({ trips: tripsData, total, page, limit, totalPages: Math.ceil(total / limit) });
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
    const session = await getSession();
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
        createdByUserId: session?.id ? (typeof session.id === 'string' ? parseInt(session.id, 10) : (session.id as number)) : null,
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
