import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    const type = searchParams.get('type');
    const vehicleId = searchParams.get('vehicleId');
    const skip = (page - 1) * limit;

    const where: Prisma.ExpenseWhereInput = {};
    if (type && type !== 'Todos') {
      where.type = type;
    }
    if (vehicleId && vehicleId !== 'Todos') {
      where.vehicleId = parseInt(vehicleId);
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: { vehicle: true },
        orderBy: { date: 'desc' },
        skip,
        take: limit
      }),
      prisma.expense.count({ where })
    ]);

    return NextResponse.json({ 
      expenses, 
      total, 
      page, 
      limit, 
      totalPages: Math.ceil(total / limit) 
    });
  } catch (error) {
    console.error('Failed to fetch expenses:', error);
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
        description: body.description || null,
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
