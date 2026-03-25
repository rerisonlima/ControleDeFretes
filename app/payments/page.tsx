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
  ChevronDown,
  Truck,
  Eye,
  EyeOff
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, parseISO, eachWeekOfInterval, startOfMonth, endOfMonth, parse, addDays, max, min } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Trip {
  id: number;
  vehicleId: number;
  scheduledAt: string;
  driverId?: number;
  helperId?: number;
  valor1aViagemMotorista?: number;
  valor2aViagemMotorista?: number;
  valor1aViagemAjudante?: number;
  valor2aViagemAjudante?: number;
  frete?: { cidade: string; valor1aViagemMotorista: number; valor2aViagemMotorista: number; valor1aViagemAjudante: number; valor2aViagemAjudante: number };
  route?: { destination: string; driverValue1: number; driverValue2: number; helperValue1: number; helperValue2: number };
}

interface Vehicle {
  id: number;
  plate: string;
  model: string;
}

export default function PaymentsPage() {
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = React.useState<string>('');
  const [selectedMonth, setSelectedMonth] = React.useState<string>(format(new Date(), 'yyyy-MM'));
  const [loading, setLoading] = React.useState(true);
  const [showValues, setShowValues] = React.useState(false);

  // Group trips by day for the "Detalhamento Diário" table
  const dailyDetails = React.useMemo(() => {
    // Let's refine the calculation to match the logic in weeklyPayments
    const tripsByDay: Record<string, Trip[]> = {};
    trips.forEach(trip => {
      if (trip.vehicleId.toString() !== selectedVehicleId) return;
      const tripDate = new Date(trip.scheduledAt);
      if (format(tripDate, 'yyyy-MM') !== selectedMonth) return;
      const dayKey = format(tripDate, 'yyyy-MM-dd');
      if (!tripsByDay[dayKey]) tripsByDay[dayKey] = [];
      tripsByDay[dayKey].push(trip);
    });

    const result = Object.entries(tripsByDay).map(([dayKey, dayTrips]) => {
      dayTrips.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
      
      let totalDay = 0;
      let val1 = 0;
      let val2 = 0;

      dayTrips.forEach((trip, index) => {
        const v1 = trip.valor1aViagemMotorista ?? trip.frete?.valor1aViagemMotorista ?? trip.route?.driverValue1 ?? 0;
        const v2 = trip.valor2aViagemMotorista ?? trip.frete?.valor2aViagemMotorista ?? trip.route?.driverValue2 ?? 0;
        
        if (index === 0) {
          val1 = v1;
          totalDay += v1;
        } else {
          val2 += v2;
          totalDay += v2;
        }

        // Also add helper values if present
        if (trip.helperId) {
          const h1 = trip.valor1aViagemAjudante ?? trip.frete?.valor1aViagemAjudante ?? trip.route?.helperValue1 ?? 0;
          const h2 = trip.valor2aViagemAjudante ?? trip.frete?.valor2aViagemAjudante ?? trip.route?.helperValue2 ?? 0;
          
          if (index === 0) {
            totalDay += h1;
          } else {
            totalDay += h2;
          }
        }
      });

      const firstTrip = dayTrips[0];
      return {
        date: format(new Date(dayKey), 'dd MMM, yyyy', { locale: ptBR }),
        route: firstTrip.frete?.cidade || firstTrip.route?.destination || 'N/A',
        trips: dayTrips.length,
        unitValue: val1,
        extra: val2,
        total: totalDay,
        status: 'CONCLUÍDO'
      };
    });

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [trips, selectedVehicleId, selectedMonth]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [tripsRes, vehiclesRes] = await Promise.all([
          fetch('/api/trips'),
          fetch('/api/vehicles')
        ]);
        const tripsData = await tripsRes.json();
        const vehiclesData = await vehiclesRes.json();
        
        setTrips(tripsData);
        setVehicles(vehiclesData);
        if (vehiclesData.length > 0) {
          setSelectedVehicleId(vehiclesData[0].id.toString());
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Calculate weekly payments for the selected vehicle
  const weeklyPayments = React.useMemo(() => {
    const payments: Record<string, { driver: number, helper: number, start: Date, end: Date }> = {};
    
    // Initialize payments with all weeks of the selected month
    if (selectedMonth) {
      const monthDate = parse(selectedMonth, 'yyyy-MM', new Date());
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const weeksInMonth = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });
      
      weeksInMonth.forEach(weekStart => {
        const friday = addDays(weekStart, 4);
        
        // Only include weeks that have at least one weekday (Mon-Fri) in the selected month
        if (friday < monthStart || weekStart > monthEnd) return;

        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        const weekKey = format(weekStart, 'yyyy-MM-dd');
        
        // Bound the displayed dates to the current month
        const displayStart = max([weekStart, monthStart]);
        const displayEnd = min([weekEnd, monthEnd]);
        
        payments[weekKey] = { driver: 0, helper: 0, start: displayStart, end: displayEnd };
      });
    }

    // Group trips by day first
    const tripsByDay: Record<string, Trip[]> = {};
    
    trips.forEach(trip => {
      // Only consider trips for the selected vehicle
      if (trip.vehicleId.toString() !== selectedVehicleId) return;
      
      const tripDate = new Date(trip.scheduledAt);
      
      // Only consider trips in the selected month
      if (format(tripDate, 'yyyy-MM') !== selectedMonth) return;
      
      const dayOfWeek = tripDate.getDay();
      
      // Only consider Monday (1) to Friday (5)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const dayKey = format(tripDate, 'yyyy-MM-dd');
        if (!tripsByDay[dayKey]) {
          tripsByDay[dayKey] = [];
        }
        tripsByDay[dayKey].push(trip);
      }
    });

    Object.entries(tripsByDay).forEach(([dayKey, dayTrips]) => {
      // Sort trips by time to determine which is first
      dayTrips.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
      
      const tripDate = parseISO(dayKey);
      const weekStart = startOfWeek(tripDate, { weekStartsOn: 1 });
      const weekKey = format(weekStart, 'yyyy-MM-dd');
      
      if (!payments[weekKey]) {
        const weekEnd = endOfWeek(tripDate, { weekStartsOn: 1 });
        payments[weekKey] = { driver: 0, helper: 0, start: weekStart, end: weekEnd };
      }
      
      dayTrips.forEach((trip, index) => {
        if (index === 0) {
          // First trip of the day uses Value1
          payments[weekKey].driver += trip.valor1aViagemMotorista ?? trip.frete?.valor1aViagemMotorista ?? trip.route?.driverValue1 ?? 0;
          if (trip.helperId) {
            payments[weekKey].helper += trip.valor1aViagemAjudante ?? trip.frete?.valor1aViagemAjudante ?? trip.route?.helperValue1 ?? 0;
          }
        } else {
          // Second trip onwards uses Value2
          payments[weekKey].driver += trip.valor2aViagemMotorista ?? trip.frete?.valor2aViagemMotorista ?? trip.route?.driverValue2 ?? 0;
          if (trip.helperId) {
            payments[weekKey].helper += trip.valor2aViagemAjudante ?? trip.frete?.valor2aViagemAjudante ?? trip.route?.helperValue2 ?? 0;
          }
        }
      });
    });
    
    return Object.values(payments).sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [trips, selectedVehicleId, selectedMonth]);

  return (
    <AppLayout>
      <Header 
        title="Pagamentos" 
        actionLabel="Finalizar e Gerar Relatório" 
      />
      
      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Welcome & Filters */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
            <div className="lg:col-span-1">
              <h3 className="text-2xl font-black text-white tracking-tight">Pagamentos</h3>
              <p className="text-slate-400 text-sm mt-1">Gestão de pagamentos e ganhos dos motoristas.</p>
            </div>
            
            <div className="lg:col-span-2 flex flex-wrap gap-4 justify-end">
              <div className="flex flex-col gap-1.5 min-w-[240px]">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Veículo</label>
                <div className="relative">
                  <select 
                    className="w-full bg-surface-dark border border-border-dark text-slate-200 rounded-lg h-11 pl-10 pr-4 focus:ring-primary focus:border-primary appearance-none outline-none text-sm"
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                  >
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>
                    ))}
                  </select>
                  <Truck className="absolute left-3 top-3 text-slate-500 w-4 h-4" />
                  <ChevronDown className="absolute right-3 top-3 text-slate-500 w-4 h-4" />
                </div>
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Mês</label>
                <div className="relative">
                  <input 
                    className="bg-surface-dark border border-border-dark text-slate-200 rounded-lg h-11 pl-10 pr-4 focus:ring-primary focus:border-primary w-[240px] text-sm outline-none" 
                    type="month" 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  />
                  <Calendar className="absolute left-3 top-3 text-slate-500 w-4 h-4" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Privacidade</label>
                <button
                  onClick={() => setShowValues(!showValues)}
                  className="bg-surface-dark border border-border-dark text-slate-400 hover:text-white rounded-lg h-11 px-4 flex items-center justify-center transition-all outline-none"
                  title={showValues ? "Ocultar Valores" : "Mostrar Valores"}
                >
                  {showValues ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            <div className="bg-surface-dark border border-border-dark p-6 rounded-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <Calculator className="w-16 h-16 text-primary" />
              </div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Total a Pagar</p>
              <h4 className="text-3xl font-black text-white mt-2">
                {showValues ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  dailyDetails.reduce((acc, curr) => acc + curr.total, 0)
                ) : '******'}
              </h4>
              <div className="flex items-center gap-1 mt-2 text-emerald-500 text-[10px] font-bold uppercase tracking-tight">
                <TrendingUp className="w-3 h-3" />
                Cálculo em tempo real
              </div>
            </div>
            
            <div className="bg-surface-dark border border-border-dark p-6 rounded-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <RefreshCw className="w-16 h-16 text-primary" />
              </div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Total de Viagens</p>
              <h4 className="text-3xl font-black text-white mt-2">
                {dailyDetails.reduce((acc, curr) => acc + curr.trips, 0)}
              </h4>
              <div className="flex items-center gap-1 mt-2 text-slate-500 text-[10px] font-bold uppercase tracking-tight">
                <RefreshCw className="w-3 h-3" />
                Média de {(dailyDetails.reduce((acc, curr) => acc + curr.trips, 0) / (dailyDetails.length || 1)).toFixed(1)}/dia
              </div>
            </div>
            
            <div className="bg-surface-dark border border-border-dark p-6 rounded-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <Calendar className="w-16 h-16 text-primary" />
              </div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Dias Ativos</p>
              <h4 className="text-3xl font-black text-white mt-2">{dailyDetails.length}</h4>
              <div className="flex items-center gap-1 mt-2 text-primary text-[10px] font-bold uppercase tracking-tight">
                <Info className="w-3 h-3" />
                No período selecionado
              </div>
            </div>

            <div className="bg-surface-dark border border-border-dark p-6 rounded-xl relative overflow-hidden group flex flex-col">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <Truck className="w-16 h-16 text-primary" />
              </div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Pagamento Motorista (Seg-Sex)</p>
              <div className="mt-2 flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                {weeklyPayments.length === 0 ? (
                  <p className="text-sm text-slate-400">Nenhuma viagem registrada</p>
                ) : (
                  weeklyPayments.map((week, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b border-border-dark/50 pb-1 last:border-0">
                      <span className="text-xs text-slate-400">{format(week.start, 'dd/MM')} a {format(week.end, 'dd/MM')}</span>
                      <span className="text-sm font-bold text-white">
                        {showValues ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(week.driver) : '******'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-surface-dark border border-border-dark p-6 rounded-xl relative overflow-hidden group flex flex-col">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <User className="w-16 h-16 text-primary" />
              </div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Pagamento Ajudante (Seg-Sex)</p>
              <div className="mt-2 flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                {weeklyPayments.length === 0 ? (
                  <p className="text-sm text-slate-400">Nenhuma viagem registrada</p>
                ) : (
                  weeklyPayments.map((week, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b border-border-dark/50 pb-1 last:border-0">
                      <span className="text-xs text-slate-400">{format(week.start, 'dd/MM')} a {format(week.end, 'dd/MM')}</span>
                      <span className="text-sm font-bold text-white">
                        {showValues ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(week.helper) : '******'}
                      </span>
                    </div>
                  ))
                )}
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
                    <th className="px-6 py-4 border-b border-border-dark">Valor 1ª Viagem</th>
                    <th className="px-6 py-4 border-b border-border-dark">Valor 2ª Viagem</th>
                    <th className="px-6 py-4 border-b border-border-dark text-right">Total Dia</th>
                    <th className="px-6 py-4 border-b border-border-dark text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-slate-300 divide-y divide-border-dark">
                  {dailyDetails.map((row, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-white">{row.date}</td>
                      <td className="px-6 py-4 text-xs">{row.route}</td>
                      <td className="px-6 py-4 text-center font-mono">{row.trips.toString().padStart(2, '0')}</td>
                      <td className="px-6 py-4 text-xs">{showValues ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.unitValue) : '******'}</td>
                      <td className="px-6 py-4 text-xs">{showValues ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.extra) : '******'}</td>
                      <td className="px-6 py-4 text-right font-bold text-white">{showValues ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.total) : '******'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-[9px] font-bold uppercase tracking-tighter border border-emerald-500/20">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {dailyDetails.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-slate-500 italic">
                        Nenhum detalhamento disponível para este período.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-primary/5">
                    <td className="px-6 py-6 text-right font-bold text-slate-500 text-[10px] uppercase tracking-widest" colSpan={5}>
                      SUBTOTAL PERÍODO VISÍVEL:
                    </td>
                    <td className="px-6 py-6 text-right font-black text-primary text-xl">
                      {showValues ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        dailyDetails.reduce((acc, curr) => acc + curr.total, 0)
                      ) : '******'}
                    </td>
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
        )}
      </div>
    </AppLayout>
  );
}
