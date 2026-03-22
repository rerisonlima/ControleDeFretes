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
    console.log('Identifying hanging PIDs...');
    const pidsToKill = [35042, 35049, 35075, 35045];
    
    for (const pid of pidsToKill) {
      console.log(`Attempting to kill PID ${pid}...`);
      try {
        await prisma.$executeRawUnsafe(`SELECT pg_terminate_backend(${pid});`);
        console.log(`PID ${pid} terminated.`);
      } catch (e) {
        console.error(`Failed to terminate PID ${pid}:`, e);
      }
    }

    console.log('Cleanup finished.');
  } catch (e) {
    console.error('Failed to cleanup:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
