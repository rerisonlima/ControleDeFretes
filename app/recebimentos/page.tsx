'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import { Header } from '@/components/Header';
import { logoutAction } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { 
  Search, 
  MapPin, 
  Edit, 
  Trash2, 
  X,
  Check,
  Calendar,
  Truck,
  User,
  DollarSign,
  Copy,
  Receipt,
  Loader2,
  Gauge,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
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

const safeFormat = (dateString: string | null | undefined, formatStr: string, fallback: string = '') => {
  if (!dateString) return fallback;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return fallback;
  return format(date, formatStr);
};

interface Trip {
  id: number;
  tripId: string;
  routeId?: number;
  freteId?: number;
  contratanteId?: number;
  vehicleId: number;
  driverId: number;
  helperId?: number;
  scheduledAt: string;
  value: number;
  valor1aViagemMotorista?: number;
  valor2aViagemMotorista?: number;
  valor1aViagemAjudante?: number;
  valor2aViagemAjudante?: number;
  status: string;
  paid: string;
  contract?: string;
  odometer?: number;
  romaneio?: string;
  paymentDate?: string;
  vehicle?: { plate: string };
  contratante?: { ContratanteNome: string };
  createdBy?: { name: string; username: string };
  createdAt: string;
  frete?: { 
    cidade: string; 
    valorFrete: number; 
    valor1aViagemMotorista: number; 
    valor2aViagemMotorista: number; 
    valor1aViagemAjudante: number; 
    valor2aViagemAjudante: number 
  };
  route?: { destination: string };
}

interface Vehicle {
  id: number;
  plate: string;
  brand: string;
  model: string;
  categoriaId: number;
}

interface Employee {
  id: number;
  name: string;
  role: string;
}

interface Contratante {
  id: number;
  ContratanteNome: string;
}

interface Frete {
  id: number;
  cidade: string;
  contratanteId: number;
  categoriaId: number;
  categoria?: { CategoriaNome: string };
  valorFrete: number;
  valor1aViagemMotorista: number;
  valor2aViagemMotorista: number;
  valor1aViagemAjudante: number;
  valor2aViagemAjudante: number;
}

export default function RecebimentosPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = React.useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = React.useState(now.getFullYear());
  const [paymentFilter, setPaymentFilter] = React.useState('all');
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [contratantes, setContratantes] = React.useState<Contratante[]>([]);
  const [fretes, setFretes] = React.useState<Frete[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedTrip, setSelectedTrip] = React.useState<Trip | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [vehicleFilter, setVehicleFilter] = React.useState('');
  const [contratanteFilter, setContratanteFilter] = React.useState('');
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<number | null>(null);
  const [cloneConfirmId, setCloneConfirmId] = React.useState<number | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [user, setUser] = React.useState<{ name: string; role: string; username: string } | null>(null);
  const [userIp, setUserIp] = React.useState('');

  // Form state
  const [formData, setFormData] = React.useState({
    tripId: '',
    routeId: '',
    freteId: '',
    contratanteId: '',
    vehicleId: '',
    driverId: '',
    helperId: '',
    scheduledAt: '',
    value: '',
    valor1aViagemMotorista: '',
    valor2aViagemMotorista: '',
    valor1aViagemAjudante: '',
    valor2aViagemAjudante: '',
    status: 'SCHEDULED',
    paid: 'não',
    contract: '',
    odometer: '',
    romaneio: '',
    paymentDate: ''
  });

  const handleOpenDrawer = React.useCallback((trip: Trip | null = null, shouldOpen: boolean = true) => {
    if (trip) {
      setSelectedTrip(trip);
      setFormData({
        tripId: trip.tripId,
        routeId: trip.routeId?.toString() || '',
        freteId: trip.freteId?.toString() || '',
        contratanteId: trip.contratanteId?.toString() || '',
        vehicleId: trip.vehicleId.toString(),
        driverId: trip.driverId.toString(),
        helperId: trip.helperId?.toString() || '',
        scheduledAt: trip.scheduledAt ? safeFormat(trip.scheduledAt, 'yyyy-MM-dd') : '',
        value: trip.value?.toString() || '',
        valor1aViagemMotorista: trip.valor1aViagemMotorista?.toString() || '',
        valor2aViagemMotorista: trip.valor2aViagemMotorista?.toString() || '',
        valor1aViagemAjudante: trip.valor1aViagemAjudante?.toString() || '',
        valor2aViagemAjudante: trip.valor2aViagemAjudante?.toString() || '',
        status: trip.status,
        paid: trip.paid || 'não',
        contract: trip.contract || '',
        odometer: trip.odometer?.toString() || '',
        romaneio: trip.romaneio || '',
        paymentDate: trip.paymentDate ? safeFormat(trip.paymentDate, 'yyyy-MM-dd') : ''
      });
    } else {
      setSelectedTrip(null);
      setFormData({
        tripId: `TRIP-${Math.floor(1000 + Math.random() * 9000)}`,
        routeId: '',
        freteId: '',
        contratanteId: '',
        vehicleId: '',
        driverId: '',
        helperId: '',
        scheduledAt: format(new Date(), 'yyyy-MM-dd'),
        value: '',
        valor1aViagemMotorista: '',
        valor2aViagemMotorista: '',
        valor1aViagemAjudante: '',
        valor2aViagemAjudante: '',
        status: 'SCHEDULED',
        paid: 'não',
        contract: '',
        odometer: '',
        romaneio: '',
        paymentDate: ''
      });
    }
    if (shouldOpen) {
      setIsDrawerOpen(true);
    }
  }, []);

  React.useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      }
    };
    fetchSession();

    const fetchIp = async () => {
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        setUserIp(data.ip);
      } catch (error) {
        console.error('Error fetching IP:', error);
      }
    };
    fetchIp();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutAction();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const fetchJson = async (url: string, name: string) => {
        const res = await fetch(url);
        if (!res.ok) return [];
        return await res.json();
      };

      // Fetch with a large limit to avoid pagination as requested
      const [tripsResponse, vehiclesData, employeesData, contratantesData, fretesData] = await Promise.all([
        fetchJson(`/api/trips?month=${selectedMonth}&year=${selectedYear}&paymentStatus=${paymentFilter}&limit=1000`, 'Trips'),
        fetchJson('/api/vehicles', 'Vehicles'),
        fetchJson('/api/employees', 'Employees'),
        fetchJson('/api/contratantes', 'Contratantes'),
        fetchJson('/api/fretes', 'Fretes')
      ]);

      if (tripsResponse && tripsResponse.trips) {
        setTrips(tripsResponse.trips);
      } else {
        setTrips(tripsResponse || []);
      }
      
      setVehicles(vehiclesData);
      setEmployees(employeesData);
      setContratantes(contratantesData);
      setFretes(fretesData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, paymentFilter]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const url = selectedTrip ? `/api/trips/${selectedTrip.id}` : '/api/trips';
      const method = selectedTrip ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setIsDrawerOpen(false);
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao salvar viagem');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Erro de conexão ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/trips/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setDeleteConfirmId(null);
        fetchData();
      } else {
        const data = await response.json();
        alert(data.error || 'Erro ao excluir viagem');
        setDeleteConfirmId(null);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Erro de conexão ao excluir');
    }
  };

  const handleClone = async (trip: Trip) => {
    try {
      const newTripId = `TRIP-${Math.floor(1000 + Math.random() * 9000)}`;
      const cloneData = {
        tripId: newTripId,
        routeId: trip.routeId?.toString() || '',
        freteId: trip.freteId?.toString() || '',
        contratanteId: trip.contratanteId?.toString() || '',
        vehicleId: trip.vehicleId?.toString() || '',
        driverId: trip.driverId?.toString() || '',
        helperId: trip.helperId?.toString() || '',
        scheduledAt: trip.scheduledAt ? safeFormat(trip.scheduledAt, 'yyyy-MM-dd') : safeFormat(new Date().toISOString(), 'yyyy-MM-dd'),
        value: trip.value?.toString() || '0',
        valor1aViagemMotorista: trip.valor1aViagemMotorista?.toString() || '',
        valor2aViagemMotorista: trip.valor2aViagemMotorista?.toString() || '',
        valor1aViagemAjudante: trip.valor1aViagemAjudante?.toString() || '',
        valor2aViagemAjudante: trip.valor2aViagemAjudante?.toString() || '',
        status: trip.status || 'SCHEDULED',
        paid: 'não',
        contract: trip.contract || '',
        odometer: trip.odometer?.toString() || '',
        romaneio: trip.romaneio || '',
        paymentDate: ''
      };

      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cloneData)
      });

      if (response.ok) {
        setCloneConfirmId(null);
        fetchData();
      } else {
        const error = await response.json();
        alert(error.details || error.error || 'Erro ao clonar viagem');
        setCloneConfirmId(null);
      }
    } catch (error) {
      console.error('Clone error:', error);
      alert('Erro de conexão ao clonar');
      setCloneConfirmId(null);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  const filteredTrips = trips.filter(trip => {
    const destination = trip.frete?.cidade || trip.route?.destination || '';
    const contract = trip.contratante?.ContratanteNome || trip.contract || '';
    const romaneio = trip.romaneio || '';
    const matchesSearch = destination.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         contract.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         romaneio.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVehicle = vehicleFilter === '' || trip.vehicleId.toString() === vehicleFilter;
    const matchesContratante = contratanteFilter === '' || trip.contratanteId?.toString() === contratanteFilter;
    return matchesSearch && matchesVehicle && matchesContratante;
  });

  // Summary Calculations
  const totalToReceive = React.useMemo(() => 
    filteredTrips
      .filter(t => t.paid !== 'sim')
      .reduce((acc, t) => acc + (t.value || 0), 0)
  , [filteredTrips]);

  const totalReceived = React.useMemo(() => 
    filteredTrips
      .filter(t => t.paid === 'sim')
      .reduce((acc, t) => acc + (t.value || 0), 0)
  , [filteredTrips]);

  // Chart Data
  const chartData = React.useMemo(() => {
    const dataMap: Record<string, number> = {};
    filteredTrips.forEach(trip => {
      if (trip.paid === 'sim' && trip.paymentDate) {
        const date = safeFormat(trip.paymentDate, 'dd/MM');
        dataMap[date] = (dataMap[date] || 0) + (trip.value || 0);
      }
    });
    return Object.entries(dataMap)
      .map(([date, value]) => ({ date, value }))
      .sort((a, b) => {
        const [dayA, monthA] = a.date.split('/').map(Number);
        const [dayB, monthB] = b.date.split('/').map(Number);
        if (monthA !== monthB) return monthA - monthB;
        return dayA - dayB;
      });
  }, [filteredTrips]);

  return (
    <AppLayout>
      <Header 
        title="Recebimentos" 
        icon={Receipt}
        actionLabel="Nova Viagem" 
        onAction={() => handleOpenDrawer()}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-4 md:p-8 pb-4 space-y-6">
            <div className="flex flex-col md:flex-row items-start justify-between gap-4">
              <div>
                <p className="text-slate-500 mt-1">Acompanhe os valores recebidos e a receber das suas viagens.</p>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface-dark border border-border-dark rounded-2xl p-6 shadow-sm flex items-center justify-between"
              >
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Valores a Receber</p>
                  <h3 className="text-2xl font-black text-rose-500">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalToReceive)}
                  </h3>
                </div>
                <div className="p-3 bg-rose-500/10 rounded-xl">
                  <Wallet className="w-6 h-6 text-rose-500" />
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-surface-dark border border-border-dark rounded-2xl p-6 shadow-sm flex items-center justify-between"
              >
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Valores Recebidos</p>
                  <h3 className="text-2xl font-black text-emerald-500">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalReceived)}
                  </h3>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-emerald-500" />
                </div>
              </motion.div>
            </div>

            {/* Chart Section */}
            {chartData.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-surface-dark border border-border-dark rounded-2xl p-6 shadow-sm"
              >
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6">Recebimentos por Data</h4>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis 
                        dataKey="date" 
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
                        itemStyle={{ color: '#10b981', fontSize: '12px', fontWeight: 'bold' }}
                        labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '4px' }}
                        formatter={(value: number) => [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), 'Valor']}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill="#10b981" fillOpacity={0.8} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {/* Filter Bar */}
            <div className="space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2 md:gap-3 bg-surface-dark border border-border-dark rounded-xl p-1.5 shadow-sm">
                  <div className="flex items-center gap-2 px-2 md:px-3 py-1.5 text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">Período:</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <select 
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                      className="bg-background-dark border border-border-dark text-white text-[10px] md:text-xs font-bold rounded-lg px-2 md:px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                    >
                      {months.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>

                    <select 
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="bg-background-dark border border-border-dark text-white text-[10px] md:text-xs font-bold rounded-lg px-2 md:px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                    >
                      {[2024, 2025, 2026].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-surface-dark border border-border-dark rounded-xl p-1.5 shadow-sm w-fit">
                  <div className="flex items-center gap-2 px-2 md:px-3 py-1.5 text-slate-400">
                    <Receipt className="w-4 h-4" />
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">Pagamento:</span>
                  </div>
                  
                  <select 
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value)}
                    className="bg-background-dark border border-border-dark text-white text-[10px] md:text-xs font-bold rounded-lg px-2 md:px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                  >
                    <option value="all">Todos</option>
                    <option value="paid">Pagos</option>
                    <option value="unpaid">Não Pagos</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <input 
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none" 
                    placeholder="Busque por cidade, romaneio ou contrato" 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="relative">
                  <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <select 
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none appearance-none"
                    value={vehicleFilter}
                    onChange={(e) => setVehicleFilter(e.target.value)}
                  >
                    <option value="">Todos os Veículos</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <select 
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none appearance-none"
                    value={contratanteFilter}
                    onChange={(e) => setContratanteFilter(e.target.value)}
                  >
                    <option value="">Todos os Contratos</option>
                    {contratantes.map(c => (
                      <option key={c.id} value={c.id}>{c.ContratanteNome}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-auto px-4 md:px-8 pb-8 custom-scrollbar">
            {/* Desktop Table */}
            <div className="hidden md:block border border-border-dark rounded-xl bg-surface-dark overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-background-dark/50 border-b border-border-dark">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Pago</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Data</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Destino</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Contrato</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Veículo</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Valor Frete</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dark">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500">Carregando recebimentos...</td>
                    </tr>
                  ) : filteredTrips.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500">Nenhum registro encontrado.</td>
                    </tr>
                  ) : filteredTrips.map((trip) => (
                    <tr 
                      key={trip.id} 
                      className="hover:bg-white/5 transition-colors group cursor-pointer"
                      onClick={() => handleOpenDrawer(trip)}
                    >
                      <td className={cn(
                        "px-6 py-4 transition-colors",
                        (trip.paid === 'sim' && trip.paymentDate) ? "bg-emerald-500/30" : ""
                      )}>
                        <span className={cn(
                          "px-3 py-1 rounded-lg text-xs font-bold uppercase transition-colors",
                          trip.paid === 'sim' ? "bg-emerald-500 text-background-dark" : "bg-surface-dark text-slate-500 border border-border-dark"
                        )}>
                          {trip.paid || 'não'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-4 h-4 text-primary" />
                          <span className="font-mono text-sm text-slate-300">{formatDate(trip.scheduledAt)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="font-semibold text-white">{trip.frete?.cidade || trip.route?.destination || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-400">{trip.contratante?.ContratanteNome || trip.contract || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Truck className="w-4 h-4 text-slate-500" />
                          <span className="text-sm text-slate-400">{trip.vehicle?.plate || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-slate-300">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(trip.value)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {deleteConfirmId === trip.id ? (
                            <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                              <button 
                                onClick={() => handleDelete(trip.id)}
                                className="px-3 py-1 bg-rose-500 text-white text-[10px] font-bold rounded hover:bg-rose-600 transition-colors"
                              >
                                Confirmar
                              </button>
                              <button 
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-3 py-1 bg-slate-700 text-slate-300 text-[10px] font-bold rounded hover:bg-slate-600 transition-colors"
                              >
                                Sair
                              </button>
                            </div>
                          ) : cloneConfirmId === trip.id ? (
                            <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                              <button 
                                onClick={() => handleClone(trip)}
                                className="px-3 py-1 bg-amber-500 text-background-dark text-[10px] font-bold rounded hover:bg-amber-600 transition-colors"
                              >
                                Confirmar Clone
                              </button>
                              <button 
                                onClick={() => setCloneConfirmId(null)}
                                className="px-3 py-1 bg-slate-700 text-slate-300 text-[10px] font-bold rounded hover:bg-slate-600 transition-colors"
                              >
                                Sair
                              </button>
                            </div>
                          ) : (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setCloneConfirmId(trip.id); }}
                                className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
                                title="Clonar Viagem"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleOpenDrawer(trip); }}
                                className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(trip.id); }}
                                className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {loading ? (
                <div className="p-12 text-center text-slate-500">Carregando...</div>
              ) : filteredTrips.length === 0 ? (
                <div className="p-12 text-center text-slate-500">Nenhum registro encontrado.</div>
              ) : filteredTrips.map((trip) => (
                <div 
                  key={trip.id}
                  className={cn(
                    "bg-surface-dark border border-border-dark rounded-2xl p-4 space-y-4 relative overflow-hidden",
                    (trip.paid === 'sim' && trip.paymentDate) ? "border-emerald-500/30 bg-emerald-500/5" : ""
                  )}
                  onClick={() => handleOpenDrawer(trip)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-mono text-slate-300">{formatDate(trip.scheduledAt)}</span>
                      </div>
                      <h4 className="text-lg font-bold text-white flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        {trip.frete?.cidade || trip.route?.destination || 'N/A'}
                      </h4>
                      <p className="text-xs text-slate-400">{trip.contratante?.ContratanteNome || trip.contract || '-'}</p>
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-bold uppercase",
                      trip.paid === 'sim' ? "bg-emerald-500 text-background-dark" : "bg-background-dark text-slate-500 border border-border-dark"
                    )}>
                      {trip.paid === 'sim' ? 'Pago' : 'Pendente'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-3 border-y border-border-dark/50">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Veículo</p>
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <Truck className="w-3.5 h-3.5" />
                        {trip.vehicle?.plate || 'N/A'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Valor Frete</p>
                      <p className="text-sm font-bold text-primary">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(trip.value)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => { setCloneConfirmId(trip.id); }}
                        className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleOpenDrawer(trip)}
                        className="p-2.5 bg-primary/10 text-primary rounded-xl"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setDeleteConfirmId(trip.id)}
                        className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-surface-dark/30 border-t border-border-dark flex justify-center">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                Total de {filteredTrips.length} registros exibidos
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Side Panel (Drawer) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <aside className="w-full max-w-[450px] bg-background-dark h-full shadow-2xl border-l border-border-dark flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-border-dark flex items-center justify-between bg-primary/5">
              <h3 className="text-xl font-bold text-white">{selectedTrip ? 'Editar Viagem' : 'Nova Viagem'}</h3>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Data da Viagem</label>
                    <input 
                      className="w-full px-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none" 
                      type="date"
                      value={formData.scheduledAt}
                      onChange={(e) => setFormData({...formData, scheduledAt: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Veículo</label>
                    <select 
                      className="w-full px-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none"
                      value={formData.vehicleId}
                      onChange={(e) => setFormData({...formData, vehicleId: e.target.value})}
                    >
                      <option value="">Selecionar Veículo</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Contrato</label>
                    <select 
                      className="w-full px-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none"
                      value={formData.contratanteId}
                      onChange={(e) => setFormData({...formData, contratanteId: e.target.value})}
                    >
                      <option value="">Selecionar Contratante</option>
                      {contratantes.map(c => (
                        <option key={c.id} value={c.id}>{c.ContratanteNome}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Destino</label>
                    <select 
                      className="w-full px-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none"
                      value={formData.freteId}
                      onChange={(e) => {
                        const selectedFreteId = e.target.value;
                        const frete = fretes.find(f => f.id.toString() === selectedFreteId);
                        if (frete) {
                          setFormData({
                            ...formData, 
                            freteId: selectedFreteId,
                            value: frete.valorFrete.toString()
                          });
                        } else {
                          setFormData({...formData, freteId: selectedFreteId, value: ''});
                        }
                      }}
                    >
                      <option value="">Selecionar Destino</option>
                      {fretes
                        .filter(f => f.contratanteId.toString() === formData.contratanteId)
                        .map(f => (
                          <option key={f.id} value={f.id}>{f.cidade} (R$ {f.valorFrete})</option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-primary uppercase tracking-widest block">Valor do Frete</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-primary/50">R$</span>
                    <input 
                      className="w-full pl-12 pr-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm font-bold text-white outline-none" 
                      type="number"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => setFormData({...formData, value: e.target.value})}
                    />
                  </div>
                </div>

                <hr className="border-border-dark" />

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    <h4 className="font-bold text-[10px] uppercase tracking-widest text-emerald-500">Informações de Pagamento</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-500 uppercase tracking-widest block">Pago</label>
                      <select 
                        className="w-full px-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none"
                        value={formData.paid}
                        onChange={(e) => setFormData({...formData, paid: e.target.value})}
                      >
                        <option value="não">Não</option>
                        <option value="sim">Sim</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-500 uppercase tracking-widest block">Data Pagamento</label>
                      <input 
                        className="w-full px-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none" 
                        type="date"
                        value={formData.paymentDate}
                        onChange={(e) => setFormData({...formData, paymentDate: e.target.value})}
                        disabled={formData.paid === 'não'}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-border-dark bg-background-dark/50 flex items-center gap-4">
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="px-6 py-3 rounded-lg border border-border-dark text-slate-400 font-bold hover:bg-surface-dark hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-primary hover:bg-primary/90 text-background-dark py-3 rounded-lg font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {isSaving ? 'Salvando...' : selectedTrip ? 'Atualizar' : 'Cadastrar'}
              </button>
            </div>
          </aside>
        </div>
      )}
    </AppLayout>
  );
}
