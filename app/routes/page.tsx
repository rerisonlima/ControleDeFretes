'use client';

import React, { Suspense } from 'react';
import AppLayout from '@/components/AppLayout';
import { Header } from '@/components/Header';
import { logoutAction } from '@/app/actions/auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';
import { 
  Search, 
  MapPin, 
  Edit, 
  Trash2, 
  X,
  Check,
  AlertCircle,
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
  Eye,
  EyeOff
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
  odometer?: number | string;
  romaneio?: string;
  paymentDate?: string;
  vehicle?: { plate: string };
  contratante?: { ContratanteNome: string };
  createdBy?: { name: string; username: string };
  createdAt: string;
  expenses?: Expense[];
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

interface Route {
  id: number;
  destination: string;
}

interface Vehicle {
  id: number;
  plate: string;
  brand: string;
  model: string;
  categoriaId: number;
  status: string;
  lastOdometer?: number;
  crew?: {
    driverId: number;
    helperId: number | null;
  }[];
}

interface Employee {
  id: number;
  name: string;
  role: string;
  active: boolean;
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

interface Expense {
  id: number;
  date: string;
  type: string;
  description?: string | null;
  value: number;
  status: string;
  vehicleId: number | null;
  reimbursable?: boolean;
  reimbursementDate?: string | null;
  tripId?: number | null;
}

function RoutesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const highlightId = searchParams.get('highlight');
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = React.useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = React.useState(now.getFullYear());

  React.useEffect(() => {
    const month = searchParams.get('month');
    const year = searchParams.get('year');
    if (month) setSelectedMonth(parseInt(month));
    if (year) setSelectedYear(parseInt(year));
  }, [searchParams]);
  const [paymentFilter, setPaymentFilter] = React.useState('all');
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const vehiclesRef = React.useRef<Vehicle[]>([]);
  React.useEffect(() => {
    vehiclesRef.current = vehicles;
  }, [vehicles]);
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
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [errorId, setErrorId] = React.useState<number | null>(null);
  const [isNavigatingToExpenses, setIsNavigatingToExpenses] = React.useState(false);
  const [lastOdometer, setLastOdometer] = React.useState<number>(0);
  const [pendingReimbursements, setPendingReimbursements] = React.useState<Expense[]>([]);
  const errorRef = React.useRef<HTMLDivElement>(null);
  const [user, setUser] = React.useState<{ name: string; role: string; username: string } | null>(null);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [userIp, setUserIp] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalRecords, setTotalRecords] = React.useState(0);
  const [showValues, setShowValues] = React.useState(false);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Scroll to highlight
  React.useEffect(() => {
    if (highlightId && !loading && trips.length > 0) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`trip-row-${highlightId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [highlightId, loading, trips]);

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
    status: 'DELIVERED',
    paid: 'não',
    contract: '',
    odometer: '',
    romaneio: '',
    paymentDate: '',
    reimbursementDate: '',
    reimbursementPaid: 'não'
  });

  const handleOpenDrawer = React.useCallback(async (trip: Trip | null = null, shouldOpen: boolean = true) => {
    if (trip) {
      setSelectedTrip(trip);
      setPendingReimbursements([]);
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
        paymentDate: trip.paymentDate ? safeFormat(trip.paymentDate, 'yyyy-MM-dd') : '',
        reimbursementDate: '',
        reimbursementPaid: 'não'
      });

      // Fetch full trip details to get pending reimbursements
      try {
        const res = await fetch(`/api/trips/${trip.id}`);
        if (res.ok) {
          const fullTrip = await res.json();
          if (fullTrip.expenses) {
            setPendingReimbursements(fullTrip.expenses);
          }
        }
      } catch (error) {
        console.error('Error fetching trip details:', error);
      }
    } else {
      setSelectedTrip(null);
      setPendingReimbursements([]);
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
        status: 'DELIVERED',
        paid: 'não',
        contract: '',
        odometer: '',
        romaneio: '',
        paymentDate: '',
        reimbursementDate: '',
        reimbursementPaid: 'não'
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

  // Form state

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
    
    // Using window.location.href for more reliable navigation in the iframe environment
    // while still keeping the loading state visible for feedback
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
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Data da Viagem</label>
          <div className="relative" title={!formData.vehicleId ? "Primeiro selecione o veículo" : ""}>
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
              const selectedVehicle = vehicles.find(v => v.id.toString() === vehicleId);
              
              let driverId = formData.driverId;
              let helperId = formData.helperId;
              
              if (isOperator && selectedVehicle?.crew && selectedVehicle.crew.length > 0) {
                const crew = selectedVehicle.crew[0];
                driverId = crew.driverId.toString();
                helperId = crew.helperId?.toString() || '';
              }

              setFormData(prev => ({
                ...prev, 
                vehicleId,
                driverId,
                helperId,
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
            {vehicles
              .filter(v => v.status?.toUpperCase() === 'ACTIVE' || v.status?.toUpperCase() === 'ATIVO')
              .map(v => (
                <option key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</option>
              ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Odômetro</label>
          <div className="relative" title={!formData.vehicleId ? "Primeiro selecione o veículo" : ""}>
            <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 text-primary w-4 h-4" />
            <input 
              ref={odometerRef}
              className={cn(
                "w-full pl-10 pr-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none disabled:opacity-50 disabled:cursor-not-allowed",
                formData.odometer && Number(formData.odometer) < lastOdometer && "border-rose-500 focus:ring-rose-500 focus:border-rose-500"
              )}
              placeholder="Km Inicial"
              type="number"
              value={formData.odometer}
              onChange={(e) => setFormData({...formData, odometer: e.target.value})}
              onKeyDown={(e) => e.key === 'Enter' && handleNextField(contratanteIdRef)}
              disabled={!formData.vehicleId}
            />
          </div>
          {formData.odometer && Number(formData.odometer) < lastOdometer && (
            <p className="text-[10px] text-rose-500 font-bold animate-in fade-in slide-in-from-top-1">
              Odômetro atual não pode ser menor do que o anterior ({lastOdometer} km)
            </p>
          )}
        </div>

        <div className="space-y-2" title={!formData.vehicleId ? "Primeiro selecione o veículo" : ""}>
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
        <div className="space-y-2" title={!formData.vehicleId ? "Primeiro selecione o veículo" : !formData.contratanteId ? "Primeiro selecione o contrato" : ""}>
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

        <div className="space-y-2" title={!formData.vehicleId ? "Primeiro selecione o veículo" : ""}>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Romaneio</label>
          <input 
            ref={romaneioRef}
            className="w-full px-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder="Número do Romaneio"
            type="text"
            inputMode="numeric"
            value={formData.romaneio}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              setFormData({...formData, romaneio: value});
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleNextField(driverIdRef)}
            disabled={!formData.vehicleId}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2" title={!formData.vehicleId ? "Primeiro selecione o veículo" : ""}>
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
            {employees.filter(e => e.role.toLowerCase() === 'motorista' && e.active).length === 0 && (
              <option disabled>Não há motoristas ativos</option>
            )}
            {employees
              .filter(e => e.role.toLowerCase() === 'motorista' && (e.active || e.id.toString() === formData.driverId))
              .map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
          </select>
        </div>
        <div className="space-y-2" title={!formData.vehicleId ? "Primeiro selecione o veículo" : ""}>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Ajudante</label>
          <select 
            ref={helperIdRef}
            className="w-full px-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            value={formData.helperId}
            onChange={(e) => setFormData({...formData, helperId: e.target.value})}
            disabled={!formData.vehicleId}
          >
            <option value="">Selecionar</option>
            {employees.filter(e => e.role.toLowerCase() === 'ajudante' && e.active).length === 0 && (
              <option disabled>Não há ajudantes ativos</option>
            )}
            {employees
              .filter(e => e.role.toLowerCase() === 'ajudante' && (e.active || e.id.toString() === formData.helperId))
              .map(e => (
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
            <div className="space-y-2" title={!formData.vehicleId ? "Primeiro selecione o veículo" : ""}>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-primary uppercase tracking-widest block">Valor 1ª Viagem Mot.</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-primary/50">R$</span>
                <input 
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm font-bold text-white outline-none" 
                  placeholder="0,00" 
                  type="number"
                  step="0.01"
                  value={formData.valor1aViagemMotorista}
                  readOnly
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-primary uppercase tracking-widest block">Valor 2ª Viagem Mot.</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-primary/50">R$</span>
                <input 
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm font-bold text-white outline-none" 
                  placeholder="0,00" 
                  type="number"
                  step="0.01"
                  value={formData.valor2aViagemMotorista}
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-primary uppercase tracking-widest block">Valor 1ª Viagem Ajud.</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-primary/50">R$</span>
                <input 
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm font-bold text-white outline-none" 
                  placeholder="0,00" 
                  type="number"
                  step="0.01"
                  value={formData.valor1aViagemAjudante}
                  readOnly
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-primary uppercase tracking-widest block">Valor 2ª Viagem Ajud.</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-primary/50">R$</span>
                <input 
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm font-bold text-white outline-none" 
                  placeholder="0,00" 
                  type="number"
                  step="0.01"
                  value={formData.valor2aViagemAjudante}
                  readOnly
                />
              </div>
            </div>
          </div>

          <hr className="border-border-dark" />

          {/* Payment Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <h4 className="font-bold text-[10px] uppercase tracking-widest text-emerald-500">Informações de Pagamento da Viagem</h4>
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
              <div className="space-y-2" title={formData.paid === 'não' ? "Primeiro altere o status para 'Sim'" : ""}>
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block">Data Pagamento</label>
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

          {pendingReimbursements.length > 0 && (
            <div className="space-y-6 pt-6 border-t border-border-dark/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-amber-500" />
                  <h4 className="font-bold text-[10px] uppercase tracking-widest text-amber-500">Informações de Reembolso</h4>
                </div>
                {formData.paymentDate && !formData.reimbursementDate && (
                  <button 
                    onClick={() => setFormData(prev => ({ ...prev, reimbursementDate: formData.paymentDate, reimbursementPaid: 'sim' }))}
                    className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Repetir data da viagem
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 space-y-3">
                  <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Despesas Pendentes</p>
                  <div className="space-y-2">
                    {pendingReimbursements.map((expense) => (
                      <div key={expense.id} className="flex items-center justify-between text-xs py-2 border-b border-amber-500/10 last:border-0">
                        <div className="flex flex-col">
                          <span className="font-bold text-white">{expense.type}</span>
                          <span className="text-slate-500">{expense.description || 'Sem descrição'}</span>
                        </div>
                        <span className="font-mono font-bold text-amber-500">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expense.value)}
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-2 border-t border-amber-500/20">
                      <span className="text-xs font-bold text-amber-500 uppercase">Total a Reembolsar</span>
                      <span className="text-sm font-bold text-amber-500">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                          pendingReimbursements.reduce((acc, curr) => acc + curr.value, 0)
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest block">Reembolso Pago</label>
                    <select 
                      className="w-full px-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none"
                      value={formData.reimbursementPaid}
                      onChange={(e) => setFormData({...formData, reimbursementPaid: e.target.value})}
                    >
                      <option value="não">Não</option>
                      <option value="sim">Sim</option>
                    </select>
                  </div>
                  <div className="space-y-2" title={formData.reimbursementPaid === 'não' ? "Primeiro altere o status para 'Sim'" : ""}>
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest block">Data Pgto Reembolso</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                      <input 
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none" 
                        type="date"
                        value={formData.reimbursementDate}
                        onChange={(e) => setFormData({...formData, reimbursementDate: e.target.value})}
                        disabled={formData.reimbursementPaid === 'não'}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  React.useEffect(() => {
    if (user?.role === 'OPERATOR' && !formData.tripId) {
      handleOpenDrawer(null, false);
    }
  }, [user, formData.tripId, handleOpenDrawer]);

  React.useEffect(() => {
    const fetchPreviousOdometer = async () => {
      if (formData.vehicleId && formData.scheduledAt) {
        try {
          const res = await fetch(`/api/trips/previous-odometer?vehicleId=${formData.vehicleId}&date=${formData.scheduledAt}${selectedTrip ? `&excludeTripId=${selectedTrip.tripId}` : ''}`);
          if (res.ok) {
            const data = await res.json();
            setLastOdometer(data.odometer);
          }
        } catch (error) {
          console.error('Error fetching previous odometer:', error);
        }
      } else {
        setLastOdometer(0);
      }
    };

    if (isDrawerOpen || user?.role === 'OPERATOR') {
      fetchPreviousOdometer();
    }
  }, [formData.vehicleId, formData.scheduledAt, isDrawerOpen, selectedTrip, user?.role]);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const fetchJson = async (url: string, name: string) => {
        console.log(`Fetching ${name} from ${url}...`);
        const res = await fetch(url);
        if (!res.ok) {
          const errorText = await res.text();
          console.error(`${name} API error (${res.status}):`, errorText);
          return [];
        }
        const data = await res.json();
        return data;
      };

      const [tripsResponse, , vehiclesData, employeesData, contratantesData, fretesData] = await Promise.all([
        fetchJson(`/api/trips?month=${selectedMonth}&year=${selectedYear}&paymentStatus=${paymentFilter}&page=${currentPage}&limit=30`, 'Trips'),
        fetchJson('/api/routes', 'Routes'),
        fetchJson('/api/vehicles', 'Vehicles'),
        fetchJson('/api/employees', 'Employees'),
        fetchJson('/api/contratantes', 'Contratantes'),
        fetchJson('/api/fretes', 'Fretes')
      ]);

      if (tripsResponse && tripsResponse.trips) {
        setTrips(tripsResponse.trips);
        setTotalPages(tripsResponse.totalPages);
        setTotalRecords(tripsResponse.total);
      } else {
        setTrips(tripsResponse || []);
      }
      
      setVehicles(vehiclesData);
      vehiclesRef.current = vehiclesData;
      setEmployees(employeesData);
      setContratantes(contratantesData);
      setFretes(fretesData);

      // Handle direct edit from query param
      if (editId && tripsResponse && tripsResponse.trips && user?.role !== 'OPERATOR') {
        const tripToEdit = tripsResponse.trips.find((t: Trip) => t.id.toString() === editId);
        if (tripToEdit) {
          handleOpenDrawer(tripToEdit);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, paymentFilter, currentPage, editId, handleOpenDrawer, user?.role]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    if (formData.odometer && Number(formData.odometer) < lastOdometer) {
      alert(`Odômetro atual não pode ser menor do que o anterior (${lastOdometer} km)`);
      odometerRef.current?.focus();
      return;
    }

    if (!formData.romaneio || formData.romaneio.trim() === '') {
      alert('O campo Romaneio é obrigatório e deve conter apenas números.');
      romaneioRef.current?.focus();
      return;
    }

    setIsSaving(true);
    try {
      const url = selectedTrip ? `/api/trips/${selectedTrip.id}` : '/api/trips';
      const method = selectedTrip ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          reimbursementDate: formData.reimbursementDate,
          reimbursementPaid: formData.reimbursementPaid
        })
      });

      if (response.ok) {
        if (user?.role === 'OPERATOR') {
          setShowSuccess(true);
          // Scroll to top to see success message
          if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
          }
          // Fallback for some mobile browsers
          window.scrollTo({ top: 0, behavior: 'smooth' });
          
          setTimeout(() => setShowSuccess(false), 15000);
          // Reset form for next entry
          handleOpenDrawer(null, false);
          // Focus on the first field (Vehicle is now the entry point)
          setTimeout(() => {
            vehicleIdRef.current?.focus({ preventScroll: true });
          }, 100);
        } else {
          setIsDrawerOpen(false);
          fetchData();
        }
      } else {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const error = await response.json();
          alert(error.error || 'Erro ao salvar viagem');
        } else {
          const text = await response.text();
          console.error('Non-JSON error response:', text);
          alert('Erro no servidor ao salvar viagem');
        }
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Erro de conexão ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const tripToDelete = trips.find(t => t.id === id);
    if (tripToDelete?.paymentDate) {
      setError('Não é possível apagar uma viagem que possui data de pagamento. Por favor, apague a data do pagamento primeiro.');
      setErrorId(id);
      setDeleteConfirmId(null);
      setTimeout(() => {
        const element = document.getElementById(`error-trip-${id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }

    setError('');
    setErrorId(null);
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/trips/${id}`, { method: 'DELETE' });
      
      const contentType = response.headers.get("content-type");
      if (response.ok) {
        setDeleteConfirmId(null);
        fetchData();
      } else {
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const data = await response.json();
          const errorMessage = data.error || 'Erro ao excluir viagem';
          setError(errorMessage);
          setErrorId(id);
          setDeleteConfirmId(null);
          setTimeout(() => {
            const element = document.getElementById(`error-trip-${id}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
              errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        } else {
          const text = await response.text();
          console.error('Non-JSON error response:', text);
          setError('Erro no servidor ao excluir viagem');
          setErrorId(id);
          setDeleteConfirmId(null);
          setTimeout(() => {
            errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }
      }
    } catch (error) {
      console.error('Delete error:', error);
      setError('Erro de conexão ao excluir');
      setDeleteConfirmId(id);
      setTimeout(() => {
        errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClone = async (trip: Trip) => {
    try {
      console.log('Cloning trip:', trip);
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

      console.log('Sending clone data:', cloneData);

      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cloneData)
      });

      if (response.ok) {
        console.log('Clone successful');
        setCloneConfirmId(null);
        fetchData();
      } else {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const error = await response.json();
          console.error('Clone failed:', error);
          alert(error.details || error.error || 'Erro ao clonar viagem');
        } else {
          const text = await response.text();
          console.error('Non-JSON error response:', text);
          alert('Erro no servidor ao clonar viagem');
        }
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
        title={user?.role === 'OPERATOR' ? "Nova Viagem" : "Viagens"} 
        icon={Truck}
        actionLabel={user?.role === 'OPERATOR' ? undefined : "Nova Viagem"} 
        onAction={user?.role === 'OPERATOR' ? undefined : () => handleOpenDrawer()}
        onLogout={handleLogout}
      />
      
      {error && (
        <div className="px-4 md:px-8 mt-4">
          <div 
            ref={errorRef}
            className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between gap-3 text-rose-400 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
            <button onClick={() => setError('')} className="p-1 hover:bg-rose-500/10 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {user?.role === 'OPERATOR' ? (
          <div 
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar"
          >
            <div className="max-w-2xl mx-auto">
              <div className="mb-8 flex flex-col items-center gap-2">
                <div className="flex flex-wrap justify-center gap-4">
                  <p className="text-[11px] text-rose-500 font-bold uppercase tracking-widest bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                    Usuário: {user?.username}
                  </p>
                  <p className="text-[11px] text-rose-500 font-bold uppercase tracking-widest bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                    IP: {userIp}
                  </p>
                </div>
              </div>
              {showSuccess && (
                <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 font-bold text-center animate-in fade-in zoom-in duration-300 flex items-center justify-center gap-3">
                  <Truck className="w-5 h-5" />
                  VIAGEM CADASTRADA COM SUCESSO
                </div>
              )}
              
              <div className="bg-surface-dark border border-border-dark rounded-2xl p-6 md:p-8 shadow-xl space-y-8">
                {/* Form Content for Operator */}
                {renderFormContent()}
                
                <div className="pt-4 flex items-center gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 bg-primary hover:bg-primary/90 text-background-dark py-4 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 text-lg"
                  >
                    {isSaving ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Check className="w-6 h-6" />
                    )}
                    {isSaving ? 'Salvando...' : 'Cadastrar Viagem'}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 md:p-8 md:pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-slate-500 mt-1">Gerencie os valores de frete, motoristas e ajudantes por viagem.</p>
            </div>
          </div>

          {/* Filter Bar */}
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
                  <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider">Pagamento:</span>
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
                  <option value="paid">Pagos</option>
                  <option value="unpaid">Não Pagos</option>
                </select>
              </div>

              <button
                onClick={() => setShowValues(!showValues)}
                className="flex items-center justify-center px-3 py-1.5 bg-surface-dark border border-border-dark rounded-xl text-slate-400 hover:text-white transition-all shadow-sm h-[42px] w-full lg:w-auto"
                title={showValues ? "Ocultar Valores" : "Mostrar Valores"}
              >
                {showValues ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                <span className="text-[10px] font-bold uppercase">{showValues ? "Ocultar" : "Mostrar"}</span>
              </button>
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
                  {vehicles
                    .filter(v => v.status?.toUpperCase() === 'ACTIVE' || v.status?.toUpperCase() === 'ATIVO')
                    .map(v => (
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
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Romaneio</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Destino</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Contrato</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Veículo</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Valor Frete</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Cadastrado por:</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-slate-500">Carregando viagens...</td>
                  </tr>
                ) : filteredTrips.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-slate-500">Nenhuma viagem encontrada com os filtros aplicados.</td>
                  </tr>
                ) : filteredTrips.map((trip) => (
                  <React.Fragment key={trip.id}>
                    <tr 
                      id={`trip-row-${trip.id}`}
                      className={cn(
                        "hover:bg-white/5 transition-colors group cursor-pointer",
                        trip.id.toString() === highlightId && "bg-primary/20 ring-2 ring-primary ring-inset animate-pulse duration-1000"
                      )}
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
                        <span className="text-sm font-bold text-white">{trip.romaneio || '-'}</span>
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
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-slate-500" />
                            <span className="text-sm text-slate-400">{trip.vehicle?.plate || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Gauge className="w-3 h-3 text-primary" />
                            <span className="text-[10px] text-slate-500 font-mono">{trip.odometer || '0'} km</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-slate-300">
                        {showValues 
                          ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(trip.value)
                          : '******'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white">{trip.createdBy?.name || trip.createdBy?.username || 'Sistema'}</span>
                          <span className="text-[10px] text-slate-500">{safeFormat(trip.createdAt, 'dd/MM/yy HH:mm')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {deleteConfirmId === trip.id ? (
                            <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                              <button 
                                onClick={() => handleDelete(trip.id)}
                                disabled={isDeleting}
                                className="px-3 py-1 bg-rose-500 text-white text-[10px] font-bold rounded hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                              >
                                {isDeleting ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Excluindo...
                                  </>
                                ) : (
                                  'Confirmar'
                                )}
                              </button>
                              <button 
                                onClick={() => {
                                  setDeleteConfirmId(null);
                                  setErrorId(null);
                                }}
                                disabled={isDeleting}
                                className="px-3 py-1 bg-slate-700 text-slate-300 text-[10px] font-bold rounded hover:bg-slate-600 transition-colors disabled:opacity-50"
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
                                onClick={(e) => { e.stopPropagation(); setCloneConfirmId(trip.id); setErrorId(null); }}
                                className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
                                title="Clonar Viagem"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleOpenDrawer(trip); setErrorId(null); }}
                                className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(trip.id); setErrorId(null); }}
                                className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                    {errorId === trip.id && (
                      <tr id={`error-trip-${trip.id}`} className="bg-rose-500/5 animate-in slide-in-from-top-1 duration-200">
                        <td colSpan={9} className="px-6 py-3">
                          <div className="flex items-center gap-2 text-rose-400 text-xs font-medium">
                            <AlertCircle className="w-4 h-4" />
                            <span>{error}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {loading ? (
              <div className="p-12 text-center text-slate-500">Carregando viagens...</div>
            ) : filteredTrips.length === 0 ? (
              <div className="p-12 text-center text-slate-500">Nenhuma viagem encontrada.</div>
            ) : filteredTrips.map((trip) => (
              <div 
                key={trip.id}
                className="space-y-0"
              >
                <div 
                  id={`trip-card-${trip.id}`}
                  className={cn(
                    "bg-surface-dark border border-border-dark rounded-2xl p-4 space-y-4 relative overflow-hidden",
                    (trip.paid === 'sim' && trip.paymentDate) ? "border-emerald-500/30 bg-emerald-500/5" : "",
                    trip.id.toString() === highlightId && "ring-2 ring-primary animate-pulse"
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
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-slate-400">{trip.contratante?.ContratanteNome || trip.contract || '-'}</p>
                        {trip.romaneio && (
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-widest">
                            Romaneio: {trip.romaneio}
                          </span>
                        )}
                      </div>
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
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <Truck className="w-3.5 h-3.5" />
                          {trip.vehicle?.plate || 'N/A'}
                        </div>
                        <div className="flex items-center gap-2">
                          <Gauge className="w-3 h-3 text-primary" />
                          <span className="text-[10px] text-slate-500 font-mono">{trip.odometer || '0'} km</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Valor Frete</p>
                      <p className="text-sm font-bold text-primary">
                        {showValues 
                          ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(trip.value)
                          : '******'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Criado por</span>
                      <span className="text-xs text-white">{trip.createdBy?.name || trip.createdBy?.username || 'Sistema'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {deleteConfirmId === trip.id ? (
                        <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                          <button 
                            onClick={() => handleDelete(trip.id)}
                            disabled={isDeleting}
                            className="px-3 py-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-lg shadow-lg shadow-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {isDeleting ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Excluindo...
                              </>
                            ) : (
                              'Confirmar'
                            )}
                          </button>
                          <button 
                            onClick={() => {
                              setDeleteConfirmId(null);
                              setErrorId(null);
                            }}
                            disabled={isDeleting}
                            className="px-3 py-1.5 bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg disabled:opacity-50"
                          >
                            Sair
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => { setCloneConfirmId(trip.id); setErrorId(null); }}
                            className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => { handleOpenDrawer(trip); setErrorId(null); }}
                            className="p-2.5 bg-primary/10 text-primary rounded-xl"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => { setDeleteConfirmId(trip.id); setErrorId(null); }}
                            className="p-2.5 bg-rose-500/10 text-rose-500 rounded-xl"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {errorId === trip.id && (
                  <div id={`error-trip-${trip.id}`} className="px-4 pb-4 animate-in slide-in-from-top-1 duration-200">
                    <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-rose-400 text-xs font-medium">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="p-4 md:p-6 border-t border-border-dark flex flex-col md:flex-row items-center justify-between bg-surface-dark/30 gap-4">
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

    {/* Side Panel (Drawer) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <aside className="w-full sm:max-w-[450px] bg-background-dark h-full shadow-2xl border-l border-border-dark flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            <div className="p-4 md:p-6 border-b border-border-dark flex items-center justify-between bg-primary/5">
              <div className="flex-1">
                <h3 className="text-lg md:text-xl font-bold text-white">{selectedTrip ? 'Editar Viagem' : 'Nova Viagem'}</h3>
                {isOperator && (
                  <div className="mt-4 space-y-1">
                    <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">
                      Usuário: {user?.username}
                    </p>
                    <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">
                      IP: {userIp}
                    </p>
                    {showSuccess && (
                      <div className="bg-emerald-500/20 border border-emerald-500/30 rounded px-2 py-1 animate-in fade-in slide-in-from-top-2 duration-300">
                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1">
                          <Check className="w-3 h-3" /> Viagem cadastrada com sucesso!
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
            
            <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 custom-scrollbar">
              {/* Main Info */}
              {renderFormContent()}

              {!isOperator && (
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                  <p className="text-[10px] leading-relaxed text-slate-500 italic">
                    * Informe o status de pagamento para controle financeiro das viagens realizadas.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 md:p-8 border-t border-border-dark bg-background-dark/50 flex items-center gap-4">
              {!isOperator && (
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-6 py-3 rounded-lg border border-border-dark text-slate-400 font-bold hover:bg-surface-dark hover:text-white transition-colors"
                >
                  Cancelar
                </button>
              )}
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
                {isSaving ? 'Salvando...' : selectedTrip ? 'Atualizar Viagem' : 'Cadastrar Viagem'}
              </button>
            </div>
          </aside>
        </div>
      )}
    </AppLayout>
  );
}

export default function RoutesPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center bg-background-dark text-slate-500">Carregando...</div>}>
      <RoutesPageContent />
    </Suspense>
  );
}
