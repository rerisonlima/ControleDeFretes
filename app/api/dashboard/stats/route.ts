import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfMonth, endOfMonth, endOfWeek, eachWeekOfInterval, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
// No Prisma model imports needed as we use custom interface

interface TripWithRelations {
  id: number;
  value: number;
  driverId: number | null;
  helperId: number | null;
  scheduledAt: Date;
  valor1aViagemMotorista: number | null;
  valor2aViagemMotorista: number | null;
  valor1aViagemAjudante: number | null;
  valor2aViagemAjudante: number | null;
  status?: string;
  contract?: string | null;
  routeId?: number | null;
  vehicleId?: number | null;
  route?: {
    destination?: string;
    driverValue1: number | null;
    driverValue2: number | null;
    helperValue1: number | null;
    helperValue2: number | null;
  } | null;
  frete?: {
    cidade?: string;
    valor1aViagemMotorista: number | null;
    valor2aViagemMotorista: number | null;
    valor1aViagemAjudante: number | null;
    valor2aViagemAjudante: number | null;
  } | null;
  contratante?: {
    id: number;
    ContratanteNome: string;
  } | null;
  vehicle?: {
    plate: string;
  } | null;
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
    await prisma.$executeRawUnsafe('SET statement_timeout = 60000;'); // 1 minute
    
    // Always fetch full month data to simplify logic and provide chart context
    const fullMonthStart = startOfMonth(new Date(year, month - 1));
    const fullMonthEnd = endOfMonth(fullMonthStart);

    // Fetch current month and previous month data in parallel
    const prevStartDate = startOfMonth(new Date(year, month - 2));
    const prevEndDate = endOfMonth(prevStartDate);

    const [allMonthTrips, allMonthExpenses, prevTrips, prevExpenses] = await Promise.all([
      prisma.trip.findMany({
        where: { scheduledAt: { gte: fullMonthStart, lte: fullMonthEnd } },
        select: {
          id: true,
          value: true,
          driverId: true,
          helperId: true,
          scheduledAt: true,
          valor1aViagemMotorista: true,
          valor2aViagemMotorista: true,
          valor1aViagemAjudante: true,
          valor2aViagemAjudante: true,
          status: true,
          contract: true,
          routeId: true,
          vehicleId: true,
          route: {
            select: {
              destination: true,
              driverValue1: true,
              driverValue2: true,
              helperValue1: true,
              helperValue2: true
            }
          },
          frete: {
            select: {
              cidade: true,
              valor1aViagemMotorista: true,
              valor2aViagemMotorista: true,
              valor1aViagemAjudante: true,
              valor2aViagemAjudante: true
            }
          },
          contratante: {
            select: {
              id: true,
              ContratanteNome: true
            }
          },
          vehicle: {
            select: {
              plate: true
            }
          }
        }
      }),
      prisma.expense.findMany({
        where: { date: { gte: fullMonthStart, lte: fullMonthEnd } },
      }),
      prisma.trip.findMany({
        where: { scheduledAt: { gte: prevStartDate, lte: prevEndDate } },
        select: {
          id: true,
          value: true,
          driverId: true,
          helperId: true,
          scheduledAt: true,
          valor1aViagemMotorista: true,
          valor2aViagemMotorista: true,
          valor1aViagemAjudante: true,
          valor2aViagemAjudante: true,
          route: {
            select: {
              driverValue1: true,
              driverValue2: true,
              helperValue1: true,
              helperValue2: true
            }
          },
          frete: {
            select: {
              valor1aViagemMotorista: true,
              valor2aViagemMotorista: true,
              valor1aViagemAjudante: true,
              valor2aViagemAjudante: true
            }
          }
        }
      }),
      prisma.expense.findMany({
        where: { date: { gte: prevStartDate, lte: prevEndDate } },
      })
    ]);

    // Filter data for the specific week if requested
    let trips = allMonthTrips;
    let expenses = allMonthExpenses;

    if (weekIndex && weekIndex !== 'all') {
      const weeks = eachWeekOfInterval({ start: fullMonthStart, end: fullMonthEnd });
      const selectedWeekStart = weeks[parseInt(weekIndex) - 1];
      if (selectedWeekStart) {
        const selectedWeekEnd = endOfWeek(selectedWeekStart);
        trips = allMonthTrips.filter(t => t.scheduledAt >= selectedWeekStart && t.scheduledAt <= selectedWeekEnd);
        expenses = allMonthExpenses.filter(e => e.date >= selectedWeekStart && e.date <= selectedWeekEnd);
      }
    }

    // Helper function to calculate trip operational costs based on daily frequency
    // (Deprecated: User requested to use Expense table exclusively)
    /*
    const calculateTripOperationalCosts = (tripsList: TripWithRelations[], filterWeekdays = false) => {
      ...
    };
    */

