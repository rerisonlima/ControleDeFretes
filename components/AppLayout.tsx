'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { logoutAction } from '@/app/actions/auth';

interface User {
  name: string;
  role: string;
  lastLogin?: string;
}

const SidebarContext = createContext<{ 
  toggleSidebar: () => void;
  user: User | null;
  isAuthReady: boolean;
  handleLogout: () => Promise<void>;
}>({ 
  toggleSidebar: () => {},
  user: null,
  isAuthReady: false,
  handleLogout: async () => {}
});

export const useSidebar = () => useContext(SidebarContext);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const handleLogout = async () => {
    try {
      await logoutAction();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (error) {
        console.error('AppLayout: Error fetching session:', error);
      } finally {
        setIsAuthReady(true);
      }
    };
    fetchSession();
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  return (
    <SidebarContext.Provider value={{ toggleSidebar, user, isAuthReady, handleLogout }}>
      <div className="flex h-screen overflow-hidden bg-background-dark relative">
        {/* Mobile Backdrop */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1001] lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
        
        <div className={cn(
          "fixed inset-y-0 left-0 z-[1002] lg:relative lg:z-0 transform transition-transform duration-300 lg:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <Sidebar onClose={() => setIsSidebarOpen(false)} />
        </div>

        <main className="flex-1 flex flex-col overflow-hidden w-full">
          {children}
        </main>
      </div>
    </SidebarContext.Provider>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
