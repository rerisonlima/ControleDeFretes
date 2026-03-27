import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const body = await req.json();
    const id = parseInt(idStr);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        date: body.date ? new Date(`${body.date}T12:00:00Z`) : undefined,
        type: body.type,
        description: body.description,
        value: body.value ? parseFloat(body.value) : undefined,
        vehicleId: body.vehicleId ? parseInt(body.vehicleId) : null,
        status: body.status,
      },
      include: { vehicle: true }
    });
    
    return NextResponse.json(expense);
  } catch (error) {
    console.error(`Failed to update expense with ID ${id}:`, error);
    // @ts-expect-error - Prisma error code
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Despesa não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    
    await prisma.expense.delete({
      where: { id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Failed to delete expense with ID ${id}:`, error);
    // @ts-expect-error - Prisma error code
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Despesa não encontrada ou já excluída' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Erro ao excluir despesa ou registro não encontrado' }, { status: 500 });
  }
}
