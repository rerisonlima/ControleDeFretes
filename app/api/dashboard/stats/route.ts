import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfMonth, endOfMonth, endOfWeek, eachWeekOfInterval, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
// No Prisma model imports needed as we use custom interface

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
    // Use a transaction for the dashboard queries to ensure they use the same connection
    // and respect the session settings (timeouts).
    const dashboardData = await prisma.$transaction(async (tx) => {
      // Increase statement timeout for the dashboard query session
      await tx.$executeRawUnsafe('SET statement_timeout = 60000;'); // 1 minute
      // Set a longer lock timeout to allow brief blocking from background maintenance
      await tx.$executeRawUnsafe('SET lock_timeout = 60000;'); // 60 seconds
      
      // Always fetch full month data to simplify logic and provide chart context
      const fullMonthStart = startOfMonth(new Date(year, month - 1));
      const fullMonthEnd = endOfMonth(fullMonthStart);

      // Fetch current month and previous month data in parallel
      const prevStartDate = startOfMonth(new Date(year, month - 2));
      const prevEndDate = endOfMonth(prevStartDate);

      // Helper to calculate total KM in a period
      const calculateTotalKm = async (start: Date, end: Date) => {
        const tripsInPeriod = await tx.trip.groupBy({
          by: ['vehicleId'],
          where: { scheduledAt: { gte: start, lte: end }, odometer: { not: null } },
          _max: { odometer: true },
          _min: { odometer: true }
        });

        let totalKm = 0;
        for (const group of tripsInPeriod) {
          const vehicleId = group.vehicleId;
          const maxOdo = group._max.odometer || 0;
          
          const lastTripBefore = await tx.trip.findFirst({
            where: { 
              vehicleId: vehicleId, 
              scheduledAt: { lt: start }, 
              odometer: { not: null } 
            },
            orderBy: { scheduledAt: 'desc' },
            select: { odometer: true }
          });

          if (lastTripBefore && lastTripBefore.odometer !== null) {
            totalKm += (maxOdo - lastTripBefore.odometer);
          } else {
            totalKm += (maxOdo - (group._min.odometer || 0));
          }
        }
        return totalKm;
      };

      const [
        revenueStats,
        expenseStats,
        revenueByContractor,
        expenseByType,
        prevRevenueStats,
        prevExpenseStats,
        recentTripsData,
        maintenanceData,
        weeklyStats,
        currentTotalKm,
        prevTotalKm
      ] = await Promise.all([
        // Current Month Total Revenue
        tx.trip.aggregate({
          where: { scheduledAt: { gte: startDate, lte: endDate } },
          _sum: { value: true },
          _count: { id: true }
        }),
        // Current Month Total Expenses
        tx.expense.aggregate({
          where: { date: { gte: startDate, lte: endDate } },
          _sum: { value: true }
        }),
        // Current Month Revenue by Contractor
        tx.trip.groupBy({
          by: ['contratanteId'],
          where: { scheduledAt: { gte: startDate, lte: endDate } },
          _sum: { value: true },
          _count: { id: true }
        }),
        // Current Month Expense by Type
        tx.expense.groupBy({
          by: ['type'],
          where: { date: { gte: startDate, lte: endDate } },
          _sum: { value: true }
        }),
        // Previous Month Total Revenue
        tx.trip.aggregate({
          where: { scheduledAt: { gte: prevStartDate, lte: prevEndDate } },
          _sum: { value: true }
        }),
        // Previous Month Total Expenses
        tx.expense.aggregate({
          where: { date: { gte: prevStartDate, lte: prevEndDate } },
          _sum: { value: true }
        }),
        // Recent Trips
        tx.trip.findMany({
          where: { scheduledAt: { gte: startDate, lte: endDate } },
          orderBy: { scheduledAt: 'desc' },
          take: 5,
          select: {
            id: true,
            value: true,
            status: true,
            contract: true,
            scheduledAt: true,
            routeId: true,
            vehicleId: true,
            route: { select: { destination: true } },
            frete: { select: { cidade: true } },
            contratante: { select: { ContratanteNome: true } },
            vehicle: { select: { plate: true } }
          }
        }),
        // Maintenance Data
        tx.maintenance.findMany({
          where: { 
            executionDate: null,
            vehicle: {
              status: 'ACTIVE'
            }
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
        // Weekly Stats for Chart
        Promise.all(eachWeekOfInterval({ start: fullMonthStart, end: fullMonthEnd }).map(async (weekStart) => {
          const weekEnd = endOfWeek(weekStart);
          const [rev, exp] = await Promise.all([
            tx.trip.aggregate({
              where: { scheduledAt: { gte: weekStart, lte: weekEnd } },
              _sum: { value: true }
            }),
            tx.expense.aggregate({
              where: { date: { gte: weekStart, lte: weekEnd } },
              _sum: { value: true }
            })
          ]);
          return {
            revenue: rev._sum.value || 0,
            expenses: exp._sum.value || 0
          };
        })),
        // Current Total KM
        calculateTotalKm(startDate, endDate),
        // Previous Total KM
        calculateTotalKm(prevStartDate, prevEndDate)
      ]);

      return {
        revenueStats,
        expenseStats,
        revenueByContractor,
        expenseByType,
        prevRevenueStats,
        prevExpenseStats,
        recentTripsData,
        maintenanceData,
        weeklyStats,
        currentTotalKm,
        prevTotalKm,
        fullMonthStart,
        fullMonthEnd
      };
    }, {
      timeout: 120000 // 2 minutes for the whole transaction
    });

    const {
      revenueStats,
      expenseStats,
      revenueByContractor,
      expenseByType,
      prevRevenueStats,
      prevExpenseStats,
      recentTripsData,
      maintenanceData,
      weeklyStats,
      currentTotalKm,
      prevTotalKm,
      fullMonthStart,
      fullMonthEnd
    } = dashboardData;

    // Fetch contractor names for the breakdown
    const contractorIds = revenueByContractor.map(r => r.contratanteId).filter((id): id is number => id !== null);
    const contractors = await prisma.contratante.findMany({
      where: { id: { in: contractorIds } },
      select: { id: true, ContratanteNome: true }
    });
    const contractorMap = new Map(contractors.map(c => [c.id, c.ContratanteNome]));

    interface VehicleMaintenanceGroup {
      name: string;
      latestTripOdo: number;
      maintenances: {
        type: string;
        value: string;
        remainingKms: number;
        overdueKms: number;
        percentage: string;
        isOverdue: boolean;
      }[];
    }

    const maintenanceByVehicle = new Map<string, VehicleMaintenanceGroup>();
    
    maintenanceData.forEach(m => {
      const vehicleKey = `${m.vehicle.model} (${m.vehicle.plate})`;
      if (!maintenanceByVehicle.has(vehicleKey)) {
        const latestTripOdo = m.vehicle.trips[0]?.odometer || m.vehicle.currentOdometer || 0;
        maintenanceByVehicle.set(vehicleKey, {
          name: vehicleKey,
          latestTripOdo,
          maintenances: []
        });
      }
      
      const vehicleData = maintenanceByVehicle.get(vehicleKey)!;
      const registeredOdo = m.currentOdometer || 0;
      const interval = m.odometer; // Kilometragem p/ Manutenção
      
      const diff = vehicleData.latestTripOdo - registeredOdo;
      const remaining = interval - diff;
      
      let statusMsg = '';
      let isOverdue = false;
      if (diff > interval) {
        isOverdue = true;
        statusMsg = `Kilometragem já foi ultrapassada em ${(diff - interval).toLocaleString('pt-BR')} km`;
      } else {
        statusMsg = `Faltam ${remaining.toLocaleString('pt-BR')} kilometros`;
      }
      
      vehicleData.maintenances.push({
        type: m.type,
        value: statusMsg,
        remainingKms: isOverdue ? 0 : remaining,
        overdueKms: isOverdue ? (diff - interval) : 0,
        percentage: isOverdue ? '100%' : `${Math.max(0, Math.min(100, (diff / interval) * 100)).toFixed(1)}%`,
        isOverdue
      });
    });

    const maintenanceBreakdown = Array.from(maintenanceByVehicle.values()).map(v => ({
      name: v.name,
      maintenances: v.maintenances
    }));

    const totalRevenue = revenueStats._sum.value || 0;
    const totalExpenses = expenseStats._sum.value || 0;
    const totalTripsCount = revenueStats._count.id || 0;
    const profit = totalRevenue - totalExpenses;

    const prevRevenue = prevRevenueStats._sum.value || 0;
    const prevExpensesVal = prevExpenseStats._sum.value || 0;
    const prevProfit = prevRevenue - prevExpensesVal;

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? '+100%' : '0%';
      const change = ((current - previous) / previous) * 100;
      return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
    };

    // Calculate Custo Variável KM Rodado
    const currentCostPerKm = currentTotalKm > 0 ? totalExpenses / currentTotalKm : 0;
    const prevCostPerKm = prevTotalKm > 0 ? prevExpensesVal / prevTotalKm : 0;
    
    const costPerKmChange = calculateChange(currentCostPerKm, prevCostPerKm);
    const costPerKmTrend = currentCostPerKm <= prevCostPerKm ? 'down' : 'up';

    // Calculate Receita Variável KM Rodado (Profit per KM)
    const currentProfitPerKm = currentTotalKm > 0 ? profit / currentTotalKm : 0;
    const prevProfitPerKm = prevTotalKm > 0 ? prevProfit / prevTotalKm : 0;
    const profitPerKmChange = calculateChange(currentProfitPerKm, prevProfitPerKm);
    const profitPerKmTrend = currentProfitPerKm >= prevProfitPerKm ? 'up' : 'down';

    const revenueBreakdown = revenueByContractor
      .map(r => ({
        name: r.contratanteId ? contractorMap.get(r.contratanteId) || 'Desconhecido' : 'Sem Contratante',
        value: `${r._count.id} viagens - ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(r._sum.value || 0)}`,
        percentage: totalRevenue > 0 ? (((r._sum.value || 0) / totalRevenue) * 100).toFixed(1) + '%' : '0%',
        rawVal: r._sum.value || 0,
        rawCount: r._count.id
      }))
      .sort((a, b) => b.rawCount - a.rawCount);

    const expenseBreakdown = expenseByType
      .map(e => ({
        name: e.type,
        value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(e._sum.value || 0),
        percentage: totalExpenses > 0 ? (((e._sum.value || 0) / totalExpenses) * 100).toFixed(1) + '%' : '0%',
        rawVal: e._sum.value || 0
      }))
      .sort((a, b) => b.rawVal - a.rawVal);

    // Chart data (weekly)
    const chartWeeks = eachWeekOfInterval({ 
      start: fullMonthStart, 
      end: fullMonthEnd 
    });

    const finalChartData = chartWeeks.map((weekStart, index) => ({
      name: `Semana ${index + 1}`,
      revenue: weeklyStats[index].revenue,
      expenses: weeklyStats[index].expenses,
    }));

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
      recentTrips: recentTripsData.map(t => ({
        route: t.frete?.cidade || t.route?.destination || 'Rota ' + t.routeId,
        plate: t.vehicle?.plate || 'Veículo ' + t.vehicleId,
        id: t.id,
        value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.value),
        status: t.status,
        contract: t.contratante?.ContratanteNome || t.contract || '-',
        date: format(t.scheduledAt, "dd MMM, HH:mm", { locale: ptBR })
      }))
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
