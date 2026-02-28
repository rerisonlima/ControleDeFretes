'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Header } from '@/components/Header';
import { 
  Search, 
  Edit, 
  Trash2, 
  X, 
  Check, 
  Eye, 
  EyeOff,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'OPERATOR';
  createdAt: string;
}

export default function UsersPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'OPERATOR'
  });

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.username || !formData.password) {
      alert('Por favor, preencha todos os campos.');
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsDrawerOpen(false);
        setFormData({
          name: '',
          email: '',
          username: '',
          password: '',
          role: 'OPERATOR'
        });
        fetchUsers();
      } else {
        const error = await res.json();
        alert(error.error || 'Erro ao salvar usuário');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Erro de conexão ao salvar usuário');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppLayout>
      <Header 
        title="Gestão de Usuários" 
        actionLabel="Novo Usuário" 
        onAction={() => setIsDrawerOpen(true)}
      />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Table Section */}
        <section className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input 
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-dark border border-border-dark rounded-xl text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-slate-600" 
                  placeholder="Pesquisar usuários..." 
                  type="text"
                />
              </div>
            </div>

            <div className="bg-surface-dark border border-border-dark rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-background-dark/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                    <th className="px-6 py-4">Nome</th>
                    <th className="px-6 py-4">Username</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Cargo</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dark">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-8 h-8 text-primary animate-spin" />
                          <p className="text-sm text-slate-500">Carregando usuários...</p>
                        </div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                        Nenhum usuário cadastrado.
                      </td>
                    </tr>
                  ) : users.map((user, i) => (
                    <tr key={user.id || i} className="hover:bg-white/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-background-dark flex items-center justify-center text-slate-500 text-[10px] font-bold border border-border-dark uppercase">
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-white">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">{user.username}</td>
                      <td className="px-6 py-4 text-sm text-slate-400">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border",
                          user.role === 'ADMIN' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                          user.role === 'MANAGER' ? "bg-purple-500/10 text-purple-500 border-purple-500/20" :
                          "bg-slate-500/10 text-slate-400 border-slate-500/20"
                        )}>
                          {user.role === 'ADMIN' ? 'Admin' : user.role === 'MANAGER' ? 'Gerente' : 'Operador'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "flex items-center gap-1.5 text-xs font-medium",
                          "text-emerald-500"
                        )}>
                          <div className={cn("w-1.5 h-1.5 rounded-full", "bg-emerald-500")} />
                          Ativo
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-1.5 hover:bg-white/10 rounded-lg text-slate-500 hover:text-primary transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 hover:bg-white/10 rounded-lg text-slate-500 hover:text-rose-500 transition-colors">
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
        </section>

        {/* Side Form Panel */}
        {isDrawerOpen && (
          <aside className="w-96 border-l border-border-dark bg-background-dark p-8 overflow-y-auto custom-scrollbar animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-white">Novo Usuário</h3>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form className="space-y-6" onSubmit={handleSave}>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Nome Completo</label>
                <input 
                  className="w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-primary/50 outline-none text-white text-sm placeholder:text-slate-700" 
                  placeholder="Ex: João Silva" 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">E-mail Corporativo</label>
                <input 
                  className="w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-primary/50 outline-none text-white text-sm placeholder:text-slate-700" 
                  placeholder="email@exemplo.com.br" 
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Username</label>
                  <input 
                    className="w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-primary/50 outline-none text-white text-sm placeholder:text-slate-700" 
                    placeholder="jsilva" 
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Cargo</label>
                  <div className="relative">
                    <select 
                      className="w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-primary/50 outline-none text-white text-sm appearance-none"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="MANAGER">Gerente</option>
                      <option value="OPERATOR">Operador</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 pointer-events-none" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Senha de Acesso</label>
                <div className="relative">
                  <input 
                    className="w-full px-4 py-3 bg-surface-dark border border-border-dark rounded-lg focus:ring-2 focus:ring-primary/50 outline-none text-white text-sm placeholder:text-slate-700" 
                    placeholder="••••••••" 
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[9px] text-slate-500 mt-1 font-medium italic">Mínimo de 8 caracteres, incluindo letras e números.</p>
              </div>
              
              <div className="pt-6 flex flex-col gap-3">
                <button 
                  className="w-full bg-primary hover:bg-primary/90 text-background-dark font-bold py-3 rounded-lg transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50" 
                  type="submit"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {isSaving ? 'Salvando...' : 'Salvar Usuário'}
                </button>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-full bg-transparent hover:bg-white/5 text-slate-500 font-bold py-2 rounded-lg transition-colors" 
                  type="button"
                  disabled={isSaving}
                >
                  Cancelar
                </button>
              </div>
            </form>
            
            <div className="mt-12 p-4 bg-primary/5 rounded-xl border border-primary/20">
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">Informações Adicionais</p>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Último Acesso:</span>
                  <span className="text-xs font-medium text-white">--</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Criado em:</span>
                  <span className="text-xs font-medium text-white">15/10/2023</span>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>
    </AppLayout>
  );
}
