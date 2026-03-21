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
      let currentOdometer = v.currentOdometer || 0;
      
      // Filter out null odometers and sort by date (already sorted in query)
      const odometers = v.trips
        .map(t => t.odometer)
        .filter((o): o is number => o !== null && o !== undefined);
      
      if (odometers.length > 1) {
        const minOdo = odometers[0];
        const maxOdo = odometers[odometers.length - 1];
        totalDistance = Math.max(0, maxOdo - minOdo);
        currentOdometer = maxOdo;
      } else if (odometers.length === 1) {
        currentOdometer = odometers[0];
      }

      // Find latest maintenance date from the Maintenance table
      let lastMaintenanceDate = v.lastMaintenance;
      if (v.maintenances.length > 0) {
        const latestMaint = v.maintenances.reduce((latest, current) => {
          const currentVal = current.executionDate ? new Date(current.executionDate).getTime() : 0;
          const latestVal = latest.executionDate ? new Date(latest.executionDate).getTime() : 0;
          return currentVal > latestVal ? current : latest;
        });
        lastMaintenanceDate = latestMaint.executionDate;
      }

      return {
        ...v,
        tripCount,
        totalDistance,
        currentOdometer,
        lastMaintenance: lastMaintenanceDate,
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
    
    const safeParseFloat = (val: string | number | null | undefined) => {
      if (val === null || val === undefined || val === '') return null;
      const parsed = parseFloat(val.toString());
      return isNaN(parsed) ? null : parsed;
    };

    const safeParseInt = (val: string | number | null | undefined, fallback: number | null = 0) => {
      if (val === null || val === undefined || val === '') return fallback;
      const parsed = parseInt(val.toString());
      return isNaN(parsed) ? fallback : parsed;
    };

    const finalYear = safeParseInt(body.year, 0);
    const finalCapacity = safeParseFloat(body.capacity) || 0;
    const finalCatId = safeParseInt(body.categoriaId, null);
    const finalCurrentOdometer = safeParseFloat(body.currentOdometer);

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
        currentOdometer: finalCurrentOdometer,
        maintenances: body.maintenances ? {
          create: body.maintenances.map((m: { type: string; odometer: string | number; executionDate?: string; currentOdometer?: string | number }) => ({
            type: m.type,
            odometer: safeParseFloat(m.odometer) || 0,
            currentOdometer: safeParseFloat(m.currentOdometer),
            executionDate: (m.executionDate && m.executionDate !== '') ? new Date(m.executionDate) : null
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
