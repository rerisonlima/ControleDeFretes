import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runMigrations() {
  console.log('Starting migrations...');
  try {
    // Add romaneio to Trip
    await prisma.$executeRawUnsafe('ALTER TABLE "Trip" ADD COLUMN IF NOT EXISTS "romaneio" TEXT;');
    console.log('Database migration: romaneio column checked/added');

    // Add description to Expense
    await prisma.$executeRawUnsafe('ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "description" TEXT;');
    console.log('Database migration: description column checked/added');

    // Add lastLogin to User
    await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastLogin" TIMESTAMP;');
    console.log('Database migration: lastLogin column checked/added');

    // Add indexes for performance
    console.log('Adding indexes for performance...');
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "idx_trip_scheduledAt" ON "Trip"("scheduledAt");');
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "idx_trip_vehicle_scheduledAt" ON "Trip"("vehicleId", "scheduledAt");');
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "idx_expense_date" ON "Expense"("date");');
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "idx_maintenance_executionDate" ON "Maintenance"("executionDate");');
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "idx_trip_contratanteId" ON "Trip"("contratanteId");');
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "idx_trip_routeId" ON "Trip"("routeId");');
    console.log('Database migration: indexes checked/added');
    
    console.log('Migrations completed successfully.');
  } catch (err: any) {
    console.error('Database migration error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runMigrations();
