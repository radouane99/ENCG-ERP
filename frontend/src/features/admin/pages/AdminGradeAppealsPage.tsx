import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Scale, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  FileText, 
  ChevronRight, 
  Award,
  Filter,
  RefreshCw,
  Edit3
} from 'lucide-react';
import api from '@shared/lib/api';
import { toast } from 'sonner';
import { cn } from '@shared/lib/utils';
import PageHeader from '@shared/components/layout/PageHeader';
import { Spinner } from '@shared/components/ui/Spinner';
import EmptyState from '@shared/components/ui/EmptyState';

export default function AdminGradeAppealsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAppeal, setSelectedAppeal] = useState<any>(null);
  
  // Resolution form state
  const [resolutionAction, setResolutionAction] = useState<'rectified' | 'maintained'>('rectified');
  const [rectifiedGrade, setRectifiedGrade] = useState<string>('');
  const [resolutionNotes, setResolutionNotes] = useState<string>('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-grade-appeals', statusFilter],
    queryFn: () => api.get('/admin/grade-appeals', {
      params: { status: statusFilter !== 'all' ? statusFilter : undefined }
    }).then(res => res.data?.data || res.data || [])
  });

  const resolveMutation = useMutation({
    mutationFn: (payload: { id: number; status: string; rectified_grade?: number; resolution_notes: string }) =>
      api.post(`/admin/grade-appeals/${payload.id}/resolve`, payload),
    onSuccess: () => {
      toast.success('Décision de réclamation enregistrée et note mise à jour avec succès !');
      setSelectedAppeal(null);
      setRectifiedGrade('');
      setResolutionNotes('');
      queryClient.invalidateQueries({ queryKey: ['admin-grade-appeals'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Erreur lors du traitement du recours.';
      toast.error(msg);
    }
  });

  const appeals = Array.isArray(data) ? data : [];
  const filteredAppeals = appeals.filter((a: any) => {
    const studentName = `${a.student?.user?.first_name || ''} ${a.student?.user?.last_name || ''}`.toLowerCase();
    const cne = String(a.student?.cne || '').toLowerCase();
    const moduleName = String(a.module?.name || '').toLowerCase();
    const query = search.toLowerCase();
    return studentName.includes(query) || cne.includes(query) || moduleName.includes(query);
  });

  const handleOpenResolve = (appeal: any) => {
    setSelectedAppeal(appeal);
    setResolutionAction('rectified');
    setRectifiedGrade(appeal.rectified_grade ? String(appeal.rectified_grade) : String(appeal.original_grade || ''));
    setResolutionNotes(appeal.resolution_notes || '');
  };

  const handleSubmitResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppeal) return;

    if (resolutionAction === 'rectified' && (!rectifiedGrade || isNaN(Number(rectifiedGrade)))) {
      toast.error('Veuillez saisir une note rectifiée valide comprise entre 0.00 et 20.00');
      return;
    }

    resolveMutation.mutate({
      id: selectedAppeal.id,
      status: resolutionAction,
      rectified_grade: resolutionAction === 'rectified' ? Number(rectifiedGrade) : undefined,
      resolution_notes: resolutionNotes,
    });
  };

  return (
    <div className="space-y-8 font-sans animate-in fade-in duration-500 text-slate-900 dark:text-slate-100 p-4 md:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Guichet Numérique des Réclamations de Notes (48h LMD)"
        subtitle="Traitement des recours d'étudiants, correction des erreurs matérielles de sommation et audit des PVs"
      />

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">En Instruction (48h)</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {appeals.filter((a: any) => a.status === 'submitted' || a.status === 'under_review').length}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Notes Rectifiées</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {appeals.filter((a: any) => a.status === 'rectified').length}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-500/10 text-slate-600 flex items-center justify-center font-black">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">Notes Maintenues</span>
            <div className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-0.5">
              {appeals.filter((a: any) => a.status === 'maintained').length}
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search & Status Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par étudiant, CNE ou module..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#001A4B]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'all', label: 'Toutes les demandes' },
            { key: 'submitted', label: 'En attente' },
            { key: 'rectified', label: 'Rectifiées' },
            { key: 'maintained', label: 'Maintenues' },
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setStatusFilter(item.key)}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap",
                statusFilter === item.key
                  ? "bg-[#001A4B] text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              )}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200 cursor-pointer"
            title="Rafraîchir"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 overflow-x-auto">
        {isLoading ? (
          <div className="py-12 flex justify-center"><Spinner size="lg" /></div>
        ) : filteredAppeals.length === 0 ? (
          <EmptyState
            icon={Scale}
            title="Aucune réclamation trouvée"
            description="Toutes les contestations ont été instruites ou aucune demande ne correspond aux critères."
          />
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">
                <th className="pb-4 pl-3">Étudiant</th>
                <th className="pb-4">Module & Épreuve</th>
                <th className="pb-4 text-center">Note Contestée</th>
                <th className="pb-4">Motif du Recours</th>
                <th className="pb-4 text-center">Statut</th>
                <th className="pb-4 text-right pr-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {filteredAppeals.map((appeal: any) => (
                <tr key={appeal.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-4 pl-3">
                    <div className="font-black text-slate-900 dark:text-white text-sm">
                      {appeal.student?.user?.first_name} {appeal.student?.user?.last_name}
                    </div>
                    <div className="text-[10px] font-mono font-bold text-slate-400 mt-0.5">
                      CNE: {appeal.student?.cne || 'N/A'} • {appeal.student?.filiere?.code || 'TC'}
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="font-bold text-slate-800 dark:text-slate-200">{appeal.module?.name || `Module #${appeal.module_id}`}</div>
                    <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                      Code: {appeal.module?.code || 'MOD'}
                    </div>
                  </td>
                  <td className="py-4 text-center">
                    <span className="font-mono font-black text-sm px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                      {Number(appeal.original_grade).toFixed(2)} / 20
                    </span>
                    {appeal.rectified_grade && (
                      <div className="text-[11px] font-black text-emerald-600 mt-1 font-mono">
                        ➔ {Number(appeal.rectified_grade).toFixed(2)} / 20
                      </div>
                    )}
                  </td>
                  <td className="py-4 max-w-xs">
                    <p className="line-clamp-2 text-slate-600 dark:text-slate-300 text-xs">{appeal.reason}</p>
                    <span className="text-[10px] font-bold text-slate-400 mt-1 block">
                      Déposé le {new Date(appeal.created_at).toLocaleDateString('fr-FR')} à {new Date(appeal.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="py-4 text-center">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                      appeal.status === 'rectified' && "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300",
                      appeal.status === 'maintained' && "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-300 border border-slate-300",
                      (appeal.status === 'submitted' || appeal.status === 'under_review') && "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300"
                    )}>
                      {appeal.status === 'rectified' ? 'Rectifiée' : 
                       appeal.status === 'maintained' ? 'Maintenue' : 'En Attente'}
                    </span>
                  </td>
                  <td className="py-4 text-right pr-3">
                    <button
                      onClick={() => handleOpenResolve(appeal)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#001A4B] hover:bg-[#082663] text-white font-black text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Statuer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Resolution Modal */}
      {selectedAppeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-[#001A4B] dark:text-white">
                <Scale className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black">Instruction & Décision de la Réclamation</h3>
              </div>
              <button 
                onClick={() => setSelectedAppeal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Candidate & Module details */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white">
                    {selectedAppeal.student?.user?.first_name} {selectedAppeal.student?.user?.last_name}
                  </h4>
                  <p className="text-[11px] font-mono text-slate-500">CNE: {selectedAppeal.student?.cne} • Module: {selectedAppeal.module?.name}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Note Initiale</span>
                  <span className="font-mono font-black text-base text-[#001A4B] dark:text-blue-300">
                    {Number(selectedAppeal.original_grade).toFixed(2)} / 20
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Motif de la réclamation</span>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-medium mt-0.5">{selectedAppeal.reason}</p>
              </div>
            </div>

            <form onSubmit={handleSubmitResolve} className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase text-slate-400 tracking-wider block mb-1.5">Décision de la Commission / Enseignant</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setResolutionAction('rectified')}
                    className={cn(
                      "p-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all",
                      resolutionAction === 'rectified'
                        ? "bg-emerald-50 text-emerald-700 border-emerald-400 dark:bg-emerald-950/50 dark:text-emerald-300"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                    )}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Rectifier la Note
                  </button>
                  <button
                    type="button"
                    onClick={() => setResolutionAction('maintained')}
                    className={cn(
                      "p-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all",
                      resolutionAction === 'maintained'
                        ? "bg-slate-200 text-slate-800 border-slate-400 dark:bg-slate-700 dark:text-slate-200"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                    )}
                  >
                    <XCircle className="w-4 h-4" /> Maintenir la Note
                  </button>
                </div>
              </div>

              {resolutionAction === 'rectified' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nouvelle Note Rectifiée (/20) *</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    max="20"
                    required
                    value={rectifiedGrade}
                    onChange={(e) => setRectifiedGrade(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono font-black text-sm text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#001A4B]"
                    placeholder="Ex: 14.50"
                  />
                  <p className="text-[10px] text-slate-400">La note sera immédiatement mise à jour dans le relevé de l'étudiant avec enregistrement dans l'Audit Log.</p>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Commentaire & Justification pour l'Étudiant *</label>
                <textarea
                  rows={3}
                  required
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Ex : Copie réexaminée : 2 points rajoutés sur l'exercice 3 suite à une erreur matérielle de report."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#001A4B]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedAppeal(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={resolveMutation.isPending}
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-[#001A4B] hover:bg-[#082663] text-white shadow-md cursor-pointer disabled:opacity-50"
                >
                  {resolveMutation.isPending ? 'Enregistrement...' : 'Valider & Signer la Décision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
