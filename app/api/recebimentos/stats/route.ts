import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfMonth, endOfMonth, format, parseISO } from 'date-fns';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get('month');
  const yearParam = searchParams.get('year');
  const vehicleId = searchParams.get('vehicleId');
  const contractorId = searchParams.get('contractorId');
  const search = searchParams.get('search');

  const month = monthParam ? parseInt(monthParam) : parseInt(format(new Date(), 'M'));
  const year = yearParam ? parseInt(yearParam) : parseInt(format(new Date(), 'yyyy'));

  const startDate = startOfMonth(new Date(year, month - 1));
  const endDate = endOfMonth(startDate);

  try {
    const where: Prisma.TripWhereInput = {
      scheduledAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (vehicleId && vehicleId !== 'all') {
      where.vehicleId = parseInt(vehicleId);
    }

    if (contractorId && contractorId !== 'all') {
      where.contratanteId = parseInt(contractorId);
    }

    if (search) {
      where.OR = [
        { tripId: { contains: search, mode: 'insensitive' } },
        { contract: { contains: search, mode: 'insensitive' } },
        { romaneio: { contains: search, mode: 'insensitive' } },
      ];
    }

    const trips = await prisma.trip.findMany({
      where,
      select: {
        value: true,
        paid: true,
        paymentDate: true,
        scheduledAt: true,
      },
    });

    const totalToReceive = trips.reduce((sum, trip) => sum + (trip.value || 0), 0);
    const totalReceived = trips
      .filter((trip) => trip.paid === 'sim')
      .reduce((sum, trip) => sum + (trip.value || 0), 0);

    // Chart data based on paymentDate
    // Group by day for the selected month
    const chartDataMap = new Map<string, number>();
    
    // Initialize all days of the month with 0
    const current = new Date(startDate);
    while (current <= endDate) {
      chartDataMap.set(format(current, 'yyyy-MM-dd'), 0);
      current.setDate(current.getDate() + 1);
    }

    trips.forEach((trip) => {
      if (trip.paid === 'sim' && trip.paymentDate) {
        const dateKey = format(trip.paymentDate, 'yyyy-MM-dd');
        if (chartDataMap.has(dateKey)) {
          chartDataMap.set(dateKey, (chartDataMap.get(dateKey) || 0) + (trip.value || 0));
        }
      }
    });

    const chartData = Array.from(chartDataMap.entries())
      .map(([date, value]) => ({
        date,
        formattedDate: format(parseISO(date), 'dd/MM'),
        value,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      totalToReceive,
      totalReceived,
      chartData,
    });
  } catch (error) {
    console.error('Recebimentos stats error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
