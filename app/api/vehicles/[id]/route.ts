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
    const body = await req.json();
    const { plate, type, brand, model, year, capacity, status, categoriaId } = body;

    const vehicle = await prisma.vehicle.update({
      where: { id: parseInt(idStr) },
      data: {
        plate,
        type,
        brand,
        model,
        year: parseInt(year),
        capacity: parseFloat(capacity),
        status,
        categoriaId: categoriaId ? parseInt(categoriaId) : null,
      }
    });

    return NextResponse.json(vehicle);
  } catch (error) {
    console.error('Update vehicle error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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
