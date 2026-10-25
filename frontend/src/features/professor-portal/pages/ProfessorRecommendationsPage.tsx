import { useState } from 'react'
import {
FileText,Sparkles,Loader2,ShieldCheck,User,CheckCircle2
} from 'lucide-react'
import { useQuery,useMutation,useQueryClient } from '@tanstack/react-query'
import api from '@shared/lib/api'
import { cn } from '@shared/lib/utils'
import { toast } from 'sonner'

export default function ProfessorRecommendationsPage() {
  const qc = useQueryClient()
  const [selectedRequest, setSelectedRequest] = useState<any>(null)
  const [editedLetter, setEditedLetter] = useState('')
  const [deliveryMethod, setDeliveryMethod] = useState<'platform' | 'email' | 'both'>('both')

  const { data, isLoading } = useQuery({
    queryKey: ['professor-recommendation-requests'],
    queryFn: async () => {
      const res = await api.get('/professor/recommendations')
      return res.data?.requests ?? []
    }
  })

  const requests: any[] = data ?? []

  const approveMutation = useMutation({
    mutationFn: ({ id, content, method }: { id: number; content: string; method: string }) =>
      api.post(`/professor/recommendations/${id}/approve`, {
        letter_content: content,
        delivery_method: method
      }),
    onSuccess: () => {
      toast.success('Lettre signée et transmise à l\'étudiant avec succès !')
      setSelectedRequest(null)
      qc.invalidateQueries({ queryKey: ['professor-recommendation-requests'] })
    },
    onError: () => toast.error('Erreur lors de la validation')
  })

  return (
    <div className="max-w-[1500px] mx-auto space-y-8 font-sans animate-in fade-in pb-24">
      {/* Hero Header */}
      <div className="relative overflow-hidden p-8 md:p-10 text-white border border-blue-800/40 erp-page-banner">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-amber-300 shadow-sm shrink-0">
              <FileText className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-200 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2 border border-purple-400/30">
                <Sparkles className="w-4 h-4 text-amber-400" /> Aide à la Décision IA & Signature Électronique
              </div>
              <h1 className="text-white leading-tight erp-page-title">
                Demandes de Lettres de Recommandation
              </h1>
              <p className="text-blue-100/90 text-xs md:text-sm font-medium mt-1 max-w-2xl">
                Évaluez l'éligibilité académique calculée par l'IA, révisez le projet de lettre généré automatiquement et signez électroniquement pour un envoi direct ou par email.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Request List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="font-bold text-sm uppercase tracking-wider text-slate-400">
            Demandes Reçues ({requests.length})
          </h2>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : requests.length === 0 ? (
            <div className="bg-card dark:bg-card rounded-2xl p-8 text-center border border-border dark:border-border text-slate-400 text-xs font-medium space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <p>Aucune demande en attente.</p>
            </div>
          ) : (
            requests.map(req => (
              <div
                key={req.id}
                onClick={() => {
                  setSelectedRequest(req)
                  setEditedLetter(req.ai_recommendation_text || '')
                  setDeliveryMethod(req.delivery_method || 'both')
                }}
                className={cn(
                  "bg-card dark:bg-card rounded-2xl p-5 border shadow-sm cursor-pointer transition-all space-y-3",
                  selectedRequest?.id === req.id
                    ? "border-primary ring-2 ring-indigo-500/20"
                    : "border-border dark:border-border hover:border-primary/20"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground dark:text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" /> {req.student_name ?? 'Étudiant ENCG'}
                  </span>
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase",
                    req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  )}>
                    {req.status === 'approved' ? '✅ Approuvée' : '⏳ En attente'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Modèle : {req.purpose}</span>
                  <span className="font-bold text-primary bg-primary/5 dark:bg-indigo-950/50 px-2 py-0.5 rounded-lg border border-primary/20 dark:border-primary">
                    IA Score : {req.ai_eligibility_score ?? '90%'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right: Decision Support & Signature Workspace */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedRequest ? (
            <div className="bg-muted/50 dark:bg-card rounded-2xl border border-dashed border-slate-300 dark:border-border p-16 text-center text-slate-400 space-y-3">
              <FileText className="w-12 h-12 mx-auto text-indigo-400/40" />
              <h3 className="font-bold text-sm text-muted-foreground dark:text-foreground">Sélectionnez une demande à évaluer</h3>
              <p className="text-xs">L'IA calculera le score d'éligibilité et générera le projet de lettre prêt à être signé.</p>
            </div>
          ) : (
            <div className="bg-card dark:bg-card rounded-2xl border border-border dark:border-border p-6 space-y-6 shadow-sm">
              
              {/* Header & Eligibility Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-primary/5 dark:bg-indigo-950/40 rounded-2xl border border-primary/20 dark:border-primary">
                <div>
                  <h3 className="font-bold text-base text-foreground dark:text-white">{selectedRequest.student_name}</h3>
                  <p className="text-xs font-bold text-muted-foreground">{selectedRequest.filiere_name ?? 'Commerce & Gestion'} | Motif : {selectedRequest.purpose}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase text-indigo-400 block">Éligibilité Académique IA</span>
                    <span className="text-xl font-bold text-primary font-mono">{selectedRequest.ai_eligibility_score ?? '92%'}</span>
                  </div>
                  <ShieldCheck className="w-8 h-8 text-emerald-500" />
                </div>
              </div>

              {/* Letter Draft Workspace */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase text-slate-400">Projet de Lettre Généré par Gemini IA (Modifiable)</label>
                <textarea
                  rows={10}
                  value={editedLetter}
                  onChange={e => setEditedLetter(e.target.value)}
                  className="w-full p-4 bg-muted/50 dark:bg-card border border-border dark:border-border text-xs font-medium leading-relaxed resize-none outline-none focus:ring-2 focus:ring-indigo-500/30 rounded-[var(--control-radius)]"
                />
              </div>

              {/* Delivery Choice */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase text-slate-400">Mode d'Envoi & Transmission</label>
                <div className="flex items-center gap-3 flex-wrap">
                  {[
                    { key: 'platform', label: '📱 Plateforme Uniquement (PDF Espace Étudiant)' },
                    { key: 'email', label: '📧 Email Uniquement (Resend Mailer)' },
                    { key: 'both', label: '🌐 Plateforme + Email (Recommandé)' },
                  ].map(m => (
                    <button
                      key={m.key}
                      onClick={() => setDeliveryMethod(m.key as any)}
                      className={cn(
                        "px-4 py-2 rounded-2xl text-xs font-bold border transition-all cursor-pointer",
                        deliveryMethod === m.key
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/50 dark:bg-card text-muted-foreground dark:text-foreground border-border dark:border-border"
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sign & Submit */}
              <button
                onClick={() => approveMutation.mutate({
                  id: selectedRequest.id,
                  content: editedLetter,
                  method: deliveryMethod
                })}
                disabled={approveMutation.isPending}
                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:opacity-90 text-white font-bold rounded-2xl transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-40"
              >
                {approveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-5 h-5 text-amber-300" />}
                Signer Électroniquement et Transmettre la Lettre
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
