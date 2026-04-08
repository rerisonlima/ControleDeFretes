import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const showInactive = searchParams.get('showInactive') === 'true';

    const vehicles = await prisma.vehicle.findMany({
      include: {
        categoria: true,
        trips: {
          orderBy: { scheduledAt: 'desc' },
          take: 1,
          select: { odometer: true }
        },
        crew: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    const vehiclesWithLastOdometer = vehicles.map(v => ({
      ...v,
      lastOdometer: v.trips[0]?.odometer || 0
    }));

    return NextResponse.json(vehiclesWithLastOdometer);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const result = await prisma.$transaction(async (tx) => {
      const vehicle = await tx.vehicle.create({
        data: {
          plate: body.plate,
          type: body.type,
          brand: body.brand,
          model: body.model,
          year: parseInt(body.year),
          capacity: parseFloat(body.capacity),
          status: body.status || 'ACTIVE',
          categoriaId: body.categoriaId ? parseInt(body.categoriaId) : null,
        }
      });

      if (body.maintenances && body.maintenances.length > 0) {
        await tx.maintenance.createMany({
          data: body.maintenances.map((m: any) => ({
            vehicleId: vehicle.id,
            type: m.type,
            odometer: parseFloat(m.odometer),
            currentOdometer: 0, // New vehicle has no trips yet
            executionDate: m.executionDate ? new Date(m.executionDate) : null
          }))
        });
      }

      if (body.crew && body.crew.length > 0) {
        await tx.vehicleCrew.createMany({
          data: body.crew
            .filter((c: any) => c.driverId)
            .map((c: any) => ({
              vehicleId: vehicle.id,
              driverId: parseInt(c.driverId),
              helperId: c.helperId ? parseInt(c.helperId) : null
            }))
        });
      }

      return vehicle;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating vehicle:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
