import { PrismaClient } from '@prisma/client';
import { subDays, addDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding trips...');

  const vehicles = await prisma.vehicle.findMany();
  if (vehicles.length === 0) {
    // Create some vehicles
    const cats = await prisma.categoriaVeiculos.findMany();
    await prisma.vehicle.create({
      data: {
        plate: 'ABC-1234',
        type: 'Fiorino',
        brand: 'Fiat',
        model: 'Fiorino',
        year: 2022,
        capacity: 650,
        categoriaId: cats[0].id
      }
    });
    await prisma.vehicle.create({
      data: {
        plate: 'XYZ-9876',
        type: 'Truck',
        brand: 'Mercedes',
        model: 'Accelo',
        year: 2021,
        capacity: 8000,
        categoriaId: cats[cats.length - 1].id
      }
    });
  }

  const drivers = await prisma.employee.findMany({ where: { role: 'MOTORISTA' } });
  if (drivers.length === 0) {
    await prisma.employee.create({
      data: { name: 'João Silva', role: 'MOTORISTA', phone: '21999999999' }
    });
    await prisma.employee.create({
      data: { name: 'Maria Oliveira', role: 'MOTORISTA', phone: '21888888888' }
    });
  }

  const helpers = await prisma.employee.findMany({ where: { role: 'AJUDANTE' } });
  if (helpers.length === 0) {
    await prisma.employee.create({
      data: { name: 'Pedro Santos', role: 'AJUDANTE', phone: '21777777777' }
    });
  }

  const allVehicles = await prisma.vehicle.findMany();
  const allDrivers = await prisma.employee.findMany({ where: { role: 'MOTORISTA' } });
  const allHelpers = await prisma.employee.findMany({ where: { role: 'AJUDANTE' } });
  const fretes = await prisma.frete.findMany();

  const now = new Date();
  
  for (let i = 0; i < 20; i++) {
    const frete = fretes[Math.floor(Math.random() * fretes.length)];
    const vehicle = allVehicles[Math.floor(Math.random() * allVehicles.length)];
    const driver = allDrivers[Math.floor(Math.random() * allDrivers.length)];
    const helper = Math.random() > 0.3 ? allHelpers[Math.floor(Math.random() * allHelpers.length)] : null;
    
    const date = subDays(now, Math.floor(Math.random() * 30));
    
    await prisma.trip.create({
      data: {
        tripId: `TRIP-${Date.now()}-${i}`,
        freteId: frete.id,
        contratanteId: frete.contratanteId,
        vehicleId: vehicle.id,
        driverId: driver.id,
        helperId: helper?.id,
        scheduledAt: date,
        value: frete.valorFrete,
        status: 'DELIVERED',
        valor1aViagemMotorista: frete.valor1aViagemMotorista,
        valor2aViagemMotorista: frete.valor2aViagemMotorista,
        valor1aViagemAjudante: frete.valor1aViagemAjudante,
        valor2aViagemAjudante: frete.valor2aViagemAjudante,
      }
    });
  }

  console.log('Trips seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
