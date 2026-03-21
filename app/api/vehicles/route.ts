import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const showInactive = searchParams.get('showInactive') === 'true';

    const vehicles = await prisma.vehicle.findMany({
      where: showInactive ? {} : { status: { not: 'INACTIVE' } },
      include: {
        trips: {
          select: {
            odometer: true,
            scheduledAt: true
          },
          orderBy: {
            scheduledAt: 'asc'
          }
        },
        maintenances: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    const vehiclesWithStats = vehicles.map(v => {
      const tripCount = v.trips.length;
      let totalDistance = 0;
      
      // Filter out null odometers and sort by date (already sorted in query)
      const odometers = v.trips
        .map(t => t.odometer)
        .filter((o): o is number => o !== null && o !== undefined);
      
      if (odometers.length > 1) {
        const minOdo = odometers[0];
        const maxOdo = odometers[odometers.length - 1];
        totalDistance = Math.max(0, maxOdo - minOdo);
      }

      return {
        ...v,
        tripCount,
        totalDistance,
        trips: undefined // Don't send all trips to the client
      };
    });

    return NextResponse.json(vehiclesWithStats);
  } catch (error) {
    console.error('Fetch vehicles error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const parsedYear = body.year ? parseInt(body.year.toString()) : 0;
    const finalYear = isNaN(parsedYear) ? 0 : parsedYear;

    const parsedCapacity = body.capacity ? parseFloat(body.capacity.toString()) : 0;
    const finalCapacity = isNaN(parsedCapacity) ? 0 : parsedCapacity;

    const parsedCatId = body.categoriaId ? parseInt(body.categoriaId.toString()) : null;
    const finalCatId = (parsedCatId !== null && isNaN(parsedCatId)) ? null : parsedCatId;

    const vehicle = await prisma.vehicle.create({
      data: {
        plate: body.plate,
        type: body.type,
        brand: body.brand,
        model: body.model,
        year: finalYear,
        capacity: finalCapacity,
        status: body.status || 'ACTIVE',
        categoriaId: finalCatId,
        maintenances: body.maintenances ? {
          create: body.maintenances.map((m: { type: string; odometer: string | number; executionDate: string }) => ({
            type: m.type,
            odometer: parseFloat(m.odometer.toString()) || 0,
            executionDate: new Date(m.executionDate)
          }))
        } : undefined
      },
      include: {
        maintenances: true
      }
    });
    return NextResponse.json(vehicle);
  } catch (error) {
    console.error('Create vehicle error:', error);
    return NextResponse.json({ 
      error: 'Erro ao criar veículo', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
