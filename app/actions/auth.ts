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
    console.log(`Iniciando login para o usuário: ${username}`);
    const start = Date.now();
    const user = await prisma.user.findUnique({
      where: { username },
    });
    console.log(`Busca de usuário levou ${Date.now() - start}ms`);

    if (!user) {
      return { error: 'Credenciais inválidas.' };
    }

    const startBcrypt = Date.now();
    const isValid = await bcrypt.compare(password, user.password);
    console.log(`Bcrypt compare levou ${Date.now() - startBcrypt}ms`);

    if (!isValid) {
      return { error: 'Credenciais inválidas.' };
    }

    // Criar sessão (token JWT)
    const sessionData = {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      lastLogin: user.lastLogin,
    };

    // Atualizar último acesso (não bloqueante para o login)
    prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    }).catch(e => console.error('Erro ao atualizar lastLogin:', e));

    const startEncrypt = Date.now();
    const encryptedSessionData = await encrypt(sessionData);
    console.log(`Criptografia de sessão levou ${Date.now() - startEncrypt}ms`);

    const cookieStore = await cookies();
    cookieStore.set('session', encryptedSessionData, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 60 * 60 * 24, // 24 horas
      path: '/',
    });

    console.log(`Login concluído com sucesso em ${Date.now() - start}ms`);
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
    secure: true,
    sameSite: 'none',
    maxAge: 0,
    path: '/',
  });
}
