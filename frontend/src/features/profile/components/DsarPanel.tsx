import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  ShieldCheck, 
  Download, 
  Loader2, 
  Eye, 
  FileText, 
  Lock, 
  Scale, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink,
  Info,
  X
} from 'lucide-react'
import api from '@shared/lib/api'
import { toast } from 'sonner'

type DsarRequest = {
  id: number
  request_type?: string
  status: string
  created_at: string
  processed_at?: string | null
  notes?: string | null
  pdf_url?: string
  preview_url?: string
  download_url?: string
}

export function DsarPanel() {
  const queryClient = useQueryClient()
  const [activeRight, setActiveRight] = useState<'access' | 'rectification' | 'opposition'>('access')
  const [notes, setNotes] = useState('')
  
  // PDF Preview Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<number | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['privacy-dsar'],
    queryFn: () => api.get('/v1/privacy/export').then((res) => res.data.data as DsarRequest[]),
  })

  const downloadExport = async (id: number, format?: 'pdf' | 'json') => {
    try {
      const urlPath = format ? `/v1/privacy/export/${id}/download?format=${format}` : `/v1/privacy/export/${id}/download`
      const res = await api.get(urlPath, { 
        responseType: 'blob' 
      })
      const isJson = format === 'json' || (res.data?.type && res.data.type.includes('json'))
      const mimeType = isJson ? 'application/json' : 'application/pdf'
      const ext = isJson ? 'json' : 'pdf'
      const url = window.URL.createObjectURL(new Blob([res.data], { type: mimeType }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Rapport-CNDP-Donnees-Personnelles-${id}.${ext}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success(isJson ? 'Fichier JSON téléchargé.' : 'Rapport officiel PDF CNDP téléchargé avec succès.')
    } catch {
      toast.error('Export indisponible pour le moment.')
    }
  }

  const handleOpenPreview = async (id: number) => {
    setIsPreviewLoading(true)
    setPreviewId(id)
    try {
      const res = await api.get(`/v1/privacy/export/${id}/preview`, { 
        responseType: 'blob' 
      })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      setPreviewBlobUrl(url)
      setIsPreviewOpen(true)
    } catch {
      toast.error('Impossible de générer l\'aperçu du document CNDP.')
    } finally {
      setIsPreviewLoading(false)
    }
  }

  const handleClosePreview = () => {
    setIsPreviewOpen(false)
    if (previewBlobUrl) {
      window.URL.revokeObjectURL(previewBlobUrl)
      setPreviewBlobUrl(null)
    }
    setPreviewId(null)
  }

  const mutation = useMutation({
    mutationFn: async (type: 'access' | 'rectification' | 'opposition') => {
      const path = type === 'access' ? '/v1/privacy/export' : `/v1/privacy/${type}`
      return api.post(path, { 
        notes: notes || undefined,
        format: 'pdf'
      })
    },
    onSuccess: (_, type) => {
      toast.success(
        type === 'access'
          ? 'Demande d’accès enregistrée. Votre rapport officiel PDF est prêt.'
          : type === 'rectification'
            ? 'Demande de rectification transmise avec succès au Service de la Scolarité.'
            : 'Demande d’opposition enregistrée pour instruction réglementaire.',
      )
      setNotes('')
      queryClient.invalidateQueries({ queryKey: ['privacy-dsar'] })
    },
    onError: () => toast.error('Impossible d’enregistrer la demande CNDP.'),
  })

  return (
    <div data-testid="dsar-panel" className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
      {/* Header Banner with Official CNDP Compliance Theme */}
      <div className="bg-gradient-to-r from-[#002e5b] via-[#0b3b72] to-[#124b8f] p-6 md:p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Conformité CNDP
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white/90">
                  Loi n° 09-08
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Protection des Données & Droits CNDP
              </h2>
              <p className="text-xs text-blue-100/80 mt-1 max-w-2xl leading-relaxed">
                L'ENCG Fès garantit l'exercice de vos droits fondamentaux : Droit d'Accès (Art. 7), Droit de Rectification (Art. 8) et Droit d'Opposition (Art. 9) sous la supervision de la Commission Nationale de contrôle de la protection des Données à caractère Personnel.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-3.5 py-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <div className="text-[11px] font-medium text-white/90">
              <span className="block font-bold">Chiffrement SSL & Audit</span>
              <span className="text-white/70 text-[10px]">Traçabilité institutionnelle</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-8">
        {/* The 3 Rights Explanatory Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div 
            onClick={() => setActiveRight('access')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${
              activeRight === 'access' 
                ? 'bg-blue-50/70 border-[#002e5b] ring-2 ring-[#002e5b]/10 shadow-sm' 
                : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                activeRight === 'access' ? 'bg-[#002e5b] text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Article 7</span>
                <h4 className="text-sm font-bold text-slate-800">Droit d'Accès</h4>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Obtenir un <strong>Bordereau Officiel PDF</strong> certifié contenant l'exhaustivité de vos données d'identité, coordonnées et statut académique.
            </p>
          </div>

          <div 
            onClick={() => setActiveRight('rectification')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${
              activeRight === 'rectification' 
                ? 'bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-600/10 shadow-sm' 
                : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                activeRight === 'rectification' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Article 8</span>
                <h4 className="text-sm font-bold text-slate-800">Droit de Rectification</h4>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Signaler une correction ou une inexactitude (CIN, numéro de téléphone, adresse) directement au <strong>Service de la Scolarité</strong>.
            </p>
          </div>

          <div 
            onClick={() => setActiveRight('opposition')}
            className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${
              activeRight === 'opposition' 
                ? 'bg-amber-50/70 border-amber-600 ring-2 ring-amber-600/10 shadow-sm' 
                : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                activeRight === 'opposition' ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                <AlertCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Article 9</span>
                <h4 className="text-sm font-bold text-slate-800">Droit d'Opposition</h4>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Exercer votre droit d'opposition à des traitements secondaires. Les données pédagogiques obligatoires restent conservées selon la loi.
            </p>
          </div>
        </div>

        {/* Action Input Section */}
        <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              {activeRight === 'access' && "Demander une copie certifiée de vos données (Rapport PDF)"}
              {activeRight === 'rectification' && "Détaillez la correction souhaitée (ex: numéro CIN erroné, nouveau téléphone)"}
              {activeRight === 'opposition' && "Motif légitime d'opposition au traitement"}
            </label>
            <span className="text-[11px] font-medium text-slate-400">
              {activeRight === 'access' ? 'Optionnel' : 'Requis pour instruction'}
            </span>
          </div>

          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              activeRight === 'access'
                ? "Précisez un motif ou une observation si nécessaire (ex: transmission pour dossier de visa, stage à l'étranger)..."
                : activeRight === 'rectification'
                ? "Exemple : 'Mon numéro de CIN comporte une erreur, il s'agit de F598711 au lieu de F598710. Merci de rectifier mon dossier scolarité.'"
                : "Exemple : 'Je sollicite l'opposition à l'affichage de mes coordonnées sur l'annuaire public des étudiants.'"
            }
            className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-sm text-slate-800 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition-all min-h-[90px] shadow-sm"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Génération instantanée du rapport certifié avec QR Code et empreinte SHA-256</span>
            </div>

            <div className="flex items-center gap-2.5">
              {activeRight === 'access' && (
                <button
                  type="button"
                  data-testid="dsar-access"
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate('access')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#002e5b] hover:bg-[#0b3b72] text-white text-xs font-bold transition-all shadow-sm hover:shadow active:scale-[0.98] disabled:opacity-60"
                >
                  {mutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileText className="w-3.5 h-3.5" />
                  )}
                  Générer mon Rapport Officiel (PDF)
                </button>
              )}

              {activeRight === 'rectification' && (
                <button
                  type="button"
                  data-testid="dsar-rectification"
                  disabled={mutation.isPending || !notes.trim()}
                  onClick={() => mutation.mutate('rectification')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm hover:shadow active:scale-[0.98] disabled:opacity-50"
                >
                  {mutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Scale className="w-3.5 h-3.5" />
                  )}
                  Transmettre la Demande de Rectification
                </button>
              )}

              {activeRight === 'opposition' && (
                <button
                  type="button"
                  data-testid="dsar-opposition"
                  disabled={mutation.isPending || !notes.trim()}
                  onClick={() => mutation.mutate('opposition')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm hover:shadow active:scale-[0.98] disabled:opacity-50"
                >
                  {mutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5" />
                  )}
                  Déposer une Demande d'Opposition
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Existing Requests List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#002e5b]" />
              Historique des Demandes CNDP ({data?.length || 0})
            </h3>
            <span className="text-xs text-slate-400">Archivage légal Loi 09-08</span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500 bg-slate-50 rounded-2xl">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> Chargement des demandes DSAR…
            </div>
          ) : (data ?? []).length === 0 ? (
            <div className="text-center py-8 px-4 bg-slate-50/60 border border-slate-200/60 rounded-2xl">
              <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600">Aucune demande CNDP enregistrée pour le moment</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Cliquez sur "Générer mon Rapport Officiel (PDF)" ci-dessus pour obtenir votre bordereau certifié.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {(data ?? []).map((item) => {
                const isAccess = (item.request_type ?? 'access') === 'access'
                const isRectification = item.request_type === 'rectification'
                const isOpposition = item.request_type === 'opposition'
                const isCompleted = item.status === 'completed' || isAccess

                return (
                  <div 
                    key={item.id} 
                    className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                          isAccess 
                            ? 'bg-blue-100 text-[#002e5b] border border-blue-200' 
                            : isRectification 
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' 
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {isAccess && "Accès aux données (Art. 7)"}
                          {isRectification && "Rectification (Art. 8)"}
                          {isOpposition && "Opposition (Art. 9)"}
                        </span>

                        <span className="text-xs font-mono font-bold text-slate-500">
                          Réf: CNDP-{new Date(item.created_at).getFullYear()}-{String(item.id).padStart(4, '0')}
                        </span>

                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          isCompleted 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {isCompleted ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {isAccess ? 'Rapport Certifié Prêt' : 'Traitée par la scolarité'}
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-600 animate-pulse" />
                              En cours d'instruction
                            </>
                          )}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span>Déposée le {new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        {item.notes && (
                          <>
                            <span>•</span>
                            <span className="italic text-slate-600 line-clamp-1 max-w-md">"{item.notes}"</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isAccess && (
                        <>
                          {/* In-app Preview Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenPreview(item.id)}
                            disabled={isPreviewLoading && previewId === item.id}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors border border-slate-200/80 active:scale-95"
                          >
                            {isPreviewLoading && previewId === item.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Eye className="w-3.5 h-3.5 text-slate-600" />
                            )}
                            Aperçu
                          </button>

                          {/* Official Certified PDF Download Button */}
                          <button
                            type="button"
                            data-testid="dsar-download"
                            onClick={() => downloadExport(item.id)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-xs hover:shadow active:scale-95"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Télécharger PDF
                          </button>

                          {/* Raw JSON option for tech/compliance audits */}
                          <button
                            type="button"
                            onClick={() => downloadExport(item.id, 'json')}
                            title="Télécharger l'export JSON technique"
                            className="px-2.5 py-2 rounded-xl text-[11px] font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            JSON
                          </button>
                        </>
                      )}

                      {!isAccess && (
                        <div className="text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                          {isCompleted ? "Instruction clôturée" : "Dossier transmis au DPO"}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Official CNDP PDF Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#002e5b] flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Bordereau Officiel d'Accès aux Données Personnelles (Loi 09-08)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Réf : CNDP-{previewId ? String(previewId).padStart(4, '0') : ''} • Émis par l'ENCG Fès (USMBA)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {previewBlobUrl && (
                  <>
                    <a
                      href={previewBlobUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-white transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Plein écran
                    </a>
                    <button
                      type="button"
                      onClick={() => previewId && downloadExport(previewId, 'pdf')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Télécharger PDF
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={handleClosePreview}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content - Live Certified PDF */}
            <div className="flex-1 bg-slate-100 p-2 md:p-4 overflow-hidden">
              {previewBlobUrl ? (
                <iframe
                  src={`${previewBlobUrl}#toolbar=1`}
                  className="w-full h-full rounded-2xl border border-slate-200 shadow-sm bg-white"
                  title="Aperçu du Rapport CNDP"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
