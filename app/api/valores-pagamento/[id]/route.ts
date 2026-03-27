import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = parseInt(idStr);

  if (isNaN(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    const data = await request.json();
    const record = await prisma.valoresPagamentoMotoristaAjudante.update({
      where: { id },
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
    console.error(`Error updating valor pagamento with ID ${id}:`, error);
    // @ts-expect-error - Prisma error code
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idStr } = await params;
  const id = parseInt(idStr);

  if (isNaN(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    await prisma.valoresPagamentoMotoristaAjudante.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error deleting valor pagamento with ID ${id}:`, error);
    // @ts-expect-error - Prisma error code
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
