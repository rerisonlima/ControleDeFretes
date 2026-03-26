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
      case 'MANAGER': return 'Gerente de Operações';
      case 'OPERATOR': return 'Operador';
      default: return role || 'Usuário';
    }
  };

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border-dark bg-background-dark flex flex-col h-screen">
      <div className="p-6 flex items-center justify-between">
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
            <LogOut className="w-4 h-4 rotate-180" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {menuItems
          .filter(item => user?.role !== 'OPERATOR' || item.href === '/routes')
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

      <div className="p-4 mt-auto border-t border-border-dark">
        <div className="flex items-center gap-3 p-2">
          <div className="w-10 h-10 rounded-full bg-surface-dark border border-border-dark flex items-center justify-center text-slate-500">
            <UserIcon className="w-6 h-6" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">{user?.name || 'Carregando...'}</p>
            <p className="text-[10px] text-slate-500 truncate uppercase">{user ? getRoleLabel(user.role) : '...'}</p>
            {user?.lastLogin && (
              <p className="text-[8px] text-slate-600 truncate mt-0.5">
                Acesso: {new Date(user.lastLogin).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
          <button 
            onClick={handleLogout}
            className="ml-auto text-slate-500 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
