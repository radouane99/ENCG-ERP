import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { 
  UserX, Search, Trash2, CheckCircle2, XCircle, Loader2, Sparkles, 
  FileText, ExternalLink, RefreshCw, X, ShieldAlert, Eye, Calendar, 
  Check, Filter, AlertTriangle, Clock, Award, ShieldCheck, Stethoscope, Building2,
  ChevronRight, Hash, ArrowUpRight, CheckCheck, FileCheck, Layers
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
    name_ar?: string
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
    toast.loading('Validation du justificatif en cours...')
    try {
      await absencesApi.updateStatus(id, 'approved')
      toast.dismiss()
      toast.success('Justificatif validé : l\'absence est désormais enregistrée comme JUSTIFIÉE !')
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
      toast.success('Justificatif supprimé avec succès.')
      fetchJustifications()
    } catch {
      toast.error('Erreur lors de la suppression du justificatif.')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          cls: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          dotCls: 'bg-emerald-500',
          label: 'Approuvé & Justifié',
          icon: CheckCircle2,
        }
      case 'rejected':
        return {
          cls: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
          dotCls: 'bg-rose-500',
          label: 'Rejeté (Non Justifié)',
          icon: XCircle,
        }
      default:
        return {
          cls: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          dotCls: 'bg-amber-500 animate-pulse',
          label: 'En Attente d\'Arbitrage',
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

  const hasActiveFilters = !!(search || statusFilter)

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-20 font-sans">
      
      {/* ══════════════════════════════════════════════════════════════
          1. EXECUTIVE HERO BANNER
      ══════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 border border-indigo-900/40 p-6 sm:p-8 text-white shadow-xl">
        {/* Ambient decorative glow orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-lg shrink-0 border border-white/20">
              <UserX className="w-7 h-7 sm:w-8 sm:h-8 text-amber-300" />
            </div>
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>ARBITRAGE DE SCOLARITÉ • DÉLAI RÉGLEMENTAIRE DES 48H • ENCG FÈS</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
                Validation des Certificats & Justificatifs d'Absences
              </h1>
              <p className="text-xs sm:text-sm text-slate-300/90 font-medium max-w-2xl">
                Contrôle réglementaire des certificats médicaux, vérification de conformité du délai légal de 48h et validation des absences justifiées.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-end">
            <button 
              onClick={() => fetchJustifications()}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold border border-white/20 transition-all text-xs cursor-pointer backdrop-blur-md hover:scale-[1.02] active:scale-95 shadow-sm"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 text-amber-300", loading && "animate-spin")} />
              <span>Rafraîchir</span>
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          2. INTERACTIVE KPI METRIC CARDS (CLICKABLE TABS)
      ══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Total Card */}
        <div 
          onClick={() => { setStatusFilter(''); setPage(1); }}
          className={cn(
            "p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden flex items-center justify-between",
            statusFilter === ''
              ? "bg-white dark:bg-slate-800 border-indigo-500 ring-2 ring-indigo-500/20 shadow-md"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs"
          )}
        >
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Demandes</span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{stats.total || absences.length || 0}</div>
            <div className="text-[10px] text-slate-400 font-medium">Toutes les soumissions</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Card */}
        <div 
          onClick={() => { setStatusFilter('pending'); setPage(1); }}
          className={cn(
            "p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden flex items-center justify-between",
            statusFilter === 'pending'
              ? "bg-amber-50/80 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20 shadow-md"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-amber-400/60 shadow-xs"
          )}
        >
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <span>En Attente</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">{stats.pending || 0}</div>
            <div className="text-[10px] text-amber-700/80 dark:text-amber-400/80 font-medium">À contrôler par le jury</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Approved Card */}
        <div 
          onClick={() => { setStatusFilter('approved'); setPage(1); }}
          className={cn(
            "p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden flex items-center justify-between",
            statusFilter === 'approved'
              ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-emerald-400/60 shadow-xs"
          )}
        >
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Validés & Justifiés</span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats.approved || 0}</div>
            <div className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 font-medium">Absences régularisées</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Rejected Card */}
        <div 
          onClick={() => { setStatusFilter('rejected'); setPage(1); }}
          className={cn(
            "p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden flex items-center justify-between",
            statusFilter === 'rejected'
              ? "bg-rose-50/80 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/20 shadow-md"
              : "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-rose-400/60 shadow-xs"
          )}
        >
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">Rejetés</span>
            <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">{stats.rejected || 0}</div>
            <div className="text-[10px] text-rose-700/80 dark:text-rose-400/80 font-medium">Hors délai ou non conformes</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold shrink-0">
            <XCircle className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════
          3. SEARCH, STATUS PILLS & FILTER BAR
      ══════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
          
          {/* Live Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative w-full lg:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par étudiant (FR/AR), CNE, CIN, module..."
              className="w-full pl-10 pr-9 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
            {search && (
              <button 
                type="button" 
                onClick={() => { setSearch(''); fetchJustifications(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400 cursor-pointer"
                title="Effacer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Quick Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto scrollbar-none">
            {[
              { val: '', label: 'Tous', count: stats.total || 0 },
              { val: 'pending', label: '⏳ En Attente', count: stats.pending || 0 },
              { val: 'approved', label: '✅ Justifiés', count: stats.approved || 0 },
              { val: 'rejected', label: '❌ Rejetés', count: stats.rejected || 0 },
            ].map(({ val, label, count }) => (
              <button
                key={val}
                onClick={() => { setStatusFilter(val); setPage(1); }}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border",
                  statusFilter === val
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400"
                )}
              >
                <span>{label}</span>
                <span className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-black",
                  statusFilter === val ? "bg-white/20 text-white" : "bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                )}>
                  {count}
                </span>
              </button>
            ))}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-2.5 py-1.5 text-[11px] font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0 ml-1"
              >
                <X className="w-3 h-3" /> Réinitialiser
              </button>
            )}
          </div>

        </div>

        {/* Counter and Meta Strip */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 dark:text-white">
              {absences.length} {absences.length > 1 ? 'dossiers répertoriés' : 'dossier répertorié'}
            </span>
            <span className="text-slate-400">• Règlement pédagogique des 48h strict</span>
          </div>
          <div className="text-[11px] font-medium text-slate-400 hidden sm:block">
            Système d'Arbitrage des Absences • ENCG Fès
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          4. MAIN DATA TABLE (REFINED & ELEVATED)
      ══════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start border-collapse">
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200/70 dark:border-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="px-5 py-3.5 text-start">Étudiant(e) / Identité</th>
                <th className="px-4 py-3.5 text-start">Séance & Module Manqué</th>
                <th className="px-4 py-3.5 text-start">Comparaison Dates & Délai 48h</th>
                <th className="px-4 py-3.5 text-center">Décision Jury</th>
                <th className="px-5 py-3.5 text-end">Contrôle & Arbitrage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
                    <p className="text-xs font-bold text-slate-400">Chargement des dossiers d'absences...</p>
                  </td>
                </tr>
              ) : absences.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-slate-400">
                    <UserX className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">Aucun justificatif d'absence trouvé.</p>
                    <p className="text-xs text-slate-400 mt-0.5">Aucune demande ne correspond à ce filtre.</p>
                  </td>
                </tr>
              ) : absences.map((item) => {
                const badge = getStatusBadge(item.status)
                const BadgeIcon = badge.icon
                const studentName = item.student?.name || `${item.student?.first_name || ''} ${item.student?.last_name || ''}`.trim() || 'Étudiant ENCG'
                const initials = getInitials(studentName)
                const isWithin48 = item.is_within_48h !== false

                return (
                  <tr 
                    key={item.id} 
                    className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                    onClick={() => setSelectedAbsence(item)}
                  >
                    {/* Column 1: Student Identity */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0 border border-white/20">
                          {initials}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {studentName}
                            </span>
                            
                            {/* Official Arabic Name */}
                            {item.student?.name_ar && (
                              <span 
                                dir="rtl" 
                                className="px-2 py-0.5 rounded-md text-[11px] font-serif font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60"
                              >
                                {item.student.name_ar}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold">CNE: {item.student?.cne || 'N/A'}</span>
                            <span>•</span>
                            <span>CIN: {item.student?.cin || 'N/A'}</span>
                            {item.student?.student_number && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-[10px] text-slate-400">#{item.student?.student_number}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Session & Module */}
                    <td className="px-4 py-3.5">
                      <div className="space-y-1">
                        <div className="font-bold text-slate-900 dark:text-white text-xs truncate max-w-[220px]">
                          {item.attendance?.module_name || 'Comptabilité Générale'}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider border",
                            item.attendance?.session_type === 'TD'
                              ? "bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
                              : item.attendance?.session_type === 'TP'
                              ? "bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800"
                              : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                          )}>
                            {item.attendance?.session_type || 'CM'}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            Groupe: <strong className="text-slate-700 dark:text-slate-300 font-mono">{item.attendance?.group_name || 'TC-S2-G1'}</strong>
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Column 3: Dates Comparison & 48h Compliance */}
                    <td className="px-4 py-3.5">
                      <div className="space-y-1 text-[11px]">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                          <Calendar className="w-3 h-3 text-indigo-600" />
                          <span>Absence : <span className="font-mono">{item.attendance?.date || item.absence_date || item.created_at}</span></span>
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                          <Stethoscope className="w-3 h-3 text-amber-500" />
                          <span>Certificat : <span className="font-mono">{item.certificate_date || item.created_at}</span></span>
                        </div>

                        {/* 48h Compliance Pill */}
                        <div className="pt-0.5">
                          {isWithin48 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-200 dark:border-emerald-800">
                              <Check className="w-3 h-3 text-emerald-600" /> Délai Respecté (&le; 48h)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[10px] font-extrabold border border-rose-200 dark:border-rose-800">
                              <AlertTriangle className="w-3 h-3 text-rose-600" /> Hors Délai (&gt; 48h)
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Column 4: Status */}
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border shadow-2xs', badge.cls)}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', badge.dotCls)} />
                          <span>{badge.label}</span>
                        </span>
                        {item.status === 'rejected' && item.rejection_reason && (
                          <div className="text-[10px] text-rose-600 dark:text-rose-400 font-medium max-w-[160px] truncate" title={item.rejection_reason}>
                            Motif : {item.rejection_reason}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Column 5: Action Buttons */}
                    <td className="px-5 py-3.5 text-end" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {item.status === 'pending' ? (
                          <button
                            onClick={() => setSelectedAbsence(item)}
                            className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-[11px] rounded-xl shadow-xs transition-all hover:scale-[1.02] flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-amber-300" />
                            <span>Arbitrer</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedAbsence(item)}
                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Voir dossier</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Supprimer la demande"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
        <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Page {page} sur {totalPages} • Total de {stats.total || absences.length} dossiers
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 text-xs disabled:opacity-40 transition-all cursor-pointer"
            >
              Précédent
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 text-xs disabled:opacity-40 transition-all cursor-pointer"
            >
              Suivant
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          5. MODAL INSPECTION & ARBITRAGE APPROFONDI
      ══════════════════════════════════════════════════════════════ */}
      {selectedAbsence && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-[200] animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Arbitrage du Justificatif d'Absence #{selectedAbsence.id}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Contrôle de validité médicale et respect du délai des 48h</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Absence Date Card */}
              <div className="bg-indigo-50/70 dark:bg-indigo-950/40 p-3.5 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 space-y-1">
                <div className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Date du Cours Manqué
                </div>
                <div className="text-base font-black text-slate-900 dark:text-white font-mono">
                  {selectedAbsence.attendance?.date || selectedAbsence.absence_date || selectedAbsence.created_at}
                </div>
                <div className="text-[11px] font-bold text-slate-500 truncate">
                  {selectedAbsence.attendance?.module_name} ({selectedAbsence.attendance?.session_type || 'CM'})
                </div>
              </div>

              {/* Certificate Date Card */}
              <div className="bg-amber-50/70 dark:bg-amber-950/40 p-3.5 rounded-2xl border border-amber-100 dark:border-amber-900/50 space-y-1">
                <div className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <Stethoscope className="w-3.5 h-3.5" /> Date Émission Certificat
                </div>
                <div className="text-base font-black text-slate-900 dark:text-white font-mono">
                  {selectedAbsence.certificate_date || selectedAbsence.created_at}
                </div>
                <div className="text-[11px] font-bold text-slate-500 truncate" title={selectedAbsence.doctor_clinic}>
                  {selectedAbsence.doctor_clinic || 'Praticien / Clinique'}
                </div>
              </div>

              {/* 48h Compliance Result */}
              <div className={cn(
                "p-3.5 rounded-2xl border space-y-1",
                selectedAbsence.is_within_48h !== false
                  ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50"
                  : "bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/50"
              )}>
                <div className={cn(
                  "text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1",
                  selectedAbsence.is_within_48h !== false ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                )}>
                  <Clock className="w-3.5 h-3.5" /> Contrôle Délais 48h
                </div>
                <div className="text-base font-black text-slate-900 dark:text-white">
                  {selectedAbsence.delay_hours || 24}h Écoulées
                </div>
                <div className={cn(
                  "text-[11px] font-bold",
                  selectedAbsence.is_within_48h !== false ? "text-emerald-700 dark:text-emerald-300" : "text-rose-700 dark:text-rose-300"
                )}>
                  {selectedAbsence.is_within_48h !== false ? "✓ Délai Légal Respecté" : "⚠️ Hors Délai (> 48h)"}
                </div>
              </div>

            </div>

            {/* Student Info Box */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                  Identité de l'Étudiant
                </span>
                <span className="text-xs font-bold text-slate-500">{selectedAbsence.student?.filiere}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-base font-black text-slate-900 dark:text-white">
                  {selectedAbsence.student?.name}
                </span>
                {selectedAbsence.student?.name_ar && (
                  <span dir="rtl" className="text-sm font-serif font-bold text-indigo-700 dark:text-indigo-300">
                    {selectedAbsence.student.name_ar}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 pt-1">
                <div>CNE : <span className="text-slate-900 dark:text-white font-mono">{selectedAbsence.student?.cne || 'N/A'}</span></div>
                <div>CIN : <span className="text-slate-900 dark:text-white font-mono">{selectedAbsence.student?.cin || 'N/A'}</span></div>
                <div>Matricule : <span className="text-slate-900 dark:text-white font-mono">#{selectedAbsence.student?.student_number}</span></div>
              </div>
            </div>

            {/* Reason & Observations */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Motif Déclaré</div>
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <div className="font-bold text-indigo-600 dark:text-indigo-400 mb-0.5">{selectedAbsence.reason}</div>
                <div className="text-slate-500 dark:text-slate-400 text-[11px]">{selectedAbsence.description || 'Justificatif soumis en ligne via le portail étudiant.'}</div>
              </div>
            </div>

            {/* Official Medical Certificate File Link */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Pièce Jointe Officielle Numérisée</div>
              {selectedAbsence.document_url || selectedAbsence.document_path ? (
                <a
                  href={selectedAbsence.document_url || selectedAbsence.document_path}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-3.5 bg-gradient-to-r from-amber-500/10 to-amber-500/20 border border-amber-400/40 rounded-2xl text-amber-900 dark:text-amber-200 font-bold text-xs hover:border-amber-500 transition-all cursor-pointer shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-amber-500 shrink-0" />
                    <div>
                      <div className="font-bold">Ouvrir le Certificat Médical Numérisé</div>
                      <div className="text-[10px] text-amber-700 dark:text-amber-300 font-medium">Inspecter la signature et le cachet médical dans une fenêtre sécurisée</div>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-amber-500 shrink-0" />
                </a>
              ) : (
                <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl text-xs font-bold text-center">
                  Aucun document PDF numérisé joint à cette demande.
                </div>
              )}
            </div>

            {/* Decision Footer Buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              {selectedAbsence.status === 'pending' ? (
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => handleApprove(selectedAbsence.id)}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approuver & Marquer Justifiée
                  </button>
                  <button
                    onClick={() => { setSelectedAbsence(null); setRejectingAbsence(selectedAbsence); }}
                    className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
                  >
                    <XCircle className="w-4 h-4" /> Rejeter le Justificatif
                  </button>
                </div>
              ) : (
                <div className="w-full text-center text-xs font-bold text-slate-400 py-1">
                  Décision d'arbitrage : <strong className="uppercase text-slate-700 dark:text-slate-200">{selectedAbsence.status}</strong>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          6. MODAL REJET DU JUSTIFICATIF (AVEC MOTIFS RAPIDES)
      ══════════════════════════════════════════════════════════════ */}
      {rejectingAbsence && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-[200] animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center font-bold">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Rejeter le Justificatif</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Dossier #{rejectingAbsence.id} • {rejectingAbsence.student?.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setRejectingAbsence(null)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                Motif officiel du rejet :
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Précisez la raison (ex: dépassement des 48h, document illisible, absence de cachet...)"
                rows={3}
                className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
              />
              
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {[
                  'Délai de 48h dépassé',
                  'Certificat médical non conforme',
                  'Absence de cachet médical officiel',
                  'Dates non correspondantes'
                ].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRejectionReason(r)}
                    className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setRejectingAbsence(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer"
              >
                Confirmer le Rejet
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
