'use client';

import React, { useEffect, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ role: string } | null>(null);

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

  const isOperator = user?.role === 'OPERATOR';

  return (
    <div className="flex h-screen overflow-hidden bg-background-dark">
      {!isOperator && <Sidebar />}
      <main className={cn("flex-1 flex flex-col overflow-hidden", isOperator ? "w-full" : "")}>
        {children}
      </main>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
