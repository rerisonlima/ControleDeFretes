'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen items-center justify-center bg-background-dark text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Erro</h1>
        <p className="text-slate-400 mb-8">Ocorreu um erro inesperado.</p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-primary text-background-dark font-bold rounded-lg"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
