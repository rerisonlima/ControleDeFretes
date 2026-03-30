import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const record = await prisma.valoresPagamentoMotoristaAjudante.update({
      where: { id: parseInt(id) },
      data: {
        validade: new Date(data.validade),
        destino: data.destino,
        categoria: data.categoria || null,
        valorPgto1ViagemMotorista: parseInt(data.valorPgto1ViagemMotorista),
        valorPgto2ViagemMotorista: parseInt(data.valorPgto2ViagemMotorista),
        valorPgto1ViagemAjudante: parseInt(data.valorPgto1ViagemAjudante),
        valorPgto2ViagemAjudante: parseInt(data.valorPgto2ViagemAjudante),
      },
    });
    return NextResponse.json(record);
  } catch (error) {
    console.error('Error updating valor pagamento:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.valoresPagamentoMotoristaAjudante.delete({
      where: { id: parseInt(id) },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting valor pagamento:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
