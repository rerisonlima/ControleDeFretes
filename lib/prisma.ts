import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  const url = process.env.DATABASE_URL;
  if (!url) return new PrismaClient();
  
  // Append pool_timeout=120 and connection_limit=30 if not present to give more time and capacity
  const separator = url.includes('?') ? '&' : '?';
  let finalUrl = url;
  if (!url.includes('pool_timeout')) finalUrl += `${separator}pool_timeout=120`;
  const separator2 = finalUrl.includes('?') ? '&' : '?';
  if (!url.includes('connection_limit')) finalUrl += `${separator2}connection_limit=30`;
  
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

      // QUICK CHECK: See if we've already done this by checking the last added index
      // This avoids taking the advisory lock and starting a transaction in most cases
      const schemaCheck = await prisma.$queryRawUnsafe<{ exists: boolean }[]>(`
        SELECT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_expense_type') as exists;
      `);
      
      if (schemaCheck[0]?.exists) {
        console.log('Database schema is already up to date (idx_expense_type found). Skipping migrations.');
        return;
      }

      console.log('Schema check failed or incomplete. Starting migrations...');

      await prisma.$transaction(async (tx) => {
        console.log('Acquiring migration lock...');
        // Use a non-blocking PostgreSQL advisory lock to ensure only one migration runs at a time
        const lockResult = await tx.$queryRawUnsafe<{ pg_try_advisory_xact_lock: boolean }[]>('SELECT pg_try_advisory_xact_lock(123456789);');
        const lockAcquired = lockResult[0]?.pg_try_advisory_xact_lock;
        
        if (!lockAcquired) {
          console.log('Another process is already running migrations, skipping...');
          return;
        }
        
        console.log('Migration lock acquired. Setting timeouts...');
        // Increase statement timeout for the migration session
        await tx.$executeRawUnsafe('SET statement_timeout = 300000;'); // 5 minutes
        // Set a more reasonable lock timeout for the migration. 
        // 60 seconds gives it a chance to wait for active queries to finish.
        await tx.$executeRawUnsafe('SET lock_timeout = 60000;'); // 60 seconds
        
        console.log('Running schema modifications (Trip, Expense, User, Vehicle)...');
        // Combine all schema checks and modifications into a single DO block to minimize round-trips and lock duration
        await tx.$executeRawUnsafe(`
          DO $$
          BEGIN
            -- Trip Columns
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Trip' AND column_name = 'romaneio') THEN
              ALTER TABLE "Trip" ADD COLUMN "romaneio" TEXT;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Trip' AND column_name = 'odometer') THEN
              ALTER TABLE "Trip" ADD COLUMN "odometer" DOUBLE PRECISION;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Trip' AND column_name = 'createdByUserId') THEN
              ALTER TABLE "Trip" ADD COLUMN "createdByUserId" INTEGER;
            END IF;

            -- Expense Columns
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Expense' AND column_name = 'description') THEN
              ALTER TABLE "Expense" ADD COLUMN "description" TEXT;
            END IF;

            -- User Columns
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'lastLogin') THEN
              ALTER TABLE "User" ADD COLUMN "lastLogin" TIMESTAMP;
            END IF;

            -- Vehicle Columns
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Vehicle' AND column_name = 'currentOdometer') THEN
              ALTER TABLE "Vehicle" ADD COLUMN "currentOdometer" DOUBLE PRECISION;
            END IF;

            -- Constraints
            IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Trip_createdByUserId_fkey') THEN
              ALTER TABLE "Trip" ADD CONSTRAINT "Trip_createdByUserId_fkey" 
              FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
            END IF;
          END $$;
        `);
        
        console.log('Ensuring Maintenance table exists...');
        // Create Maintenance table if it doesn't exist
        await tx.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "Maintenance" (
            "id" SERIAL NOT NULL,
            "type" TEXT NOT NULL,
            "odometer" DOUBLE PRECISION NOT NULL,
            "currentOdometer" DOUBLE PRECISION,
            "executionDate" TIMESTAMP(3),
            "vehicleId" INTEGER NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "Maintenance_pkey" PRIMARY KEY ("id")
          );
        `);

        console.log('Running Maintenance specific modifications...');
        // Maintenance specific modifications
        await tx.$executeRawUnsafe(`
          DO $$
          BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Maintenance') THEN
              -- Maintenance Columns
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Maintenance' AND column_name = 'currentOdometer') THEN
                ALTER TABLE "Maintenance" ADD COLUMN "currentOdometer" DOUBLE PRECISION;
              END IF;
              
              -- Nullability
              IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Maintenance' AND column_name = 'executionDate' AND is_nullable = 'NO') THEN
                ALTER TABLE "Maintenance" ALTER COLUMN "executionDate" DROP NOT NULL;
              END IF;

              -- Foreign Key
              IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Maintenance_vehicleId_fkey') THEN
                ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_vehicleId_fkey" 
                FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
              END IF;
            END IF;
          END $$;
        `);
        
        console.log('Creating indexes (Trip, Expense)...');
        // Add indexes sequentially
        await tx.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "idx_trip_scheduled_at" ON "Trip"("scheduledAt");');
        await tx.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "idx_expense_date" ON "Expense"("date");');
        await tx.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "idx_trip_driver_id" ON "Trip"("driverId");');
        await tx.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "idx_trip_vehicle_id" ON "Trip"("vehicleId");');
        await tx.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "idx_trip_contratante_id" ON "Trip"("contratanteId");');
        await tx.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "idx_expense_type" ON "Expense"("type");');
        console.log('All migrations completed successfully.');
      }, {
        timeout: 300000 // 5 minutes for the whole transaction
      });
      
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

  // Delay migration slightly to avoid thundering herd on startup
  setTimeout(runMigrations, 5000);
}

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
