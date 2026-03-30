'use client';

import React from 'react';
import AppLayout from '@/components/AppLayout';
import { Header } from '@/components/Header';
import { 
  Search, 
  MapPin, 
  Edit, 
  Trash2, 
  X,
  Check,
  Calendar,
  Truck,
  Building2,
  DollarSign,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isAfter, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Contratante {
  id: number;
  ContratanteNome: string;
}

interface Categoria {
  id: number;
  CategoriaNome: string;
}

interface Frete {
  id: number;
  cidade: string;
  contratanteId: number;
  categoriaId: number;
  valorFrete: number;
  valor1aViagemMotorista: number;
  valor2aViagemMotorista: number;
  valor1aViagemAjudante: number;
  valor2aViagemAjudante: number;
  validade: string;
  contratante: Contratante;
  categoria: Categoria;
}

export default function TablesPage() {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [fretes, setFretes] = React.useState<Frete[]>([]);
  const [contratantes, setContratantes] = React.useState<Contratante[]>([]);
  const [categorias, setCategorias] = React.useState<Categoria[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedFrete, setSelectedFrete] = React.useState<Frete | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = React.useState('');
  const [validityFilter, setValidityFilter] = React.useState<'valid' | 'expired' | 'all'>('valid');
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<number | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  // Form state
  const [formData, setFormData] = React.useState({
    contratanteId: '',
    cidade: '',
    categoriaId: '',
    valorFrete: '',
    valor1aViagemMotorista: '',
    valor2aViagemMotorista: '',
    valor1aViagemAjudante: '',
    valor2aViagemAjudante: '',
    validade: ''
  });

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      const fetchJson = async (url: string, name: string) => {
        const res = await fetch(url);
        if (!res.ok) {
          const errorText = await res.text();
          console.error(`${name} API error:`, errorText);
          return [];
        }
        return res.json();
      };

      const [fretesData, contratantesData, categoriasData] = await Promise.all([
        fetchJson('/api/fretes', 'Fretes'),
        fetchJson('/api/contratantes', 'Contratantes'),
        fetchJson('/api/categorias', 'Categorias')
      ]);

      setFretes(fretesData);
      setContratantes(contratantesData);
      setCategorias(categoriasData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenDrawer = (frete: Frete | null = null) => {
    if (frete) {
      setSelectedFrete(frete);
      setFormData({
        contratanteId: frete.contratanteId.toString(),
        cidade: frete.cidade,
        categoriaId: frete.categoriaId.toString(),
        valorFrete: frete.valorFrete.toString(),
        valor1aViagemMotorista: frete.valor1aViagemMotorista.toString(),
        valor2aViagemMotorista: frete.valor2aViagemMotorista.toString(),
        valor1aViagemAjudante: frete.valor1aViagemAjudante.toString(),
        valor2aViagemAjudante: frete.valor2aViagemAjudante.toString(),
        validade: frete.validade ? format(new Date(frete.validade), 'yyyy-MM-dd') : ''
      });
    } else {
      setSelectedFrete(null);
      setFormData({
        contratanteId: '',
        cidade: '',
        categoriaId: '',
        valorFrete: '',
        valor1aViagemMotorista: '',
        valor2aViagemMotorista: '',
        valor1aViagemAjudante: '',
        valor2aViagemAjudante: '',
        validade: format(new Date(), 'yyyy-MM-dd')
      });
    }
    setIsDrawerOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const url = selectedFrete ? `/api/fretes/${selectedFrete.id}` : '/api/fretes';
      const method = selectedFrete ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setIsDrawerOpen(false);
        fetchData();
      } else {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const error = await response.json();
          alert(error.error || 'Erro ao salvar frete');
        } else {
          const text = await response.text();
          console.error('Non-JSON error response:', text);
          alert('Erro no servidor ao salvar frete');
        }
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Erro de conexão ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/fretes/${id}`, { method: 'DELETE' });
      
      if (response.ok) {
        setDeleteConfirmId(null);
        fetchData();
      } else {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const data = await response.json();
          alert(data.error || 'Erro ao excluir frete');
        } else {
          const text = await response.text();
          console.error('Non-JSON error response:', text);
          alert('Erro no servidor ao excluir frete');
        }
        setDeleteConfirmId(null);
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Erro de conexão ao excluir');
      setDeleteConfirmId(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Filter and Group Data
  const today = startOfDay(new Date());

  const filteredFretes = fretes.filter(frete => {
    const matchesSearch = frete.cidade.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         frete.contratante?.ContratanteNome.toLowerCase().includes(searchTerm.toLowerCase());
    
    const validadeDate = startOfDay(new Date(frete.validade));
    let matchesValidity = true;
    
    if (validityFilter === 'valid') {
      matchesValidity = isAfter(validadeDate, today) || validadeDate.getTime() === today.getTime();
    } else if (validityFilter === 'expired') {
      matchesValidity = isBefore(validadeDate, today);
    }

    return matchesSearch && matchesValidity;
  });

  // Group by Categoria, then sort by Contratante within each group
  const groupedFretes = filteredFretes.reduce((acc: Record<string, Frete[]>, frete) => {
    const categoriaNome = frete.categoria?.CategoriaNome || 'Sem Categoria';
    if (!acc[categoriaNome]) {
      acc[categoriaNome] = [];
    }
    acc[categoriaNome].push(frete);
    return acc;
  }, {});

  // Sort each group by Contratante
  Object.keys(groupedFretes).forEach(categoria => {
    groupedFretes[categoria].sort((a, b) => {
      const nomeA = a.contratante?.ContratanteNome || '';
      const nomeB = b.contratante?.ContratanteNome || '';
      return nomeA.localeCompare(nomeB);
    });
  });

  return (
    <AppLayout>
      <Header 
        title="Tabelas de Frete" 
        actionLabel="Novo Frete" 
        onAction={() => handleOpenDrawer()}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-8 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black tracking-tight">Tabelas de Frete</h2>
              <p className="text-slate-500 mt-1">Gerencie os valores de frete por contratante, cidade e categoria.</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input 
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none" 
                placeholder="Buscar por cidade ou contratante..." 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-64 relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <select 
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none appearance-none"
                value={validityFilter}
                onChange={(e) => setValidityFilter(e.target.value as 'valid' | 'expired' | 'all')}
              >
                <option value="valid">Vigentes (Validade &gt; Hoje)</option>
                <option value="expired">Vencidos (Validade &lt; Hoje)</option>
                <option value="all">Todos os Registros</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="flex-1 overflow-auto px-8 pb-8 custom-scrollbar">
          {loading ? (
            <div className="text-center py-12 text-slate-500">Carregando tabelas...</div>
          ) : Object.keys(groupedFretes).length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-surface-dark rounded-xl border border-border-dark">
              Nenhum registro encontrado com os filtros aplicados.
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedFretes).map(([categoria, fretesList]) => (
                <div key={categoria} className="border border-border-dark rounded-xl bg-surface-dark overflow-hidden shadow-sm">
                  <div className="bg-primary/10 px-6 py-4 border-b border-border-dark flex items-center gap-3">
                    <Truck className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-bold text-white tracking-tight">{categoria}</h3>
                    <span className="ml-auto bg-primary/20 text-primary text-xs font-bold px-2 py-1 rounded-md">
                      {fretesList.length} registros
                    </span>
                  </div>
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-background-dark/50 border-b border-border-dark">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Contratante</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Cidade</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Validade</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Valor Frete</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-dark">
                      {fretesList.map((frete) => (
                        <tr 
                          key={frete.id} 
                          className="hover:bg-white/5 transition-colors group cursor-pointer"
                          onClick={() => handleOpenDrawer(frete)}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Building2 className="w-4 h-4 text-slate-500" />
                              <span className="font-semibold text-white">{frete.contratante?.ContratanteNome || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <MapPin className="w-4 h-4 text-primary" />
                              <span className="text-slate-300">{frete.cidade}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "text-sm font-mono px-2 py-1 rounded-md",
                              isBefore(startOfDay(new Date(frete.validade)), today) 
                                ? "bg-rose-500/10 text-rose-500" 
                                : "bg-emerald-500/10 text-emerald-500"
                            )}>
                              {formatDate(frete.validade)}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono font-medium text-slate-300">
                            {formatCurrency(frete.valorFrete)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {deleteConfirmId === frete.id ? (
                                <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                                  <button 
                                    onClick={() => handleDelete(frete.id)}
                                    className="px-3 py-1 bg-rose-500 text-white text-[10px] font-bold rounded hover:bg-rose-600 transition-colors"
                                  >
                                    Confirmar
                                  </button>
                                  <button 
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="px-3 py-1 bg-slate-700 text-slate-300 text-[10px] font-bold rounded hover:bg-slate-600 transition-colors"
                                  >
                                    Sair
                                  </button>
                                </div>
                              ) : (
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleOpenDrawer(frete); }}
                                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(frete.id); }}
                                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Side Panel (Drawer) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
          <aside className="w-full max-w-[450px] bg-background-dark h-full shadow-2xl border-l border-border-dark flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-border-dark flex items-center justify-between bg-primary/5">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedFrete ? 'Editar Frete' : 'Novo Frete'}</h3>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Configuração de Tabela</p>
              </div>
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <div className="space-y-6">
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Contratante</label>
                  <select 
                    className="w-full px-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none"
                    value={formData.contratanteId}
                    onChange={(e) => setFormData({...formData, contratanteId: e.target.value})}
                  >
                    <option value="">Selecionar Contratante</option>
                    {contratantes.map(c => (
                      <option key={c.id} value={c.id}>{c.ContratanteNome}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Categoria do Veículo</label>
                  <select 
                    className="w-full px-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none"
                    value={formData.categoriaId}
                    onChange={(e) => setFormData({...formData, categoriaId: e.target.value})}
                  >
                    <option value="">Selecionar Categoria</option>
                    {categorias.map(c => (
                      <option key={c.id} value={c.id}>{c.CategoriaNome}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Cidade (Destino)</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input 
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none" 
                      value={formData.cidade}
                      onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                      placeholder="Ex: São Paulo - SP"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Data de Validade</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input 
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none" 
                      type="date"
                      value={formData.validade}
                      onChange={(e) => setFormData({...formData, validade: e.target.value})}
                    />
                  </div>
                </div>

                <hr className="border-border-dark" />

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    <h4 className="font-bold text-[10px] uppercase tracking-widest text-emerald-500">Valores</h4>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-primary uppercase tracking-widest block">Valor Total do Frete</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-primary/50">R$</span>
                      <input 
                        className="w-full pl-12 pr-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm font-bold text-white outline-none" 
                        placeholder="0,00" 
                        type="number"
                        step="0.01"
                        value={formData.valorFrete}
                        onChange={(e) => setFormData({...formData, valorFrete: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">1ª Viagem Motorista</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">R$</span>
                        <input 
                          className="w-full pl-12 pr-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none" 
                          placeholder="0,00" 
                          type="number"
                          step="0.01"
                          value={formData.valor1aViagemMotorista}
                          onChange={(e) => setFormData({...formData, valor1aViagemMotorista: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">2ª Viagem Motorista</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">R$</span>
                        <input 
                          className="w-full pl-12 pr-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none" 
                          placeholder="0,00" 
                          type="number"
                          step="0.01"
                          value={formData.valor2aViagemMotorista}
                          onChange={(e) => setFormData({...formData, valor2aViagemMotorista: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">1ª Viagem Ajudante</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">R$</span>
                        <input 
                          className="w-full pl-12 pr-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none" 
                          placeholder="0,00" 
                          type="number"
                          step="0.01"
                          value={formData.valor1aViagemAjudante}
                          onChange={(e) => setFormData({...formData, valor1aViagemAjudante: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">2ª Viagem Ajudante</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">R$</span>
                        <input 
                          className="w-full pl-12 pr-4 py-3 rounded-lg border border-border-dark bg-surface-dark focus:ring-primary focus:border-primary text-sm text-white outline-none" 
                          placeholder="0,00" 
                          type="number"
                          step="0.01"
                          value={formData.valor2aViagemAjudante}
                          onChange={(e) => setFormData({...formData, valor2aViagemAjudante: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-border-dark bg-background-dark/50 flex items-center gap-4">
              <button 
                onClick={() => setIsDrawerOpen(false)}
                className="px-6 py-3 rounded-lg border border-border-dark text-slate-400 font-bold hover:bg-surface-dark hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 bg-primary hover:bg-primary/90 text-background-dark py-3 rounded-lg font-bold transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {isSaving ? 'Salvando...' : selectedFrete ? 'Atualizar Frete' : 'Salvar Frete'}
              </button>
            </div>
          </aside>
        </div>
      )}

    </AppLayout>
  );
}
