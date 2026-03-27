'use client';

import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Header } from '@/components/Header';
import { motion } from 'motion/react';
import { 
  Search, 
  Edit2, 
  FileText,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  Power,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getContracts, createContract, updateContract, deleteContract, toggleContractStatus } from '@/app/actions/contracts';

interface Contract {
  id: number;
  ContratanteNome: string;
  active: boolean;
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchContracts = React.useCallback(async () => {
    setLoading(true);
    const result = await getContracts(showInactive);
    if (result.contracts) {
      setContracts(result.contracts);
    }
    setLoading(false);
  }, [showInactive]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedContract(null);
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (contract: Contract) => {
    setModalMode('edit');
    setSelectedContract(contract);
    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedContract(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    
    let result;
    if (modalMode === 'create') {
      result = await createContract(formData);
    } else if (selectedContract) {
      result = await updateContract(selectedContract.id, formData);
    } else {
      setIsSubmitting(false);
      return;
    }

    if (result.error) {
      setError(result.error);
    } else {
      closeModal();
      fetchContracts();
    }
    
    setIsSubmitting(false);
  };

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    const action = currentStatus ? 'desativar' : 'ativar';
    if (window.confirm(`Tem certeza que deseja ${action} este contrato?`)) {
      const result = await toggleContractStatus(id);
      if (result.error) {
        alert(result.error);
      } else {
        fetchContracts();
      }
    }
  };

  const filteredContracts = contracts.filter(contract => 
    contract.ContratanteNome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <Header 
        title="Contratos" 
        actionLabel="Novo Contrato" 
        onAction={handleOpenCreateModal}
      />
      
      <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Search Bar and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input 
                className="w-full pl-12 pr-4 py-3 bg-surface-dark border border-border-dark rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm transition-all text-white placeholder:text-slate-600"
                placeholder="Pesquisar contratante..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowInactive(!showInactive)}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                showInactive 
                  ? "bg-primary text-background-dark" 
                  : "bg-surface-dark border border-border-dark text-slate-300 hover:border-primary"
              )}
            >
              {showInactive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>{showInactive ? 'Exibindo Inativos' : 'Ver Inativos'}</span>
            </button>
          </div>

          {/* Contracts Table / Mobile Cards */}
          <div className="bg-surface-dark rounded-xl border border-border-dark shadow-sm overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-background-dark/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4">ID</th>
                    <th className="px-6 py-4">Nome do Contratante</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-dark">
                  {loading ? (
                    [1, 2, 3].map(i => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={4} className="px-6 py-8 bg-white/5"></td>
                      </tr>
                    ))
                  ) : filteredContracts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-500 text-sm italic">
                        Nenhum contrato encontrado.
                      </td>
                    </tr>
                  ) : filteredContracts.map((contract) => (
                    <tr key={contract.id} className={cn(
                      "hover:bg-white/5 transition-colors group",
                      !contract.active && "opacity-60"
                    )}>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono text-slate-500">#{contract.id}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                            <FileText className="w-4 h-4" />
                          </div>
                          <span className="text-sm font-bold text-white">{contract.ContratanteNome}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                          contract.active 
                            ? "bg-emerald-500/10 text-emerald-500" 
                            : "bg-rose-500/10 text-rose-500"
                        )}>
                          {contract.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleOpenEditModal(contract)}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleToggleStatus(contract.id, contract.active)}
                            className={cn(
                              "p-2 rounded-lg transition-colors",
                              contract.active 
                                ? "text-slate-400 hover:text-rose-500 hover:bg-rose-500/10" 
                                : "text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10"
                            )}
                            title={contract.active ? "Desativar" : "Ativar"}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-border-dark">
              {loading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="p-6 animate-pulse space-y-3">
                    <div className="h-4 bg-white/5 rounded w-1/4"></div>
                    <div className="h-6 bg-white/5 rounded w-3/4"></div>
                  </div>
                ))
              ) : filteredContracts.length === 0 ? (
                <div className="px-6 py-12 text-center text-slate-500 text-sm italic">
                  Nenhum contrato encontrado.
                </div>
              ) : filteredContracts.map((contract) => (
                <div key={contract.id} className={cn(
                  "p-4 space-y-4",
                  !contract.active && "opacity-60"
                )}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-500">#{contract.id}</span>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                      contract.active 
                        ? "bg-emerald-500/10 text-emerald-500" 
                        : "bg-rose-500/10 text-rose-500"
                    )}>
                      {contract.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-base font-bold text-white leading-tight">{contract.ContratanteNome}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button 
                      onClick={() => handleOpenEditModal(contract)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-bold transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </button>
                    <button 
                      onClick={() => handleToggleStatus(contract.id, contract.active)}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors",
                        contract.active 
                          ? "bg-rose-500/10 text-rose-500" 
                          : "bg-emerald-500/10 text-emerald-500"
                      )}
                    >
                      <Power className="w-4 h-4" />
                      {contract.active ? 'Desativar' : 'Ativar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Modal Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-dark border border-border-dark rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-border-dark">
              <h2 className="text-xl font-bold text-white">
                {modalMode === 'create' ? 'Novo Contrato' : 'Editar Contrato'}
              </h2>
              <button 
                onClick={closeModal}
                className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-3 text-rose-400">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-slate-400 text-[10px] font-bold uppercase tracking-widest ml-1">
                  Nome do Contratante
                </label>
                <input 
                  required
                  name="ContratanteNome"
                  defaultValue={selectedContract?.ContratanteNome || ''}
                  className="w-full px-4 py-3 rounded-xl border border-border-dark bg-background-dark text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-slate-700 text-sm" 
                  placeholder="Ex: Empresa XYZ Ltda" 
                  type="text"
                />
              </div>

              {modalMode === 'edit' && (
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    name="active"
                    id="active"
                    defaultChecked={selectedContract?.active}
                    className="w-4 h-4 rounded border-border-dark bg-surface-dark text-primary focus:ring-primary"
                  />
                  <label htmlFor="active" className="text-sm text-slate-300">Contrato Ativo</label>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3 px-4 bg-background-dark hover:bg-white/5 text-white font-bold rounded-xl border border-border-dark transition-colors"
                >
                  Cancelar
                </button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 bg-primary hover:bg-primary/90 text-background-dark font-black rounded-xl shadow-lg shadow-primary/20 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    modalMode === 'create' ? 'Criar Contrato' : 'Salvar Alterações'
                  )}
                </motion.button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
