'use client';

import React from 'react';
import { LogOut, Truck } from 'lucide-react';

interface HeaderProps {
  title: string;
  icon?: React.ElementType;
  actionLabel?: string;
  onAction?: () => void;
  onLogout?: () => void;
  secondaryAction?: {
    label: string;
    icon: React.ElementType;
    onClick: () => void;
    className?: string;
  };
}

export function Header({ title, icon: Icon, actionLabel, onAction, onLogout, secondaryAction }: HeaderProps) {
  return (
    <header className="h-16 border-b border-border-dark bg-[#1c1814] px-8 flex items-center justify-between z-[999] sticky top-0 shadow-xl">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}
        <h2 className="text-base font-bold text-white tracking-tight">{title}</h2>
      </div>
      <div className="flex items-center gap-4">
        {secondaryAction && (
          <button 
            onClick={secondaryAction.onClick}
            className={secondaryAction.className || "flex items-center gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/20 text-orange-500 hover:bg-orange-500/20 rounded-lg transition-all text-xs font-bold uppercase tracking-wider"}
          >
            <secondaryAction.icon className="w-4 h-4" />
            <span>{secondaryAction.label}</span>
          </button>
        )}

        {onLogout && (
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-2.5 py-1.5 bg-rose-600 border border-rose-500 text-white hover:bg-rose-700 rounded-lg transition-all text-[10px] font-bold uppercase tracking-wider shadow-lg shadow-rose-900/20"
            title="Sair do Sistema"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        )}

        <div className="h-8 w-px bg-border-dark"></div>
        {actionLabel && (
          <button 
            onClick={onAction}
            className="bg-primary hover:bg-primary/90 text-background-dark px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            <Truck className="w-4 h-4" />
            {actionLabel}
          </button>
        )}
      </div>
    </header>
  );
}
