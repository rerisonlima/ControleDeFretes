import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    const body = await req.json();
    
    const employee = await prisma.employee.update({
      where: { id },
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
    // @ts-expect-error - Prisma error code
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Funcionário não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    
    await prisma.employee.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    // @ts-expect-error - Prisma error code
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Funcionário não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
