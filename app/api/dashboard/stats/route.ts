import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfMonth, endOfMonth, endOfWeek, eachWeekOfInterval, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
// No Prisma model imports needed as we use custom interface

interface MonFriStats {
  total: number | null;
  driver: number | null;
  helper: number | null;
}

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
    // Increase statement timeout for the dashboard query session
    await prisma.$executeRawUnsafe('SET statement_timeout = 120000;'); // 2 minutes
    
    // Always fetch full month data to simplify logic and provide chart context
    const fullMonthStart = startOfMonth(new Date(year, month - 1));
    const fullMonthEnd = endOfMonth(fullMonthStart);

    // Fetch current month and previous month data in parallel
    const prevStartDate = startOfMonth(new Date(year, month - 2));
    const prevEndDate = endOfMonth(prevStartDate);

    const [
      revenueStats,
      expenseStats,
      revenueByContractor,
      expenseByType,
      monFriStats,
      prevRevenueStats,
      prevExpenseStats,
      prevMonFriStats,
      recentTripsData
    ] = await Promise.all([
      // Current Month Total Revenue
      prisma.trip.aggregate({
        where: { scheduledAt: { gte: startDate, lte: endDate } },
        _sum: { value: true },
        _count: { id: true }
      }),
      // Current Month Total Expenses
      prisma.expense.aggregate({
        where: { date: { gte: startDate, lte: endDate } },
        _sum: { value: true }
      }),
      // Current Month Revenue by Contractor
      prisma.trip.groupBy({
        by: ['contratanteId'],
        where: { scheduledAt: { gte: startDate, lte: endDate } },
        _sum: { value: true },
        _count: { id: true }
      }),
      // Current Month Expense by Type
      prisma.expense.groupBy({
        by: ['type'],
        where: { date: { gte: startDate, lte: endDate } },
        _sum: { value: true }
      }),
      // Current Month Mon-Fri Stats (Raw query for day of week)
      prisma.$queryRaw<MonFriStats[]>`
        SELECT 
          SUM(value) as total,
          SUM(CASE WHEN type = 'Pagamento Motorista' THEN value ELSE 0 END) as driver,
          SUM(CASE WHEN type = 'Pagamento Ajudante' THEN value ELSE 0 END) as helper
        FROM "Expense"
        WHERE date >= ${startDate} AND date <= ${endDate}
        AND EXTRACT(DOW FROM date) BETWEEN 1 AND 5
      `,
      // Previous Month Total Revenue
      prisma.trip.aggregate({
        where: { scheduledAt: { gte: prevStartDate, lte: prevEndDate } },
        _sum: { value: true }
      }),
      // Previous Month Total Expenses
      prisma.expense.aggregate({
        where: { date: { gte: prevStartDate, lte: prevEndDate } },
        _sum: { value: true }
      }),
      // Previous Month Mon-Fri Stats
      prisma.$queryRaw<MonFriStats[]>`
        SELECT 
          SUM(value) as total,
          SUM(CASE WHEN type = 'Pagamento Motorista' THEN value ELSE 0 END) as driver,
          SUM(CASE WHEN type = 'Pagamento Ajudante' THEN value ELSE 0 END) as helper
        FROM "Expense"
        WHERE date >= ${prevStartDate} AND date <= ${prevEndDate}
        AND EXTRACT(DOW FROM date) BETWEEN 1 AND 5
      `,
      // Recent Trips
      prisma.trip.findMany({
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
      })
    ]);

    // Fetch contractor names for the breakdown
    const contractorIds = revenueByContractor.map(r => r.contratanteId).filter((id): id is number => id !== null);
    const contractors = await prisma.contratante.findMany({
      where: { id: { in: contractorIds } },
      select: { id: true, ContratanteNome: true }
    });
    const contractorMap = new Map(contractors.map(c => [c.id, c.ContratanteNome]));

    const totalRevenue = revenueStats._sum.value || 0;
    const totalExpenses = expenseStats._sum.value || 0;
    const totalTripsCount = revenueStats._count.id || 0;

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

    const monFriExpenses = Number(monFriStats[0]?.total || 0);
    const monFriDriverPayment = Number(monFriStats[0]?.driver || 0);
    const monFriHelperPayment = Number(monFriStats[0]?.helper || 0);

    const profit = totalRevenue - totalExpenses;

    const prevRevenue = prevRevenueStats._sum.value || 0;
    const prevExpensesVal = prevExpenseStats._sum.value || 0;
    const prevProfit = prevRevenue - prevExpensesVal;

    const prevMonFriExpenses = Number(prevMonFriStats[0]?.total || 0);
    const prevMonFriDriver = Number(prevMonFriStats[0]?.driver || 0);
    const prevMonFriHelper = Number(prevMonFriStats[0]?.helper || 0);

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? '+100%' : '0%';
      const change = ((current - previous) / previous) * 100;
      return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
    };

    // Chart data (weekly) - We still need some weekly data. 
    // Let's fetch weekly aggregations.
    const chartWeeks = eachWeekOfInterval({ 
      start: fullMonthStart, 
      end: fullMonthEnd 
    });

    const weeklyStats = await Promise.all(chartWeeks.map(async (weekStart) => {
      const weekEnd = endOfWeek(weekStart);
      const [rev, exp] = await Promise.all([
        prisma.trip.aggregate({
          where: { scheduledAt: { gte: weekStart, lte: weekEnd } },
          _sum: { value: true }
        }),
        prisma.expense.aggregate({
          where: { date: { gte: weekStart, lte: weekEnd } },
          _sum: { value: true }
        })
      ]);
      return {
        revenue: rev._sum.value || 0,
        expenses: exp._sum.value || 0
      };
    }));

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
          totalTrips: totalTripsCount
        },
        { 
          label: 'DESPESAS TOTAIS', 
          value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpenses), 
          change: calculateChange(totalExpenses, prevExpensesVal), 
          trend: totalExpenses <= prevExpensesVal ? 'down' : 'up',
          icon: 'Receipt',
          color: 'text-rose-500',
          percentage: calculatePercentage(totalExpenses),
          breakdown: expenseBreakdown
        },
        { 
          label: 'LUCRO FINAL', 
          value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(profit), 
          change: calculateChange(profit, prevProfit), 
          trend: profit >= prevProfit ? 'up' : 'down',
          icon: 'Wallet',
          color: 'text-emerald-500',
          percentage: calculatePercentage(profit)
        },
        { 
          label: 'DESPESAS (SEG-SEX)', 
          value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monFriExpenses), 
          change: calculateChange(monFriExpenses, prevMonFriExpenses), 
          trend: monFriExpenses <= prevMonFriExpenses ? 'down' : 'up',
          icon: 'Receipt',
          color: 'text-amber-500',
          percentage: calculatePercentage(monFriExpenses)
        },
        { 
          label: 'PAGAMENTO MOTORISTA (SEG-SEX)', 
          value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monFriDriverPayment), 
          change: calculateChange(monFriDriverPayment, prevMonFriDriver), 
          trend: monFriDriverPayment >= prevMonFriDriver ? 'up' : 'down',
          icon: 'Truck',
          color: 'text-blue-500',
          percentage: calculatePercentage(monFriDriverPayment)
        },
        { 
          label: 'PAGAMENTO AJUDANTE (SEG-SEX)', 
          value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monFriHelperPayment), 
          change: calculateChange(monFriHelperPayment, prevMonFriHelper), 
          trend: monFriHelperPayment >= prevMonFriHelper ? 'up' : 'down',
          icon: 'User',
          color: 'text-indigo-500',
          percentage: calculatePercentage(monFriHelperPayment)
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
