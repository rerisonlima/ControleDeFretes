'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import { Header } from '@/components/Header';
import { logoutAction } from '@/app/actions/auth';
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
  Receipt,
  Loader2,
  Gauge,
  ChevronRight,
  ChevronLeft,
  Copy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

export default function ReceiptsPage() {
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
  const [isNavigatingToExpenses, setIsNavigatingToExpenses] = React.useState(false);
  const [user, setUser] = React.useState<{ name: string; role: string; username: string } | null>(null);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [userIp, setUserIp] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalRecords, setTotalRecords] = React.useState(0);

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

  const scheduledAtRef = React.useRef<HTMLInputElement>(null);
  const vehicleIdRef = React.useRef<HTMLSelectElement>(null);
  const odometerRef = React.useRef<HTMLInputElement>(null);
  const contratanteIdRef = React.useRef<HTMLSelectElement>(null);
  const romaneioRef = React.useRef<HTMLInputElement>(null);
  const freteIdRef = React.useRef<HTMLSelectElement>(null);
  const driverIdRef = React.useRef<HTMLSelectElement>(null);
  const helperIdRef = React.useRef<HTMLSelectElement>(null);

  const handleNextField = (nextRef: React.RefObject<HTMLInputElement | HTMLSelectElement | null>) => {
    setTimeout(() => {
      nextRef.current?.focus();
    }, 50);
  };

  React.useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          if (data.role === 'OPERATOR') {
            handleOpenDrawer(null, false);
          }
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
  }, [handleOpenDrawer]);

  const isOperator = user?.role === 'OPERATOR';

  const handleLogout = async () => {
    try {
      await logoutAction();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleGoToExpenses = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsNavigatingToExpenses(true);
    setTimeout(() => {
      window.location.href = '/expenses?new=true';
    }, 100);
  };

  const renderFormContent = () => (
    <div className="space-y-6">
      {isOperator && (
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-primary">Precisa lançar uma despesa?</span>
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => handleGoToExpenses(e)}
            disabled={isNavigatingToExpenses}
            className="text-xs font-bold bg-primary text-background-dark px-4 py-2 rounded-lg hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-70 shadow-lg shadow-primary/20"
          >
            {isNavigatingToExpenses ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
            {isNavigatingToExpenses ? 'Encaminhando...' : 'Ir para Despesas'}
          </motion.button>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Data</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input 
              ref={scheduledAtRef}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none disabled:opacity-50 disabled:cursor-not-allowed" 
              type="date"
              value={formData.scheduledAt}
              onChange={(e) => setFormData({...formData, scheduledAt: e.target.value})}
              onKeyDown={(e) => e.key === 'Enter' && handleNextField(vehicleIdRef)}
              disabled={!formData.vehicleId}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Veículo</label>
          <select 
            ref={vehicleIdRef}
            className="w-full px-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none"
            value={formData.vehicleId}
            onChange={(e) => {
              const vehicleId = e.target.value;
              setFormData(prev => ({
                ...prev, 
                vehicleId,
                freteId: '',
                value: '',
                valor1aViagemMotorista: '',
                valor2aViagemMotorista: '',
                valor1aViagemAjudante: '',
                valor2aViagemAjudante: ''
              }));
              if (vehicleId) handleNextField(odometerRef);
            }}
          >
            <option value="">Selecionar Veículo</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Odômetro</label>
          <div className="relative">
            <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 text-primary w-4 h-4" />
            <input 
              ref={odometerRef}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Km Inicial"
              type="number"
              value={formData.odometer}
              onChange={(e) => setFormData({...formData, odometer: e.target.value})}
              onKeyDown={(e) => e.key === 'Enter' && handleNextField(contratanteIdRef)}
              disabled={!formData.vehicleId}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Contrato</label>
          <select 
            ref={contratanteIdRef}
            className="w-full px-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            value={formData.contratanteId}
            onChange={(e) => {
              const contratanteId = e.target.value;
              setFormData({...formData, contratanteId, freteId: '', value: '', valor1aViagemMotorista: '', valor2aViagemMotorista: '', valor1aViagemAjudante: '', valor2aViagemAjudante: ''});
              if (contratanteId) handleNextField(freteIdRef);
            }}
            disabled={!formData.vehicleId}
          >
            <option value="">Selecionar Contratante</option>
            {contratantes.map(c => (
              <option key={c.id} value={c.id}>{c.ContratanteNome}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Rota / Destino</label>
          <select 
            ref={freteIdRef}
            className="w-full px-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            value={formData.freteId}
            onChange={(e) => {
              const selectedFreteId = e.target.value;
              const frete = fretes.find(f => f.id.toString() === selectedFreteId);
              if (frete) {
                setFormData({
                  ...formData, 
                  freteId: selectedFreteId,
                  value: frete.valorFrete.toString(),
                  valor1aViagemMotorista: frete.valor1aViagemMotorista.toString(),
                  valor2aViagemMotorista: frete.valor2aViagemMotorista.toString(),
                  valor1aViagemAjudante: frete.valor1aViagemAjudante.toString(),
                  valor2aViagemAjudante: frete.valor2aViagemAjudante.toString()
                });
                handleNextField(romaneioRef);
              } else {
                setFormData({
                  ...formData, 
                  freteId: selectedFreteId,
                  value: '',
                  valor1aViagemMotorista: '',
                  valor2aViagemMotorista: '',
                  valor1aViagemAjudante: '',
                  valor2aViagemAjudante: ''
                });
              }
            }}
            disabled={!formData.contratanteId || !formData.vehicleId}
          >
            <option value="">Selecionar Destino</option>
            {fretes
              .filter(f => {
                const matchesContratante = f.contratanteId.toString() === formData.contratanteId;
                const selectedVehicle = vehicles.find(v => v.id.toString() === formData.vehicleId);
                const matchesCategoria = selectedVehicle ? f.categoriaId === selectedVehicle.categoriaId : false;
                return matchesContratante && matchesCategoria;
              })
              .map(f => (
                <option key={f.id} value={f.id}>
                  {f.cidade} {isOperator ? '' : `- ${f.categoria?.CategoriaNome} (R$ ${f.valorFrete})`}
                </option>
              ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Romaneio</label>
          <input 
            ref={romaneioRef}
            className="w-full px-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Número do Romaneio"
            type="text"
            value={formData.romaneio}
            onChange={(e) => setFormData({...formData, romaneio: e.target.value})}
            onKeyDown={(e) => e.key === 'Enter' && handleNextField(driverIdRef)}
            disabled={!formData.vehicleId}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Motorista</label>
          <select 
            ref={driverIdRef}
            className="w-full px-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            value={formData.driverId}
            onChange={(e) => {
              const driverId = e.target.value;
              setFormData({...formData, driverId});
              if (driverId) handleNextField(helperIdRef);
            }}
            disabled={!formData.vehicleId}
          >
            <option value="">Selecionar</option>
            {employees.filter(e => e.role.toLowerCase() === 'motorista').map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Ajudante</label>
          <select 
            ref={helperIdRef}
            className="w-full px-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            value={formData.helperId}
            onChange={(e) => setFormData({...formData, helperId: e.target.value})}
            disabled={!formData.vehicleId}
          >
            <option value="">Selecionar</option>
            {employees.filter(e => e.role.toLowerCase() === 'ajudante').map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>
      </div>

      {!isOperator && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-primary uppercase tracking-widest block">Valor do Frete</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-primary/50">R$</span>
                <input 
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm font-bold text-white outline-none" 
                  placeholder="0,00" 
                  type="number"
                  step="0.01"
                  value={formData.value}
                  readOnly
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Status</label>
              <select 
                className="w-full px-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                disabled={!formData.vehicleId}
              >
                <option value="SCHEDULED">Agendado</option>
                <option value="IN_TRANSIT">Em Trânsito</option>
                <option value="DELIVERED">Entregue</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>
          </div>

          <hr className="border-border-dark" />

          {/* Payment Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <h4 className="font-bold text-[10px] uppercase tracking-widest text-emerald-500">Informações de Recebimento</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block">Recebido</label>
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
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block">Data Recebimento</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input 
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none" 
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({...formData, paymentDate: e.target.value})}
                    disabled={formData.paid === 'não'}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const fetchJson = async (url: string) => {
        const res = await fetch(url);
        if (!res.ok) return [];
        return await res.json();
      };

      const [tripsResponse, vehiclesData, employeesData, contratantesData, fretesData] = await Promise.all([
        fetchJson(`/api/receipts?month=${selectedMonth}&year=${selectedYear}&paymentStatus=${paymentFilter}&page=${currentPage}&limit=30`),
        fetchJson('/api/vehicles'),
        fetchJson('/api/employees'),
        fetchJson('/api/contratantes'),
        fetchJson('/api/fretes')
      ]);

      if (tripsResponse && tripsResponse.trips) {
        setTrips(tripsResponse.trips);
        setTotalPages(tripsResponse.totalPages);
        setTotalRecords(tripsResponse.total);
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
  }, [selectedMonth, selectedYear, paymentFilter, currentPage]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const url = selectedTrip ? `/api/receipts/${selectedTrip.id}` : '/api/receipts';
      const method = selectedTrip ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        if (user?.role === 'OPERATOR') {
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 15000);
          handleOpenDrawer(null, false);
          setTimeout(() => {
            vehicleIdRef.current?.focus();
          }, 100);
        } else {
          setIsDrawerOpen(false);
          fetchData();
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao salvar recebimento');
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
      const response = await fetch(`/api/receipts/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setDeleteConfirmId(null);
        fetchData();
      } else {
        const data = await response.json();
        alert(data.error || 'Erro ao excluir recebimento');
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

      const response = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cloneData)
      });

      if (response.ok) {
        setCloneConfirmId(null);
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao clonar recebimento');
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

  return (
    <AppLayout>
      <Header 
        title="Recebimentos" 
        icon={DollarSign}
        actionLabel={user?.role === 'OPERATOR' ? undefined : "Novo Recebimento"} 
        onAction={user?.role === 'OPERATOR' ? undefined : () => handleOpenDrawer()}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {user?.role === 'OPERATOR' ? (
          <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
            <div className="max-w-2xl mx-auto text-center p-12">
              <DollarSign className="w-16 h-16 text-primary mx-auto mb-4 opacity-20" />
              <h2 className="text-xl font-bold text-white mb-2">Módulo de Recebimentos</h2>
              <p className="text-slate-500">Utilize o menu Viagens para cadastrar novas rotas.</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-8 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-slate-500 mt-1">Gerencie os recebimentos das viagens realizadas.</p>
                </div>
              </div>

              <div className="mt-4 md:mt-8 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 bg-surface-dark border border-border-dark rounded-xl p-1.5 shadow-sm">
                    <div className="flex items-center gap-2 px-2 md:px-3 py-1.5 text-slate-400">
                      <Calendar className="w-4 h-4" />
                      <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">Período:</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <select 
                        value={selectedMonth}
                        onChange={(e) => {
                          setSelectedMonth(parseInt(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="bg-background-dark border border-border-dark text-white text-[10px] md:text-xs font-bold rounded-lg px-2 md:px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
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
                      <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">Status:</span>
                    </div>
                    
                    <select 
                      value={paymentFilter}
                      onChange={(e) => {
                        setPaymentFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="bg-background-dark border border-border-dark text-white text-[10px] md:text-xs font-bold rounded-lg px-2 md:px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                    >
                      <option value="all">Todos</option>
                      <option value="paid">Recebidos</option>
                      <option value="unpaid">Pendentes</option>
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

            <div className="flex-1 overflow-auto px-4 md:px-8 pb-8 custom-scrollbar">
              <div className="hidden md:block border border-border-dark rounded-xl bg-surface-dark overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-background-dark/50 border-b border-border-dark">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Data</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Destino</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Contrato</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Romaneio</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Veículo</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Valor</th>
                      <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-dark">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-slate-500">Carregando recebimentos...</td>
                      </tr>
                    ) : filteredTrips.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-slate-500">Nenhum recebimento encontrado.</td>
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
                            {trip.paid === 'sim' ? 'Recebido' : 'Pendente'}
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
                          <span className="text-sm text-slate-400">{trip.romaneio || '-'}</span>
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
                          <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            {deleteConfirmId === trip.id ? (
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => handleDelete(trip.id)}
                                  className="px-3 py-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-lg"
                                >
                                  Confirmar
                                </button>
                                <button 
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="px-3 py-1.5 bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg"
                                >
                                  X
                                </button>
                              </div>
                            ) : cloneConfirmId === trip.id ? (
                              <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                                <button 
                                  onClick={() => handleClone(trip)}
                                  className="px-3 py-1.5 bg-amber-500 text-background-dark text-[10px] font-bold rounded-lg"
                                >
                                  Confirmar Clone
                                </button>
                                <button 
                                  onClick={() => setCloneConfirmId(null)}
                                  className="px-3 py-1.5 bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg"
                                >
                                  X
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => { setCloneConfirmId(trip.id); }}
                                  className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => { handleOpenDrawer(trip); }}
                                  className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => setDeleteConfirmId(trip.id)}
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

              {/* Mobile View */}
              <div className="md:hidden space-y-4">
                {filteredTrips.map((trip) => (
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
                        <h4 className="text-lg font-bold text-white">{trip.frete?.cidade || 'N/A'}</h4>
                        <p className="text-xs text-slate-400">{trip.contratante?.ContratanteNome || '-'}</p>
                      </div>
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-[10px] font-bold uppercase",
                        trip.paid === 'sim' ? "bg-emerald-500 text-background-dark" : "bg-background-dark text-slate-500 border border-border-dark"
                      )}>
                        {trip.paid === 'sim' ? 'Recebido' : 'Pendente'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-sm font-bold text-primary">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(trip.value)}
                      </p>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {deleteConfirmId === trip.id ? (
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => handleDelete(trip.id)}
                              className="px-3 py-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-lg"
                            >
                              Confirmar
                            </button>
                            <button 
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-3 py-1.5 bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg"
                            >
                              X
                            </button>
                          </div>
                        ) : cloneConfirmId === trip.id ? (
                          <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => handleClone(trip)}
                              className="px-3 py-1.5 bg-amber-500 text-background-dark text-[10px] font-bold rounded-lg"
                            >
                              Confirmar Clone
                            </button>
                            <button 
                              onClick={() => setCloneConfirmId(null)}
                              className="px-3 py-1.5 bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg"
                            >
                              X
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => { setCloneConfirmId(trip.id); }}
                              className="p-2 bg-amber-500/10 text-amber-500 rounded-xl"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleOpenDrawer(trip)}
                              className="p-2 bg-primary/10 text-primary rounded-xl"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setDeleteConfirmId(trip.id)}
                              className="p-2 bg-rose-500/10 text-rose-500 rounded-xl"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-6 p-4 md:p-6 border-t border-border-dark flex flex-col md:flex-row items-center justify-between bg-surface-dark/30 rounded-xl gap-4">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center md:text-left">
                  Mostrando {trips.length} de {totalRecords} registros
                </p>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-2 md:pb-0">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-border-dark text-slate-400 hover:bg-surface-dark hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-1">
                      {[...Array(totalPages)].map((_, i) => {
                        const pageNum = i + 1;
                        if (
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={cn(
                                "w-8 h-8 rounded-lg text-xs font-bold transition-colors shrink-0",
                                currentPage === pageNum
                                  ? "bg-primary text-background-dark"
                                  : "text-slate-400 hover:bg-surface-dark hover:text-white"
                                )}
                            >
                              {pageNum}
                            </button>
                          );
                        } else if (
                          pageNum === currentPage - 2 ||
                          pageNum === currentPage + 2
                        ) {
                          return <span key={pageNum} className="text-slate-600 shrink-0">...</span>;
                        }
                        return null;
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-border-dark text-slate-400 hover:bg-surface-dark hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {isDrawerOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <aside className="w-full max-w-[450px] bg-background-dark h-full shadow-2xl border-l border-border-dark flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-border-dark flex items-center justify-between bg-primary/5">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">{selectedTrip ? 'Editar Recebimento' : 'Novo Recebimento'}</h3>
                {isOperator && (
                  <div className="mt-4 space-y-1">
                    <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">
                      Usuário: {user?.name}
                    </p>
                    <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">
                      IP: {userIp}
                    </p>
                    {showSuccess && (
                      <div className="bg-emerald-500/20 border border-emerald-500/30 rounded px-2 py-1 animate-in fade-in slide-in-from-top-2 duration-300">
                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1">
                          <Check className="w-3 h-3" /> Recebimento cadastrado com sucesso!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {!isOperator && (
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500 hover:text-white"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              {renderFormContent()}
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
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {isSaving ? 'Salvando...' : selectedTrip ? 'Atualizar Recebimento' : 'Cadastrar Recebimento'}
              </button>
            </div>
          </aside>
        </div>
      )}
    </AppLayout>
  );
}
