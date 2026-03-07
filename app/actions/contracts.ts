'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getContracts() {
  try {
    const contracts = await prisma.contratante.findMany({
      orderBy: {
        ContratanteNome: 'asc',
      },
    });
    return { contracts };
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return { error: 'Failed to fetch contracts' };
  }
}

export async function createContract(formData: FormData) {
  try {
    const name = formData.get('name') as string;
    
    if (!name) {
      return { error: 'Nome do contratante é obrigatório' };
    }

    await prisma.contratante.create({
      data: {
        ContratanteNome: name,
      },
    });

    revalidatePath('/contracts');
    return { success: true };
  } catch (error) {
    console.error('Error creating contract:', error);
    return { error: 'Failed to create contract' };
  }
}

export async function updateContract(id: number, formData: FormData) {
  try {
    const name = formData.get('name') as string;
    
    if (!name) {
      return { error: 'Nome do contratante é obrigatório' };
    }

    await prisma.contratante.update({
      where: { id },
      data: {
        ContratanteNome: name,
      },
    });

    revalidatePath('/contracts');
    return { success: true };
  } catch (error) {
    console.error('Error updating contract:', error);
    return { error: 'Failed to update contract' };
  }
}

export async function deleteContract(id: number) {
  try {
    await prisma.contratante.delete({
      where: { id },
    });

    revalidatePath('/contracts');
    return { success: true };
  } catch (error) {
    console.error('Error deleting contract:', error);
    return { error: 'Failed to delete contract. Verifique se existem fretes ou viagens associadas.' };
  }
}
