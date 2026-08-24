import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShieldCheck, Download, Loader2 } from 'lucide-react'
import api from '@shared/lib/api'
import { toast } from 'sonner'

type DsarRequest = {
  id: number
  request_type?: string
  status: string
  created_at: string
  file_path?: string | null
}

export function DsarPanel() {
  const queryClient = useQueryClient()
  const [notes, setNotes] = useState('')
  const { data, isLoading } = useQuery({
    queryKey: ['privacy-dsar'],
    queryFn: () => api.get('/v1/privacy/export').then((res) => res.data.data as DsarRequest[]),
  })

  const mutation = useMutation({
    mutationFn: async (type: 'access' | 'rectification' | 'opposition') => {
      const path = type === 'access' ? '/v1/privacy/export' : `/v1/privacy/${type}`
      return api.post(path, { notes: notes || undefined })
    },
    onSuccess: (_, type) => {
      toast.success(
        type === 'access'
          ? 'Demande d’accès (DSAR) enregistrée.'
          : type === 'rectification'
            ? 'Demande de rectification enregistrée.'
            : 'Demande d’opposition enregistrée.',
      )
      setNotes('')
      queryClient.invalidateQueries({ queryKey: ['privacy-dsar'] })
    },
    onError: () => toast.error('Impossible d’enregistrer la demande CNDP.'),
  })

  return (
    <div data-testid="dsar-panel" className="bg-white border border-slate-100 rounded-[1.5rem] shadow-sm p-8 md:p-12">
      <div className="mb-6 flex items-start gap-3">
        <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <h2 className="text-xl font-bold text-[#0f2863]">Droits CNDP — Loi 09-08</h2>
          <p className="text-sm text-slate-500 mt-1">
            Droit d’accès (art. 7), de rectification (art. 8) et d’opposition (art. 9). Les dossiers pédagogiques
            restent conservés tant que la scolarité l’exige.
          </p>
        </div>
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Précisez éventuellement la correction demandée ou le motif d’opposition…"
        className="w-full mb-4 rounded-xl border border-slate-200 p-3 text-sm min-h-[80px]"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-6">
        <button
          type="button"
          data-testid="dsar-access"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate('access')}
          className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold disabled:opacity-60"
        >
          Demander une copie (accès)
        </button>
        <button
          type="button"
          data-testid="dsar-rectification"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate('rectification')}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold disabled:opacity-60"
        >
          Rectification
        </button>
        <button
          type="button"
          data-testid="dsar-opposition"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate('opposition')}
          className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-800 text-xs font-bold disabled:opacity-60"
        >
          Opposition
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Chargement des demandes…
        </div>
      ) : (
        <ul className="space-y-2 text-sm">
          {(data ?? []).length === 0 && (
            <li className="text-slate-400">Aucune demande DSAR pour le moment.</li>
          )}
          {(data ?? []).map((item) => (
            <li key={item.id} className="flex items-center justify-between border border-slate-100 rounded-xl px-3 py-2">
              <span>
                {item.request_type ?? 'access'} — {item.status}
              </span>
              {item.status === 'completed' && (
                <a
                  href={`/api/v1/privacy/export/${item.id}/download`}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600"
                >
                  <Download className="w-3 h-3" /> Télécharger
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
