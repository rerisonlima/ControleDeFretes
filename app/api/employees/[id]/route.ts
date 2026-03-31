import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const { name, role, phone, pix, cnh, cnhCategory } = body;

    if (!name || !role) {
      return NextResponse.json({ error: 'Name and role are required' }, { status: 400 });
    }

    const employee = await prisma.employee.update({
      where: { id },
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
    console.error('Error updating employee:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    await prisma.employee.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
