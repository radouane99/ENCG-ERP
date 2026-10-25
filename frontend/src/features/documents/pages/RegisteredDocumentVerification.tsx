import { useEffect, useState } from 'react'
import api from '@shared/lib/api'
import PageHeader from '@shared/components/layout/PageHeader'
import { Card } from '@shared/components/ui/Card'

interface RegistryReference { digital_identifier: string; document_type: string; status: 'pending' | 'issued' | 'revoked'; issued_at: string | null; page_count: number | null; file_sha256: string | null; message: string }

export default function RegisteredDocumentVerification({ token }: { token: string }) {
  const [record, setRecord] = useState<RegistryReference | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [match, setMatch] = useState<boolean | null>(null)
  const [fileError, setFileError] = useState('')
  useEffect(() => {
    const controller = new AbortController()
    api.get(`/verify/document/${token}`, { signal: controller.signal }).then(response => {
      if (!response.data?.data?.registry_document) throw new Error('Référence documentaire introuvable.')
      setRecord(response.data.data)
    }).catch(reason => { if (!controller.signal.aborted) setError(reason?.response?.data?.message || 'Vérification indisponible. Réessayez.') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [token])

  async function verifyFile(file?: File) {
    setMatch(null); setFileError('')
    if (!file || !record?.file_sha256) return
    if (file.size > 25 * 1024 * 1024) { setFileError('Choisir un PDF de 25 Mo maximum.'); return }
    setChecking(true)
    try {
      const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
      const hex = [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('')
      setMatch(hex === record.file_sha256)
    } catch { setFileError('Calcul de l’empreinte indisponible. Utilisez un navigateur récent et une connexion HTTPS.') }
    finally { setChecking(false) }
  }

  return <main className="min-h-screen bg-background p-4 text-foreground sm:p-8"><div className="mx-auto max-w-2xl space-y-6">
    <PageHeader title="Vérification du document" subtitle="Registre documentaire ENCG Fès" />
    <Card className="space-y-5 p-5 sm:p-7">
      {loading && <p role="status">Recherche de la référence…</p>}
      {error && <p role="alert" className="text-destructive">{error}</p>}
      {record && <>
        <h2 className="text-xl font-semibold">{record.status === 'issued' ? 'Référence enregistrée' : record.status === 'revoked' ? 'Document retiré' : 'Émission en préparation'}</h2>
        <p className={record.status === 'revoked' ? 'text-destructive' : 'text-muted-foreground'}>{record.message}</p>
        <dl className="space-y-4 text-sm">
          <div><dt className="text-muted-foreground">Identifiant numérique</dt><dd className="break-all font-mono text-lg font-semibold">{record.digital_identifier}</dd></div>
          <div><dt className="text-muted-foreground">Type de document</dt><dd>{record.document_type}</dd></div>
          {record.issued_at && <div><dt className="text-muted-foreground">Émission</dt><dd>{new Date(record.issued_at).toLocaleString('fr-FR')}</dd></div>}
          {record.page_count && <div><dt className="text-muted-foreground">Pages</dt><dd>{record.page_count}</dd></div>}
          {record.file_sha256 && <div><dt className="text-muted-foreground">Empreinte SHA-256 du PDF archivé</dt><dd className="break-all font-mono text-xs">{record.file_sha256}</dd></div>}
        </dl>
        {record.status === 'issued' && <section className="space-y-3 border-t pt-4" aria-label="Contrôle du fichier PDF">
          <label htmlFor="registry-pdf-file" className="block text-sm font-medium">Comparer mon fichier PDF avec l’archive</label>
          <input id="registry-pdf-file" type="file" accept="application/pdf,.pdf" disabled={checking} onChange={event => void verifyFile(event.target.files?.[0])} className="block w-full text-sm" />
          <p className="text-xs text-muted-foreground">Le calcul reste dans votre navigateur; votre fichier n’est pas envoyé au serveur.</p>
          {checking && <p role="status">Calcul de l’empreinte…</p>}
          {match === true && <p role="status" className="font-medium text-success">Le fichier correspond exactement au PDF archivé.</p>}
          {match === false && <p role="alert" className="font-medium text-destructive">Le fichier ne correspond pas à l’archive. Vérifiez la version auprès du service émetteur.</p>}
          {fileError && <p role="alert" className="text-destructive">{fileError}</p>}
        </section>}
        <p className="border-t pt-4 text-xs text-muted-foreground">L’enregistrement et l’intégrité du fichier ne remplacent pas les signatures et visas requis par le circuit administratif.</p>
      </>}
    </Card>
  </div></main>
}
