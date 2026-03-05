import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const records = await prisma.categoriaVeiculos.findMany({
      orderBy: { categoriaNome: 'asc' },
    });
    return NextResponse.json(records);
  } catch (error) {
    console.error('Error fetching categorias:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
