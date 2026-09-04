import React, { useState } from 'react';
import { cn } from '@shared/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api';
import { 
  Search, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Award, 
  Filter, 
  ShieldCheck, 
  User, 
  FileCheck,
  Check,
  X,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export default function TextbooksPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'submitted' | 'validated'>('all');
  const [page, setPage] = useState(1);

  const { data: textbooksResponse, isLoading } = useQuery({
    queryKey: ['admin-textbooks', statusFilter, searchTerm, page],
    queryFn: async () => {
      const params: any = { page };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;
      const res = await api.get('/admin/textbooks', { params });
      return res.data;
    }
  });

  const validateMutation = useMutation({
    mutationFn: async ({ id, decision }: { id: number; decision: 'validated' | 'rejected' }) => {
      const res = await api.post(`/admin/textbooks/${id}/validate`, { decision });
      return res.data;
    },
    onSuccess: (_, vars) => {
      toast.success(vars.decision === 'validated' 
        ? '✓ Visa pédagogique accordé ! Le Service Fait est certifié.' 
        : 'Séance rejetée.'
      );
      queryClient.invalidateQueries({ queryKey: ['admin-textbooks'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur lors de la validation.');
    }
  });

  const rawEntries = textbooksResponse?.data?.data || textbooksResponse?.data || [];
  const entries = Array.isArray(rawEntries) ? rawEntries : [];
  const stats = textbooksResponse?.statistics || {
    total_sessions: entries.length,
    submitted_count: entries.filter((e: any) => e.status === 'submitted').length,
    validated_count: entries.filter((e: any) => e.status === 'validated').length,
    total_hours: entries.reduce((acc: number, e: any) => acc + Number(e.session_duration_hours || 2), 0),
    validated_hours: entries.filter((e: any) => e.status === 'validated').reduce((acc: number, e: any) => acc + Number(e.session_duration_hours || 2), 0),
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 font-sans text-slate-900 dark:text-slate-100 pb-28">
      
      {/* ── Executive Header Banner ── */}
      <div className="bg-gradient-to-br from-[#001A4B] via-[#082663] to-[#0d1d3d] rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-500/20 text-white shrink-0 font-black">
            <BookOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" /> Direction des Études &amp; Chefs de Département
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Supervision des Cahiers de Texte</h1>
            <p className="text-xs md:text-sm text-blue-200 font-medium max-w-2xl">
              Visa officiel des séances d'enseignement, certification du Service Fait et contrôle de l'avancement des syllabus pour l'ensemble des modules.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/15 text-center">
            <span className="text-[10px] font-black uppercase text-amber-300 block">Heures Certifiées</span>
            <span className="text-2xl font-black text-white">{stats.validated_hours}h</span>
          </div>
        </div>
      </div>

      {/* ── Metric Indicators ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Séances Saisies</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white">{stats.total_sessions}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">En Attente de Visa</span>
            <span className="text-2xl font-black text-amber-600">{stats.submitted_count}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Séances Visées (SF)</span>
            <span className="text-2xl font-black text-emerald-600">{stats.validated_count}</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Volume Global Dispensé</span>
            <span className="text-2xl font-black text-indigo-600">{stats.total_hours}h</span>
          </div>
        </div>
      </div>

      {/* ── Filters & Search Bar ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
              statusFilter === 'all' 
                ? "bg-[#001A4B] text-white shadow-md" 
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            )}
          >
            Toutes ({stats.total_sessions})
          </button>
          <button
            onClick={() => setStatusFilter('submitted')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
              statusFilter === 'submitted' 
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/20" 
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            )}
          >
            En Attente de Visa ({stats.submitted_count})
          </button>
          <button
            onClick={() => setStatusFilter('validated')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
              statusFilter === 'validated' 
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" 
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            )}
          >
            Visées ({stats.validated_count})
          </button>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Rechercher enseignant, module, chapitre..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* ── Main Data Table ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 font-bold flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs">Chargement des cahiers de texte...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="py-20 text-center text-slate-400 font-bold space-y-2">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm text-slate-600 dark:text-slate-300">Aucune séance trouvée</p>
            <p className="text-xs text-slate-400">Modifiez vos filtres ou effectuez une autre recherche.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="p-4">Séance &amp; Date</th>
                  <th className="p-4">Enseignant</th>
                  <th className="p-4">Module &amp; Filière</th>
                  <th className="p-4">Contenu &amp; Chapitre</th>
                  <th className="p-4">Avancement</th>
                  <th className="p-4">Statut Visa</th>
                  <th className="p-4 text-right">Action Chef Dpt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {entries.map((item: any) => {
                  const teacherName = item.user 
                    ? `Pr. ${item.user.first_name} ${item.user.last_name}`
                    : (item.professor?.user ? `Pr. ${item.professor.user.first_name} ${item.professor.user.last_name}` : 'Enseignant ENCG');
                  
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        <div>{new Date(item.session_date).toLocaleDateString('fr-FR')}</div>
                        <span className="text-[10px] text-indigo-600 font-black uppercase">
                          {item.session_type || 'CM'} • {item.session_duration_hours || 2}h
                        </span>
                      </td>

                      <td className="p-4 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10px] font-black">
                            {teacherName.charAt(4) || 'P'}
                          </div>
                          <div>
                            <div>{teacherName}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{item.user?.email || 'professeur@encg-fes.ac.ma'}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 dark:text-white">{item.module?.name || 'Finance d\'Entreprise'}</div>
                        <div className="text-[10px] text-slate-400">
                          {item.module?.code || 'GFC-S5'} • {item.group?.name || 'Tous Groupes'}
                        </div>
                      </td>

                      <td className="p-4 max-w-xs">
                        <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{item.chapter_title}</div>
                        {item.key_concepts && (
                          <div className="text-[10px] text-slate-400 truncate">{item.key_concepts}</div>
                        )}
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-blue-600 h-full rounded-full" 
                              style={{ width: `${item.syllabus_percentage || 25}%` }}
                            ></div>
                          </div>
                          <span className="font-black text-[11px] text-slate-700 dark:text-slate-300">
                            {item.syllabus_percentage || 25}%
                          </span>
                        </div>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        {item.status === 'validated' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" /> Visée ✓
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Clock className="w-3 h-3" /> En attente de Visa
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right whitespace-nowrap">
                        {item.status !== 'validated' ? (
                          <button
                            onClick={() => validateMutation.mutate({ id: item.id, decision: 'validated' })}
                            disabled={validateMutation.isPending}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[11px] shadow-sm flex items-center gap-1.5 ml-auto cursor-pointer transition-all"
                          >
                            <Check className="w-3.5 h-3.5" /> Accorder le Visa
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            Service Fait Validé
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
