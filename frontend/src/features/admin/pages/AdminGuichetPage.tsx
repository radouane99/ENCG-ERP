import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FileText, CheckCircle2, XCircle, Clock, 
  Search, Filter, FileSignature, AlertTriangle, User 
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { Spinner } from '@shared/components/ui/Spinner';
import { toast } from 'sonner';
import { cn } from '@shared/lib/utils';

export default function AdminGuichetPage() {
  const { t } = useTranslation(['admin', 'common']);
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-document-requests', filter, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (search) params.append('search', search);
      const res = await api.get(`/admin/document-requests?${params.toString()}`);
      return res.data;
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: number, status: string, reason?: string }) => {
      const res = await api.put(`/admin/document-requests/${id}/status`, { status, rejection_reason: reason });
      return res.data;
    },
    onSuccess: (data, variables) => {
      toast.success(variables.status === 'approved' ? 'Demande approuvée et document généré !' : 'Demande rejetée.');
      setRejectingId(null);
      setRejectionReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-document-requests'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour.');
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'ready':
        return <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100 flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3"/> TRAITÉE</span>;
      case 'rejected':
        return <span className="bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-xs font-bold border border-rose-100 flex items-center gap-1 w-fit"><XCircle className="w-3 h-3"/> REJETÉE</span>;
      default:
        return <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-100 flex items-center gap-1 w-fit"><Clock className="w-3 h-3"/> EN ATTENTE</span>;
    }
  };

  const requests = data?.data || [];
  const stats = data?.stats || { pending: 0, approved: 0, rejected: 0 };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 font-sans animate-in fade-in zoom-in duration-500 pb-24">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-100">
            <FileSignature className="w-8 h-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#001A4B]">Guichet Électronique Admin</h1>
            <p className="text-sm font-medium text-slate-500">Validation et génération des documents officiels (QR Code).</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">En attente</p>
            <p className="text-3xl font-black text-[#001A4B]">{stats.pending}</p>
          </div>
          <Clock className="w-10 h-10 text-amber-100" />
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">Traitées</p>
            <p className="text-3xl font-black text-[#001A4B]">{stats.approved}</p>
          </div>
          <CheckCircle2 className="w-10 h-10 text-emerald-100" />
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-rose-500 uppercase tracking-widest mb-1">Rejetées</p>
            <p className="text-3xl font-black text-[#001A4B]">{stats.rejected}</p>
          </div>
          <XCircle className="w-10 h-10 text-rose-100" />
        </div>
      </div>

      {/* Filters & Table */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 min-h-[500px]">
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div className="flex gap-2 bg-slate-50 p-1 rounded-xl w-fit border border-slate-100">
            <button onClick={() => setFilter('all')} className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", filter === 'all' ? "bg-white shadow-sm text-indigo-700" : "text-slate-500 hover:text-slate-700")}>Toutes</button>
            <button onClick={() => setFilter('pending')} className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", filter === 'pending' ? "bg-white shadow-sm text-indigo-700" : "text-slate-500 hover:text-slate-700")}>En attente</button>
            <button onClick={() => setFilter('approved')} className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", filter === 'approved' ? "bg-white shadow-sm text-indigo-700" : "text-slate-500 hover:text-slate-700")}>Approuvées</button>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Spinner className="w-8 h-8 text-indigo-600" /></div>
        ) : isError ? (
          <div className="text-center py-10 text-rose-500"><AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-50"/>Erreur de chargement.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="pb-4 pl-4">Étudiant</th>
                  <th className="pb-4">Document Demandé</th>
                  <th className="pb-4">Date</th>
                  <th className="pb-4">Statut</th>
                  <th className="pb-4 text-right pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {requests.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center font-medium text-slate-400">Aucune demande trouvée.</td>
                  </tr>
                )}
                {requests.map((req: any) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 pl-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-[#001A4B]">{req.person}</div>
                          <div className="text-xs font-medium text-slate-400">{req.reference_number || req.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="font-bold text-[#001A4B] text-sm">{req.type}</div>
                      {req.motif && <div className="text-xs text-slate-500 italic truncate max-w-xs" title={req.motif}>"{req.motif}"</div>}
                    </td>
                    <td className="py-4 text-sm font-medium text-slate-500">
                      {req.time}
                    </td>
                    <td className="py-4">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="py-4 text-right pr-4">
                      {req.status === 'pending' ? (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => updateStatusMutation.mutate({ id: req.id, status: 'approved' })}
                            disabled={updateStatusMutation.isPending}
                            className="bg-emerald-500 text-white p-2 rounded-lg hover:bg-emerald-600 transition-colors shadow-sm disabled:opacity-50"
                            title="Approuver & Générer PDF"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setRejectingId(req.id)}
                            disabled={updateStatusMutation.isPending}
                            className="bg-white border border-rose-200 text-rose-500 p-2 rounded-lg hover:bg-rose-50 transition-colors shadow-sm disabled:opacity-50"
                            title="Rejeter"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        req.url ? (
                          <a href={req.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline">Voir Document</a>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-[#001A4B] mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" /> Rejeter la demande
            </h3>
            <textarea 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-rose-500 min-h-[100px] mb-4"
              placeholder="Motif du rejet (obligatoire pour informer l'étudiant)..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <button 
                onClick={() => { setRejectingId(null); setRejectionReason(''); }}
                className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={() => updateStatusMutation.mutate({ id: rejectingId, status: 'rejected', reason: rejectionReason })}
                disabled={!rejectionReason.trim() || updateStatusMutation.isPending}
                className="bg-rose-500 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-rose-600 transition-colors disabled:opacity-50"
              >
                {updateStatusMutation.isPending ? <Spinner className="w-4 h-4 text-white" /> : 'Confirmer Rejet'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
