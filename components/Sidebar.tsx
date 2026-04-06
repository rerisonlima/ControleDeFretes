'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logoutAction } from '@/app/actions/auth';
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
  Wallet,
  User as UserIcon,
  X,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Map, label: 'Viagens', href: '/routes' },
  { icon: Wallet, label: 'Recebimentos', href: '/recebimentos' },
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
  const [user, setUser] = useState<{ name: string; role: string; lastLogin?: string } | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      console.log('Sidebar: Fetching session...');
      try {
        const res = await fetch('/api/auth/session');
        console.log('Sidebar: Session response status:', res.status);
        if (res.ok) {
          const data = await res.json();
          console.log('Sidebar: Session data received:', data);
          setUser(data);
        } else {
          console.warn('Sidebar: Session not found or invalid (Status:', res.status, ')');
        }
      } catch (error) {
        console.error('Sidebar: Error fetching session:', error);
      }
    };
    fetchSession();
  }, []);

  const handleLogout = async () => {
    await logoutAction();
    router.push('/login');
    router.refresh();
  };

  const getRoleLabel = (role: string) => {
    const r = role?.toUpperCase();
    switch (r) {
      case 'ADMIN': return 'Administrador';
      case 'GERENTE': return 'Gerente';
      case 'OPERATOR': return 'Operador';
      default: return 'Operador';
    }
  };

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border-dark bg-background-dark flex flex-col h-[100dvh] lg:h-screen">
      <div className="p-6 flex items-center justify-between shrink-0">
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

      <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto custom-scrollbar">
        {menuItems
          .filter(item => {
            if (!user) return false;
            if (user.role === 'ADMIN' || user.role === 'GERENTE') return true;
            return item.href === '/routes' || item.href === '/expenses';
          })
          .map((item) => {
          const isActive = pathname === item.href;
          const isDisabled = user?.role === 'GERENTE' && (item.href === '/employees' || item.href === '/users');
          const label = (user?.role === 'OPERATOR' && item.href === '/routes') ? 'Nova Viagem' : item.label;
          
          if (isDisabled) {
            return (
              <div
                key={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg opacity-50 cursor-not-allowed text-slate-600"
                title="Acessível apenas para o administrador do sistema"
              >
                <item.icon className="w-5 h-5 text-slate-600" />
                <span className="text-sm font-medium">{label}</span>
              </div>
            );
          }

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
              <span className="text-sm font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 pb-8 lg:pb-4 mt-auto border-t border-border-dark shrink-0 bg-background-dark">
        <div className="flex items-center gap-3 p-2">
          <div className="w-10 h-10 rounded-full bg-surface-dark border border-border-dark flex items-center justify-center text-slate-500 shrink-0">
            <UserIcon className="w-6 h-6" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">{user?.name || 'Carregando...'}</p>
            <p className="text-[10px] text-slate-500 truncate uppercase">{user ? getRoleLabel(user.role) : '...'}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-10 h-10 flex items-center justify-center bg-rose-600 border border-rose-500 text-white hover:bg-rose-700 rounded-lg transition-all shadow-lg shadow-rose-900/20 shrink-0"
            title="Sair do Sistema"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        {user?.lastLogin && (
          <div className="px-2 mt-1">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Clock className="w-2.5 h-2.5" />
              <p className="text-[9px] font-medium uppercase tracking-tight truncate">
                Acesso: {new Date(user.lastLogin).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
