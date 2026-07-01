import { useState, useEffect } from 'react'
import { Lock, Leaf, Flower2, RefreshCw, Loader2, Unlock, CheckCircle2 } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { toast } from 'sonner'

export default function ExamLockingPage() {
  const [currentPhase, setCurrentPhase] = useState('Verrouillé')
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingPhase, setUpdatingPhase] = useState<string | null>(null)

  const fetchStatus = async () => {
    try {
      const res = await api.get('/admin/exam-locking')
      setCurrentPhase(res.data.current_phase)
      setAuditLogs(res.data.audits)
    } catch (err) {
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
      await api.post('/admin/exam-locking/change', { new_phase: newPhase })
      toast.success(`Phase mise à jour : ${newPhase}`)
      await fetchStatus()
    } catch (err) {
      toast.error("Erreur lors de la mise à jour.")
    } finally {
      setUpdatingPhase(null)
    }
  }

  const isLocked = currentPhase === 'Verrouillage Total' || currentPhase === 'Verrouillé'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-center gap-4 text-center">
        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 shadow-sm mx-auto sm:mx-0">
          <Lock className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#0f2863] italic">Pilote de Verrouillage des Notes</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Contrôle centralisé des accès aux saisies de notes (Saisons & Phases)</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Active Phase Banner */}
        {!isLocked && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 font-bold text-sm shadow-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Phase « {currentPhase} » activée. Les professeurs peuvent désormais saisir les notes correspondantes.
          </div>
        )}

        {/* État Actuel */}
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">ÉTAT ACTUEL DE LA PLATEFORME</h3>
            <div className="flex items-center gap-3 mb-2">
              <div className={cn("w-3.5 h-3.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.4)]", isLocked ? "bg-red-500 shadow-red-500/50" : "bg-emerald-500 shadow-emerald-500/50")}></div>
              <h2 className={cn("text-2xl font-bold", isLocked ? "text-slate-800" : "text-[#0f2863]")}>
                {isLocked ? "Totalement Verrouillée" : `${currentPhase} — Ouverte`}
              </h2>
            </div>
            <p className="text-sm text-slate-500 font-medium">
              {isLocked 
                ? "Seul le contrôle continu (CC) est modifiable. Aucune saisie d'examen en cours."
                : "Les professeurs peuvent actuellement saisir et modifier les notes d'examens pour cette session."}
            </p>
          </div>
          <button 
            disabled={isLocked || updatingPhase === 'Verrouillage Total'} 
            onClick={() => handleUpdatePhase('Verrouillage Total')}
            className={cn(
              "shrink-0 flex items-center justify-center gap-2 px-8 py-3.5 font-bold rounded-2xl transition-all text-sm shadow-sm",
              isLocked 
                ? "bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed" 
                : "bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg hover:-translate-y-0.5"
            )}
          >
            {updatingPhase === 'Verrouillage Total' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} 
            Verrouiller Immédiatement
          </button>
        </div>

        {/* Matrice des Saisons */}
        <div>
          <h3 className="text-base font-bold text-[#0f2863] mb-4">Matrice des Saisons (Ouvrir une phase)</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Ordinaire Automne */}
            <div className={cn("bg-white border-2 rounded-3xl p-6 flex flex-col transition-all relative overflow-hidden", currentPhase === 'Ordinaire Automne' ? "border-amber-400 shadow-lg shadow-amber-500/10" : "border-slate-100 shadow-sm")}>
              {currentPhase === 'Ordinaire Automne' && (
                <div className="absolute top-0 right-0 bg-amber-500 text-white text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                  En cours
                </div>
              )}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                  <Leaf className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-800">Session Ordinaire Automne</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
                    Ouvre les colonnes CC1, CC2 et Examen pour les semestres S1, S3, S5, S7.
                  </p>
                </div>
              </div>
              <div className="mt-auto pt-4">
                <div className="bg-slate-50 rounded-2xl p-4 mb-6">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">SEMESTRES CIBLÉS</span>
                  <span className="font-bold text-slate-700 text-sm">S1, S3, S5, S7</span>
                </div>
                <button 
                  disabled={currentPhase === 'Ordinaire Automne' || updatingPhase !== null}
                  onClick={() => handleUpdatePhase('Ordinaire Automne')}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-3.5 font-bold rounded-2xl transition-colors text-sm shadow-sm",
                    currentPhase === 'Ordinaire Automne' 
                      ? "bg-amber-50 text-amber-600 border border-amber-200" 
                      : "bg-[#0f2863] text-white hover:bg-[#1a387e]"
                  )}
                >
                  {updatingPhase === 'Ordinaire Automne' ? <Loader2 className="w-4 h-4 animate-spin" /> : currentPhase === 'Ordinaire Automne' ? <RefreshCw className="w-4 h-4" /> : null}
                  {currentPhase === 'Ordinaire Automne' ? 'Phase Active' : 'Déverrouiller cette phase'}
                </button>
              </div>
            </div>

            {/* Rattrapage Automne */}
            <div className={cn("bg-white border-2 rounded-3xl p-6 flex flex-col transition-all relative overflow-hidden", currentPhase === 'Rattrapage Automne' ? "border-blue-400 shadow-lg shadow-blue-500/10" : "border-slate-100 shadow-sm")}>
              {currentPhase === 'Rattrapage Automne' && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                  En cours
                </div>
              )}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-800">Session Rattrapage Automne</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
                    Ouvre la colonne Rattrapage uniquement pour les étudiants éligibles (échec ou AJ).
                  </p>
                </div>
              </div>
              <div className="mt-auto pt-4">
                <div className="bg-slate-50 rounded-2xl p-4 mb-6">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">SEMESTRES CIBLÉS</span>
                  <span className="font-bold text-slate-700 text-sm">S1, S3, S5, S7</span>
                </div>
                <button 
                  disabled={currentPhase === 'Rattrapage Automne' || updatingPhase !== null}
                  onClick={() => handleUpdatePhase('Rattrapage Automne')}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-3.5 font-bold rounded-2xl transition-colors text-sm shadow-sm",
                    currentPhase === 'Rattrapage Automne' 
                      ? "bg-blue-50 text-blue-600 border border-blue-200" 
                      : "bg-[#0f2863] text-white hover:bg-[#1a387e]"
                  )}
                >
                  {updatingPhase === 'Rattrapage Automne' ? <Loader2 className="w-4 h-4 animate-spin" /> : currentPhase === 'Rattrapage Automne' ? <RefreshCw className="w-4 h-4" /> : null}
                  {currentPhase === 'Rattrapage Automne' ? 'Phase Active' : 'Déverrouiller cette phase'}
                </button>
              </div>
            </div>

            {/* Ordinaire Printemps */}
            <div className={cn("bg-white border-2 rounded-3xl p-6 flex flex-col transition-all relative overflow-hidden", currentPhase === 'Ordinaire Printemps' ? "border-emerald-400 shadow-lg shadow-emerald-500/10" : "border-slate-100 shadow-sm")}>
              {currentPhase === 'Ordinaire Printemps' && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                  En cours
                </div>
              )}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-500 flex items-center justify-center shrink-0">
                  <Flower2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-800">Session Ordinaire Printemps</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
                    Ouvre les colonnes CC1, CC2 et Examen pour les semestres S2, S4, S6, S8.
                  </p>
                </div>
              </div>
              <div className="mt-auto pt-4">
                <div className="bg-slate-50 rounded-2xl p-4 mb-6">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">SEMESTRES CIBLÉS</span>
                  <span className="font-bold text-slate-700 text-sm">S2, S4, S6, S8</span>
                </div>
                <button 
                  disabled={currentPhase === 'Ordinaire Printemps' || updatingPhase !== null}
                  onClick={() => handleUpdatePhase('Ordinaire Printemps')}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-3.5 font-bold rounded-2xl transition-colors text-sm shadow-sm",
                    currentPhase === 'Ordinaire Printemps' 
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
                      : "bg-[#0f2863] text-white hover:bg-[#1a387e]"
                  )}
                >
                  {updatingPhase === 'Ordinaire Printemps' ? <Loader2 className="w-4 h-4 animate-spin" /> : currentPhase === 'Ordinaire Printemps' ? <RefreshCw className="w-4 h-4" /> : null}
                  {currentPhase === 'Ordinaire Printemps' ? 'Phase Active' : 'Déverrouiller cette phase'}
                </button>
              </div>
            </div>

            {/* Rattrapage Printemps */}
            <div className={cn("bg-white border-2 rounded-3xl p-6 flex flex-col transition-all relative overflow-hidden", currentPhase === 'Rattrapage Printemps' ? "border-blue-400 shadow-lg shadow-blue-500/10" : "border-slate-100 shadow-sm")}>
              {currentPhase === 'Rattrapage Printemps' && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
                  En cours
                </div>
              )}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-800">Session Rattrapage Printemps</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
                    Ouvre la colonne Rattrapage uniquement pour les étudiants éligibles (Printemps).
                  </p>
                </div>
              </div>
              <div className="mt-auto pt-4">
                <div className="bg-slate-50 rounded-2xl p-4 mb-6">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">SEMESTRES CIBLÉS</span>
                  <span className="font-bold text-slate-700 text-sm">S2, S4, S6, S8</span>
                </div>
                <button 
                  disabled={currentPhase === 'Rattrapage Printemps' || updatingPhase !== null}
                  onClick={() => handleUpdatePhase('Rattrapage Printemps')}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 py-3.5 font-bold rounded-2xl transition-colors text-sm shadow-sm",
                    currentPhase === 'Rattrapage Printemps' 
                      ? "bg-blue-50 text-blue-600 border border-blue-200" 
                      : "bg-[#0f2863] text-white hover:bg-[#1a387e]"
                  )}
                >
                  {updatingPhase === 'Rattrapage Printemps' ? <Loader2 className="w-4 h-4 animate-spin" /> : currentPhase === 'Rattrapage Printemps' ? <RefreshCw className="w-4 h-4" /> : null}
                  {currentPhase === 'Rattrapage Printemps' ? 'Phase Active' : 'Déverrouiller cette phase'}
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Historique */}
        <div className="pt-8">
          <h3 className="text-base font-bold text-[#0f2863] mb-4">Historique de Verrouillage (Audit)</h3>
          <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex flex-col p-2">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Date & Heure</th>
                  <th className="px-6 py-4">Utilisateur</th>
                  <th className="px-6 py-4">Ancienne Phase</th>
                  <th className="px-6 py-4">Nouvelle Phase</th>
                  <th className="px-6 py-4 text-right">Adresse IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400 font-medium">Aucun historique trouvé.</td>
                  </tr>
                ) : auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-500 text-xs">{log.date}</td>
                    <td className="px-6 py-4 font-bold text-slate-800 text-xs">{log.user}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs">{log.oldPhase}</td>
                    <td className="px-6 py-4 font-bold text-xs">
                      <span className={cn(log.isRed ? "text-red-500" : "text-emerald-500")}>
                        {log.newPhase}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-mono text-right text-[10px]">{log.ip}</td>
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
