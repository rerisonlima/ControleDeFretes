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
  UserPlus,
  Calendar,
  Truck,
  DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RoutesPage() {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [trips, setTrips] = React.useState<any[]>([]);
  const [routes, setRoutes] = React.useState<any[]>([]);
  const [vehicles, setVehicles] = React.useState<any[]>([]);
  const [employees, setEmployees] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedTrip, setSelectedTrip] = React.useState<any>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [vehicleFilter, setVehicleFilter] = React.useState('');

  // Form state
  const [formData, setFormData] = React.useState({
    tripId: '',
    routeId: '',
    vehicleId: '',
    driverId: '',
    helperId: '',
    scheduledAt: '',
    value: '',
    status: 'SCHEDULED',
    paid: 'não',
    contract: '',
    paymentDate: ''
  });

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const fetchJson = async (url: string, name: string) => {
        const res = await fetch(url);
        if (!res.ok) {
          const errorText = await res.text();
          console.error(`${name} API error:`, errorText);
          return [];
        }
        return res.json();
      };

      const [tripsData, routesData, vehiclesData, employeesData] = await Promise.all([
        fetchJson('/api/trips', 'Trips'),
        fetchJson('/api/routes', 'Routes'),
        fetchJson('/api/vehicles', 'Vehicles'),
        fetchJson('/api/employees', 'Employees')
      ]);

      setTrips(tripsData);
      setRoutes(routesData);
      setVehicles(vehiclesData);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenDrawer = (trip: any = null) => {
    if (trip) {
      setSelectedTrip(trip);
      setFormData({
        tripId: trip.tripId,
        routeId: trip.routeId.toString(),
        vehicleId: trip.vehicleId.toString(),
        driverId: trip.driverId.toString(),
        helperId: trip.helperId?.toString() || '',
        scheduledAt: trip.scheduledAt ? format(new Date(trip.scheduledAt), 'yyyy-MM-dd') : '',
        value: trip.value.toString(),
        status: trip.status,
        paid: trip.paid || 'não',
        contract: trip.contract || '',
        paymentDate: trip.paymentDate ? format(new Date(trip.paymentDate), 'yyyy-MM-dd') : ''
      });
    } else {
      setSelectedTrip(null);
      setFormData({
        tripId: `TRIP-${Math.floor(1000 + Math.random() * 9000)}`,
        routeId: '',
        vehicleId: '',
        driverId: '',
        helperId: '',
        scheduledAt: format(new Date(), 'yyyy-MM-dd'),
        value: '',
        status: 'SCHEDULED',
        paid: 'não',
        contract: '',
        paymentDate: ''
      });
    }
    setIsDrawerOpen(true);
  };

  const handleSave = async () => {
    try {
      const url = selectedTrip ? `/api/trips/${selectedTrip.id}` : '/api/trips';
      const method = selectedTrip ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setIsDrawerOpen(false);
        fetchData();
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao salvar viagem');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Erro de conexão ao salvar');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta viagem?')) return;
    try {
      const response = await fetch(`/api/trips/${id}`, { method: 'DELETE' });
      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.route?.destination?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         trip.contract?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVehicle = vehicleFilter === '' || trip.vehicleId.toString() === vehicleFilter;
    return matchesSearch && matchesVehicle;
  });

  return (
    <AppLayout>
      <Header 
        title="Viagens" 
        actionLabel="Nova Viagem" 
        onAction={() => handleOpenDrawer()}
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
                placeholder="Buscar por cidade de destino ou contrato..." 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-64 relative">
              <Truck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <select 
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none appearance-none"
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
              >
                <option value="">Todos os Veículos</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>
                ))}
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
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Pago</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Data</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Destino</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Contrato</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Veículo</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Valor Frete</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">Carregando viagens...</td>
                  </tr>
                ) : filteredTrips.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">Nenhuma viagem encontrada com os filtros aplicados.</td>
                  </tr>
                ) : filteredTrips.map((trip) => (
                  <tr 
                    key={trip.id} 
                    className="hover:bg-white/5 transition-colors group cursor-pointer"
                    onClick={() => handleOpenDrawer(trip)}
                  >
                    <td className={cn(
                      "px-6 py-4 transition-colors",
                      (trip.paid === 'sim' && trip.paymentDate) ? "bg-emerald-500/30" : ""
                    )}>
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-xs font-bold uppercase transition-colors",
                        trip.paid === 'sim' ? "bg-emerald-500 text-background-dark" : "bg-surface-dark text-slate-500 border border-border-dark"
                      )}>
                        {trip.paid || 'não'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span className="font-mono text-sm text-slate-300">{formatDate(trip.scheduledAt)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-white">{trip.route?.destination || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-400">{trip.contract || '-'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Truck className="w-4 h-4 text-slate-500" />
                        <span className="text-sm text-slate-400">{trip.vehicle?.plate || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-300">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(trip.value)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleOpenDrawer(trip); }}
                          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(trip.id); }}
                          className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Side Panel (Drawer) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <aside className="w-full max-w-[450px] bg-background-dark h-full shadow-2xl border-l border-border-dark flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-border-dark flex items-center justify-between bg-primary/5">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedTrip ? 'Editar Viagem' : 'Nova Viagem'}</h3>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Valores Operacionais da Viagem</p>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">ID Viagem</label>
                    <input 
                      className="w-full px-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none" 
                      value={formData.tripId}
                      onChange={(e) => setFormData({...formData, tripId: e.target.value})}
                      placeholder="Ex: TRIP-1234"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Data da Viagem</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                      <input 
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none" 
                        type="date"
                        value={formData.scheduledAt}
                        onChange={(e) => setFormData({...formData, scheduledAt: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Contrato</label>
                  <input 
                    className="w-full px-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none" 
                    value={formData.contract}
                    onChange={(e) => setFormData({...formData, contract: e.target.value})}
                    placeholder="Número ou nome do contrato"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Rota / Destino</label>
                  <select 
                    className="w-full px-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none"
                    value={formData.routeId}
                    onChange={(e) => setFormData({...formData, routeId: e.target.value})}
                  >
                    <option value="">Selecionar Rota</option>
                    {routes.map(r => (
                      <option key={r.id} value={r.id}>{r.destination} (R$ {r.freightValue})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Veículo</label>
                  <select 
                    className="w-full px-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none"
                    value={formData.vehicleId}
                    onChange={(e) => setFormData({...formData, vehicleId: e.target.value})}
                  >
                    <option value="">Selecionar Veículo</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Motorista</label>
                    <select 
                      className="w-full px-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none"
                      value={formData.driverId}
                      onChange={(e) => setFormData({...formData, driverId: e.target.value})}
                    >
                      <option value="">Selecionar</option>
                      {employees.map(e => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Ajudante (Opcional)</label>
                    <select 
                      className="w-full px-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none"
                      value={formData.helperId}
                      onChange={(e) => setFormData({...formData, helperId: e.target.value})}
                    >
                      <option value="">Nenhum</option>
                      {employees.map(e => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-primary uppercase tracking-widest block">Valor do Frete</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-primary/50">R$</span>
                      <input 
                        className="w-full pl-12 pr-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm font-bold text-white outline-none" 
                        placeholder="0,00" 
                        type="number"
                        step="0.01"
                        value={formData.value}
                        onChange={(e) => setFormData({...formData, value: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Status</label>
                    <select 
                      className="w-full px-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="SCHEDULED">Agendado</option>
                      <option value="IN_TRANSIT">Em Trânsito</option>
                      <option value="DELIVERED">Entregue</option>
                      <option value="CANCELLED">Cancelado</option>
                    </select>
                  </div>
                </div>

                <hr className="border-border-dark" />

                {/* Payment Info */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    <h4 className="font-bold text-[10px] uppercase tracking-widest text-emerald-500">Informações de Pagamento</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-500 uppercase tracking-widest block">Pago</label>
                      <select 
                        className="w-full px-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none"
                        value={formData.paid}
                        onChange={(e) => setFormData({...formData, paid: e.target.value})}
                      >
                        <option value="não">Não</option>
                        <option value="sim">Sim</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-slate-500 uppercase tracking-widest block">Data Pagamento</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                        <input 
                          className="w-full pl-10 pr-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none" 
                          type="date"
                          value={formData.paymentDate}
                          onChange={(e) => setFormData({...formData, paymentDate: e.target.value})}
                          disabled={formData.paid === 'não'}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                <p className="text-[10px] leading-relaxed text-slate-500 italic">
                  * Informe o status de pagamento para controle financeiro das viagens realizadas.
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
              <button 
                onClick={handleSave}
                className="flex-1 bg-primary hover:bg-primary/90 text-background-dark py-3 rounded-lg font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                {selectedTrip ? 'Atualizar Viagem' : 'Salvar Viagem'}
              </button>
            </div>
          </aside>
        </div>
      )}
    </AppLayout>
  );
}
