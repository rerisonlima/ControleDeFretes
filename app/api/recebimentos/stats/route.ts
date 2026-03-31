import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get('month');
  const yearParam = searchParams.get('year');
  
  let month = monthParam ? parseInt(monthParam) : parseInt(format(new Date(), 'M'));
  let year = yearParam ? parseInt(yearParam) : parseInt(format(new Date(), 'yyyy'));

  if (isNaN(month) || month < 1 || month > 12) month = parseInt(format(new Date(), 'M'));
  if (isNaN(year) || year < 2000 || year > 2100) year = parseInt(format(new Date(), 'yyyy'));

  const startDate = startOfMonth(new Date(year, month - 1));
  const endDate = endOfMonth(startDate);

  try {
    // Fetch all trips in the period
    const trips = await prisma.trip.findMany({
      where: {
        scheduledAt: { gte: startDate, lte: endDate }
      },
      include: {
        contratante: { select: { id: true, ContratanteNome: true } }
      }
    });

    const totalRevenue = trips.reduce((sum, t) => sum + (t.value || 0), 0);
    const received = trips
      .filter(t => t.paid?.toLowerCase() === 'sim' || t.paid?.toLowerCase() === 'pago')
      .reduce((sum, t) => sum + (t.value || 0), 0);
    const toReceive = totalRevenue - received;

    // Group by contractor
    const contractorStats = new Map<number, { name: string; total: number; received: number; toReceive: number; count: number }>();

    trips.forEach(t => {
      const cId = t.contratanteId || 0;
      const cName = t.contratante?.ContratanteNome || 'Sem Contratante';
      const isPaid = t.paid?.toLowerCase() === 'sim' || t.paid?.toLowerCase() === 'pago';
      
      if (!contractorStats.has(cId)) {
        contractorStats.set(cId, { name: cName, total: 0, received: 0, toReceive: 0, count: 0 });
      }
      
      const stats = contractorStats.get(cId)!;
      stats.total += (t.value || 0);
      stats.count += 1;
      if (isPaid) {
        stats.received += (t.value || 0);
      } else {
        stats.toReceive += (t.value || 0);
      }
    });

    const sortedContractors = Array.from(contractorStats.values()).sort((a, b) => b.total - a.total);

    // Chart data: Grouped by paymentDate
    // Only for paid trips
    const paidTrips = trips.filter(t => (t.paid?.toLowerCase() === 'sim' || t.paid?.toLowerCase() === 'pago') && t.paymentDate);
    
    // Group by date and contractor for tooltip
    const chartDataMap = new Map<string, { date: string; total: number; contractors: { name: string; value: number }[] }>();

    paidTrips.forEach(t => {
      const dateStr = format(new Date(t.paymentDate!), 'yyyy-MM-dd');
      if (!chartDataMap.has(dateStr)) {
        chartDataMap.set(dateStr, { date: dateStr, total: 0, contractors: [] });
      }
      const data = chartDataMap.get(dateStr)!;
      data.total += (t.value || 0);
      
      const cName = t.contratante?.ContratanteNome || 'Sem Contratante';
      const existingC = data.contractors.find(c => c.name === cName);
      if (existingC) {
        existingC.value += (t.value || 0);
      } else {
        data.contractors.push({ name: cName, value: (t.value || 0) });
      }
    });

    const chartData = Array.from(chartDataMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      totalRevenue,
      received,
      toReceive,
      totalTrips: trips.length,
      contractors: sortedContractors,
      chartData
    });

  } catch (error) {
    console.error('Recebimentos stats error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
