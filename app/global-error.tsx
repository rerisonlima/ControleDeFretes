'use client';

import React from 'react';
import { AlertCircle, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#181411]">
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#27211b] border border-[#393028] rounded-2xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 mx-auto mb-6">
              <AlertCircle className="w-8 h-8" />
            </div>
            
            <h2 className="text-white text-2xl font-black mb-2 uppercase tracking-tight">Erro Crítico</h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              O sistema encontrou um erro crítico e não pôde continuar.
            </p>

            <button
              onClick={() => window.location.href = '/'}
              className="w-full py-4 bg-[#f48c25] hover:bg-[#f48c25]/90 text-[#181411] font-black rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              REINICIAR SISTEMA
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
