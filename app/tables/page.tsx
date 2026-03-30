'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Header } from '@/components/Header';
import { 
  Search, 
  Truck, 
  Edit, 
  ChevronLeft, 
  ChevronRight,
  X,
  Plus,
  Info,
  Loader2,
  Power,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Category {
  id: number;
  name: string;
}

interface Vehicle {
  id: number;
  plate: string;
  model: string;
  active: boolean;
  categoryId: number;
  category: Category;
}

export default function VehiclesPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    id: 0,
    plate: '',
    model: '',
    categoryId: '',
    active: true
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [vRes, cRes] = await Promise.all([
        fetch('/api/vehicles'),
        fetch('/api/categories')
      ]);
      
      if (vRes.ok && cRes.ok) {
        setVehicles(await vRes.json());
        setCategories(await cRes.json());
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

  const handleOpenDrawer = (vehicle?: Vehicle) => {
    setError('');
    if (vehicle) {
      setFormData({
        id: vehicle.id,
        plate: vehicle.plate,
        model: vehicle.model,
        categoryId: vehicle.categoryId.toString(),
        active: vehicle.active
      });
    } else {
      setFormData({
        id: 0,
        plate: '',
        model: '',
        categoryId: '',
        active: true
      });
    }
    setIsDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!formData.plate || !formData.model || !formData.categoryId) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      
      const url = formData.id ? `/api/vehicles/${formData.id}` : '/api/vehicles';
      const method = formData.id ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          categoryId: parseInt(formData.categoryId)
        }),
      });

      if (res.ok) {
        setIsDrawerOpen(false);
        fetchData();
      } else {
        const errData = await res.json();
        setError(errData.error || 'Erro ao salvar veículo');
      }
    } catch (error) {
      console.error('Error saving vehicle:', error);
      setError('Erro de conexão ao salvar veículo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (vehicle: Vehicle) => {
    const action = vehicle.active ? 'desativar' : 'ativar';
    if (!window.confirm(`Tem certeza que deseja ${action} o veículo ${vehicle.plate}?`)) return;

    try {
      const res = await fetch(`/api/vehicles/${vehicle.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...vehicle, active: !vehicle.active }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  return (
    <AppLayout>
      <Header 
        title="Gestão de Veículos" 
        actionLabel="Novo Veículo" 
        onAction={() => handleOpenDrawer()}
      />
      
      <div className="flex-1 overflow-auto p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="flex items-end justify-between mb-2">
            <div>
              <h2 className="text-3xl font-black tracking-tight mb-2">Frota</h2>
              <p className="text-slate-500">Controle de veículos, categorias e status operacional.</p>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-surface-dark rounded-xl border border-border-dark overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background-dark/50">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-border-dark">Placa</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-border-dark">Modelo</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-border-dark">Categoria</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-border-dark">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-border-dark text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-sm text-slate-500">Carregando frota...</p>
                      </div>
                    </td>
                  </tr>
                ) : vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                      Nenhum veículo cadastrado.
                    </td>
                  </tr>
                ) : vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className={cn(
                    "hover:bg-white/5 transition-colors group",
                    !vehicle.active && "opacity-60"
                  )}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-7 rounded bg-background-dark border border-border-dark flex items-center justify-center text-[10px] font-black text-white tracking-tighter">
                          <div className="w-full h-1 bg-blue-600 absolute top-0 rounded-t-sm"></div>
                          {vehicle.plate.toUpperCase()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-white">{vehicle.model}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-400 font-medium">{vehicle.category.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border",
                        vehicle.active ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                      )}>
                        {vehicle.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleOpenDrawer(vehicle)}
                          className="text-slate-500 hover:text-primary transition-colors p-2 rounded-lg hover:bg-primary/10"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(vehicle)}
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            vehicle.active ? "text-slate-500 hover:text-rose-500 hover:bg-rose-500/10" : "text-slate-500 hover:text-emerald-500 hover:bg-emerald-500/10"
                          )}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="px-6 py-4 bg-background-dark/30 border-t border-border-dark flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total de {vehicles.length} veículos</span>
              <div className="flex gap-2">
                <button className="p-1 rounded bg-surface-dark border border-border-dark text-slate-500 disabled:opacity-50" disabled>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="p-1 rounded bg-surface-dark border border-border-dark text-slate-500 disabled:opacity-50" disabled>
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
          <div className="w-full max-w-[450px] bg-background-dark h-full shadow-2xl border-l border-border-dark flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-8 border-b border-border-dark flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {formData.id ? 'Editar Veículo' : 'Novo Veículo'}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {formData.id ? 'Atualize as informações da frota' : 'Cadastre um novo veículo operacional'}
                </p>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-8 space-y-6 custom-scrollbar">
              {error && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Placa</label>
                <input 
                  className="w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-primary outline-none text-white placeholder:text-slate-700 font-black uppercase tracking-widest"
                  placeholder="ABC-1234"
                  type="text"
                  maxLength={8}
                  value={formData.plate}
                  onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Modelo / Descrição</label>
                <input 
                  className="w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-primary outline-none text-white placeholder:text-slate-700"
                  placeholder="Ex: Mercedes-Benz Accelo 1016"
                  type="text"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Categoria</label>
                <select 
                  className="w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-primary outline-none text-white appearance-none"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                >
                  <option disabled value="">Selecione uma categoria</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 p-4 bg-surface-dark border border-border-dark rounded-xl">
                <input 
                  type="checkbox"
                  id="active-check"
                  className="w-5 h-5 rounded border-border-dark bg-background-dark text-primary focus:ring-primary"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
                <label htmlFor="active-check" className="text-sm font-bold text-slate-300 cursor-pointer">Veículo Ativo na Frota</label>
              </div>

              <div className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-primary mb-1">Dica de Gestão</p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Mantenha a categoria atualizada para garantir que os cálculos de frete e pagamentos sejam processados corretamente.
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
                  <Plus className="w-4 h-4" />
                )}
                {isSaving ? 'Salvando...' : 'Salvar Veículo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
