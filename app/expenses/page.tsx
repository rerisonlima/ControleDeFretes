'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { Header } from '@/components/Header';
import { Toast, useToast } from '@/components/Toast';
import { logoutAction } from '@/app/actions/auth';
import { 
  Calendar, 
  ChevronDown, 
  Fuel, 
  Truck,
  User, 
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
  EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Vehicle {
  id: number;
  plate: string;
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
}

export default function ExpensesPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showValues, setShowValues] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  
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
    status: 'PAID'
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [user, setUser] = useState<{ name: string; role: string; username: string } | null>(null);
  const [userIp, setUserIp] = useState('');
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const searchParams = useSearchParams();

  const typeRef = useRef<HTMLSelectElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const vehicleIdRef = useRef<HTMLSelectElement>(null);

  const handleNextField = (nextRef: React.RefObject<HTMLInputElement | HTMLSelectElement | null>) => {
    setTimeout(() => {
      nextRef.current?.focus();
    }, 100);
  };

  // Filter State
  const [filters, setFilters] = useState({
    type: 'Todos',
    vehicleId: 'Todos'
  });

  useEffect(() => {
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

  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam) {
      setFormData(prev => ({ ...prev, type: typeParam }));
    }
  }, [searchParams]);

  const handleLogout = async () => {
    try {
      await logoutAction();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        type: filters.type,
        vehicleId: filters.vehicleId
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
  }, [currentPage, limit, filters.type, filters.vehicleId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenDrawer = (expense: Expense | null = null) => {
    if (expense) {
      setSelectedExpense(expense);
      setFormData({
        type: expense.type,
        description: expense.description || '',
        value: expense.value.toString(),
        date: new Date(expense.date).toISOString().split('T')[0],
        vehicleId: expense.vehicleId?.toString() || '',
        status: expense.status
      });
    } else {
      setSelectedExpense(null);
      setFormData({
        type: '',
        description: '',
        value: '',
        date: new Date().toISOString().split('T')[0],
        vehicleId: '',
        status: 'PAID'
      });
    }
    setIsDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!formData.type || !formData.value || !formData.date) {
      showToast('Preencha os campos obrigatórios', 'error');
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
          setShowSuccessAlert(true);
          setTimeout(() => setShowSuccessAlert(false), 15000);
          setFormData({
            type: searchParams.get('type') || '',
            description: '',
            value: '',
            date: new Date().toISOString().split('T')[0],
            vehicleId: '',
            status: 'PAID'
          });
          setTimeout(() => {
            typeRef.current?.focus();
          }, 100);
        } else {
          setIsDrawerOpen(false);
          showToast(selectedExpense ? 'Despesa atualizada!' : 'Despesa cadastrada!', 'success');
          fetchData();
        }
      } else {
        const error = await res.json();
        showToast(error.error || 'Erro ao salvar despesa', 'error');
      }
    } catch (error) {
      console.error('Error saving expense:', error);
      showToast('Erro de conexão ao salvar', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setDeleteConfirmId(null);
        showToast('Despesa excluída com sucesso!', 'success');
        fetchData();
      } else {
        const data = await res.json();
        showToast(data.error || 'Erro ao excluir despesa', 'error');
        setDeleteConfirmId(null);
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      showToast('Erro de conexão ao excluir', 'error');
      setDeleteConfirmId(null);
    }
  };

  const getIcon = (type: string) => {
    const t = type.toUpperCase();
    if (t === 'COMBUSTIVEL') return Fuel;
    if (t === 'MANUTENCAO') return Wrench;
    if (t === 'PEDAGIO') return Ticket;
    if (t === 'ALIMENTACAO') return User;
    return AlertCircle;
  };

  const renderFormContent = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Tipo de Despesa</label>
          <div className="relative">
            <Fuel className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <select 
              ref={typeRef}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none appearance-none"
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              onKeyDown={(e) => e.key === 'Enter' && handleNextField(descriptionRef)}
            >
              <option value="">Selecione o Tipo</option>
              <option value="COMBUSTIVEL">COMBUSTIVEL</option>
              <option value="MANUTENCAO">MANUTENCAO</option>
              <option value="PEDAGIO">PEDAGIO</option>
              <option value="ALIMENTACAO">ALIMENTACAO</option>
              <option value="OUTROS">OUTROS</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Data</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input 
              ref={dateRef}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none" 
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              onKeyDown={(e) => e.key === 'Enter' && handleNextField(vehicleIdRef)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Descrição</label>
        <div className="relative">
          <Info className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
          <input 
            ref={descriptionRef}
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none" 
            placeholder="Ex: Abastecimento Posto Shell"
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            onKeyDown={(e) => e.key === 'Enter' && handleNextField(valueRef)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Valor (R$)</label>
          <div className="relative">
            <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input 
              ref={valueRef}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none" 
              placeholder="0,00"
              type="number"
              step="0.01"
              value={formData.value}
              onChange={(e) => setFormData({...formData, value: e.target.value})}
              onKeyDown={(e) => e.key === 'Enter' && handleNextField(dateRef)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Veículo (Opcional)</label>
          <div className="relative">
            <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <select 
              ref={vehicleIdRef}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none appearance-none"
              value={formData.vehicleId}
              onChange={(e) => setFormData({...formData, vehicleId: e.target.value})}
            >
              <option value="">Nenhum Veículo</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.plate}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <AppLayout>
      <Header 
        title={user?.role === 'OPERATOR' ? "Nova Despesa" : "Cadastro de Despesas"} 
        icon={Fuel}
        actionLabel={user?.role === 'OPERATOR' ? undefined : "Nova Despesa"} 
        onAction={user?.role === 'OPERATOR' ? undefined : () => handleOpenDrawer()}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {user?.role === 'OPERATOR' ? (
          <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
            <div className="max-w-2xl mx-auto">
              {showSuccessAlert && (
                <div className="mb-6 bg-emerald-500 text-white p-4 rounded-xl font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                  <Check className="w-6 h-6" />
                  Despesa cadastrada com sucesso
                </div>
              )}

              <div className="mb-6 flex items-center justify-between gap-4">
                <div className="flex flex-col items-start gap-1">
                  <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">
                    Usuário: {user?.name}
                  </p>
                  <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">
                    IP: {userIp}
                  </p>
                </div>

                <button 
                  onClick={() => window.location.href = '/routes'}
                  className="flex flex-col items-center gap-1 group transition-all hover:scale-105"
                >
                  <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 group-hover:bg-primary/20 group-hover:border-primary/40 transition-all">
                    <Truck className="w-8 h-8 text-primary" />
                  </div>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest text-center">
                    Cadastrar<br />Nova Viagem
                  </span>
                </button>
              </div>
              
              <div className="bg-surface-dark border border-border-dark rounded-2xl p-6 md:p-8 shadow-xl space-y-8">
                {renderFormContent()}
                
                <div className="pt-4 flex items-center gap-4">
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 bg-primary hover:bg-primary/90 text-background-dark py-4 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 text-lg"
                  >
                    {isSaving ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Check className="w-6 h-6" />
                    )}
                    {isSaving ? 'Salvando...' : 'Cadastrar Despesa'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-8 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black tracking-tight">Despesas</h2>
                <p className="text-slate-500 mt-1">Controle todos os gastos operacionais da frota.</p>
              </div>
              
              <button
                onClick={() => setShowValues(!showValues)}
                className="bg-surface-dark border border-border-dark text-slate-400 hover:text-white rounded-lg h-11 px-4 flex items-center justify-center transition-all outline-none"
                title={showValues ? "Ocultar Valores" : "Mostrar Valores"}
              >
                {showValues ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="px-8 mb-6">
              <div className="flex flex-wrap items-center gap-4 bg-surface-dark border border-border-dark p-4 rounded-xl">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Tipo de Despesa</label>
                  <select 
                    className="w-full mt-1 bg-background-dark border border-border-dark text-white rounded-lg h-10 px-3 outline-none focus:ring-1 focus:ring-primary"
                    value={filters.type}
                    onChange={(e) => {
                      setFilters({...filters, type: e.target.value});
                      setCurrentPage(1);
                    }}
                  >
                    <option value="Todos">Todos os Tipos</option>
                    <option value="COMBUSTIVEL">Combustível</option>
                    <option value="MANUTENCAO">Manutenção</option>
                    <option value="PEDAGIO">Pedágio</option>
                    <option value="ALIMENTACAO">Alimentação</option>
                    <option value="OUTROS">Outros</option>
                  </select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Veículo</label>
                  <select 
                    className="w-full mt-1 bg-background-dark border border-border-dark text-white rounded-lg h-10 px-3 outline-none focus:ring-1 focus:ring-primary"
                    value={filters.vehicleId}
                    onChange={(e) => {
                      setFilters({...filters, vehicleId: e.target.value});
                      setCurrentPage(1);
                    }}
                  >
                    <option value="Todos">Todos os Veículos</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id.toString()}>{v.plate}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Privacidade</label>
                  <button
                    onClick={() => setShowValues(!showValues)}
                    className="bg-background-dark border border-border-dark text-slate-400 hover:text-white rounded-lg h-9 px-3 flex items-center justify-center transition-all outline-none"
                    title={showValues ? "Ocultar Valores" : "Mostrar Valores"}
                  >
                    {showValues ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                <div className="ml-auto self-end">
                  <button 
                    onClick={() => {
                      setFilters({ type: 'Todos', vehicleId: 'Todos' });
                      setCurrentPage(1);
                    }}
                    className="text-xs font-bold text-primary border border-primary/30 px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors"
                  >
                    Limpar Filtros
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto px-8 pb-8 custom-scrollbar">
              <div className="bg-surface-dark border border-border-dark rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-background-dark/50">
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Data</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tipo de Despesa</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Veículo</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Valor</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-dark">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            <p className="text-sm text-slate-500">Carregando despesas...</p>
                          </div>
                        </td>
                      </tr>
                    ) : expenses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                          Nenhuma despesa encontrada.
                        </td>
                      </tr>
                    ) : expenses.map((expense) => {
                      const Icon = getIcon(expense.type);
                      return (
                        <tr key={expense.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 text-sm text-white">
                            {new Date(expense.date).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium text-white">{expense.type}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-400">
                            {expense.vehicle?.plate || '-'}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-white text-right">
                            {showValues ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expense.value) : '******'}
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter border",
                              expense.status === 'PAID' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            )}>
                              {expense.status === 'PAID' ? 'PAGO' : 'PENDENTE'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => handleOpenDrawer(expense)}
                                className="p-2 text-slate-400 hover:text-primary transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => setDeleteConfirmId(expense.id)}
                                className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    Mostrando <span className="text-white font-bold">{expenses.length}</span> de <span className="text-white font-bold">{totalRecords}</span> registros
                  </p>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-border-dark bg-surface-dark text-slate-400 hover:text-white disabled:opacity-50 transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-bold text-white px-4">
                      Página {currentPage} de {totalPages}
                    </span>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-border-dark bg-surface-dark text-slate-400 hover:text-white disabled:opacity-50 transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="absolute inset-0 bg-background-dark/80 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="relative w-full max-w-md bg-surface-dark border-l border-border-dark shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
            <div className="p-6 border-b border-border-dark flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">{selectedExpense ? 'Editar Despesa' : 'Nova Despesa'}</h3>
              <button onClick={() => setIsDrawerOpen(false)} className="p-2 text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {renderFormContent()}
            </div>

            <div className="p-6 border-t border-border-dark bg-background-dark/50">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="w-full bg-primary hover:bg-primary/90 text-background-dark py-3 rounded-lg font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Check className="w-5 h-5" />
                )}
                {isSaving ? 'Salvando...' : selectedExpense ? 'Atualizar Despesa' : 'Cadastrar Nova Despesa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background-dark/90 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative bg-surface-dark border border-border-dark p-8 rounded-2xl max-w-sm w-full shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-rose-500" />
            </div>
            <div>
              <h4 className="text-xl font-bold text-white">Excluir Despesa?</h4>
              <p className="text-slate-400 mt-2">Esta ação não pode ser desfeita.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 px-4 py-3 rounded-lg border border-border-dark text-slate-400 font-bold hover:bg-white/5 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 px-4 py-3 rounded-lg bg-rose-500 text-white font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} onHide={hideToast} />
    </AppLayout>
  );
}
