import { PrismaClient } from '@prisma/client';

async function testConnection(name: string, url: string | undefined) {
  if (!url) {
    console.log(`${name} is not defined.`);
    return;
  }
  console.log(`Testing ${name} (${url.split('@')[1]})...`);
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: url,
      },
    },
  });

  try {
    const start = Date.now();
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    const end = Date.now();
    console.log(`${name} Query result:`, result);
    console.log(`${name} SELECT 1 took ${end - start}ms`);

    const startUsers = Date.now();
    const users = await prisma.user.findMany({ take: 3 });
    const endUsers = Date.now();
    console.log(`${name} Fetching ${users.length} users took ${endUsers - startUsers}ms`);
  } catch (error) {
    console.error(`${name} Error:`, error);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  await testConnection('DATABASE_URL (Pooled)', process.env.DATABASE_URL);
  console.log('---');
  await testConnection('DIRECT_URL (Direct)', process.env.DIRECT_URL);
}

main();
