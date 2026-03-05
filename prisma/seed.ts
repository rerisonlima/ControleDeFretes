import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create a default admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rapidocarioca.com' },
    update: {},
    create: {
      name: 'Rerison Lima',
      email: 'admin@rapidocarioca.com',
      username: 'admin',
      password: 'admin123', // In a real app, hash this!
      role: 'ADMIN',
    },
  });

  // Create vehicle categories
  const categories = [
    'Fiorino', 'Kombi', 'Van', 'VUC', '3/4', 'Toco', 'Truck', 'Carretas 2 eixos', 'Carreta 3 eixos', 'Bitrem'
  ];

  for (const cat of categories) {
    await prisma.categoriaVeiculos.upsert({
      where: { CategoriaNome: cat },
      update: {},
      create: { CategoriaNome: cat },
    });
  }

  // Create contratantes
  const contratantes = ['MP', 'MaxPet', 'Parati'];

  for (const cont of contratantes) {
    await prisma.contratante.upsert({
      where: { ContratanteNome: cont },
      update: {},
      create: { ContratanteNome: cont },
    });
  }

  // Fetch categories to assign to vehicles
  const fiorinoCat = await prisma.categoriaVeiculos.findUnique({ where: { CategoriaNome: 'Fiorino' } });
  const vucCat = await prisma.categoriaVeiculos.findUnique({ where: { CategoriaNome: 'VUC' } });
  const carretaCat = await prisma.categoriaVeiculos.findUnique({ where: { CategoriaNome: 'Carretas 2 eixos' } });
  const truckCat = await prisma.categoriaVeiculos.findUnique({ where: { CategoriaNome: 'Truck' } });

  // Create some vehicles
  const v1 = await prisma.vehicle.upsert({
    where: { plate: 'ABC-1234' },
    update: {},
    create: {
      plate: 'ABC-1234',
      type: 'Caminhão Baú',
      brand: 'Mercedes-Benz',
      model: 'Accelo 1016',
      year: 2022,
      capacity: 10.5,
      status: 'ACTIVE',
      categoriaId: truckCat?.id,
    },
  });

  const v2 = await prisma.vehicle.upsert({
    where: { plate: 'XYZ-5678' },
    update: {},
    create: {
      plate: 'XYZ-5678',
      type: 'VUC',
      brand: 'Volkswagen',
      model: 'Delivery 9.170',
      year: 2021,
      capacity: 6.0,
      status: 'ACTIVE',
      categoriaId: vucCat?.id,
    },
  });

  const v3 = await prisma.vehicle.upsert({
    where: { plate: 'KJH-9012' },
    update: {},
    create: {
      plate: 'KJH-9012',
      type: 'Carreta',
      brand: 'Scania',
      model: 'R 450',
      year: 2023,
      capacity: 32.0,
      status: 'ACTIVE',
      categoriaId: carretaCat?.id,
    },
  });

  const v4 = await prisma.vehicle.upsert({
    where: { plate: 'LMN-3456' },
    update: {},
    create: {
      plate: 'LMN-3456',
      type: 'Fiorino',
      brand: 'Fiat',
      model: 'Fiorino Endurance',
      year: 2022,
      capacity: 0.65,
      status: 'ACTIVE',
      categoriaId: fiorinoCat?.id,
    },
  });

  // Create some employees
  const d1 = await prisma.employee.create({
    data: {
      name: 'João Silva',
      role: 'DRIVER',
      phone: '(21) 98888-7777',
    },
  });

  const d2 = await prisma.employee.create({
    data: {
      name: 'Maria Oliveira',
      role: 'DRIVER',
      phone: '(21) 99999-8888',
    },
  });

  const h1 = await prisma.employee.create({
    data: {
      name: 'Carlos Santos',
      role: 'HELPER',
      phone: '(21) 97777-6666',
    },
  });

  const h2 = await prisma.employee.create({
    data: {
      name: 'Pedro Souza',
      role: 'HELPER',
      phone: '(21) 96666-5555',
    },
  });

  // Create some routes
  const r1 = await prisma.route.create({
    data: {
      destination: 'Rio de Janeiro -> São Paulo',
      freightValue: 2500.0,
      driverValue1: 450.0,
      driverValue2: 500.0,
      helperValue1: 150.0,
      helperValue2: 180.0,
    },
  });

  const r2 = await prisma.route.create({
    data: {
      destination: 'Rio de Janeiro -> Belo Horizonte',
      freightValue: 1800.0,
      driverValue1: 350.0,
      driverValue2: 400.0,
      helperValue1: 120.0,
      helperValue2: 150.0,
    },
  });

  const r3 = await prisma.route.create({
    data: {
      destination: 'Rio de Janeiro -> Curitiba',
      freightValue: 3200.0,
      driverValue1: 600.0,
      driverValue2: 650.0,
      helperValue1: 200.0,
      helperValue2: 230.0,
    },
  });

  const r4 = await prisma.route.create({
    data: {
      destination: 'Rio de Janeiro -> Vitória',
      freightValue: 1200.0,
      driverValue1: 250.0,
      driverValue2: 300.0,
      helperValue1: 100.0,
      helperValue2: 120.0,
    },
  });

  // Create some trips for the current month
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  await prisma.trip.upsert({
    where: { tripId: 'TRP-001' },
    update: {},
    create: {
      tripId: 'TRP-001',
      routeId: r1.id,
      vehicleId: v1.id,
      driverId: d1.id,
      helperId: h1.id,
      scheduledAt: new Date(currentYear, currentMonth, 5, 8, 0),
      value: 2500.0,
      status: 'DELIVERED',
      paid: 'sim',
      paymentDate: new Date(currentYear, currentMonth, 6),
    },
  });

  await prisma.trip.upsert({
    where: { tripId: 'TRP-002' },
    update: {},
    create: {
      tripId: 'TRP-002',
      routeId: r2.id,
      vehicleId: v2.id,
      driverId: d2.id,
      scheduledAt: new Date(currentYear, currentMonth, 12, 9, 30),
      value: 1800.0,
      status: 'IN_TRANSIT',
      paid: 'não',
    },
  });

  await prisma.trip.upsert({
    where: { tripId: 'TRP-003' },
    update: {},
    create: {
      tripId: 'TRP-003',
      routeId: r3.id,
      vehicleId: v3.id,
      driverId: d1.id,
      helperId: h2.id,
      scheduledAt: new Date(currentYear, currentMonth, 15, 7, 0),
      value: 3200.0,
      status: 'SCHEDULED',
      paid: 'não',
    },
  });

  await prisma.trip.upsert({
    where: { tripId: 'TRP-004' },
    update: {},
    create: {
      tripId: 'TRP-004',
      routeId: r4.id,
      vehicleId: v4.id,
      driverId: d2.id,
      scheduledAt: new Date(currentYear, currentMonth, 20, 10, 0),
      value: 1200.0,
      status: 'DELIVERED',
      paid: 'sim',
      paymentDate: new Date(currentYear, currentMonth, 21),
    },
  });

  await prisma.trip.upsert({
    where: { tripId: 'TRP-005' },
    update: {},
    create: {
      tripId: 'TRP-005',
      routeId: r1.id,
      vehicleId: v1.id,
      driverId: d1.id,
      helperId: h1.id,
      scheduledAt: new Date(currentYear, currentMonth, 25, 8, 0),
      value: 2500.0,
      status: 'SCHEDULED',
      paid: 'não',
    },
  });

  // Create some expenses
  await prisma.expense.create({
    data: {
      date: new Date(currentYear, currentMonth, 10),
      type: 'Combustível',
      vehicleId: v1.id,
      value: 850.0,
      status: 'PAID',
    },
  });

  await prisma.expense.create({
    data: {
      date: new Date(currentYear, currentMonth, 15),
      type: 'Manutenção Preventiva',
      vehicleId: v2.id,
      value: 450.0,
      status: 'PENDING',
    },
  });

  await prisma.expense.create({
    data: {
      date: new Date(currentYear, currentMonth, 18),
      type: 'Pedágio',
      vehicleId: v3.id,
      value: 120.0,
      status: 'PAID',
    },
  });

  await prisma.expense.create({
    data: {
      date: new Date(currentYear, currentMonth, 22),
      type: 'Alimentação',
      value: 60.0,
      status: 'PAID',
    },
  });

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
