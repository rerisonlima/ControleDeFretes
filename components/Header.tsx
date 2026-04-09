'use client';

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Plus, LogOut, LucideIcon, Menu, Loader2 } from 'lucide-react';
import { useLayout } from './AppLayout';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  onLogout?: () => void;
}

export function Header({ title, icon: Icon, actionLabel, onAction, onLogout }: HeaderProps) {
  const { toggleSidebar } = useLayout();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/settings/notifications')
      .then(res => res.json())
      .then(data => setNotificationsEnabled(data.enabled))
      .catch(err => console.error('Failed to fetch notification settings:', err));
  }, []);

  const toggleNotifications = async () => {
    setLoading(true);
    const newState = !notificationsEnabled;
    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newState })
      });
      if (res.ok) {
        setNotificationsEnabled(newState);
      }
    } catch (error) {
      console.error('Failed to toggle notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="h-16 border-b border-border-dark bg-background-dark/50 backdrop-blur-md px-4 md:px-8 flex items-center justify-between z-10 sticky top-0">
      <div className="flex items-center gap-2 md:gap-3">
        <button 
          onClick={toggleSidebar}
          className="p-2 -ml-2 text-slate-400 hover:text-primary transition-colors lg:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
        {Icon && <Icon className="w-5 h-5 text-primary hidden sm:block" />}
        <h2 className="text-base md:text-lg font-bold text-white tracking-tight truncate max-w-[150px] sm:max-w-none">{title}</h2>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        <button 
          onClick={toggleNotifications}
          disabled={loading}
          className={cn(
            "p-2 transition-all relative hidden sm:block rounded-lg",
            notificationsEnabled 
              ? "text-blue-500 hover:bg-blue-500/10" 
              : "text-slate-500 hover:bg-slate-500/10"
          )}
          title={notificationsEnabled ? "Desativar notificações" : "Ativar notificações"}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : notificationsEnabled ? (
            <>
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-background-dark animate-pulse"></span>
            </>
          ) : (
            <BellOff className="w-5 h-5" />
          )}
        </button>
        <div className="h-8 w-px bg-border-dark hidden sm:block"></div>
        {onLogout && (
          <button 
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
        {actionLabel && (
          <button 
            onClick={onAction}
            className="bg-primary hover:bg-primary/90 text-background-dark px-3 md:px-5 py-2 rounded-lg text-xs md:text-sm font-bold transition-all flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">{actionLabel}</span>
            <span className="xs:hidden">Novo</span>
          </button>
        )}
      </div>
    </header>
  );
}
