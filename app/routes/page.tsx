'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import { Header } from '@/components/Header';
import { 
  Search, 
  MapPin, 
  Edit, 
  Trash2, 
  X,
  Check,
  Calendar,
  Truck,
  User,
  DollarSign,
  Copy,
  Receipt,
  Loader2,
  Gauge,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const months = [
  { id: 1, name: 'Janeiro' },
  { id: 2, name: 'Fevereiro' },
  { id: 3, name: 'Março' },
  { id: 4, name: 'Abril' },
  { id: 5, name: 'Maio' },
  { id: 6, name: 'Junho' },
  { id: 7, name: 'Julho' },
  { id: 8, name: 'Agosto' },
  { id: 9, name: 'Setembro' },
  { id: 10, name: 'Outubro' },
  { id: 11, name: 'Novembro' },
  { id: 12, name: 'Dezembro' },
];

interface Trip {
  id: number;
  tripId: string;
  routeId?: number;
  freteId?: number;
  contratanteId?: number;
  vehicleId: number;
  driverId: number;
  helperId?: number;
  scheduledAt: string;
  value: number;
  valor1aViagemMotorista?: number;
  valor2aViagemMotorista?: number;
  valor1aViagemAjudante?: number;
  valor2aViagemAjudante?: number;
  status: string;
  paid: string;
  contract?: string;
  odometer?: number;
  romaneio?: string;
  paymentDate?: string;
  vehicle?: { plate: string };
  contratante?: { ContratanteNome: string };
  createdBy?: { name: string; username: string };
  createdAt: string;
  frete?: { 
    cidade: string; 
    valorFrete: number; 
    valor1aViagemMotorista: number; 
    valor2aViagemMotorista: number; 
    valor1aViagemAjudante: number; 
    valor2aViagemAjudante: number 
  };
  route?: { destination: string };
}

interface Route {
  id: number;
  destination: string;
}

interface Vehicle {
  id: number;
  plate: string;
  brand: string;
  model: string;
  categoriaId: number;
}

interface Employee {
  id: number;
  name: string;
  role: string;
}

interface Contratante {
  id: number;
  ContratanteNome: string;
}

interface Frete {
  id: number;
  cidade: string;
  contratanteId: number;
  categoriaId: number;
  categoria?: { CategoriaNome: string };
  valorFrete: number;
  valor1aViagemMotorista: number;
  valor2aViagemMotorista: number;
  valor1aViagemAjudante: number;
  valor2aViagemAjudante: number;
}

export default function RoutesPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = React.useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = React.useState(now.getFullYear());
  const [paymentFilter, setPaymentFilter] = React.useState('all');
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [trips, setTrips] = React.useState<Trip[]>([]);
  const [routes, setRoutes] = React.useState<Route[]>([]);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [contratantes, setContratantes] = React.useState<Contratante[]>([]);
  const [fretes, setFretes] = React.useState<Frete[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedTrip, setSelectedTrip] = React.useState<Trip | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [vehicleFilter, setVehicleFilter] = React.useState('');
  const [contratanteFilter, setContratanteFilter] = React.useState('');
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<number | null>(null);
  const [cloneConfirmId, setCloneConfirmId] = React.useState<number | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [user, setUser] = React.useState<{ name: string; role: string; username: string } | null>(null);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          if (data.role === 'OPERATOR') {
            handleOpenDrawer();
          }
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      }
    };
    fetchSession();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  // Form state
  const [formData, setFormData] = React.useState({
    tripId: '',
    routeId: '',
    freteId: '',
    contratanteId: '',
    vehicleId: '',
    driverId: '',
    helperId: '',
    scheduledAt: '',
    value: '',
    valor1aViagemMotorista: '',
    valor2aViagemMotorista: '',
    valor1aViagemAjudante: '',
    valor2aViagemAjudante: '',
    status: 'SCHEDULED',
    paid: 'não',
    contract: '',
    odometer: '',
    romaneio: '',
    paymentDate: ''
  });

  const isOperator = user?.role === 'OPERATOR';

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const renderFormContent = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Veículo</label>
          <select 
            className="w-full px-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none"
            value={formData.vehicleId}
            onChange={(e) => {
              const vehicleId = e.target.value;
              setFormData(prev => ({
                ...prev, 
                vehicleId,
                freteId: '',
                value: '',
                valor1aViagemMotorista: '',
                valor2aViagemMotorista: '',
                valor1aViagemAjudante: '',
                valor2aViagemAjudante: ''
              }));
            }}
          >
            <option value="">Selecionar Veículo</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Odômetro</label>
          <div className="relative">
            <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 text-primary w-4 h-4" />
            <input 
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none"
              placeholder="Km Inicial"
              type="number"
              value={formData.odometer}
              onChange={(e) => setFormData({...formData, odometer: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Contrato</label>
          <select 
            className="w-full px-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none"
            value={formData.contratanteId}
            onChange={(e) => {
              setFormData({...formData, contratanteId: e.target.value, freteId: '', value: '', valor1aViagemMotorista: '', valor2aViagemMotorista: '', valor1aViagemAjudante: '', valor2aViagemAjudante: ''});
            }}
          >
            <option value="">Selecionar Contratante</option>
            {contratantes.map(c => (
              <option key={c.id} value={c.id}>{c.ContratanteNome}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Romaneio (Opcional)</label>
          <input 
            className="w-full px-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none"
            placeholder="Número do Romaneio"
            type="text"
            value={formData.romaneio}
            onChange={(e) => setFormData({...formData, romaneio: e.target.value})}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Rota / Destino</label>
          <select 
            className="w-full px-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none"
            value={formData.freteId}
            onChange={(e) => {
              const selectedFreteId = e.target.value;
              const frete = fretes.find(f => f.id.toString() === selectedFreteId);
              if (frete) {
                setFormData({
                  ...formData, 
                  freteId: selectedFreteId,
                  value: frete.valorFrete.toString(),
                  valor1aViagemMotorista: frete.valor1aViagemMotorista.toString(),
                  valor2aViagemMotorista: frete.valor2aViagemMotorista.toString(),
                  valor1aViagemAjudante: frete.valor1aViagemAjudante.toString(),
                  valor2aViagemAjudante: frete.valor2aViagemAjudante.toString()
                });
              } else {
                setFormData({
                  ...formData, 
                  freteId: selectedFreteId,
                  value: '',
                  valor1aViagemMotorista: '',
                  valor2aViagemMotorista: '',
                  valor1aViagemAjudante: '',
                  valor2aViagemAjudante: ''
                });
              }
            }}
            disabled={!formData.contratanteId || !formData.vehicleId}
          >
            <option value="">Selecionar Destino</option>
            {fretes
              .filter(f => {
                const matchesContratante = f.contratanteId.toString() === formData.contratanteId;
                const selectedVehicle = vehicles.find(v => v.id.toString() === formData.vehicleId);
                const matchesCategoria = selectedVehicle ? f.categoriaId === selectedVehicle.categoriaId : false;
                return matchesContratante && matchesCategoria;
              })
              .map(f => (
                <option key={f.id} value={f.id}>
                  {f.cidade} {isOperator ? '' : `- ${f.categoria?.CategoriaNome} (R$ ${f.valorFrete})`}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Motorista</label>
          <select 
            className="w-full px-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none"
            value={formData.driverId}
            onChange={(e) => setFormData({...formData, driverId: e.target.value})}
          >
            <option value="">Selecionar</option>
            {employees.filter(e => e.role.toLowerCase() === 'motorista').map(e => (
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
            {employees.filter(e => e.role.toLowerCase() === 'ajudante').map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>
      </div>

      {!isOperator && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  readOnly
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-primary uppercase tracking-widest block">Valor 1ª Viagem Mot.</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-primary/50">R$</span>
                <input 
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm font-bold text-white outline-none" 
                  placeholder="0,00" 
                  type="number"
                  step="0.01"
                  value={formData.valor1aViagemMotorista}
                  readOnly
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-primary uppercase tracking-widest block">Valor 2ª Viagem Mot.</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-primary/50">R$</span>
                <input 
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm font-bold text-white outline-none" 
                  placeholder="0,00" 
                  type="number"
                  step="0.01"
                  value={formData.valor2aViagemMotorista}
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-primary uppercase tracking-widest block">Valor 1ª Viagem Ajud.</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-primary/50">R$</span>
                <input 
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm font-bold text-white outline-none" 
                  placeholder="0,00" 
                  type="number"
                  step="0.01"
                  value={formData.valor1aViagemAjudante}
                  readOnly
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-primary uppercase tracking-widest block">Valor 2ª Viagem Ajud.</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-primary/50">R$</span>
                <input 
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm font-bold text-white outline-none" 
                  placeholder="0,00" 
                  type="number"
                  step="0.01"
                  value={formData.valor2aViagemAjudante}
                  readOnly
                />
              </div>
            </div>
          </div>

          <hr className="border-border-dark" />

          {/* Payment Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <h4 className="font-bold text-[10px] uppercase tracking-widest text-emerald-500">Informações de Pagamento</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        </>
      )}
    </div>
  );

  React.useEffect(() => {
    if (user?.role === 'OPERATOR' && !formData.tripId) {
      handleOpenDrawer();
    }
  }, [user, formData.tripId]);

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const fetchJson = async (url: string, name: string) => {
        console.log(`Fetching ${name} from ${url}...`);
        const res = await fetch(url);
        if (!res.ok) {
          const errorText = await res.text();
          console.error(`${name} API error (${res.status}):`, errorText);
          return [];
        }
        const data = await res.json();
        console.log(`${name} data received:`, data.length, 'items');
        return data;
      };

      const [tripsData, , vehiclesData, employeesData, contratantesData, fretesData] = await Promise.all([
        fetchJson(`/api/trips?month=${selectedMonth}&year=${selectedYear}&paymentStatus=${paymentFilter}`, 'Trips'),
        fetchJson('/api/routes', 'Routes'),
        fetchJson('/api/vehicles', 'Vehicles'),
        fetchJson('/api/employees', 'Employees'),
        fetchJson('/api/contratantes', 'Contratantes'),
        fetchJson('/api/fretes', 'Fretes')
      ]);

      setTrips(tripsData);
      setVehicles(vehiclesData);
      setEmployees(employeesData);
      setContratantes(contratantesData);
      setFretes(fretesData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear, paymentFilter]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenDrawer = (trip: Trip | null = null) => {
    if (trip) {
      setSelectedTrip(trip);
      setFormData({
        tripId: trip.tripId,
        routeId: trip.routeId?.toString() || '',
        freteId: trip.freteId?.toString() || '',
        contratanteId: trip.contratanteId?.toString() || '',
        vehicleId: trip.vehicleId.toString(),
        driverId: trip.driverId.toString(),
        helperId: trip.helperId?.toString() || '',
        scheduledAt: trip.scheduledAt ? safeFormat(trip.scheduledAt, 'yyyy-MM-dd') : '',
        value: trip.value?.toString() || '',
        valor1aViagemMotorista: trip.valor1aViagemMotorista?.toString() || '',
        valor2aViagemMotorista: trip.valor2aViagemMotorista?.toString() || '',
        valor1aViagemAjudante: trip.valor1aViagemAjudante?.toString() || '',
        valor2aViagemAjudante: trip.valor2aViagemAjudante?.toString() || '',
        status: trip.status,
        paid: trip.paid || 'não',
        contract: trip.contract || '',
        odometer: trip.odometer?.toString() || '',
        romaneio: trip.romaneio || '',
        paymentDate: trip.paymentDate ? safeFormat(trip.paymentDate, 'yyyy-MM-dd') : ''
      });
    } else {
      setSelectedTrip(null);
      setFormData({
        tripId: `TRIP-${Math.floor(1000 + Math.random() * 9000)}`,
        routeId: '',
        freteId: '',
        contratanteId: '',
        vehicleId: '',
        driverId: '',
        helperId: '',
        scheduledAt: format(new Date(), 'yyyy-MM-dd'),
        value: '',
        valor1aViagemMotorista: '',
        valor2aViagemMotorista: '',
        valor1aViagemAjudante: '',
        valor2aViagemAjudante: '',
        status: 'SCHEDULED',
        paid: 'não',
        contract: '',
        odometer: '',
        romaneio: '',
        paymentDate: ''
      });
    }
    setIsDrawerOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const url = selectedTrip ? `/api/trips/${selectedTrip.id}` : '/api/trips';
      const method = selectedTrip ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        if (user?.role === 'OPERATOR') {
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 5000);
          // Reset form for next entry
          handleOpenDrawer();
        } else {
          setIsDrawerOpen(false);
          fetchData();
        }
      } else {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const error = await response.json();
          alert(error.error || 'Erro ao salvar viagem');
        } else {
          const text = await response.text();
          console.error('Non-JSON error response:', text);
          alert('Erro no servidor ao salvar viagem');
        }
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Erro de conexão ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/trips/${id}`, { method: 'DELETE' });
      
      const contentType = response.headers.get("content-type");
      if (response.ok) {
        setDeleteConfirmId(null);
        fetchData();
      } else {
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const data = await response.json();
          alert(data.error || 'Erro ao excluir viagem');
        } else {
          const text = await response.text();
          console.error('Non-JSON error response:', text);
          alert('Erro no servidor ao excluir viagem');
        }
        setDeleteConfirmId(null);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Erro de conexão ao excluir');
    }
  };

  const handleClone = async (trip: Trip) => {
    try {
      console.log('Cloning trip:', trip);
      const newTripId = `TRIP-${Math.floor(1000 + Math.random() * 9000)}`;
      const cloneData = {
        tripId: newTripId,
        routeId: trip.routeId?.toString() || '',
        freteId: trip.freteId?.toString() || '',
        contratanteId: trip.contratanteId?.toString() || '',
        vehicleId: trip.vehicleId?.toString() || '',
        driverId: trip.driverId?.toString() || '',
        helperId: trip.helperId?.toString() || '',
        scheduledAt: trip.scheduledAt ? safeFormat(trip.scheduledAt, 'yyyy-MM-dd') : safeFormat(new Date().toISOString(), 'yyyy-MM-dd'),
        value: trip.value?.toString() || '0',
        valor1aViagemMotorista: trip.valor1aViagemMotorista?.toString() || '',
        valor2aViagemMotorista: trip.valor2aViagemMotorista?.toString() || '',
        valor1aViagemAjudante: trip.valor1aViagemAjudante?.toString() || '',
        valor2aViagemAjudante: trip.valor2aViagemAjudante?.toString() || '',
        status: trip.status || 'SCHEDULED',
        paid: 'não',
        contract: trip.contract || '',
        odometer: trip.odometer?.toString() || '',
        romaneio: trip.romaneio || '',
        paymentDate: ''
      };

      console.log('Sending clone data:', cloneData);

      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cloneData)
      });

      if (response.ok) {
        console.log('Clone successful');
        setCloneConfirmId(null);
        fetchData();
      } else {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const error = await response.json();
          console.error('Clone failed:', error);
          alert(error.details || error.error || 'Erro ao clonar viagem');
        } else {
          const text = await response.text();
          console.error('Non-JSON error response:', text);
          alert('Erro no servidor ao clonar viagem');
        }
        setCloneConfirmId(null);
      }
    } catch (error) {
      console.error('Clone error:', error);
      alert('Erro de conexão ao clonar');
      setCloneConfirmId(null);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  };

  const safeFormat = (dateString: string | null | undefined, formatStr: string, fallback: string = '') => {
    if (!dateString) return fallback;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return fallback;
    return format(date, formatStr);
  };

  const filteredTrips = trips.filter(trip => {
    const destination = trip.frete?.cidade || trip.route?.destination || '';
    const contract = trip.contratante?.ContratanteNome || trip.contract || '';
    const romaneio = trip.romaneio || '';
    const matchesSearch = destination.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         contract.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         romaneio.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVehicle = vehicleFilter === '' || trip.vehicleId.toString() === vehicleFilter;
    const matchesContratante = contratanteFilter === '' || trip.contratanteId?.toString() === contratanteFilter;
    return matchesSearch && matchesVehicle && matchesContratante;
  });

  return (
    <AppLayout>
      <Header 
        title={user?.role === 'OPERATOR' 
          ? `Cadastro Nova Viagem, Operador: ${user.name} - Função: ${user.role === 'OPERATOR' ? 'Motorista' : user.role} ${format(currentTime, 'dd/MM/yyyy HH:mm')}`
          : "Viagens"
        } 
        actionLabel={user?.role === 'OPERATOR' ? undefined : "Nova Viagem"} 
        onAction={user?.role === 'OPERATOR' ? undefined : () => handleOpenDrawer()}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {user?.role === 'OPERATOR' && (
          <button 
            onClick={handleLogout}
            className="absolute top-4 right-4 p-3 bg-surface-dark border border-border-dark rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all z-10 shadow-lg"
            title="Sair do Sistema"
          >
            <LogOut className="w-6 h-6" />
          </button>
        )}

        {user?.role === 'OPERATOR' ? (
          <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
            <div className="max-w-2xl mx-auto">
              {showSuccess && (
                <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 font-bold text-center animate-in fade-in zoom-in duration-300">
                  VIAGEM CADASTRADA COM SUCESSO
                </div>
              )}
              
              <div className="bg-surface-dark border border-border-dark rounded-2xl p-6 md:p-8 shadow-xl space-y-8">
                {/* Form Content for Operator */}
                {renderFormContent()}
                
                <div className="pt-4 flex items-center gap-4">
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 bg-primary hover:bg-primary/90 text-background-dark py-4 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 text-lg"
                  >
                    {isSaving ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <Check className="w-6 h-6" />
                    )}
                    {isSaving ? 'Salvando...' : 'Salvar Viagem'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-8 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black tracking-tight">Viagens</h2>
              <p className="text-slate-500 mt-1">Gerencie os valores de frete, motoristas e ajudantes por viagem.</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="mt-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3 bg-surface-dark border border-border-dark rounded-xl p-1.5 shadow-sm">
                <div className="flex items-center gap-2 px-3 py-1.5 text-slate-400">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Período:</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <select 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="bg-background-dark border border-border-dark text-white text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                  >
                    {months.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>

                  <select 
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="bg-background-dark border border-border-dark text-white text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                  >
                    {[2024, 2025, 2026].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-surface-dark border border-border-dark rounded-xl p-1.5 shadow-sm">
                <div className="flex items-center gap-2 px-3 py-1.5 text-slate-400">
                  <Receipt className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Pagamento:</span>
                </div>
                
                <select 
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="bg-background-dark border border-border-dark text-white text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary transition-all cursor-pointer"
                >
                  <option value="all">Todos</option>
                  <option value="paid">Pagos</option>
                  <option value="unpaid">Não Pagos</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[300px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input 
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none" 
                  placeholder="Busque por cidade, romaneio ou contrato" 
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
              <div className="w-full md:w-64 relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <select 
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none appearance-none"
                  value={contratanteFilter}
                  onChange={(e) => setContratanteFilter(e.target.value)}
                >
                  <option value="">Todos os Contratos</option>
                  {contratantes.map(c => (
                    <option key={c.id} value={c.id}>{c.ContratanteNome}</option>
                  ))}
                </select>
              </div>
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
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Cadastrado por:</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">Carregando viagens...</td>
                  </tr>
                ) : filteredTrips.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-500">Nenhuma viagem encontrada com os filtros aplicados.</td>
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
                        <span className="font-semibold text-white">{trip.frete?.cidade || trip.route?.destination || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-400">{trip.contratante?.ContratanteNome || trip.contract || '-'}</span>
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
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white">{trip.createdBy?.name || trip.createdBy?.username || 'Sistema'}</span>
                        <span className="text-[10px] text-slate-500">{safeFormat(trip.createdAt, 'dd/MM/yy HH:mm')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {deleteConfirmId === trip.id ? (
                          <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => handleDelete(trip.id)}
                              className="px-3 py-1 bg-rose-500 text-white text-[10px] font-bold rounded hover:bg-rose-600 transition-colors"
                            >
                              Confirmar
                            </button>
                            <button 
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-3 py-1 bg-slate-700 text-slate-300 text-[10px] font-bold rounded hover:bg-slate-600 transition-colors"
                            >
                              Sair
                            </button>
                          </div>
                        ) : cloneConfirmId === trip.id ? (
                          <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => handleClone(trip)}
                              className="px-3 py-1 bg-amber-500 text-background-dark text-[10px] font-bold rounded hover:bg-amber-600 transition-colors"
                            >
                              Confirmar Clone
                            </button>
                            <button 
                              onClick={() => setCloneConfirmId(null)}
                              className="px-3 py-1 bg-slate-700 text-slate-300 text-[10px] font-bold rounded hover:bg-slate-600 transition-colors"
                            >
                              Sair
                            </button>
                          </div>
                        ) : (
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setCloneConfirmId(trip.id); }}
                              className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
                              title="Clonar Viagem"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleOpenDrawer(trip); }}
                              className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(trip.id); }}
                              className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}
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
              {renderFormContent()}

              {!isOperator && (
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                  <p className="text-[10px] leading-relaxed text-slate-500 italic">
                    * Informe o status de pagamento para controle financeiro das viagens realizadas.
                  </p>
                </div>
              )}
            </div>

            <div className="p-8 border-t border-border-dark bg-background-dark/50 flex items-center gap-4">
              {!isOperator && (
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-6 py-3 rounded-lg border border-border-dark text-slate-400 font-bold hover:bg-surface-dark hover:text-white transition-colors"
                >
                  Cancelar
                </button>
              )}
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
                {isSaving ? 'Salvando...' : selectedTrip ? 'Atualizar Viagem' : 'Salvar Viagem'}
              </button>
            </div>
          </aside>
        </div>
      )}
    </AppLayout>
  );
}
