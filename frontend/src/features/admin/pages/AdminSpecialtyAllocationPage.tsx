import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Sparkles, 
  Users, 
  Award, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  BarChart3, 
  Layers, 
  RefreshCw,
  Zap,
  TrendingUp,
  ShieldCheck
} from 'lucide-react';
import api from '@shared/lib/api';
import { toast } from 'sonner';
import { cn } from '@shared/lib/utils';
import PageHeader from '@shared/components/layout/PageHeader';
import { Spinner } from '@shared/components/ui/Spinner';

export default function AdminSpecialtyAllocationPage() {
  const queryClient = useQueryClient();
  const [academicYear, setAcademicYear] = useState('2026/2027');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['specialty-allocation-simulation', academicYear],
    queryFn: () => api.get('/admin/specialty-allocation/simulation', {
      params: { academic_year: academicYear }
    }).then(res => res.data?.data || res.data || {})
  });

  const runAllocationMutation = useMutation({
    mutationFn: () => api.post('/admin/specialty-allocation/run', { academic_year: academicYear }),
    onSuccess: (res) => {
      const allocatedCount = res.data?.allocated_count || 'tous les';
      toast.success(`Algorithme exécuté avec succès ! ${allocatedCount} étudiants affectés à leur spécialité définitive.`);
      queryClient.invalidateQueries({ queryKey: ['specialty-allocation-simulation'] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Erreur lors de l\'exécution de l\'allocation.';
      toast.error(msg);
    }
  });

  const quotas = data?.quotas || [];
  const candidates = data?.candidates || [];
  const totalCapacity = quotas.reduce((acc: number, q: any) => acc + Number(q.capacity || 0), 0);
  const totalAllocated = candidates.filter((c: any) => !!c.allocated_filiere).length;

  return (
    <div className="space-y-8 font-sans animate-in fade-in duration-500 text-slate-900 dark:text-slate-100 p-4 md:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Moteur d'Orientation & Choix de Spécialité (Numerus Clausus S6/S7)"
        subtitle="Algorithme d'affectation au mérite (Gale-Shapley) • Respect strict des capacités plafonnées par filière"
      />

      {/* Hero Control Banner */}
      <div className="bg-gradient-to-r from-[#001A4B] via-[#082663] to-[#0f347a] rounded-[2.5rem] p-6 sm:p-8 text-white shadow-2xl border border-white/10 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
            <Zap className="w-3.5 h-3.5" /> Moteur d'Optimisation Algorithmique Actif
          </div>
          <h2 className="text-2xl font-black">Session d'Orientation Tronc Commun ➔ Spécialités</h2>
          <p className="text-xs text-blue-200 font-medium">
            Les étudiants de 2ème Année (S4) sont classés au mérite selon leur moyenne cumulée S1–S4 et affectés par ordre de préférence aux 5 filières accréditées (GFC, MACG, MCI, MRH, MLOG).
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => refetch()}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/15 transition-all cursor-pointer shadow-sm"
            title="Rafraîchir les calculs"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              if (window.confirm("Êtes-vous certain de vouloir exécuter l'allocation définitive ? Les parcours étudiants seront mis à jour en base.")) {
                runAllocationMutation.mutate();
              }
            }}
            disabled={runAllocationMutation.isPending || candidates.length === 0}
            className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-[#001A4B] font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-[#001A4B]" />
            {runAllocationMutation.isPending ? "Exécution en cours..." : "Exécuter l'Affectation Définitive"}
          </button>
        </div>
      </div>

      {/* Quotas Grid */}
      <div>
        <h3 className="text-base font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" /> Numerus Clausus & Capacités d'Accueil par Filière
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {quotas.map((quota: any) => {
            const cap = Number(quota.capacity || 60);
            const count = Number(quota.allocated_count || 0);
            const percentage = Math.min(100, Math.round((count / cap) * 100));

            return (
              <div key={quota.filiere_code} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-black text-lg text-[#001A4B] dark:text-blue-300">{quota.filiere_code}</span>
                    <p className="text-[10px] font-bold text-slate-400 truncate max-w-[120px]">{quota.filiere_name}</p>
                  </div>
                  <span className="text-xs font-mono font-black text-slate-600 dark:text-slate-300">
                    {count} / {cap}
                  </span>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-700",
                      percentage >= 95 ? "bg-rose-500" : percentage >= 70 ? "bg-amber-500" : "bg-emerald-500"
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span>Remplissage : {percentage}%</span>
                  <span className={percentage >= 100 ? "text-rose-500 font-black" : "text-emerald-500 font-black"}>
                    {percentage >= 100 ? "Saturé" : `${cap - count} places`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Simulation Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" /> Classement au Mérite & Simulation des Affectations
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Trié par ordre décroissant du score de mérite (Moyenne générale S1-S4)</p>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200">
            {candidates.length} Candidat{candidates.length > 1 ? 's' : ''} Classé{candidates.length > 1 ? 's' : ''}
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center"><Spinner size="lg" /></div>
        ) : candidates.length === 0 ? (
          <div className="py-10 text-center text-slate-500 text-xs">
            Aucun vœu de spécialité enregistré pour l'année académique active. Les étudiants peuvent saisir leurs choix sur leur portail.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th className="pb-3 pl-3 w-16">Rang</th>
                  <th className="pb-3">Étudiant</th>
                  <th className="pb-3 text-center">Score Mérite (S1-S4)</th>
                  <th className="pb-3">Vœux Exprimés (1 ➔ 5)</th>
                  <th className="pb-3 text-right pr-3">Filière Affectée</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {candidates.map((cand: any, idx: number) => {
                  const wishes = cand.wishes || [];
                  const allocated = cand.allocated_filiere;
                  const rankObtained = cand.rank_obtained || 1;

                  return (
                    <tr key={cand.student_id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 pl-3">
                        <span className={cn(
                          "w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs",
                          idx === 0 ? "bg-amber-400 text-[#001A4B]" :
                          idx === 1 ? "bg-slate-200 text-slate-700" :
                          idx === 2 ? "bg-amber-700/20 text-amber-800 dark:text-amber-300" :
                          "bg-slate-100 dark:bg-slate-800 text-slate-500"
                        )}>
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="py-3.5">
                        <div className="font-black text-slate-900 dark:text-white text-sm">{cand.student_name}</div>
                        <div className="text-[10px] font-mono font-bold text-slate-400">CNE: {cand.cne}</div>
                      </td>
                      <td className="py-3.5 text-center">
                        <span className="font-mono font-black text-sm px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          {Number(cand.merit_score || 14.5).toFixed(2)} / 20
                        </span>
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {wishes.map((w: any, wIdx: number) => (
                            <span 
                              key={wIdx}
                              className={cn(
                                "px-2 py-0.5 rounded-md text-[10px] font-black uppercase font-mono",
                                w.filiere_code === allocated
                                  ? "bg-emerald-500 text-white shadow-xs"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                              )}
                            >
                              {wIdx + 1}. {w.filiere_code}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 text-right pr-3">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-xs font-mono",
                          rankObtained === 1 ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300" :
                          rankObtained === 2 ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300" :
                          "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300"
                        )}>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          {allocated || 'En cours'} (Vœu #{rankObtained})
                        </span>
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
