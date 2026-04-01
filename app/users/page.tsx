'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Header } from '@/components/Header';
import { 
  Search, 
  UserPlus, 
  Shield, 
  Edit2, 
  Trash2, 
  X, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface User {
  id: number;
  username: string;
  role: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        console.log('Fetched users:', data);
        setUsers(data);
      } else {
        const errData = await res.json();
        console.error('Error fetching users:', errData);
        setError(`Erro ao buscar usuários: ${errData.error || res.statusText}`);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Erro de conexão ao buscar usuários');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedUser(null);
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setModalMode('edit');
    setSelectedUser(user);
    setError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return;
    
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchUsers();
      } else {
        alert('Erro ao excluir usuário');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      const url = modalMode === 'create' ? '/api/users' : `/api/users/${selectedUser?.id}`;
      const method = modalMode === 'create' ? 'POST' : 'PUT';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchUsers();
      } else {
        const errData = await res.json();
        setError(errData.error || 'Erro ao salvar usuário');
      }
    } catch (err) {
      setError('Erro de conexão');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <Header 
        title="Gestão de Usuários" 
        actionLabel="Novo Usuário" 
        onAction={handleOpenCreate}
      />
      
      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
            <input 
              className="w-full pl-12 pr-4 py-3 bg-surface-dark border border-border-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm transition-all text-white placeholder:text-slate-600"
              placeholder="Pesquisar por nome de usuário..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Users List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-surface-dark border border-border-dark rounded-xl animate-pulse"></div>
              ))
            ) : filteredUsers.length === 0 ? (
              <div className="col-span-full py-20 text-center text-slate-500 italic">
                Nenhum usuário encontrado.
              </div>
            ) : filteredUsers.map((user) => (
              <div key={user.id} className="bg-surface-dark border border-border-dark rounded-xl p-4 md:p-5 flex items-center justify-between hover:border-primary/50 transition-all group">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-background-dark border border-border-dark flex items-center justify-center text-primary shrink-0">
                    <Shield className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-white font-bold truncate">{user.username}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest",
                        user.role === 'ADMIN' ? "bg-primary/10 text-primary" : "bg-slate-500/10 text-slate-400"
                      )}>
                        {user.role === 'ADMIN' ? 'Admin' : 'Operador'}
                      </span>
                      <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">#{user.id}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 md:gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0">
                  <button 
                    onClick={() => handleOpenEdit(user)}
                    className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(user.id)}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Modal Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-dark border border-border-dark rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-border-dark">
              <h2 className="text-xl font-bold text-white">
                {modalMode === 'create' ? 'Novo Usuário' : 'Editar Usuário'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest ml-1">Nome de Usuário</label>
                  <input 
                    required
                    name="username"
                    defaultValue={selectedUser?.username || ''}
                    className="w-full px-4 py-3 rounded-xl border border-border-dark bg-background-dark text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-slate-700 text-sm" 
                    placeholder="Ex: joao.silva" 
                    type="text"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest ml-1">
                    {modalMode === 'create' ? 'Senha' : 'Nova Senha (deixe em branco para manter)'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                    <input 
                      required={modalMode === 'create'}
                      name="password"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-border-dark bg-background-dark text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-slate-700 text-sm" 
                      placeholder="••••••••" 
                      type="password"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest ml-1">Nível de Acesso</label>
                  <select 
                    required
                    name="role"
                    defaultValue={selectedUser?.role || 'OPERATOR'}
                    className="w-full px-4 py-3 rounded-xl border border-border-dark bg-background-dark text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm appearance-none"
                  >
                    <option value="OPERATOR">Operador</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 px-4 bg-background-dark hover:bg-white/5 text-white font-bold rounded-xl border border-border-dark transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 bg-primary hover:bg-primary/90 text-background-dark font-black rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    modalMode === 'create' ? 'Criar Usuário' : 'Salvar Alterações'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
