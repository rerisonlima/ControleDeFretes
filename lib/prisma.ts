import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  const url = process.env.DATABASE_URL;
  if (!url) return new PrismaClient();
  
  // Append pool_timeout=60 and connection_limit=20 if not present to give more time and capacity
  const separator = url.includes('?') ? '&' : '?';
  let finalUrl = url;
  if (!url.includes('pool_timeout')) finalUrl += `${separator}pool_timeout=60`;
  const separator2 = finalUrl.includes('?') ? '&' : '?';
  if (!url.includes('connection_limit')) finalUrl += `${separator2}connection_limit=20`;
  
  return new PrismaClient({
    datasources: {
      db: {
        url: finalUrl,
      },
    },
  });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
  var prismaMigrationsRun: boolean | undefined;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

// Auto-migration for romaneio and description columns - Run only once per process
if (typeof window === 'undefined' && !globalThis.prismaMigrationsRun) {
  globalThis.prismaMigrationsRun = true;
  console.log('Initializing database migrations...');
  
  const runMigrations = async () => {
    try {
      // Test connection first
      await prisma.$queryRaw`SELECT 1`;
      console.log('Database connection test successful');

      // Add columns sequentially to avoid connection pool pressure
      await prisma.$executeRawUnsafe('ALTER TABLE "Trip" ADD COLUMN IF NOT EXISTS "romaneio" TEXT;');
      await prisma.$executeRawUnsafe('ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "description" TEXT;');
      await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLogin" TIMESTAMP;');
      await prisma.$executeRawUnsafe('ALTER TABLE "Trip" ADD COLUMN IF NOT EXISTS "odometer" DOUBLE PRECISION;');
      
      // Add indexes sequentially
      await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "idx_trip_scheduled_at" ON "Trip"("scheduledAt");');
      await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "idx_expense_date" ON "Expense"("date");');
      await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "idx_trip_driver_id" ON "Trip"("driverId");');
      await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "idx_trip_vehicle_id" ON "Trip"("vehicleId");');
      
      console.log('Database migrations and indexes checked/added');
    } catch (err) {
      console.error('Database initialization/migration error:', err);
      if (err instanceof Error) {
        console.error('Error message:', err.message);
        if (err.message.includes('relation') && err.message.includes('does not exist')) {
          console.error('CRITICAL: One or more tables do not exist. Please run migrations.');
        }
        if (err.message.includes('timeout')) {
          console.error('WARNING: Migration timed out. This is common if the DB is under load or has many records.');
        }
      }
    }
  };

  runMigrations();
}

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
