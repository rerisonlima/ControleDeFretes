'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSidebar } from './AppLayout';
import { 
  LayoutDashboard, 
  Calculator, 
  Users, 
  UserCog, 
  Map, 
  Truck, 
  Receipt, 
  LogOut,
  TruckIcon,
  Table,
  FileText,
  X,
  User as UserIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Map, label: 'Viagens', href: '/routes' },
  { icon: Calculator, label: 'Pagamentos', href: '/payments' },
  { icon: Receipt, label: 'Despesas', href: '/expenses' },
  { icon: Truck, label: 'Veículos', href: '/vehicles' },
  { icon: FileText, label: 'Contratos', href: '/contracts' },
  { icon: Table, label: 'Tabelas', href: '/tables' },
  { icon: Users, label: 'Funcionários', href: '/employees' },
  { icon: UserCog, label: 'Usuários', href: '/users' },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, handleLogout } = useSidebar();

  const getRoleLabel = (role: string) => {
    const r = role?.toUpperCase();
    switch (r) {
      case 'ADMIN': return 'Administrador';
      case 'MANAGER': return 'Gerente de Operações';
      case 'OPERATOR': return 'Operador';
      default: return role || 'Usuário';
    }
  };

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border-dark bg-background-dark flex flex-col h-screen overflow-hidden">
      <div className="p-6 border-b border-border-dark">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary rounded-lg p-1.5 flex items-center justify-center">
              <TruckIcon className="w-6 h-6 text-background-dark" />
            </div>
            <div>
              <h1 className="text-white text-lg font-bold leading-tight">Rápido Carioca</h1>
              <p className="text-primary text-[10px] font-medium uppercase tracking-wider">Administração</p>
            </div>
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-500 lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* User Profile Section - Prominent at the top */}
        <div className="bg-surface-dark/40 rounded-xl p-4 border border-border-dark/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <UserIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{user?.name || 'Carregando...'}</p>
              <p className="text-[10px] text-slate-500 truncate uppercase font-bold tracking-wider">{user ? getRoleLabel(user.role) : '...'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-lg transition-all text-[10px] font-black uppercase tracking-[0.1em] shadow-lg shadow-rose-900/10"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair do Sistema
          </button>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-6 overflow-y-auto custom-scrollbar">
        {menuItems
          .filter(item => user?.role !== 'OPERATOR' || item.href === '/routes' || item.href === '/expenses')
          .map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-slate-400 hover:bg-surface-dark hover:text-white"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-slate-400 group-hover:text-white")} />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {user?.lastLogin && (
        <div className="p-4 border-t border-border-dark bg-background-dark/50">
          <p className="text-[9px] text-slate-600 text-center font-medium uppercase tracking-widest">
            Último Acesso: {new Date(user.lastLogin).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      )}
    </aside>
  );
}
