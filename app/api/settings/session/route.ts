import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'session_expiration_hours' }
    });
    
    // Default to 24 hours if not set
    return NextResponse.json({ hours: setting ? parseInt(setting.value) : 24 });
  } catch (error) {
    console.error('Failed to fetch session settings:', error);
    return NextResponse.json({ hours: 24 });
  }
}

export async function POST(req: Request) {
  try {
    const { hours } = await req.json();
    
    if (isNaN(hours) || hours < 1) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
    }

    await prisma.systemSetting.upsert({
      where: { key: 'session_expiration_hours' },
      update: { value: String(hours) },
      create: { key: 'session_expiration_hours', value: String(hours) }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update session setting:', error);
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
  }
}
