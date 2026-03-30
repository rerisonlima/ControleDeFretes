import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const contratantes = await prisma.contratante.findMany();
  console.log('Contratantes:', contratantes);
  
  const categorias = await prisma.categoriaVeiculos.findMany();
  console.log('Categorias:', categorias);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
