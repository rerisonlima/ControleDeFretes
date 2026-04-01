import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    // Teste simples de conexão com o banco
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok', database: 'connected' });
  } catch (error: any) {
    console.error('Health check failed:', error);
    
    let message = 'Database connection failed';
    if (error.message?.includes('postgresql://') || error.message?.includes('postgres://')) {
      message = 'Configuração de URL de banco de dados inválida. Verifique os segredos (DATABASE_URL).';
    } else if (error.message?.includes('Can\'t reach database server')) {
      message = 'Não foi possível alcançar o servidor do banco de dados. Verifique se o banco está online.';
    }

    return NextResponse.json(
      { status: 'error', message, details: error.message },
      { status: 500 }
    );
  }
}
