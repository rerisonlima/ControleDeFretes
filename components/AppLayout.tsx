'use client';

import React, { createContext, useContext, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';

const SidebarContext = createContext<{ toggleSidebar: () => void }>({ toggleSidebar: () => {} });

export const useSidebar = () => useContext(SidebarContext);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  return (
    <SidebarContext.Provider value={{ toggleSidebar }}>
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
