import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
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
    const { name, role, phone, pix, cnh, cnhCategory } = body;

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
      },
    });

    return NextResponse.json(employee);
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
