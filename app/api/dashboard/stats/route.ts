import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfMonth, endOfMonth, endOfWeek, eachWeekOfInterval, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Trip, Route, Frete } from '@prisma/client';

interface TripWithRelations extends Trip {
  route?: Route | null;
  frete?: Frete | null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = parseInt(searchParams.get('month') || format(new Date(), 'M'));
  const year = parseInt(searchParams.get('year') || format(new Date(), 'yyyy'));
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
    const trips = await prisma.trip.findMany({
      where: {
        scheduledAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        route: true,
        frete: true,
        contratante: {
          select: {
            id: true,
            ContratanteNome: true
          }
        },
        vehicle: true
      }
    });

    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Helper function to calculate trip operational costs based on daily frequency
    const calculateTripOperationalCosts = (tripsList: TripWithRelations[], filterWeekdays = false) => {
      // Sort trips by date/time to determine first/second correctly
      const sortedTrips = [...tripsList].sort((a, b) => 
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      );

      const driverDailyCount: Record<string, number> = {};
      const helperDailyCount: Record<string, number> = {};
      
      let total = 0;
      let driverTotal = 0;
      let helperTotal = 0;
      
      for (const trip of sortedTrips) {
        const tripDate = new Date(trip.scheduledAt);
        const dateKey = format(tripDate, 'yyyy-MM-dd');
        const dayOfWeek = tripDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

        // If filterWeekdays is true, only consider Mon-Fri (1-5)
        if (filterWeekdays && (dayOfWeek < 1 || dayOfWeek > 5)) continue;
        
        // Driver cost
        if (trip.driverId) {
          const driverKey = `${dateKey}_${trip.driverId}`;
          const isFirst = !driverDailyCount[driverKey];
          driverDailyCount[driverKey] = (driverDailyCount[driverKey] || 0) + 1;
          
          let cost = 0;
          if (isFirst) {
            cost = trip.valor1aViagemMotorista ?? trip.frete?.valor1aViagemMotorista ?? trip.route?.driverValue1 ?? 0;
          } else {
            cost = trip.valor2aViagemMotorista ?? trip.frete?.valor2aViagemMotorista ?? trip.route?.driverValue2 ?? 0;
          }
          total += cost;
          driverTotal += cost;
        }
        
        // Helper cost
        if (trip.helperId) {
          const helperKey = `${dateKey}_${trip.helperId}`;
          const isFirst = !helperDailyCount[helperKey];
          helperDailyCount[helperKey] = (helperDailyCount[helperKey] || 0) + 1;
          
          let cost = 0;
          if (isFirst) {
            cost = trip.valor1aViagemAjudante ?? trip.frete?.valor1aViagemAjudante ?? trip.route?.helperValue1 ?? 0;
          } else {
            cost = trip.valor2aViagemAjudante ?? trip.frete?.valor2aViagemAjudante ?? trip.route?.helperValue2 ?? 0;
          }
          total += cost;
          helperTotal += cost;
        }
      }
      
      return { total, driverTotal, helperTotal };
    };

    // Calculate stats
    const totalRevenue = trips.reduce((sum, trip) => sum + trip.value, 0);
    
