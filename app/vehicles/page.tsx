'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { Header } from '@/components/Header';
import { Toast, useToast } from '@/components/Toast';
import { 
  Search, 
  Truck, 
  Edit, 
  ChevronLeft, 
  ChevronRight,
  X,
  Check,
  Loader2,
  Eye,
  EyeOff,
  Power,
  Wrench,
  Calendar,
  Trash2,
  Plus,
  Gauge
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Maintenance {
  id?: number;
  type: string;
  odometer: string | number;
  executionDate?: string;
  currentOdometer?: string | number;
}

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
  currentOdometer?: number | null;
  categoriaId: number | null;
  tripCount?: number;
  totalDistance?: number;
  maintenances?: Maintenance[];
}

export default function VehiclesPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [categories, setCategories] = useState<{id: number, CategoriaNome: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [isMaintenanceBtnClicked, setIsMaintenanceBtnClicked] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  
  // Form State
  const [formData, setFormData] = useState({
    plate: '',
    type: '',
    categoriaId: '',
    brand: '',
    model: '',
    year: new Date().getFullYear().toString(),
    capacity: '',
    status: 'ACTIVE',
    currentOdometer: '',
    maintenances: [] as Maintenance[]
  });

  const fetchVehicles = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/vehicles?showInactive=${showInactive}`);
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
  }, [showInactive]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categorias');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
    fetchCategories();
  }, [fetchVehicles, fetchCategories]);

  const handleOpenDrawer = (vehicle: Vehicle | null = null) => {
    setShowErrors(false);
    setIsMaintenanceBtnClicked(false);
    if (vehicle) {
      setSelectedVehicle(vehicle);
      setFormData({
        plate: vehicle.plate,
        type: vehicle.type,
        categoriaId: vehicle.categoriaId?.toString() || '',
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year.toString(),
        capacity: vehicle.capacity.toString(),
        status: vehicle.status,
        currentOdometer: vehicle.currentOdometer?.toString() || '',
        maintenances: vehicle.maintenances?.map(m => {
          if (!m.executionDate) return { ...m, executionDate: '' };
          const date = new Date(m.executionDate);
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return { ...m, executionDate: `${day}/${month}/${year}` };
        }) || []
      });
    } else {
      setSelectedVehicle(null);
      setFormData({
        plate: '',
        type: '',
        categoriaId: '',
        brand: '',
        model: '',
        year: new Date().getFullYear().toString(),
        capacity: '',
        status: 'ACTIVE',
        currentOdometer: '',
        maintenances: []
      });
    }
    setIsDrawerOpen(true);
  };

  const handleAddMaintenance = () => {
    setIsMaintenanceBtnClicked(true);
    setTimeout(() => setIsMaintenanceBtnClicked(false), 300);

    const newIndex = formData.maintenances.length;
    setFormData({
      ...formData,
      maintenances: [
        ...formData.maintenances,
        { type: '', odometer: '', executionDate: '', currentOdometer: formData.currentOdometer }
      ]
    });

    // Scroll to the new maintenance entry
    setTimeout(() => {
      const element = document.getElementById(`maintenance-${newIndex}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Focus the first input (Type)
        const input = element.querySelector('input[placeholder*="Troca de Óleo"]') as HTMLInputElement;
        if (input) input.focus();
      }
    }, 100);
  };

  const handleRemoveMaintenance = (index: number) => {
    const newMaintenances = [...formData.maintenances];
    newMaintenances.splice(index, 1);
    setFormData({ ...formData, maintenances: newMaintenances });
  };

  const handleMaintenanceChange = (index: number, field: keyof Maintenance, value: string) => {
    const newMaintenances = [...formData.maintenances];
    let finalValue = value;

    if (field === 'executionDate') {
      // Simple mask for DD/MM/YYYY
      const digits = value.replace(/\D/g, '');
      if (digits.length <= 8) {
        let masked = '';
        if (digits.length > 0) masked += digits.substring(0, 2);
        if (digits.length > 2) masked += '/' + digits.substring(2, 4);
        if (digits.length > 4) masked += '/' + digits.substring(4, 8);
        finalValue = masked;
      } else {
        return; // Don't allow more than 8 digits
      }
    }

    newMaintenances[index] = { ...newMaintenances[index], [field]: finalValue };
    setFormData({ ...formData, maintenances: newMaintenances });
  };

  const handleSave = async () => {
    if (!formData.plate || !formData.brand || !formData.model || !formData.categoriaId) {
      setShowErrors(true);
      showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
      return;
    }

    // Validate and format maintenance dates
    const formattedMaintenances = [];
    for (const m of formData.maintenances) {
      if (!m.type || !m.odometer) {
        setShowErrors(true);
        showToast('Por favor, preencha o tipo e o odômetro da manutenção.', 'error');
        return;
      }

      let formattedDate = null;
      if (m.executionDate) {
        const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        const match = m.executionDate.match(dateRegex);
        
        if (!match) {
          showToast(`Data de execução inválida: ${m.executionDate}. Use o formato DD/MM/AAAA.`, 'error');
          return;
        }

        const day = parseInt(match[1]);
        const month = parseInt(match[2]);
        const year = parseInt(match[3]);
        
        const date = new Date(year, month - 1, day);
        if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
          showToast(`Data de execução inválida: ${m.executionDate}.`, 'error');
          return;
        }
        formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }

      formattedMaintenances.push({
        ...m,
        executionDate: formattedDate
      });
    }

    try {
      setIsSaving(true);
      const url = selectedVehicle ? `/api/vehicles/${selectedVehicle.id}` : '/api/vehicles';
      const method = selectedVehicle ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        maintenances: formattedMaintenances
      };

      console.log('Saving vehicle:', { url, method, payload });

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsDrawerOpen(false);
        showToast(selectedVehicle ? 'Veículo atualizado!' : 'Veículo cadastrado!', 'success');
        fetchVehicles();
      } else {
        const errorData = await res.json();
        showToast(`${errorData.error || 'Erro ao salvar veículo'}${errorData.details ? ': ' + errorData.details : ''}`, 'error');
      }
    } catch (error) {
      console.error('Error saving vehicle:', error);
      showToast('Erro de conexão ao salvar veículo', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (vehicle: Vehicle) => {
    const newStatus = vehicle.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
    const action = newStatus === 'ACTIVE' ? 'ativar' : 'desativar';
    
    if (window.confirm(`Tem certeza que deseja ${action} este veículo?`)) {
      try {
        const res = await fetch(`/api/vehicles/${vehicle.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...vehicle, status: newStatus }),
        });

        if (res.ok) {
          fetchVehicles();
        }
      } catch (error) {
        console.error('Error toggling vehicle status:', error);
      }
    }
  };

  return (
    <AppLayout>
      <Header 
        title="Cadastro de Veículos" 
        actionLabel="Novo Veículo" 
        onAction={() => handleOpenDrawer()}
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
              <button 
                onClick={() => setShowInactive(!showInactive)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  showInactive 
                    ? "bg-primary text-background-dark" 
                    : "bg-surface-dark border border-border-dark text-slate-300 hover:border-primary"
                )}
              >
                {showInactive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span>{showInactive ? 'Exibindo Inativos' : 'Ver Inativos'}</span>
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
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Viagens</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">KM Viajados</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Última Manutenção</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-sm text-slate-500">Carregando veículos...</p>
                      </div>
                    </td>
                  </tr>
                ) : vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-10 text-center text-slate-500">
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
                    <td className="px-6 py-5 text-center text-white font-medium">{v.tripCount || 0}</td>
                    <td className="px-6 py-5 text-center text-white font-medium">{v.totalDistance?.toLocaleString('pt-BR') || 0} km</td>
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
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenDrawer(v)}
                          className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleToggleStatus(v)}
                          className={cn(
                            "p-2 rounded-lg transition-colors",
                            v.status === 'INACTIVE' 
                              ? "text-emerald-500 hover:bg-emerald-500/10" 
                              : "text-rose-500 hover:bg-rose-500/10"
                          )}
                          title={v.status === 'INACTIVE' ? "Ativar" : "Desativar"}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </div>
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
                <h3 className="text-xl font-bold text-white">{selectedVehicle ? 'Editar Veículo' : 'Novo Veículo'}</h3>
                <p className="text-sm text-slate-500 mt-1">{selectedVehicle ? 'Atualize as informações do veículo' : 'Preencha os dados básicos do veículo'}</p>
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
                  className={cn(
                    "w-full px-4 py-3 bg-surface-dark border rounded-lg focus:ring-2 focus:ring-primary outline-none text-white placeholder:text-slate-700 uppercase",
                    showErrors && !formData.plate ? "border-rose-500 ring-1 ring-rose-500" : "border-border-dark"
                  )}
                  placeholder="Ex: ABC-1234"
                  type="text"
                  value={formData.plate}
                  onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tipo de Veículo</label>
                <select 
                  className={cn(
                    "w-full px-4 py-3 bg-surface-dark border rounded-lg focus:ring-2 focus:ring-primary outline-none text-white appearance-none",
                    showErrors && !formData.categoriaId ? "border-rose-500 ring-1 ring-rose-500" : "border-border-dark"
                  )}
                  value={formData.categoriaId}
                  onChange={(e) => {
                    const selectedCat = categories.find(c => c.id.toString() === e.target.value);
                    setFormData({ 
                      ...formData, 
                      categoriaId: e.target.value,
                      type: selectedCat ? selectedCat.CategoriaNome : ''
                    });
                  }}
                >
                  <option value="">Selecione um tipo</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.CategoriaNome}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Marca</label>
                  <input 
                    className={cn(
                      "w-full px-4 py-3 bg-surface-dark border rounded-lg focus:ring-2 focus:ring-primary outline-none text-white placeholder:text-slate-700",
                      showErrors && !formData.brand ? "border-rose-500 ring-1 ring-rose-500" : "border-border-dark"
                    )}
                    placeholder="Ex: Scania"
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Modelo</label>
                  <input 
                    className={cn(
                      "w-full px-4 py-3 bg-surface-dark border rounded-lg focus:ring-2 focus:ring-primary outline-none text-white placeholder:text-slate-700",
                      showErrors && !formData.model ? "border-rose-500 ring-1 ring-rose-500" : "border-border-dark"
                    )}
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

              {selectedVehicle && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</label>
                  <select 
                    className="w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-primary outline-none text-white appearance-none"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="ACTIVE">Ativo</option>
                    <option value="MAINTENANCE">Manutenção</option>
                    <option value="INACTIVE">Inativo</option>
                  </select>
                </div>
              )}

              {/* Maintenance Section */}
              <div className="pt-6 border-t border-border-dark space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-primary" />
                    Manutenção Preventiva
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddMaintenance}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 bg-primary text-background-dark rounded-lg text-[10px] font-bold uppercase tracking-tight hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95",
                      isMaintenanceBtnClicked && "animate-pulse ring-4 ring-primary/30"
                    )}
                  >
                    <Plus className="w-3 h-3" />
                    Cadastrar Manutenção
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-dark p-4 rounded-xl border border-border-dark">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Quantidade de Viagens</label>
                    <p className="text-2xl font-bold text-white">{selectedVehicle?.tripCount || 0}</p>
                  </div>
                  <div className="bg-surface-dark p-4 rounded-xl border border-border-dark">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Kilômetros Viajados</label>
                    <p className="text-2xl font-bold text-white">{selectedVehicle?.totalDistance?.toLocaleString('pt-BR') || 0} km</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {formData.maintenances.map((m, index) => (
                    <div 
                      key={index} 
                      id={`maintenance-${index}`}
                      className="p-4 bg-surface-dark/50 border border-border-dark rounded-xl space-y-4 relative group scroll-mt-6"
                    >
                      <button
                        type="button"
                        onClick={() => handleRemoveMaintenance(index)}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Odômetro Atual</label>
                        <div className="relative">
                          <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input
                            className="w-full pl-10 pr-4 py-2.5 bg-background-dark/30 border border-border-dark rounded-lg outline-none text-slate-400 text-sm cursor-not-allowed"
                            type="text"
                            value={m.currentOdometer || formData.currentOdometer || '0'}
                            readOnly
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tipo de Manutenção</label>
                        <div className="relative">
                          <Wrench className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input
                            className={cn(
                              "w-full pl-10 pr-4 py-2.5 bg-background-dark border rounded-lg focus:ring-2 focus:ring-primary outline-none text-white text-sm",
                              showErrors && !m.type ? "border-rose-500 ring-1 ring-rose-500" : "border-border-dark"
                            )}
                            placeholder="Ex: Troca de Óleo"
                            type="text"
                            value={m.type}
                            onChange={(e) => handleMaintenanceChange(index, 'type', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Kilometragem p/ Manutenção</label>
                          <input
                            className={cn(
                              "w-full px-4 py-2.5 bg-background-dark border rounded-lg focus:ring-2 focus:ring-primary outline-none text-white text-sm",
                              showErrors && !m.odometer ? "border-rose-500 ring-1 ring-rose-500" : "border-border-dark"
                            )}
                            placeholder="Ex: 50000"
                            type="number"
                            value={m.odometer}
                            onChange={(e) => handleMaintenanceChange(index, 'odometer', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Data Execução</label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                              className="w-full pl-10 pr-4 py-2.5 bg-background-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-primary outline-none text-white text-sm"
                              type="text"
                              placeholder="DD/MM/AAAA"
                              value={m.executionDate}
                              onChange={(e) => handleMaintenanceChange(index, 'executionDate', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {formData.maintenances.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-border-dark rounded-xl">
                      <p className="text-sm text-slate-600">Nenhuma manutenção registrada</p>
                    </div>
                  )}
                </div>
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
                {isSaving ? 'Salvando...' : selectedVehicle ? 'Atualizar Veículo' : 'Salvar Veículo'}
              </button>
            </div>
          </div>
        </div>
      )}
      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.isVisible} 
        onClose={hideToast} 
      />
    </AppLayout>
  );
}
