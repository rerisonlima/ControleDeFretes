import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const body = await request.json();
    const categoria = await prisma.categoriaVeiculos.update({
      where: { id },
      data: {
        CategoriaNome: body.CategoriaNome,
      },
    });
    return NextResponse.json(categoria);
  } catch (error) {
    console.error('Failed to update categoria:', error);
    return NextResponse.json({ error: 'Failed to update categoria' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID de categoria inválido' }, { status: 400 });
    }

    // Check if category exists
    const category = await prisma.categoriaVeiculos.findUnique({
      where: { id }
    });

    if (!category) {
      return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
    }

    // Check if linked to any vehicle
    const vehicleWithCategory = await prisma.vehicle.findFirst({
      where: { categoriaId: id }
    });

    if (vehicleWithCategory) {
      return NextResponse.json({ 
        error: "Não é possível excluir esta categoria porque ela está vinculada a um ou mais veículos. Primeiro altere a categoria dos veículos." 
      }, { status: 400 });
    }

    // Check if linked to any frete (Tabela de Preços)
    const freteWithCategory = await prisma.frete.findFirst({
      where: { categoriaId: id }
    });

    if (freteWithCategory) {
      return NextResponse.json({ 
        error: "Não é possível excluir esta categoria porque ela está vinculada a um ou mais registros na Tabela de Preços (Fretes). Primeiro exclua ou altere esses registros." 
      }, { status: 400 });
    }

    // Check if linked to any trip via vehicle
    const tripWithVehicle = await prisma.trip.findFirst({
      where: {
        vehicle: {
          categoriaId: id
        }
      }
    });

    if (tripWithVehicle) {
      return NextResponse.json({ 
        error: "Não é possível excluir esta categoria porque existem viagens vinculadas a veículos desta categoria." 
      }, { status: 400 });
    }

    // Check if linked to any trip via frete
    const tripWithFrete = await prisma.trip.findFirst({
      where: {
        frete: {
          categoriaId: id
        }
      }
    });

    if (tripWithFrete) {
      return NextResponse.json({ 
        error: "Não é possível excluir esta categoria porque existem viagens vinculadas a registros da Tabela de Preços que usam esta categoria." 
      }, { status: 400 });
    }

    await prisma.categoriaVeiculos.delete({
      where: { id },
    });
    return NextResponse.json({ message: 'Categoria excluída com sucesso' });
  } catch (error: any) {
    console.error('Failed to delete categoria:', error);
    
    // P2003: Foreign key constraint failed
    if (error.code === 'P2003') {
      return NextResponse.json({ 
        error: "Não é possível excluir esta categoria porque ela está vinculada a outros registros (veículos, fretes ou viagens). Primeiro desvincule a categoria desses registros." 
      }, { status: 400 });
    }
    
    // P2025: Record to delete does not exist
    if (error.code === 'P2025') {
      return NextResponse.json({ 
        error: "Categoria não encontrada ou já excluída." 
      }, { status: 404 });
    }

    return NextResponse.json({ error: 'Erro interno ao excluir categoria' }, { status: 500 });
  }
}
