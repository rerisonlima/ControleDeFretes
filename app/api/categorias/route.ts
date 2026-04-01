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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const categoria = await prisma.categoriaVeiculos.create({
      data: {
        CategoriaNome: body.CategoriaNome,
      },
    });
    return NextResponse.json(categoria);
  } catch (error) {
    console.error('Failed to create categoria:', error);
    return NextResponse.json({ error: 'Failed to create categoria' }, { status: 500 });
  }
}
