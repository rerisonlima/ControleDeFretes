'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Header } from '@/components/Header';
import { 
  Search, 
  MapPin, 
  Edit, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  X,
  Check,
  BadgeInfo,
  UserPlus,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Route {
  id: number;
  destination: string;
  freightValue: number;
  driverValue1: number;
  driverValue2: number;
  helperValue1: number;
  helperValue2: number;
}

export default function RoutesPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    destination: '',
    freightValue: '',
    driverValue1: '',
    driverValue2: '',
    helperValue1: '',
    helperValue2: ''
  });

  const fetchRoutes = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/routes');
      if (res.ok) {
        const data = await res.json();
        setRoutes(data);
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleSave = async () => {
    if (!formData.destination || !formData.freightValue) {
      alert('Por favor, preencha o destino e o valor do frete.');
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsDrawerOpen(false);
        setFormData({
          destination: '',
          freightValue: '',
          driverValue1: '',
          driverValue2: '',
          helperValue1: '',
          helperValue2: ''
        });
        fetchRoutes();
      } else {
        const error = await res.json();
        alert(error.error || 'Erro ao salvar rota');
      }
    } catch (error) {
      console.error('Error saving route:', error);
      alert('Erro de conexão ao salvar rota');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout>
      <Header 
        title="Cadastro de Valores de Frete" 
        actionLabel="Nova Rota" 
        onAction={() => setIsDrawerOpen(true)}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-8 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black tracking-tight">Tabela de Fretes</h2>
              <p className="text-slate-500 mt-1">Gerencie os valores de frete, motoristas e ajudantes por rota de destino.</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input 
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none" 
                placeholder="Buscar por cidade de destino..." 
                type="text"
              />
            </div>
            <div className="flex items-center gap-2">
              <select className="bg-surface-dark border border-border-dark rounded-lg py-2.5 px-4 text-sm text-slate-300 focus:ring-primary focus:border-primary outline-none appearance-none pr-10 relative">
                <option>Status: Ativo</option>
                <option>Status: Inativo</option>
                <option>Todos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-auto px-8 pb-8 custom-scrollbar">
          <div className="border border-border-dark rounded-xl bg-surface-dark overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead className="bg-background-dark/50 border-b border-border-dark">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Destino</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Valor Frete</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Motorista (1ª/2ª)</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Ajudante (1ª/2ª)</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-sm text-slate-500">Carregando rotas...</p>
                      </div>
                    </td>
                  </tr>
                ) : routes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                      Nenhuma rota cadastrada.
                    </td>
                  </tr>
                ) : routes.map((route, i) => (
                  <tr key={route.id || i} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-white">{route.destination}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-300">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(route.freightValue)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-400">
                        R$ {route.driverValue1} / R$ {route.driverValue2}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-400">
                        R$ {route.helperValue1} / R$ {route.helperValue2}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-6 py-4 bg-background-dark/30 flex items-center justify-between border-t border-border-dark">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Exibindo 4 de 128 rotas cadastradas</p>
              <div className="flex gap-2">
                <button className="p-1.5 rounded hover:bg-surface-dark text-slate-500">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded hover:bg-surface-dark text-slate-500">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Side Panel (Drawer) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <aside className="w-full max-w-[450px] bg-background-dark h-full shadow-2xl border-l border-border-dark flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-border-dark flex items-center justify-between bg-primary/5">
              <div>
                <h3 className="text-xl font-bold text-white">Nova Rota</h3>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Configuração de Valores Operacionais</p>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              {/* Main Info */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Cidade de Destino</label>
                  <input 
                    className="w-full px-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none" 
                    placeholder="Ex: Rio de Janeiro" 
                    type="text"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-primary uppercase tracking-widest block">Valor Total do Frete</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-primary/50">R$</span>
                    <input 
                      className="w-full pl-12 pr-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm font-bold text-white outline-none" 
                      placeholder="0,00" 
                      type="number"
                      value={formData.freightValue}
                      onChange={(e) => setFormData({ ...formData, freightValue: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <hr className="border-border-dark" />

              {/* Driver Rates */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <BadgeInfo className="w-4 h-4 text-primary" />
                  <h4 className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Valores Motorista</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest block">1ª Viagem</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600">R$</span>
                      <input 
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none" 
                        placeholder="0,00" 
                        type="number"
                        value={formData.driverValue1}
                        onChange={(e) => setFormData({ ...formData, driverValue1: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest block">2ª Viagem</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600">R$</span>
                      <input 
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none" 
                        placeholder="0,00" 
                        type="number"
                        value={formData.driverValue2}
                        onChange={(e) => setFormData({ ...formData, driverValue2: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Helper Rates */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-primary" />
                  <h4 className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Valores Ajudante</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest block">1ª Viagem</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600">R$</span>
                      <input 
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none" 
                        placeholder="0,00" 
                        type="number"
                        value={formData.helperValue1}
                        onChange={(e) => setFormData({ ...formData, helperValue1: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest block">2ª Viagem</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-600">R$</span>
                      <input 
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none" 
                        placeholder="0,00" 
                        type="number"
                        value={formData.helperValue2}
                        onChange={(e) => setFormData({ ...formData, helperValue2: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                <p className="text-[10px] leading-relaxed text-slate-500 italic">
                  * Os valores aqui cadastrados serão utilizados como base para o cálculo automático de fechamento de quinzena dos colaboradores.
                </p>
              </div>
            </div>

            <div className="p-8 border-t border-border-dark bg-background-dark/50 flex items-center gap-4">
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="px-6 py-3 rounded-lg border border-border-dark text-slate-400 font-bold hover:bg-surface-dark hover:text-white transition-colors"
                disabled={isSaving}
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
                {isSaving ? 'Salvando...' : 'Salvar Rota'}
              </button>
            </div>
          </aside>
        </div>
      )}
    </AppLayout>
  );
}
