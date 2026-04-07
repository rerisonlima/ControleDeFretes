import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const { username, password, role, name } = await request.json();

    // Check if we are trying to change the role of the last admin
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: { role: true }
    });

    if (currentUser?.role === 'ADMIN' && role !== 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN' }
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Não é possível alterar a função do único administrador do sistema.' },
          { status: 400 }
        );
      }
    }

    const data: any = {
      username,
      role,
      name,
    };

    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      id: user.id,
      username: user.username,
      role: user.role,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    // Check if we are trying to delete the last admin
    const userToDelete = await prisma.user.findUnique({
      where: { id },
      select: { role: true }
    });

    if (userToDelete?.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN' }
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Não é possível excluir o único administrador do sistema.' },
          { status: 400 }
        );
      }
    }

    await prisma.user.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Erro ao excluir usuário' }, { status: 500 });
  }
}
