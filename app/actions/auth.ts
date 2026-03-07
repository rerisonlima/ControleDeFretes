'use server';

import { cookies } from 'next/headers';
import { encrypt } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function loginAction(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { error: 'Usuário e senha são obrigatórios.' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return { error: 'Credenciais inválidas.' };
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return { error: 'Credenciais inválidas.' };
    }

    // Criar sessão (token JWT)
    const sessionData = {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
    };

    const encryptedSessionData = await encrypt(sessionData);

    const cookieStore = await cookies();
    cookieStore.set('session', encryptedSessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 24 horas
      path: '/',
    });

    return { success: true };
  } catch (error) {
    console.error('Erro no login:', error);
    return { error: 'Ocorreu um erro ao tentar fazer login.' };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.set('session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/',
  });
}
