import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const showInactive = searchParams.get('showInactive') === 'true';

    const vehicles = await prisma.vehicle.findMany({
      where: showInactive ? {} : { status: { not: 'INACTIVE' } },
      orderBy: { updatedAt: 'desc' }
    });
    return NextResponse.json(vehicles);
  } catch (error) {
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
