import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  console.log('Initializing Prisma with URL:', url?.split('@')[1]); // Log only the host part for security
  return new PrismaClient({
    datasources: {
      db: {
        url: url,
      },
    },
  });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
