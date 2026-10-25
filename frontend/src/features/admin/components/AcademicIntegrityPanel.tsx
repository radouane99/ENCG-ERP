import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { toast } from 'sonner';
export function AcademicIntegrityPanel() {
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const { data, isError } = useQuery({ queryKey: ['academic-integrity', page], queryFn: () => api.get('/admin/academic-integrity', {params: {page}}).then(r => r.data), retry: false });
  if (isError || !data?.count) return null;
  return <section className="rounded-xl border border-warning bg-card p-4 text-card-foreground space-y-3">
    <button type="button" onClick={() => setExpanded(v => !v)} aria-expanded={expanded} className="min-h-11 text-start font-semibold">{data.count} contrôles de données à réviser {expanded ? '−' : '+'}</button>
    <p className="text-sm text-muted-foreground">Les données historiques ambiguës sont conservées. Vérifiez les pièces et l’année officielle avant de réactiver une modalité.</p>
    {expanded && <div className="space-y-4">
      {data.assessments.map((assessment: any) => <form key={assessment.id} className="flex flex-wrap items-end gap-3 border-t border-border py-3" onSubmit={async event => {
        event.preventDefault(); const form = new FormData(event.currentTarget);
        try { await api.patch(`/admin/academic-integrity/assessments/${assessment.id}`, {academic_year_id: Number(form.get('year')), type: form.get('type'), weight: Number(form.get('weight'))});
          await queryClient.invalidateQueries({queryKey: ['academic-integrity']}); toast.success('Modalité réconciliée. Vérifiez la somme des poids du module.');
        } catch (error: any) { toast.error(error.response?.data?.message || 'Réconciliation impossible.'); }
      }}>
        <p className="w-full text-sm">Évaluation #{assessment.id} · Module #{assessment.module_id} · {assessment.date?.slice(0,10) || 'Sans date'}</p>
        <label className="text-sm">Année<select name="year" required defaultValue="" className="block rounded border border-input bg-background p-2 rounded-[var(--control-radius)]"><option value="">Choisir</option>{data.years.map((year: any) => <option key={year.id} value={year.id}>{year.label}</option>)}</select></label>
        <label className="text-sm">Type<input name="type" required maxLength={50} defaultValue={assessment.type} className="block w-28 rounded border border-input bg-background p-2 rounded-[var(--control-radius)]" /></label>
        <label className="text-sm">Poids %<input name="weight" type="number" min={0} max={100} step="0.01" required className="block w-24 rounded border border-input bg-background p-2 rounded-[var(--control-radius)]" /></label>
        <button className="min-h-11 rounded-lg bg-primary px-3 text-primary-foreground">Valider la réconciliation</button>
      </form>)}
      {(data.data?.data || []).filter((issue: any) => issue.entity === 'students').map((issue: any) => <form key={issue.id} className="flex flex-wrap items-end gap-3 border-t border-border py-3" onSubmit={async event => {
        event.preventDefault(); const form = new FormData(event.currentTarget);
        try { await api.patch(`/admin/academic-integrity/issues/${issue.id}/identity`, {value: form.get('value')}); await queryClient.invalidateQueries({queryKey: ['academic-integrity']}); toast.success('Identité canonique réconciliée.'); }
        catch (error: any) { toast.error(error.response?.data?.message || 'Correction impossible.'); }
      }}>
        <label className="text-sm">Étudiant #{issue.entity_id} · {issue.reason.replace('identity_conflict_', '')}
          <input name="value" type={issue.reason.endsWith('birth_date') ? 'date' : 'text'} required aria-label={`Valeur vérifiée pour étudiant ${issue.entity_id}`} className="ms-3 rounded border border-input bg-background p-2 rounded-[var(--control-radius)]" />
        </label>
        <button className="min-h-11 rounded-lg border border-input px-3">Enregistrer la valeur vérifiée sur pièces</button>
      </form>)}
      <p className="text-sm">Vérifiez les pièces du dossier avant chaque correction. Aucun historique n’est supprimé automatiquement.</p>
      <div className="flex items-center gap-3"><button type="button" disabled={page <= 1} onClick={() => setPage(value => value - 1)} className="min-h-11 rounded border border-input px-3 disabled:opacity-40">Précédent</button>
        <span>Page {page} / {data.data?.last_page || 1}</span>
        <button type="button" disabled={page >= (data.data?.last_page || 1)} onClick={() => setPage(value => value + 1)} className="min-h-11 rounded border border-input px-3 disabled:opacity-40">Suivant</button></div>
    </div>}
  </section>;
}
