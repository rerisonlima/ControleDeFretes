import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    const categoria = await prisma.categoriaVeiculos.update({
      where: { id },
      data: {
        CategoriaNome: body.CategoriaNome,
      },
    });
    return NextResponse.json(categoria);
  } catch (error) {
    console.error('Failed to update categoria:', error);
    return NextResponse.json({ error: 'Failed to update categoria' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    await prisma.categoriaVeiculos.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Categoria excluída com sucesso' });
  } catch (error: any) {
    console.error('Failed to delete categoria:', error);
    if (error.code === 'P2003') {
      return NextResponse.json({ 
        error: 'Não é possível excluir esta categoria pois existem veículos ou fretes vinculados a ela.' 
      }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to delete categoria' }, { status: 500 });
  }
}
