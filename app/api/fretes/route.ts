import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const fretes = await prisma.frete.findMany({
      include: {
        contratante: true,
        categoria: true,
      },
      orderBy: { contratanteId: 'asc' }
    });
    return NextResponse.json(fretes);
  } catch (error) {
    console.error('Failed to fetch fretes:', error);
    return NextResponse.json({ error: 'Failed to fetch fretes' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const frete = await prisma.frete.create({
      data: {
        cidade: body.cidade,
        contratanteId: parseInt(body.contratanteId),
        categoriaId: parseInt(body.categoriaId),
        valorFrete: parseFloat(body.valorFrete),
        valor1aViagemMotorista: parseFloat(body.valor1aViagemMotorista),
        valor2aViagemMotorista: parseFloat(body.valor2aViagemMotorista),
        valor1aViagemAjudante: parseFloat(body.valor1aViagemAjudante),
        valor2aViagemAjudante: parseFloat(body.valor2aViagemAjudante),
        validade: new Date(body.validade),
      },
      include: {
        contratante: true,
        categoria: true,
      }
    });
    return NextResponse.json(frete);
  } catch (error) {
    console.error('Failed to create frete:', error);
    return NextResponse.json({ error: 'Failed to create frete' }, { status: 500 });
  }
}
