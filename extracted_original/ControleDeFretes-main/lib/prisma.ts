import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

// Auto-migration for romaneio and description columns
if (typeof window === 'undefined') {
  // Add romaneio to Trip
  prisma.$executeRawUnsafe('ALTER TABLE "Trip" ADD COLUMN IF NOT EXISTS "romaneio" TEXT;')
    .then(() => console.log('Database migration: romaneio column checked/added'))
    .catch(err => console.error('Database migration error (romaneio):', err));

  // Add description to Expense
  prisma.$executeRawUnsafe('ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "description" TEXT;')
    .then(() => console.log('Database migration: description column checked/added'))
    .catch(err => console.error('Database migration error (description):', err));

  // Add lastLogin to User
  prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLogin" TIMESTAMP;')
    .then(() => console.log('Database migration: lastLogin column checked/added'))
    .catch(err => console.error('Database migration error (lastLogin):', err));
}

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
