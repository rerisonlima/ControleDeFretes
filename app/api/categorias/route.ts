import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const categorias = await prisma.categoriaVeiculos.findMany({
      orderBy: { CategoriaNome: 'asc' }
    });
    return NextResponse.json(categorias);
  } catch (error) {
    console.error('Failed to fetch categorias:', error);
    return NextResponse.json({ error: 'Failed to fetch categorias' }, { status: 500 });
  }
}
