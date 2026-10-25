import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import api from '@shared/lib/api'
import PageHeader from '@shared/components/layout/PageHeader'
import { Button } from '@shared/components/ui/Button'
import { Input } from '@shared/components/ui/Input'
import { Modal } from '@shared/components/ui/Modal'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@shared/components/ui/Table'

interface RecordRow { id: number; digital_identifier: string; verification_token: string; document_label: string; status: string; issued_at: string | null; page_count: number | null; file_sha256: string | null }

export default function DocumentRegistryPage() {
  const [search, setSearch] = useState(''); const [identifier, setIdentifier] = useState('')
  const [status, setStatus] = useState(''); const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<RecordRow | null>(null); const [reason, setReason] = useState('')
  const client = useQueryClient()
  const query = useQuery({ queryKey: ['pdf-document-registry', identifier, status, page], queryFn: async () => {
    const result = (await api.get('/documents/registry', { params: { identifier: identifier || undefined, status: status || undefined, page } })).data
    if (!Array.isArray(result.data)) throw new Error('Registre indisponible')
    return result as { data: RecordRow[]; current_page: number; last_page: number; total: number }
  } })
  const revoke = useMutation({ mutationFn: () => api.post(`/documents/registry/${selected!.id}/revoke`, { reason }),
    onSuccess: () => { toast.success('Référence retirée; historique conservé.'); setSelected(null); setReason(''); void client.invalidateQueries({ queryKey: ['pdf-document-registry'] }) },
    onError: (error: any) => toast.error(error?.response?.data?.message || 'Retrait non enregistré.') })
  async function download(row: RecordRow) {
    try {
      const response = await api.get(`/documents/registry/${row.id}/download`, { responseType: 'blob' })
      const url = URL.createObjectURL(response.data); const link = document.createElement('a'); link.href = url; link.download = `${row.digital_identifier}.pdf`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch { toast.error('Téléchargement indisponible ou document retiré.') }
  }
  const labels: Record<string, string> = { pending: 'En préparation', issued: 'Émis', revoked: 'Retiré' }
  return <div className="space-y-6">
    <PageHeader title="Registre des documents PDF" subtitle="Identifiants numériques, archives et contrôle des exemplaires émis." />
    <form onSubmit={event => { event.preventDefault(); setIdentifier(search.trim()); setPage(1) }} className="erp-surface flex flex-wrap items-end gap-4 p-5">
      <Input label="Identifiant numérique" inputMode="numeric" pattern="[0-9]*" value={search} onChange={event => setSearch(event.target.value)} placeholder="Saisir la référence complète" containerClassName="min-w-0 flex-1" />
      <label className="space-y-1 text-sm font-medium">État<select aria-label="État du document" value={status} onChange={event => { setStatus(event.target.value); setPage(1) }} className="block rounded-[var(--control-radius)] border border-input bg-card p-3"><option value="">Tous</option><option value="issued">Émis</option><option value="pending">En préparation</option><option value="revoked">Retiré</option></select></label>
      <Button type="submit">Rechercher</Button>
    </form>
    {query.isPending && <p role="status">Chargement du registre…</p>}
    {query.isError && <div role="alert">Registre indisponible. <Button variant="outline" onClick={() => void query.refetch()}>Réessayer</Button></div>}
    {query.data && <>
      <Table><TableHeader><TableRow><TableHead>Identifiant</TableHead><TableHead>Document</TableHead><TableHead>État</TableHead><TableHead>Émission</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader><TableBody>
        {query.data.data.map(row => <TableRow key={row.id}><TableCell className="font-mono text-xs">{row.digital_identifier}</TableCell><TableCell>{row.document_label}<p className="text-xs text-muted-foreground">{row.page_count ?? '—'} page(s)</p></TableCell><TableCell>{labels[row.status] || row.status}</TableCell><TableCell>{row.issued_at ? new Date(row.issued_at).toLocaleString('fr-FR') : '—'}</TableCell><TableCell><div className="flex flex-wrap gap-2"><Link to={`/verify/document/${row.verification_token}`} className="inline-flex items-center text-sm text-primary underline">Vérifier</Link>{row.status === 'issued' && <><Button variant="outline" size="sm" onClick={() => void download(row)}>PDF archivé</Button><Button variant="destructive" size="sm" onClick={() => { setSelected(row); setReason('') }}>Retirer</Button></>}</div></TableCell></TableRow>)}
      </TableBody></Table>
      {!query.data.data.length && <p className="erp-surface p-8 text-center text-muted-foreground">Aucun document correspondant. Les anciennes pièces ne sont pas réécrites automatiquement.</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm"><span>{query.data.total} document(s) · Page {page} / {query.data.last_page}</span><div className="flex gap-2"><Button variant="outline" disabled={page === 1} onClick={() => setPage(previous => previous - 1)}>Précédente</Button><Button variant="outline" disabled={page >= query.data.last_page} onClick={() => setPage(previous => previous + 1)}>Suivante</Button></div></div>
    </>}
    <Modal open={!!selected} onClose={() => { if (!revoke.isPending) setSelected(null) }} title="Retirer une référence" description="Le PDF reste archivé et son historique est conservé. Son QR indiquera le retrait.">
      <form onSubmit={event => { event.preventDefault(); if (!revoke.isPending) revoke.mutate() }} className="space-y-4"><p className="break-all font-mono text-sm">{selected?.digital_identifier}</p><Input label="Motif du retrait" required minLength={10} maxLength={2000} value={reason} onChange={event => setReason(event.target.value)} /><Button type="submit" variant="destructive" isLoading={revoke.isPending} disabled={reason.trim().length < 10}>Confirmer le retrait</Button></form>
    </Modal>
  </div>
}
