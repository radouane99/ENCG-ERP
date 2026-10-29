import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@shared/lib/api'
import { errorMessage, useAdmissionCampaigns } from '../api/workflow'
import { workflowBase } from '../model/workflow'
import AdmissionOcrSettings from './AdmissionOcrSettings'

const initial = { name: '', academic_year_id: '', filiere_id: '', open_date: '', close_date: '', target_capacity: '100', status: 'draft', entry_route: 'tafem', entry_semester: '1' }
export default function AdmissionCampaignSettings({ campaignId, onSelect }: { campaignId?: number; onSelect: (id: number) => void }) {
  const campaigns = useAdmissionCampaigns(); const cache = useQueryClient()
  const [creating, setCreating] = useState(false); const [form, setForm] = useState(initial); const [busy, setBusy] = useState(false); const [message, setMessage] = useState('')
  const references = useQuery({ queryKey: ['admission-references'], queryFn: async () => (await api.get<{ years: { id: number; label: string }[]; filieres: { id: number; name: string }[] }>(`${workflowBase}/references`)).data })
  useEffect(() => {
    const c = campaigns.data?.find(x => x.id === campaignId)
    if (creating) setForm(initial)
    else if (c) setForm({ name: c.name, academic_year_id: String(c.academic_year_id), filiere_id: String(c.filiere_id), open_date: c.open_date.slice(0, 10), close_date: c.close_date.slice(0, 10), target_capacity: String(c.target_capacity), status: c.status, entry_route: c.entry_route ?? 'tafem', entry_semester: String(c.entry_semester ?? 1) })
  }, [campaignId, campaigns.data, creating])
  const input = 'mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:bg-slate-900 dark:text-slate-100'
  return <section className="rounded-2xl border border-border bg-card p-5 shadow-sm dark:border-border dark:bg-card"><div className="flex flex-wrap justify-between gap-3"><h2 className="text-lg font-bold">{creating ? 'Nouvelle campagne' : 'Paramètres de la campagne'}</h2><button className="min-h-11 rounded-lg border px-4 text-sm" onClick={() => { setCreating(v => !v); setMessage('') }}>{creating ? 'Revenir à la campagne' : 'Créer une nouvelle campagne'}</button></div><p className="my-4 text-sm text-muted-foreground">Les échéances et capacités sont utilisées par les contrôles serveur. L’année et la filière d’une campagne déjà utilisée restent inchangées.</p>{message && <p role="status" className="my-3 rounded-lg bg-primary/5 p-3 text-sm text-blue-950">{message}</p>}
    <form className="grid max-w-3xl gap-4 sm:grid-cols-2" onSubmit={async e => { e.preventDefault(); setBusy(true); setMessage(''); try { const body = { ...form, academic_year_id: Number(form.academic_year_id), filiere_id: Number(form.filiere_id), target_capacity: Number(form.target_capacity), entry_semester: Number(form.entry_semester) }; const r = await api.request({ method: creating ? 'post' : 'put', url: creating ? `${workflowBase}/campaigns` : `${workflowBase}/campaigns/${campaignId}`, data: body }); await cache.invalidateQueries({ queryKey: ['admission-campaigns'] }); onSelect(r.data.data.id); setCreating(false); setMessage('Campagne enregistrée.') } catch (e) { setMessage(errorMessage(e)) } finally { setBusy(false) } }}>
      <label className="text-sm">Nom<input required className={input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}/></label>
      <label className="text-sm">Année universitaire<select required className={input} value={form.academic_year_id} onChange={e => setForm(f => ({ ...f, academic_year_id: e.target.value }))}><option value="">Choisir</option>{references.data?.years.map(y => <option key={y.id} value={y.id}>{y.label}</option>)}</select></label>
      <label className="text-sm">Filière<select required className={input} value={form.filiere_id} onChange={e => setForm(f => ({ ...f, filiere_id: e.target.value }))}><option value="">Choisir</option>{references.data?.filieres.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}</select></label>
      <label className="text-sm">Voie d’accès & type de formation
        <select
          className={input}
          value={form.entry_route}
          onChange={e => {
            const r = e.target.value;
            const defSem = r === 'tafem' ? '1' : ['cnaem', 'passerelle_concours', 'temps_amenage_licence'].includes(r) ? '5' : '1';
            setForm(f => ({ ...f, entry_route: r, entry_semester: defSem }));
          }}
        >
          <optgroup label="🎓 Formation Initiale (Gratuite)">
            <option value="tafem">TAFEM — 1re année (Baccalauréat)</option>
            <option value="cnaem">Passerelle CNAEM — CPGE (3e ou 4e année)</option>
            <option value="passerelle_concours">Passerelle Concours — DUT / BTS / DEUG (3e année)</option>
          </optgroup>
          <optgroup label="💼 Formation en Temps Aménagé (Formation Continue)">
            <option value="temps_amenage_master">Master Spécialisé d’Université (MSU — S1 ou S7)</option>
            <option value="temps_amenage_licence">Licence Professionnelle d’Université (LPU — S5)</option>
            <option value="temps_amenage_du">Diplôme d’Université / Executive (DU — S1)</option>
          </optgroup>
        </select>
      </label>
      <label className="text-sm">Niveau d’entrée officiel
        <select className={input} value={form.entry_semester} onChange={e => setForm(f => ({ ...f, entry_semester: e.target.value }))}>
          {form.entry_route === 'tafem' && <option value="1">1re année — S1</option>}
          {['cnaem', 'passerelle_concours'].includes(form.entry_route) && (
            <>
              <option value="5">3e année — S5</option>
              <option value="7">4e année — S7</option>
            </>
          )}
          {form.entry_route === 'temps_amenage_master' && (
            <>
              <option value="1">Master 1 — S1</option>
              <option value="7">Master 2 — S7</option>
            </>
          )}
          {form.entry_route === 'temps_amenage_licence' && <option value="5">3e année (Licence Pro) — S5</option>}
          {form.entry_route === 'temps_amenage_du' && (
            <>
              <option value="1">Cycle 1 — S1</option>
              <option value="3">Cycle 2 — S3</option>
              <option value="5">Cycle 3 — S5</option>
            </>
          )}
        </select>
      </label>
      <label className="text-sm">Capacité<input required min={1} max={20000} type="number" className={input} value={form.target_capacity} onChange={e => setForm(f => ({ ...f, target_capacity: e.target.value }))}/></label>
      <label className="text-sm">Ouverture à 00 h 00<input required type="date" className={input} value={form.open_date} onChange={e => setForm(f => ({ ...f, open_date: e.target.value }))}/></label><label className="text-sm">Clôture à 23 h 59<input required type="date" className={input} value={form.close_date} onChange={e => setForm(f => ({ ...f, close_date: e.target.value }))}/></label>
      <p className="text-sm text-muted-foreground sm:col-span-2">Brouillon : invisible au public. Publiée : ouverture et fermeture automatiques selon les dates, heure du Maroc. Fermée : inscriptions arrêtées immédiatement, même avant la date de clôture.</p>
      <label className="text-sm">État<select className={input} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}><option value="draft">Brouillon</option><option value="open">Publiée — selon les dates</option><option value="closed">Fermée</option></select></label><button disabled={busy || (!creating && !campaignId)} className="mt-5 min-h-11 rounded-lg bg-secondary px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Enregistrement…' : 'Enregistrer la campagne'}</button>
    </form>
    <AdmissionOcrSettings/>
  </section>
}
