import React, { useState } from 'react'
import {
  FileText, Sparkles, Send, Download, Loader2, CheckCircle2, Clock, ShieldCheck, Plus
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@shared/lib/api'
import { cn } from '@shared/lib/utils'
import { toast } from 'sonner'

export default function StudentRecommendationsPage() {
  const qc = useQueryClient()
  const [purpose, setPurpose] = useState('Master / Mobilité Internationale')
  const [professorId] = useState(1)
  const [deliveryMethod, setDeliveryMethod] = useState<'both' | 'platform' | 'email'>('both')

  const { data: requestsData, isLoading: isRequestsLoading } = useQuery({
    queryKey: ['student-recommendation-requests'],
    queryFn: async () => {
      const res = await api.get('/student/recommendations')
      return res.data?.requests ?? []
    }
  })

  const submitMutation = useMutation({
    mutationFn: (payload: any) => api.post('/student/recommendations/request', payload),
    onSuccess: (res) => {
      toast.success(res.data?.message ?? 'Demande soumise au professeur !')
      qc.invalidateQueries({ queryKey: ['student-recommendation-requests'] })
    },
    onError: () => toast.error('Erreur lors de la soumission de la demande.')
  })

  const requests: any[] = requestsData ?? []

  const handleDownloadPdf = (req: any) => {
    // Generate simple printable version
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Lettre de Recommandation — ENCG Fès</title>
            <style>
              body { font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6; color: #111; }
              .header { text-align: center; border-bottom: 2px solid #0f2863; padding-bottom: 15px; margin-bottom: 30px; }
              .header h1 { font-size: 18px; margin: 0; color: #0f2863; font-family: Arial, sans-serif; }
              .header p { font-size: 12px; margin: 5px 0 0 0; color: #555; }
              .content { font-size: 14px; text-align: justify; margin-bottom: 40px; }
              .signature { text-align: right; margin-top: 50px; font-weight: bold; }
              .qr-box { margin-top: 40px; padding: 15px; border: 1px solid #ccc; font-size: 11px; text-align: center; background: #f9f9f9; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>ÉCOLE NATIONALE DE COMMERCE ET DE GESTION DE FÈS</h1>
              <p>Université Sidi Mohamed Ben Abdellah — Direction des Études</p>
            </div>
            <div class="content">
              ${req.ai_recommendation_text ? req.ai_recommendation_text.replace(/\n/g, '<br/>') : 'Lettre de recommandation académique officielle.'}
            </div>
            <div class="signature">
              <p>Pr. ${req.professor_name ?? 'Enseignant Chercheur'}</p>
              <p style="font-size: 11px; color: #555;">Signé électroniquement le ${req.signed_at ? new Date(req.signed_at).toLocaleDateString('fr-FR') : 'Récemment'}</p>
            </div>
            <div class="qr-box">
              🔒 Document Officiel Authentifié — Validation par QR Code ENCG Fès (ID: REC-${req.id})
            </div>
            <script>window.print();</script>
          </body>
        </html>
      `)
      printWindow.document.close()
    }
  }

  return (
    <div className="max-w-[1500px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in pb-24">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-amber-300 shadow-2xl shrink-0">
              <FileText className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-purple-400/30">
                <Sparkles className="w-4 h-4 text-amber-400" /> Demandes & Recommandations Intelligentes IA
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                Demander une Lettre de Recommandation
              </h1>
              <p className="text-blue-100/90 text-xs md:text-sm font-medium mt-1 max-w-2xl">
                Demandez une lettre de recommandation officielle à vos professeurs pour vos candidatures en Master, Stage PFE ou Mobilité Internationale.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Request Form */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-600" /> Nouvelle Demande
          </h2>

          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Objet / Motif de la Demande</label>
            <input
              type="text"
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              placeholder="Ex: Candidature Master Audit & Finance / Bourse Mobilité"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-400 mb-1.5">Mode de Réception Souhaité</label>
            <select
              value={deliveryMethod}
              onChange={e => setDeliveryMethod(e.target.value as any)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold"
            >
              <option value="both">🌐 Espace Étudiant PDF + Envoi par Email</option>
              <option value="platform">📱 Espace Étudiant PDF Uniquement</option>
              <option value="email">📧 Envoi par Email Uniquement</option>
            </select>
          </div>

          <button
            onClick={() => submitMutation.mutate({
              professor_id: professorId,
              purpose: purpose,
              delivery_method: deliveryMethod
            })}
            disabled={submitMutation.isPending}
            className="w-full py-4 bg-gradient-to-r from-[#0f2863] to-indigo-700 hover:opacity-90 text-white font-black rounded-2xl transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-40"
          >
            {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-amber-300" />}
            Envoyer la Demande au Professeur
          </button>
        </div>

        {/* Right: Submitted Requests List & Downloads */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="font-black text-sm uppercase tracking-wider text-slate-400">
            Mes Demandes & Lettres Téléchargeables ({requests.length})
          </h2>

          {isRequestsLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-indigo-600" /></div>
          ) : requests.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-12 text-center border border-slate-200 dark:border-slate-800 text-slate-400 text-xs font-medium space-y-2">
              <FileText className="w-8 h-8 text-indigo-400/40 mx-auto" />
              <p>Vous n'avez pas encore effectué de demande de lettre de recommandation.</p>
            </div>
          ) : (
            requests.map(req => (
              <div
                key={req.id}
                className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-black text-base text-slate-900 dark:text-white block">{req.purpose}</span>
                    <span className="text-xs font-bold text-slate-500">Destinataire : Pr. {req.professor_name ?? 'Enseignant Chercheur'}</span>
                  </div>
                  <span className={cn(
                    'px-3 py-1 rounded-full text-xs font-black uppercase inline-flex items-center gap-1.5 self-start sm:self-auto',
                    req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  )}>
                    {req.status === 'approved' ? <><CheckCircle2 className="w-4 h-4" /> Approuvée & Signée</> : <><Clock className="w-4 h-4" /> En Cours d'Évaluation</>}
                  </span>
                </div>

                {req.status === 'approved' && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" /> Signé électroniquement le {req.signed_at ? new Date(req.signed_at).toLocaleDateString('fr-FR') : 'récemment'}
                    </span>
                    <button
                      onClick={() => handleDownloadPdf(req)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Download className="w-4 h-4" /> Télécharger Lettre PDF
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
