import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { trips: true, helperTrips: true }
        }
      }
    });
    return NextResponse.json(employees);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const employee = await prisma.employee.create({
      data: {
        name: body.name,
        role: body.role,
        phone: body.phone,
        pix: body.pix,
        cnh: body.cnh,
        cnhCategory: body.cnhCategory,
      }
    });
    return NextResponse.json(employee);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
