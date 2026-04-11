'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import { Header } from '@/components/Header';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  MapPin, 
  Calendar,
  Truck,
  DollarSign,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Wallet,
  Eye,
  EyeOff,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Navigation,
  User,
  Receipt,
  Gauge,
  Ticket
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

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

interface Trip {
  id: number;
  tripId: string;
  vehicleId: number;
  contratanteId?: number;
  scheduledAt: string;
  value: number;
  status: string;
  paid: string;
  contract?: string;
  romaneio?: string;
  paymentDate?: string;
  distance?: number;
  odometer?: number | string;
  expenses?: { id: number; type: string; value: number }[];
  vehicle?: { plate: string; model: string };
  contratante?: { ContratanteNome: string };
  frete?: { cidade: string };
}

interface Vehicle {
  id: number;
  plate: string;
  brand: string;
  model: string;
}

interface Contratante {
  id: number;
  ContratanteNome: string;
}

interface ContractorStat {
  name: string;
  total: number;
  received: number;
  toReceive: number;
  count: number;
}

interface ChartDataPoint {
  date: string;
  total: number;
  contractors: { name: string; value: number }[];
}

export default function RecebimentosPage() {
  const router = useRouter();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = React.useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = React.useState(now.getFullYear());
  const [paymentFilter, setPaymentFilter] = React.useState('all');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [vehicleFilter, setVehicleFilter] = React.useState('');
  const [contratanteFilter, setContratanteFilter] = React.useState('');
  const [showValues, setShowValues] = React.useState(false);
  const [sortMode, setSortMode] = React.useState<'scheduled_asc' | 'created_desc'>('scheduled_asc');
  
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [contratantes, setContratantes] = React.useState<Contratante[]>([]);
  const [stats, setStats] = React.useState<{
    totalRevenue: number;
    received: number;
    toReceive: number;
    totalTrips: number;
    contractors: ContractorStat[];
    chartData: ChartDataPoint[];
  } | null>(null);
  
  const [loading, setLoading] = React.useState(true);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const fetchJson = async (url: string) => {
        const res = await fetch(url);
        if (!res.ok) return [];
        return await res.json();
      };

      // Fetch trips with same filters as routes page
      const [tripsData, statsData, vehiclesData, contratantesData] = await Promise.all([
        fetchJson(`/api/trips?month=${selectedMonth}&year=${selectedYear}&paymentStatus=${paymentFilter}&page=${currentPage}&limit=30&sort=${sortMode}`),
        fetchJson(`/api/recebimentos/stats?month=${selectedMonth}&year=${selectedYear}`),
        fetchJson('/api/vehicles'),
        fetchJson('/api/contratantes')
      ]);
      
      if (tripsData && tripsData.trips) {
        setTrips(tripsData.trips);
        setTotalPages(tripsData.totalPages);
      } else {
        setTrips(tripsData || []);
      }

      setStats(statsData);
      setVehicles(vehiclesData);
      setContratantes(contratantesData);

    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, paymentFilter, currentPage, sortMode]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.tripId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (trip.contratante?.ContratanteNome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (trip.frete?.cidade || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVehicle = vehicleFilter === '' || trip.vehicleId.toString() === vehicleFilter;
    const matchesContratante = contratanteFilter === '' || trip.contratanteId?.toString() === contratanteFilter;
    return matchesSearch && matchesVehicle && matchesContratante;
  });

  const totalFreight = filteredTrips.reduce((sum, t) => sum + (t.value || 0), 0);

  const renderStatCard = (title: string, value: number, colorClass: string, icon: React.ElementType, breakdownType: 'total' | 'received' | 'toReceive', showTripsCount: boolean = false) => {
    const breakdown = stats?.contractors || [];
    const totalVal = breakdown.reduce((sum, c) => sum + c[breakdownType], 0);

    return (
      <div className="bg-surface-dark p-6 rounded-xl border border-border-dark shadow-sm relative overflow-hidden group">
        <div className="flex justify-between items-start mb-4">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{title}</p>
          <div className={cn("p-2 rounded-lg", colorClass.replace('text-', 'bg-').concat('/10'))}>
            {React.createElement(icon, { className: cn("w-5 h-5", colorClass) })}
          </div>
        </div>
        <p className="text-3xl font-black text-white tracking-tight">
          {showValues ? formatCurrency(value) : '******'}
        </p>

        <div className="mt-2 flex flex-col gap-1.5">
          {showTripsCount && stats?.totalTrips !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-widest">
                {stats.totalTrips} Viagens Totais
              </span>
            </div>
          )}
          {breakdown.find(b => b.name === 'Reembolso') && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded uppercase tracking-widest">
                Reembolso: {showValues ? formatCurrency(breakdown.find(b => b.name === 'Reembolso')![breakdownType]) : '******'}
              </span>
            </div>
          )}
        </div>
        
        <div className="mt-6 pt-4 border-t border-border-dark space-y-3">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Por Contratante</h4>
          {breakdown.filter(b => b.name !== 'Reembolso').slice(0, 5).map((item, idx) => {
            const itemVal = item[breakdownType];
            const percentage = totalVal > 0 ? ((itemVal / totalVal) * 100).toFixed(1) + '%' : '0%';
            return (
              <div key={idx} className="flex flex-col gap-1">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-slate-400 truncate max-w-[150px]">{item.name}</span>
                  <span className="text-white">{showValues ? formatCurrency(itemVal) : '******'}</span>
                </div>
                <div className="h-1.5 w-full bg-background-dark rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full", colorClass.replace('text-', 'bg-'))}
                    style={{ width: percentage }}
                  />
                </div>
                <p className="text-[9px] font-bold text-right text-slate-500">{percentage}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <AppLayout>
      <Header 
        title="Recebimentos" 
        icon={Wallet}
        actionLabel="Nova Viagem" 
        onAction={() => router.push('/routes')}
      />
      
      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Filter Section */}
          <div className="flex flex-col gap-3">
            {/* Search Bar - Top priority */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input 
                type="text"
                placeholder="Buscar por ID, Contratante ou Cidade..."
                className="w-full bg-surface-dark border border-border-dark text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filters Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-2 md:gap-3">
              {/* Period - 2 columns on mobile */}
              <div className="col-span-2 lg:col-span-2 flex items-center gap-2 bg-surface-dark border border-border-dark rounded-xl p-1.5 shadow-sm">
                <div className="flex items-center gap-2 px-2 text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <select 
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="flex-1 bg-background-dark border border-border-dark text-white text-[11px] font-bold rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                >
                  {months.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <select 
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="w-20 bg-background-dark border border-border-dark text-white text-[11px] font-bold rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                >
                  {[2024, 2025, 2026].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {/* Payment Status */}
              <div className="relative col-span-1 lg:col-span-1">
                <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <select 
                  value={paymentFilter}
                  onChange={(e) => {
                    setPaymentFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-2.5 bg-surface-dark border border-border-dark text-white text-[11px] font-bold rounded-xl focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer appearance-none h-[42px]"
                >
                  <option value="all">Pagamento</option>
                  <option value="paid">Pagos</option>
                  <option value="unpaid">Pendentes</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none" />
              </div>

              {/* Vehicle Filter */}
              <div className="relative col-span-1 lg:col-span-1">
                <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <select 
                  className="w-full pl-9 pr-8 py-2.5 bg-surface-dark border border-border-dark text-white text-[11px] font-bold rounded-xl focus:outline-none focus:ring-1 focus:ring-primary transition-all appearance-none h-[42px] truncate"
                  value={vehicleFilter}
                  onChange={(e) => setVehicleFilter(e.target.value)}
                >
                  <option value="">Veículos</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id.toString()}>{v.plate}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none" />
              </div>

              {/* Contract Filter */}
              <div className="relative col-span-1 lg:col-span-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <select 
                  className="w-full pl-9 pr-8 py-2.5 bg-surface-dark border border-border-dark text-white text-[11px] font-bold rounded-xl focus:outline-none focus:ring-1 focus:ring-primary transition-all appearance-none h-[42px] truncate"
                  value={contratanteFilter}
                  onChange={(e) => setContratanteFilter(e.target.value)}
                >
                  <option value="">Contratos</option>
                  {contratantes.map(c => (
                    <option key={c.id} value={c.id.toString()}>{c.ContratanteNome}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none" />
              </div>

              {/* Action Buttons - Grouped */}
              <div className="col-span-1 lg:col-span-1 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setShowValues(!showValues)}
                  className="flex items-center justify-center bg-surface-dark border border-border-dark rounded-xl text-slate-400 hover:text-white transition-all shadow-sm h-[42px]"
                  title={showValues ? "Ocultar Valores" : "Mostrar Valores"}
                >
                  {showValues ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => {
                    const nextSort = sortMode === 'scheduled_asc' ? 'created_desc' : 'scheduled_asc';
                    setSortMode(nextSort);
                    setCurrentPage(1);
                  }}
                  className="flex items-center justify-center bg-surface-dark border border-border-dark rounded-xl text-slate-400 hover:text-white transition-all shadow-sm h-[42px]"
                  title="Ordenar"
                >
                  <ArrowUpDown className={cn("w-4 h-4", sortMode === 'created_desc' ? "text-primary" : "text-slate-400")} />
                </button>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="bg-surface-dark p-6 rounded-xl border border-border-dark shadow-sm animate-pulse h-64"></div>
              ))
            ) : (
              <>
                {renderStatCard('Receita Total', stats?.totalRevenue || 0, 'text-primary', DollarSign, 'total', true)}
                {renderStatCard('Valores Já Recebidos', stats?.received || 0, 'text-emerald-500', TrendingUp, 'received')}
                {renderStatCard('Valores a Receber', stats?.toReceive || 0, 'text-rose-500', TrendingDown, 'toReceive')}
              </>
            )}
          </div>

          {/* Chart Section */}
          <div className="bg-surface-dark rounded-xl border border-border-dark p-4 md:p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
              <div>
                <h3 className="text-lg font-bold text-white">Datas de Pagamento</h3>
                <p className="text-sm text-slate-500">Fluxo de recebimentos por data de pagamento - {months.find(m => m.id === selectedMonth)?.name} {selectedYear}</p>
              </div>
            </div>
            
            <div className="h-[250px] md:h-[350px] w-full">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center bg-background-dark/20 rounded-lg">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats?.chartData || []}>
                    <defs>
                      <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#393028" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#5A5A40" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      dy={10}
                      tickFormatter={(val) => format(parseISO(val), 'dd/MM')}
                    />
                    <YAxis 
                      stroke="#5A5A40" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => showValues ? `R$ ${value}` : '******'}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as ChartDataPoint;
                          return (
                            <div className="bg-[#27211b] border border-[#393028] p-3 rounded-lg shadow-xl">
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">
                                {format(parseISO(data.date), "dd 'de' MMMM", { locale: ptBR })}
                              </p>
                              <p className="text-sm font-bold text-emerald-500 mb-2">
                                Total: {showValues ? formatCurrency(data.total) : '******'}
                              </p>
                              <div className="space-y-1">
                                {data.contractors.map((c, idx) => (
                                  <div key={idx} className="flex justify-between gap-4 text-[10px]">
                                    <span className="text-slate-300">{c.name}</span>
                                    <span className="text-white font-bold">{showValues ? formatCurrency(c.value) : '******'}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="total" 
                      name="Recebido"
                      stroke="#10b981" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorReceived)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Trips Table */}
          <div className="bg-surface-dark rounded-xl border border-border-dark shadow-sm overflow-hidden">
            <div className="p-4 md:p-6 border-b border-border-dark flex flex-col sm:flex-row justify-between items-start sm:items-center bg-background-dark/30 gap-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Navigation className="w-4 h-4 text-primary" />
                Listagem de Viagens
              </h3>
              <div className="text-left sm:text-right w-full sm:w-auto">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Frete no Período</p>
                <p className="text-lg font-black text-primary">{showValues ? formatCurrency(totalFreight) : '******'}</p>
              </div>
            </div>

            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-background-dark/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4">Romaneio</th>
                    <th className="px-6 py-4">Contratante</th>
                    <th className="px-6 py-4">Rota</th>
                    <th className="px-6 py-4">Veículo</th>
                    <th className="px-6 py-4">Km rodados</th>
                    <th className="px-6 py-4">Valor Frete</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Pagamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dark">
                  {loading ? (
                    [1, 2, 3, 4, 5].map(i => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={8} className="px-6 py-8 bg-white/5"></td>
                      </tr>
                    ))
                  ) : filteredTrips.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-500 text-sm italic">
                        Nenhuma viagem encontrada para os filtros selecionados.
                      </td>
                    </tr>
                  ) : filteredTrips.map((trip) => (
                    <tr 
                      key={trip.id} 
                      className="hover:bg-white/5 transition-colors group cursor-pointer"
                      onClick={() => router.push(`/routes?edit=${trip.id}`)}
                    >
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-white">{format(parseISO(trip.scheduledAt.split('T')[0]), 'dd/MM/yyyy')}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-white">{trip.romaneio || '-'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-300">{trip.contratante?.ContratanteNome || '-'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm font-medium text-slate-400">
                          <MapPin className="w-3 h-3 text-primary/60" />
                          {trip.frete?.cidade || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-primary/60" />
                            <span className="text-sm font-medium text-slate-300">{trip.vehicle?.plate || '-'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Gauge className="w-3 h-3 text-primary" />
                            <span className="text-[10px] text-slate-500 font-mono">{trip.odometer || '0'} km</span>
                          </div>
                          {trip.expenses?.some(e => e.type.toUpperCase() === 'PEDÁGIO') && (
                            <div className="flex items-center gap-2 text-emerald-500">
                              <Ticket className="w-3 h-3" />
                              <span className="text-[10px] font-mono">
                                {showValues 
                                  ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                      trip.expenses
                                        .filter(e => e.type.toUpperCase() === 'PEDÁGIO')
                                        .reduce((sum, e) => sum + e.value, 0)
                                    )
                                  : '******'}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Gauge className="w-4 h-4 text-primary" />
                          <span className="text-sm font-bold text-white">{trip.distance || 0} km</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-white">{showValues ? formatCurrency(trip.value) : '******'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border",
                          trip.status === 'DELIVERED' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                          trip.status === 'IN_TRANSIT' ? "bg-primary/10 text-primary border-primary/20" :
                          "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        )}>
                          {trip.status === 'DELIVERED' ? 'Entregue' : 
                           trip.status === 'IN_TRANSIT' ? 'Em Trânsito' : 
                           trip.status === 'SCHEDULED' ? 'Agendado' : trip.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider w-fit",
                            trip.paid === 'sim' ? "bg-emerald-500/20 text-emerald-500" : "bg-rose-500/20 text-rose-500"
                          )}>
                            {trip.paid === 'sim' ? 'Pago' : 'Pendente'}
                          </span>
                          {trip.paymentDate && (
                            <p className="text-[9px] text-slate-500">
                              {format(new Date(trip.paymentDate), 'dd/MM/yyyy')}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-background-dark/30 border-t border-border-dark">
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-sm font-bold text-slate-400 text-right uppercase tracking-widest">Total da Página:</td>
                    <td className="px-6 py-4 text-sm font-black text-primary">{showValues ? formatCurrency(totalFreight) : '******'}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-border-dark">
              {loading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="p-8 flex justify-center">
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  </div>
                ))
              ) : filteredTrips.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-sm italic">
                  Nenhuma viagem encontrada.
                </div>
              ) : filteredTrips.map((trip) => (
                <div 
                  key={trip.id} 
                  className="p-4 space-y-3"
                  onClick={() => router.push(`/routes?edit=${trip.id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                          {format(parseISO(trip.scheduledAt.split('T')[0]), 'dd/MM/yyyy')}
                        </p>
                        {trip.romaneio && (
                          <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase tracking-widest">
                            Romaneio: {trip.romaneio}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-white mt-1">
                        {trip.contratante?.ContratanteNome || '-'}
                      </p>
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
                      trip.paid === 'sim' ? "bg-emerald-500/20 text-emerald-500" : "bg-rose-500/20 text-rose-500"
                    )}>
                      {trip.paid === 'sim' ? 'Pago' : 'Pendente'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rota</p>
                      <div className="flex items-center gap-1 text-xs text-slate-300 mt-1">
                        <MapPin className="w-3 h-3 text-primary/60" />
                        {trip.frete?.cidade || '-'}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Km rodados</p>
                      <div className="flex items-center gap-1 text-xs font-bold text-white mt-1">
                        <Gauge className="w-3 h-3 text-primary" />
                        {trip.distance || 0} km
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Valor Frete</p>
                      <p className="text-sm font-bold text-white text-right mt-1">
                        {showValues ? formatCurrency(trip.value) : '******'}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-border-dark/30">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Truck className="w-3 h-3 text-primary/60" />
                        <span className="text-xs text-slate-400">{trip.vehicle?.plate || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Gauge className="w-3 h-3 text-primary" />
                        <span className="text-[10px] text-slate-500 font-mono">{trip.odometer || '0'} km</span>
                      </div>
                      {trip.expenses?.some(e => e.type.toUpperCase() === 'PEDÁGIO') && (
                        <div className="flex items-center gap-2 text-emerald-500">
                          <Ticket className="w-3 h-3" />
                          <span className="text-[10px] font-mono">
                            {showValues 
                              ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                  trip.expenses
                                    .filter(e => e.type.toUpperCase() === 'PEDÁGIO')
                                    .reduce((sum, e) => sum + e.value, 0)
                                )
                              : '******'}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                      trip.status === 'DELIVERED' ? "text-emerald-500" :
                      trip.status === 'IN_TRANSIT' ? "text-primary" :
                      "text-blue-500"
                    )}>
                      {trip.status === 'DELIVERED' ? 'Entregue' : 
                       trip.status === 'IN_TRANSIT' ? 'Em Trânsito' : 
                       trip.status === 'SCHEDULED' ? 'Agendado' : trip.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            <div className="p-4 md:p-6 border-t border-border-dark flex items-center justify-between bg-background-dark/20">
              <p className="text-xs text-slate-500 font-medium">
                Página <span className="text-white font-bold">{currentPage}</span> de <span className="text-white font-bold">{totalPages}</span>
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 bg-surface-dark border border-border-dark rounded-lg text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-surface-dark border border-border-dark rounded-lg text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
