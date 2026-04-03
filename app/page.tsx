'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { Header } from '@/components/Header';
import { logoutAction } from '@/app/actions/auth';
import { 
  LayoutDashboard,
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Receipt, 
  Wallet,
  Navigation,
  MoreVertical,
  Calendar,
  Truck,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  Wrench,
  Droplets,
  Disc,
  CircleDot,
  Zap,
  Activity,
  Loader2
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
import { motion } from 'motion/react';

interface DashboardStat {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: string;
  color: string;
  percentage?: string | null;
  breakdown?: { 
    name: string; 
    value: string; 
    percentage: string;
    type?: string;
    isOverdue?: boolean;
    remainingKms?: number;
    overdueKms?: number;
    maintenances?: { 
      type: string; 
      value: string; 
      percentage: string; 
      isOverdue: boolean;
      remainingKms?: number;
      overdueKms?: number;
    }[];
  }[];
  totalTrips?: number;
  totalKm?: number;
  costPerKm?: {
    value: string;
    change: string;
    trend: 'up' | 'down';
  };
  profitPerKm?: {
    value: string;
    change: string;
    trend: 'up' | 'down';
  };
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
  User,
  Wrench
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

const getMaintenanceIcon = (type: string) => {
  const t = type.toLowerCase();
  if (t.includes('óleo') || t.includes('filtro')) return Droplets;
  if (t.includes('freio') || t.includes('pastilha')) return Disc;
  if (t.includes('pneu') || t.includes('alinhamento')) return CircleDot;
  if (t.includes('elétrica') || t.includes('bateria')) return Zap;
  if (t.includes('motor') || t.includes('correia')) return Activity;
  return Wrench;
};

const MileageCounter = ({ value, isOverdue }: { value: number; isOverdue: boolean }) => {
  const [displayValue, setDisplayValue] = React.useState(value + 500); // Start slightly above for effect

  React.useEffect(() => {
    const duration = 1500; // 1.5s
    const startTime = Date.now();
    const startValue = value + 500;

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out quad
      const easeProgress = 1 - (1 - progress) * (1 - progress);
      const current = Math.floor(startValue - (startValue - value) * easeProgress);
      
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  return (
    <span className={cn(
      "font-black text-lg tracking-tighter",
      isOverdue ? "text-rose-500" : "text-primary"
    )}>
      {displayValue.toLocaleString('pt-BR')}
    </span>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = React.useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = React.useState(now.getFullYear());
  const [selectedWeek, setSelectedWeek] = React.useState<string>('all');
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [dashboardData, setDashboardData] = React.useState<DashboardData | null>(null);
  const [showValues, setShowValues] = React.useState(false);
  const [isCheckingSession, setIsCheckingSession] = React.useState(true);
  const [user, setUser] = React.useState<{ role: string } | null>(null);

  const handleLogout = async () => {
    try {
      await logoutAction();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const fetchStats = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/dashboard/stats?month=${selectedMonth}&year=${selectedYear}&week=${selectedWeek}`);
      if (!response.ok) {
        const text = await response.text();
        console.error('API error response:', text);
        try {
          const errorData = JSON.parse(text);
          setError(errorData.details || errorData.error || `Erro HTTP: ${response.status}`);
        } catch {
          setError(`Erro HTTP: ${response.status}`);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      setError(error instanceof Error ? error.message : 'Falha ao conectar com o servidor. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, selectedWeek]);

  React.useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          if (data.role === 'OPERATOR') {
            router.replace('/routes');
            return;
          }
          setUser(data);
        }
      } catch (error) {
        console.error('Session check error:', error);
      }
      setIsCheckingSession(false);
    };
    checkSession();
  }, [router]);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const stats = dashboardData?.stats || [];
  const chartData = dashboardData?.chart || [];
  const trips = dashboardData?.recentTrips || [];

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-[#181411] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <AppLayout>
      <Header 
        title="Visão Geral do Dashboard" 
        icon={LayoutDashboard}
        actionLabel="Nova Viagem" 
        onAction={() => router.push('/routes')}
        onLogout={user?.role === 'OPERATOR' ? handleLogout : undefined}
      />
      
      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
          
          {/* Filter Section */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-surface-dark border border-border-dark rounded-xl p-2 md:p-1.5 shadow-sm">
              <div className="flex items-center gap-2 px-3 py-1.5 text-slate-400 border-b border-border-dark sm:border-b-0 sm:border-r sm:pr-4">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Período:</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 p-1 sm:p-0">
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

                <button
                  onClick={() => setShowValues(!showValues)}
                  className="ml-2 p-1.5 bg-background-dark border border-border-dark text-slate-400 hover:text-white rounded-lg transition-all"
                  title={showValues ? "Ocultar Valores" : "Mostrar Valores"}
                >
                  {showValues ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <span className={cn("w-2 h-2 rounded-full bg-emerald-500", loading ? "animate-pulse" : "")}></span>
              {loading ? 'Atualizando...' : 'Dados Sincronizados'}
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {error && (
              <div className="col-span-full p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-3">
                <AlertCircle className="w-5 h-5" />
                <div className="flex-1">
                  <p className="font-bold text-xs uppercase tracking-wider">Erro ao carregar dados</p>
                  <p className="text-sm opacity-80">{error}</p>
                </div>
                <button 
                  onClick={() => fetchStats()}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-xs font-bold transition-all uppercase tracking-widest"
                >
                  Tentar novamente
                </button>
              </div>
            )}
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
                  <p className="text-3xl font-black text-white tracking-tight">
                    {showValues ? stat.value : '******'}
                  </p>
                  
                  {stat.totalTrips !== undefined && (
                    <div className="mt-2 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-widest">
                          {stat.totalTrips} Viagens Totais
                        </span>
                      </div>
                      {stat.totalKm !== undefined && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-400 bg-slate-400/10 px-2 py-0.5 rounded uppercase tracking-widest">
                            {stat.totalKm.toLocaleString('pt-BR')} KM Rodados
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {stat.breakdown && stat.breakdown.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-border-dark space-y-3">
                      {stat.label === 'RECEITA TOTAL' && (
                        <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Total Viagens</h4>
                      )}
                      {stat.label === 'PRÓXIMAS MANUTENÇÕES' ? (
                        <div className="grid grid-cols-1 gap-4">
                          {stat.breakdown.map((vehicle, vIdx) => (
                            <div key={vIdx} className="bg-background-dark/20 border border-white/5 rounded-xl overflow-hidden">
                              <div className="bg-background-dark/40 px-4 py-2 border-b border-white/5">
                                <h4 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                  <Truck className="w-3 h-3 text-primary" />
                                  {vehicle.name}
                                </h4>
                              </div>
                              <div className="p-3 space-y-3">
                                {vehicle.maintenances?.map((item, idx) => {
                                  const MIcon = getMaintenanceIcon(item.type || '');
                                  return (
                                    <motion.div 
                                      key={idx} 
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: idx * 0.1 }}
                                      className="group relative bg-background-dark/30 hover:bg-background-dark/50 border border-white/5 rounded-lg p-3 transition-all duration-300"
                                    >
                                      <div className="flex items-start gap-3">
                                        <div className={cn(
                                          "p-2 rounded-lg",
                                          item.isOverdue ? "bg-rose-500/10 text-rose-500" : "bg-primary/10 text-primary"
                                        )}>
                                          <MIcon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex justify-between items-start mb-1">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                              {item.type}
                                            </p>
                                            <div className={cn(
                                              "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
                                              item.isOverdue ? "bg-rose-500/20 text-rose-500" : "bg-emerald-500/20 text-emerald-500"
                                            )}>
                                              {item.isOverdue ? "Atrasado" : "No Prazo"}
                                            </div>
                                          </div>
                                          
                                          <div className="mt-2">
                                            <div className="flex flex-col mb-1">
                                              <div className="flex items-baseline gap-1">
                                                <span className={cn(
                                                  "text-[10px] font-bold uppercase tracking-tight",
                                                  item.isOverdue ? "text-rose-500" : "text-slate-400"
                                                )}>
                                                  {item.isOverdue ? "Ultrapassado em" : "Faltam"}
                                                </span>
                                                <div className="flex items-center gap-1">
                                                  {showValues ? (
                                                    <MileageCounter 
                                                      value={item.isOverdue ? (item.overdueKms || 0) : (item.remainingKms || 0)} 
                                                      isOverdue={item.isOverdue} 
                                                    />
                                                  ) : (
                                                    <span className="text-lg font-black text-white">******</span>
                                                  )}
                                                  <span className={cn(
                                                    "text-[10px] font-bold uppercase tracking-tight",
                                                    item.isOverdue ? "text-rose-500" : "text-slate-400"
                                                  )}>
                                                    kilometros
                                                  </span>
                                                </div>
                                              </div>
                                              
                                              {!item.isOverdue && (item.remainingKms || 0) <= 500 && (
                                                <motion.div 
                                                  animate={{ opacity: [0.4, 1, 0.4] }}
                                                  transition={{ duration: 2, repeat: Infinity }}
                                                  className="text-[9px] text-rose-500 font-bold italic"
                                                >
                                                  Atenção: Manutenção próxima
                                                </motion.div>
                                              )}
                                            </div>
                                            
                                            <div className="h-1 w-full bg-background-dark rounded-full overflow-hidden mt-2">
                                              <div 
                                                className={cn(
                                                  "h-full rounded-full transition-all duration-500",
                                                  item.isOverdue ? "bg-rose-500" : "bg-primary"
                                                )}
                                                style={{ width: item.percentage }}
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        stat.breakdown.map((item, idx) => (
                          <div key={idx} className="flex flex-col gap-1">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                              <span className="text-slate-400">{item.name}</span>
                              <span className={cn(
                                "text-white",
                                item.isOverdue && "text-rose-500"
                              )}>
                                {showValues ? item.value : '******'}
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-background-dark rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full rounded-full",
                                  stat.label === 'RECEITA TOTAL' ? "bg-primary" : 
                                  item.isOverdue ? "bg-rose-500" : "bg-primary"
                                )}
                                style={{ width: item.percentage }}
                              />
                            </div>
                            <p className={cn(
                              "text-[9px] font-bold text-right",
                              stat.label === 'RECEITA TOTAL' ? "text-primary/70" : 
                              item.isOverdue ? "text-rose-500/70" : "text-primary/70"
                            )}>{item.percentage}</p>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  <div className="mt-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                        stat.trend === 'up' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                      )}>
                        {stat.trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                        {stat.change}
                      </span>
                      <span className="text-slate-500 text-[10px] font-medium uppercase">vs mês anterior</span>
                    </div>

                    {stat.costPerKm && (
                      <div className="pt-3 border-t border-border-dark">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Custo Variável KM Rodado</p>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-black text-white tracking-tight">
                            {showValues ? stat.costPerKm.value : '******'}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                              stat.costPerKm.trend === 'up' ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
                            )}>
                              {stat.costPerKm.trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                              {stat.costPerKm.change}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {stat.profitPerKm && (
                      <div className="pt-3 border-t border-border-dark">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Receita Variável KM Rodado</p>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-black text-white tracking-tight">
                            {showValues ? stat.profitPerKm.value : '******'}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                              stat.profitPerKm.trend === 'up' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                            )}>
                              {stat.profitPerKm.trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                              {stat.profitPerKm.change}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chart Section */}
          <div className="bg-surface-dark rounded-xl border border-border-dark p-4 md:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h3 className="text-lg font-bold text-white">Desempenho Financeiro</h3>
                <p className="text-sm text-slate-500">Receitas vs Despesas - {months.find(m => m.id === selectedMonth)?.name} {selectedYear}</p>
              </div>
              <div className="flex gap-4 sm:gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="text-xs font-semibold text-slate-400">Receita</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
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
                      tickFormatter={(value) => showValues ? `R$ ${value}` : '******'}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#27211b', border: '1px solid #393028', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: number | string) => showValues ? `R$ ${value}` : '******'}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      name="Receita"
                      stroke="#f48c25" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expenses" 
                      name="Despesas"
                      stroke="#f43f5e" 
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
              <button 
                onClick={() => router.push(`/routes?month=${selectedMonth}&year=${selectedYear}`)}
                className="text-sm font-bold text-primary hover:underline"
              >
                Ver Todas
              </button>
            </div>
            <div className="overflow-x-auto hidden md:block">
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
                      <td className="px-6 py-4 text-sm font-bold text-white">{showValues ? trip.value : '******'}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border",
                          trip.status === 'DELIVERED' || trip.status === 'Entregue' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                          trip.status === 'IN_TRANSIT' || trip.status === 'Em Trânsito' ? "bg-primary/10 text-primary border-primary/20" :
                          "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        )}>
                          {trip.status === 'DELIVERED' ? 'Entregue' : 
                           trip.status === 'IN_TRANSIT' ? 'Em Trânsito' : 
                           trip.status === 'PENDING' ? 'Pendente' : 
                           trip.status}
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

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-border-dark">
              {loading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="p-4 animate-pulse space-y-3">
                    <div className="h-4 w-3/4 bg-white/5 rounded"></div>
                    <div className="h-3 w-1/2 bg-white/5 rounded"></div>
                  </div>
                ))
              ) : trips.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm italic">
                  Nenhuma viagem encontrada para este período.
                </div>
              ) : trips.map((trip, i) => (
                <div key={i} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                        <Navigation className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{trip.route}</p>
                        <p className="text-[10px] text-slate-500">{trip.date}</p>
                      </div>
                    </div>
                    <button className="text-slate-500 hover:text-primary transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-0.5">Contrato</p>
                      <p className="text-xs text-slate-300">{trip.contract || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-0.5">Placa</p>
                      <p className="text-xs text-slate-300">{trip.plate}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-0.5">Valor</p>
                      <p className="text-xs font-bold text-white">{showValues ? trip.value : '******'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-0.5">Status</p>
                      <span className={cn(
                        "inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border",
                        trip.status === 'DELIVERED' || trip.status === 'Entregue' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                        trip.status === 'IN_TRANSIT' || trip.status === 'Em Trânsito' ? "bg-primary/10 text-primary border-primary/20" :
                        "bg-blue-500/10 text-blue-500 border-blue-500/20"
                      )}>
                        {trip.status === 'DELIVERED' ? 'Entregue' : 
                         trip.status === 'IN_TRANSIT' ? 'Em Trânsito' : 
                         trip.status === 'PENDING' ? 'Pendente' : 
                         trip.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
