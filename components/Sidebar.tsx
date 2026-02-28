'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { 
  LayoutDashboard, 
  Calculator, 
  Users, 
  Map, 
  Truck, 
  Receipt, 
  Settings,
  LogOut,
  TruckIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Map, label: 'Viagens', href: '/routes' },
  { icon: Calculator, label: 'Pagamentos', href: '/payments' },
  { icon: Receipt, label: 'Despesas', href: '/expenses' },
  { icon: Truck, label: 'Veículos', href: '/vehicles' },
  { icon: Users, label: 'Funcionários', href: '/employees' },
  { icon: Users, label: 'Usuários', href: '/users' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border-dark bg-background-dark flex flex-col h-screen">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-primary rounded-lg p-1.5 flex items-center justify-center">
          <TruckIcon className="w-6 h-6 text-background-dark" />
        </div>
        <div>
          <h1 className="text-white text-lg font-bold leading-tight">Rápido Carioca</h1>
          <p className="text-primary text-[10px] font-medium uppercase tracking-wider">Administração</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
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
          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-border-dark">
            <Image
              src="https://picsum.photos/seed/admin/100/100"
              alt="Avatar"
              fill
              className="object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">Ricardo Silva</p>
            <p className="text-[10px] text-slate-500 truncate uppercase">Gerente de Operações</p>
          </div>
          <button className="ml-auto text-slate-500 hover:text-white transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        <Link 
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 mt-2 rounded-lg text-slate-400 hover:bg-surface-dark hover:text-white transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm font-medium">Configurações</span>
        </Link>
      </div>
    </aside>
  );
}
