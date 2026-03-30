'use client';

import React from 'react';
import { Bell, Plus } from 'lucide-react';

interface HeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function Header({ title, actionLabel, onAction }: HeaderProps) {
  return (
    <header className="h-16 border-b border-border-dark bg-background-dark/50 backdrop-blur-md px-8 flex items-center justify-between z-10 sticky top-0">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-400 hover:text-primary transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background-dark"></span>
        </button>
        <div className="h-8 w-px bg-border-dark"></div>
        {actionLabel && (
          <button 
            onClick={onAction}
            className="bg-primary hover:bg-primary/90 text-background-dark px-5 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            {actionLabel}
          </button>
        )}
      </div>
    </header>
  );
}
