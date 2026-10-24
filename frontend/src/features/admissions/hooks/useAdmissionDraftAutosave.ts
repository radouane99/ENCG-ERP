import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import api from '@shared/lib/api'
import { errorMessage } from '../api/workflow'
import { workflowBase, type AdmissionDossier } from '../model/workflow'
export type AdmissionDraft = Record<string, string | number | boolean | null>

export function useAdmissionDraftAutosave(app: AdmissionDossier | undefined, values: AdmissionDraft, dirty: boolean, setDirty: Dispatch<SetStateAction<boolean>>, blocked: boolean, onSaved: (app: AdmissionDossier) => void) {
  const cache = useQueryClient(); const valuesRef = useRef(values); const savedRef = useRef<AdmissionDraft | null>(null)
  const task = useRef<Promise<AdmissionDossier> | null>(null); const conflictRef = useRef(false)
  const [saving, setSaving] = useState(false); const [savedAt, setSavedAt] = useState<string | null>(null)
  const [error, setError] = useState(''); const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({}); const [conflict, setConflict] = useState(false)
  const [retry, setRetry] = useState(0); const id = app?.id
  useEffect(() => { valuesRef.current = values }, [values])
  const save = useCallback(async function saveDraft(): Promise<AdmissionDossier> {
    if (!id) throw new Error('Dossier indisponible')
    if (conflictRef.current) throw new Error('Le dossier a changé ailleurs. Chargez la version enregistrée avant de continuer.')
    if (task.current) { const result = await task.current; return valuesRef.current === savedRef.current ? result : saveDraft() }
    const current = cache.getQueryData<AdmissionDossier>(['admission-dossier', 'mine'])
    if (!current || current.id !== id) throw new Error('Actualisez le dossier avant de sauvegarder.')
    const snapshot = valuesRef.current; setSaving(true); setError('')
    const pending = (async () => {
      try {
        const response = await api.post<{ candidate: AdmissionDossier }>(`${workflowBase}/dossier`, { ...snapshot, application_id: id, version: current.version })
        if (!response.data.candidate?.id) throw new Error('La sauvegarde n’a pas été confirmée. Réessayez.')
        savedRef.current = snapshot; onSaved(response.data.candidate)
        if (valuesRef.current === snapshot) setDirty(false)
        setFieldErrors({}); setSavedAt(new Date().toISOString()); return response.data.candidate
      } catch (err) {
        const failure = err as { response?: { status?: number; data?: { errors?: Record<string, string[]> } } }
        setFieldErrors(Object.fromEntries(Object.entries(failure.response?.data?.errors ?? {}).map(([key, messages]) => [key, messages.join(' ')])))
        if (failure.response?.status === 409) { conflictRef.current = true; setConflict(true) }
        setError(errorMessage(err)); throw err
      } finally { task.current = null; setSaving(false) }
    })()
    task.current = pending; return pending
  }, [id, cache, onSaved, setDirty])
  const editable = !!app && ['draft', 'needs_correction'].includes(app.dossier_status) && app.eligibility !== 'invitation_expired' && (!app.invitation_expires_at || new Date(app.invitation_expires_at).getTime() >= Date.now())
  useEffect(() => {
    if (!editable || !dirty || blocked || conflict) return
    const timer = window.setTimeout(() => { void save().catch(() => {}) }, 1500)
    return () => window.clearTimeout(timer)
  }, [values, dirty, editable, blocked, conflict, save, retry])
  useEffect(() => { const online = () => setRetry(r => r + 1); window.addEventListener('online', online); return () => window.removeEventListener('online', online) }, [])
  const reset = useCallback(() => { conflictRef.current = false; setConflict(false); setError(''); setFieldErrors({}); savedRef.current = null }, [])
  return { save, saving, savedAt, error, fieldErrors, conflict, reset, retry: () => setRetry(r => r + 1) }
}
