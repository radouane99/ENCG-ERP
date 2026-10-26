import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { toast } from 'sonner';
import { ShieldAlert, ChevronDown, Check, ChevronLeft, ChevronRight, FileCheck2 } from 'lucide-react';
import { cn } from '@shared/lib/utils';

export function AcademicIntegrityPanel() {
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isError } = useQuery({
    queryKey: ['academic-integrity', page],
    queryFn: () => api.get('/admin/academic-integrity', { params: { page } }).then(r => r.data),
    retry: false,
  });

  if (isError || !data?.count) return null;

  return (
    <section className="rounded-3xl border border-amber-300/80 dark:border-amber-800/70 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent p-5 sm:p-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          aria-expanded={expanded}
          className="flex items-center gap-3 text-left font-bold cursor-pointer group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                Contrôles de données à réviser
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                {data.count}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Les données historiques ambiguës sont conservées. Vérifiez les pièces et l’année officielle avant de réactiver une modalité.
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border border-amber-300/80 dark:border-amber-800 bg-white dark:bg-slate-800 text-xs font-bold text-amber-900 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer"
        >
          <span>{expanded ? 'Masquer les contrôles' : 'Afficher les contrôles'}</span>
          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", expanded && "rotate-180")} />
        </button>
      </div>

      {expanded && (
        <div className="space-y-4 pt-3 border-t border-amber-200/60 dark:border-amber-900/40">
          {data.assessments?.map((assessment: any) => (
            <form
              key={assessment.id}
              className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 p-4 shadow-2xs"
              onSubmit={async event => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                try {
                  await api.patch(`/admin/academic-integrity/assessments/${assessment.id}`, {
                    academic_year_id: Number(form.get('year')),
                    type: form.get('type'),
                    weight: Number(form.get('weight')),
                  });
                  await queryClient.invalidateQueries({ queryKey: ['academic-integrity'] });
                  toast.success('Modalité réconciliée. Vérifiez la somme des poids du module.');
                } catch (error: any) {
                  toast.error(error.response?.data?.message || 'Réconciliation impossible.');
                }
              }}
            >
              <div className="w-full flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-800 pb-2">
                <FileCheck2 className="w-4 h-4 text-blue-600" />
                <span>Évaluation #{assessment.id} · Module #{assessment.module_id} · {assessment.date?.slice(0, 10) || 'Sans date'}</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Année</label>
                <select
                  name="year"
                  required
                  defaultValue=""
                  className="h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="">Choisir</option>
                  {data.years?.map((year: any) => (
                    <option key={year.id} value={year.id}>{year.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Type</label>
                <input
                  name="type"
                  required
                  maxLength={50}
                  defaultValue={assessment.type}
                  className="h-8 w-28 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">Poids %</label>
                <input
                  name="weight"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  required
                  defaultValue={assessment.weight}
                  className="h-8 w-24 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Valider la réconciliation</span>
              </button>
            </form>
          ))}

          {(data.data?.data || []).filter((issue: any) => issue.entity === 'students').map((issue: any) => (
            <form
              key={issue.id}
              className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 p-4 shadow-2xs"
              onSubmit={async event => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                try {
                  await api.patch(`/admin/academic-integrity/issues/${issue.id}/identity`, {
                    value: form.get('value'),
                  });
                  await queryClient.invalidateQueries({ queryKey: ['academic-integrity'] });
                  toast.success('Identité canonique réconciliée.');
                } catch (error: any) {
                  toast.error(error.response?.data?.message || 'Correction impossible.');
                }
              }}
            >
              <div className="flex-1 min-w-[240px]">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Étudiant #{issue.entity_id} · {issue.reason.replace('identity_conflict_', '')}
                </label>
                <input
                  name="value"
                  type={issue.reason.endsWith('birth_date') ? 'date' : 'text'}
                  required
                  aria-label={`Valeur vérifiée pour étudiant ${issue.entity_id}`}
                  className="w-full h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <button
                type="submit"
                className="h-8 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Enregistrer la valeur vérifiée sur pièces
              </button>
            </form>
          ))}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-amber-200/60 dark:border-amber-900/40 text-xs text-slate-500">
            <p>Vérifiez les pièces du dossier avant chaque correction. Aucun historique n’est supprimé automatiquement.</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(v => v - 1)}
                className="h-7 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono font-bold">Page {page} / {data.data?.last_page || 1}</span>
              <button
                type="button"
                disabled={page >= (data.data?.last_page || 1)}
                onClick={() => setPage(v => v + 1)}
                className="h-7 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
