import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    
    const vehicle = await prisma.vehicle.update({
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

    return NextResponse.json(vehicle);
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
