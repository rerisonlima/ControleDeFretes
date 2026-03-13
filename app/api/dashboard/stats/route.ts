import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachWeekOfInterval, format, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = parseInt(searchParams.get('month') || format(new Date(), 'M'));
  const year = parseInt(searchParams.get('year') || format(new Date(), 'yyyy'));

  const startDate = startOfMonth(new Date(year, month - 1));
  const endDate = endOfMonth(startDate);

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

    // Calculate stats
    const totalRevenue = trips.reduce((sum, trip) => sum + trip.value, 0);
    
    // Total Expenses = Sum(Expense table) + Sum(Trip driver/helper values)
    const tripExpenses = trips.reduce((sum, trip) => {
      return sum + 
        (trip.valor1aViagemMotorista || 0) + 
        (trip.valor2aViagemMotorista || 0) + 
        (trip.valor1aViagemAjudante || 0) + 
        (trip.valor2aViagemAjudante || 0);
    }, 0);
    
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.value, 0) + tripExpenses;
    const profit = totalRevenue - totalExpenses;

    // Calculate previous month stats for comparison
    const prevStartDate = startOfMonth(new Date(year, month - 2));
    const prevEndDate = endOfMonth(prevStartDate);

    const prevTrips = await prisma.trip.findMany({
      where: { scheduledAt: { gte: prevStartDate, lte: prevEndDate } },
    });

    const prevExpenses = await prisma.expense.findMany({
      where: { date: { gte: prevStartDate, lte: prevEndDate } },
    });

    const prevRevenue = prevTrips.reduce((sum, trip) => sum + trip.value, 0);
    const prevTripExpenses = prevTrips.reduce((sum, trip) => {
      return sum + 
        (trip.valor1aViagemMotorista || 0) + 
        (trip.valor2aViagemMotorista || 0) + 
        (trip.valor1aViagemAjudante || 0) + 
        (trip.valor2aViagemAjudante || 0);
    }, 0);
    
    const prevExpensesVal = prevExpenses.reduce((sum, expense) => sum + expense.value, 0) + prevTripExpenses;
    const prevProfit = prevRevenue - prevExpensesVal;

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? '+100%' : '0%';
      const change = ((current - previous) / previous) * 100;
      return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
    };

    // Chart data (weekly)
    const weeks = eachWeekOfInterval({ start: startDate, end: endDate });
    const chartData = weeks.map((weekStart, index) => {
      const weekEnd = endOfWeek(weekStart);
      
      const weekTrips = trips.filter(t => t.scheduledAt >= weekStart && t.scheduledAt <= weekEnd);
      const weekExpenses = expenses.filter(e => e.date >= weekStart && e.date <= weekEnd);

      const weekTripExpenses = weekTrips.reduce((sum, trip) => {
        return sum + 
          (trip.valor1aViagemMotorista || 0) + 
          (trip.valor2aViagemMotorista || 0) + 
          (trip.valor1aViagemAjudante || 0) + 
          (trip.valor2aViagemAjudante || 0);
      }, 0);

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
          trend: totalExpenses <= prevExpensesVal ? 'down' : 'up', // down is good for expenses
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
      ],
      chart: chartData,
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
