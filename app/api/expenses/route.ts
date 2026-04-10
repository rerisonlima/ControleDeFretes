import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '30');
    const type = searchParams.get('type');
    const vehicleId = searchParams.get('vehicleId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    const reimbursable = searchParams.get('reimbursable');
    const status = searchParams.get('status');
    const sort = searchParams.get('sort') || 'date_desc';

    const skip = (page - 1) * limit;

    const where: any = {};

    if (type && type !== 'Todos') {
      where.type = type;
    }

    if (vehicleId && vehicleId !== 'Todos') {
      where.vehicleId = parseInt(vehicleId);
    }

    if (reimbursable && reimbursable !== 'Todos') {
      where.reimbursable = reimbursable === 'Sim';
    }

    if (status && status !== 'Todos') {
      where.status = status;
    }

    if (month && year) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    let orderBy: any = { date: 'desc' };
    if (sort === 'date_asc') {
      orderBy = { date: 'asc' };
    } else if (sort === 'created_desc') {
      orderBy = { createdAt: 'desc' };
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          vehicle: {
            select: {
              id: true,
              plate: true,
            },
          },
          trip: {
            select: {
              id: true,
              tripId: true,
              scheduledAt: true,
              romaneio: true,
              contract: true,
              frete: {
                select: { cidade: true }
              }
            }
          }
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ]);

    return NextResponse.json({
      expenses,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error('Failed to fetch expenses:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const expense = await prisma.expense.create({
      data: {
        type: body.type,
        description: body.description || null,
        value: parseFloat(body.value),
        date: new Date(`${body.date}T12:00:00Z`),
        vehicleId: body.vehicleId ? parseInt(body.vehicleId) : null,
        status: body.status || 'PAID',
        reimbursable: body.reimbursable || false,
        reimbursementDate: body.reimbursementDate ? new Date(`${body.reimbursementDate}T12:00:00Z`) : null,
        tripId: body.tripId ? parseInt(body.tripId) : null,
      },
      include: {
        vehicle: true,
        trip: true
      }
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Failed to create expense:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
