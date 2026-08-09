import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  UserX, Search, Trash2, CheckCircle2, XCircle, Loader2, Sparkles, 
  FileText, ExternalLink, RefreshCw, X, ShieldAlert, Eye, Calendar, 
  Check, Filter, AlertTriangle, Clock, Award, ShieldCheck, Stethoscope, Building2
} from 'lucide-react'
import { cn } from '@shared/lib/utils'
import { absencesApi } from '@shared/api/absences'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

interface AbsenceItem {
  id: number
  reason: string
  description?: string
  doctor_clinic?: string
  absence_date?: string
  certificate_date?: string
  delay_hours?: number
  is_within_48h?: boolean
  document_path?: string
  document_url?: string
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string
  reviewed_at?: string
  created_at: string
  student?: {
    id: number
    name: string
    first_name?: string
    last_name?: string
    student_number?: string
    cne?: string
    cin?: string
    filiere?: string
  }
  attendance?: {
    id: number
    module_code?: string
    module_name?: string
    group_name?: string
    session_type?: string
    date?: string
  }
  reviewer?: string
}

export default function AdminAbsencesPage() {
  const { t, i18n } = useTranslation(['absences', 'common'])
  const isRtl = i18n.language === 'ar'

  const [absences, setAbsences] = useState<AbsenceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Modals State
  const [selectedAbsence, setSelectedAbsence] = useState<AbsenceItem | null>(null)
  const [rejectingAbsence, setRejectingAbsence] = useState<AbsenceItem | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  const fetchJustifications = async () => {
    try {
      setLoading(true)
      const res = await absencesApi.getJustifications({ 
        search: search.trim() || undefined,
        status: statusFilter || undefined, 
        page, 
        per_page: 15 
      })
      setAbsences(res.data || [])
      setStats(res.stats || { total: 0, pending: 0, approved: 0, rejected: 0 })
      setTotalPages(res.meta?.last_page || 1)
    } catch (error) {
      console.error('Failed to fetch absences:', error)
      toast.error('Erreur lors du chargement des justificatifs d\'absences.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJustifications()
  }, [statusFilter, page])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchJustifications()
  }

  const handleClearFilters = () => {
    setSearch('')
    setStatusFilter('')
    setPage(1)
  }

  const handleApprove = async (id: number) => {
    toast.loading('Approbation & Validation de l\'absence en cours...')
    try {
      await absencesApi.updateStatus(id, 'approved')
      toast.dismiss()
      toast.success('📜 Absence validée & enregistrée comme JUSTIFIÉE !')
      fetchJustifications()
      if (selectedAbsence?.id === id) setSelectedAbsence(null)
    } catch {
      toast.dismiss()
      toast.error('Erreur lors de la validation du justificatif.')
    }
  }

  const handleConfirmReject = async () => {
    if (!rejectingAbsence) return
    toast.loading('Rejet du justificatif en cours...')
    try {
      await absencesApi.updateStatus(rejectingAbsence.id, 'rejected', rejectionReason.trim() || 'Justificatif non conforme ou délai de 48h dépassé.')
      toast.dismiss()
      toast.success('Justificatif d\'absence rejeté.')
      setRejectingAbsence(null)
      setRejectionReason('')
      fetchJustifications()
      if (selectedAbsence?.id === rejectingAbsence.id) setSelectedAbsence(null)
    } catch {
      toast.dismiss()
      toast.error('Erreur lors du rejet du justificatif.')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer définitivement ce justificatif d\'absence ?')) return
    try {
      await absencesApi.deleteJustification(id)
      toast.success('Justificatif supprimé.')
      fetchJustifications()
    } catch {
      toast.error('Erreur lors de la suppression du justificatif.')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          cls: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
          dotCls: 'bg-emerald-500',
          label: 'APPROUVÉ & JUSTIFIÉ',
          icon: CheckCircle2,
        }
      case 'rejected':
        return {
          cls: 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
          dotCls: 'bg-rose-500',
          label: 'REJETÉ (NON JUSTIFIÉ)',
          icon: XCircle,
        }
      default:
        return {
          cls: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
          dotCls: 'bg-amber-500 animate-pulse',
          label: 'EN ATTENTE D\'EXAMEN',
          icon: Clock,
        }
    }
  }

  const getInitials = (name?: string) => {
    if (!name) return '?'
    const parts = name.split(' ')
    if (parts.length >= 2) return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
    return name.substring(0, 2).toUpperCase()
  }

  const getReasonIcon = (reason?: string) => {
    const r = (reason || '').toLowerCase()
    if (r.includes('médic') || r.includes('medic') || r.includes('malad')) return '🩺'
    if (r.includes('accident') || r.includes('urgence')) return '🚑'
    if (r.includes('famil')) return '👨‍👩‍👧'
    if (r.includes('convoc') || r.includes('offic')) return '🏛️'
    return '📄'
  }

  const hasActiveFilters = !!(search || statusFilter)

  return (
    <div className="space-y-8 animate-in p-6 max-w-[1400px] mx-auto font-sans pb-24">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none overflow-hidden"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-amber-300 shadow-2xl shrink-0">
              <UserX className="w-10 h-10 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-400/20 text-blue-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-blue-400/30">
                <Sparkles className="w-4 h-4 text-amber-400" /> Arbitrage & Contrôle Réglementaire des 48h
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Validation des Certificats & Justificatifs d'Absences
              </h1>
              <p className="text-blue-100/90 text-sm max-w-2xl font-medium mt-1">
                Vérification de la validité des certificats médicaux, comparaison des dates d'absence avec la date d'émission du médecin et respect du délai légal de 48h.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => fetchJustifications()}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold border border-white/20 transition-all text-xs uppercase tracking-wider cursor-pointer backdrop-blur-md"
            >
              <RefreshCw className={cn("w-4 h-4 text-amber-300", loading && "animate-spin")} /> Rafraîchir
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0f2863] dark:text-blue-300 flex items-center justify-center font-black text-lg">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {stats.total || absences.length || 0}
            </div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Demandes</div>
          </div>
        </div>

        <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 p-5 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-lg">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-700 dark:text-amber-300 tracking-tight">
              {stats.pending || 0}
            </div>
            <div className="text-[10px] font-black uppercase tracking-wider text-amber-600/80 dark:text-amber-400/80">En Attente de Contrôle</div>
          </div>
        </div>

        <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 p-5 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 tracking-tight">
              {stats.approved || 0}
            </div>
            <div className="text-[10px] font-black uppercase tracking-wider text-emerald-600/80 dark:text-emerald-400/80">Approuvés & Justifiés</div>
          </div>
        </div>

        <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 p-5 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center font-black text-lg">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-rose-700 dark:text-rose-300 tracking-tight">
              {stats.rejected || 0}
            </div>
            <div className="text-[10px] font-black uppercase tracking-wider text-rose-600/80 dark:text-rose-400/80">Rejetés / Non Conformes</div>
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4 items-center">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par Nom, Prénom, CNE, CIN, Matricule Apogée ou Module..."
              className="w-full pl-12 pr-10 py-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            {search && (
              <button 
                type="button" 
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Dropdown Filter */}
          <div className="w-full md:w-64 shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">Tous les états (Tous)</option>
              <option value="pending">⏳ En attente de contrôle</option>
              <option value="approved">✅ Approuvés uniquement</option>
              <option value="rejected">❌ Rejetés uniquement</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full md:w-auto px-6 py-3.5 bg-[#0f2863] hover:bg-[#1a387e] text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md cursor-pointer shrink-0"
          >
            Filtrer
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-4 py-3.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
            >
              <X className="w-4 h-4" /> Réinitialiser
            </button>
          )}
        </form>
      </div>

      {/* Main Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2rem] shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-black text-[#0f2863] dark:text-white tracking-tight">
              Registre Général des Justificatifs d'Absences
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Examen des certificats médicaux, comparaison des dates d'absence et décision du jury.
            </p>
          </div>
          <span className="bg-blue-50 dark:bg-blue-950/60 text-[#0f2863] dark:text-blue-300 text-xs font-black px-3.5 py-1.5 rounded-full border border-blue-200 dark:border-blue-800/60">
            {absences.length} Demandes affichées
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200/60 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Étudiant(e) & Identité</th>
                <th className="px-6 py-4">Séance & Module</th>
                <th className="px-6 py-4">Comparaison Dates & Délai 48h</th>
                <th className="px-6 py-4 text-center">État Décision</th>
                <th className="px-6 py-4 text-right">Contrôle & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-16">
                    <Loader2 className="w-10 h-10 animate-spin mx-auto text-[#0f2863] dark:text-blue-400 mb-3" />
                    <p className="text-xs font-bold text-slate-400">Chargement des justificatifs d'absences en cours...</p>
                  </td>
                </tr>
              ) : absences.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-slate-400">
                    <UserX className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
                    <p className="font-bold text-slate-700 dark:text-slate-300 text-base">Aucun justificatif d'absence trouvé.</p>
                    <p className="text-xs text-slate-400 mt-1">Essayez de réinitialiser vos filtres de recherche.</p>
                  </td>
                </tr>
              ) : absences.map((item) => {
                const badge = getStatusBadge(item.status)
                const BadgeIcon = badge.icon
                const studentName = item.student?.name || `${item.student?.first_name || ''} ${item.student?.last_name || ''}`.trim() || 'Étudiant ENCG'
                const initials = getInitials(studentName)

                const isWithin48 = item.is_within_48h !== false

                return (
                  <tr key={item.id} className="hover:bg-blue-50/30 dark:hover:bg-slate-800/30 transition-colors">
                    {/* Student Identity */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0f2863] to-blue-700 text-amber-300 font-black flex items-center justify-center text-sm shadow-md shrink-0 border border-white/20">
                          {initials}
                        </div>
                        <div>
                          <div className="font-black text-slate-900 dark:text-white text-sm">
                            {studentName}
                          </div>
                          <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                            CNE: {item.student?.cne || 'N/A'} &nbsp;|&nbsp; CIN: {item.student?.cin || 'N/A'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                            Matricule: <span className="font-bold text-slate-600 dark:text-slate-300">{item.student?.student_number}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Session & Module */}
                    <td className="px-6 py-5">
                      <div>
                        <div className="font-black text-slate-800 dark:text-slate-200 text-sm">
                          {item.attendance?.module_name || 'Comptabilité / Management'}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 font-black text-[9px] uppercase tracking-wider border border-blue-200 dark:border-blue-800">
                            {item.attendance?.session_type || 'CM'}
                          </span>
                          <span className="text-xs font-semibold text-slate-500">
                            Groupe: <strong className="text-slate-700 dark:text-slate-300">{item.attendance?.group_name || 'TC-S1-G1'}</strong>
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Dates Comparison & 48h Compliance */}
                    <td className="px-6 py-5">
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          <span>Absence: <strong>{item.attendance?.date || item.absence_date || item.created_at}</strong></span>
                        </div>

                        <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-amber-500" />
                          <span>Certificat: <strong>{item.certificate_date || item.created_at}</strong></span>
                        </div>

                        {/* 48h Badge */}
                        <div className="pt-1">
                          {isWithin48 ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-black border border-emerald-200 dark:border-emerald-800">
                              <Check className="w-3 h-3 text-emerald-500" /> Délai Respecté (&le; 48h)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-[10px] font-black border border-amber-200 dark:border-amber-800">
                              <AlertTriangle className="w-3 h-3 text-amber-500" /> Hors Délai (&gt; 48h)
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={cn('inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm', badge.cls)}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', badge.dotCls)}></span>
                          <BadgeIcon className="w-3.5 h-3.5" />
                          {badge.label}
                        </span>
                        {item.status === 'rejected' && item.rejection_reason && (
                          <div className="text-[10px] text-rose-600 dark:text-rose-400 font-medium max-w-[150px] truncate" title={item.rejection_reason}>
                            Motif: {item.rejection_reason}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedAbsence(item)}
                          className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-[10px] uppercase tracking-wider rounded-xl shadow-md transition-all hover:scale-102 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-300" /> Inspecter & Décider
                        </button>

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <span className="text-xs font-bold text-slate-400">
            Page {page} sur {totalPages} ({absences.length} justificatifs)
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 text-xs disabled:opacity-40 transition-all cursor-pointer"
            >
              Précédent
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 text-xs disabled:opacity-40 transition-all cursor-pointer"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      {/* Modal Rejet Justificatif */}
      {rejectingAbsence && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-[200] animate-in fade-in-50">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">Rejeter le Justificatif</h3>
                  <p className="text-xs text-slate-400 font-medium">Demande #{rejectingAbsence.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setRejectingAbsence(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2">
                Motif officiel du refus :
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Ex: Certificat médical expiré, manque de cachet médical officiel, délai de 48h dépassé..."
                rows={3}
                className="w-full p-4 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
              />
              
              <div className="flex flex-wrap gap-2 mt-3">
                {['Délai de 48h dépassé', 'Certificat médical expiré', 'Absence de cachet médical', 'Dates non correspondantes'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRejectionReason(r)}
                    className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-full transition-all cursor-pointer"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectingAbsence(null)}
                className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs uppercase"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-lg"
              >
                Confirmer le Rejet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Inspection Approfondie & Comparaison des Dates (Admin) */}
      {selectedAbsence && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-[200] animate-in fade-in-50">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-3xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-[#0f2863] dark:text-blue-300 flex items-center justify-center font-black">
                  <Stethoscope className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">Examen & Contrôle du Certificat #{selectedAbsence.id}</h3>
                  <p className="text-xs text-slate-400 font-medium">Comparaison des dates de séance et d'émission médicale</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAbsence(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comparison Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date Absence */}
              <div className="bg-blue-50/70 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/50 space-y-1">
                <div className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Date du Cours Manqué
                </div>
                <div className="text-lg font-black text-slate-900 dark:text-white">
                  {selectedAbsence.attendance?.date || selectedAbsence.absence_date || selectedAbsence.created_at}
                </div>
                <div className="text-[11px] font-bold text-slate-500">
                  {selectedAbsence.attendance?.module_name} ({selectedAbsence.attendance?.session_type})
                </div>
              </div>

              {/* Date Certificat */}
              <div className="bg-amber-50/70 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/50 space-y-1">
                <div className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5" /> Date Émission Certificat
                </div>
                <div className="text-lg font-black text-slate-900 dark:text-white">
                  {selectedAbsence.certificate_date || selectedAbsence.created_at}
                </div>
                <div className="text-[11px] font-bold text-slate-500 truncate" title={selectedAbsence.doctor_clinic}>
                  {selectedAbsence.doctor_clinic || 'Dr. Bennani — Clinique Fès'}
                </div>
              </div>

              {/* 48h Compliance Result */}
              <div className={cn(
                "p-4 rounded-2xl border space-y-1",
                selectedAbsence.is_within_48h !== false
                  ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50"
                  : "bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50"
              )}>
                <div className={cn(
                  "text-[10px] font-black uppercase tracking-wider flex items-center gap-1",
                  selectedAbsence.is_within_48h !== false ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                )}>
                  <Clock className="w-3.5 h-3.5" /> Contrôle Délais 48h
                </div>
                <div className="text-lg font-black text-slate-900 dark:text-white">
                  {selectedAbsence.delay_hours || 24}h Écoulées
                </div>
                <div className={cn(
                  "text-[11px] font-bold",
                  selectedAbsence.is_within_48h !== false ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"
                )}>
                  {selectedAbsence.is_within_48h !== false ? "✅ Délai Légal Respecté" : "⚠️ Hors Délai (> 48h Exigés)"}
                </div>
              </div>
            </div>

            {/* Student Info Box */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider">Identité Étudiant</span>
                <span className="text-xs font-bold text-slate-500">{selectedAbsence.student?.filiere}</span>
              </div>
              <div className="text-lg font-black text-slate-900 dark:text-white">
                {selectedAbsence.student?.name}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                <div>CNE: <span className="text-slate-900 dark:text-white">{selectedAbsence.student?.cne || 'N/A'}</span></div>
                <div>CIN: <span className="text-slate-900 dark:text-white">{selectedAbsence.student?.cin || 'N/A'}</span></div>
                <div>Matricule: <span className="text-slate-900 dark:text-white">{selectedAbsence.student?.student_number}</span></div>
              </div>
            </div>

            {/* Description & Notes */}
            <div className="space-y-2">
              <div className="text-xs font-black text-slate-400 uppercase tracking-wider">Motif & Observations de l'Étudiant</div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-200">
                <div className="font-black text-blue-600 dark:text-blue-400 mb-1">{selectedAbsence.reason}</div>
                {selectedAbsence.description || 'Justificatif soumis en ligne via le portail étudiant.'}
              </div>
            </div>

            {/* Document File Link */}
            <div className="space-y-2">
              <div className="text-xs font-black text-slate-400 uppercase tracking-wider">Pièce Jointe Officielle Numérisée</div>
              {selectedAbsence.document_url || selectedAbsence.document_path ? (
                <a
                  href={selectedAbsence.document_url || selectedAbsence.document_path}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-500/10 to-amber-500/20 border border-amber-400/40 rounded-2xl text-amber-900 dark:text-amber-200 font-bold text-sm hover:border-amber-500 transition-all cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-6 h-6 text-amber-500" />
                    <div>
                      <div className="font-black">Ouvrir le Certificat Médical PDF / Scanné</div>
                      <div className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">Cliquer pour inspecter la signature et le cachet médical dans une fenêtre séparée</div>
                    </div>
                  </div>
                  <ExternalLink className="w-5 h-5 text-amber-500" />
                </a>
              ) : (
                <div className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-2xl text-xs font-bold text-center">
                  Aucun fichier numérisé joint à la demande.
                </div>
              )}
            </div>

            {/* Decision Footer Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 gap-4">
              {selectedAbsence.status === 'pending' ? (
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => handleApprove(selectedAbsence.id)}
                    className="flex-1 py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-102"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" /> Approuver & Marquer Justifié
                  </button>
                  <button
                    onClick={() => { setSelectedAbsence(null); setRejectingAbsence(selectedAbsence); }}
                    className="flex-1 py-3.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-102"
                  >
                    <XCircle className="w-4 h-4 text-rose-200" /> Rejeter le Justificatif
                  </button>
                </div>
              ) : (
                <div className="w-full text-center text-xs font-bold text-slate-400">
                  Statut de l'arbitrage : <strong className="uppercase text-slate-700 dark:text-slate-200">{selectedAbsence.status}</strong>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
