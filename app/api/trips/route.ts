import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getSession } from '@/lib/auth';
import { sendWhatsAppNotification } from '@/lib/whatsapp';
import { sendEmailNotification } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // Fix corrupted FLOAT8 data if it exists
    try {
      await prisma.$executeRawUnsafe('UPDATE "Trip" SET odometer = 0 WHERE odometer < 1 AND odometer > 0');
    } catch (e) {
      console.error('Data fix failed:', e);
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const paymentStatus = searchParams.get('paymentStatus');
    const vehicleId = searchParams.get('vehicleId');
    const days = searchParams.get('days');

    const where: any = {};

    if (vehicleId) {
      where.vehicleId = parseInt(vehicleId);
    }

    if (days) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
      where.scheduledAt = {
        gte: startDate
      };
    } else if (month && year) {
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

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    const skip = (page - 1) * limit;

    const [trips, total, totalForVehicle] = await Promise.all([
      prisma.trip.findMany({
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
          createdBy: {
            select: {
              name: true,
              username: true
            }
          }
        },
        orderBy: { scheduledAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.trip.count({ where }),
      vehicleId ? prisma.trip.count({ where: { vehicleId: parseInt(vehicleId) } }) : Promise.resolve(0)
    ]);

    return NextResponse.json({
      trips,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      hasMore: vehicleId && days ? total < totalForVehicle : undefined
    });
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

    // Validate required fields
    const vehicleId = parseInt(body.vehicleId);
    const driverId = parseInt(body.driverId);
    const value = parseFloat(body.value);
    const scheduledAt = body.scheduledAt ? new Date(`${body.scheduledAt}T12:00:00Z`) : new Date();

    if (isNaN(vehicleId)) return NextResponse.json({ error: 'Veículo é obrigatório' }, { status: 400 });
    if (isNaN(driverId)) return NextResponse.json({ error: 'Motorista é obrigatório' }, { status: 400 });
    if (isNaN(value)) return NextResponse.json({ error: 'Valor do frete inválido' }, { status: 400 });
    if (isNaN(scheduledAt.getTime())) return NextResponse.json({ error: 'Data da viagem inválida' }, { status: 400 });

    const trip = await prisma.trip.create({
      data: {
        tripId: body.tripId || `TRIP-${Math.floor(1000 + Math.random() * 9000)}`,
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
        status: body.status || 'SCHEDULED',
        paid: body.paid || 'não',
        contract: body.contract || null,
        odometer: (body.odometer !== undefined && body.odometer !== '' && body.odometer !== null) ? parseFloat(body.odometer.toString()) : null,
        romaneio: body.romaneio || null,
        paymentDate: (body.paymentDate && body.paymentDate !== '') ? new Date(`${body.paymentDate}T12:00:00Z`) : null,
        createdById: session?.id ? Number(session.id) : null,
      },
      include: {
        route: true,
        frete: true,
        contratante: true,
        vehicle: true,
        driver: true,
        helper: true,
        createdBy: {
          select: {
            name: true,
            username: true,
            role: true
          }
        }
      }
    });

    // Send notifications if the creator is an OPERATOR or ADMIN
    if (trip.createdBy?.role === 'OPERATOR' || trip.createdBy?.role === 'ADMIN') {
      let notificationsEnabled = true;
      try {
        // Check if notifications are enabled in system settings
        const notificationSetting = await prisma.systemSetting.findUnique({
          where: { key: 'notifications_enabled' }
        });
        if (notificationSetting) {
          notificationsEnabled = notificationSetting.value === 'true';
        }
      } catch (err) {
        console.warn('SystemSetting table might be missing, defaulting to notifications enabled:', err);
      }

      if (notificationsEnabled) {
        // We don't await these to avoid blocking the response
        sendWhatsAppNotification(trip).catch(err => console.error('WhatsApp background error:', err));
        sendEmailNotification(trip).catch(err => console.error('Email background error:', err));
      }
    }

    return NextResponse.json(trip);
  } catch (error) {
    console.error('Failed to create trip:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
