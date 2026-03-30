import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding fretes...');

  const contratantes = await prisma.contratante.findMany({
    where: {
      ContratanteNome: {
        in: ['MP', 'MaxPet', 'Parati']
      }
    }
  });

  const categorias = await prisma.categoriaVeiculos.findMany({
    where: {
      CategoriaNome: {
        in: ['Fiorino', 'Kombi', 'Van', 'VUC', '3/4', 'Toco', 'Truck']
      }
    }
  });

  if (contratantes.length === 0 || categorias.length === 0) {
    console.log('No contratantes or categorias found. Exiting.');
    return;
  }

  const cidades = [
    'São Paulo - SP',
    'Campinas - SP',
    'Guarulhos - SP',
    'Osasco - SP',
    'Santo André - SP',
    'São Bernardo do Campo - SP',
    'Santos - SP',
    'Sorocaba - SP',
    'Ribeirão Preto - SP',
    'São José dos Campos - SP'
  ];

  const fretesData = [];

  for (const contratante of contratantes) {
    for (const cidade of cidades) {
      // Pick a random category
      const categoria = categorias[Math.floor(Math.random() * categorias.length)];
      
      const baseValue = Math.floor(Math.random() * 2000) + 500; // 500 to 2500
      
      fretesData.push({
        cidade: cidade,
        contratanteId: contratante.id,
        categoriaId: categoria.id,
        valorFrete: baseValue,
        valor1aViagemMotorista: baseValue * 0.2, // 20%
        valor2aViagemMotorista: baseValue * 0.15, // 15%
        valor1aViagemAjudante: baseValue * 0.1, // 10%
        valor2aViagemAjudante: baseValue * 0.08, // 8%
        validade: new Date('2026-12-31'),
      });
    }
  }

  for (const data of fretesData) {
    await prisma.frete.create({
      data,
    });
  }

  console.log(`Seeding finished. Inserted ${fretesData.length} fretes.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
