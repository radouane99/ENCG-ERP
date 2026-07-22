import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  FileText, Plus, Clock, CheckCircle2, XCircle, 
  Download, FileSignature, Send, AlertTriangle 
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { Spinner } from '@shared/components/ui/Spinner';
import { toast } from 'sonner';

export default function StudentGuichetPage() {
  const { t } = useTranslation(['students', 'common']);
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRequestData, setNewRequestData] = useState({ type: 'Attestation de Scolarité', motif: '' });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['student-document-requests'],
    queryFn: async () => {
      const res = await api.get('/student-portal/document-requests');
      return res.data;
    }
  });

  const requestMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/student-portal/document-requests', data);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Demande envoyée avec succès.');
      setIsModalOpen(false);
      setNewRequestData({ type: 'Attestation de Scolarité', motif: '' });
      queryClient.invalidateQueries({ queryKey: ['student-document-requests'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la demande.');
    }
  });

  const handleDownload = async (id: number) => {
    const tid = toast.loading('Téléchargement du document...');
    try {
      const res = await api.get(`/student-portal/document-requests/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Document_Officiel_${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Téléchargement terminé.', { id: tid });
    } catch (error) {
      toast.error('Erreur lors du téléchargement du document.', { id: tid });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'ready':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-rose-500" />;
      default:
        return <Clock className="w-5 h-5 text-amber-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'ready':
        return <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> TRAITÉE</span>;
      case 'rejected':
        return <span className="bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-xs font-bold border border-rose-100 flex items-center gap-1"><XCircle className="w-3 h-3"/> REJETÉE</span>;
      default:
        return <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold border border-amber-100 flex items-center gap-1"><Clock className="w-3 h-3"/> EN COURS</span>;
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in zoom-in duration-500 pb-24">
      
      {/* Header Banner */}
      <div className="bg-[#001A4B] rounded-[2rem] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-lg border border-white/5">
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-indigo-500/30 p-2 rounded-xl backdrop-blur-sm border border-indigo-500/50">
              <FileSignature className="w-6 h-6 text-indigo-200" />
            </div>
            <h1 className="text-3xl font-black text-white">Guichet Électronique</h1>
          </div>
          <p className="text-indigo-200 mt-2 text-sm max-w-xl">
            Demandez vos documents administratifs (Attestation de scolarité, Convention de stage...) 100% en ligne. Les documents validés sont signés numériquement (QR Code).
          </p>
        </div>

        <div className="relative z-10">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-500 text-white px-6 py-4 rounded-2xl font-black text-sm shadow-xl flex items-center gap-3 hover:bg-indigo-600 transition-colors border border-indigo-400 group"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            NOUVELLE DEMANDE
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 min-h-[400px]">
        <h2 className="text-xl font-black text-[#001A4B] mb-6 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" /> Historique de mes demandes
        </h2>

        {isLoading ? (
          <div className="flex justify-center py-20"><Spinner className="w-8 h-8 text-indigo-600" /></div>
        ) : isError ? (
          <div className="text-center py-10 text-rose-500"><AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-50"/>Impossible de charger vos demandes.</div>
        ) : (
          <div className="space-y-4">
            {data?.data?.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="font-bold text-slate-500">Vous n'avez encore fait aucune demande.</p>
                <p className="text-sm text-slate-400 mt-1">Cliquez sur "Nouvelle Demande" pour commencer.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="pb-4 pl-4">Document</th>
                      <th className="pb-4">Date de Demande</th>
                      <th className="pb-4">Statut</th>
                      <th className="pb-4 text-right pr-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data?.data?.map((req: any) => (
                      <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-5 pl-4">
                          <div className="font-bold text-[#001A4B]">{req.document_type || req.type}</div>
                          {req.rejection_reason && (
                            <div className="text-xs text-rose-500 mt-1 font-medium bg-rose-50 px-2 py-1 rounded inline-block">
                              Motif: {req.rejection_reason}
                            </div>
                          )}
                        </td>
                        <td className="py-5 text-sm font-medium text-slate-500">
                          {req.requested_at ? new Date(req.requested_at).toLocaleDateString('fr-FR') : (req.created_at || 'N/A')}
                        </td>
                        <td className="py-5">
                          {getStatusBadge(req.status)}
                        </td>
                        <td className="py-5 text-right pr-4">
                          {(req.status === 'approved' || req.status === 'ready') ? (
                            <button 
                              onClick={() => handleDownload(req.id)}
                              className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
                            >
                              <Download className="w-4 h-4" /> TÉLÉCHARGER PDF
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium italic">En attente d'administration</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Request Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-[#001A4B] p-6 text-white flex justify-between items-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
              <h2 className="text-lg font-black relative z-10 flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-indigo-300" /> 
                Demander un Document
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="relative z-10 text-white/50 hover:text-white transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                requestMutation.mutate(newRequestData);
              }} 
              className="p-6 space-y-5"
            >
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Type de Document</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[#001A4B] font-bold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  value={newRequestData.type}
                  onChange={(e) => setNewRequestData({...newRequestData, type: e.target.value})}
                  required
                >
                  <option value="Attestation de Scolarité">Attestation de Scolarité</option>
                  <option value="Convention de Stage">Convention de Stage</option>
                  <option value="Relevé de Notes">Relevé de Notes</option>
                </option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Motif (Optionnel)</label>
                <textarea 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-h-[100px]"
                  placeholder="Ex: Pour la demande de Visa..."
                  value={newRequestData.motif}
                  onChange={(e) => setNewRequestData({...newRequestData, motif: e.target.value})}
                />
              </div>

              <button 
                type="submit"
                disabled={requestMutation.isPending}
                className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors disabled:opacity-70"
              >
                {requestMutation.isPending ? <Spinner className="w-5 h-5 text-white" /> : (
                  <>
                    <Send className="w-5 h-5" /> SOUMETTRE LA DEMANDE
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
