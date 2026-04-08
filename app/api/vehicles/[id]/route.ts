import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        categoria: true,
        trips: {
          orderBy: { scheduledAt: 'asc' },
          select: {
            id: true,
            odometer: true,
            scheduledAt: true
          }
        },
        maintenances: {
          orderBy: { executionDate: 'desc' }
        },
        crew: {
          include: {
            driver: true,
            helper: true
          }
        }
      }
    });

    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    
    // Update vehicle and its maintenances in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const updatedVehicle = await tx.vehicle.update({
        where: { id },
        data: {
          plate: body.plate,
          type: body.type,
          brand: body.brand,
          model: body.model,
          year: parseInt(body.year),
          capacity: parseFloat(body.capacity),
          status: body.status,
          categoriaId: body.categoriaId ? parseInt(body.categoriaId) : null,
        },
      });

      // Handle maintenances
      if (body.maintenances) {
        // Get current odometer for new maintenances
        const latestTrip = await tx.trip.findFirst({
          where: { vehicleId: id },
          orderBy: { scheduledAt: 'desc' },
          select: { odometer: true }
        });
        const currentOdometer = latestTrip?.odometer || 0;

        // Delete existing maintenances not in the new list
        const maintenanceIds = body.maintenances
          .filter((m: any) => m.id)
          .map((m: any) => m.id);
        
        await tx.maintenance.deleteMany({
          where: {
            vehicleId: id,
            id: { notIn: maintenanceIds }
          }
        });

        // Upsert maintenances
        for (const m of body.maintenances) {
          if (m.id) {
            await tx.maintenance.update({
              where: { id: m.id },
              data: {
                type: m.type,
                odometer: parseFloat(m.odometer),
                executionDate: m.executionDate ? new Date(m.executionDate) : null
              }
            });
          } else {
            await tx.maintenance.create({
              data: {
                vehicleId: id,
                type: m.type,
                odometer: parseFloat(m.odometer),
                currentOdometer: currentOdometer,
                executionDate: m.executionDate ? new Date(m.executionDate) : null
              }
            });
          }
        }
      }

      // Handle crew
      if (body.crew) {
        // Delete existing crew
        await tx.vehicleCrew.deleteMany({
          where: { vehicleId: id }
        });

        // Create new crew
        if (body.crew.length > 0) {
          await tx.vehicleCrew.createMany({
            data: body.crew
              .filter((c: any) => c.driverId)
              .map((c: any) => ({
                vehicleId: id,
                driverId: parseInt(c.driverId),
                helperId: c.helperId ? parseInt(c.helperId) : null
              }))
          });
        }
      }

      return updatedVehicle;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating vehicle:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    await prisma.vehicle.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
