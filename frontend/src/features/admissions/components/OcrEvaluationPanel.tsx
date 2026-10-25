import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@shared/components/ui/Button'
import { evaluateOcr } from '../api/ocrEvaluation'
import { errorMessage } from '../api/workflow'
import { documentLabels, type DocumentType } from '../model/workflow'

export default function OcrEvaluationPanel() {
  const [file, setFile] = useState<File | null>(null); const [authorized, setAuthorized] = useState(false)
  const evaluation = useMutation({ mutationFn: () => evaluateOcr(file!) })
  const report = evaluation.data
  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }))
    const link = document.createElement('a'); link.href = url; link.download = 'rapport-recette-ocr.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return <section aria-label="Recette OCR" className="mt-6 rounded-xl border border-border bg-card p-4 sm:p-5">
    <h3 className="font-semibold">Recette OCR · comparer les annotations</h3>
    <p className="mt-2 text-sm text-muted-foreground">Comparez les valeurs vérifiées par un agent aux valeurs extraites par le parcours OCR existant. Cet outil ne lance pas d’extraction et n’envoie aucun document à un fournisseur externe.</p>
    <a className="mt-3 inline-flex min-h-11 items-center text-sm text-primary underline dark:text-blue-300" href="/templates/ocr-evaluation.json" download>Télécharger le modèle synthétique JSON</a>
    <form onSubmit={e => { e.preventDefault(); if (file && authorized) evaluation.mutate() }} className="mt-3 space-y-4">
      <label className="block text-sm">Annotations attendues et extraites · JSON, 2 Mo maximum<input className="mt-2 block w-full text-sm" type="file" accept=".json,application/json" disabled={evaluation.isPending} onChange={e => { setFile(e.target.files?.[0] ?? null); setAuthorized(false); evaluation.reset() }} /></label>
      <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1" checked={authorized} disabled={evaluation.isPending} onChange={e => setAuthorized(e.target.checked)} />J’atteste que ces annotations sont synthétiques ou autorisées et que les valeurs attendues ont été vérifiées par un agent.</label>
      {evaluation.error && <p role="alert" className="text-sm text-red-700">{errorMessage(evaluation.error)}</p>}
      <Button type="submit" disabled={!file || !authorized} isLoading={evaluation.isPending}>Comparer les annotations</Button>
    </form>
    {report && <div className="mt-5 space-y-4"><p role="status" className="rounded-xl bg-primary/5 p-3 text-sm text-blue-950">{report.dataset_kind === 'synthetic' ? 'Jeu synthétique : résultat de démonstration, sans mesure de précision sur des documents réels.' : 'Annotations autorisées : résultat limité à cet échantillon vérifié.'}</p>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">{[['Échantillons', report.samples], ['Champs annotés', report.totals.labeled], ['Correspondances exactes', `${report.exact_match_percent ?? '—'} %`], ['Écarts critiques', report.totals.critical_mismatches]].map(([label, value]) => <div key={label} className="min-w-0 rounded-xl border border-border p-3"><dt className="break-words text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-xl font-semibold">{value}</dd></div>)}</dl>
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['Type de pièce', 'Champs', 'Exacts', 'Absents', 'Différents'].map(label => <th key={label} className="p-2">{label}</th>)}</tr></thead><tbody>{Object.entries(report.by_document_type).map(([type, counts]) => <tr key={type} className="border-t border-border"><td className="p-2">{documentLabels[type as DocumentType] ?? type}</td><td className="p-2">{counts.labeled}</td><td className="p-2">{counts.exact}</td><td className="p-2">{counts.missing}</td><td className="p-2">{counts.mismatched}</td></tr>)}</tbody></table></div>
      <p className="text-xs text-muted-foreground">{report.notice} Le rapport agrégé ne contient aucune valeur personnelle et n’est pas une décision d’admission.</p><Button variant="outline" className="h-auto max-w-full whitespace-normal text-center" onClick={download}>Télécharger le rapport agrégé</Button>
    </div>}
  </section>
}
