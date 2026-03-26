'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Header } from '@/components/Header';
import { Toast, useToast } from '@/components/Toast';
import { motion } from 'motion/react';
import { 
  Download, 
  Edit, 
  ChevronLeft, 
  ChevronRight,
  X,
  UserPlus,
  Info,
  Loader2,
  BarChart2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Employee {
  id: number;
  name: string;
  role: string;
  phone: string | null;
  pix: string | null;
  cnh: string | null;
  cnhCategory: string | null;
  _count?: {
    trips: number;
    helperTrips: number;
  };
}

export default function EmployeesPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast, showToast, hideToast } = useToast();
  
  // Form State
  const [formData, setFormData] = useState({
    id: 0,
    name: '',
    role: '',
    phone: '',
    pix: '',
    cnh: '',
    cnhCategory: '',
    totalTrips: 0
  });

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/employees');
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const formatPhone = (value: string) => {
    // Remove tudo que não é dígito
    const digits = value.replace(/\D/g, '');
    
    // Formata como (XX)XXXXX-XXXX
    if (digits.length <= 2) {
      return digits.length > 0 ? `(${digits}` : '';
    } else if (digits.length <= 7) {
      return `(${digits.slice(0, 2)})${digits.slice(2)}`;
    } else {
      return `(${digits.slice(0, 2)})${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, phone: formatPhone(e.target.value) });
  };

  const handleOpenDrawer = (employee?: Employee) => {
    if (employee) {
      setFormData({
        id: employee.id,
        name: employee.name,
        role: employee.role,
        phone: employee.phone || '',
        pix: employee.pix || '',
        cnh: employee.cnh || '',
        cnhCategory: employee.cnhCategory || '',
        totalTrips: (employee._count?.trips || 0) + (employee._count?.helperTrips || 0)
      });
    } else {
      setFormData({
        id: 0,
        name: '',
        role: '',
        phone: '',
        pix: '',
        cnh: '',
        cnhCategory: '',
        totalTrips: 0
      });
    }
    setIsDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.role) {
      showToast('Por favor, preencha o nome e a função.', 'error');
      return;
    }

    try {
      setIsSaving(true);
      
      const url = formData.id ? `/api/employees/${formData.id}` : '/api/employees';
      const method = formData.id ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsDrawerOpen(false);
        showToast(formData.id ? 'Funcionário atualizado!' : 'Funcionário cadastrado!', 'success');
        fetchEmployees();
      } else {
        const error = await res.json();
        showToast(error.error || 'Erro ao salvar funcionário', 'error');
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      showToast('Erro de conexão ao salvar funcionário', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout>
      <Header 
        title="Gestão de Funcionários" 
        actionLabel="Novo Funcionário" 
        onAction={() => handleOpenDrawer()}
      />
      
      <div className="flex-1 overflow-auto p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="flex items-end justify-between mb-2">
            <div>
              <h2 className="text-3xl font-black tracking-tight mb-2">Funcionários</h2>
              <p className="text-slate-500">Listagem completa da equipe operacional e motoristas ativos.</p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-surface-dark border border-border-dark rounded-lg hover:bg-border-dark transition-colors text-slate-300">
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
          </div>

          {/* Table Card */}
          <div className="bg-surface-dark rounded-xl border border-border-dark overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background-dark/50">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-border-dark">Nome</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-border-dark">Função</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-border-dark">Telefone</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-border-dark">Viagens</th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-border-dark text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <p className="text-sm text-slate-500">Carregando funcionários...</p>
                      </div>
                    </td>
                  </tr>
                ) : employees.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                      Nenhum funcionário cadastrado.
                    </td>
                  </tr>
                ) : employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-background-dark flex items-center justify-center text-[10px] font-bold text-slate-400 border border-border-dark">
                          {emp.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-white">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border",
                        emp.role.toLowerCase() === 'motorista' ? "bg-primary/10 text-primary border-primary/20" : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                      )}>
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">{emp.phone || '-'}</td>
                    <td className="px-6 py-4 text-sm font-mono font-medium text-slate-300">
                      {(emp._count?.trips || 0) + (emp._count?.helperTrips || 0)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleOpenDrawer(emp)}
                        className="text-slate-500 hover:text-primary transition-colors p-2 rounded-lg hover:bg-primary/10"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="px-6 py-4 bg-background-dark/30 border-t border-border-dark flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Mostrando {employees.length} registros</span>
              <div className="flex gap-2">
                <button className="p-1 rounded bg-surface-dark border border-border-dark text-slate-500 disabled:opacity-50" disabled>
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button className="p-1 rounded bg-surface-dark border border-border-dark text-slate-500 disabled:opacity-50" disabled>
                  <ChevronRight className="w-4 h-4" />
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
                <h3 className="text-xl font-bold text-white">
                  {formData.id ? 'Editar Funcionário' : 'Novo Funcionário'}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {formData.id ? 'Atualize os dados do colaborador' : 'Cadastre um novo colaborador operacional'}
                </p>
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
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nome Completo</label>
                <input 
                  className="w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-primary outline-none text-white placeholder:text-slate-700"
                  placeholder="Ex: Maria Oliveira"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Função</label>
                <select 
                  className="w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-primary outline-none text-white appearance-none"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option disabled value="">Selecione uma função</option>
                  <option value="Motorista">Motorista</option>
                  <option value="Ajudante">Ajudante</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Telefone</label>
                <input 
                  className="w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-primary outline-none text-white placeholder:text-slate-700 font-mono"
                  placeholder="(00)00000-0000"
                  type="tel"
                  maxLength={14}
                  value={formData.phone}
                  onChange={handlePhoneChange}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Chave Pix</label>
                <input 
                  className="w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-primary outline-none text-white placeholder:text-slate-700"
                  placeholder="CPF, E-mail, Telefone ou Aleatória"
                  type="text"
                  value={formData.pix}
                  onChange={(e) => setFormData({ ...formData, pix: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">CNH</label>
                  <input 
                    className="w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-primary outline-none text-white placeholder:text-slate-700"
                    placeholder="Número da CNH"
                    type="text"
                    value={formData.cnh}
                    onChange={(e) => setFormData({ ...formData, cnh: e.target.value })}
                  />
                </div>
                <div className="col-span-1 space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Categoria</label>
                  <input 
                    className="w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-primary outline-none text-white placeholder:text-slate-700 uppercase"
                    placeholder="Ex: AE"
                    type="text"
                    maxLength={5}
                    value={formData.cnhCategory}
                    onChange={(e) => setFormData({ ...formData, cnhCategory: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              {/* Estatísticas Section */}
              <div className="mt-8 pt-6 border-t border-border-dark">
                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-primary" />
                  Estatísticas
                </h4>
                <div className="bg-background-dark p-4 rounded-xl border border-border-dark flex items-center justify-between">
                  <span className="text-sm text-slate-400 font-medium">Total de Viagens</span>
                  <span className="text-2xl font-black text-white">{formData.totalTrips}</span>
                </div>
              </div>

              <div className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-primary mb-1">Atenção</p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Ao cadastrar um novo motorista, ele será automaticamente habilitado para receber viagens no sistema mobile.
                    </p>
                  </div>
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
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 px-4 py-3 bg-primary text-background-dark rounded-lg text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                {isSaving ? 'Salvando...' : 'Salvar'}
              </motion.button>
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
