import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      include: { vehicle: true },
      orderBy: { date: 'desc' }
    });
    return NextResponse.json(expenses);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const expense = await prisma.expense.create({
      data: {
        date: new Date(`${body.date}T12:00:00Z`),
        type: body.type,
        value: parseFloat(body.value),
        vehicleId: body.vehicleId ? parseInt(body.vehicleId) : null,
        status: body.status || 'PENDING',
      }
    });
    return NextResponse.json(expense);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
