import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: parseInt(idStr) },
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
      }
    });
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }

    const tripCount = vehicle.trips.length;
    let totalDistance = 0;
    let currentOdometer = vehicle.currentOdometer || 0;
    const odometers = vehicle.trips
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
    let lastMaintenanceDate = vehicle.lastMaintenance;
    if (vehicle.maintenances.length > 0) {
      const latestMaint = vehicle.maintenances.reduce((latest, current) => {
        const currentVal = current.executionDate ? new Date(current.executionDate).getTime() : 0;
        const latestVal = latest.executionDate ? new Date(latest.executionDate).getTime() : 0;
        return currentVal > latestVal ? current : latest;
      });
      lastMaintenanceDate = latestMaint.executionDate;
    }

    return NextResponse.json({
      ...vehicle,
      tripCount,
      totalDistance,
      currentOdometer,
      lastMaintenance: lastMaintenanceDate,
      trips: undefined
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const vehicleId = parseInt(idStr);
    
    if (isNaN(vehicleId)) {
      console.error('Invalid vehicle ID received:', idStr);
      return NextResponse.json({ error: 'ID de veículo inválido' }, { status: 400 });
    }

    const body = await req.json();
    const { plate, type, brand, model, year, capacity, status, categoriaId, currentOdometer, maintenances } = body;

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

    const finalYear = safeParseInt(year, 0);
    const finalCapacity = safeParseFloat(capacity) || 0;
    const finalCatId = safeParseInt(categoriaId, null);
    const finalCurrentOdometer = safeParseFloat(currentOdometer);

    // Use a transaction to update vehicle and its maintenances
    const vehicle = await prisma.$transaction(async (tx) => {
      // 1. Update vehicle basic info
      const updatedVehicle = await tx.vehicle.update({
        where: { id: vehicleId },
        data: {
          plate,
          type,
          brand,
          model,
          year: finalYear,
          capacity: finalCapacity,
          status,
          categoriaId: finalCatId,
          currentOdometer: finalCurrentOdometer,
        },
      });

      // 2. Handle maintenances if provided
      if (maintenances) {
        // Delete all existing maintenances for this vehicle
        await tx.maintenance.deleteMany({
          where: { vehicleId }
        });

        // Create new ones
        if (maintenances.length > 0) {
          await tx.maintenance.createMany({
            data: maintenances.map((m: { type: string; odometer: string | number; executionDate?: string; currentOdometer?: string | number }) => ({
              type: m.type,
              odometer: safeParseFloat(m.odometer) || 0,
              currentOdometer: safeParseFloat(m.currentOdometer),
              executionDate: (m.executionDate && m.executionDate !== '') ? new Date(m.executionDate) : null,
              vehicleId
            }))
          });
        }
      }

      return updatedVehicle;
    });

    // Fetch the updated vehicle with its maintenances to return to the client
    const finalVehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: {
        maintenances: true,
        trips: {
          select: {
            odometer: true,
            scheduledAt: true
          },
          orderBy: {
            scheduledAt: 'asc'
          }
        }
      }
    });

    if (!finalVehicle) {
      return NextResponse.json({ error: 'Erro ao recuperar veículo atualizado' }, { status: 500 });
    }

    const tripCount = finalVehicle.trips.length;
    let totalDistance = 0;
    let calculatedOdometer = finalVehicle.currentOdometer || 0;
    const odometers = finalVehicle.trips
      .map(t => t.odometer)
      .filter((o): o is number => o !== null && o !== undefined);
    
    if (odometers.length > 1) {
      const minOdo = odometers[0];
      const maxOdo = odometers[odometers.length - 1];
      totalDistance = Math.max(0, maxOdo - minOdo);
      calculatedOdometer = maxOdo;
    } else if (odometers.length === 1) {
      calculatedOdometer = odometers[0];
    }

    return NextResponse.json({
      ...finalVehicle,
      tripCount,
      totalDistance,
      currentOdometer: calculatedOdometer,
      trips: undefined
    });
  } catch (error) {
    console.error('Update vehicle error:', error);
    return NextResponse.json({ 
      error: 'Erro ao atualizar veículo', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // We are discouraging deletion, but keeping the route for potential administrative use
  // or we can just return an error if we want to strictly forbid it.
  // For now, let's just return an error as requested by the "remove deletion" task.
  return NextResponse.json({ error: 'Exclusão desabilitada. Por favor, desative o veículo em vez de excluir.' }, { status: 403 });
}
