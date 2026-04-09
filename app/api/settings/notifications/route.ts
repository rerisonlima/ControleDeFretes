import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'notifications_enabled' }
    });
    
    return NextResponse.json({ enabled: setting ? setting.value === 'true' : true });
  } catch (error) {
    console.error('Failed to fetch notification settings (table might be missing):', error);
    return NextResponse.json({ enabled: true });
  }
}

export async function POST(req: Request) {
  try {
    const { enabled } = await req.json();
    
    try {
      await prisma.systemSetting.upsert({
        where: { key: 'notifications_enabled' },
        update: { value: String(enabled) },
        create: { key: 'notifications_enabled', value: String(enabled) }
      });
    } catch (dbError) {
      console.error('Failed to upsert setting, attempting to create table:', dbError);
      // Attempt to create table if it doesn't exist
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "SystemSetting" (
          "id" SERIAL PRIMARY KEY,
          "key" TEXT UNIQUE NOT NULL,
          "value" TEXT NOT NULL
        )
      `);
      // Retry upsert
      await prisma.systemSetting.upsert({
        where: { key: 'notifications_enabled' },
        update: { value: String(enabled) },
        create: { key: 'notifications_enabled', value: String(enabled) }
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update setting:', error);
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
  }
}
