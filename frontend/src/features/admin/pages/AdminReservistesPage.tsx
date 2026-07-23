import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Users, 
  ShieldAlert, 
  CheckCircle2, 
  RefreshCw, 
  Loader2, 
  Search, 
  Filter, 
  Download, 
  Award, 
  FileText, 
  BookOpen, 
  AlertTriangle, 
  Sparkles,
  X,
  FileSignature,
  Building2,
  ChevronRight,
  ShieldCheck
} from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { toast } from 'sonner'

export default function AdminReservistesPage() {
  const { i18n } = useTranslation('common')
  const isRtl = i18n.language === 'ar'

  const [loading, setLoading] = useState(true)
  const [reservistes, setReservistes] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({ total_reservistes: 0, total_derogations: 0, total_debts_count: 0 })
  const [topModules, setTopModules] = useState<any[]>([])
  const [filieres, setFilieres] = useState<any[]>([])

  // Filters
  const [selectedFiliere, setSelectedFiliere] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Modal State for Derogation
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [derogationStatus, setDerogationStatus] = useState<string>('accordee')
  const [derogationRef, setDerogationRef] = useState<string>('')
  const [derogationNotes, setDerogationNotes] = useState<string>('')
  const [savingDerogation, setSavingDerogation] = useState(false)

  // Audit Cursus Backup Modal State
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false)
  const [auditData, setAuditData] = useState<any>(null)
  const [loadingAudit, setLoadingAudit] = useState(false)
  const [sendingMailId, setSendingMailId] = useState<number | null>(null)

  const handleSendNotificationMail = async (student: any) => {
    setSendingMailId(student.student_id)
    const toastId = toast.loading(`Envoi de l'email de notification à ${student.email}...`)
    try {
      const res = await api.post(`/admin/reservistes/${student.student_id}/notify-email`)
      toast.success(res.data.message || "Email envoyé avec succès !", { id: toastId })
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur lors de l'envoi de l'email.", { id: toastId })
    } finally {
      setSendingMailId(null)
    }
  }

  const handleOpenAuditModal = async (studentId: number) => {
    setIsAuditModalOpen(true)
    setLoadingAudit(true)
    try {
      const res = await api.get(`/admin/reservistes/${studentId}/audit`)
      setAuditData(res.data)
    } catch (err) {
      console.error(err)
      toast.error("Erreur lors du chargement de l'audit du cursus.")
    } finally {
      setLoadingAudit(false)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await api.get('/admin/reservistes', {
        params: {
          filiere_id: selectedFiliere,
          status: statusFilter,
          search: searchQuery
        }
      })
      setReservistes(res.data.data || [])
      setSummary(res.data.summary || {})
      setTopModules(res.data.top_debt_modules || [])
    } catch (err) {
      console.error(err)
      toast.error("Impossible de charger les données des réservistes.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    api.get('/filieres').then(r => setFilieres(r.data.data || r.data)).catch(console.error)
  }, [])

  useEffect(() => {
    fetchData()
  }, [selectedFiliere, statusFilter])

  const handleOpenDerogationModal = (student: any) => {
    setSelectedStudent(student)
    setDerogationStatus(student.derogation?.status || 'accordee')
    setDerogationRef(student.derogation?.reference || `DEROG-2026-${student.filiere_code}-${Math.floor(100 + Math.random() * 900)}`)
    setDerogationNotes(student.derogation?.notes || 'Autorisation exceptionnelle de réinscription accordée par le Conseil d\'Établissement ENCG.')
    setIsModalOpen(true)
  }

  const handleSaveDerogation = async () => {
    if (!selectedStudent) return
    setSavingDerogation(true)
    try {
      await api.post(`/admin/reservistes/${selectedStudent.student_id}/derogation`, {
        status: derogationStatus,
        reference: derogationRef,
        notes: derogationNotes
      })
      toast.success(`Statut de dérogation mis à jour pour ${selectedStudent.full_name} !`)
      setIsModalOpen(false)
      fetchData()
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur lors de la mise à jour de la dérogation.")
    } finally {
      setSavingDerogation(false)
    }
  }

  const handleExportCsv = () => {
    let csvContent = "data:text/csv;charset=utf-8,CNE,Nom et Prenom,Filiere,Dettes Count,Modules en Dette,Statut Derogation,Reference\n"
    reservistes.forEach(r => {
      const debtCodes = r.debt_modules.map((m: any) => m.module_code).join(' | ')
      csvContent += `"${r.cne}","${r.full_name}","${r.filiere_code}","${r.total_debts}","${debtCodes}","${r.derogation?.status || 'aucune'}","${r.derogation?.reference || ''}"\n`
    })
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `Liste_Reservistes_ENCG_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    toast.success("Liste des réservistes exportée en CSV avec succès !")
  }

  return (
    <div className="max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in duration-500 pb-32">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#001035] via-[#092257] to-[#123e8e] rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden shadow-2xl border border-blue-900/50">
        <div className="absolute inset-0 opacity-15 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        </div>
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-amber-300 shadow-2xl shrink-0">
              <RefreshCw className="w-10 h-10 animate-spin-slow" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-300 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-amber-400/30">
                <ShieldCheck className="w-4 h-4 text-amber-400" /> Gestion Scolarité & Réglementations ENCG
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Espace des Étudiants Réservistes & Dérogations
              </h1>
              <p className="text-blue-100/90 text-sm max-w-2xl font-medium mt-1">
                Suivi centralisé des étudiants en dette de modules (Réservistes), contrôle des réinscriptions et délivrance des dérogations du Conseil d'Établissement.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={handleExportCsv}
              className="flex items-center gap-2 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" /> Exporter Liste (CSV)
            </button>
            <button 
              onClick={fetchData}
              className="p-3.5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 transition-all cursor-pointer shadow-md"
              title="Actualiser"
            >
              <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOTAL ÉTUDIANTS RÉSERVISTES</span>
            <h3 className="text-3xl font-black text-slate-900 mt-1">{summary.total_reservistes || 0}</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Avec au moins 1 module en dette</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center font-black text-xl shadow-inner">
            <Users className="w-7 h-7" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DÉROGATIONS ACCORDÉES</span>
            <h3 className="text-3xl font-black text-emerald-600 mt-1">{summary.total_derogations || 0}</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Par le Conseil d'Établissement</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center font-black text-xl shadow-inner">
            <Award className="w-7 h-7" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CUMUL DES MODULES EN DETTE</span>
            <h3 className="text-3xl font-black text-indigo-600 mt-1">{summary.total_debts_count || 0}</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Modules à repasser en rattrapage</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-black text-xl shadow-inner">
            <BookOpen className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* Top Recurrent Debt Modules */}
      {topModules.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-3">
          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" /> MODULES LES PLUS RÉCURRENTS EN DETTE (TOP 5)
          </h4>
          <div className="flex flex-wrap items-center gap-3">
            {topModules.map(m => (
              <div key={m.module_code} className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl flex items-center gap-2.5">
                <span className="font-mono text-xs font-black text-[#0f2863]">{m.module_code}</span>
                <span className="text-xs font-bold text-slate-700 line-clamp-1">{m.module_name}</span>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-black rounded-md">{m.count} étudiants</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              FILTRER PAR FILIÈRE
            </label>
            <select
              value={selectedFiliere}
              onChange={(e) => setSelectedFiliere(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-bold bg-white text-slate-800 focus:ring-2 focus:ring-[#0f2863] outline-hidden shadow-xs"
            >
              <option value="all">Toutes les Filières ENCG</option>
              {filieres.map((f: any) => (
                <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              STATUT ÉTUDIANT
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs font-bold bg-white text-slate-800 focus:ring-2 focus:ring-[#0f2863] outline-hidden shadow-xs"
            >
              <option value="all">Tous les Réservistes</option>
              <option value="derogation">Avec Dérogation Uniquement</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              RECHERCHE RAPIDE
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                placeholder="Nom, Prénom, CNE, Apogée..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 text-xs font-bold bg-white text-slate-800 focus:ring-2 focus:ring-[#0f2863] outline-hidden shadow-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Reservistes List Table */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-xl overflow-hidden p-3">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="px-6 py-4">Apogée / CNE</th>
                <th className="px-6 py-4">Étudiant</th>
                <th className="px-6 py-4">Filière</th>
                <th className="px-6 py-4">Modules en Dette</th>
                <th className="px-6 py-4">Statut Dérogation</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-semibold">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-[#0f2863] mx-auto" />
                    <p className="text-xs font-bold text-slate-400 mt-2">Chargement des données réservistes...</p>
                  </td>
                </tr>
              ) : reservistes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-slate-400 font-bold text-xs">
                    Aucun étudiant réserviste trouvé pour ces critères.
                  </td>
                </tr>
              ) : reservistes.map((student) => (
                <tr key={student.student_id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs font-black text-slate-600">{student.cne}</td>
                  <td className="px-6 py-4">
                    <div className="font-extrabold text-slate-900 text-xs">{student.full_name}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{student.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-black border border-slate-200">
                      {student.filiere_code}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {student.debt_modules.map((m: any) => (
                        <span key={m.module_code} className="px-2.5 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-black rounded-md border border-amber-200">
                          {m.module_code} (S{m.semester_number})
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {student.derogation?.status === 'accordee' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Dérogation Accordée
                      </span>
                    ) : student.derogation?.status === 'en_attente' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> En Attente
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-500 border border-slate-200">
                        Aucune Dérogation
                      </span>
                    )}
                    {student.derogation?.reference && (
                      <div className="text-[9px] font-mono text-slate-400 mt-0.5">Réf: {student.derogation.reference}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleSendNotificationMail(student)}
                        disabled={sendingMailId === student.student_id}
                        className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-black transition-all cursor-pointer inline-flex items-center gap-1.5"
                        title="Envoyer un émail de notification via Resend"
                      >
                        {sendingMailId === student.student_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSignature className="w-3.5 h-3.5" />} Email
                      </button>
                      <button
                        onClick={() => handleOpenAuditModal(student.student_id)}
                        className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-black transition-all cursor-pointer inline-flex items-center gap-1.5"
                        title="Voir tous les modules validés et restant à valider"
                      >
                        <Search className="w-3.5 h-3.5" /> Audit & Backup Cursus
                      </button>
                      <button
                        onClick={() => handleOpenDerogationModal(student)}
                        className="px-3.5 py-2 bg-[#0f2863] hover:bg-[#193a86] text-white rounded-xl text-xs font-black transition-all shadow-xs active:scale-95 cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Award className="w-3.5 h-3.5" /> Gérer Dérogation
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Granting Dérogation */}
      {isModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden p-8 space-y-6 animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Dérogation Exceptionnelle</h3>
                  <p className="text-xs text-slate-500 font-semibold">Conseil d'Établissement ENCG</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ÉTUDAINT CIBLÉ</span>
              <p className="text-base font-black text-slate-900">{selectedStudent.full_name} ({selectedStudent.cne})</p>
              <p className="text-xs text-indigo-600 font-bold">Filière: {selectedStudent.filiere_code} — {selectedStudent.total_debts} modules en dette</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Décision du Conseil / Statut
                </label>
                <select
                  value={derogationStatus}
                  onChange={(e) => setDerogationStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#0f2863] outline-hidden"
                >
                  <option value="accordee">✅ Dérogation Accordée (Autorisé)</option>
                  <option value="en_attente">⏳ Dossier en Attente de Décision</option>
                  <option value="refusee">❌ Dérogation Refusée</option>
                  <option value="aucune">⚪ Aucune Dérogation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Référence de la Décision Officielle
                </label>
                <input
                  type="text"
                  value={derogationRef}
                  onChange={(e) => setDerogationRef(e.target.value)}
                  placeholder="Ex: DEROG-2026-FES-482"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#0f2863] outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Notes & Conditions Particulières
                </label>
                <textarea
                  rows={3}
                  value={derogationNotes}
                  onChange={(e) => setDerogationNotes(e.target.value)}
                  placeholder="Commentaires du Conseil d'Établissement..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#0f2863] outline-hidden resize-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3.5 px-4 font-black text-xs uppercase tracking-wider text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSaveDerogation}
                disabled={savingDerogation}
                className="flex-1 py-3.5 px-4 font-black text-xs uppercase tracking-wider text-white bg-gradient-to-r from-[#0f2863] to-[#1d429b] hover:from-[#15347d] hover:to-[#224cb0] rounded-2xl shadow-lg active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {savingDerogation ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Enregistrer Décision
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal for Audit Cursus & Backup Historique */}
      {isAuditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden p-8 space-y-6 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            
            <div className="flex items-center justify-between shrink-0 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    Audit du Cursus & Backup Historique
                  </h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    Historique sauvegardé des modules validés et restant à valider
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsAuditModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingAudit || !auditData ? (
              <div className="py-16 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#0f2863] mx-auto" />
                <p className="text-xs font-bold text-slate-400 mt-2">Chargement de l'historique archivé...</p>
              </div>
            ) : (
              <div className="space-y-6 overflow-y-auto pr-2 flex-1">
                {/* Student Summary */}
                <div className="bg-gradient-to-r from-slate-900 to-[#0f2863] p-6 rounded-3xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-300 tracking-widest">{auditData.student.filiere_code} — {auditData.student.filiere_name}</span>
                    <h4 className="text-xl font-black">{auditData.student.full_name}</h4>
                    <p className="text-xs font-mono text-slate-300">CNE / Apogée: {auditData.student.cne}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-3xl font-black text-emerald-400">{auditData.stats.progression_percentage}%</span>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">PROGRESSION CURSUS</p>
                    <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden mt-1">
                      <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${auditData.stats.progression_percentage}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Progress Badges */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
                    <span className="block text-2xl font-black text-emerald-700">{auditData.stats.validated_count}</span>
                    <span className="text-[10px] font-black text-emerald-800 uppercase">Modules Validés (Backup)</span>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-center">
                    <span className="block text-2xl font-black text-amber-700">{auditData.stats.debt_count}</span>
                    <span className="text-[10px] font-black text-amber-800 uppercase">Modules en Dette</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                    <span className="block text-2xl font-black text-slate-700">{auditData.stats.total_modules}</span>
                    <span className="text-[10px] font-black text-slate-600 uppercase">Total Cursus</span>
                  </div>
                </div>

                {/* Modules Timeline / Grid */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    DÉTAIL PAR MODULE ET HISTORIQUE ARCHIVÉ
                  </h4>

                  <div className="space-y-2">
                    {auditData.curriculum.map((m: any) => (
                      <div 
                        key={m.module_id}
                        className={cn(
                          "p-4 rounded-2xl border transition-all flex items-center justify-between gap-4",
                          m.status === 'validated' ? "bg-emerald-50/60 border-emerald-200" :
                          m.status === 'debt' ? "bg-amber-50/70 border-amber-200" :
                          "bg-slate-50 border-slate-200"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-mono font-black text-xs text-[#0f2863] shrink-0">
                            S{m.semester_number}
                          </span>
                          <div>
                            <div className="font-extrabold text-slate-900 text-xs">
                              {m.module_code} - {m.module_name}
                            </div>
                            <div className="text-[10px] text-slate-500 font-semibold">
                              {m.status_label} {m.validated_at && `(${m.validated_at})`} {m.debt_since && `(Depuis ${m.debt_since})`}
                            </div>
                          </div>
                        </div>

                        <div>
                          {m.status === 'validated' ? (
                            <span className="px-3 py-1 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-xs">
                              {m.grade} / 20
                            </span>
                          ) : m.status === 'debt' ? (
                            <span className="px-3 py-1 bg-amber-500 text-white rounded-xl text-xs font-black shadow-xs">
                              À Repasser
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs font-bold">En attente</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="shrink-0 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => window.print()}
                className="py-3 px-5 text-xs font-black uppercase text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer flex items-center gap-2"
              >
                <FileText className="w-4 h-4" /> Imprimer Audit Cursus
              </button>
              <button
                type="button"
                onClick={() => setIsAuditModalOpen(false)}
                className="py-3 px-6 text-xs font-black uppercase text-white bg-[#0f2863] hover:bg-[#193a86] rounded-xl transition-all shadow-md cursor-pointer"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
