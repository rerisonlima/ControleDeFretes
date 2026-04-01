import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function checkUser() {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.findUnique({
      where: { username: 'rerison' },
    });
    if (user) {
      console.log('User found:', { ...user, password: '[REDACTED]' });
      const isValid = await bcrypt.compare('1Tijolo!', user.password);
      console.log('Password valid:', isValid);
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();
