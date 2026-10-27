import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@shared/lib/api'
import { errorMessage } from '../api/workflow'
import { workflowBase } from '../model/workflow'
import OcrEvaluationPanel from './OcrEvaluationPanel'

interface Policy { cloud_enabled: boolean; configured: boolean; can_manage: boolean; provider: string; local_available: boolean }
export default function AdmissionOcrSettings() {
  const cache = useQueryClient(); const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  const query = useQuery({ queryKey: ['admission-ocr-policy'], queryFn: async () => (await api.get<Policy>(`${workflowBase}/ocr-settings`)).data })
  return <section className="mt-7 rounded-xl border border-primary/20 p-5"><h3 className="font-bold">Extraction locale et assistance IA</h3><p className="mt-3 text-sm text-muted-foreground">La lecture locale reste disponible sans envoi externe. L’IA cloud est facultative : elle nécessite une autorisation de l’établissement et un accord explicite du candidat avant chaque traitement.</p>
    {query.data && <><p className="mt-3 text-sm">Fournisseur : {query.data.provider} · Clé et modèle configurés : {query.data.configured ? 'oui' : 'non'}. Aucune clé n’est affichée dans cette interface.</p><label className="mt-4 flex min-h-11 items-center gap-3 text-sm"><input type="checkbox" checked={query.data.cloud_enabled} disabled={busy || !query.data.can_manage || !query.data.configured} onChange={async e => { setBusy(true); setError(''); try { const r = await api.put<Policy>(`${workflowBase}/ocr-settings`, { cloud_enabled: e.target.checked }); cache.setQueryData(['admission-ocr-policy'], r.data); await cache.invalidateQueries({ queryKey: ['admission-dossier'] }) } catch (e) { setError(errorMessage(e)) } finally { setBusy(false) } }}/>Activer l’extraction IA automatique (Gemini / Groq Vision)</label>{!query.data.can_manage && <p className="mt-2 text-xs text-muted-foreground">Ce réglage est réservé à la direction et aux administrateurs de l’établissement.</p>}</>}
    {(error || query.error) && <p role="alert" className="mt-3 text-sm text-red-700">{error || errorMessage(query.error)}</p>}
    <OcrEvaluationPanel />
  </section>
}
