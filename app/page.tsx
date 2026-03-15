'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { Header } from '@/components/Header';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Receipt, 
  Wallet,
  Navigation,
  MoreVertical,
  Calendar,
  Truck,
  User
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { cn } from '@/lib/utils';

interface DashboardStat {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: string;
  color: string;
  percentage?: string | null;
}

interface ChartData {
  name: string;
  revenue: number;
  expenses: number;
}

interface RecentTrip {
  route: string;
  date: string;
  contract: string;
  plate: string;
  value: string;
  status: string;
}

interface DashboardData {
  stats: DashboardStat[];
  chart: ChartData[];
  recentTrips: RecentTrip[];
}

const iconMap: Record<string, React.ElementType> = {
  DollarSign,
  Receipt,
  Wallet,
  Truck,
  User
};

const months = [
  { id: 1, name: 'Janeiro' },
  { id: 2, name: 'Fevereiro' },
  { id: 3, name: 'Março' },
  { id: 4, name: 'Abril' },
  { id: 5, name: 'Maio' },
  { id: 6, name: 'Junho' },
  { id: 7, name: 'Julho' },
  { id: 8, name: 'Agosto' },
  { id: 9, name: 'Setembro' },
  { id: 10, name: 'Outubro' },
  { id: 11, name: 'Novembro' },
  { id: 12, name: 'Dezembro' },
];

export default function Dashboard() {
  const router = useRouter();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = React.useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = React.useState(now.getFullYear());
  const [selectedWeek, setSelectedWeek] = React.useState<string>('all');
  const [loading, setLoading] = React.useState(true);
  const [dashboardData, setDashboardData] = React.useState<DashboardData | null>(null);

  const fetchStats = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/dashboard/stats?month=${selectedMonth}&year=${selectedYear}&week=${selectedWeek}`);
      if (!response.ok) {
        const text = await response.text();
        console.error('API error response:', text);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, selectedWeek]);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const stats = dashboardData?.stats || [];
  const chartData = dashboardData?.chart || [];
  const trips = dashboardData?.recentTrips || [];

  return (
    <AppLayout>
      <Header 
        title="Visão Geral do Dashboard" 
        actionLabel="Nova Viagem" 
        onAction={() => router.push('/routes')}
      />
      
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Filter Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 bg-surface-dark border border-border-dark rounded-xl p-1.5 shadow-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 text-slate-400">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Período:</span>
              </div>
              
              <div className="flex items-center gap-2">
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="bg-background-dark border border-border-dark text-white text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                >
                  {months.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>

                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="bg-background-dark border border-border-dark text-white text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                >
                  {[2024, 2025, 2026].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>

                <select 
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="bg-background-dark border border-border-dark text-white text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                >
                  <option value="all">Mês Inteiro</option>
                  <option value="1">Semana 1</option>
                  <option value="2">Semana 2</option>
                  <option value="3">Semana 3</option>
                  <option value="4">Semana 4</option>
                  <option value="5">Semana 5</option>
                </select>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <span className={cn("w-2 h-2 rounded-full bg-emerald-500", loading ? "animate-pulse" : "")}></span>
              {loading ? 'Atualizando...' : 'Dados Sincronizados'}
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              [1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-surface-dark p-6 rounded-xl border border-border-dark shadow-sm animate-pulse h-32"></div>
              ))
            ) : stats.map((stat, i) => {
              const Icon = iconMap[stat.icon] || DollarSign;
              return (
                <div key={i} className="bg-surface-dark p-6 rounded-xl border border-border-dark shadow-sm relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
                    <div className={cn(
                      "p-2 rounded-lg flex flex-col items-center justify-center min-w-[52px] min-h-[52px] gap-1", 
                      stat.color.replace('text-', 'bg-').concat('/10')
                    )}>
                      <Icon className={cn("w-5 h-5", stat.color)} />
                      {stat.percentage !== null && stat.percentage !== undefined && (
                        <span className={cn("text-[10px] font-black leading-none", stat.color)}>
                          {stat.percentage}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-3xl font-black text-white tracking-tight">{stat.value}</p>
                  <div className="mt-4 flex items-center gap-2">
                    <span className={cn(
                      "flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                      stat.trend === 'up' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                    )}>
                      {stat.trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                      {stat.change}
                    </span>
                    <span className="text-slate-500 text-[10px] font-medium uppercase">vs mês anterior</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chart Section */}
          <div className="bg-surface-dark rounded-xl border border-border-dark p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-white">Desempenho Financeiro</h3>
                <p className="text-sm text-slate-500">Comparativo de Receitas vs Despesas - {months.find(m => m.id === selectedMonth)?.name} {selectedYear}</p>
              </div>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="text-xs font-semibold text-slate-400">Receita</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-500"></div>
                  <span className="text-xs font-semibold text-slate-400">Despesas</span>
                </div>
              </div>
            </div>
            
            <div className="h-[350px] w-full">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center bg-background-dark/20 rounded-lg">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f48c25" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f48c25" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#393028" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#5A5A40" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke="#5A5A40" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `R$ ${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#27211b', border: '1px solid #393028', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#f48c25" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expenses" 
                      stroke="#94a3b8" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fill="transparent"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Recent Trips Table */}
          <div className="bg-surface-dark rounded-xl border border-border-dark shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border-dark flex justify-between items-center">
              <h3 className="font-bold text-white">Viagens do Período</h3>
              <button className="text-sm font-bold text-primary hover:underline">Ver Todas</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-background-dark/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Rota</th>
                    <th className="px-6 py-4">Contrato</th>
                    <th className="px-6 py-4">Placa</th>
                    <th className="px-6 py-4">Valor</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dark">
                  {loading ? (
                    [1, 2, 3].map(i => (
                      <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-8 bg-white/5"></td>
                      </tr>
                    ))
                  ) : trips.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-sm italic">
                        Nenhuma viagem encontrada para este período.
                      </td>
                    </tr>
                  ) : trips.map((trip, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                            <Navigation className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{trip.route}</p>
                            <p className="text-[10px] text-slate-500">{trip.date}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">{trip.contract || '-'}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-300">{trip.plate}</td>
                      <td className="px-6 py-4 text-sm font-bold text-white">{trip.value}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border",
                          trip.status === 'DELIVERED' || trip.status === 'Entregue' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                          trip.status === 'IN_TRANSIT' || trip.status === 'Em Trânsito' ? "bg-primary/10 text-primary border-primary/20" :
                          "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        )}>
                          {trip.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-slate-500 hover:text-primary transition-colors">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
