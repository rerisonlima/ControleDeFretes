'use client';

import React from 'react';
import { LogOut, Truck, Menu } from 'lucide-react';
import { useSidebar } from './AppLayout';

interface HeaderProps {
  title: string;
  icon?: React.ElementType;
  actionLabel?: string;
  actionIcon?: React.ElementType;
  onAction?: () => void;
  onLogout?: () => void;
  onMenuClick?: () => void;
  secondaryAction?: {
    label: string;
    icon: React.ElementType;
    onClick: () => void;
    className?: string;
  };
}

export function Header({ title, icon: Icon, actionLabel, actionIcon: ActionIcon, onAction, onLogout, onMenuClick, secondaryAction }: HeaderProps) {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="h-16 border-b border-border-dark bg-[#1c1814] px-4 md:px-8 flex items-center justify-between z-[999] sticky top-0 shadow-xl">
      <div className="flex items-center gap-2 md:gap-3">
        <button 
          onClick={onMenuClick || toggleSidebar}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-400 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        {Icon && (
          <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg shrink-0">
            <Icon className="w-4 h-4 md:w-5 md:h-5 text-primary" />
          </div>
        )}
        <h2 className="text-sm md:text-base font-bold text-white tracking-tight">{title}</h2>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        {secondaryAction && (
          <button 
            onClick={secondaryAction.onClick}
            className={secondaryAction.className || "flex items-center gap-2 px-2 md:px-3 py-1.5 md:py-2 bg-orange-500/10 border border-orange-500/20 text-orange-500 hover:bg-orange-500/20 rounded-lg transition-all text-[10px] md:text-xs font-bold uppercase tracking-wider"}
          >
            <secondaryAction.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden sm:inline">{secondaryAction.label}</span>
          </button>
        )}

        {onLogout && (
          <button 
            onClick={onLogout}
            className="flex items-center gap-1.5 md:gap-2 px-2 md:px-2.5 py-1.5 bg-rose-600 border border-rose-500 text-white hover:bg-rose-700 rounded-lg transition-all text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-rose-900/20"
            title="Sair do Sistema"
          >
            <LogOut className="w-3 h-3 md:w-3.5 md:h-3.5" />
            <span className="hidden xs:inline">Sair</span>
          </button>
        )}

        <div className="h-6 md:h-8 w-px bg-border-dark"></div>
        {actionLabel && (
          <button 
            onClick={onAction}
            className="bg-primary hover:bg-primary/90 text-background-dark px-3 md:px-5 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center gap-1.5 md:gap-2 shadow-lg shadow-primary/20"
          >
            {ActionIcon ? <ActionIcon className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Truck className="w-3.5 h-3.5 md:w-4 md:h-4" />}
            <span>{actionLabel}</span>
          </button>
        )}
      </div>
    </header>
  );
}