    // Total Expenses = Sum(Expense table) + Sum(Trip driver/helper values)
    const { total: tripExpenses } = calculateTripOperationalCosts(trips);
    const { driverTotal: monFriDriverPayment, helperTotal: monFriHelperPayment } = calculateTripOperationalCosts(trips, true);
    
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.value, 0) + tripExpenses;
    
    // Mon-Fri Expenses = Sum(Expense table Mon-Fri) + Sum(Trip driver/helper values Mon-Fri)
    const monFriGeneralExpenses = expenses.filter(e => {
      const day = new Date(e.date).getDay();
      return day >= 1 && day <= 5;
    }).reduce((sum, e) => sum + e.value, 0);
    
    const monFriExpenses = monFriGeneralExpenses + monFriDriverPayment + monFriHelperPayment;
    
    const profit = totalRevenue - totalExpenses;

    // Calculate previous month stats for comparison
    const prevStartDate = startOfMonth(new Date(year, month - 2));
    const prevEndDate = endOfMonth(prevStartDate);

    const prevTrips = await prisma.trip.findMany({
      where: { scheduledAt: { gte: prevStartDate, lte: prevEndDate } },
      include: {
        route: true,
        frete: true
      }
    });

    const prevExpenses = await prisma.expense.findMany({
      where: { date: { gte: prevStartDate, lte: prevEndDate } },
    });

    const prevRevenue = prevTrips.reduce((sum, trip) => sum + trip.value, 0);
    const { total: prevTripExpenses } = calculateTripOperationalCosts(prevTrips);
    const { driverTotal: prevMonFriDriver, helperTotal: prevMonFriHelper } = calculateTripOperationalCosts(prevTrips, true);
    
    const prevMonFriGeneralExpenses = prevExpenses.filter(e => {
      const day = new Date(e.date).getDay();
      return day >= 1 && day <= 5;
    }).reduce((sum, e) => sum + e.value, 0);
    const prevMonFriExpenses = prevMonFriGeneralExpenses + prevMonFriDriver + prevMonFriHelper;

    const prevExpensesVal = prevExpenses.reduce((sum, expense) => sum + expense.value, 0) + prevTripExpenses;
    const prevProfit = prevRevenue - prevExpensesVal;

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? '+100%' : '0%';
      const change = ((current - previous) / previous) * 100;
      return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
    };

    // Chart data (weekly)
    // Always use full month for chart to show context, or adjust if week is selected?
    // User asked to filter by week, so maybe chart should reflect that or stay monthly.
    // Let's keep chart monthly for context but stats reflect the filter.
    const chartWeeks = eachWeekOfInterval({ 
      start: startOfMonth(new Date(year, month - 1)), 
      end: endOfMonth(new Date(year, month - 1)) 
    });

    // Re-fetching full month data for chart if week is selected to keep chart consistent
    let chartTrips = trips;
    let chartExpenses = expenses;
    if (weekIndex && weekIndex !== 'all') {
      const fullMonthStart = startOfMonth(new Date(year, month - 1));
      const fullMonthEnd = endOfMonth(fullMonthStart);
      chartTrips = await prisma.trip.findMany({
        where: { scheduledAt: { gte: fullMonthStart, lte: fullMonthEnd } },
        include: { route: true, frete: true }
      });
      chartExpenses = await prisma.expense.findMany({
        where: { date: { gte: fullMonthStart, lte: fullMonthEnd } }
      });
    }

    const finalChartData = chartWeeks.map((weekStart, index) => {
      const weekEnd = endOfWeek(weekStart);
      const weekTrips = chartTrips.filter(t => t.scheduledAt >= weekStart && t.scheduledAt <= weekEnd);
      const weekExpenses = chartExpenses.filter(e => e.date >= weekStart && e.date <= weekEnd);
      const { total: weekTripExpenses } = calculateTripOperationalCosts(weekTrips);

      return {
        name: `Semana ${index + 1}`,
        revenue: weekTrips.reduce((sum, t) => sum + t.value, 0),
        expenses: weekExpenses.reduce((sum, e) => sum + e.value, 0) + weekTripExpenses,
      };
    });

    return NextResponse.json({
      stats: [
        { 
          label: 'RECEITA TOTAL', 
          value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue), 
          change: calculateChange(totalRevenue, prevRevenue), 
          trend: totalRevenue >= prevRevenue ? 'up' : 'down',
          icon: 'DollarSign',
          color: 'text-primary'
        },
        { 
          label: 'DESPESAS TOTAIS', 
          value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpenses), 
          change: calculateChange(totalExpenses, prevExpensesVal), 
          trend: totalExpenses <= prevExpensesVal ? 'down' : 'up',
          icon: 'Receipt',
          color: 'text-rose-500'
        },
        { 
          label: 'LUCRO FINAL', 
          value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(profit), 
          change: calculateChange(profit, prevProfit), 
          trend: profit >= prevProfit ? 'up' : 'down',
          icon: 'Wallet',
          color: 'text-emerald-500'
        },
        { 
          label: 'DESPESAS (SEG-SEX)', 
          value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monFriExpenses), 
          change: calculateChange(monFriExpenses, prevMonFriExpenses), 
          trend: monFriExpenses <= prevMonFriExpenses ? 'down' : 'up',
          icon: 'Receipt',
          color: 'text-amber-500'
        },
        { 
          label: 'PAGAMENTO MOTORISTA (SEG-SEX)', 
          value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monFriDriverPayment), 
          change: calculateChange(monFriDriverPayment, prevMonFriDriver), 
          trend: monFriDriverPayment >= prevMonFriDriver ? 'up' : 'down',
          icon: 'Truck',
          color: 'text-blue-500'
        },
        { 
          label: 'PAGAMENTO AJUDANTE (SEG-SEX)', 
          value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(monFriHelperPayment), 
          change: calculateChange(monFriHelperPayment, prevMonFriHelper), 
          trend: monFriHelperPayment >= prevMonFriHelper ? 'up' : 'down',
          icon: 'User',
          color: 'text-indigo-500'
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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
