import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({ where: { username: 'admin' } });
  console.log('Admin user:', user ? 'exists' : 'not found');
  if (user) {
    console.log('ID:', user.id);
    console.log('Role:', user.role);
    console.log('Password Hash:', user.password);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
