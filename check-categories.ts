import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const categories = await prisma.categoriaVeiculos.findMany();
  console.log(categories);
}
main();
