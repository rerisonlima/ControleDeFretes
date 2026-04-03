'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Header } from '@/components/Header';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2, 
  AlertCircle,
  Table,
  Truck,
  DollarSign,
  MapPin,
  Calendar,
  X,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'fretes' | 'categorias';

interface Category {
  id: number;
  CategoriaNome: string;
}

interface Contratante {
  id: number;
  ContratanteNome: string;
}

interface Frete {
  id: number;
  cidade: string;
  contratanteId: number;
  contratante: Contratante;
  categoriaId: number;
  categoria: Category;
  valorFrete: number;
  valor1aViagemMotorista: number;
  valor2aViagemMotorista: number;
  valor1aViagemAjudante: number;
  valor2aViagemAjudante: number;
  validade: string;
}

export default function TablesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('fretes');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [errorId, setErrorId] = useState<number | null>(null);
  const [errorType, setErrorType] = useState<Tab | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const errorRef = React.useRef<HTMLDivElement>(null);

  // Data states
  const [fretes, setFretes] = useState<Frete[]>([]);
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [contratantes, setContratantes] = useState<Contratante[]>([]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [fRes, cRes, ctRes] = await Promise.all([
        fetch('/api/fretes'),
        fetch('/api/categorias'),
        fetch('/api/contratantes')
      ]);

      if (fRes.ok) setFretes(await fRes.json());
      if (cRes.ok) setCategorias(await cRes.json());
      if (ctRes.ok) setContratantes(await ctRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Erro ao carregar dados das tabelas.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (mode: 'create' | 'edit', item?: any) => {
    setModalMode(mode);
    setSelectedItem(item || null);
    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
    setError('');
  };

  const handleDelete = async (id: number, type: Tab) => {
    setError('');
    setErrorId(null);
    setErrorType(null);
    setIsDeleting(true);
    try {
      const endpoint = type === 'fretes' ? `/api/fretes/${id}` : 
                       type === 'categorias' ? `/api/categorias/${id}` : 
                       `/api/valores-pagamento/${id}`;
      
      const res = await fetch(endpoint, { method: 'DELETE' });
      
      let data;
      try {
        data = await res.json();
      } catch (e) {
        data = { error: 'Erro ao processar resposta do servidor.' };
      }

      if (res.ok) {
        setDeleteConfirmId(null);
        fetchData();
      } else {
        console.error('Delete error:', data.error);
        const errorMessage = data.error || 'Erro ao excluir item.';
        setError(errorMessage);
        setErrorId(id);
        setErrorType(type);
        setDeleteConfirmId(null);
        // Scroll to error after a short delay to ensure it's rendered
        setTimeout(() => {
          const element = document.getElementById(`error-${type}-${id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      setError('Erro de conexão ao excluir item.');
      setDeleteConfirmId(id); // Keep it open or show error
      setTimeout(() => {
        errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const data: any = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });

    try {
      let endpoint = '';
      if (activeTab === 'fretes') endpoint = '/api/fretes';
      else if (activeTab === 'categorias') endpoint = '/api/categorias';

      if (modalMode === 'edit' && selectedItem) {
        endpoint += `/${selectedItem.id}`;
      }

      const res = await fetch(endpoint, {
        method: modalMode === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        closeModal();
        fetchData();
      } else {
        const errData = await res.json();
        setError(errData.error || 'Erro ao salvar dados.');
      }
    } catch (error) {
      console.error('Error saving data:', error);
      setError('Erro de conexão ao salvar dados.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredData = () => {
    if (activeTab === 'fretes') {
      return fretes.filter(f => 
        f.cidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.contratante.ContratanteNome.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (activeTab === 'categorias') {
      return categorias.filter(c => c.CategoriaNome.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return [];
  };

  return (
    <AppLayout>
      <Header 
        title="Tabelas do Sistema" 
        actionLabel={activeTab === 'fretes' ? 'Novo Frete' : 'Nova Categoria'} 
        onAction={() => handleOpenModal('create')}
      />

      <div className="flex-1 overflow-auto p-4 md:p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {error && !isModalOpen && (
            <div 
              ref={errorRef}
              className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between gap-3 text-rose-400 animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
              <button onClick={() => setError('')} className="p-1 hover:bg-rose-500/10 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex p-1 bg-surface-dark border border-border-dark rounded-xl w-full sm:w-fit overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setActiveTab('fretes')}
              className={cn(
                "flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap",
                activeTab === 'fretes' ? "bg-primary text-background-dark shadow-lg" : "text-slate-400 hover:text-white"
              )}
            >
              <MapPin className="w-4 h-4" />
              <span>Fretes</span>
            </button>
            <button 
              onClick={() => setActiveTab('categorias')}
              className={cn(
                "flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap",
                activeTab === 'categorias' ? "bg-primary text-background-dark shadow-lg" : "text-slate-400 hover:text-white"
              )}
            >
              <Truck className="w-4 h-4" />
              <span>Categorias</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
            <input 
              className="w-full pl-12 pr-4 py-3 bg-surface-dark border border-border-dark rounded-xl focus:ring-2 focus:ring-primary outline-none text-sm text-white placeholder:text-slate-600"
              placeholder={`Pesquisar em ${activeTab === 'fretes' ? 'fretes' : 'categorias'}...`}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Table / Mobile Cards */}
          <div className="bg-surface-dark rounded-xl border border-border-dark overflow-hidden shadow-sm">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-background-dark/50">
                    {activeTab === 'fretes' && (
                      <>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-border-dark">Cidade</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-border-dark">Contratante</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-border-dark">Categoria</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-border-dark">Valor Frete</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-border-dark">Validade</th>
                      </>
                    )}
                    {activeTab === 'categorias' && (
                      <>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-border-dark">ID</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-border-dark">Nome da Categoria</th>
                      </>
                    )}
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b border-border-dark text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dark">
                  {isLoading ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-8 h-8 text-primary animate-spin" />
                          <p className="text-sm text-slate-500">Carregando dados...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredData().length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-slate-500 text-sm italic">
                        Nenhum registro encontrado.
                      </td>
                    </tr>
                  ) : filteredData().map((item: any) => (
                    <React.Fragment key={item.id}>
                      <tr className="hover:bg-white/5 transition-colors group">
                        {activeTab === 'fretes' && (
                          <>
                            <td className="px-6 py-4 text-sm font-bold text-white">{item.cidade}</td>
                            <td className="px-6 py-4 text-sm text-slate-300">{item.contratante.ContratanteNome}</td>
                            <td className="px-6 py-4 text-sm text-slate-400">{item.categoria.CategoriaNome}</td>
                            <td className="px-6 py-4 text-sm font-black text-primary">R$ {item.valorFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="px-6 py-4 text-xs text-slate-500">{new Date(item.validade).toLocaleDateString('pt-BR')}</td>
                          </>
                        )}
                        {activeTab === 'categorias' && (
                          <>
                            <td className="px-6 py-4 text-xs font-mono text-slate-500">#{item.id}</td>
                            <td className="px-6 py-4 text-sm font-bold text-white">{item.CategoriaNome}</td>
                          </>
                        )}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            {deleteConfirmId === item.id ? (
                              <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                                <button 
                                  onClick={() => handleDelete(item.id, activeTab)}
                                  disabled={isDeleting}
                                  className="px-3 py-1 bg-rose-500 text-white text-[10px] font-bold rounded hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                  {isDeleting ? (
                                    <>
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      Excluindo...
                                    </>
                                  ) : (
                                    'Confirmar'
                                  )}
                                </button>
                                <button 
                                  onClick={() => {
                                    setDeleteConfirmId(null);
                                    setErrorId(null);
                                    setErrorType(null);
                                  }}
                                  disabled={isDeleting}
                                  className="px-3 py-1 bg-slate-700 text-slate-300 text-[10px] font-bold rounded hover:bg-slate-600 transition-colors disabled:opacity-50"
                                >
                                  Sair
                                </button>
                              </div>
                            ) : (
                              <>
                                <button 
                                  onClick={() => handleOpenModal('edit', item)}
                                  className="p-2 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => {
                                    setDeleteConfirmId(item.id);
                                    setErrorId(null);
                                    setErrorType(null);
                                  }}
                                  className="p-2 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                      {errorId === item.id && errorType === activeTab && (
                        <tr id={`error-${activeTab}-${item.id}`} className="bg-rose-500/5 animate-in slide-in-from-top-1 duration-200">
                          <td colSpan={10} className="px-6 py-3">
                            <div className="flex items-center gap-2 text-rose-400 text-xs font-medium">
                              <AlertCircle className="w-4 h-4" />
                              <span>{error}</span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-border-dark">
              {isLoading ? (
                <div className="px-6 py-12 text-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                  <p className="text-sm text-slate-500 mt-2">Carregando dados...</p>
                </div>
              ) : filteredData().length === 0 ? (
                <div className="px-6 py-12 text-center text-slate-500 text-sm italic">
                  Nenhum registro encontrado.
                </div>
              ) : filteredData().map((item: any) => (
                <div key={item.id} className="space-y-0">
                  <div className="p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        {activeTab === 'fretes' && (
                          <>
                            <h4 className="text-sm font-bold text-white">{item.cidade}</h4>
                            <p className="text-xs text-slate-400">{item.contratante.ContratanteNome} • {item.categoria.CategoriaNome}</p>
                            <p className="text-sm font-black text-primary mt-1">R$ {item.valorFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </>
                        )}
                        {activeTab === 'categorias' && (
                          <>
                            <h4 className="text-sm font-bold text-white">{item.CategoriaNome}</h4>
                            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">ID: #{item.id}</p>
                          </>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {deleteConfirmId === item.id ? (
                          <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                            <button 
                              onClick={() => handleDelete(item.id, activeTab)}
                              disabled={isDeleting}
                              className="px-3 py-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-lg shadow-lg shadow-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              {isDeleting ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Excluindo...
                                </>
                              ) : (
                                'Confirmar'
                              )}
                            </button>
                            <button 
                              onClick={() => {
                                setDeleteConfirmId(null);
                                setErrorId(null);
                                setErrorType(null);
                              }}
                              disabled={isDeleting}
                              className="px-3 py-1.5 bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg disabled:opacity-50"
                            >
                              Sair
                            </button>
                          </div>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleOpenModal('edit', item)}
                              className="p-2 text-primary bg-primary/10 rounded-lg"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                setDeleteConfirmId(item.id);
                                setErrorId(null);
                                setErrorType(null);
                              }}
                              className="p-2 text-rose-500 bg-rose-500/10 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {item.validade && (
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        <Calendar className="w-3 h-3" />
                        <span>Validade: {new Date(item.validade).toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                  </div>
                  {errorId === item.id && errorType === activeTab && (
                    <div id={`error-${activeTab}-${item.id}`} className="px-4 pb-4 animate-in slide-in-from-top-1 duration-200">
                      <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-2 text-rose-400 text-xs font-medium">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{error}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-dark border border-border-dark rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-border-dark">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Table className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {modalMode === 'create' ? 'Novo Registro' : 'Editar Registro'}
                  </h2>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
                    Tabela: {activeTab === 'fretes' ? 'Fretes' : 'Categorias'}
                  </p>
                </div>
              </div>
              <button onClick={closeModal} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {error && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              {activeTab === 'fretes' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Cidade</label>
                    <input required name="cidade" defaultValue={selectedItem?.cidade} className="w-full px-4 py-3 bg-background-dark border border-border-dark rounded-xl text-white outline-none focus:ring-2 focus:ring-primary" placeholder="Ex: Rio de Janeiro" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Contratante</label>
                    <select required name="contratanteId" defaultValue={selectedItem?.contratanteId} className="w-full px-4 py-3 bg-background-dark border border-border-dark rounded-xl text-white outline-none focus:ring-2 focus:ring-primary appearance-none">
                      <option value="">Selecione...</option>
                      {contratantes.map(c => <option key={c.id} value={c.id}>{c.ContratanteNome}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Categoria</label>
                    <select required name="categoriaId" defaultValue={selectedItem?.categoriaId} className="w-full px-4 py-3 bg-background-dark border border-border-dark rounded-xl text-white outline-none focus:ring-2 focus:ring-primary appearance-none">
                      <option value="">Selecione...</option>
                      {categorias.map(c => <option key={c.id} value={c.id}>{c.CategoriaNome}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Valor do Frete</label>
                    <input required type="number" step="0.01" name="valorFrete" defaultValue={selectedItem?.valorFrete || ''} className="w-full px-4 py-3 bg-background-dark border border-border-dark rounded-xl text-white outline-none focus:ring-2 focus:ring-primary" placeholder="0.00" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Validade</label>
                    <input required type="date" name="validade" defaultValue={selectedItem?.validade ? new Date(selectedItem.validade).toISOString().split('T')[0] : ''} className="w-full px-4 py-3 bg-background-dark border border-border-dark rounded-xl text-white outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest ml-1">Motorista 1ª Viagem</label>
                      <input required type="number" step="0.01" name="valor1aViagemMotorista" defaultValue={selectedItem?.valor1aViagemMotorista || ''} className="w-full px-4 py-2 bg-background-dark border border-border-dark rounded-lg text-white outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest ml-1">Motorista 2ª Viagem</label>
                      <input required type="number" step="0.01" name="valor2aViagemMotorista" defaultValue={selectedItem?.valor2aViagemMotorista || ''} className="w-full px-4 py-2 bg-background-dark border border-border-dark rounded-lg text-white outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-1">Ajudante 1ª Viagem</label>
                      <input required type="number" step="0.01" name="valor1aViagemAjudante" defaultValue={selectedItem?.valor1aViagemAjudante || ''} className="w-full px-4 py-2 bg-background-dark border border-border-dark rounded-lg text-white outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-1">Ajudante 2ª Viagem</label>
                      <input required type="number" step="0.01" name="valor2aViagemAjudante" defaultValue={selectedItem?.valor2aViagemAjudante || ''} className="w-full px-4 py-2 bg-background-dark border border-border-dark rounded-lg text-white outline-none focus:ring-2 focus:ring-primary" />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'categorias' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nome da Categoria</label>
                    <input required name="CategoriaNome" defaultValue={selectedItem?.CategoriaNome} className="w-full px-4 py-3 bg-background-dark border border-border-dark rounded-xl text-white outline-none focus:ring-2 focus:ring-primary" placeholder="Ex: Truck, Toco, HR..." />
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 py-3 px-4 bg-background-dark hover:bg-white/5 text-white font-bold rounded-xl border border-border-dark transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving} className="flex-1 py-3 px-4 bg-primary hover:bg-primary/90 text-background-dark font-black rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-70 flex items-center justify-center gap-2">
                  {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  <span>{isSaving ? 'Salvando...' : modalMode === 'create' ? 'Criar Registro' : 'Salvar Alterações'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
