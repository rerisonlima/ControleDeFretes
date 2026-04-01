import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  let url = process.env.DATABASE_URL || process.env.DIRECT_URL;
  
  // Se a URL for inválida (ex: apenas o nome da variável), tenta limpar ou logar erro claro
  if (url && !url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
    console.error(`--- PRISMA ERROR: URL de banco de dados inválida! Valor atual: "${url.substring(0, 20)}..."`);
    console.error('A URL deve começar com postgresql:// ou postgres://');
    console.error('DICA: Verifique se você não configurou o valor da variável como o próprio nome dela no menu de Configurações.');
    
    // Se for apenas o nome da variável, provavelmente é erro de configuração
    if (url === 'DATABASE_URL' || url === 'DIRECT_URL') {
      url = undefined; // Força erro de "missing URL" em vez de "invalid protocol"
    }
  }

  const host = url?.split('@')[1] || 'NOT_SET';
  console.log('Initializing Prisma with URL host:', host);
  
  return new PrismaClient({
    log: ['error', 'warn'],
    ...(url && (url.startsWith('postgresql://') || url.startsWith('postgres://')) ? {
      datasources: {
        db: {
          url: url,
        },
      },
    } : {}),
  });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

// Tenta conectar antecipadamente para reduzir latência na primeira requisição
if (process.env.NODE_ENV === 'production') {
  prisma.$connect().catch(e => console.error('Erro ao conectar ao Prisma antecipadamente:', e));
}

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