    // Calculate stats
    const totalRevenue = trips.reduce((sum, trip) => sum + trip.value, 0);
    
    // Total Expenses = Sum(Expense table) only
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.value, 0);

    // Calculate revenue breakdown by contractor
    const revenueGroups: Record<string, { count: number; value: number }> = {};
    trips.forEach(t => {
      const contractorName = t.contratante?.ContratanteNome || 'Sem Contratante';
      if (!revenueGroups[contractorName]) {
        revenueGroups[contractorName] = { count: 0, value: 0 };
      }
      revenueGroups[contractorName].count += 1;
      revenueGroups[contractorName].value += t.value;
    });

    const revenueBreakdown = Object.entries(revenueGroups)
      .map(([name, data]) => ({
        name,
        value: `${data.count} viagens - ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.value)}`,
        percentage: totalRevenue > 0 ? ((data.value / totalRevenue) * 100).toFixed(1) + '%' : '0%'
      }))
      .sort((a, b) => {
        const valA = parseInt(a.value.split(' ')[0]);
        const valB = parseInt(b.value.split(' ')[0]);
        return valB - valA;
      });

    // Calculate breakdown by category
    const expenseGroups: Record<string, number> = {};
    expenses.forEach(e => {
      expenseGroups[e.type] = (expenseGroups[e.type] || 0) + e.value;
    });

    const expenseBreakdown = Object.entries(expenseGroups)
      .map(([name, value]) => ({
        name,
        value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value),
        percentage: totalExpenses > 0 ? ((value / totalExpenses) * 100).toFixed(1) + '%' : '0%'
      }))
      .sort((a, b) => {
        const valA = parseFloat(a.value.replace(/[^\d,]/g, '').replace(',', '.'));
        const valB = parseFloat(b.value.replace(/[^\d,]/g, '').replace(',', '.'));
        return valB - valA;
      });
    
    // Mon-Fri Expenses = Sum(Expense table Mon-Fri) only
    const monFriExpenses = expenses.filter(e => {
      const day = new Date(e.date).getDay();
      return day >= 1 && day <= 5;
    }).reduce((sum, e) => sum + e.value, 0);

    // Driver and Helper payments from Expense table (Mon-Fri)
    const monFriDriverPayment = expenses.filter(e => {
      const day = new Date(e.date).getDay();
      return day >= 1 && day <= 5 && e.type === 'Pagamento Motorista';
    }).reduce((sum, e) => sum + e.value, 0);

    const monFriHelperPayment = expenses.filter(e => {
      const day = new Date(e.date).getDay();
      return day >= 1 && day <= 5 && e.type === 'Pagamento Ajudante';
    }).reduce((sum, e) => sum + e.value, 0);
    
    const profit = totalRevenue - totalExpenses;
    
    const prevRevenue = prevTrips.reduce((sum, trip) => sum + trip.value, 0);
    
    const prevMonFriExpenses = prevExpenses.filter(e => {
      const day = new Date(e.date).getDay();
      return day >= 1 && day <= 5;
    }).reduce((sum, e) => sum + e.value, 0);

    const prevMonFriDriver = prevExpenses.filter(e => {
      const day = new Date(e.date).getDay();
      return day >= 1 && day <= 5 && e.type === 'Pagamento Motorista';
    }).reduce((sum, e) => sum + e.value, 0);

    const prevMonFriHelper = prevExpenses.filter(e => {
      const day = new Date(e.date).getDay();
      return day >= 1 && day <= 5 && e.type === 'Pagamento Ajudante';
    }).reduce((sum, e) => sum + e.value, 0);

    const prevExpensesVal = prevExpenses.reduce((sum, expense) => sum + expense.value, 0);
    const prevProfit = prevRevenue - prevExpensesVal;

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? '+100%' : '0%';
      const change = ((current - previous) / previous) * 100;
      return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
    };

    // Chart data (weekly)
    const chartWeeks = eachWeekOfInterval({ 
      start: fullMonthStart, 
      end: fullMonthEnd 
    });

    const finalChartData = chartWeeks.map((weekStart, index) => {
      const weekEnd = endOfWeek(weekStart);
      const weekTrips = allMonthTrips.filter(t => t.scheduledAt >= weekStart && t.scheduledAt <= weekEnd);
      const weekExpenses = allMonthExpenses.filter(e => e.date >= weekStart && e.date <= weekEnd);

      return {
        name: `Semana ${index + 1}`,
        revenue: weekTrips.reduce((sum, t) => sum + t.value, 0),
        expenses: weekExpenses.reduce((sum, e) => sum + e.value, 0),
      };
    });

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
          totalTrips: trips.length
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
      recentTrips: trips.slice(0, 5).map(t => ({
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
