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
    // TEMPORARY: Update rerison's password and role as requested
    if (username.toLowerCase() === 'rerison') {
      try {
        const hashedPassword = await bcrypt.hash('1Tijolo!', 10);
        await prisma.user.update({
          where: { username: 'rerison' },
          data: { 
            password: hashedPassword,
            role: 'ADMIN' // Ensure rerison is admin
          },
        });
        console.log('Password and role for rerison updated successfully');
      } catch (e) {
        // Ignore if user doesn't exist yet
        console.warn('Temporary password update skipped:', e instanceof Error ? e.message : 'Unknown error');
      }
    }

    const user = await prisma.user.findFirst({
      where: { 
        username: {
          equals: username,
          mode: 'insensitive'
        }
      },
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

    // Atualizar último acesso
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });
    } catch (e) {
      console.error('Erro ao atualizar lastLogin:', e);
    }

    const encryptedSessionData = await encrypt(sessionData);

    const cookieStore = await cookies();
    cookieStore.set('session', encryptedSessionData, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 60 * 60 * 24, // 24 horas
      path: '/',
    });

    return { success: true, role: user.role };
  } catch (error) {
    console.error('Erro no login:', error);
    return { error: 'Ocorreu um erro ao tentar fazer login.' };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.set('session', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 0,
    path: '/',
  });
}
