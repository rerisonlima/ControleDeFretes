import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { destination, freightValue, driverValue1, driverValue2, helperValue1, helperValue2 } = body;

    if (!destination) {
      return NextResponse.json({ error: 'Destination is required' }, { status: 400 });
    }

    const route = await prisma.route.update({
      where: { id },
      data: {
        destination,
        freightValue: parseFloat(freightValue) || 0,
        driverValue1: parseFloat(driverValue1) || 0,
        driverValue2: parseFloat(driverValue2) || 0,
        helperValue1: parseFloat(helperValue1) || 0,
        helperValue2: parseFloat(helperValue2) || 0,
      },
    });

    return NextResponse.json(route);
  } catch (error) {
    console.error('Error updating route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    await prisma.route.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
