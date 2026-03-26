'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ role: string } | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      }
    };
    fetchSession();
  }, []);

  return (
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
        {React.Children.map(children, child => {
          if (React.isValidElement(child) && (child.type as { name?: string }).name === 'Header') {
            return React.cloneElement(child as React.ReactElement<{ onMenuClick?: () => void }>, {
              onMenuClick: () => setIsSidebarOpen(true)
            });
          }
          return child;
        })}
      </main>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
