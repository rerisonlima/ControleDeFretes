import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clear existing users
  await prisma.user.deleteMany();
  console.log('Users cleared.');

  // Create rerison user
  const rerisonPassword = await bcrypt.hash('1Tijolo!', 10);
  const rerison = await prisma.user.upsert({
    where: { username: 'rerison' },
    update: {},
    create: {
      username: 'rerison',
      name: 'Rerison',
      email: 'rerison@gmail.com',
      password: rerisonPassword,
      role: 'ADMIN',
    },
  });
  console.log('Rerison user created:', rerison.username);

  // Create default admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      name: 'Administrador',
      email: 'admin@rapidocarioca.com.br',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('Admin user created:', admin.username);

  // Create default operator user
  const operatorPassword = await bcrypt.hash('op123', 10);
  const operator = await prisma.user.upsert({
    where: { username: 'operador' },
    update: {},
    create: {
      username: 'operador',
      name: 'Operador',
      email: 'operador@rapidocarioca.com.br',
      password: operatorPassword,
      role: 'OPERATOR',
    },
  });
  console.log('Operator user created:', operator.username);

  // Seed Categories
  const categories = [
    'TRUCK',
    'TOCO',
    '3/4',
    'VLC',
    'VAN',
    'FIORINO',
    'CARRETA',
    'BITREM',
  ];

  for (const catName of categories) {
    await prisma.categoriaVeiculos.upsert({
      where: { CategoriaNome: catName },
      update: {},
      create: { CategoriaNome: catName },
    });
  }
  console.log('Categories seeded.');

  // Seed Contratantes
  const contratantes = [
    'AMBEV',
    'COCA-COLA',
    'NESTLE',
    'UNILEVER',
    'P&G',
  ];

  for (const name of contratantes) {
    await prisma.contratante.upsert({
      where: { ContratanteNome: name },
      update: {},
      create: { ContratanteNome: name },
    });
  }
  console.log('Contratantes seeded.');

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
