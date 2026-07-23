import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Lock, Leaf, Flower2, RefreshCw, Loader2, ShieldAlert, CheckCircle2, History, AlertTriangle, ShieldCheck, ArrowRight, UserCheck, LockKeyholeOpen as Unlock } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { toast } from 'sonner'

export default function ExamLockingPage() {
  const { t, i18n } = useTranslation(['exams', 'common'])
  const isRtl = i18n.language === 'ar'

  const [currentPhase, setCurrentPhase] = useState('Verrouillé')
  const [deadline, setDeadline] = useState<string>('')
  const [deadlineInput, setDeadlineInput] = useState<string>('')
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingPhase, setUpdatingPhase] = useState<string | null>(null)

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

  const handleUpdatePhase = async (newPhase: string) => {
    if (!confirm(`Voulez-vous vraiment changer la phase en "${newPhase}" ?`)) return
    
    setUpdatingPhase(newPhase)
    try {
      await api.post('/admin/exam-locking/change', { 
        new_phase: newPhase,
        deadline: deadlineInput
      })
      toast.success(`Phase mise à jour : ${newPhase}`)
      await fetchStatus()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur lors de la mise à jour de la phase.")
    } finally {
      setUpdatingPhase(null)
    }
  }

  const isLocked = currentPhase === 'Verrouillage Total' || currentPhase === 'Verrouillé'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 animate-spin text-[#0f2863]" />
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in zoom-in duration-500 pb-24">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#001A4B] via-[#0b245e] to-[#123e8e] rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden shadow-2xl border border-blue-900">
        <div className="absolute inset-0 opacity-20 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        </div>
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-amber-300 shadow-xl shrink-0">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-amber-400/30">
                <ShieldCheck className="w-3.5 h-3.5" /> Sécurité des Délibérations ENCG
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">Pilote de Verrouillage des Notes</h1>
              <p className="text-blue-100 text-sm max-w-xl font-medium mt-1">Contrôle centralisé des accès aux saisies de notes (Saisons & Phases académiques)</p>
            </div>
          </div>

          <button 
            onClick={fetchStatus}
            className="p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 transition-all cursor-pointer"
            title="Actualiser l'état"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Active Phase Notification Banner */}
        {!isLocked && (
          <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-900 p-5 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-bold text-sm shadow-md animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <span className="block text-emerald-950 font-black text-base">Phase « {currentPhase} » Ouverte</span>
                <p className="text-emerald-700 text-xs font-semibold mt-0.5">Les professeurs et la scolarité peuvent actuellement saisir et modifier les notes pour cette session.</p>
              </div>
            </div>

            {/* Deadline Control */}
            <div className="flex items-center gap-2 bg-emerald-100/80 px-4 py-2 rounded-2xl border border-emerald-300/80 text-xs font-bold text-emerald-950 shrink-0">
              <span className="text-[10px] uppercase font-black tracking-wider text-emerald-800">Délai Limite:</span>
              <input 
                type="datetime-local" 
                value={deadlineInput}
                onChange={(e) => setDeadlineInput(e.target.value)}
                className="bg-white border border-emerald-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 shadow-xs focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
              <button
                onClick={() => handleUpdatePhase(currentPhase)}
                className="px-3 py-1 bg-emerald-700 text-white rounded-lg text-xs font-black hover:bg-emerald-800 transition-all cursor-pointer shadow-xs"
              >
                Enregistrer Délai
              </button>
            </div>
          </div>
        )}

        {/* Current Platform Locking State */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">ÉTAT ACTUEL DE LA PLATEFORME</span>
            <div className="flex items-center gap-3">
              <span className="relative flex h-4 w-4">
                <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", isLocked ? "bg-red-400" : "bg-emerald-400")} />
                <span className={cn("relative inline-flex rounded-full h-4 w-4", isLocked ? "bg-red-500" : "bg-emerald-500")} />
              </span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {isLocked ? "Totalement Verrouillée" : `${currentPhase} — Ouverte`}
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-bold max-w-xl leading-relaxed">
              {isLocked 
                ? "Toutes les saisies d'examens sont verrouillées. Seul le contrôle continu (CC) reste modifiable."
                : `Les notes d'examens et de rattrapage sont actuellement déverrouillées pour la session sélectionnée.${deadline ? ` Délai d'accès : ${new Date(deadline).toLocaleString('fr-FR')}` : ''}`}
            </p>
          </div>

          <button 
            disabled={isLocked || updatingPhase === 'Verrouillage Total'} 
            onClick={() => handleUpdatePhase('Verrouillage Total')}
            className={cn(
              "shrink-0 flex items-center justify-center gap-2 px-8 py-4 font-black rounded-2xl transition-all text-xs uppercase tracking-wider shadow-md cursor-pointer",
              isLocked 
                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed" 
                : "bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700 active:scale-95 shadow-red-500/20"
            )}
          >
            {updatingPhase === 'Verrouillage Total' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} 
            Verrouiller Immédiatement
          </button>
        </div>

        {/* Season Matrices */}
        <div className="space-y-4">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[#0f2863]" />
            Matrice des Saisons (Déverrouiller une phase)
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Ordinaire Automne */}
            <div className={cn("bg-white border-2 rounded-[2rem] p-7 flex flex-col justify-between transition-all relative overflow-hidden shadow-sm hover:shadow-md", currentPhase === 'Ordinaire Automne' ? "border-amber-500 ring-4 ring-amber-500/10" : "border-slate-200")}>
              {currentPhase === 'Ordinaire Automne' && (
                <div className="absolute top-0 right-0 bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider px-3.5 py-1 rounded-bl-xl shadow-xs">
                  ⚡ EN COURS
                </div>
              )}
              <div>
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100 shadow-2xs">
                    <Leaf className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900">Session Ordinaire Automne</h4>
                    <p className="text-xs text-slate-500 mt-1 font-semibold leading-relaxed">
                      Ouvre les colonnes CC1, CC2 et Examen pour les semestres S1, S3, S5, S7.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 my-4 border border-slate-100">
                  <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">SEMESTRES CIBLÉS (Impairs)</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {['S1', 'S3', 'S5', 'S7', 'S9'].map(s => (
                      <span key={s} className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-xs font-black rounded-lg border border-amber-200">{s}</span>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                disabled={currentPhase === 'Ordinaire Automne' || updatingPhase !== null}
                onClick={() => handleUpdatePhase('Ordinaire Automne')}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3.5 font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-sm cursor-pointer",
                  currentPhase === 'Ordinaire Automne' 
                    ? "bg-amber-100 text-amber-900 border border-amber-300" 
                    : "bg-[#0f2863] text-white hover:bg-[#193a86] active:scale-[0.99]"
                )}
              >
                {updatingPhase === 'Ordinaire Automne' ? <Loader2 className="w-4 h-4 animate-spin" /> : currentPhase === 'Ordinaire Automne' ? <CheckCircle2 className="w-4 h-4 text-amber-600" /> : <Unlock className="w-4 h-4" />}
                {currentPhase === 'Ordinaire Automne' ? 'Phase Active' : 'Déverrouiller cette phase'}
              </button>
            </div>

            {/* Rattrapage Automne */}
            <div className={cn("bg-white border-2 rounded-[2rem] p-7 flex flex-col justify-between transition-all relative overflow-hidden shadow-sm hover:shadow-md", currentPhase === 'Rattrapage Automne' ? "border-blue-500 ring-4 ring-blue-500/10" : "border-slate-200")}>
              {currentPhase === 'Rattrapage Automne' && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider px-3.5 py-1 rounded-bl-xl shadow-xs">
                  ⚡ EN COURS
                </div>
              )}
              <div>
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 shadow-2xs">
                    <RefreshCw className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900">Session Rattrapage Automne</h4>
                    <p className="text-xs text-slate-500 mt-1 font-semibold leading-relaxed">
                      Ouvre la colonne Rattrapage uniquement pour les étudiants éligibles (échec ou AJ).
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 my-4 border border-slate-100">
                  <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">SEMESTRES CIBLÉS (Impairs)</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {['S1', 'S3', 'S5', 'S7', 'S9'].map(s => (
                      <span key={s} className="px-2.5 py-0.5 bg-blue-100 text-blue-900 text-xs font-black rounded-lg border border-blue-200">{s}</span>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                disabled={currentPhase === 'Rattrapage Automne' || updatingPhase !== null}
                onClick={() => handleUpdatePhase('Rattrapage Automne')}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3.5 font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-sm cursor-pointer",
                  currentPhase === 'Rattrapage Automne' 
                    ? "bg-blue-100 text-blue-900 border border-blue-300" 
                    : "bg-[#0f2863] text-white hover:bg-[#193a86] active:scale-[0.99]"
                )}
              >
                {updatingPhase === 'Rattrapage Automne' ? <Loader2 className="w-4 h-4 animate-spin" /> : currentPhase === 'Rattrapage Automne' ? <CheckCircle2 className="w-4 h-4 text-blue-600" /> : <Unlock className="w-4 h-4" />}
                {currentPhase === 'Rattrapage Automne' ? 'Phase Active' : 'Déverrouiller cette phase'}
              </button>
            </div>

            {/* Ordinaire Printemps */}
            <div className={cn("bg-white border-2 rounded-[2rem] p-7 flex flex-col justify-between transition-all relative overflow-hidden shadow-sm hover:shadow-md", currentPhase === 'Ordinaire Printemps' ? "border-emerald-500 ring-4 ring-emerald-500/10" : "border-slate-200")}>
              {currentPhase === 'Ordinaire Printemps' && (
                <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider px-3.5 py-1 rounded-bl-xl shadow-xs">
                  ⚡ EN COURS
                </div>
              )}
              <div>
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 shadow-2xs">
                    <Flower2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900">Session Ordinaire Printemps</h4>
                    <p className="text-xs text-slate-500 mt-1 font-semibold leading-relaxed">
                      Ouvre les colonnes CC1, CC2 et Examen pour les semestres S2, S4, S6, S8, S10.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 my-4 border border-slate-100">
                  <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">SEMESTRES CIBLÉS (Pairs)</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {['S2', 'S4', 'S6', 'S8', 'S10'].map(s => (
                      <span key={s} className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 text-xs font-black rounded-lg border border-emerald-200">{s}</span>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                disabled={currentPhase === 'Ordinaire Printemps' || updatingPhase !== null}
                onClick={() => handleUpdatePhase('Ordinaire Printemps')}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3.5 font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-sm cursor-pointer",
                  currentPhase === 'Ordinaire Printemps' 
                    ? "bg-emerald-100 text-emerald-900 border border-emerald-300" 
                    : "bg-[#0f2863] text-white hover:bg-[#193a86] active:scale-[0.99]"
                )}
              >
                {updatingPhase === 'Ordinaire Printemps' ? <Loader2 className="w-4 h-4 animate-spin" /> : currentPhase === 'Ordinaire Printemps' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Unlock className="w-4 h-4" />}
                {currentPhase === 'Ordinaire Printemps' ? 'Phase Active' : 'Déverrouiller cette phase'}
              </button>
            </div>

            {/* Rattrapage Printemps */}
            <div className={cn("bg-white border-2 rounded-[2rem] p-7 flex flex-col justify-between transition-all relative overflow-hidden shadow-sm hover:shadow-md", currentPhase === 'Rattrapage Printemps' ? "border-purple-500 ring-4 ring-purple-500/10" : "border-slate-200")}>
              {currentPhase === 'Rattrapage Printemps' && (
                <div className="absolute top-0 right-0 bg-purple-600 text-white text-[9px] font-black uppercase tracking-wider px-3.5 py-1 rounded-bl-xl shadow-xs">
                  ⚡ EN COURS
                </div>
              )}
              <div>
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100 shadow-2xs">
                    <RefreshCw className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900">Session Rattrapage Printemps</h4>
                    <p className="text-xs text-slate-500 mt-1 font-semibold leading-relaxed">
                      Ouvre la colonne Rattrapage uniquement pour les étudiants éligibles (Printemps).
                    </p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 my-4 border border-slate-100">
                  <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">SEMESTRES CIBLÉS (Pairs)</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {['S2', 'S4', 'S6', 'S8', 'S10'].map(s => (
                      <span key={s} className="px-2.5 py-0.5 bg-purple-100 text-purple-900 text-xs font-black rounded-lg border border-purple-200">{s}</span>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                disabled={currentPhase === 'Rattrapage Printemps' || updatingPhase !== null}
                onClick={() => handleUpdatePhase('Rattrapage Printemps')}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-3.5 font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-sm cursor-pointer",
                  currentPhase === 'Rattrapage Printemps' 
                    ? "bg-purple-100 text-purple-900 border border-purple-300" 
                    : "bg-[#0f2863] text-white hover:bg-[#193a86] active:scale-[0.99]"
                )}
              >
                {updatingPhase === 'Rattrapage Printemps' ? <Loader2 className="w-4 h-4 animate-spin" /> : currentPhase === 'Rattrapage Printemps' ? <CheckCircle2 className="w-4 h-4 text-purple-600" /> : <Unlock className="w-4 h-4" />}
                {currentPhase === 'Rattrapage Printemps' ? 'Phase Active' : 'Déverrouiller cette phase'}
              </button>
            </div>

          </div>
        </div>

        {/* Historique d'Audit */}
        <div className="space-y-4 pt-4">
          <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-[#0f2863]" />
            Historique de Verrouillage (Journal d'Audit)
          </h3>

          <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden p-2">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4">Date & Heure</th>
                  <th className="px-6 py-4">Utilisateur / Admin</th>
                  <th className="px-6 py-4">Ancienne Phase</th>
                  <th className="px-6 py-4">Nouvelle Phase</th>
                  <th className="px-6 py-4 text-right">Adresse IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400 font-bold text-xs">
                      Aucun historique d'audit enregistré.
                    </td>
                  </tr>
                ) : auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs font-bold">{log.date}</td>
                    <td className="px-6 py-4 text-slate-900 text-xs font-extrabold flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-blue-600" /> {log.user}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{log.oldPhase || 'Initial'}</td>
                    <td className="px-6 py-4 text-xs font-extrabold">
                      <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border", log.isRed ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200")}>
                        {log.newPhase}
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
  )
}
