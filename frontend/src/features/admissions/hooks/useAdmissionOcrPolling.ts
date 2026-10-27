import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import api from '@shared/lib/api'
import { workflowBase, type AdmissionDossier, type OcrRun } from '../model/workflow'

export function useAdmissionOcrPolling(app: AdmissionDossier | undefined, run: OcrRun | null, onRun: (run: OcrRun) => void) {
  const cache = useQueryClient()
  useEffect(() => {
    if (!app) return
    const documents = new Set(Object.values(app.documents).map(doc => doc?.id))
    const all = new Map((app.ocr_runs ?? []).map(item => [item.id, item]))
    if (run) all.set(run.id, run)
    const pending = [...all.values()].filter(item => documents.has(item.document_id) && ['queued', 'processing'].includes(item.status))
    if (!pending.length) return
    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      void Promise.all(pending.map(async item => {
        try {
          const response = await api.get<OcrRun>(`${workflowBase}/ocr/${item.id}`, { signal: controller.signal })
          if (controller.signal.aborted) return
          cache.setQueryData<AdmissionDossier>(['admission-dossier', 'mine'], current => current?.id === app.id ? { ...current, ocr_runs: [...(current.ocr_runs ?? []).filter(value => value.id !== item.id), response.data] } : current)
          if (run?.id === item.id) onRun(response.data)
        } catch {
          // Refetch on the next poll; temporary network errors do not discard a deposited document.
          if (!controller.signal.aborted) onRun({ ...item })
        }
      }))
    }, 1800)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [app, run, cache, onRun])
}
