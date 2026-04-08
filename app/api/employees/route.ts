import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active');

    const where: any = {};
    if (active === 'true') where.active = true;
    if (active === 'false') where.active = false;

    const employees = await prisma.employee.findMany({
      where,
      include: {
        _count: {
          select: {
            trips: true,
            helperTrips: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, role, phone, pix, cnh, cnhCategory, active } = body;

    if (!name || !role) {
      return NextResponse.json({ error: 'Name and role are required' }, { status: 400 });
    }

    const employee = await prisma.employee.create({
      data: {
        name,
        role,
        phone,
        pix,
        cnh,
        cnhCategory,
        active: active !== undefined ? active : true,
      },
    });

    return NextResponse.json(employee);
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
