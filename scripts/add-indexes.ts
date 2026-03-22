import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Manually load .env
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').replace(/"/g, '').trim();
      process.env[key.trim()] = value;
    }
  });
}

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Using DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 20) + '...');
    console.log('Setting statement_timeout to 5 minutes...');
    await prisma.$executeRawUnsafe('SET statement_timeout = 300000;');
    
    console.log('Creating Trip_scheduledAt_idx...');
    try {
      await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "Trip_scheduledAt_idx" ON "Trip"("scheduledAt");');
      console.log('Trip_scheduledAt_idx created.');
    } catch (e) {
      console.error('Failed to create Trip index:', e);
    }
    
    console.log('Creating Expense_date_idx...');
    try {
      await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "Expense_date_idx" ON "Expense"("date");');
      console.log('Expense_date_idx created.');
    } catch (e) {
      console.error('Failed to create Expense index:', e);
    }
    
    console.log('Script finished.');
  } catch (e) {
    console.error('Failed to create indexes:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
