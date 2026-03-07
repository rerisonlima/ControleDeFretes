import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('G4t0=^.^=!pr3t0!', 10);
  
  const user = await prisma.user.upsert({
    where: { username: 'rerison' },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
    },
    create: {
      name: 'Rerison',
      email: 'rerison@gmail.com',
      username: 'rerison',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  
  console.log('Usuário criado/atualizado:', user.username);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
