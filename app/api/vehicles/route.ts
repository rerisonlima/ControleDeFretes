import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const vehicles = await prisma.vehicle.findMany({
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
    const vehicle = await prisma.vehicle.create({
      data: {
        plate: body.plate,
        type: body.type,
        brand: body.brand,
        model: body.model,
        year: parseInt(body.year),
        capacity: parseFloat(body.capacity),
        status: body.status || 'ACTIVE',
      }
    });
    return NextResponse.json(vehicle);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
