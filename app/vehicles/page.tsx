'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Header } from '@/components/Header';
import { 
  Search, 
  Filter, 
  Truck, 
  Edit, 
  ChevronLeft, 
  ChevronRight,
  X,
  Check,
  Loader2
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
  lastMaintenance: string | null;
}

export default function VehiclesPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    plate: '',
    type: 'Caminhão',
    brand: '',
    model: '',
    year: new Date().getFullYear().toString(),
    capacity: ''
  });

  const fetchVehicles = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/vehicles');
      if (!res.ok) {
        const text = await res.text();
        console.error('API error response:', text);
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setVehicles(data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleSave = async () => {
    if (!formData.plate || !formData.brand || !formData.model) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsDrawerOpen(false);
        setFormData({
          plate: '',
          type: 'Caminhão',
          brand: '',
          model: '',
          year: new Date().getFullYear().toString(),
          capacity: ''
        });
        fetchVehicles();
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

  return (
    <AppLayout>
      <Header 
        title="Cadastro de Veículos" 
        actionLabel="Novo Veículo" 
        onAction={() => setIsDrawerOpen(true)}
      />
      
      <div className="flex-1 overflow-auto p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Filters and Search */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input 
                className="w-full pl-12 pr-4 py-3 bg-surface-dark border border-border-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm transition-all text-white placeholder:text-slate-600"
                placeholder="Pesquisar por placa, modelo ou status..."
                type="text"
              />
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-3 bg-surface-dark border border-border-dark rounded-xl text-sm font-medium hover:border-primary transition-colors text-slate-300">
                <span>Tipo</span>
                <Filter className="w-4 h-4" />
              </button>
              <button className="flex items-center gap-2 px-4 py-3 bg-surface-dark border border-border-dark rounded-xl text-sm font-medium hover:border-primary transition-colors text-slate-300">
                <span>Status</span>
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Vehicles Table */}
          <div className="bg-surface-dark border border-border-dark rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background-dark/50">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Placa</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tipo</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Marca/Modelo</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Última Manutenção</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-sm text-slate-500">Carregando veículos...</p>
                      </div>
                    </td>
                  </tr>
                ) : vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                      Nenhum veículo cadastrado.
                    </td>
                  </tr>
                ) : vehicles.map((v, i) => (
                  <tr key={v.id || i} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-5 font-bold text-white">{v.plate}</td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-background-dark text-slate-300 text-[10px] font-bold uppercase tracking-tight border border-border-dark">
                        <Truck className="w-3 h-3" /> {v.type}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-slate-300">{v.brand} {v.model}</td>
                    <td className="px-6 py-5">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold",
                        v.status === 'ACTIVE' || v.status === 'Ativo' ? "bg-emerald-500/10 text-emerald-500" :
                        v.status === 'MAINTENANCE' || v.status === 'Manutenção' ? "bg-amber-500/10 text-amber-500" :
                        "bg-slate-500/10 text-slate-500"
                      )}>
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          v.status === 'ACTIVE' || v.status === 'Ativo' ? "bg-emerald-500" :
                          v.status === 'MAINTENANCE' || v.status === 'Manutenção' ? "bg-amber-500" :
                          "bg-slate-500"
                        )} />
                        {v.status === 'ACTIVE' ? 'Ativo' : v.status === 'MAINTENANCE' ? 'Manutenção' : v.status === 'INACTIVE' ? 'Inativo' : v.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-slate-500 text-sm">
                      {v.lastMaintenance ? new Date(v.lastMaintenance).toLocaleDateString('pt-BR') : 'Sem registro'}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination */}
            <div className="px-6 py-4 bg-background-dark/30 border-t border-border-dark flex items-center justify-between">
              <p className="text-xs text-slate-500 font-medium">Mostrando 1-4 de 24 veículos</p>
              <div className="flex gap-2">
                <button className="p-2 border border-border-dark rounded-lg bg-surface-dark hover:border-primary transition-colors disabled:opacity-50" disabled>
                  <ChevronLeft className="w-4 h-4 text-slate-500" />
                </button>
                <button className="p-2 border border-border-dark rounded-lg bg-surface-dark hover:border-primary transition-colors">
                  <ChevronRight className="w-4 h-4 text-slate-500" />
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
                <h3 className="text-xl font-bold text-white">Novo Veículo</h3>
                <p className="text-sm text-slate-500 mt-1">Preencha os dados básicos do veículo</p>
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
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Placa do Veículo</label>
                <input 
                  className="w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-primary outline-none text-white placeholder:text-slate-700"
                  placeholder="Ex: ABC-1234"
                  type="text"
                  value={formData.plate}
                  onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tipo de Veículo</label>
                <select 
                  className="w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-primary outline-none text-white appearance-none"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="Caminhão">Caminhão</option>
                  <option value="Van">Van</option>
                  <option value="Carro de Passeio">Carro de Passeio</option>
                  <option value="Utilitário">Utilitário</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Marca</label>
                  <input 
                    className="w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-primary outline-none text-white placeholder:text-slate-700"
                    placeholder="Ex: Scania"
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Modelo</label>
                  <input 
                    className="w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-primary outline-none text-white placeholder:text-slate-700"
                    placeholder="Ex: R450"
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ano de Fabricação</label>
                <input 
                  className="w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-primary outline-none text-white placeholder:text-slate-700"
                  placeholder="2023"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Capacidade (kg)</label>
                <input 
                  className="w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-primary outline-none text-white placeholder:text-slate-700"
                  placeholder="12000"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                />
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
                {isSaving ? 'Salvando...' : 'Salvar Veículo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
