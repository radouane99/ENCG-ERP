import { useState, useEffect } from 'react'
import { FileText, Download, CalendarDays, Clock, MapPin, Smartphone, AlertTriangle, PlusCircle, MessageSquare, Upload, Loader2, Bot, X } from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { examsApi } from '@shared/api/exams'
import { toast } from 'sonner'

export default function StudentMyConvocationsPage() {
  const { data: convocations, isLoading } = useQuery({
    queryKey: ['my-convocations'],
    queryFn: () => examsApi.getStudentConvocations(),
  })

  // State for AI Assistant
  const [activeAiExamId, setActiveAiExamId] = useState<number | null>(null)
  const [aiQuery, setAiQuery] = useState('')
  const [aiResponse, setAiResponse] = useState<string | null>(null)

  // State for Absence
  const [absenceExamId, setAbsenceExamId] = useState<number | null>(null)
  const [absenceReason, setAbsenceReason] = useState('')
  const [absenceFile, setAbsenceFile] = useState<File | null>(null)

  // Mutations
  const declareAbsenceMutation = useMutation({
    mutationFn: (data: FormData) => examsApi.declareAbsence(absenceExamId!, data),
    onSuccess: () => {
      toast.success('Absence déclarée avec succès. Le service de scolarité a été notifié.')
      setAbsenceExamId(null)
      setAbsenceReason('')
      setAbsenceFile(null)
    },
    onError: () => toast.error('Erreur lors de la déclaration d\'absence')
  })

  const askAiMutation = useMutation({
    mutationFn: () => examsApi.askExamAssistant(activeAiExamId!, aiQuery),
    onSuccess: (data: any) => {
      setAiResponse(data.answer)
    },
    onError: () => toast.error('Erreur de communication avec l\'assistant IA')
  })

  // Conflicts checker
  const detectConflicts = (convs: any[]) => {
    const conflicts: any[] = []
    const dates = new Map<string, any[]>()

    convs?.forEach(conv => {
      if (!dates.has(conv.date)) dates.set(conv.date, [])
      dates.get(conv.date)!.push(conv)
    })

    dates.forEach((examsOnDate) => {
      if (examsOnDate.length > 1) {
        // Simple logic: if multiple exams on same day, we consider it a risk of conflict for the UI
        conflicts.push(...examsOnDate)
      }
    })

    return conflicts.length > 0
  }

  const hasConflicts = detectConflicts(convocations || [])

  // Live countdown component
  const LiveCountdown = ({ date, time }: { date: string, time: string }) => {
    const [timeLeft, setTimeLeft] = useState('')

    useEffect(() => {
      const timer = setInterval(() => {
        if (!date || !time) return
        
        // Parse "DD/MM/YYYY" to standard date
        const parts = date.split('/')
        if (parts.length !== 3) return
        
        const targetStr = `${parts[2]}-${parts[1]}-${parts[0]}T${time}:00`
        const target = new Date(targetStr).getTime()
        const now = new Date().getTime()
        const diff = target - now

        if (diff < 0) {
          setTimeLeft('Examen passé')
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24))
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          setTimeLeft(`${days > 0 ? `${days}j ` : ''}${hours}h ${mins}m`)
        }
      }, 1000)

      return () => clearInterval(timer)
    }, [date, time])

    if (!timeLeft) return null

    return (
      <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded text-xs animate-pulse">
        ⏳ {timeLeft}
      </span>
    )
  }

  return (
    <div className="space-y-6 animate-in p-6 max-w-5xl mx-auto pb-20 relative">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#0f2863] italic">Mes Convocations Pro</h1>
          <p className="text-xs text-slate-500">
            Retrouvez vos convocations, alertez en cas d'absence et interagissez avec l'assistant IA
          </p>
        </div>
      </div>

      {hasConflicts && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
          <div className="bg-rose-100 p-2 rounded-full shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h3 className="text-rose-800 font-bold">🚨 Chevauchement Détecté !</h3>
            <p className="text-rose-600 text-sm mt-1">
              Nous avons détecté que vous avez plusieurs examens programmés le même jour. Si les horaires se superposent (chevauchement), veuillez demander un aménagement.
            </p>
            <button className="mt-3 bg-white border border-rose-200 text-rose-700 hover:bg-rose-100 px-4 py-2 rounded-lg text-xs font-bold transition-colors">
              DEMANDER UN AMÉNAGEMENT DE CHEVAUCHEMENT
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center text-slate-500 py-8 bg-white rounded-[2rem] border border-slate-200 shadow-sm">
            Chargement...
          </div>
        ) : (
          convocations?.length === 0 ? (
            <div className="text-center py-8 text-slate-500 bg-white rounded-[2rem] border border-slate-200 shadow-sm">
              Vous n'avez aucune convocation pour le moment.
            </div>
          ) : (
            convocations?.map((conv: any) => (
              <div key={conv.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 hover:border-indigo-300 transition-colors">
                
                {/* Header Convocation */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase bg-indigo-50 px-2 py-1 rounded">
                        {conv.code}
                      </span>
                      <LiveCountdown date={conv.date} time={conv.time} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-4">{conv.module}</h3>
                    
                    <div className="flex flex-wrap gap-3 text-sm font-medium text-slate-600">
                      <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                        <CalendarDays className="w-4 h-4 text-slate-400" /> {conv.date}
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                        <Clock className="w-4 h-4 text-slate-400" /> {conv.time} ({conv.duration})
                      </div>
                      <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-200">
                        <MapPin className="w-4 h-4" /> {conv.room} - {conv.seat}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 shrink-0">
                    <button 
                      className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors w-full"
                      onClick={() => window.open(`/api/v1/student-portal/convocations/${conv.id}/wallet-pass`, '_blank')}
                    >
                      <Smartphone className="w-4 h-4" /> Ajouter au Wallet
                    </button>
                    <button 
                      className="h-10 px-4 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors w-full"
                      onClick={() => window.open(`/api/v1/student-portal/convocations/${conv.id}/download`, '_blank')}
                    >
                      <Download className="w-4 h-4" /> PDF
                    </button>
                  </div>
                </div>

                {/* Toolbar (Absence & AI) */}
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <button 
                    onClick={() => setAbsenceExamId(conv.id)}
                    className="flex items-center gap-2 text-rose-600 hover:text-rose-700 text-sm font-semibold bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" /> Signaler une absence
                  </button>
                  <button 
                    onClick={() => {
                      setActiveAiExamId(conv.id === activeAiExamId ? null : conv.id)
                      setAiResponse(null)
                    }}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-semibold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors ml-auto"
                  >
                    <Bot className="w-4 h-4" /> IA Assistant Examen
                  </button>
                </div>

                {/* AI Chat Popover for this specific convocation */}
                {activeAiExamId === conv.id && (
                  <div className="mt-4 bg-blue-50/50 border border-blue-100 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="bg-white border border-blue-100 p-3 rounded-2xl rounded-tl-sm text-sm text-slate-700 shadow-sm flex-1">
                        {aiResponse ? (
                          aiResponse
                        ) : (
                          "Bonjour ! Je suis l'IA de l'ENCG. Avez-vous une question sur cet examen ? (ex: Calculatrice autorisée ? Points négatifs ?)"
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={aiQuery}
                        onChange={(e) => setAiQuery(e.target.value)}
                        placeholder="Posez votre question..."
                        className="flex-1 rounded-xl border border-blue-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyDown={(e) => e.key === 'Enter' && askAiMutation.mutate()}
                      />
                      <button 
                        onClick={() => askAiMutation.mutate()}
                        disabled={askAiMutation.isPending || !aiQuery}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                      >
                        {askAiMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Envoyer'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )
        )}
      </div>

      {/* Absence Modal */}
      {absenceExamId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                Déclaration d'Absence
              </h2>
              <button onClick={() => setAbsenceExamId(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Motif de l'absence (Cas de force majeure)</label>
                <textarea 
                  value={absenceReason}
                  onChange={(e) => setAbsenceReason(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 min-h-[100px]"
                  placeholder="Expliquez brièvement la raison (ex: Maladie, problème de transport...)"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Certificat Médical / Justificatif (Photo ou PDF)</label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-sm text-slate-500 font-medium">
                      {absenceFile ? absenceFile.name : 'Cliquez pour uploader un fichier'}
                    </p>
                  </div>
                  <input type="file" className="hidden" onChange={(e) => setAbsenceFile(e.target.files?.[0] || null)} />
                </label>
              </div>
              <button 
                onClick={() => {
                  const fd = new FormData()
                  fd.append('reason', absenceReason)
                  if (absenceFile) fd.append('certificate', absenceFile)
                  declareAbsenceMutation.mutate(fd)
                }}
                disabled={declareAbsenceMutation.isPending || !absenceReason}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-3 font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {declareAbsenceMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Envoyer la déclaration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
