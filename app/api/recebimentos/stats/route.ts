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
          OR: [
            { scheduledAt: { gte: startDate, lte: endDate } },
            { paymentDate: { gte: startDate, lte: endDate } }
          ]
        },
        include: {
          contratante: { select: { id: true, ContratanteNome: true } }
        }
      }),
      prisma.expense.findMany({
        where: {
          OR: [
            { date: { gte: startDate, lte: endDate } },
            { reimbursementDate: { gte: startDate, lte: endDate } }
          ],
          reimbursable: true
        }
      })
    ]);

    const totalTripRevenue = trips
      .filter(t => t.scheduledAt >= startDate && t.scheduledAt <= endDate)
      .reduce((sum, t) => sum + (t.value || 0), 0);
    
    const totalReimbursement = reimbursableExpenses
      .filter(e => e.date >= startDate && e.date <= endDate)
      .reduce((sum, e) => sum + (e.value || 0), 0);
    
    const totalRevenue = totalTripRevenue + totalReimbursement;

    const receivedTrips = trips
      .filter(t => {
        const isPaid = t.paid?.toLowerCase() === 'sim' || t.paid?.toLowerCase() === 'pago';
        // Logic: Scheduled in month AND is paid (regardless of payment date)
        return t.scheduledAt >= startDate && t.scheduledAt <= endDate && isPaid;
      })
      .reduce((sum, t) => sum + (t.value || 0), 0);
    
    const receivedReimbursement = reimbursableExpenses
      .filter(e => {
        // Logic: Scheduled in month AND is paid
        return e.date >= startDate && e.date <= endDate && e.status === 'PAID';
      })
      .reduce((sum, e) => sum + (e.value || 0), 0);
    
    const received = receivedTrips + receivedReimbursement;
    
    // toReceive is the complement of received for the trips scheduled in the month
    const toReceive = Math.max(0, totalRevenue - received);

    // Group by contractor (based on scheduled revenue)
    const contractorStats = new Map<number, { name: string; total: number; received: number; toReceive: number; count: number }>();

    trips
      .filter(t => t.scheduledAt >= startDate && t.scheduledAt <= endDate)
      .forEach(t => {
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

    // Chart data: Grouped by paymentDate (only for payments in the selected month)
    const chartDataMap = new Map<string, { date: string; total: number; contractors: { name: string; value: number }[] }>();

    trips.forEach(t => {
      const isPaid = t.paid?.toLowerCase() === 'sim' || t.paid?.toLowerCase() === 'pago';
      if (!isPaid || !t.paymentDate) return;
      
      const pDate = t.paymentDate instanceof Date ? t.paymentDate : new Date(t.paymentDate);
      if (pDate < startDate || pDate > endDate) return;

      const dateStr = pDate.toISOString().split('T')[0];
      
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

    reimbursableExpenses.forEach(e => {
      if (e.status !== 'PAID' || !e.reimbursementDate) return;
      
      const rDate = e.reimbursementDate instanceof Date ? e.reimbursementDate : new Date(e.reimbursementDate);
      if (rDate < startDate || rDate > endDate) return;

      const dateStr = rDate.toISOString().split('T')[0];
        
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
      totalTrips: trips.filter(t => t.scheduledAt >= startDate && t.scheduledAt <= endDate).length,
      contractors: sortedContractors,
      chartData
    });

  } catch (error) {
    console.error('Recebimentos stats error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
