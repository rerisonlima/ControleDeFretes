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
    // Fetch all trips and reimbursable expenses in the period
    const [trips, reimbursableExpenses] = await Promise.all([
      prisma.trip.findMany({
        where: {
          scheduledAt: { gte: startDate, lte: endDate }
        },
        include: {
          contratante: { select: { id: true, ContratanteNome: true } }
        }
      }),
      prisma.expense.findMany({
        where: {
          date: { gte: startDate, lte: endDate },
          reimbursable: true
        }
      })
    ]);

    const totalTripRevenue = trips.reduce((sum, t) => sum + (t.value || 0), 0);
    const totalReimbursement = reimbursableExpenses.reduce((sum, e) => sum + (e.value || 0), 0);
    const totalRevenue = totalTripRevenue + totalReimbursement;

    const receivedTrips = trips
      .filter(t => t.paid?.toLowerCase() === 'sim' || t.paid?.toLowerCase() === 'pago')
      .reduce((sum, t) => sum + (t.value || 0), 0);
    
    const receivedReimbursement = reimbursableExpenses
      .filter(e => e.status === 'PAID')
      .reduce((sum, e) => sum + (e.value || 0), 0);
    
    const received = receivedTrips + receivedReimbursement;
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

    // Add Reimbursement as a virtual contractor or handle it in stats
    if (totalReimbursement > 0) {
      contractorStats.set(-1, {
        name: 'Reembolso',
        total: totalReimbursement,
        received: receivedReimbursement,
        toReceive: totalReimbursement - receivedReimbursement,
        count: reimbursableExpenses.length
      });
    }

    const sortedContractors = Array.from(contractorStats.values()).sort((a, b) => b.total - a.total);

    // Chart data: Grouped by paymentDate
    // Only for paid trips and paid reimbursements
    const paidTrips = trips.filter(t => (t.paid?.toLowerCase() === 'sim' || t.paid?.toLowerCase() === 'pago') && t.paymentDate);
    const paidReimbursements = reimbursableExpenses.filter(e => e.status === 'PAID' && e.reimbursementDate);
    
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

    paidReimbursements.forEach(e => {
      const dateStr = format(new Date(e.reimbursementDate!), 'yyyy-MM-dd');
      if (!chartDataMap.has(dateStr)) {
        chartDataMap.set(dateStr, { date: dateStr, total: 0, contractors: [] });
      }
      const data = chartDataMap.get(dateStr)!;
      data.total += (e.value || 0);
      
      const cName = 'Reembolso';
      const existingC = data.contractors.find(c => c.name === cName);
      if (existingC) {
        existingC.value += (e.value || 0);
      } else {
        data.contractors.push({ name: cName, value: (e.value || 0) });
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
