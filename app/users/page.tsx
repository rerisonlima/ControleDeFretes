'use client';

import React, { useState, useEffect } from 'react';
import AppLayout, { useSidebar } from '@/components/AppLayout';
import { Header } from '@/components/Header';
import { Toast, useToast } from '@/components/Toast';
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
  lastLogin?: string;
  createdAt: string;
}

export default function UsersPage() {
  const { user } = useSidebar();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { toast, showToast, hideToast } = useToast();

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
      if (!res.ok) {
        const text = await res.text();
        console.error('API error response:', text);
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setUsers(data);
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
    if (!formData.name || !formData.email || !formData.username || (!selectedUser && !formData.password)) {
      showToast('Por favor, preencha todos os campos.', 'error');
      return;
    }

    try {
      setIsSaving(true);
      const url = selectedUser ? `/api/users/${selectedUser.id}` : '/api/users';
      const method = selectedUser ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsDrawerOpen(false);
        setSelectedUser(null);
        setFormData({
          name: '',
          email: '',
          username: '',
          password: '',
          role: 'OPERATOR'
        });
        showToast(selectedUser ? 'Usuário atualizado!' : 'Usuário cadastrado!', 'success');
        fetchUsers();
      } else {
        const error = await res.json();
        showToast(error.error || 'Erro ao salvar usuário', 'error');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      showToast('Erro de conexão ao salvar usuário', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      username: user.username,
      password: '', // Don't populate password for security
      role: user.role
    });
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showToast('Usuário excluído com sucesso!', 'success');
        fetchUsers();
      } else {
        const error = await res.json();
        showToast(error.error || 'Erro ao excluir usuário', 'error');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('Erro de conexão ao excluir usuário', 'error');
    }
  };

  return (
    <AppLayout>
      <Header 
        title="Gestão de Usuários" 
        actionLabel="Novo Usuário" 
        onAction={() => {
          setSelectedUser(null);
          setFormData({
            name: '',
            email: '',
            username: '',
            password: '',
            role: 'OPERATOR'
          });
          setIsDrawerOpen(true);
        }}
      />
      
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Table Section */}
        <section className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input 
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-dark border border-border-dark rounded-xl text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-slate-600" 
                  placeholder="Pesquisar usuários..." 
                  type="text"
                />
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-surface-dark border border-border-dark rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-background-dark/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                    <th className="px-6 py-4">Nome</th>
                    <th className="px-6 py-4">Username</th>
                    <th className="px-6 py-4">Email</th>
                    <th className="px-6 py-4">Cargo</th>
                    <th className="px-6 py-4">Último Acesso</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dark">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-8 h-8 text-primary animate-spin" />
                          <p className="text-sm text-slate-500">Carregando usuários...</p>
                        </div>
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
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
                          user.role?.toUpperCase() === 'ADMIN' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                          user.role?.toUpperCase() === 'MANAGER' ? "bg-purple-500/10 text-purple-500 border-purple-500/20" :
                          user.role?.toUpperCase() === 'OPERATOR' ? "bg-slate-500/10 text-slate-400 border-slate-500/20" :
                          "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        )}>
                          {user.role?.toUpperCase() === 'ADMIN' ? 'Admin' : 
                           user.role?.toUpperCase() === 'MANAGER' ? 'Gerente' : 
                           user.role?.toUpperCase() === 'OPERATOR' ? 'Operador' : 
                           user.role || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleString('pt-BR') : 'Nunca'}
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
                          <button 
                            onClick={() => handleEdit(user)}
                            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-500 hover:text-primary transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(user.id)}
                            className="p-1.5 hover:bg-white/10 rounded-lg text-slate-500 hover:text-rose-500 transition-colors"
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

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <p className="text-sm text-slate-500">Carregando usuários...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="bg-surface-dark border border-border-dark rounded-xl p-8 text-center text-slate-500">
                  Nenhum usuário cadastrado.
                </div>
              ) : (
                users.map((user, i) => (
                  <div key={user.id || i} className="bg-surface-dark border border-border-dark rounded-xl p-4 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-background-dark flex items-center justify-center text-slate-500 text-xs font-bold border border-border-dark uppercase">
                          {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">{user.name}</h4>
                          <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">{user.username}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleEdit(user)}
                          className="p-2 hover:bg-white/10 rounded-lg text-slate-500 hover:text-primary transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id)}
                          className="p-2 hover:bg-white/10 rounded-lg text-slate-500 hover:text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-3 border-y border-border-dark/50">
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Cargo</p>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border inline-block",
                          user.role?.toUpperCase() === 'ADMIN' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                          user.role?.toUpperCase() === 'MANAGER' ? "bg-purple-500/10 text-purple-500 border-purple-500/20" :
                          user.role?.toUpperCase() === 'OPERATOR' ? "bg-slate-500/10 text-slate-400 border-slate-500/20" :
                          "bg-amber-500/10 text-amber-500 border-amber-500/20"
                        )}>
                          {user.role?.toUpperCase() === 'ADMIN' ? 'Admin' : 
                           user.role?.toUpperCase() === 'MANAGER' ? 'Gerente' : 
                           user.role?.toUpperCase() === 'OPERATOR' ? 'Operador' : 
                           user.role || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status</p>
                        <span className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-500">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Ativo
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Email:</span>
                        <span className="text-xs text-slate-300 font-medium">{user.email}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Último Acesso:</span>
                        <span className="text-xs text-slate-300 font-medium">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleString('pt-BR') : 'Nunca'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Side Form Panel / Drawer */}
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 md:relative md:inset-auto md:z-0 flex justify-end">
            <div 
              className="absolute inset-0 bg-background-dark/80 backdrop-blur-sm md:hidden"
              onClick={() => {
                setIsDrawerOpen(false);
                setSelectedUser(null);
              }}
            />
            <aside className="relative w-full max-w-md md:w-96 border-l border-border-dark bg-background-dark p-6 md:p-8 overflow-y-auto custom-scrollbar animate-in slide-in-from-right duration-300 shadow-2xl md:shadow-none">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-white">
                  {selectedUser ? 'Editar Usuário' : 'Novo Usuário'}
                </h3>
                <button 
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setSelectedUser(null);
                  }}
                  className="text-slate-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-lg"
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
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                  {selectedUser ? 'Nova Senha (deixe em branco para manter)' : 'Senha de Acesso'}
                </label>
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
                {!selectedUser && (
                  <p className="text-[9px] text-slate-500 mt-1 font-medium italic">Mínimo de 8 caracteres, incluindo letras e números.</p>
                )}
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
                  {isSaving ? 'Salvando...' : selectedUser ? 'Atualizar Usuário' : 'Salvar Usuário'}
                </button>
                <button 
                  onClick={() => {
                    setIsDrawerOpen(false);
                    setSelectedUser(null);
                  }}
                  className="w-full bg-transparent hover:bg-white/5 text-slate-500 font-bold py-2 rounded-lg transition-colors" 
                  type="button"
                  disabled={isSaving}
                >
                  Cancelar
                </button>
              </div>
            </form>
            
            {selectedUser && (
              <div className="mt-12 p-4 bg-primary/5 rounded-xl border border-primary/20">
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3">Informações Adicionais</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Último Acesso:</span>
                    <span className="text-xs font-medium text-white">
                      {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString('pt-BR') : 'Nunca'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Criado em:</span>
                    <span className="text-xs font-medium text-white">
                      {new Date(selectedUser.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.isVisible} 
        onClose={hideToast} 
      />
    </AppLayout>
  );
}
