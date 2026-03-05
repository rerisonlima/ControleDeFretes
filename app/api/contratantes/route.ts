import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const contratantes = await prisma.contratante.findMany({
      orderBy: { ContratanteNome: 'asc' }
    });
    return NextResponse.json(contratantes);
  } catch (error) {
    console.error('Failed to fetch contratantes:', error);
    return NextResponse.json({ error: 'Failed to fetch contratantes' }, { status: 500 });
  }
}
