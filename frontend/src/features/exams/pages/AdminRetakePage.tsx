import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw, Search,
  GraduationCap, BookOpen, Layers, BarChart3, Check, X, ChevronDown,
  Info, Calendar, User, ChevronRight, SquareCheckBig,
} from 'lucide-react'
import { cn } from '@shared/lib/utils'
import { examsApi } from '@shared/api/exams'
import api from '@shared/lib/api'
import toast from 'react-hot-toast'

type RetakeStatus = 'Accordé' | 'Refusé' | 'En attente'
type ActiveTab    = 'pending' | 'all' | 'refused'

interface RetakeItem {
  id: number
  student_id: number
  nom: string
  email: string
  cne: string
  filiere: string
  filiere_id: number
  module: string
  module_id: number
  raison: string
  eligibilite_label: string
  status: RetakeStatus
  is_eligible: boolean
  date: string | null
  session_label: string
  decided_by: string | null   // #8
  decided_at: string | null   // #8
}

interface Stats {
  total: number
  enAttente: number
  accordes: number
  refuses: number
  eligibles: number
}

const STATUS_CFG: Record<RetakeStatus, { label: string; icon: React.ReactNode; cls: string }> = {
  'En attente': { label: 'À vérifier', icon: <Clock className="w-3 h-3" />,        cls: 'bg-amber-50 text-amber-700 border border-amber-200' },
  Accordé:      { label: 'Accordé',    icon: <CheckCircle className="w-3 h-3" />,  cls: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  Refusé:       { label: 'Refusé',     icon: <XCircle className="w-3 h-3" />,      cls: 'bg-red-50 text-red-700 border border-red-200' },
}

function ReasonBadge({ raison }: { raison: string }) {
  const l = raison.toLowerCase()
  if (l.includes('fraude'))       return <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">⚠ Fraude</span>
  if (l.includes('absence'))      return <span className="px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold">📋 Absence</span>
  if (l.includes('éliminatoire')) return <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-600 text-[10px] font-bold">✗ Éliminé</span>
  return <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">✓ Note insuff.</span>
}

export default function AdminRetakePage() {
  const [students, setStudents]       = useState<RetakeItem[]>([])
  const [stats, setStats]             = useState<Stats>({ total: 0, enAttente: 0, accordes: 0, refuses: 0, eligibles: 0 })
  const [isLoading, setIsLoading]     = useState(true)
  const [search, setSearch]           = useState('')
  const [filterFiliere, setFilterFiliere] = useState('all')
  const [filieres, setFilieres]       = useState<{ id: number; name: string }[]>([])
  const [updating, setUpdating]       = useState<number | null>(null)
  const [activeTab, setActiveTab]     = useState<ActiveTab>('pending')
  // #4 — Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  // #5 — Deadline
  const [deadline, setDeadline]       = useState('')
  const [savingDeadline, setSavingDeadline] = useState(false)

  const fetchRetakes = useCallback(async () => {
    setIsLoading(true)
    try {
      const params: Record<string, string> = {}
      if (filterFiliere !== 'all') params.filiere_id = filterFiliere
      const res = await examsApi.getRetakes(params)
      setStudents(res.data || [])
      if (res.stats) setStats(res.stats)
    } catch {
      toast.error('Erreur de chargement')
    } finally {
      setIsLoading(false)
    }
  }, [filterFiliere])

  useEffect(() => { fetchRetakes() }, [fetchRetakes])

  useEffect(() => {
    api.get('/filieres').then((res: { data: { data: { id: number; name: string }[] } }) => {
      setFilieres((res.data?.data || []).map((f) => ({ id: f.id, name: f.name })))
    }).catch(() => {})
    // #5 — Load saved deadline
    api.get('/institution-settings/retake_justification_deadline').then((r: { data: { value?: string } }) => {
      if (r.data?.value) setDeadline(r.data.value)
    }).catch(() => {})
  }, [])

  // ── Single status update ───────────────────────────────────────────────
  const handleUpdateStatus = async (id: number, status: RetakeStatus) => {
    setUpdating(id)
    try {
      await examsApi.updateRetakeStatus(id, status)
      setStudents(prev => prev.map(s => s.id === id ? { ...s, status } : s))
      setStats(prev => {
        const old = students.find(s => s.id === id)?.status
        const next = { ...prev }
        if (old === 'En attente') next.enAttente = Math.max(0, next.enAttente - 1)
        if (old === 'Accordé')   next.accordes   = Math.max(0, next.accordes - 1)
        if (old === 'Refusé')    next.refuses     = Math.max(0, next.refuses - 1)
        if (status === 'En attente') next.enAttente += 1
        if (status === 'Accordé')   next.accordes   += 1
        if (status === 'Refusé')    next.refuses     += 1
        return next
      })
      toast.success(status === 'Accordé' ? '✅ Rattrapage accordé · Email envoyé' : '❌ Rattrapage refusé · Email envoyé')
    } catch {
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setUpdating(null)
    }
  }

  // #4 — Bulk update ───────────────────────────────────────────────────
  const handleBulkUpdate = async (status: 'Accordé' | 'Refusé') => {
    if (selectedIds.size === 0) { toast.error('Sélectionnez au moins un étudiant'); return }
    setBulkLoading(true)
    try {
      await examsApi.bulkUpdateRetakeStatus([...selectedIds], status)
      setStudents(prev => prev.map(s => selectedIds.has(s.id) ? { ...s, status } : s))
      toast.success(`${selectedIds.size} décision(s) enregistrée(s) · Emails envoyés`)
      setSelectedIds(new Set())
      await fetchRetakes()
    } catch {
      toast.error('Erreur bulk')
    } finally {
      setBulkLoading(false)
    }
  }

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(s => s.id)))
    }
  }

  // #5 — Save deadline ──────────────────────────────────────────────────
  const saveDeadline = async () => {
    if (!deadline) return
    setSavingDeadline(true)
    try {
      await api.post('/institution-settings', { key: 'retake_justification_deadline', value: deadline })
      toast.success('Délai de justification enregistré')
    } catch {
      toast.error('Erreur sauvegarde délai')
    } finally {
      setSavingDeadline(false)
    }
  }

  // ── Tab + Search filter ────────────────────────────────────────────────
  const tabFiltered = students.filter(s => {
    if (activeTab === 'pending') return s.status === 'En attente'
    if (activeTab === 'refused') return s.status === 'Refusé'
    return true
  })
  const filtered = tabFiltered.filter(s =>
    !search ||
    s.nom.toLowerCase().includes(search.toLowerCase()) ||
    s.cne.toLowerCase().includes(search.toLowerCase()) ||
    s.module.toLowerCase().includes(search.toLowerCase())
  )

  const TABS: { key: ActiveTab; label: string; count: number; activeColor: string }[] = [
    { key: 'pending', label: '⚡ À décider (Absences)', count: stats.enAttente, activeColor: 'bg-amber-500 text-white' },
    { key: 'all',     label: '📋 Tous les candidats',   count: stats.total,      activeColor: 'bg-[#0f2863] text-white' },
    { key: 'refused', label: '❌ Refusés',               count: stats.refuses,    activeColor: 'bg-red-500 text-white' },
  ]

  return (
    <div className="space-y-6 p-6 max-w-[1400px] mx-auto pb-24">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0f2863] italic flex items-center gap-3">
          <GraduationCap className="w-7 h-7" /> Session Rattrapage
        </h1>
        <div className="flex items-center gap-3">
          <button onClick={fetchRetakes} className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:bg-slate-50">
            <RefreshCw className="w-3.5 h-3.5" /> Actualiser
          </button>
          <Link to="/admin/pilotage" className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600">— PILOTAGE</Link>
        </div>
      </div>

      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#0d4d8c] rounded-2xl p-5 text-white shadow-lg">
        <div className="relative z-10 flex items-start gap-4">
          <div className="p-2 bg-white/10 rounded-xl mt-0.5"><BarChart3 className="w-5 h-5" /></div>
          <div>
            <h2 className="text-base font-black mb-1">🤖 Système Rattrapage Intelligent</h2>
            <p className="text-xs text-blue-200 leading-relaxed">
              <span className="text-emerald-300 font-bold">✅ Note insuffisante (6-10)</span> → Accordé automatiquement.&nbsp;
              <span className="text-amber-300 font-bold">📋 Absence</span> → À vérifier par l'admin.&nbsp;
              <span className="text-red-300 font-bold">⚠ Fraude / Éliminatoire</span> → Refusé automatiquement.
              <br /><span className="text-blue-300">📧 Email envoyé automatiquement à chaque décision.</span>
            </p>
          </div>
        </div>
      </div>

      {/* #5 — Deadline + Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Deadline Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-[#0f2863]" />
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Délai de Justification</p>
          </div>
          <p className="text-[10px] text-slate-400 mb-3">Date limite pour que les étudiants soumettent leur justificatif d'absence. Passé ce délai, les dossiers seront refusés automatiquement.</p>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:border-[#0f2863]"
            />
            <button
              onClick={saveDeadline}
              disabled={savingDeadline || !deadline}
              className="px-3 py-2 rounded-lg bg-[#0f2863] hover:bg-[#0d4d8c] text-white text-[10px] font-bold disabled:opacity-50"
            >
              {savingDeadline ? '...' : 'Enregistrer'}
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        {[
          { label: '⚡ À décider', value: stats.enAttente, color: 'text-amber-500',   bg: 'bg-amber-50   border-amber-200' },
          { label: '✅ Accordés',  value: stats.accordes,  color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
        ].map(c => (
          <div key={c.label} className={cn('rounded-2xl p-5 border shadow-sm flex flex-col items-center justify-center text-center', c.bg)}>
            <p className={cn('text-4xl font-black mb-1', c.color)}>{isLoading ? '—' : c.value}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-slate-100">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSelectedIds(new Set()) }}
              className={cn(
                'relative flex items-center gap-2 px-6 py-3.5 text-xs font-bold transition-all',
                activeTab === tab.key ? tab.activeColor : 'text-slate-500 hover:bg-slate-50'
              )}
            >
              {tab.label}
              <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-black', activeTab === tab.key ? 'bg-white/20' : 'bg-slate-100 text-slate-500')}>
                {tab.count}
              </span>
              {tab.key === 'pending' && stats.enAttente > 0 && activeTab !== 'pending' && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          ))}

          {/* Filters right side */}
          <div className="flex-1 flex items-center justify-end gap-3 px-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
                className="pl-8 pr-3 py-2 rounded-lg border border-slate-200 text-xs outline-none focus:border-[#0f2863] w-40" />
            </div>
            <div className="relative">
              <Layers className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <select value={filterFiliere} onChange={e => setFilterFiliere(e.target.value)}
                className="pl-8 pr-6 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 outline-none appearance-none cursor-pointer">
                <option value="all">Toutes filières</option>
                {filieres.map(f => <option key={f.id} value={String(f.id)}>{f.name}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Alerts */}
        {activeTab === 'pending' && stats.enAttente === 0 && !isLoading && (
          <div className="flex items-center gap-3 px-6 py-4 bg-emerald-50 border-b border-emerald-100">
            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
            <p className="text-sm font-semibold text-emerald-700">Aucun dossier en attente ! Tous les cas d'absence ont été traités. 🎉</p>
          </div>
        )}
        {activeTab === 'pending' && stats.enAttente > 0 && (
          <div className="flex items-center gap-3 px-6 py-3 bg-amber-50 border-b border-amber-100">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-xs font-semibold text-amber-700">
              <strong>{stats.enAttente}</strong> étudiant(s) absent(s) — vérifiez si l'absence est justifiée, puis accordez ou refusez.
            </p>
          </div>
        )}

        {/* #4 — Bulk action bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between px-6 py-3 bg-[#0f2863]/5 border-b border-[#0f2863]/10">
            <p className="text-xs font-bold text-[#0f2863]">
              <SquareCheckBig className="w-4 h-4 inline mr-1.5" />{selectedIds.size} sélectionné(s)
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => handleBulkUpdate('Accordé')} disabled={bulkLoading}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold disabled:opacity-50">
                <Check className="w-3 h-3" /> Accorder tous · Emails auto
              </button>
              <button onClick={() => handleBulkUpdate('Refusé')} disabled={bulkLoading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold disabled:opacity-50">
                <X className="w-3 h-3" /> Refuser tous
              </button>
              <button onClick={() => setSelectedIds(new Set())} className="text-xs text-slate-400 hover:text-slate-600 px-2">Annuler</button>
            </div>
          </div>
        )}

        {/* Table */}
        <table className="w-full text-sm text-left">
          <thead className="text-[9px] text-slate-400 uppercase tracking-wider bg-slate-50/60">
            <tr>
              {activeTab === 'pending' && (
                <th className="px-4 py-4 w-10">
                  <input type="checkbox" className="rounded"
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onChange={toggleSelectAll} />
                </th>
              )}
              <th className="px-5 py-4 font-bold">#</th>
              <th className="px-5 py-4 font-bold">Étudiant</th>
              <th className="px-5 py-4 font-bold">Filière / Module</th>
              <th className="px-5 py-4 font-bold">Raison</th>
              <th className="px-5 py-4 font-bold text-center">Décision</th>
              {activeTab !== 'pending' && <th className="px-5 py-4 font-bold text-center">Décidé par</th>}
              {activeTab === 'pending' && <th className="px-5 py-4 font-bold text-center w-52">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 6 }).map((_, j) => (
                    <td key={j} className="px-5 py-4"><div className="h-3 bg-slate-100 rounded-full w-3/4" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-slate-400">
                    <GraduationCap className="w-10 h-10 opacity-30" />
                    <p className="text-sm font-medium">Aucun résultat</p>
                    {activeTab === 'all' && <p className="text-xs">Les candidats apparaissent après la signature du PV ordinaire.</p>}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((student, idx) => {
                const cfg      = STATUS_CFG[student.status] ?? STATUS_CFG['En attente']
                const isAbsRow = student.raison.toLowerCase().includes('absence') && student.status === 'En attente'
                return (
                  <tr key={student.id}
                    className={cn('transition-colors', isAbsRow ? 'bg-amber-50/40 hover:bg-amber-50' : 'hover:bg-slate-50/50')}>

                    {activeTab === 'pending' && (
                      <td className="px-4 py-4">
                        <input type="checkbox" className="rounded"
                          checked={selectedIds.has(student.id)}
                          onChange={() => toggleSelect(student.id)} />
                      </td>
                    )}

                    <td className="px-5 py-4 font-black text-slate-400 text-xs">{idx + 1}</td>

                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800">{student.nom}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{student.cne}</p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-700 text-xs">{student.filiere}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <BookOpen className="w-3 h-3 text-slate-400" />
                        <span className="text-[11px] text-slate-500">{student.module}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <ReasonBadge raison={student.raison} />
                      <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] truncate" title={student.raison}>{student.raison}</p>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold', cfg.cls)}>
                        {cfg.icon} {cfg.label}
                      </span>
                    </td>

                    {/* #8 — Decision history column (non-pending tabs) */}
                    {activeTab !== 'pending' && (
                      <td className="px-5 py-4 text-center">
                        {student.decided_by ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                              <User className="w-3 h-3 text-slate-400" /> {student.decided_by}
                            </div>
                            <p className="text-[10px] text-slate-400">{student.decided_at}</p>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300 italic">Automatique</span>
                        )}
                      </td>
                    )}

                    {/* Action buttons (pending tab only) */}
                    {activeTab === 'pending' && (
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => handleUpdateStatus(student.id, 'Accordé')} disabled={updating === student.id}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold disabled:opacity-50">
                            <Check className="w-3 h-3" /> Justifiée
                          </button>
                          <button onClick={() => handleUpdateStatus(student.id, 'Refusé')} disabled={updating === student.id}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold disabled:opacity-50">
                            <X className="w-3 h-3" /> Non justifiée
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        {/* Footer */}
        {!isLoading && stats.total > 0 && (
          <div className="px-5 py-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[11px] text-slate-400 font-medium">
              {stats.accordes} accordé(s) auto · {stats.enAttente} absence(s) à vérifier · {stats.refuses} refusé(s)
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Info className="w-3.5 h-3.5" />
              Taux d'accès : <strong className="text-emerald-600 ml-1">
                {stats.total > 0 ? Math.round((stats.accordes / stats.total) * 100) : 0}%
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
