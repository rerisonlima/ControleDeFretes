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
  Truck
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, parseISO, eachWeekOfInterval, startOfMonth, endOfMonth, parse, addDays, max, min, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Trip {
  id: number;
  tripId: string;
  vehicleId: number;
  scheduledAt: string;
  driverId?: number;
  helperId?: number;
  valor1aViagemMotorista?: number;
  valor2aViagemMotorista?: number;
  valor1aViagemAjudante?: number;
  valor2aViagemAjudante?: number;
  status: string;
  contract?: string;
  romaneio?: string;
  frete?: { cidade: string; valor1aViagemMotorista: number; valor2aViagemMotorista: number; valor1aViagemAjudante: number; valor2aViagemAjudante: number };
  route?: { destination: string; driverValue1: number; driverValue2: number; helperValue1: number; helperValue2: number };
  driver?: { name: string; role: string; pix?: string };
  helper?: { name: string; role: string; pix?: string };
  vehicle?: { plate: string; model: string };
  contratante?: { ContratanteNome: string };
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
    const fetchVehicles = async () => {
      try {
        const res = await fetch('/api/vehicles');
        const data = await res.json();
        setVehicles(data);
        if (data.length > 0 && !selectedVehicleId) {
          setSelectedVehicleId(data[0].id.toString());
        }
      } catch (error) {
        console.error('Failed to fetch vehicles:', error);
      }
    };
    fetchVehicles();
  }, [selectedVehicleId]);

  React.useEffect(() => {
    const fetchData = async () => {
      if (!selectedVehicleId || !selectedMonth) return;
      setLoading(true);
      try {
        const [year, month] = selectedMonth.split('-');
        const tripsRes = await fetch(`/api/trips?month=${month}&year=${year}&vehicleId=${selectedVehicleId}&limit=1000`);
        const tripsDataRaw = await tripsRes.json();
        
        const tripsData = tripsDataRaw.trips || tripsDataRaw || [];
        setTrips(tripsData);
      } catch (error) {
        console.error('Failed to fetch trips:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedMonth, selectedVehicleId]);

  const generatePDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    
    // Group trips by employee ID
    const employeeGroups: Record<number, { name: string, role: string, pix?: string, trips: Trip[] }> = {};
    
    trips.forEach(trip => {
      if (trip.driverId && trip.driver) {
        if (!employeeGroups[trip.driverId]) {
          employeeGroups[trip.driverId] = { 
            name: trip.driver.name, 
            role: trip.driver.role, 
            pix: trip.driver.pix, 
            trips: [] 
          };
        }
        employeeGroups[trip.driverId].trips.push(trip);
      }
      if (trip.helperId && trip.helper) {
        if (!employeeGroups[trip.helperId]) {
          employeeGroups[trip.helperId] = { 
            name: trip.helper.name, 
            role: trip.helper.role, 
            pix: trip.helper.pix, 
            trips: [] 
          };
        }
        employeeGroups[trip.helperId].trips.push(trip);
      }
    });

    const sortedEmployees = Object.entries(employeeGroups).sort((a, b) => a[1].name.localeCompare(b[1].name));

    if (sortedEmployees.length === 0) {
      alert('Nenhuma viagem encontrada para gerar o PDF.');
      return;
    }

    sortedEmployees.forEach(([empIdStr, emp], empIdx) => {
      const empId = parseInt(empIdStr);
      if (empIdx > 0) doc.addPage();
      
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, 297, 45, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text('Relatório de Pagamentos', 14, 18);
      
      doc.setFontSize(12);
      doc.text(`Funcionário: ${emp.name}`, 14, 28);
      doc.setFontSize(10);
      doc.text(`Função: ${emp.role} | PIX: ${emp.pix || 'Não informado'}`, 14, 35);
      
      doc.setFontSize(12);
      doc.text(`Veículo: ${vehicles.find(v => v.id.toString() === selectedVehicleId)?.plate || 'N/A'}`, 140, 28);
      doc.text(`Período: ${format(parse(selectedMonth, 'yyyy-MM', new Date()), 'MMMM yyyy', { locale: ptBR })}`, 240, 28);
      
      doc.setTextColor(0, 0, 0);

      // Group by week (starting Monday)
      const weeks: Record<string, Trip[]> = {};
      emp.trips.forEach(trip => {
        const date = new Date(trip.scheduledAt);
        const weekStart = startOfWeek(date, { weekStartsOn: 1 });
        const weekKey = format(weekStart, 'yyyy-MM-dd');
        if (!weeks[weekKey]) weeks[weekKey] = [];
        weeks[weekKey].push(trip);
      });

      let currentY = 55;
      Object.entries(weeks).sort().forEach(([weekKey, weekTrips]) => {
        const weekStart = parseISO(weekKey);
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`Semana: ${format(weekStart, 'dd/MM/yyyy')} a ${format(weekEnd, 'dd/MM/yyyy')}`, 14, currentY);
        currentY += 6;

        const sortedWeekTrips = weekTrips.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
        
        // Track trip index per day to handle V1/V2 logic
        const dayTripCounts: Record<string, number> = {};
        
        const tableBody = sortedWeekTrips.map(t => {
          const dayKey = format(new Date(t.scheduledAt), 'yyyy-MM-dd');
          const tripIndex = dayTripCounts[dayKey] || 0;
          dayTripCounts[dayKey] = tripIndex + 1;
          
          const status = t.status === 'DELIVERED' ? 'ENTREGUE' : t.status;
          
          const v1Mot = t.valor1aViagemMotorista ?? t.frete?.valor1aViagemMotorista ?? t.route?.driverValue1 ?? 0;
          const v2Mot = t.valor2aViagemMotorista ?? t.frete?.valor2aViagemMotorista ?? t.route?.driverValue2 ?? 0;
          const v1Aju = t.valor1aViagemAjudante ?? t.frete?.valor1aViagemAjudante ?? t.route?.helperValue1 ?? 0;
          const v2Aju = t.valor2aViagemAjudante ?? t.frete?.valor2aViagemAjudante ?? t.route?.helperValue2 ?? 0;

          const row = [
            format(new Date(t.scheduledAt), 'dd/MM/yyyy'),
            t.vehicle?.plate || 'N/A',
            t.contratante?.ContratanteNome || t.contract || '-',
            t.frete?.cidade || t.route?.destination || 'N/A',
            t.romaneio || '-',
            status,
          ];

          if (emp.role.toUpperCase() === 'MOTORISTA') {
            row.push(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tripIndex === 0 ? v1Mot : 0));
            row.push(tripIndex > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v2Mot) : '-');
          } else {
            row.push(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tripIndex === 0 ? v1Aju : 0));
            row.push(tripIndex > 0 ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v2Aju) : '-');
          }
          
          return row;
        });

        const headers = emp.role.toUpperCase() === 'MOTORISTA' 
          ? [['Data', 'Veículo', 'Contrato', 'Rota', 'Romaneio', 'Status', 'V1 Mot', 'V2 Mot']]
          : [['Data', 'Veículo', 'Contrato', 'Rota', 'Romaneio', 'Status', 'V1 Aju', 'V2 Aju']];

        autoTable(doc, {
          startY: currentY,
          head: headers,
          body: tableBody,
          theme: 'grid',
          styles: { fontSize: 7, cellPadding: 2 },
          headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [245, 247, 250] },
        });

        let weekTotal = 0;
        const tripsByDay: Record<string, Trip[]> = {};
        weekTrips.forEach(t => {
          const dayKey = format(new Date(t.scheduledAt), 'yyyy-MM-dd');
          if (!tripsByDay[dayKey]) tripsByDay[dayKey] = [];
          tripsByDay[dayKey].push(t);
        });

        Object.values(tripsByDay).forEach(dayTrips => {
          dayTrips.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
          dayTrips.forEach((t, idx) => {
            if (t.driverId === empId) {
              weekTotal += idx === 0 
                ? (t.valor1aViagemMotorista ?? t.frete?.valor1aViagemMotorista ?? t.route?.driverValue1 ?? 0)
                : (t.valor2aViagemMotorista ?? t.frete?.valor2aViagemMotorista ?? t.route?.driverValue2 ?? 0);
            }
            if (t.helperId === empId) {
              weekTotal += idx === 0
                ? (t.valor1aViagemAjudante ?? t.frete?.valor1aViagemAjudante ?? t.route?.helperValue1 ?? 0)
                : (t.valor2aViagemAjudante ?? t.frete?.valor2aViagemAjudante ?? t.route?.helperValue2 ?? 0);
            }
          });
        });

        const finalY = (doc as any).lastAutoTable.finalY;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`Total da Semana: ${weekTrips.length} viagens | Valor a Receber: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(weekTotal)}`, 14, finalY + 7);
        
        currentY = finalY + 18;
        if (currentY > 180) {
          doc.addPage();
          currentY = 20;
        }
      });
    });

    doc.save(`Pagamentos_${selectedMonth}.pdf`);
  };

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
      />
      
      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-4 md:space-y-8">
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 w-full mt-1 md:mt-0">
            <div className="flex flex-col gap-1.5 flex-1 sm:min-w-[240px]">
              <div className="relative">
                <select 
                  className="w-full bg-surface-dark border border-border-dark text-slate-200 rounded-xl h-11 pl-10 pr-10 focus:ring-primary focus:border-primary appearance-none outline-none text-sm shadow-sm"
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>
                  ))}
                </select>
                <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5 flex-1 sm:w-auto">
              <div className="relative">
                <input 
                  className="bg-surface-dark border border-border-dark text-slate-200 rounded-xl h-11 pl-10 pr-4 focus:ring-primary focus:border-primary w-full sm:w-[240px] text-sm outline-none shadow-sm" 
                  type="month" 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
            <div className="bg-surface-dark border border-border-dark p-6 rounded-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <Calculator className="w-16 h-16 text-primary" />
              </div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Total a Pagar</p>
              <h4 className="text-2xl md:text-3xl font-black text-white mt-2">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  dailyDetails.reduce((acc, curr) => acc + curr.total, 0)
                )}
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
              <h4 className="text-2xl md:text-3xl font-black text-white mt-2">
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
              <h4 className="text-2xl md:text-3xl font-black text-white mt-2">{dailyDetails.length}</h4>
              <div className="flex items-center gap-1 mt-2 text-primary text-[10px] font-bold uppercase tracking-tight">
                <Info className="w-3 h-3" />
                No período selecionado
              </div>
            </div>

            <div className="bg-surface-dark border border-border-dark p-6 rounded-xl relative overflow-hidden group flex flex-col sm:col-span-2 lg:col-span-1">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <Truck className="w-16 h-16 text-primary" />
              </div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Pagamento Motorista (Seg-Sex)</p>
              <div className="mt-2 flex-1 max-h-[150px] overflow-y-auto custom-scrollbar pr-2 space-y-2">
                {weeklyPayments.length === 0 ? (
                  <p className="text-sm text-slate-400">Nenhuma viagem registrada</p>
                ) : (
                  weeklyPayments.map((week, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b border-border-dark/50 pb-1 last:border-0">
                      <span className="text-xs text-slate-400">{format(week.start, 'dd/MM')} a {format(week.end, 'dd/MM')}</span>
                      <span className="text-sm font-bold text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(week.driver)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-surface-dark border border-border-dark p-6 rounded-xl relative overflow-hidden group flex flex-col sm:col-span-2 lg:col-span-1">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <User className="w-16 h-16 text-primary" />
              </div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Pagamento Ajudante (Seg-Sex)</p>
              <div className="mt-2 flex-1 max-h-[150px] overflow-y-auto custom-scrollbar pr-2 space-y-2">
                {weeklyPayments.length === 0 ? (
                  <p className="text-sm text-slate-400">Nenhuma viagem registrada</p>
                ) : (
                  weeklyPayments.map((week, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b border-border-dark/50 pb-1 last:border-0">
                      <span className="text-xs text-slate-400">{format(week.start, 'dd/MM')} a {format(week.end, 'dd/MM')}</span>
                      <span className="text-sm font-bold text-white">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(week.helper)}
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
                  <span className="hidden sm:inline">Cálculo Válido</span>
                  <span className="sm:hidden">Válido</span>
                </span>
              </div>
            </div>
            
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
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
                      <td className="px-6 py-4 text-xs">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.unitValue)}</td>
                      <td className="px-6 py-4 text-xs">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.extra)}</td>
                      <td className="px-6 py-4 text-right font-bold text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.total)}</td>
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
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        dailyDetails.reduce((acc, curr) => acc + curr.total, 0)
                      )}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-border-dark">
              {dailyDetails.map((row, i) => (
                <div key={i} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-bold">{row.date}</p>
                      <p className="text-xs text-slate-400 mt-1">{row.route}</p>
                    </div>
                    <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-500 text-[9px] font-bold uppercase tracking-tighter border border-emerald-500/20">
                      {row.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Viagens</p>
                      <p className="text-sm text-slate-200 font-mono">{row.trips.toString().padStart(2, '0')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Total Dia</p>
                      <p className="text-sm text-white font-bold text-right">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.total)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border-dark/30">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">1ª Viagem</p>
                      <p className="text-xs text-slate-400">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.unitValue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">2ª Viagem</p>
                      <p className="text-xs text-slate-400 text-right">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.extra)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {dailyDetails.length === 0 && (
                <div className="p-8 text-center text-slate-500 italic text-sm">
                  Nenhum detalhamento disponível para este período.
                </div>
              )}

              {dailyDetails.length > 0 && (
                <div className="p-4 bg-primary/5 border-t border-border-dark">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Subtotal Período:</p>
                    <p className="text-lg font-black text-primary">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                        dailyDetails.reduce((acc, curr) => acc + curr.total, 0)
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Action */}
          <div className="flex flex-col md:flex-row justify-end items-center gap-4 md:gap-6 pt-4 pb-12">
            <p className="text-xs text-slate-500 max-w-md text-center md:text-right">
              Os valores acima contemplam taxas administrativas e bônus de performance calculados automaticamente pelo sistema.
            </p>
            <button 
              onClick={generatePDF}
              className="w-full md:w-auto bg-primary hover:bg-primary/90 text-background-dark px-8 py-4 rounded-lg text-base font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3"
            >
              <FileText className="w-5 h-5" />
              Gerar PDF
            </button>
          </div>

        </div>
        )}
      </div>
    </AppLayout>
  );
}
