'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import { Header } from '@/components/Header';
import { motion } from 'motion/react';
import { 
  Search, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Filter,
  ArrowUpRight,
  Loader2,
  ChevronLeft,
  ChevronRight,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
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
  scheduledAt: string;
  value: number;
  status: string;
  paid: string;
  contract?: string;
  romaneio?: string;
  paymentDate?: string;
  vehicle?: { plate: string };
  contratante?: { ContratanteNome: string };
  frete?: { cidade: string };
  route?: { destination: string };
}

interface Vehicle {
  id: number;
  plate: string;
}

interface Contratante {
  id: number;
  ContratanteNome: string;
}

export default function RecebimentosPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = React.useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = React.useState(now.getFullYear());
  const [vehicleFilter, setVehicleFilter] = React.useState('all');
  const [contractorFilter, setContractorFilter] = React.useState('all');
  const [searchTerm, setSearchTerm] = React.useState('');
  const [paymentFilter, setPaymentFilter] = React.useState('all');
  
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({
    totalToReceive: 0,
    totalReceived: 0,
    chartData: [] as { date: string; formattedDate: string; value: number }[]
  });
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [contratantes, setContratantes] = React.useState<Contratante[]>([]);
  
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, tripsRes, vehiclesRes, contratantesRes] = await Promise.all([
        fetch(`/api/recebimentos/stats?month=${selectedMonth}&year=${selectedYear}&vehicleId=${vehicleFilter}&contractorId=${contractorFilter}&search=${searchTerm}`),
        fetch(`/api/trips?month=${selectedMonth}&year=${selectedYear}&paymentStatus=${paymentFilter}&vehicleId=${vehicleFilter}&contractorId=${contractorFilter}&search=${searchTerm}&page=${currentPage}&limit=20`),
        fetch('/api/vehicles'),
        fetch('/api/contratantes')
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (tripsRes.ok) {
        const data = await tripsRes.json();
        setTrips(data.trips || []);
        setTotalPages(data.totalPages || 1);
      }
      if (vehiclesRes.ok) setVehicles(await vehiclesRes.json());
      if (contratantesRes.ok) setContratantes(await contratantesRes.json());
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, vehicleFilter, contractorFilter, searchTerm, paymentFilter, currentPage]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-background-dark">
          {/* Filters Section */}
          <section className="bg-surface-dark border border-border-dark rounded-2xl p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-primary">
                <Filter className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Filtros</span>
              </div>
              
              <div className="flex flex-wrap gap-3 flex-1">
                <select 
                  className="bg-background-dark border border-border-dark text-white text-xs rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary transition-all"
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  {months.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>

                <select 
                  className="bg-background-dark border border-border-dark text-white text-xs rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary transition-all"
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(parseInt(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  {[2024, 2025, 2026].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>

                <select 
                  className="bg-background-dark border border-border-dark text-white text-xs rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary transition-all"
                  value={vehicleFilter}
                  onChange={(e) => {
                    setVehicleFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">Todos Veículos</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.plate}</option>
                  ))}
                </select>

                <select 
                  className="bg-background-dark border border-border-dark text-white text-xs rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary transition-all"
                  value={contractorFilter}
                  onChange={(e) => {
                    setContractorFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">Todos Contratantes</option>
                  {contratantes.map(c => (
                    <option key={c.id} value={c.id}>{c.ContratanteNome}</option>
                  ))}
                </select>

                <select 
                  className="bg-background-dark border border-border-dark text-white text-xs rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-primary transition-all"
                  value={paymentFilter}
                  onChange={(e) => {
                    setPaymentFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">Status Pagamento</option>
                  <option value="pago">Pago</option>
                  <option value="pendente">Pendente</option>
                </select>

                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input 
                    type="text"
                    placeholder="Buscar por ID, Contrato ou Romaneio..."
                    className="w-full bg-background-dark border border-border-dark text-white text-xs rounded-lg pl-10 pr-4 py-2 outline-none focus:ring-1 focus:ring-primary transition-all"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Stats Cards Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface-dark border border-border-dark rounded-2xl p-6 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <DollarSign className="w-16 h-16 text-primary" />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Valores Totais a Receber</span>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white tracking-tight">
                    {loading ? <Loader2 className="w-8 h-8 animate-spin text-primary" /> : formatCurrency(stats.totalToReceive)}
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Total faturado no período selecionado</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-primary bg-primary/5 w-fit px-2 py-1 rounded-full">
                  <TrendingUp className="w-3 h-3" />
                  <span>PREVISÃO DE RECEITA</span>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-surface-dark border border-border-dark rounded-2xl p-6 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <CheckCircle className="w-16 h-16 text-emerald-500" />
              </div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Valores Recebidos</span>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white tracking-tight">
                    {loading ? <Loader2 className="w-8 h-8 animate-spin text-emerald-500" /> : formatCurrency(stats.totalReceived)}
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">Total já liquidado no período</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500 bg-emerald-500/5 w-fit px-2 py-1 rounded-full">
                  <ArrowUpRight className="w-3 h-3" />
                  <span>{stats.totalToReceive > 0 ? ((stats.totalReceived / stats.totalToReceive) * 100).toFixed(1) : 0}% LIQUIDADO</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Chart Section */}
          <section className="bg-surface-dark border border-border-dark rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Fluxo de Recebimentos</h4>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest">Valores recebidos por data de pagamento</p>
                </div>
              </div>
            </div>
            
            <div className="h-[300px] w-full">
              {loading ? (
                <div className="h-full w-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.chartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#facc15" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#facc15" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis 
                      dataKey="formattedDate" 
                      stroke="#64748b" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `R$ ${value}`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                      itemStyle={{ color: '#facc15', fontSize: '12px' }}
                      labelStyle={{ color: '#64748b', fontSize: '10px', marginBottom: '4px' }}
                      formatter={(value: number) => [formatCurrency(value), 'Recebido']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#facc15" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          {/* Trip List Table */}
          <section className="bg-surface-dark border border-border-dark rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border-dark flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-bold text-white uppercase tracking-widest">Listagem de Viagens</h4>
              </div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Mostrando {trips.length} registros
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-background-dark/50">
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Data</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">ID / Romaneio</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contrato</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Veículo</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Destino</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Valor</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pagamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dark">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                        <p className="text-xs text-slate-500 mt-2 uppercase tracking-widest">Carregando viagens...</p>
                      </td>
                    </tr>
                  ) : trips.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center">
                        <p className="text-xs text-slate-500 uppercase tracking-widest">Nenhuma viagem encontrada</p>
                      </td>
                    </tr>
                  ) : (
                    trips.map((trip) => (
                      <tr key={trip.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-white">{format(parseISO(trip.scheduledAt), 'dd/MM/yyyy')}</span>
                            <span className="text-[10px] text-slate-500">{format(parseISO(trip.scheduledAt), 'HH:mm')}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-primary">{trip.tripId}</span>
                            <span className="text-[10px] text-slate-500">{trip.romaneio || '-'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-xs text-slate-300">{trip.contratante?.ContratanteNome || trip.contract || '-'}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-xs font-mono text-slate-300">{trip.vehicle?.plate || '-'}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-xs text-slate-300 truncate max-w-[150px] block">
                            {trip.frete?.cidade || trip.route?.destination || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-xs font-bold text-white">{formatCurrency(trip.value)}</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest",
                            trip.status === 'DELIVERED' ? "bg-emerald-500/10 text-emerald-500" :
                            trip.status === 'CANCELLED' ? "bg-rose-500/10 text-rose-500" :
                            "bg-amber-500/10 text-amber-500"
                          )}>
                            {trip.status === 'DELIVERED' ? 'Entregue' : 
                             trip.status === 'CANCELLED' ? 'Cancelado' : 
                             trip.status === 'IN_TRANSIT' ? 'Em Trânsito' : 'Agendado'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              {trip.paid === 'sim' ? (
                                <CheckCircle className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Clock className="w-3 h-3 text-amber-500" />
                              )}
                              <span className={cn(
                                "text-[10px] font-bold uppercase tracking-widest",
                                trip.paid === 'sim' ? "text-emerald-500" : "text-amber-500"
                              )}>
                                {trip.paid === 'sim' ? 'Pago' : 'Pendente'}
                              </span>
                            </div>
                            {trip.paid === 'sim' && trip.paymentDate && (
                              <span className="text-[9px] text-slate-500 ml-4">
                                {format(parseISO(trip.paymentDate), 'dd/MM/yyyy')}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-border-dark flex items-center justify-between">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    disabled={currentPage === 1 || loading}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="p-2 rounded-lg bg-background-dark border border-border-dark text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    disabled={currentPage === totalPages || loading}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="p-2 rounded-lg bg-background-dark border border-border-dark text-slate-400 hover:text-white disabled:opacity-50 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </AppLayout>
  );
}
