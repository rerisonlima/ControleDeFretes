import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        vehicle: true,
      },
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Failed to fetch expense:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        type: body.type,
        description: body.description || null,
        value: parseFloat(body.value),
        date: new Date(`${body.date}T12:00:00Z`),
        vehicleId: body.vehicleId ? parseInt(body.vehicleId) : null,
        status: body.status,
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
    console.error('Failed to update expense:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    await prisma.expense.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete expense:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
