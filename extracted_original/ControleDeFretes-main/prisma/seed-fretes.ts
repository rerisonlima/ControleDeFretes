import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding fretes...');

  // Ensure we have at least some Contratantes
  const contratante1 = await prisma.contratante.upsert({
    where: { ContratanteNome: 'Empresa Alpha' },
    update: {},
    create: { ContratanteNome: 'Empresa Alpha' },
  });

  const contratante2 = await prisma.contratante.upsert({
    where: { ContratanteNome: 'Transportes Beta' },
    update: {},
    create: { ContratanteNome: 'Transportes Beta' },
  });

  // Ensure we have at least some Categorias
  const categoria1 = await prisma.categoriaVeiculos.upsert({
    where: { CategoriaNome: 'Caminhão Toco' },
    update: {},
    create: { CategoriaNome: 'Caminhão Toco' },
  });

  const categoria2 = await prisma.categoriaVeiculos.upsert({
    where: { CategoriaNome: 'Carreta' },
    update: {},
    create: { CategoriaNome: 'Carreta' },
  });

  // Create Fretes
  const fretesData = [
    {
      cidade: 'São Paulo - SP',
      contratanteId: contratante1.id,
      categoriaId: categoria1.id,
      valorFrete: 1500.00,
      valor1aViagemMotorista: 300.00,
      valor2aViagemMotorista: 250.00,
      valor1aViagemAjudante: 150.00,
      valor2aViagemAjudante: 120.00,
      validade: new Date('2026-12-31'),
    },
    {
      cidade: 'Rio de Janeiro - RJ',
      contratanteId: contratante1.id,
      categoriaId: categoria2.id,
      valorFrete: 2500.00,
      valor1aViagemMotorista: 500.00,
      valor2aViagemMotorista: 450.00,
      valor1aViagemAjudante: 250.00,
      valor2aViagemAjudante: 200.00,
      validade: new Date('2026-12-31'),
    },
    {
      cidade: 'Belo Horizonte - MG',
      contratanteId: contratante2.id,
      categoriaId: categoria1.id,
      valorFrete: 1800.00,
      valor1aViagemMotorista: 350.00,
      valor2aViagemMotorista: 300.00,
      valor1aViagemAjudante: 180.00,
      valor2aViagemAjudante: 150.00,
      validade: new Date('2026-12-31'),
    },
    {
      cidade: 'Curitiba - PR',
      contratanteId: contratante2.id,
      categoriaId: categoria2.id,
      valorFrete: 2200.00,
      valor1aViagemMotorista: 400.00,
      valor2aViagemMotorista: 350.00,
      valor1aViagemAjudante: 200.00,
      valor2aViagemAjudante: 180.00,
      validade: new Date('2026-12-31'),
    }
  ];

  for (const data of fretesData) {
    await prisma.frete.create({
      data,
    });
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
