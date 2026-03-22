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
    console.log('Checking for active queries...');
    const queries = await prisma.$queryRawUnsafe(`
      SELECT pid, state, query, wait_event_type, wait_event, query_start
      FROM pg_stat_activity
      WHERE state != 'idle' AND pid != pg_backend_pid();
    `);
    console.log('Active queries:', JSON.stringify(queries, null, 2));
    
    console.log('Checking for locks...');
    const locks = await prisma.$queryRawUnsafe(`
      SELECT 
        l.pid, 
        l.locktype, 
        l.mode, 
        l.granted, 
        a.query,
        a.query_start
      FROM pg_locks l
      JOIN pg_stat_activity a ON l.pid = a.pid
      WHERE l.pid != pg_backend_pid();
    `);
    console.log('Locks:', JSON.stringify(locks, null, 2));

  } catch (e) {
    console.error('Failed to check activity:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
