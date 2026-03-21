import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: parseInt(idStr) }
    });
    if (!vehicle) {
      return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
    }
    return NextResponse.json(vehicle);
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
    console.log('Updating vehicle ID:', vehicleId);
    console.log('Update body:', body);
    const { plate, type, brand, model, year, capacity, status, categoriaId } = body;

    const parsedYear = year ? parseInt(year.toString()) : 0;
    const finalYear = isNaN(parsedYear) ? 0 : parsedYear;

    const parsedCapacity = capacity ? parseFloat(capacity.toString()) : 0;
    const finalCapacity = isNaN(parsedCapacity) ? 0 : parsedCapacity;

    const parsedCatId = categoriaId ? parseInt(categoriaId.toString()) : null;
    const finalCatId = (parsedCatId !== null && isNaN(parsedCatId)) ? null : parsedCatId;

    const vehicle = await prisma.vehicle.update({
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
      }
    });

    return NextResponse.json(vehicle);
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
