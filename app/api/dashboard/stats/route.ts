import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfMonth, endOfMonth, endOfWeek, eachWeekOfInterval, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
// No Prisma model imports needed as we use custom interface

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const monthParam = searchParams.get('month');
  const yearParam = searchParams.get('year');
  
  let month = monthParam ? parseInt(monthParam) : parseInt(format(new Date(), 'M'));
  let year = yearParam ? parseInt(yearParam) : parseInt(format(new Date(), 'yyyy'));

  // Validate month and year
  if (isNaN(month) || month < 1 || month > 12) {
    month = parseInt(format(new Date(), 'M'));
  }
  if (isNaN(year) || year < 2000 || year > 2100) {
    year = parseInt(format(new Date(), 'yyyy'));
  }
  const weekIndex = searchParams.get('week');

  let startDate = startOfMonth(new Date(year, month - 1));
  let endDate = endOfMonth(startDate);

  // If a specific week is selected, adjust the date range
  if (weekIndex && weekIndex !== 'all') {
    const weeks = eachWeekOfInterval({ start: startDate, end: endDate });
    const selectedWeekStart = weeks[parseInt(weekIndex) - 1];
    if (selectedWeekStart) {
      startDate = selectedWeekStart;
      endDate = endOfWeek(startDate);
    }
  }

  try {
    // Fix corrupted FLOAT8 data if it exists
    try {
      await prisma.$executeRawUnsafe('UPDATE "Trip" SET odometer = 0 WHERE odometer < 1 AND odometer > 0');
    } catch (e) {
      console.error('Data fix failed:', e);
    }

    const fullMonthStart = startOfMonth(new Date(year, month - 1));
    const fullMonthEnd = endOfMonth(fullMonthStart);
    const prevStartDate = startOfMonth(new Date(year, month - 2));
    const prevEndDate = endOfMonth(prevStartDate);

    // Fetch everything in parallel with fewer queries
    const [
      currentMonthTrips,
      currentMonthExpenses,
      prevMonthTrips,
      prevMonthExpenses,
      maintenanceData,
      contractors
    ] = await Promise.all([
      prisma.trip.findMany({
        where: { scheduledAt: { gte: fullMonthStart, lte: fullMonthEnd } },
        include: { 
          route: { select: { destination: true } },
          frete: { select: { cidade: true } },
          contratante: { select: { ContratanteNome: true } },
          vehicle: { select: { plate: true } }
        }
      }),
      prisma.expense.findMany({
        where: { date: { gte: fullMonthStart, lte: fullMonthEnd } }
      }),
      prisma.trip.findMany({
        where: { scheduledAt: { gte: prevStartDate, lte: prevEndDate } },
        select: { value: true, vehicleId: true, odometer: true, scheduledAt: true }
      }),
      prisma.expense.findMany({
        where: { date: { gte: prevStartDate, lte: prevEndDate } },
        select: { value: true, reimbursable: true }
      }),
      prisma.maintenance.findMany({
        where: { 
          executionDate: null,
          vehicle: { status: 'ACTIVE' }
        },
        include: {
          vehicle: {
            include: {
              trips: {
                orderBy: { scheduledAt: 'desc' },
                take: 1,
                select: { odometer: true }
              }
            }
          }
        }
      }),
      prisma.contratante.findMany({
        select: { id: true, ContratanteNome: true }
      })
    ]);

    const contractorMap = new Map(contractors.map((c: any) => [c.id, c.ContratanteNome]));

    // Filter for the specific range (if week is selected)
    const filteredTrips = currentMonthTrips.filter(t => t.scheduledAt >= startDate && t.scheduledAt <= endDate);
    const filteredExpenses = currentMonthExpenses.filter(e => e.date >= startDate && e.date <= endDate);

    // Calculate Totals
    const totalReimbursement = filteredExpenses
      .filter(e => e.reimbursable)
      .reduce((sum, e) => sum + (e.value || 0), 0);
    
    const totalRevenue = filteredTrips.reduce((sum, t) => sum + (t.value || 0), 0) + totalReimbursement;
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (e.value || 0), 0);
    const totalTripsCount = filteredTrips.length;
    const profit = totalRevenue - totalExpenses;

    const prevReimbursement = prevMonthExpenses
      .filter(e => e.reimbursable)
      .reduce((sum, e) => sum + (e.value || 0), 0);
    const prevRevenue = prevMonthTrips.reduce((sum, t) => sum + (t.value || 0), 0) + prevReimbursement;
    const prevExpensesVal = prevMonthExpenses.reduce((sum, e) => sum + (e.value || 0), 0);
    const prevProfit = prevRevenue - prevExpensesVal;

    // Revenue by Contractor
    const revenueByContractorMap = new Map<number | null, { sum: number, count: number }>();
    filteredTrips.forEach(t => {
      const current = revenueByContractorMap.get(t.contratanteId) || { sum: 0, count: 0 };
      revenueByContractorMap.set(t.contratanteId, { 
        sum: current.sum + (t.value || 0), 
        count: current.count + 1 
      });
    });

    const revenueBreakdown = Array.from(revenueByContractorMap.entries())
      .map(([id, stats]) => ({
        name: id ? contractorMap.get(id) || 'Desconhecido' : 'Sem Contratante',
        value: `${stats.count} viagens - ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.sum)}`,
        percentage: totalRevenue > 0 ? ((stats.sum / totalRevenue) * 100).toFixed(1) + '%' : '0%',
        rawVal: stats.sum,
        rawCount: stats.count
      }))
      .sort((a, b) => b.rawCount - a.rawCount);

    // Add Reimbursement to breakdown
    if (totalReimbursement > 0) {
      revenueBreakdown.push({
        name: 'Reembolso',
        value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalReimbursement),
        percentage: totalRevenue > 0 ? ((totalReimbursement / totalRevenue) * 100).toFixed(1) + '%' : '0%',
        rawVal: totalReimbursement,
        rawCount: 0
      });
    }

    // Expense by Type
    const expenseByTypeMap = new Map<string, number>();
    filteredExpenses.forEach(e => {
      const current = expenseByTypeMap.get(e.type) || 0;
      expenseByTypeMap.set(e.type, current + (e.value || 0));
    });

    const expenseBreakdown = Array.from(expenseByTypeMap.entries())
      .map(([type, sum]) => ({
        name: type,
        value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(sum),
        percentage: totalExpenses > 0 ? ((sum / totalExpenses) * 100).toFixed(1) + '%' : '0%',
        rawVal: sum
      }))
      .sort((a, b) => b.rawVal - a.rawVal);

    // Weekly Stats for Chart
    const weeks = eachWeekOfInterval({ start: fullMonthStart, end: fullMonthEnd });
    const finalChartData = weeks.map((weekStart, index) => {
      const weekEnd = endOfWeek(weekStart);
      const revenue = currentMonthTrips
        .filter(t => t.scheduledAt >= weekStart && t.scheduledAt <= weekEnd)
        .reduce((sum, t) => sum + (t.value || 0), 0);
      const expenses = currentMonthExpenses
        .filter(e => e.date >= weekStart && e.date <= weekEnd)
        .reduce((sum, e) => sum + (e.value || 0), 0);
      return { name: `Semana ${index + 1}`, revenue, expenses };
    });

    // Calculate Total KM (Simplified logic for performance)
    const calculateKmInMemory = (trips: any[]) => {
      const vehicleKm = new Map<number, { min: number, max: number }>();
      trips.forEach(t => {
        if (t.odometer === null || t.odometer === undefined) return;
        const odo = typeof t.odometer === 'string' ? parseInt(t.odometer) : t.odometer;
        if (isNaN(odo)) return;
        
        const current = vehicleKm.get(t.vehicleId) || { min: odo, max: odo };
        vehicleKm.set(t.vehicleId, {
          min: Math.min(current.min, odo),
          max: Math.max(current.max, odo)
        });
      });
      
      let total = 0;
      vehicleKm.forEach(v => {
        total += (v.max - v.min);
      });
      return total;
    };

    const currentTotalKm = calculateKmInMemory(filteredTrips);
    const prevTotalKm = calculateKmInMemory(prevMonthTrips);

    // Maintenance Breakdown
    const maintenanceByVehicle = new Map<string, any>();
    maintenanceData.forEach((m: any) => {
      const vehicleKey = `${m.vehicle.model} (${m.vehicle.plate})`;
      if (!maintenanceByVehicle.has(vehicleKey)) {
        const latestTripOdoStr = m.vehicle.trips[0]?.odometer || m.vehicle.currentOdometer || '0';
        const latestTripOdo = parseInt(latestTripOdoStr.toString());
        maintenanceByVehicle.set(vehicleKey, { name: vehicleKey, latestTripOdo, maintenances: [] });
      }
      
      const vehicleData = maintenanceByVehicle.get(vehicleKey)!;
      const registeredOdo = parseInt((m.currentOdometer || '0').toString());
      const interval = parseInt((m.odometer || '0').toString());
      const diff = vehicleData.latestTripOdo - registeredOdo;
      const remaining = interval - diff;
      const isOverdue = diff > interval;
      
      vehicleData.maintenances.push({
        type: m.type,
        value: isOverdue ? `Ultrapassada em ${(diff - interval).toLocaleString('pt-BR')} km` : `Faltam ${remaining.toLocaleString('pt-BR')} km`,
        remainingKms: isOverdue ? 0 : remaining,
        overdueKms: isOverdue ? (diff - interval) : 0,
        percentage: isOverdue ? '100%' : `${Math.max(0, Math.min(100, (diff / interval) * 100)).toFixed(1)}%`,
        isOverdue
      });
    });

    const maintenanceBreakdown = Array.from(maintenanceByVehicle.values());

    // Recent Trips
    const recentTrips = [...filteredTrips]
      .sort((a, b) => b.scheduledAt.getTime() - a.scheduledAt.getTime())
      .slice(0, 5)
      .map(t => ({
        route: t.frete?.cidade || t.route?.destination || 'Rota ' + t.routeId,
        plate: t.vehicle?.plate || 'Veículo ' + t.vehicleId,
        id: t.id,
        value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.value),
        status: t.status,
        romaneio: t.romaneio,
        contract: t.contratante?.ContratanteNome || t.contract || '-',
        date: format(t.scheduledAt, "dd MMM, HH:mm", { locale: ptBR })
      }));

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? '+100%' : '0%';
      const change = ((current - previous) / previous) * 100;
      return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
    };

    const currentCostPerKm = currentTotalKm > 0 ? totalExpenses / currentTotalKm : 0;
    const prevCostPerKm = prevTotalKm > 0 ? prevExpensesVal / prevTotalKm : 0;
    const currentProfitPerKm = currentTotalKm > 0 ? profit / currentTotalKm : 0;
    const prevProfitPerKm = prevTotalKm > 0 ? prevProfit / prevTotalKm : 0;

    const costPerKmChange = calculateChange(currentCostPerKm, prevCostPerKm);
    const costPerKmTrend = currentCostPerKm <= prevCostPerKm ? 'down' : 'up';
    const profitPerKmChange = calculateChange(currentProfitPerKm, prevProfitPerKm);
    const profitPerKmTrend = currentProfitPerKm >= prevProfitPerKm ? 'up' : 'down';

    const calculatePercentage = (value: number) => {
      if (totalRevenue === 0) return '0%';
      const percentage = (value / totalRevenue) * 100;
      return `${percentage.toFixed(1)}%`;
    };

    return NextResponse.json({
      stats: [
        { 
          label: 'RECEITA TOTAL', 
          value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue), 
          change: calculateChange(totalRevenue, prevRevenue), 
          trend: totalRevenue >= prevRevenue ? 'up' : 'down',
          icon: 'DollarSign',
          color: 'text-primary',
          percentage: null,
          breakdown: revenueBreakdown,
          totalTrips: totalTripsCount,
          totalKm: currentTotalKm
        },
        { 
          label: 'DESPESAS TOTAIS', 
          value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpenses), 
          change: calculateChange(totalExpenses, prevExpensesVal), 
          trend: totalExpenses <= prevExpensesVal ? 'down' : 'up',
          icon: 'Receipt',
          color: 'text-rose-500',
          percentage: calculatePercentage(totalExpenses),
          breakdown: expenseBreakdown,
          costPerKm: {
            value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentCostPerKm),
            change: costPerKmChange,
            trend: costPerKmTrend
          }
        },
        { 
          label: 'LUCRO FINAL', 
          value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(profit), 
          change: calculateChange(profit, prevProfit), 
          trend: profit >= prevProfit ? 'up' : 'down',
          icon: 'Wallet',
          color: 'text-emerald-500',
          percentage: calculatePercentage(profit),
          profitPerKm: {
            value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(currentProfitPerKm),
            change: profitPerKmChange,
            trend: profitPerKmTrend
          }
        },
        { 
          label: 'PRÓXIMAS MANUTENÇÕES', 
          value: `${maintenanceData.length} Programadas`, 
          change: '', 
          trend: 'down',
          icon: 'Wrench',
          color: 'text-amber-500',
          percentage: null,
          breakdown: maintenanceBreakdown
        },
      ],
      chart: finalChartData,
      recentTrips: recentTrips
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      // @ts-expect-error - Prisma error details
      if (error.code) console.error('Prisma Error Code:', error.code);
      // @ts-expect-error - Prisma error details
      if (error.meta) console.error('Prisma Error Meta:', JSON.stringify(error.meta, null, 2));
    }
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
