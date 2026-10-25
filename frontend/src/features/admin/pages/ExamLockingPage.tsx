import { useState,useEffect } from 'react'
import {
Lock,
Leaf,
Flower2,
RefreshCw,
Loader2,
ShieldAlert,
CheckCircle2,
History,
ShieldCheck,
LockKeyholeOpen as Unlock,
Clock,
Sparkles,
X,
MessageSquare
} from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { toast } from 'sonner'

export default function ExamLockingPage() {
  const [currentPhase, setCurrentPhase] = useState('Verrouillé')
  const [deadline, setDeadline] = useState<string>('')
  const [deadlineInput, setDeadlineInput] = useState<string>('')
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingPhase, setUpdatingPhase] = useState<string | null>(null)

  // Reason Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pendingPhase, setPendingPhase] = useState<string | null>(null)
  const [reasonText, setReasonText] = useState('')

  const fetchStatus = async () => {
    try {
      setLoading(true)
      const res = await api.get('/admin/exam-locking')
      setCurrentPhase(res.data.current_phase || 'Verrouillé')
      setDeadline(res.data.deadline || '')
      setDeadlineInput(res.data.deadline || '')
      setAuditLogs(res.data.audits || [])
    } catch (err) {
      console.error(err)
      toast.error("Impossible de récupérer l'état de verrouillage.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const triggerPhaseChangeModal = (targetPhase: string) => {
    setPendingPhase(targetPhase)
    setReasonText('')
    setIsModalOpen(true)
  }

  const confirmPhaseChange = async () => {
    if (!pendingPhase) return

    const finalReason = reasonText.trim() || `Changement de phase vers ${pendingPhase}`
    setUpdatingPhase(pendingPhase)
    setIsModalOpen(false)

    try {
      await api.post('/admin/exam-locking/change', {
        new_phase: pendingPhase,
        deadline: deadlineInput,
        reason: finalReason
      })
      toast.success(`Phase mise à jour : ${pendingPhase}`)
      await fetchStatus()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur lors de la mise à jour de la phase.")
    } finally {
      setUpdatingPhase(null)
      setPendingPhase(null)
    }
  }

  // Preset Date Handlers
  const addHoursToDeadline = (hours: number) => {
    const d = new Date()
    d.setHours(d.getHours() + hours)
    // format as YYYY-MM-THH:mm
    const isoString = d.toISOString().slice(0, 16)
    setDeadlineInput(isoString)
    toast.info(`Délai ajusté à +${hours} heures`)
  }

  const addDaysToDeadline = (days: number) => {
    const d = new Date()
    d.setDate(d.getDate() + days)
    const isoString = d.toISOString().slice(0, 16)
    setDeadlineInput(isoString)
    toast.info(`Délai ajusté à +${days} jours`)
  }

  const isLocked = currentPhase === 'Verrouillage Total' || currentPhase === 'Verrouillé'

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-[#0f2863] animate-spin"></div>
          <Lock className="w-6 h-6 text-[#0f2863] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-muted-foreground font-bold text-xs tracking-wider uppercase">Chargement de la matrice de sécurité...</p>
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 font-sans animate-in fade-in duration-500 pb-32">
      
      {/* Dynamic Header Banner */}
      <div className="bg-gradient-to-r from-[#030d26] via-[#091f4d] to-[#123985] rounded-2xl p-8 md:p-12 relative overflow-hidden shadow-sm border border-blue-800/40">
        {/* Decorative Grid Overlay & Ambient Lights */}
        <div className="absolute inset-0 opacity-15 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '28px 28px' }}>
        </div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-0 left-1/3 w-[350px] h-[350px] bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-amber-300 shadow-sm shrink-0 group hover:scale-105 transition-transform duration-300">
              <Lock className="w-10 h-10 group-hover:rotate-12 transition-transform" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400/20 to-amber-500/10 text-amber-300 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2.5 border border-amber-400/30 shadow-xs">
                <ShieldCheck className="w-4 h-4 text-amber-400" /> Sécurité des Délibérations & Examens ENCG
              </div>
              <h1 className="text-white leading-tight erp-page-title">
                Pilote de Verrouillage des Notes
              </h1>
              <p className="text-blue-100/90 text-sm max-w-xl font-medium mt-1.5 leading-relaxed">
                Centre de contrôle académique pour la gestion des sessions d'examens, le verrouillage des délibérations et la sécurité des PV.
              </p>
            </div>
          </div>

          <button 
            onClick={fetchStatus}
            className="flex items-center gap-2.5 px-5 py-3.5 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 transition-all cursor-pointer shadow-lg active:scale-95 text-xs font-bold uppercase tracking-wider"
            title="Actualiser l'état"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Actualiser
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Active Phase & Deadline Control Glassmorphic Bar */}
        {!isLocked && (
          <div className="bg-gradient-to-r from-emerald-950/90 via-emerald-900/95 to-teal-950/90 border border-emerald-500/40 text-white p-6 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-sm backdrop-blur-xl animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center shrink-0 shadow-inner">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                  <span className="text-emerald-300 font-bold text-xs uppercase tracking-widest">SESSION EN COURS</span>
                </div>
                <h3 className="text-xl font-bold text-white tracking-tight mt-0.5">
                  Phase « {currentPhase} » Ouverte
                </h3>
                <p className="text-emerald-200/80 text-xs font-medium mt-0.5">
                  Les enseignants peuvent actuellement saisir les notes pour cette session.
                </p>
              </div>
            </div>

            {/* Quick Deadline Settings */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white/10 p-2.5 rounded-2xl border border-white/15 w-full lg:w-auto">
              <div className="flex items-center gap-2 px-2 text-emerald-200">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Délai Limite:</span>
              </div>

              <input 
                type="datetime-local" 
                value={deadlineInput}
                onChange={(e) => setDeadlineInput(e.target.value)}
                className="bg-slate-900/90 text-white border border-emerald-500/40 px-3 py-1.5 text-xs font-bold shadow-inner focus:ring-2 focus:ring-emerald-400 outline-hidden rounded-[var(--control-radius)]"
              />

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => addHoursToDeadline(24)}
                  className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                  title="Ajouter 24 heures"
                >
                  +24h
                </button>
                <button
                  type="button"
                  onClick={() => addDaysToDeadline(7)}
                  className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                  title="Ajouter 7 jours"
                >
                  +7j
                </button>
              </div>

              <button
                onClick={() => triggerPhaseChangeModal(currentPhase)}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg active:scale-95 border border-emerald-300/30 shrink-0"
              >
                Enregistrer
              </button>
            </div>
          </div>
        )}

        {/* Current Platform Locking Card */}
        <div className="bg-card border border-border rounded-2xl shadow-sm p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:shadow-2xl">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> ÉTAT GLOBAL DE LA PLATEFORME
            </span>
            <div className="flex items-center gap-3">
              <span className="relative flex h-5 w-5">
                <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", isLocked ? "bg-red-400" : "bg-emerald-400")} />
                <span className={cn("relative inline-flex rounded-full h-5 w-5 shadow-md", isLocked ? "bg-gradient-to-r from-red-500 to-rose-600" : "bg-gradient-to-r from-emerald-500 to-teal-500")} />
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                {isLocked ? "Totalement Verrouillée 🔒" : `${currentPhase} — Ouverte 🔓`}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground font-bold max-w-xl leading-relaxed">
              {isLocked 
                ? "Toutes les saisies d'examens sont verrouillées. Seul le contrôle continu (CC) reste modifiable."
                : `Les notes d'examens et de rattrapage sont déverrouillées.${deadline ? ` Date limite fixée au : ${new Date(deadline).toLocaleString('fr-FR')}` : ''}`}
            </p>
          </div>

          <button 
            disabled={isLocked || updatingPhase === 'Verrouillage Total'} 
            onClick={() => triggerPhaseChangeModal('Verrouillage Total')}
            className={cn(
              "shrink-0 flex items-center justify-center gap-2.5 px-8 py-4 font-bold rounded-2xl transition-all text-xs uppercase tracking-wider shadow-lg cursor-pointer",
              isLocked 
                ? "bg-muted text-slate-400 border border-border cursor-not-allowed shadow-none"
                : "bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white hover:from-red-700 hover:to-rose-800 active:scale-95 shadow-red-500/25 hover:shadow-red-500/40"
            )}
          >
            {updatingPhase === 'Verrouillage Total' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} 
            Verrouiller Immédiatement
          </button>
        </div>

        {/* Season Matrices */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#0f2863]" />
              Matrice des Saisons (Déverrouiller une phase)
            </h3>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Sélectionnez la saison à ouvrir</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Ordinaire Automne */}
            <div className={cn(
              "bg-card border-2 rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 relative overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-1 group",
              currentPhase === 'Ordinaire Automne' 
                ? "border-amber-500 ring-4 ring-amber-500/20 shadow-amber-500/10" 
                : "border-border hover:border-amber-400/60"
            )}>
              {currentPhase === 'Ordinaire Automne' && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-bl-2xl shadow-md flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-card animate-ping"></span>
                  ⚡ PHASE ACTIVE
                </div>
              )}

              <div>
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200 shadow-inner group-hover:scale-110 transition-transform">
                    <Leaf className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-foreground tracking-tight">Session Ordinaire Automne</h4>
                    <p className="text-xs text-muted-foreground mt-1 font-semibold leading-relaxed">
                      Ouvre les saisies pour les contrôles continus et examens de la session d'automne.
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50/60 rounded-2xl p-4 my-5 border border-amber-200/60">
                  <span className="block text-[10px] font-bold text-amber-800/80 uppercase tracking-widest mb-2">SEMESTRES CIBLÉS (Impairs)</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {['S1', 'S3', 'S5', 'S7', 'S9'].map(s => (
                      <span key={s} className="px-3 py-1 bg-card text-amber-900 text-xs font-bold rounded-xl border border-amber-300 shadow-xs">{s}</span>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                disabled={currentPhase === 'Ordinaire Automne' || updatingPhase !== null}
                onClick={() => triggerPhaseChangeModal('Ordinaire Automne')}
                className={cn(
                  "w-full flex items-center justify-center gap-2.5 py-4 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md cursor-pointer active:scale-95",
                  currentPhase === 'Ordinaire Automne' 
                    ? "bg-amber-100 text-amber-900 border border-amber-300 shadow-none cursor-default" 
                    : "bg-[#0f2863] text-white hover:bg-[#193a86] shadow-blue-900/20 hover:shadow-blue-900/30"
                )}
              >
                {updatingPhase === 'Ordinaire Automne' ? <Loader2 className="w-4 h-4 animate-spin" /> : currentPhase === 'Ordinaire Automne' ? <CheckCircle2 className="w-4 h-4 text-amber-600" /> : <Unlock className="w-4 h-4" />}
                {currentPhase === 'Ordinaire Automne' ? 'Phase Actuellement Active' : 'Déverrouiller cette phase'}
              </button>
            </div>

            {/* Rattrapage Automne */}
            <div className={cn(
              "bg-card border-2 rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 relative overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-1 group",
              currentPhase === 'Rattrapage Automne' 
                ? "border-primary ring-4 ring-blue-500/20 shadow-blue-500/10"
                : "border-border hover:border-blue-400/60"
            )}>
              {currentPhase === 'Rattrapage Automne' && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-bl-2xl shadow-md flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-card animate-ping"></span>
                  ⚡ PHASE ACTIVE
                </div>
              )}

              <div>
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-inner group-hover:scale-110 transition-transform">
                    <RefreshCw className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-foreground tracking-tight">Session Rattrapage Automne</h4>
                    <p className="text-xs text-muted-foreground mt-1 font-semibold leading-relaxed">
                      Ouvre la saisie du Rattrapage uniquement pour les étudiants éligibles (échec ou AJ).
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50/60 rounded-2xl p-4 my-5 border border-blue-200/60">
                  <span className="block text-[10px] font-bold text-blue-800/80 uppercase tracking-widest mb-2">SEMESTRES CIBLÉS (Impairs)</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {['S1', 'S3', 'S5', 'S7', 'S9'].map(s => (
                      <span key={s} className="px-3 py-1 bg-card text-primary text-xs font-bold rounded-xl border border-primary/20 shadow-xs">{s}</span>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                disabled={currentPhase === 'Rattrapage Automne' || updatingPhase !== null}
                onClick={() => triggerPhaseChangeModal('Rattrapage Automne')}
                className={cn(
                  "w-full flex items-center justify-center gap-2.5 py-4 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md cursor-pointer active:scale-95",
                  currentPhase === 'Rattrapage Automne' 
                    ? "bg-primary/10 text-primary border border-primary/20 shadow-none cursor-default"
                    : "bg-[#0f2863] text-white hover:bg-[#193a86] shadow-blue-900/20 hover:shadow-blue-900/30"
                )}
              >
                {updatingPhase === 'Rattrapage Automne' ? <Loader2 className="w-4 h-4 animate-spin" /> : currentPhase === 'Rattrapage Automne' ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <Unlock className="w-4 h-4" />}
                {currentPhase === 'Rattrapage Automne' ? 'Phase Actuellement Active' : 'Déverrouiller cette phase'}
              </button>
            </div>

            {/* Ordinaire Printemps */}
            <div className={cn(
              "bg-card border-2 rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 relative overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-1 group",
              currentPhase === 'Ordinaire Printemps' 
                ? "border-emerald-500 ring-4 ring-emerald-500/20 shadow-emerald-500/10" 
                : "border-border hover:border-emerald-400/60"
            )}>
              {currentPhase === 'Ordinaire Printemps' && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-bl-2xl shadow-md flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-card animate-ping"></span>
                  ⚡ PHASE ACTIVE
                </div>
              )}

              <div>
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200 shadow-inner group-hover:scale-110 transition-transform">
                    <Flower2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-foreground tracking-tight">Session Ordinaire Printemps</h4>
                    <p className="text-xs text-muted-foreground mt-1 font-semibold leading-relaxed">
                      Ouvre les colonnes CC1, CC2 et Examen pour les semestres pairs.
                    </p>
                  </div>
                </div>

                <div className="bg-emerald-50/60 rounded-2xl p-4 my-5 border border-emerald-200/60">
                  <span className="block text-[10px] font-bold text-emerald-800/80 uppercase tracking-widest mb-2">SEMESTRES CIBLÉS (Pairs)</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {['S2', 'S4', 'S6', 'S8', 'S10'].map(s => (
                      <span key={s} className="px-3 py-1 bg-card text-emerald-900 text-xs font-bold rounded-xl border border-emerald-300 shadow-xs">{s}</span>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                disabled={currentPhase === 'Ordinaire Printemps' || updatingPhase !== null}
                onClick={() => triggerPhaseChangeModal('Ordinaire Printemps')}
                className={cn(
                  "w-full flex items-center justify-center gap-2.5 py-4 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md cursor-pointer active:scale-95",
                  currentPhase === 'Ordinaire Printemps' 
                    ? "bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-none cursor-default" 
                    : "bg-[#0f2863] text-white hover:bg-[#193a86] shadow-blue-900/20 hover:shadow-blue-900/30"
                )}
              >
                {updatingPhase === 'Ordinaire Printemps' ? <Loader2 className="w-4 h-4 animate-spin" /> : currentPhase === 'Ordinaire Printemps' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Unlock className="w-4 h-4" />}
                {currentPhase === 'Ordinaire Printemps' ? 'Phase Actuellement Active' : 'Déverrouiller cette phase'}
              </button>
            </div>

            {/* Rattrapage Printemps */}
            <div className={cn(
              "bg-card border-2 rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 relative overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-1 group",
              currentPhase === 'Rattrapage Printemps' 
                ? "border-purple-500 ring-4 ring-purple-500/20 shadow-purple-500/10" 
                : "border-border hover:border-purple-400/60"
            )}>
              {currentPhase === 'Rattrapage Printemps' && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-bl-2xl shadow-md flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-card animate-ping"></span>
                  ⚡ PHASE ACTIVE
                </div>
              )}

              <div>
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200 shadow-inner group-hover:scale-110 transition-transform">
                    <RefreshCw className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-foreground tracking-tight">Session Rattrapage Printemps</h4>
                    <p className="text-xs text-muted-foreground mt-1 font-semibold leading-relaxed">
                      Ouvre la colonne Rattrapage uniquement pour les étudiants éligibles de la session de printemps.
                    </p>
                  </div>
                </div>

                <div className="bg-purple-50/60 rounded-2xl p-4 my-5 border border-purple-200/60">
                  <span className="block text-[10px] font-bold text-purple-800/80 uppercase tracking-widest mb-2">SEMESTRES CIBLÉS (Pairs)</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {['S2', 'S4', 'S6', 'S8', 'S10'].map(s => (
                      <span key={s} className="px-3 py-1 bg-card text-purple-900 text-xs font-bold rounded-xl border border-purple-300 shadow-xs">{s}</span>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                disabled={currentPhase === 'Rattrapage Printemps' || updatingPhase !== null}
                onClick={() => triggerPhaseChangeModal('Rattrapage Printemps')}
                className={cn(
                  "w-full flex items-center justify-center gap-2.5 py-4 font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md cursor-pointer active:scale-95",
                  currentPhase === 'Rattrapage Printemps' 
                    ? "bg-purple-100 text-purple-900 border border-purple-300 shadow-none cursor-default" 
                    : "bg-[#0f2863] text-white hover:bg-[#193a86] shadow-blue-900/20 hover:shadow-blue-900/30"
                )}
              >
                {updatingPhase === 'Rattrapage Printemps' ? <Loader2 className="w-4 h-4 animate-spin" /> : currentPhase === 'Rattrapage Printemps' ? <CheckCircle2 className="w-4 h-4 text-purple-600" /> : <Unlock className="w-4 h-4" />}
                {currentPhase === 'Rattrapage Printemps' ? 'Phase Actuellement Active' : 'Déverrouiller cette phase'}
              </button>
            </div>

          </div>
        </div>

        {/* Audit History Table */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <History className="w-5 h-5 text-[#0f2863]" />
              Historique de Verrouillage (Journal d'Audit Avancé)
            </h3>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tracé en temps réel</span>
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden p-3">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-border bg-slate-50/80">
                  <tr>
                    <th className="px-6 py-4">Date & Heure</th>
                    <th className="px-6 py-4">Utilisateur / Admin</th>
                    <th className="px-6 py-4">Ancienne Phase</th>
                    <th className="px-6 py-4">Nouvelle Phase</th>
                    <th className="px-6 py-4">Motif / Raison du Changement</th>
                    <th className="px-6 py-4 text-right">Adresse IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-slate-400 font-bold text-xs">
                        Aucun historique d'audit enregistré.
                      </td>
                    </tr>
                  ) : auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-6 py-4 text-muted-foreground font-mono text-xs font-bold">{log.date}</td>
                      <td className="px-6 py-4 text-foreground text-xs font-bold flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                          {log.user ? log.user.substring(0, 2).toUpperCase() : 'AD'}
                        </div>
                        {log.user}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">{log.oldPhase || 'Initial'}</td>
                      <td className="px-6 py-4 text-xs font-bold">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold uppercase border shadow-2xs",
                          log.isRed ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        )}>
                          {log.newPhase}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-700 text-xs font-medium italic">
                        <span className="inline-flex items-center gap-1.5 bg-slate-100/80 px-3 py-1 rounded-xl border border-slate-200/60">
                          <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {log.reason || 'Non précisé'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-mono text-right text-[11px]">{log.ip || '127.0.0.1'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* Reason / Motif Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-card rounded-2xl border border-border shadow-sm max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 p-8 space-y-6">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#0f2863]/10 text-[#0f2863] flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground tracking-tight">Confirmer la Phase</h3>
                  <p className="text-xs text-muted-foreground font-semibold">Validation du verrouillage académique</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-muted-foreground rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-muted/50 p-4 rounded-2xl border border-slate-200/80 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">NOUVELLE PHASE CIBLÉE</span>
              <p className="text-lg font-bold text-[#0f2863]">{pendingPhase}</p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Motif / Raison du changement <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                placeholder="Ex: Délibération du Jury, Ouverture exceptionnelle Rattrapage S3..."
                className="w-full bg-muted/50 border border-border p-4 text-xs font-semibold text-foreground focus:ring-2 focus:ring-[#0f2863] outline-hidden shadow-inner resize-none rounded-[var(--control-radius)]"
              />
              
              {/* Reason Presets */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  'Délibération du Jury',
                  'Session de Rattrapage',
                  'Correction des notes CC',
                  'Clôture officielle'
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setReasonText(preset)}
                    className="px-3 py-1 bg-muted hover:bg-primary/5 text-muted-foreground hover:text-primary rounded-lg text-[10px] font-bold border border-border transition-colors cursor-pointer"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3.5 px-4 font-bold text-xs uppercase tracking-wider text-muted-foreground bg-muted hover:bg-slate-200 rounded-2xl transition-all cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmPhaseChange}
                className="flex-1 py-3.5 px-4 font-bold text-xs uppercase tracking-wider text-white bg-gradient-to-r from-[#0f2863] to-[#1d429b] hover:from-[#15347d] hover:to-[#224cb0] rounded-2xl shadow-lg active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirmer & Enregistrer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
