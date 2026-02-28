'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import { Header } from '@/components/Header';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Receipt, 
  Wallet,
  Navigation,
  MoreVertical
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { cn } from '@/lib/utils';

const data = [
  { name: 'Semana 01', revenue: 4000, expenses: 2400 },
  { name: 'Semana 02', revenue: 3000, expenses: 1398 },
  { name: 'Semana 03', revenue: 2000, expenses: 9800 },
  { name: 'Semana 04', revenue: 2780, expenses: 3908 },
  { name: 'Final', revenue: 1890, expenses: 4800 },
];

const stats = [
  { 
    label: 'RECEITA TOTAL', 
    value: 'R$ 45.280,00', 
    change: '+12.5%', 
    trend: 'up', 
    icon: DollarSign,
    color: 'text-primary'
  },
  { 
    label: 'DESPESAS TOTAIS', 
    value: 'R$ 12.150,00', 
    change: '-2.4%', 
    trend: 'down', 
    icon: Receipt,
    color: 'text-rose-500'
  },
  { 
    label: 'LUCRO FINAL', 
    value: 'R$ 33.130,00', 
    change: '+15.8%', 
    trend: 'up', 
    icon: Wallet,
    color: 'text-emerald-500'
  },
];

const recentTrips = [
  { route: 'RJ → SP', plate: 'KXP-4D21', id: '#FR-8892', value: 'R$ 2.450,00', status: 'Entregue', date: '24 Out, 08:30' },
  { route: 'MG → RJ', plate: 'ABC-1J22', id: '#FR-8895', value: 'R$ 1.890,00', status: 'Em Trânsito', date: '25 Out, 06:15' },
  { route: 'SP → PR', plate: 'LMX-0A15', id: '#FR-8901', value: 'R$ 3.120,00', status: 'Agendado', date: '25 Out, 14:00' },
];

export default function Dashboard() {
  return (
    <AppLayout>
      <Header title="Visão Geral do Dashboard" actionLabel="Nova Viagem" />
      
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="bg-surface-dark p-6 rounded-xl border border-border-dark shadow-sm relative overflow-hidden group">
                <div className="flex justify-between items-start mb-4">
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
                  <div className={cn("p-2 rounded-lg bg-opacity-10", stat.color.replace('text-', 'bg-'))}>
                    <stat.icon className={cn("w-5 h-5", stat.color)} />
                  </div>
                </div>
                <p className="text-3xl font-black text-white tracking-tight">{stat.value}</p>
                <div className="mt-4 flex items-center gap-2">
                  <span className={cn(
                    "flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                    stat.trend === 'up' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                  )}>
                    {stat.trend === 'up' ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                    {stat.change}
                  </span>
                  <span className="text-slate-500 text-[10px] font-medium uppercase">vs mês anterior</span>
                </div>
              </div>
            ))}
          </div>

          {/* Chart Section */}
          <div className="bg-surface-dark rounded-xl border border-border-dark p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-lg font-bold text-white">Desempenho Financeiro</h3>
                <p className="text-sm text-slate-500">Comparativo de Receitas vs Despesas</p>
              </div>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="text-xs font-semibold text-slate-400">Receita</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-500"></div>
                  <span className="text-xs font-semibold text-slate-400">Despesas</span>
                </div>
              </div>
            </div>
            
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f48c25" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f48c25" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#393028" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#5A5A40" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#5A5A40" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(value) => `R$ ${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#27211b', border: '1px solid #393028', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#f48c25" 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="expenses" 
                    stroke="#94a3b8" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    fill="transparent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Trips Table */}
          <div className="bg-surface-dark rounded-xl border border-border-dark shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border-dark flex justify-between items-center">
              <h3 className="font-bold text-white">Viagens Recentes</h3>
              <button className="text-sm font-bold text-primary hover:underline">Ver Todas</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-background-dark/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">Rota</th>
                    <th className="px-6 py-4">Placa</th>
                    <th className="px-6 py-4">ID Viagem</th>
                    <th className="px-6 py-4">Valor</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dark">
                  {recentTrips.map((trip, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                            <Navigation className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{trip.route}</p>
                            <p className="text-[10px] text-slate-500">Agendado: {trip.date}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-300">{trip.plate}</td>
                      <td className="px-6 py-4 text-sm font-mono text-slate-500">{trip.id}</td>
                      <td className="px-6 py-4 text-sm font-bold text-white">{trip.value}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border",
                          trip.status === 'Entregue' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                          trip.status === 'Em Trânsito' ? "bg-primary/10 text-primary border-primary/20" :
                          "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        )}>
                          {trip.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-slate-500 hover:text-primary transition-colors">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
