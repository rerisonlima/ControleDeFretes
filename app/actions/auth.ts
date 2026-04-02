'use server';

import { cookies } from 'next/headers';
import { encrypt } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function loginAction(formData: FormData) {
  try {
    const username = (formData.get('username') as string)?.trim();
    const password = formData.get('password') as string;

    if (!username || !password) {
      return { error: 'Usuário e senha são obrigatórios.' };
    }

    // 1. Busca de usuário
    const user = await prisma.user.findUnique({
      where: { 
        username: username.toLowerCase()
      },
    });

    if (!user) {
      return { error: 'Credenciais inválidas.' };
    }

    // 2. Verificação de senha
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return { error: 'Credenciais inválidas.' };
    }

    // 3. Criar sessão
    const sessionData = {
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
    };

    const encryptedSessionData = await encrypt(sessionData);
    
    const cookieStore = cookies();
    cookieStore.set('session', encryptedSessionData, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 60 * 60 * 24, // 24 horas
      path: '/',
    });

    // 4. Atualização do lastLogin (não bloqueante para acelerar a resposta)
    prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    }).catch(e => console.error('Erro ao atualizar lastLogin:', e));

    return { success: true, role: user.role };
  } catch (error) {
    console.error('--- SERVER: Erro crítico no login ---', error);
    return { 
      error: 'Erro no servidor ao processar login. Por favor, tente novamente.',
      details: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function logoutAction() {
  const cookieStore = cookies();
  cookieStore.set('session', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 0,
    path: '/',
  });
}
