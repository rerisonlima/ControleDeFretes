import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const showInactive = searchParams.get('showInactive') === 'true';

    const contratantes = await prisma.contratante.findMany({
      where: showInactive ? {} : { active: true },
      orderBy: { ContratanteNome: 'asc' }
    });
    return NextResponse.json(contratantes);
  } catch (error) {
    console.error('Failed to fetch contratantes:', error);
    return NextResponse.json({ error: 'Failed to fetch contratantes' }, { status: 500 });
  }
}
