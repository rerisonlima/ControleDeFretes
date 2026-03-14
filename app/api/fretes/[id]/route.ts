import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const body = await request.json();
    const frete = await prisma.frete.update({
      where: { id },
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
    console.error('Failed to update frete:', error);
    return NextResponse.json({ error: 'Failed to update frete' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    
    // Check if frete is used in any trips
    const tripsCount = await prisma.trip.count({
      where: { freteId: id }
    });
    
    if (tripsCount > 0) {
      return NextResponse.json({ 
        error: 'Não é possível excluir este frete pois ele está vinculado a viagens existentes.',
        details: 'Foreign key constraint: Trip references Frete'
      }, { status: 400 });
    }

    await prisma.frete.delete({
      where: { id }
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete frete:', error);
    return NextResponse.json({ 
      error: 'Erro ao excluir frete',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
