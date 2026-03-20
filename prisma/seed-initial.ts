import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding initial data...');

  // Create Categorias
  const categorias = ['Fiorino', 'Kombi', 'Van', 'VUC', '3/4', 'Toco', 'Truck'];
  for (const name of categorias) {
    await prisma.categoriaVeiculos.upsert({
      where: { CategoriaNome: name },
      update: {},
      create: { CategoriaNome: name },
    });
  }

  // Create Contratantes
  const contratantes = ['MP', 'MaxPet', 'Parati'];
  for (const name of contratantes) {
    await prisma.contratante.upsert({
      where: { ContratanteNome: name },
      update: {},
      create: { ContratanteNome: name },
    });
  }

  console.log('Initial data seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
