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
    console.log('Checking indexes...');
    const indexes = await prisma.$queryRawUnsafe(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename IN ('Trip', 'Expense')
    `);
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));
  } catch (e) {
    console.error('Failed to check indexes:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
