'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { Header } from '@/components/Header';
import { logoutAction } from '@/app/actions/auth';
import Link from 'next/link';
import { motion } from 'motion/react';
import { 
  Calendar, 
  ChevronDown, 
  Fuel, 
  User, 
  DollarSign,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Info,
  Wrench,
  Loader2,
  AlertCircle,
  Edit,
  Trash2,
  Ticket,
  Eye,
  EyeOff,
  Truck,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Vehicle {
  id: number;
  plate: string;
  status: string;
}

interface Expense {
  id: number;
  date: string;
  type: string;
  description?: string | null;
  value: number;
  status: 'PAID' | 'PENDING';
  vehicleId: number | null;
  vehicle: Vehicle | null;
  reimbursable?: boolean;
  reimbursementDate?: string | null;
  tripId?: number | null;
  trip?: any | null;
}

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

export default function ExpensesPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [errorId, setErrorId] = useState<number | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showValues, setShowValues] = useState(false);
  const errorRef = React.useRef<HTMLDivElement>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [limit] = useState(30);

  // Form State
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    value: '',
    date: new Date().toISOString().split('T')[0],
    vehicleId: '',
    status: 'PAID',
    reimbursable: false,
    reimbursementDate: '',
    tripId: ''
  });

  const [recentTrips, setRecentTrips] = useState<any[]>([]);
  const [isTripsLoading, setIsTripsLoading] = useState(false);
  const [tripDays, setTripDays] = useState(7);

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Filter State
  const [filters, setFilters] = useState({
    type: 'Todos',
    vehicleId: 'Todos',
    reimbursable: 'Todos',
    status: 'Todos'
  });

  const [user, setUser] = useState<{ name: string; role: string; username: string } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleOpenDrawer = useCallback((expense: Expense | null = null) => {
    setTripDays(7);
    if (expense) {
      setSelectedExpense(expense);
      setFormData({
        type: expense.type,
        description: expense.description || '',
        value: expense.value.toString(),
        date: new Date(expense.date).toISOString().split('T')[0],
        vehicleId: expense.vehicleId?.toString() || '',
        status: expense.status,
        reimbursable: expense.reimbursable || false,
        reimbursementDate: expense.reimbursementDate ? new Date(expense.reimbursementDate).toISOString().split('T')[0] : '',
        tripId: expense.tripId?.toString() || ''
      });
    } else {
      setSelectedExpense(null);
      setFormData({
        type: '',
        description: '',
        value: '',
        date: new Date().toISOString().split('T')[0],
        vehicleId: '',
        status: 'PAID',
        reimbursable: false,
        reimbursementDate: '',
        tripId: ''
      });
    }
    setIsDrawerOpen(true);
  }, []);

  useEffect(() => {
    const fetchRecentTrips = async () => {
      if (formData.vehicleId && formData.reimbursable) {
        try {
          setIsTripsLoading(true);
          const res = await fetch(`/api/trips?vehicleId=${formData.vehicleId}&days=${tripDays}`);
          if (res.ok) {
            const data = await res.json();
            setRecentTrips(data.trips || []);
          }
        } catch (error) {
          console.error('Error fetching recent trips:', error);
        } finally {
          setIsTripsLoading(false);
        }
      } else {
        setRecentTrips([]);
      }
    };
    fetchRecentTrips();
  }, [formData.vehicleId, formData.reimbursable, tripDays]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        type: filters.type,
        vehicleId: filters.vehicleId,
        reimbursable: filters.reimbursable,
        status: filters.status,
        month: selectedMonth.toString(),
        year: selectedYear.toString()
      });

      const [expRes, vehRes] = await Promise.all([
        fetch(`/api/expenses?${params.toString()}`),
        fetch('/api/vehicles')
      ]);
      
      if (!expRes.ok) {
        console.error('Expenses API error:', await expRes.text());
      } else {
        const data = await expRes.json();
        setExpenses(data.expenses);
        setTotalPages(data.totalPages);
        setTotalRecords(data.total);
      }

      if (!vehRes.ok) {
        console.error('Vehicles API error:', await vehRes.text());
      } else {
        setVehicles(await vehRes.json());
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, limit, filters.type, filters.vehicleId, filters.reimbursable, filters.status, selectedMonth, selectedYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          
          // Check for query param or OPERATOR role
          const urlParams = new URLSearchParams(window.location.search);
          const isNew = urlParams.get('new') === 'true';
          
          if (data.role === 'OPERATOR' || isNew) {
            handleOpenDrawer();
          }
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      }
    };
    fetchSession();
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

  const handleSave = async () => {
    if (!formData.type || !formData.value || !formData.date) {
      return;
    }

    try {
      setIsSaving(true);
      const url = selectedExpense ? `/api/expenses/${selectedExpense.id}` : '/api/expenses';
      const method = selectedExpense ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        if (user?.role === 'OPERATOR') {
          setShowSuccess(true);
          setFormData({
            type: '',
            description: '',
            value: '',
            date: new Date().toISOString().split('T')[0],
            vehicleId: '',
            status: 'PAID',
            reimbursable: false,
            reimbursementDate: '',
            tripId: ''
          });
          setTimeout(() => setShowSuccess(false), 15000);
        } else {
          setIsDrawerOpen(false);
        }
        fetchData();
      }
    } catch (error) {
      console.error('Error saving expense:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    setError('');
    setErrorId(null);
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setDeleteConfirmId(null);
        fetchData();
      } else {
        const data = await res.json();
        const errorMessage = data.error || 'Erro ao excluir despesa';
        setError(errorMessage);
        setErrorId(id);
        setDeleteConfirmId(null);
        setTimeout(() => {
          const element = document.getElementById(`error-expense-${id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      setError('Erro de conexão ao excluir');
      setDeleteConfirmId(id);
      setTimeout(() => {
        errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } finally {
      setIsDeleting(false);
    }
  };

  const getIcon = (type: string) => {
    if (type.toLowerCase().includes('combustível')) return Fuel;
    if (type.toLowerCase().includes('manutenção')) return Wrench;
    if (type.toLowerCase().includes('pagamento')) return User;
    if (type.toLowerCase().includes('pedágio')) return Ticket;
    return AlertCircle;
  };

  return (
    <AppLayout>
      <Header 
        title={user?.role === 'OPERATOR' ? "Nova Despesa" : "Cadastro de Despesas"} 
        icon={DollarSign}
        actionLabel={user?.role === 'OPERATOR' ? undefined : "Nova Despesa"}
        onAction={user?.role === 'OPERATOR' ? undefined : () => handleOpenDrawer()}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {error && (
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
          )}

          {/* Filters Bar */}
          <div className="bg-surface-dark border border-border-dark rounded-xl p-4 flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex flex-wrap items-center gap-2 md:gap-3 bg-background-dark border border-border-dark rounded-xl p-1.5 shadow-sm">
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
                  className="bg-surface-dark border border-border-dark text-white text-[10px] md:text-xs font-bold rounded-lg px-2 md:px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
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
                  className="bg-surface-dark border border-border-dark text-white text-[10px] md:text-xs font-bold rounded-lg px-2 md:px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                >
                  {[2024, 2025, 2026].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-1 gap-4">
              <div className="flex flex-col gap-1.5 min-w-[150px]">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Tipo de Despesa</label>
                <div className="relative">
                  <select 
                    className="bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-xs text-slate-300 w-full focus:ring-1 focus:ring-primary appearance-none outline-none"
                    value={filters.type}
                    onChange={(e) => {
                      setFilters({ ...filters, type: e.target.value });
                      setCurrentPage(1);
                    }}
                  >
                    <option value="Todos">Todos os Tipos</option>
                    <option value="Combustível">Combustível</option>
                    <option value="Pagamento Motorista">Pagamento Motorista</option>
                    <option value="Pagamento Ajudante">Pagamento Ajudante</option>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Pedágio">Pedágio</option>
                    <option value="Extra">Extra</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none" />
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5 min-w-[150px]">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Veículo</label>
                <div className="relative">
                  <select 
                    className="bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-xs text-slate-300 w-full focus:ring-1 focus:ring-primary appearance-none outline-none"
                    value={filters.vehicleId}
                    onChange={(e) => {
                      setFilters({ ...filters, vehicleId: e.target.value });
                      setCurrentPage(1);
                    }}
                  >
                    <option value="Todos">Todos os Veículos</option>
                    {vehicles
                      .filter(v => v.status?.toUpperCase() === 'ACTIVE' || v.status?.toUpperCase() === 'ATIVO')
                      .map(v => (
                        <option key={v.id} value={v.id.toString()}>{v.plate}</option>
                      ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 min-w-[150px]">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Reembolsáveis</label>
                <div className="relative">
                  <select 
                    className="bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-xs text-slate-300 w-full focus:ring-1 focus:ring-primary appearance-none outline-none"
                    value={filters.reimbursable}
                    onChange={(e) => {
                      setFilters({ ...filters, reimbursable: e.target.value });
                      setCurrentPage(1);
                    }}
                  >
                    <option value="Todos">Todos</option>
                    <option value="Sim">Sim</option>
                    <option value="Não">Não</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 min-w-[150px]">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Status</label>
                <div className="relative">
                  <select 
                    className="bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-xs text-slate-300 w-full focus:ring-1 focus:ring-primary appearance-none outline-none"
                    value={filters.status}
                    onChange={(e) => {
                      setFilters({ ...filters, status: e.target.value });
                      setCurrentPage(1);
                    }}
                  >
                    <option value="Todos">Todos</option>
                    <option value="PAID">Pago</option>
                    <option value="PENDING">Pendente</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none" />
                </div>
              </div>

              <div className="flex items-end gap-2">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Privacidade</label>
                  <button
                    onClick={() => setShowValues(!showValues)}
                    className="bg-background-dark border border-border-dark text-slate-400 hover:text-white rounded-lg h-9 px-3 flex items-center justify-center transition-all outline-none w-full"
                    title={showValues ? "Ocultar Valores" : "Mostrar Valores"}
                  >
                    {showValues ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                    <span className="text-[10px] font-bold uppercase">{showValues ? "Ocultar" : "Mostrar"}</span>
                  </button>
                </div>
                
                <button 
                  onClick={() => {
                    setFilters({ 
                      type: 'Todos', 
                      vehicleId: 'Todos',
                      reimbursable: 'Todos',
                      status: 'Todos'
                    });
                    setCurrentPage(1);
                  }}
                  className="text-[10px] font-bold text-primary border border-primary/30 px-4 h-9 rounded-lg hover:bg-primary/10 transition-colors uppercase tracking-widest"
                >
                  Limpar
                </button>
              </div>
            </div>
          </div>

          {/* Expense Table Container */}
          <div className="bg-surface-dark border border-border-dark rounded-xl overflow-hidden shadow-sm">
            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-dark bg-background-dark/30">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Data / Tipo</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Veículo</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Detalhes da Viagem</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Reembolso</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Valor (R$)</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dark">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-8 h-8 text-primary animate-spin" />
                          <p className="text-sm text-slate-500">Carregando despesas...</p>
                        </div>
                      </td>
                    </tr>
                  ) : expenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                        Nenhuma despesa encontrada com os filtros selecionados.
                      </td>
                    </tr>
                  ) : expenses.map((exp, i) => {
                    const Icon = getIcon(exp.type);
                    return (
                      <React.Fragment key={exp.id || i}>
                        <tr className="hover:bg-white/5 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <p className="text-xs text-slate-400">
                                {new Date(exp.date).toLocaleDateString('pt-BR')}
                              </p>
                              <div className="flex items-center gap-2">
                                <Icon className="w-3.5 h-3.5 text-primary" />
                                <span className="text-sm font-medium text-white">{exp.type}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                            {exp.vehicle?.plate || '-'}
                          </td>
                          <td className="px-6 py-4">
                            {exp.tripId ? (
                              <Link 
                                href={`/routes?highlight=${exp.tripId}&month=${new Date(exp.date).getMonth() + 1}&year=${new Date(exp.date).getFullYear()}`}
                                className="block space-y-1 hover:bg-primary/5 p-1 rounded-lg transition-colors group/trip"
                              >
                                <p className="text-sm text-white font-medium group-hover/trip:text-primary transition-colors">
                                  {exp.trip?.frete?.cidade || '-'}
                                </p>
                                <div className="flex flex-wrap gap-x-3 gap-y-1 items-center">
                                  {exp.trip?.romaneio && (
                                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                      ROMANEIO: {exp.trip.romaneio}
                                    </span>
                                  )}
                                  {exp.trip?.contract && (
                                    <span className="text-[10px] text-slate-500 font-mono">
                                      CONTRATO: {exp.trip.contract}
                                    </span>
                                  )}
                                  {!exp.trip?.romaneio && !exp.trip?.contract && <span className="text-[10px] text-slate-500">-</span>}
                                </div>
                              </Link>
                            ) : (
                              <div className="space-y-1">
                                <p className="text-sm text-white font-medium">{exp.trip?.frete?.cidade || '-'}</p>
                                <div className="flex flex-wrap gap-x-3 gap-y-1 items-center">
                                  {exp.trip?.romaneio && (
                                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                      ROMANEIO: {exp.trip.romaneio}
                                    </span>
                                  )}
                                  {exp.trip?.contract && (
                                    <span className="text-[10px] text-slate-500 font-mono">
                                      CONTRATO: {exp.trip.contract}
                                    </span>
                                  )}
                                  {!exp.trip?.romaneio && !exp.trip?.contract && <span className="text-[10px] text-slate-500">-</span>}
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <span className={cn(
                                "text-[10px] font-bold px-1.5 py-0.5 rounded",
                                exp.reimbursable ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-500/10 text-slate-500"
                              )}>
                                {exp.reimbursable ? 'REEMBOLSÁVEL' : 'NÃO'}
                              </span>
                              {exp.reimbursementDate && (
                                <p className="text-[10px] text-slate-500">
                                  Pago em: {new Date(exp.reimbursementDate).toLocaleDateString('pt-BR')}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-white">
                            {showValues ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(exp.value) : '******'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-[9px] font-bold uppercase border",
                              exp.status === 'PAID' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            )}>
                              {exp.status === 'PAID' ? 'PAGO' : 'PENDENTE'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {deleteConfirmId === exp.id ? (
                                <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                                  <button 
                                    onClick={() => handleDelete(exp.id)}
                                    disabled={isDeleting}
                                    className="px-3 py-1 bg-rose-500 text-white text-[10px] font-bold rounded hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                              ) : (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-2">
                                  <button 
                                    onClick={() => handleOpenDrawer(exp)}
                                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setDeleteConfirmId(exp.id);
                                      setErrorId(null);
                                    }}
                                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                        {errorId === exp.id && (
                          <tr id={`error-expense-${exp.id}`} className="bg-rose-500/5 animate-in slide-in-from-top-1 duration-200">
                            <td colSpan={7} className="px-6 py-3">
                              <div className="flex items-center gap-2 text-rose-400 text-xs font-medium">
                                <AlertCircle className="w-4 h-4" />
                                <span>{error}</span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                  {/* Total Row */}
                  {!isLoading && expenses.length > 0 && (
                    <tr className="bg-background-dark/50 font-bold border-t border-border-dark">
                      <td colSpan={4} className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">
                        Total:
                      </td>
                      <td className="px-6 py-4 text-sm text-white">
                        {showValues 
                          ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                              expenses.reduce((sum, exp) => sum + exp.value, 0)
                            ) 
                          : '******'}
                      </td>
                      <td colSpan={2}></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-border-dark">
              {isLoading ? (
                <div className="p-10 text-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                  <p className="text-sm text-slate-500 mt-2">Carregando despesas...</p>
                </div>
              ) : expenses.length === 0 ? (
                <div className="p-10 text-center text-slate-500">Nenhuma despesa encontrada.</div>
              ) : expenses.map((exp, i) => {
                const Icon = getIcon(exp.type);
                return (
                  <div key={exp.id || i} className="space-y-0" onClick={() => handleOpenDrawer(exp)}>
                    <div className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{exp.type}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{new Date(exp.date).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[8px] font-bold uppercase border",
                          exp.status === 'PAID' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        )}>
                          {exp.status === 'PAID' ? 'PAGO' : 'PENDENTE'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Truck className="w-3.5 h-3.5" />
                          <span>{exp.vehicle?.plate || '-'}</span>
                        </div>
                        <p className="font-bold text-white">
                          {showValues ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(exp.value) : '******'}
                        </p>
                      </div>

                      {(exp.reimbursable || exp.trip) && (
                        <div className="pt-2 border-t border-border-dark/50 space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            {exp.trip?.romaneio && (
                              <div className="col-span-2 bg-primary/5 p-2 rounded border border-primary/10">
                                <span className="text-primary uppercase font-bold text-[8px] block">Romaneio</span>
                                <span className="text-white font-bold text-xs">{exp.trip.romaneio}</span>
                              </div>
                            )}
                            {exp.trip?.frete?.cidade && (
                              <div>
                                <span className="text-slate-500 uppercase font-bold block">Destino</span>
                                <span className="text-slate-300">{exp.trip.frete.cidade}</span>
                              </div>
                            )}
                            {exp.reimbursable && (
                              <div>
                                <span className="text-slate-500 uppercase font-bold block">Reembolsável</span>
                                <span className="text-emerald-500 font-bold">SIM</span>
                              </div>
                            )}
                            {exp.reimbursementDate && (
                              <div>
                                <span className="text-slate-500 uppercase font-bold block">Data Pgto</span>
                                <span className="text-slate-300">{new Date(exp.reimbursementDate).toLocaleDateString('pt-BR')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                        {deleteConfirmId === exp.id ? (
                          <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                            <button 
                              onClick={() => handleDelete(exp.id)}
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
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleOpenDrawer(exp)}
                              className="p-2 bg-primary/10 text-primary rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                setDeleteConfirmId(exp.id);
                                setErrorId(null);
                              }}
                              className="p-2 bg-rose-500/10 text-rose-500 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {errorId === exp.id && (
                      <div id={`error-expense-${exp.id}`} className="px-4 pb-4 animate-in slide-in-from-top-1 duration-200">
                        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-rose-400 text-xs font-medium">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <span>{error}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {/* Mobile Total Row */}
              {!isLoading && expenses.length > 0 && (
                <div className="p-4 bg-background-dark/50 border-t border-border-dark flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total</span>
                  <span className="text-sm font-bold text-white">
                    {showValues 
                      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                          expenses.reduce((sum, exp) => sum + exp.value, 0)
                        ) 
                      : '******'}
                  </span>
                </div>
              )}
            </div>
            
            <div className="px-6 py-4 bg-background-dark/30 flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center md:text-left">
                Mostrando {expenses.length} de {totalRecords} registros
              </p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded bg-surface-dark border border-border-dark text-slate-500 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-primary px-2">
                  {currentPage} / {totalPages || 1}
                </span>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-1.5 rounded bg-surface-dark border border-border-dark text-slate-500 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full sm:max-w-[400px] bg-background-dark h-full shadow-2xl border-l border-border-dark flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-4 md:p-8 border-b border-border-dark flex items-center justify-between">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-white">{selectedExpense ? 'Editar Despesa' : 'Nova Despesa'}</h3>
                <p className="text-sm text-slate-500 mt-1">{selectedExpense ? 'Atualize os dados da despesa' : 'Registre uma nova saída financeira'}</p>
                {user?.role === 'OPERATOR' && showSuccess && (
                  <div className="mt-4 bg-emerald-500/20 border border-emerald-500/30 rounded px-3 py-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest flex items-center gap-1">
                      <Check className="w-3 h-3" /> Despesa cadastrada com sucesso
                    </p>
                  </div>
                )}
              </div>
              {user?.role !== 'OPERATOR' && (
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-auto p-4 md:p-8 space-y-4 md:space-y-6 custom-scrollbar">
              {isOperator && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold text-primary">Precisa lançar uma viagem?</span>
                  </div>
                  <Link 
                    href="/routes" 
                    className="text-xs font-bold bg-primary text-background-dark px-3 py-1.5 rounded hover:bg-primary/90 transition-all"
                  >
                    Ir para Viagens
                  </Link>
                </div>
              )}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tipo de Despesa</label>
                <div className="relative">
                  <select 
                    className="w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-primary outline-none text-white appearance-none"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    <option value="">Selecione o tipo</option>
                    <option value="Combustível">Combustível</option>
                    <option value="Pagamento Motorista">Pagamento Motorista</option>
                    <option value="Pagamento Ajudante">Pagamento Ajudante</option>
                    <option value="Manutenção">Manutenção</option>
                    <option value="Pedágio">Pedágio</option>
                    <option value="Extra">Extra</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 pointer-events-none" />
                </div>
              </div>

              {formData.type === 'Manutenção' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tipo de Manutenção</label>
                  <input 
                    className="w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-primary outline-none text-white placeholder:text-slate-700"
                    placeholder="Ex: Troca de óleo, Freios, etc."
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Valor (R$)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-bold text-sm">R$</span>
                  <input 
                    className="w-full pl-12 pr-4 py-3 bg-surface-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-primary outline-none text-white placeholder:text-slate-700"
                    placeholder="0,00"
                    type="number"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Data</label>
                <input 
                  className="w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-primary outline-none text-white [color-scheme:dark]"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Veículo</label>
                <div className="relative">
                  <select 
                    className="w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-primary outline-none text-white appearance-none"
                    value={formData.vehicleId}
                    onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                  >
                    <option value="">Selecione a placa</option>
                    {vehicles
                      .filter(v => v.status?.toUpperCase() === 'ACTIVE' || v.status?.toUpperCase() === 'ATIVO')
                      .map(v => (
                        <option key={v.id} value={v.id}>{v.plate}</option>
                      ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 pointer-events-none" />
                </div>
              </div>

              <div className={cn("flex items-center gap-2 py-2", !formData.vehicleId && "opacity-50 cursor-not-allowed")}>
                <input 
                  type="checkbox" 
                  id="reimbursable"
                  disabled={!formData.vehicleId}
                  className="w-4 h-4 rounded border-border-dark bg-surface-dark text-primary focus:ring-primary focus:ring-offset-background-dark disabled:opacity-50 disabled:cursor-not-allowed"
                  checked={formData.reimbursable}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setFormData({ 
                      ...formData, 
                      reimbursable: isChecked,
                      status: isChecked ? 'PENDING' : formData.status
                    });
                  }}
                />
                <label htmlFor="reimbursable" className={cn("text-sm font-bold text-white cursor-pointer", !formData.vehicleId && "cursor-not-allowed")}>
                  Despesa Reembolsável?
                </label>
              </div>

              {formData.reimbursable && (
                <div className="p-4 bg-surface-dark/50 border border-border-dark rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest">Dados de Reembolso</h4>
                  
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Associar uma Viagem</label>
                    <div className="relative">
                      <select 
                        className="w-full px-4 py-3 bg-background-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-primary outline-none text-white appearance-none disabled:opacity-50"
                        value={formData.tripId}
                        onChange={(e) => setFormData({ ...formData, tripId: e.target.value })}
                        disabled={isTripsLoading}
                      >
                        <option value="">{isTripsLoading ? '...Carregando Viagens' : 'Selecione'}</option>
                        {recentTrips.map(trip => (
                          <option key={trip.id} value={trip.id}>
                            {new Date(trip.scheduledAt).toLocaleDateString('pt-BR')} - {trip.romaneio || 'S/R'} - {trip.route?.destination || trip.frete?.cidade || 'S/D'} - {trip.contract || 'S/C'}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 pointer-events-none" />
                    </div>
                    <button 
                      type="button"
                      onClick={() => setTripDays(prev => prev + 7)}
                      className="text-[8px] font-bold text-sky-400 hover:text-sky-300 hover:underline transition-all flex items-center gap-1 mt-1 w-fit"
                    >
                      <Plus className="w-2 h-2" />
                      Carregar + 7 Dias
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Data Pgto Reembolso</label>
                    <input 
                      className="w-full px-4 py-3 bg-background-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-primary outline-none text-white [color-scheme:dark]"
                      type="date"
                      value={formData.reimbursementDate}
                      onChange={(e) => setFormData({ ...formData, reimbursementDate: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status do Pagamento</label>
                <div className="flex gap-4">
                  <label className="flex-1 flex items-center justify-center gap-2 border border-border-dark bg-surface-dark p-3 rounded-lg cursor-pointer hover:border-primary transition-all group">
                    <input 
                      type="radio" 
                      name="status" 
                      checked={formData.status === 'PENDING'}
                      onChange={() => setFormData({ ...formData, status: 'PENDING' })}
                      className="text-primary focus:ring-0 bg-background-dark border-border-dark" 
                    />
                    <span className="text-sm text-slate-400 group-hover:text-white">Pendente</span>
                  </label>
                  <label className="flex-1 flex items-center justify-center gap-2 border border-border-dark bg-surface-dark p-3 rounded-lg cursor-pointer hover:border-primary transition-all group">
                    <input 
                      type="radio" 
                      name="status" 
                      checked={formData.status === 'PAID'}
                      onChange={() => setFormData({ ...formData, status: 'PAID' })}
                      className="text-primary focus:ring-0 bg-background-dark border-border-dark" 
                    />
                    <span className="text-sm text-slate-400 group-hover:text-white">Pago</span>
                  </label>
                </div>
              </div>

              <div className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-primary mb-1">Dica de Gestão</p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Sempre vincule despesas a um veículo específico para análise precisa de custo por quilômetro rodado.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 md:p-8 bg-background-dark/50 border-t border-border-dark flex gap-4">
              {user?.role !== 'OPERATOR' && (
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex-1 px-4 py-3 border border-border-dark rounded-lg text-sm font-bold text-slate-400 hover:bg-surface-dark hover:text-white transition-colors"
                  disabled={isSaving}
                >
                  Cancelar
                </button>
              )}
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 px-4 py-3 bg-primary text-background-dark rounded-lg text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {isSaving ? 'Salvando...' : selectedExpense ? 'Atualizar Despesa' : 'Cadastrar Nova Despesa'}
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
