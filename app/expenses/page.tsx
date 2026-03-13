'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Header } from '@/components/Header';
import { 
  Search, 
  Calendar, 
  ChevronDown, 
  Fuel, 
  User, 
  Plus, 
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Info,
  Wrench,
  Loader2,
  AlertCircle,
  Edit,
  Trash2
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

  // Form State
  const [formData, setFormData] = useState({
    type: '',
    value: '',
    date: new Date().toISOString().split('T')[0],
    vehicleId: '',
    status: 'PAID'
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [expRes, vehRes] = await Promise.all([
        fetch('/api/expenses'),
        fetch('/api/vehicles')
      ]);
      
      if (!expRes.ok) {
        console.error('Expenses API error:', await expRes.text());
      } else {
        setExpenses(await expRes.json());
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
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDrawer = (expense: Expense | null = null) => {
    if (expense) {
      setSelectedExpense(expense);
      setFormData({
        type: expense.type,
        value: expense.value.toString(),
        date: new Date(expense.date).toISOString().split('T')[0],
        vehicleId: expense.vehicleId?.toString() || '',
        status: expense.status
      });
    } else {
      setSelectedExpense(null);
      setFormData({
        type: '',
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
        setIsDrawerOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error saving expense:', error);
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
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const getIcon = (type: string) => {
    if (type.toLowerCase().includes('combustível')) return Fuel;
    if (type.toLowerCase().includes('manutenção')) return Wrench;
    if (type.toLowerCase().includes('pagamento')) return User;
    return AlertCircle;
  };

  return (
    <AppLayout>
      <Header 
        title="Cadastro de Despesas" 
        actionLabel="Nova Despesa" 
        onAction={() => handleOpenDrawer()}
      />
      
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Filters Bar */}
          <div className="bg-surface-dark border border-border-dark rounded-xl p-4 flex flex-wrap items-center gap-4">
            <div className="flex flex-col gap-1.5 min-w-[180px]">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Período</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input 
                  className="bg-background-dark border border-border-dark rounded-lg pl-10 pr-3 py-2 text-xs text-slate-300 w-full focus:ring-1 focus:ring-primary outline-none" 
                  type="text" 
                  defaultValue="Out 01 - Out 31, 2023"
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5 min-w-[150px]">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Tipo de Despesa</label>
              <div className="relative">
                <select className="bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-xs text-slate-300 w-full focus:ring-1 focus:ring-primary appearance-none outline-none">
                  <option>Todos os Tipos</option>
                  <option>Combustível</option>
                  <option>Pagamento Motorista</option>
                  <option>Manutenção</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5 min-w-[150px]">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-widest ml-1">Veículo</label>
              <div className="relative">
                <select className="bg-background-dark border border-border-dark rounded-lg px-3 py-2 text-xs text-slate-300 w-full focus:ring-1 focus:ring-primary appearance-none outline-none">
                  <option>Todos os Veículos</option>
                  <option>KXC-1234</option>
                  <option>RJX-9988</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              </div>
            </div>
            
            <div className="ml-auto self-end">
              <button className="text-xs font-bold text-primary border border-primary/30 px-4 py-2 rounded-lg hover:bg-primary/10 transition-colors">Limpar Filtros</button>
            </div>
          </div>

          {/* Expense Table */}
          <div className="bg-surface-dark border border-border-dark rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-dark bg-background-dark/30">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Data</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tipo de Despesa</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Veículo</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Valor (R$)</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Ações</th>
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
                      Nenhuma despesa registrada.
                    </td>
                  </tr>
                ) : expenses.map((exp, i) => {
                  const Icon = getIcon(exp.type);
                  return (
                    <tr key={exp.id || i} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {new Date(exp.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium text-white">{exp.type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                        {exp.vehicle?.plate || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(exp.value)}
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
                          ) : (
                            <>
                              <button 
                                onClick={() => handleOpenDrawer(exp)}
                                className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => setDeleteConfirmId(exp.id)}
                                className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            <div className="px-6 py-4 bg-background-dark/30 flex items-center justify-between">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Mostrando 4 de 24 registros</p>
              <div className="flex items-center gap-2">
                <button className="p-1.5 rounded bg-surface-dark border border-border-dark text-slate-500 hover:text-primary transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-primary px-2">1</span>
                <button className="p-1.5 rounded bg-surface-dark border border-border-dark text-slate-500 hover:text-primary transition-colors">
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
          <div className="w-full max-w-[400px] bg-background-dark h-full shadow-2xl border-l border-border-dark flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-8 border-b border-border-dark flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedExpense ? 'Editar Despesa' : 'Nova Despesa'}</h3>
                <p className="text-sm text-slate-500 mt-1">{selectedExpense ? 'Atualize os dados da despesa' : 'Registre uma nova saída financeira'}</p>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-8 space-y-6 custom-scrollbar">
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
                    <option value="Extra">Extra</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 pointer-events-none" />
                </div>
              </div>
              
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
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.plate}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 pointer-events-none" />
                </div>
              </div>

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

            <div className="p-8 bg-background-dark/50 border-t border-border-dark flex gap-4">
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="flex-1 px-4 py-3 border border-border-dark rounded-lg text-sm font-bold text-slate-400 hover:bg-surface-dark hover:text-white transition-colors"
                disabled={isSaving}
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 px-4 py-3 bg-primary text-background-dark rounded-lg text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {isSaving ? 'Salvando...' : selectedExpense ? 'Atualizar Despesa' : 'Salvar Despesa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
