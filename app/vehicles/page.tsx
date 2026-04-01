'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Header } from '@/components/Header';
import { 
  Search, 
  Download, 
  Edit, 
  ChevronLeft, 
  ChevronRight,
  X,
  Plus,
  Info,
  Loader2,
  Truck,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Vehicle {
  id: number;
  plate: string;
  type: string;
  brand: string;
  model: string;
  year: number;
  capacity: number;
  status: string;
  categoriaId: number | null;
  categoria?: {
    CategoriaNome: string;
  };
}

interface Category {
  id: number;
  CategoriaNome: string;
}

export default function VehiclesPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    id: 0,
    plate: '',
    type: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    capacity: 0,
    status: 'ACTIVE',
    categoriaId: ''
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [vehiclesRes, categoriesRes] = await Promise.all([
        fetch('/api/vehicles'),
        fetch('/api/categorias')
      ]);

      if (vehiclesRes.ok) {
        const data = await vehiclesRes.json();
        setVehicles(data);
      }
      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data);
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
    if (vehicle) {
      setFormData({
        id: vehicle.id,
        plate: vehicle.plate,
        type: vehicle.type,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        capacity: vehicle.capacity,
        status: vehicle.status,
        categoriaId: vehicle.categoriaId?.toString() || ''
      });
    } else {
      setFormData({
        id: 0,
        plate: '',
        type: '',
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        capacity: 0,
        status: 'ACTIVE',
        categoriaId: ''
      });
    }
    setIsDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!formData.plate || !formData.brand || !formData.model) {
      alert('Por favor, preencha os campos obrigatórios (Placa, Marca, Modelo).');
      return;
    }

    try {
      setIsSaving(true);
      
      const url = formData.id ? `/api/vehicles/${formData.id}` : '/api/vehicles';
      const method = formData.id ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          year: parseInt(formData.year.toString()),
          capacity: parseFloat(formData.capacity.toString()),
          categoriaId: formData.categoriaId ? parseInt(formData.categoriaId) : null
        }),
      });

      if (res.ok) {
        setIsDrawerOpen(false);
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || 'Erro ao salvar veículo');
      }
    } catch (error) {
      console.error('Error saving vehicle:', error);
      alert('Erro de conexão ao salvar veículo');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredVehicles = vehicles.filter(v => 
    v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <Header 
        title="Gestão de Frota" 
        actionLabel="Novo Veículo" 
        onAction={() => handleOpenDrawer()}
      />
      
      <div className="flex-1 overflow-auto p-4 md:p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
            <div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2 text-white uppercase">Veículos</h2>
              <p className="text-sm text-slate-500">Controle de frotas, categorias e status operacional.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-initial">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                  type="text"
                  placeholder="Buscar placa, marca..."
                  className="pl-10 pr-4 py-2 bg-surface-dark border border-border-dark rounded-lg text-sm text-white focus:ring-2 focus:ring-primary outline-none w-full sm:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold bg-surface-dark border border-border-dark rounded-lg hover:bg-border-dark transition-colors text-slate-300">
                <Download className="w-4 h-4" />
                Exportar
              </button>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-surface-dark rounded-xl border border-border-dark overflow-hidden shadow-sm">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-background-dark/50">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-border-dark">Placa</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-border-dark">Veículo</th>
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
                  ) : filteredVehicles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                        Nenhum veículo encontrado.
                      </td>
                    </tr>
                  ) : filteredVehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20 uppercase tracking-wider">
                          {v.plate}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-white">{v.brand} {v.model}</span>
                          <span className="text-[10px] text-slate-500 uppercase">{v.type} • {v.year}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-400">
                          {v.categoria?.CategoriaNome || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border",
                          v.status === 'ACTIVE' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : 
                          v.status === 'MAINTENANCE' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                          "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        )}>
                          {v.status === 'ACTIVE' ? 'Ativo' : v.status === 'MAINTENANCE' ? 'Manutenção' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleOpenDrawer(v)}
                          className="text-slate-500 hover:text-primary transition-colors p-2 rounded-lg hover:bg-primary/10"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-border-dark">
              {isLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Carregando frota...</p>
                </div>
              ) : filteredVehicles.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm italic">
                  Nenhum veículo encontrado.
                </div>
              ) : filteredVehicles.map((v) => (
                <div key={v.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-2">
                      <span className="text-sm font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 uppercase tracking-wider w-fit">
                        {v.plate}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white">{v.brand} {v.model}</span>
                        <span className="text-[10px] text-slate-500 uppercase">{v.type} • {v.year}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button 
                        onClick={() => handleOpenDrawer(v)}
                        className="text-slate-500 hover:text-primary transition-colors p-2 rounded-lg hover:bg-primary/10"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border",
                        v.status === 'ACTIVE' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : 
                        v.status === 'MAINTENANCE' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                        "bg-rose-500/10 text-rose-500 border-rose-500/20"
                      )}>
                        {v.status === 'ACTIVE' ? 'Ativo' : v.status === 'MAINTENANCE' ? 'Manutenção' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-white/5">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-0.5">Categoria</p>
                    <p className="text-xs text-slate-300">{v.categoria?.CategoriaNome || '-'}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="px-6 py-4 bg-background-dark/30 border-t border-border-dark flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Mostrando {filteredVehicles.length} veículos</span>
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
          <div className="w-full sm:max-w-[450px] bg-background-dark h-full shadow-2xl border-l border-border-dark flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-4 md:p-8 border-b border-border-dark flex items-center justify-between">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-white uppercase tracking-tight">
                  {formData.id ? 'Editar Veículo' : 'Novo Veículo'}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {formData.id ? 'Atualize os dados técnicos do veículo' : 'Cadastre um novo veículo na frota'}
                </p>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-4 md:p-8 space-y-6 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Placa</label>
                  <input 
                    className="w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-primary outline-none text-white placeholder:text-slate-700 font-mono uppercase tracking-widest"
                    placeholder="ABC-1234"
                    type="text"
                    value={formData.plate}
                    onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ano</label>
                  <input 
                    className="w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-primary outline-none text-white placeholder:text-slate-700"
                    placeholder="2024"
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Marca</label>
                  <input 
                    className="w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-primary outline-none text-white placeholder:text-slate-700"
                    placeholder="Ex: Mercedes-Benz"
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Modelo</label>
                  <input 
                    className="w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-primary outline-none text-white placeholder:text-slate-700"
                    placeholder="Ex: Accelo 1016"
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tipo de Carroceria</label>
                <select 
                  className="w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-primary outline-none text-white appearance-none"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="">Selecione o tipo</option>
                  <option value="BAU">Baú</option>
                  <option value="SIDER">Sider</option>
                  <option value="CARGA_ABERTA">Carga Aberta</option>
                  <option value="REFRIGERADO">Refrigerado</option>
                  <option value="PORTA_CONTAINER">Porta Container</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Capacidade (Ton)</label>
                  <input 
                    className="w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-primary outline-none text-white placeholder:text-slate-700"
                    placeholder="Ex: 10.5"
                    type="number"
                    step="0.1"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Categoria</label>
                  <select 
                    className="w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-primary outline-none text-white appearance-none"
                    value={formData.categoriaId}
                    onChange={(e) => setFormData({ ...formData, categoriaId: e.target.value })}
                  >
                    <option value="">Selecione a categoria</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.CategoriaNome}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status Operacional</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'ACTIVE', label: 'Ativo', color: 'emerald' },
                    { id: 'MAINTENANCE', label: 'Manutenção', color: 'amber' },
                    { id: 'INACTIVE', label: 'Inativo', color: 'rose' }
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setFormData({ ...formData, status: s.id })}
                      className={cn(
                        "py-2 rounded-lg text-[10px] font-bold uppercase border transition-all",
                        formData.status === s.id 
                          ? `bg-${s.color}-500/20 text-${s.color}-500 border-${s.color}-500/50`
                          : "bg-surface-dark text-slate-500 border-border-dark hover:border-slate-700"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-primary mb-1">Dica</p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Certifique-se de que a categoria do veículo corresponde às tabelas de frete para que ele apareça nas opções de agendamento de viagens.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 md:p-8 bg-background-dark/50 border-t border-border-dark flex gap-4">
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
                {isSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
