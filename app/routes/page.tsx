'use client';

import React from 'react';
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
  UserPlus
} from 'lucide-react';
import { cn } from '@/lib/utils';

const routes = [
  { destination: 'Rio de Janeiro', freight: 'R$ 500,00', driver: 'R$ 150 / R$ 120', helper: 'R$ 80 / R$ 60' },
  { destination: 'São Paulo', freight: 'R$ 1.200,00', driver: 'R$ 350 / R$ 300', helper: 'R$ 150 / R$ 120' },
  { destination: 'Belo Horizonte', freight: 'R$ 950,00', driver: 'R$ 280 / R$ 240', helper: 'R$ 120 / R$ 100' },
  { destination: 'Curitiba', freight: 'R$ 1.500,00', driver: 'R$ 450 / R$ 400', helper: 'R$ 200 / R$ 160' },
];

export default function RoutesPage() {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

  return (
    <AppLayout>
      <Header 
        title="Viagens" 
        actionLabel="Nova Viagem" 
        onAction={() => setIsDrawerOpen(true)}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-8 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black tracking-tight">Viagens</h2>
              <p className="text-slate-500 mt-1">Gerencie os valores de frete, motoristas e ajudantes por viagem.</p>
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
                {routes.map((route, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-white">{route.destination}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-300">{route.freight}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-400">{route.driver}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-400">{route.helper}</span>
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
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Exibindo 4 de 128 viagens cadastradas</p>
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
                <h3 className="text-xl font-bold text-white">Nova Viagem</h3>
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
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-primary uppercase tracking-widest block">Valor Total do Frete</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-primary/50">R$</span>
                    <input 
                      className="w-full pl-12 pr-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm font-bold text-white outline-none" 
                      placeholder="0,00" 
                      type="text"
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
                        type="text"
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
                        type="text"
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
                        type="text"
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
                        type="text"
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
              >
                Cancelar
              </button>
              <button className="flex-1 bg-primary hover:bg-primary/90 text-background-dark py-3 rounded-lg font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                Salvar Viagem
              </button>
            </div>
          </aside>
        </div>
      )}
    </AppLayout>
  );
}
