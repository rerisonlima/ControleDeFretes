'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Header } from '@/components/Header';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Filter, 
  Download, 
  Truck, 
  DollarSign, 
  MapPin, 
  Gauge,
  AlertCircle,
  ChevronRight,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  BrainCircuit,
  ArrowUpRight,
  ArrowDownRight,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, startOfWeek, endOfWeek, isSameWeek, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "" });

interface Trip {
  id: number;
  tripId: string;
  vehicleId: number;
  scheduledAt: string;
  value: number;
  odometer: number | null;
  distance?: number;
  vehicle: { plate: string; brand: string; model: string };
  frete?: { cidade: string };
  expenses: Expense[];
}

interface Expense {
  id: number;
  date: string;
  type: string;
  value: number;
  vehicleId: number | null;
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'revenue' | 'expenses'>('revenue');
  const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ trips: Trip[], expenses: Expense[] }>({ trips: [], expenses: [] });
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/data?startDate=${startDate}&endDate=${endDate}`);
      if (res.ok) {
        const result = await res.json();
        setData(result);
        generateAiAnalysis(result);
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateAiAnalysis = async (reportData: { trips: Trip[], expenses: Expense[] }) => {
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) return;
    
    setAnalyzing(true);
    try {
      const prompt = `
        Analise os seguintes dados de logística de uma frota de caminhões para o período de ${startDate} a ${endDate}.
        
        DADOS DE VIAGENS:
        ${JSON.stringify(reportData.trips.map(t => ({
          id: t.tripId,
          data: t.scheduledAt,
          valor: t.value,
          km_percorrido: t.distance || 0,
          veiculo: t.vehicle.plate,
          destino: t.frete?.cidade,
          custo_despesas: t.expenses.reduce((acc, e) => acc + e.value, 0)
        })))}
        
        DADOS DE DESPESAS GERAIS:
        ${JSON.stringify(reportData.expenses.map(e => ({
          data: e.date,
          tipo: e.type,
          valor: e.value
        })))}
        
        Por favor, forneça um relatório executivo em Português (Brasil) contendo:
        1. Resumo de performance (Receita vs Despesa).
        2. Identificação das 3 viagens mais lucrativas (considerando valor do frete vs distância/despesas).
        3. Análise de eficiência por veículo.
        4. Alertas sobre semanas com picos de despesas.
        5. Recomendações estratégicas para melhorar a margem de lucro.
        
        Seja direto, profissional e use bullet points.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      
      setAiAnalysis(response.text || "Análise concluída.");
    } catch (error) {
      console.error("AI Analysis error:", error);
      setAiAnalysis("Não foi possível gerar a análise de IA no momento.");
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  // Process data for charts
  const revenueByVehicle = data.trips.reduce((acc: any, trip) => {
    const plate = trip.vehicle.plate;
    if (!acc[plate]) acc[plate] = { name: `Veículo ${plate}`, value: 0, trips: 0 };
    acc[plate].value += trip.value;
    acc[plate].trips += 1;
    return acc;
  }, {});

  const revenueChartData = Object.values(revenueByVehicle);

  const expensesByType = data.expenses.reduce((acc: any, exp) => {
    if (!acc[exp.type]) acc[exp.type] = { name: exp.type, value: 0 };
    acc[exp.type].value += exp.value;
    return acc;
  }, {});

  const expensesChartData = Object.values(expensesByType);

  const weeklyExpenses = data.expenses.reduce((acc: any, exp) => {
    const weekStart = format(startOfWeek(parseISO(exp.date)), 'dd/MM');
    if (!acc[weekStart]) acc[weekStart] = { name: weekStart, value: 0 };
    acc[weekStart].value += exp.value;
    return acc;
  }, {});

  const weeklyChartData = Object.values(weeklyExpenses);

  const totalRevenue = data.trips.reduce((acc, t) => acc + t.value, 0);
  const totalExpenses = data.expenses.reduce((acc, e) => acc + e.value, 0);
  const netProfit = totalRevenue - totalExpenses;

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <AppLayout>
      <div className="flex-1 flex flex-col min-h-0 bg-background-dark overflow-y-auto custom-scrollbar">
        <Header title="Relatórios Estratégicos" />
        
        <div className="p-4 lg:p-8 space-y-8">
          {/* Filters */}
          <div className="bg-surface-dark border border-border-dark rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-xl">
                  <Filter className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">Filtros de Análise</h2>
                  <p className="text-slate-500 text-sm">Selecione o período para processamento</p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 bg-background-dark border border-border-dark rounded-xl px-4 py-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent text-white text-sm outline-none"
                  />
                  <span className="text-slate-600">até</span>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent text-white text-sm outline-none"
                  />
                </div>
                
                <div className="flex bg-background-dark border border-border-dark rounded-xl p-1">
                  <button 
                    onClick={() => setActiveTab('revenue')}
                    className={cn(
                      "px-6 py-2 rounded-lg text-sm font-bold transition-all",
                      activeTab === 'revenue' ? "bg-primary text-background-dark shadow-lg shadow-primary/20" : "text-slate-500 hover:text-white"
                    )}
                  >
                    Receita
                  </button>
                  <button 
                    onClick={() => setActiveTab('expenses')}
                    className={cn(
                      "px-6 py-2 rounded-lg text-sm font-bold transition-all",
                      activeTab === 'expenses' ? "bg-primary text-background-dark shadow-lg shadow-primary/20" : "text-slate-500 hover:text-white"
                    )}
                  >
                    Despesas
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface-dark border border-border-dark rounded-2xl p-6 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp className="w-16 h-16 text-emerald-500" />
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Receita Total</p>
              <h3 className="text-3xl font-black text-white mb-2">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)}
              </h3>
              <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold">
                <ArrowUpRight className="w-4 h-4" />
                <span>{data.trips.length} Viagens realizadas</span>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-surface-dark border border-border-dark rounded-2xl p-6 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingDown className="w-16 h-16 text-rose-500" />
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Despesa Total</p>
              <h3 className="text-3xl font-black text-white mb-2">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpenses)}
              </h3>
              <div className="flex items-center gap-2 text-rose-500 text-xs font-bold">
                <ArrowDownRight className="w-4 h-4" />
                <span>{data.expenses.length} Registros de custo</span>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-surface-dark border border-border-dark rounded-2xl p-6 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <DollarSign className="w-16 h-16 text-primary" />
              </div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Resultado Líquido</p>
              <h3 className={cn(
                "text-3xl font-black mb-2",
                netProfit >= 0 ? "text-emerald-500" : "text-rose-500"
              )}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(netProfit)}
              </h3>
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                <div className={cn("w-2 h-2 rounded-full", netProfit >= 0 ? "bg-emerald-500" : "bg-rose-500")} />
                <span>Margem de {totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%</span>
              </div>
            </motion.div>
          </div>

          {/* AI Analysis Section */}
          <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <BrainCircuit className="w-32 h-32 text-primary" />
            </div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-primary p-2 rounded-lg">
                <BrainCircuit className="w-5 h-5 text-background-dark" />
              </div>
              <h3 className="text-white font-bold text-lg">Análise de Inteligência Artificial</h3>
              {analyzing && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
            </div>

            <div className="prose prose-invert max-w-none">
              {!process.env.NEXT_PUBLIC_GEMINI_API_KEY ? (
                <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-sm font-medium">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>
                    A chave da API Gemini não foi configurada. 
                    Para habilitar a análise de IA no Vercel, adicione a variável de ambiente 
                    <code className="bg-rose-500/20 px-1.5 py-0.5 rounded mx-1">NEXT_PUBLIC_GEMINI_API_KEY</code> 
                    nas configurações do seu projeto.
                  </p>
                </div>
              ) : analyzing ? (
                <div className="space-y-4">
                  <div className="h-4 bg-white/5 rounded w-3/4 animate-pulse" />
                  <div className="h-4 bg-white/5 rounded w-full animate-pulse" />
                  <div className="h-4 bg-white/5 rounded w-5/6 animate-pulse" />
                </div>
              ) : (
                <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {aiAnalysis || "Selecione um período para gerar a análise estratégica."}
                </div>
              )}
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {activeTab === 'revenue' ? (
              <>
                <div className="bg-surface-dark border border-border-dark rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <BarChartIcon className="w-5 h-5 text-primary" />
                      <h3 className="text-white font-bold">Receita por Veículo</h3>
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value/1000}k`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                          itemStyle={{ color: '#3b82f6' }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {revenueChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-surface-dark border border-border-dark rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <PieChartIcon className="w-5 h-5 text-primary" />
                      <h3 className="text-white font-bold">Participação na Receita</h3>
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={revenueChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {revenueChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          wrapperStyle={{ paddingTop: '20px' }}
                          formatter={(value) => <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-surface-dark border border-border-dark rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <BarChartIcon className="w-5 h-5 text-rose-500" />
                      <h3 className="text-white font-bold">Despesas Semanais</h3>
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weeklyChartData}>
                        <defs>
                          <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value}`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                        />
                        <Area type="monotone" dataKey="value" stroke="#ef4444" fillOpacity={1} fill="url(#colorExp)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-surface-dark border border-border-dark rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <PieChartIcon className="w-5 h-5 text-rose-500" />
                      <h3 className="text-white font-bold">Distribuição de Custos</h3>
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expensesChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {expensesChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          wrapperStyle={{ paddingTop: '20px' }}
                          formatter={(value) => <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Detailed Analysis Table */}
          <div className="bg-surface-dark border border-border-dark rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-border-dark flex items-center justify-between bg-surface-dark/50">
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-primary" />
                <h3 className="text-white font-bold">Análise de Rentabilidade por Viagem</h3>
              </div>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-background-dark/50">
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Viagem</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Veículo</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Destino</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Distância (Km)</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Frete</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Despesas</th>
                    <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Eficiência</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dark">
                  {data.trips.map((trip) => {
                    const tripExpenses = trip.expenses.reduce((acc, e) => acc + e.value, 0);
                    const distance = trip.distance || 0;
                    const efficiency = distance > 0 ? (trip.value / distance).toFixed(2) : '0.00';
                    
                    return (
                      <tr key={trip.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">{trip.tripId}</span>
                          <p className="text-[10px] text-slate-500">{format(parseISO(trip.scheduledAt), 'dd/MM/yyyy')}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-medium text-slate-300">{trip.vehicle.plate}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3 h-3 text-primary" />
                            <span className="text-xs text-slate-300">{trip.frete?.cidade || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Gauge className="w-3 h-3 text-slate-500" />
                            <span className="text-xs font-mono text-slate-300">{distance || '---'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-emerald-500">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(trip.value)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-rose-500">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tripExpenses)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              "px-2 py-1 rounded text-[10px] font-bold",
                              efficiency !== 'N/A' && Number(efficiency) > 5 ? "bg-emerald-500/10 text-emerald-500" : "bg-primary/10 text-primary"
                            )}>
                              R$ {efficiency}/km
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {data.trips.length === 0 && (
                <div className="p-12 text-center">
                  <AlertCircle className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">Nenhuma viagem encontrada para o período selecionado.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
