import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const routes = await prisma.route.findMany({
      orderBy: {
        destination: 'asc',
      },
    });
    return NextResponse.json(routes);
  } catch (error) {
    console.error('Error fetching routes:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { destination, freightValue, driverValue1, driverValue2, helperValue1, helperValue2 } = body;

    if (!destination) {
      return NextResponse.json({ error: 'Destination is required' }, { status: 400 });
    }

    const route = await prisma.route.create({
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
    console.error('Error creating route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
