import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const routes = await prisma.route.findMany({
      orderBy: { destination: 'asc' }
    });
    return NextResponse.json(routes);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const route = await prisma.route.create({
      data: {
        destination: body.destination,
        freightValue: parseFloat(body.freightValue),
        driverValue1: parseFloat(body.driverValue1),
        driverValue2: parseFloat(body.driverValue2),
        helperValue1: parseFloat(body.helperValue1),
        helperValue2: parseFloat(body.helperValue2),
      }
    });
    return NextResponse.json(route);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
