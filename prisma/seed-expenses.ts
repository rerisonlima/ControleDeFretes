import { PrismaClient } from '@prisma/client';
import { subDays } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding expenses...');

  const vehicles = await prisma.vehicle.findMany();
  const types = ['Combustível', 'Manutenção', 'Pedágio', 'Alimentação', 'Outros'];
  
  const now = new Date();
  
  for (let i = 0; i < 15; i++) {
    const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const date = subDays(now, Math.floor(Math.random() * 30));
    
    await prisma.expense.create({
      data: {
        date,
        type,
        value: Math.floor(Math.random() * 500) + 50,
        vehicleId: vehicle.id,
        status: 'PAID',
        description: `Despesa de ${type}`
      }
    });
  }

  console.log('Expenses seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
