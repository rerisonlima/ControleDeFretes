import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const body = await req.json();
    const id = parseInt(idStr);
    
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        date: body.date ? new Date(body.date) : undefined,
        type: body.type,
        value: body.value ? parseFloat(body.value) : undefined,
        vehicleId: body.vehicleId ? parseInt(body.vehicleId) : null,
        status: body.status,
      },
      include: { vehicle: true }
    });
    
    return NextResponse.json(expense);
  } catch (error) {
    console.error('Failed to update expense:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    
    await prisma.expense.delete({ where: { id } });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete expense:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
