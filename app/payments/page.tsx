'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import { Header } from '@/components/Header';
import { 
  Calculator, 
  Calendar, 
  User, 
  TrendingUp, 
  RefreshCw, 
  Info,
  FileText,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

const dailyDetails = [
  { date: '12 Out, 2023', route: 'Centro x Barra da Tijuca', trips: '08', unitValue: 'R$ 35,00', extra: 'R$ 15,00', total: 'R$ 295,00', status: 'CONCLUÍDO' },
  { date: '11 Out, 2023', route: 'Copacabana x Galeão (GIG)', trips: '06', unitValue: 'R$ 45,00', extra: 'R$ 20,00', total: 'R$ 290,00', status: 'CONCLUÍDO' },
  { date: '10 Out, 2023', route: 'Niterói x Recreio', trips: '04', unitValue: 'R$ 55,00', extra: 'R$ 25,00', total: 'R$ 245,00', status: 'CONCLUÍDO' },
  { date: '09 Out, 2023', route: 'Madureira x Botafogo', trips: '10', unitValue: 'R$ 28,00', extra: 'R$ 10,00', total: 'R$ 290,00', status: 'CONCLUÍDO' },
  { date: '08 Out, 2023', route: 'Centro x Ilha do Governador', trips: '07', unitValue: 'R$ 38,00', extra: 'R$ 12,00', total: 'R$ 278,00', status: 'CONCLUÍDO' },
];

export default function PaymentsPage() {
  return (
    <AppLayout>
      <Header 
        title="Pagamentos" 
        actionLabel="Finalizar e Gerar Relatório" 
      />
      
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Welcome & Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
            <div className="lg:col-span-1">
              <h3 className="text-2xl font-black text-white tracking-tight">Pagamentos</h3>
              <p className="text-slate-400 text-sm mt-1">Gestão de pagamentos e ganhos dos motoristas.</p>
            </div>
            
            <div className="lg:col-span-2 flex flex-wrap gap-4 justify-end">
              <div className="flex flex-col gap-1.5 min-w-[240px]">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Motorista Profissional</label>
                <div className="relative">
                  <select className="w-full bg-surface-dark border border-border-dark text-slate-200 rounded-lg h-11 pl-10 pr-4 focus:ring-primary focus:border-primary appearance-none outline-none text-sm">
                    <option>Carlos Eduardo Oliveira</option>
                    <option>Marcos Vinícius Santos</option>
                    <option>Ana Paula Ferreira</option>
                  </select>
                  <User className="absolute left-3 top-3 text-slate-500 w-4 h-4" />
                  <ChevronDown className="absolute right-3 top-3 text-slate-500 w-4 h-4" />
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Período</label>
                <div className="relative">
                  <input 
                    className="bg-surface-dark border border-border-dark text-slate-200 rounded-lg h-11 pl-10 pr-4 focus:ring-primary focus:border-primary w-[240px] text-sm outline-none" 
                    type="text" 
                    defaultValue="01/10/2023 - 31/10/2023"
                  />
                  <Calendar className="absolute left-3 top-3 text-slate-500 w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-dark border border-border-dark p-6 rounded-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <Calculator className="w-16 h-16 text-primary" />
              </div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Total a Pagar</p>
              <h4 className="text-3xl font-black text-white mt-2">R$ 4.850,00</h4>
              <div className="flex items-center gap-1 mt-2 text-emerald-500 text-[10px] font-bold uppercase tracking-tight">
                <TrendingUp className="w-3 h-3" />
                +12.5% vs mês anterior
              </div>
            </div>
            
            <div className="bg-surface-dark border border-border-dark p-6 rounded-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <RefreshCw className="w-16 h-16 text-primary" />
              </div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Total de Viagens</p>
              <h4 className="text-3xl font-black text-white mt-2">142</h4>
              <div className="flex items-center gap-1 mt-2 text-slate-500 text-[10px] font-bold uppercase tracking-tight">
                <RefreshCw className="w-3 h-3" />
                Média de 6.4/dia
              </div>
            </div>
            
            <div className="bg-surface-dark border border-border-dark p-6 rounded-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <Calendar className="w-16 h-16 text-primary" />
              </div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Dias Ativos</p>
              <h4 className="text-3xl font-black text-white mt-2">22</h4>
              <div className="flex items-center gap-1 mt-2 text-primary text-[10px] font-bold uppercase tracking-tight">
                <Info className="w-3 h-3" />
                Disponibilidade de 100%
              </div>
            </div>
          </div>

          {/* Data Grid Table */}
          <div className="bg-surface-dark border border-border-dark rounded-xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border-dark flex items-center justify-between">
              <h5 className="text-white font-bold">Detalhamento Diário</h5>
              <div className="flex gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-tight">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  Cálculo Válido
                </span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-slate-500 text-[10px] uppercase tracking-widest font-bold bg-background-dark/50">
                    <th className="px-6 py-4 border-b border-border-dark">Data</th>
                    <th className="px-6 py-4 border-b border-border-dark">Rota Principal</th>
                    <th className="px-6 py-4 border-b border-border-dark text-center">Viagens</th>
                    <th className="px-6 py-4 border-b border-border-dark">Valor Unit.</th>
                    <th className="px-6 py-4 border-b border-border-dark">Extra (2ª)</th>
                    <th className="px-6 py-4 border-b border-border-dark text-right">Total Dia</th>
                    <th className="px-6 py-4 border-b border-border-dark text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-300 divide-y divide-border-dark">
                  {dailyDetails.map((row, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{row.date}</td>
                      <td className="px-6 py-4 text-xs">{row.route}</td>
                      <td className="px-6 py-4 text-center font-mono">{row.trips}</td>
                      <td className="px-6 py-4 text-xs">{row.unitValue}</td>
                      <td className="px-6 py-4 text-xs">{row.extra}</td>
                      <td className="px-6 py-4 text-right font-bold text-white">{row.total}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-[9px] font-bold uppercase tracking-tighter border border-emerald-500/20">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-primary/5">
                    <td className="px-6 py-6 text-right font-bold text-slate-500 text-[10px] uppercase tracking-widest" colSpan={5}>
                      SUBTOTAL PERÍODO VISÍVEL:
                    </td>
                    <td className="px-6 py-6 text-right font-black text-primary text-xl">R$ 1.398,00</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Footer Action */}
          <div className="flex flex-col md:flex-row justify-end items-center gap-6 pt-4 pb-12">
            <p className="text-xs text-slate-500 max-w-md text-center md:text-right">
              Os valores acima contemplam taxas administrativas e bônus de performance calculados automaticamente pelo sistema.
            </p>
            <button className="bg-primary hover:bg-primary/90 text-background-dark px-8 py-4 rounded-lg text-base font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-3">
              <FileText className="w-5 h-5" />
              Finalizar e Enviar para Pagamento
            </button>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
