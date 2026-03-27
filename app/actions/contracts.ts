'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getContracts(includeInactive = false) {
  try {
    const contracts = await prisma.contratante.findMany({
      where: includeInactive ? {} : { active: true },
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
    const name = formData.get('ContratanteNome') as string;
    
    if (!name) {
      return { error: 'Nome do contratante é obrigatório' };
    }

    await prisma.contratante.create({
      data: {
        ContratanteNome: name,
        active: true
      },
    });

    revalidatePath('/contracts');
    revalidatePath('/routes');
    revalidatePath('/expenses');
    return { success: true };
  } catch (error) {
    console.error('Error creating contract:', error);
    return { error: 'Failed to create contract' };
  }
}

export async function updateContract(id: number, formData: FormData) {
  try {
    const name = formData.get('ContratanteNome') as string;
    const active = formData.get('active') === 'on';
    
    if (!name) {
      return { error: 'Nome do contratante é obrigatório' };
    }

    await prisma.contratante.update({
      where: { id },
      data: {
        ContratanteNome: name,
        active
      },
    });

    revalidatePath('/contracts');
    revalidatePath('/routes');
    revalidatePath('/expenses');
    return { success: true };
  } catch (error) {
    console.error(`Error updating contract with ID ${id}:`, error);
    // @ts-expect-error - Prisma error code
    if (error.code === 'P2025') {
      return { error: 'Contrato não encontrado' };
    }
    return { error: 'Failed to update contract' };
  }
}

export async function toggleContractStatus(id: number) {
  try {
    const contract = await prisma.contratante.findUnique({ where: { id } });
    if (!contract) return { error: 'Contrato não encontrado' };

    await prisma.contratante.update({
      where: { id },
      data: { active: !contract.active }
    });

    revalidatePath('/contracts');
    revalidatePath('/routes');
    revalidatePath('/expenses');
    return { success: true };
  } catch (error) {
    console.error(`Error toggling contract status with ID ${id}:`, error);
    // @ts-expect-error - Prisma error code
    if (error.code === 'P2025') {
      return { error: 'Contrato não encontrado' };
    }
    return { error: 'Erro ao alterar status do contrato' };
  }
}

export async function deleteContract(id: number) {
  return { error: 'Exclusão desabilitada. Por favor, desative o contrato em vez de excluir.' };
}
