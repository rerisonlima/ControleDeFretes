'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Header } from '@/components/Header';
import { 
  Search, 
  Download, 
  Edit, 
  ChevronLeft, 
  ChevronRight,
  X,
  UserPlus,
  Info,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Employee {
  id: number;
  name: string;
  role: 'DRIVER' | 'HELPER';
  phone: string | null;
  createdAt: string;
}

export default function EmployeesPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    role: 'DRIVER',
    phone: ''
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

  const handleSave = async () => {
    if (!formData.name || !formData.role) {
      alert('Por favor, preencha o nome e a função.');
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsDrawerOpen(false);
        setFormData({
          name: '',
          role: 'DRIVER',
          phone: ''
        });
        fetchEmployees();
      } else {
        const error = await res.json();
        alert(error.error || 'Erro ao salvar funcionário');
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      alert('Erro de conexão ao salvar funcionário');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout>
      <Header 
        title="Gestão de Funcionários" 
        actionLabel="Novo Funcionário" 
        onAction={() => setIsDrawerOpen(true)}
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
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-border-dark">Veículo (Placa)</th>
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
                ) : employees.map((emp, i) => (
                  <tr key={emp.id || i} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-background-dark flex items-center justify-center text-[10px] font-bold text-slate-400 border border-border-dark">
                          {emp.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-white">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border",
                        emp.role === 'DRIVER' ? "bg-primary/10 text-primary border-primary/20" : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                      )}>
                        {emp.role === 'DRIVER' ? 'Motorista' : 'Ajudante'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">{emp.phone || '-'}</td>
                    <td className="px-6 py-4 text-sm font-mono font-medium text-slate-300">-</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-500 hover:text-primary transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="px-6 py-4 bg-background-dark/30 border-t border-border-dark flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Mostrando 4 de 4 registros</span>
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
          <div className="w-full max-w-[400px] bg-background-dark h-full shadow-2xl border-l border-border-dark flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-8 border-b border-border-dark flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Novo Funcionário</h3>
                <p className="text-sm text-slate-500 mt-1">Cadastre um novo colaborador operacional</p>
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
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'DRIVER' | 'HELPER' })}
                >
                  <option value="DRIVER">Motorista</option>
                  <option value="HELPER">Ajudante</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Telefone</label>
                <input 
                  className="w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-primary outline-none text-white placeholder:text-slate-700"
                  placeholder="(00) 00000-0000"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-primary mb-1">Atenção</p>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Ao cadastrar um novo motorista, ele será automaticamente habilitado para receber rotas no sistema mobile.
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
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 px-4 py-3 bg-primary text-background-dark rounded-lg text-sm font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                {isSaving ? 'Salvando...' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
