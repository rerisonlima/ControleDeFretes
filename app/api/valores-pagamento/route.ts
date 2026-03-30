import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const records = await prisma.valoresPagamentoMotoristaAjudante.findMany({
      orderBy: { validade: 'asc' },
    });
    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching valores pagamento:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const record = await prisma.valoresPagamentoMotoristaAjudante.create({
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
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating valor pagamento:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
