'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  Truck, 
  Lock, 
  User, 
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { loginAction } from '@/app/actions/auth';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const formData = new FormData(e.currentTarget);
    const result = await loginAction(formData);
    
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      if (result.role === 'OPERATOR') {
        router.push('/routes');
      } else {
        router.push('/');
      }
      router.refresh();
    }
  };

  return (
    <div className="bg-background-dark min-h-screen flex items-center justify-center p-4">
      <div className="flex w-full max-w-[1000px] min-h-[600px] overflow-hidden rounded-2xl bg-surface-dark shadow-2xl border border-border-dark">
        <div className="hidden md:flex flex-1 relative items-center justify-center bg-background-dark overflow-hidden">
          <Image
            src="https://picsum.photos/seed/logistics/1000/1000"
            alt="Logistics Background"
            fill
            className="object-cover opacity-40"
            referrerPolicy="no-referrer"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/60 to-transparent"></div>
          
          <div className="relative z-10 p-12 text-left">
            <div className="mb-6 inline-flex items-center justify-center p-4 rounded-2xl bg-primary/20 backdrop-blur-md border border-primary/30 text-primary">
              <Truck className="w-10 h-10" />
            </div>
            <h1 className="text-white text-4xl font-black leading-tight tracking-tight mb-4">
              Conectando o <br/><span className="text-primary">Rio de Janeiro</span> ao futuro.
            </h1>
            <p className="text-slate-400 text-lg max-w-sm leading-relaxed">
              Eficiência e agilidade no transporte de cargas. Gerencie suas operações com precisão cirúrgica.
            </p>
          </div>
          <div className="absolute bottom-[-50px] left-[-50px] w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
        </div>

        <div className="flex-1 flex flex-col p-8 md:p-16 justify-between bg-surface-dark">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-background-dark shadow-lg shadow-primary/20">
              <Truck className="w-6 h-6" />
            </div>
            <h2 className="text-white text-xl font-bold tracking-tight">Rápido Carioca</h2>
          </div>

          <div className="w-full max-w-sm mx-auto">
            <div className="mb-10">
              <h3 className="text-white text-3xl font-black mb-2 tracking-tight">Acesso ao Sistema</h3>
              <p className="text-slate-500 text-sm font-medium">Insira suas credenciais para gerenciar suas cargas.</p>
            </div>

            <form className="space-y-6" onSubmit={handleLogin}>
              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest ml-1">Usuário</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors w-5 h-5" />
                  <input 
                    required
                    name="username"
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-border-dark bg-background-dark text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-slate-700 text-sm" 
                    placeholder="Digite seu usuário" 
                    type="text"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest ml-1">Senha</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors w-5 h-5" />
                  <input 
                    required
                    name="password"
                    className="w-full pl-12 pr-12 py-4 rounded-xl border border-border-dark bg-background-dark text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-slate-700 text-sm" 
                    placeholder="••••••••" 
                    type={showPassword ? "text" : "password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    className="rounded border-border-dark text-primary focus:ring-primary bg-background-dark w-4 h-4" 
                    type="checkbox"
                  />
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-tight group-hover:text-primary transition-colors">Lembrar de mim</span>
                </label>
                <a className="text-primary text-xs font-bold uppercase tracking-tight hover:underline" href="#">Esqueci minha senha</a>
              </div>

              <button 
                disabled={loading}
                className="w-full py-4 bg-primary hover:bg-primary/90 text-background-dark font-black rounded-xl shadow-xl shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70" 
                type="submit"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-background-dark border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>ENTRAR NO SISTEMA</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-border-dark text-center">
              <p className="text-slate-500 text-xs font-medium">
                Precisa de ajuda? <a className="text-primary font-bold hover:underline" href="#">Falar com suporte</a>
              </p>
            </div>
          </div>

          <div className="text-center md:text-left">
            <p className="text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">
              © 2026 Rápido Carioca - Todos os direitos reservados
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
