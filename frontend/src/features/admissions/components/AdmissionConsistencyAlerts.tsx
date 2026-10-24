import { AlertTriangle } from 'lucide-react'
import { useAdmissionOperations } from '../api/operations'
import { errorMessage } from '../api/workflow'
import { dateText, documentLabels, profileLabels, workflowBase, type DocumentType } from '../model/workflow'
import api from '@shared/lib/api'

export default function AdmissionConsistencyAlerts({ applicationId, showOriginals = false }: { applicationId: number; showOriginals?: boolean }) {
  const query = useAdmissionOperations(applicationId)
  if (query.isError) return <p role="alert" className="my-4 rounded-xl border border-red-200 p-4 text-sm">Rapprochement indisponible : {errorMessage(query.error)} <button className="underline" onClick={() => void query.refetch()}>Réessayer</button></p>
  return <div className="my-4 space-y-3">
    {!!query.data?.alerts.length && <section className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:bg-amber-950/30 dark:text-amber-200"><h2 className="flex items-center gap-2 font-semibold"><AlertTriangle size={18}/>Différences entre les pièces et le dossier</h2><p className="mt-2 text-sm">Ces différences sont des propositions OCR à comparer aux pièces. Elles ne prouvent pas une erreur du titulaire.</p><ul className="mt-3 space-y-3">{query.data.alerts.map(alert => <li key={alert.field} className="rounded-lg border border-amber-200 p-3 text-sm"><strong>{profileLabels[alert.field] || alert.field}</strong>{alert.sources.map((source, i) => <p key={i} className="mt-1 break-words">{source.source === 'dossier' ? 'Dossier déclaré / liste officielle' : documentLabels[source.source as DocumentType] || source.source} : {source.value}</p>)}</li>)}</ul></section>}
    {showOriginals && !!query.data?.originals.length && <section className="rounded-xl border border-border bg-card p-4"><h2 className="font-semibold">Mes originaux déposés et restitués</h2><ul className="mt-3 space-y-3">{query.data.originals.map(event => <li key={event.id} className="text-sm"><strong>{documentLabels[event.document_type as DocumentType]}</strong> · {{ received: 'Reçu', relocated: 'Rangement mis à jour', returned: 'Restitué' }[event.event]}<p className="mt-1 text-xs text-muted-foreground">{dateText(event.created_at)} · {event.agent}</p><a className="inline-flex min-h-11 items-center text-blue-700 underline dark:text-blue-300" target="_blank" rel="noreferrer" href={`${api.defaults.baseURL}${workflowBase}/operations/originals/${event.id}/receipt`}>Reçu ORI-{event.id}</a></li>)}</ul></section>}
  </div>
}
