import { useState, FormEvent, useRef, useEffect, useMemo } from 'react'
import {
  Search, Plus, Edit2, Trash2, GraduationCap, Users, Briefcase,
  ChevronDown, Check, Building2, LayoutGrid, Table as TableIcon,
  Mail, Phone, Award, ShieldCheck, Sparkles, Filter, X,
  FileSpreadsheet, Download, RefreshCw, MoreVertical, Eye, Calendar,
  Copy, ExternalLink, Hash, CheckCircle2, AlertCircle, BookOpen, Clock,
  ArrowUpRight, UserCheck, Shield
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ExcelActions from '@shared/components/ui/ExcelActions'
import { Button } from '@shared/components/ui/Button'
import { Input } from '@shared/components/ui/Input'
import { Modal } from '@shared/components/ui/Modal'
import { Spinner } from '@shared/components/ui/Spinner'
import type { Department } from '@/types/models'

// ── Department Color Schemes ────────────────────────────────────────────────
const DEPT_THEMES: Record<string, { bg: string; text: string; border: string; dot: string; lightBg: string }> = {
  'Sciences de Gestion': {
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
    dot: 'bg-indigo-500',
    lightBg: 'from-indigo-600 to-blue-600',
  },
  'Économie Appliquée': {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-500',
    lightBg: 'from-emerald-600 to-teal-600',
  },
  'Droit des Affaires': {
    bg: 'bg-amber-500/10 dark:bg-amber-500/20',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
    lightBg: 'from-amber-600 to-orange-600',
  },
  'Langues et Communication': {
    bg: 'bg-purple-500/10 dark:bg-purple-500/20',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
    dot: 'bg-purple-500',
    lightBg: 'from-purple-600 to-pink-600',
  },
  'Informatique de Gestion': {
    bg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
    text: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-200 dark:border-cyan-800',
    dot: 'bg-cyan-500',
    lightBg: 'from-cyan-600 to-blue-600',
  },
}

function getDeptTheme(deptName?: string) {
  if (!deptName) {
    return {
      bg: 'bg-slate-500/10 dark:bg-slate-500/20',
      text: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-200 dark:border-slate-800',
      dot: 'bg-slate-400',
      lightBg: 'from-slate-600 to-slate-700',
    }
  }
  for (const [key, val] of Object.entries(DEPT_THEMES)) {
    if (deptName.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(deptName.toLowerCase())) {
      return val
    }
  }
  return {
    bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
    dot: 'bg-indigo-500',
    lightBg: 'from-indigo-600 to-blue-600',
  }
}

// ── Grade Badge Styling ─────────────────────────────────────────────────────
function getGradeBadge(grade?: string) {
  const g = (grade || 'PES').toUpperCase()
  if (g.includes('PES')) {
    return {
      label: 'PES',
      full: 'Professeur de l\'Enseignement Supérieur',
      badgeClass: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    }
  }
  if (g.includes('PH') || g.includes('HABIL')) {
    return {
      label: 'PH',
      full: 'Professeur Habilité',
      badgeClass: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    }
  }
  if (g.includes('PA') || g.includes('ASSIST')) {
    return {
      label: 'PA',
      full: 'Professeur Assistant',
      badgeClass: 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
    }
  }
  return {
    label: grade || 'ENSEIGNANT',
    full: grade || 'Corps Enseignant',
    badgeClass: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  }
}

// ── Custom Select Component ─────────────────────────────────────────────────
interface CustomSelectProps {
  label?: string
  icon?: any
  value: string | number
  onChange: (val: any) => void
  options: { value: string | number; label: string; badge?: string }[]
  placeholder: string
  disabled?: boolean
}

function CustomSelect({ label, icon: Icon, value, onChange, options, placeholder, disabled }: CustomSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find(o => String(o.value) === String(value))

  return (
    <div ref={ref} className={cn("relative space-y-1 w-full", open ? "z-[100]" : "z-10")}>
      {label && (
        <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
          {Icon && <Icon className="w-3.5 h-3.5 text-indigo-500" />}
          {label}
        </label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full px-3.5 py-2.5 bg-white dark:bg-slate-800/90 border rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-xs text-left",
          open 
            ? "border-indigo-500 ring-4 ring-indigo-500/15 text-indigo-900 dark:text-indigo-200" 
            : "border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 text-slate-800 dark:text-slate-100",
          disabled && "opacity-40 cursor-not-allowed"
        )}
      >
        <span className={cn("truncate font-semibold", !selectedOption && "text-slate-400 font-normal")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ml-1.5", open && "rotate-180 text-indigo-600")} />
      </button>

      {open && !disabled && (
        <div className="absolute z-[9999] top-full left-0 mt-1.5 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-2xl py-1.5 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl">
          <div
            onClick={() => {
              onChange('')
              setOpen(false)
            }}
            className="px-3.5 py-2 text-xs font-medium text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between"
          >
            <span>{placeholder}</span>
          </div>
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value)
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className={cn(
                  "px-3.5 py-2 text-xs font-semibold cursor-pointer flex items-center justify-between transition-colors group",
                  isSelected
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                    : "text-slate-700 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-300"
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="truncate">{opt.label}</span>
                  {opt.badge && (
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {opt.badge}
                    </span>
                  )}
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Types ───────────────────────────────────────────────────────────────────
interface Professor {
  id: number | string;
  employee_number?: string;
  cin?: string;
  first_name: string;
  last_name: string;
  name_ar?: string;
  email: string;
  phone?: string;
  grade?: string;
  specialty?: string;
  contract_type: 'permanent' | 'contractual' | 'visiting';
  hire_date?: string;
  is_active: boolean;
  department?: string;
  department_id?: number | null;
}

interface ProfessorForm {
  first_name: string;
  last_name: string;
  name_ar: string;
  employee_number: string;
  cin: string;
  email: string;
  phone: string;
  grade: string;
  specialty: string;
  contract_type: 'permanent' | 'contractual' | 'visiting';
  hire_date: string;
  is_active: boolean;
  department_id: string;
}

const EMPTY_FORM: ProfessorForm = {
  first_name: '',
  last_name: '',
  name_ar: '',
  employee_number: '',
  cin: '',
  email: '',
  phone: '',
  grade: 'PES',
  specialty: '',
  contract_type: 'permanent',
  hire_date: '',
  is_active: true,
  department_id: '',
};

export default function ProfessorsListPage() {
  const { t } = useTranslation(['professors', 'common'])
  const queryClient = useQueryClient()

  // Filters & display state
  const [search, setSearch] = useState('')
  const [contractFilter, setContractFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [activeDeptTab, setActiveDeptTab] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  
  // Modals & Drawers
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | string | null>(null)
  const [form, setForm] = useState<ProfessorForm>({ ...EMPTY_FORM })
  const [selectedProfForView, setSelectedProfForView] = useState<Professor | null>(null)

  // API Queries
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['professors', { search, contractFilter }],
    queryFn: () => api.get('/hr/professors', { params: { search, contract_type: contractFilter } }).then(r => r.data)
  })

  const { data: deptsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get('/departments').then(r => r.data)
  })

  const professors: Professor[] = data?.data || []
  const departments: Department[] = deptsData?.data || []

  // Mutations
  const saveMutation = useMutation({
    mutationFn: (payload: Partial<Professor>) => editingId ? api.put(`/hr/professors/${editingId}`, payload) : api.post('/hr/professors', payload),
    onSuccess: () => {
      toast.success(t('common:messages.success', { defaultValue: 'Dossier enseignant enregistré avec succès !' }))
      queryClient.invalidateQueries({ queryKey: ['professors'] })
      setShowModal(false)
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e?.response?.data?.message || t('common:messages.error', { defaultValue: 'Une erreur est survenue lors de l\'enregistrement.' }))
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => api.delete(`/hr/professors/${id}`),
    onSuccess: () => {
      toast.success(t('common:messages.success', { defaultValue: 'Enseignant retiré de la liste avec succès.' }))
      queryClient.invalidateQueries({ queryKey: ['professors'] })
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e?.response?.data?.message || 'Erreur lors de la suppression.')
    }
  })

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...EMPTY_FORM })
    setShowModal(true)
  }

  const openEdit = (p: Professor) => {
    setEditingId(p.id)
    setForm({
      first_name: p.first_name || '',
      last_name: p.last_name || '',
      name_ar: p.name_ar || '',
      employee_number: p.employee_number || '',
      cin: p.cin || '',
      email: p.email || '',
      phone: p.phone || '',
      grade: p.grade || 'PES',
      specialty: p.specialty || '',
      contract_type: p.contract_type || 'permanent',
      hire_date: p.hire_date ? p.hire_date.substring(0, 10) : '',
      is_active: p.is_active ?? true,
      department_id: p.department_id?.toString() ?? '',
    })
    setShowModal(true)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const payload = {
      ...form,
      department_id: form.department_id ? parseInt(form.department_id as string, 10) : null
    }
    saveMutation.mutate(payload as any)
  }

  const handleDelete = (p: Professor) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le professeur ${p.first_name} ${p.last_name} ?`)) {
      deleteMutation.mutate(p.id)
    }
  }

  const setF = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }))

  // Filter logic
  const filtered = useMemo(() => {
    return professors.filter(p => {
      const q = search.toLowerCase().trim()
      const matchesSearch = !q || (
        `${p.first_name} ${p.last_name} ${p.name_ar || ''} ${p.email} ${p.specialty || ''} ${p.department || ''} ${p.employee_number || ''}`
          .toLowerCase()
          .includes(q)
      )
      const matchesContract = !contractFilter || p.contract_type === contractFilter
      
      const deptMatchVal = activeDeptTab !== 'all' ? activeDeptTab : departmentFilter
      const matchesDept = !deptMatchVal || (
        (p.department_id && String(p.department_id) === String(deptMatchVal)) ||
        (p.department && p.department.toLowerCase().includes(deptMatchVal.toLowerCase()))
      )

      return matchesSearch && matchesContract && matchesDept
    })
  }, [professors, search, contractFilter, departmentFilter, activeDeptTab])

  // Aggregate Metrics
  const permanentCount = professors.filter(p => p.contract_type === 'permanent').length
  const vacataireCount = professors.filter(p => p.contract_type === 'visiting').length
  const contractualCount = professors.filter(p => p.contract_type === 'contractual').length
  const activeCount = professors.filter(p => p.is_active).length

  // Department counts
  const deptCounts = useMemo(() => {
    const map: Record<string, number> = {}
    professors.forEach(p => {
      const name = p.department || 'Non assigné'
      map[name] = (map[name] || 0) + 1
    })
    return map
  }, [professors])

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-16 font-sans">

      {/* ══════════════════════════════════════════════════════════════
          1. EXECUTIVE HERO BANNER & KPI STRIP
      ══════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/30 p-6 sm:p-8 text-white shadow-xl">
        {/* Ambient background orbs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Row */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>ANNUAIRE OFFICIEL DU CORPS ENSEIGNANT • ENCG FÈS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Corps Professoral & Enseignants
            </h1>
            <p className="text-xs sm:text-sm text-slate-300/90 font-medium max-w-2xl">
              Gestion centralisée des professeurs permanents, contractuels et vacataires, cartographie des départements et suivi statutaire.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <ExcelActions 
              model="professors" 
              label="Professeurs" 
              variant="hero"
              onImportSuccess={() => queryClient.invalidateQueries({ queryKey: ['professors'] })} 
            />
            
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl transition-all text-xs shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nouveau Professeur</span>
            </button>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-6 mt-6 border-t border-white/10">
          
          <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all">
            <div className="flex items-center justify-between text-indigo-300">
              <span className="text-[11px] font-extrabold uppercase tracking-wider">Effectif Global</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1">{professors.length}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Enseignants enregistrés</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-emerald-400/30 transition-all">
            <div className="flex items-center justify-between text-emerald-300">
              <span className="text-[11px] font-extrabold uppercase tracking-wider">Titulaires d'État</span>
              <Award className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">{permanentCount}</div>
            <div className="text-[11px] text-emerald-300/70 mt-0.5">Permanents (PES / PH / PA)</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-purple-400/30 transition-all">
            <div className="flex items-center justify-between text-purple-300">
              <span className="text-[11px] font-extrabold uppercase tracking-wider">Vacataires & CDD</span>
              <Briefcase className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-purple-300 mt-1">{vacataireCount + contractualCount}</div>
            <div className="text-[11px] text-purple-300/70 mt-0.5">Sous contrat CGI Art. 73</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-teal-400/30 transition-all">
            <div className="flex items-center justify-between text-teal-300">
              <span className="text-[11px] font-extrabold uppercase tracking-wider">Actifs & Synchronisés</span>
              <ShieldCheck className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-teal-300 mt-1">{activeCount}</div>
            <div className="text-[11px] text-teal-300/70 mt-0.5">Accès portail validé</div>
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          2. QUICK DEPARTMENT TABS BAR
      ══════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => { setActiveDeptTab('all'); setDepartmentFilter(''); }}
          className={cn(
            "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border",
            activeDeptTab === 'all'
              ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-sm"
              : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400"
          )}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Tous les départements</span>
          <span className={cn(
            "px-1.5 py-0.2 rounded-full text-[10px] font-black",
            activeDeptTab === 'all' ? "bg-white/20 dark:bg-black/20" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
          )}>
            {professors.length}
          </span>
        </button>

        {departments.map((d) => {
          const count = deptCounts[d.name] || 0
          const isSelected = activeDeptTab === String(d.id)
          const theme = getDeptTheme(d.name)
          return (
            <button
              key={d.id}
              onClick={() => {
                setActiveDeptTab(isSelected ? 'all' : String(d.id))
                setDepartmentFilter(isSelected ? '' : String(d.id))
              }}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 border",
                isSelected
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400"
              )}
            >
              <span className={cn("w-2 h-2 rounded-full shrink-0", isSelected ? "bg-white" : theme.dot)} />
              <span>{d.name}</span>
              <span className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px] font-black",
                isSelected ? "bg-white/20" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              )}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          3. SEARCH, ADVANCED FILTERS & VIEW TOGGLE
      ══════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs p-3.5 sm:p-4 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
          
          {/* Search Bar */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Rechercher par nom (FR / AR), email, matricule, spécialité..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
            {search && (
              <button 
                onClick={() => setSearch('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
                title="Effacer la recherche"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns & View Controls */}
          <div className="flex items-center gap-2.5 w-full lg:w-auto flex-wrap sm:flex-nowrap justify-between lg:justify-end">
            
            {/* Contract Type Filter */}
            <div className="w-full sm:w-48">
              <CustomSelect
                value={contractFilter}
                onChange={(val) => setContractFilter(val)}
                placeholder="Tous les statuts"
                options={[
                  { value: 'permanent', label: 'Permanent', badge: 'Titulaire' },
                  { value: 'contractual', label: 'Contractuel', badge: 'CDD' },
                  { value: 'visiting', label: 'Vacataire', badge: 'Horaire' }
                ]}
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
              <button
                onClick={() => setViewMode('table')}
                title="Vue Tableau Liste"
                className={cn(
                  "p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                  viewMode === 'table'
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                )}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Tableau</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                title="Vue Trombinoscope Cartes"
                className={cn(
                  "p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                  viewMode === 'grid'
                    ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                )}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Cartes</span>
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => refetch()}
              title="Rafraîchir les données"
              className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-white hover:border-indigo-300 transition-all cursor-pointer shrink-0"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isRefetching && "animate-spin text-indigo-600")} />
            </button>

          </div>
        </div>

        {/* Counter and Active Tag Strip */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-slate-900 dark:text-white">
              {filtered.length} {filtered.length > 1 ? 'enseignants trouvés' : 'enseignant trouvé'}
            </span>
            {(search || contractFilter || departmentFilter || activeDeptTab !== 'all') && (
              <button 
                onClick={() => { 
                  setSearch(''); 
                  setContractFilter(''); 
                  setDepartmentFilter(''); 
                  setActiveDeptTab('all'); 
                }}
                className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1 ml-2"
              >
                <X className="w-3 h-3" /> Réinitialiser les filtres
              </button>
            )}
          </div>
          <div className="text-[11px] font-medium text-slate-400 hidden sm:block">
            École Nationale de Commerce et de Gestion de Fès • 2026-2027
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          4. MAIN VIEW: TABLE OR GRID
      ══════════════════════════════════════════════════════════════ */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-16 text-center shadow-xs">
          <Spinner size="lg" className="text-indigo-600 mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">Chargement de l'annuaire professoral...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-16 text-center shadow-xs">
          <div className="w-14 h-14 bg-indigo-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3 text-indigo-600">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-slate-800 dark:text-white">Aucun enseignant trouvé</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Aucun membre du corps professoral ne correspond aux critères de recherche ou au département sélectionné.
          </p>
          <Button variant="link" onClick={openCreate} className="mt-3 text-indigo-600 font-bold">
            + Ajouter un nouvel enseignant
          </Button>
        </div>
      ) : viewMode === 'table' ? (
        /* ── LUXURY TABLE VIEW ────────────────────────────────────── */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start border-collapse">
              <thead>
                <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200/70 dark:border-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-3.5 text-start">Enseignant / Identité</th>
                  <th className="px-4 py-3.5 text-start">Grade & Spécialité</th>
                  <th className="px-4 py-3.5 text-start">Département d'Attache</th>
                  <th className="px-4 py-3.5 text-start">Statut Statutaire</th>
                  <th className="px-4 py-3.5 text-center">État</th>
                  <th className="px-5 py-3.5 text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filtered.map((prof) => {
                  const initials = `${prof.first_name?.[0] || ''}${prof.last_name?.[0] || ''}`.toUpperCase()
                  const deptTheme = getDeptTheme(prof.department)
                  const gradeInfo = getGradeBadge(prof.grade)

                  return (
                    <tr 
                      key={prof.id} 
                      className="hover:bg-indigo-50/40 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
                      onClick={() => setSelectedProfForView(prof)}
                    >
                      {/* Column 1: Identity (Name in French + Arabic + Email) */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-black text-xs shrink-0 shadow-xs relative",
                            deptTheme.lightBg
                          )}>
                            {initials}
                            {prof.is_active && (
                              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                Pr. {prof.last_name} {prof.first_name}
                              </span>
                              
                              {/* Official Arabic Name */}
                              {prof.name_ar && (
                                <span 
                                  dir="rtl" 
                                  className="px-2 py-0.5 rounded-md text-[11px] font-serif font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60"
                                >
                                  {prof.name_ar}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-slate-400 text-[11px] mt-0.5">
                              <span className="flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-200">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {prof.email}
                              </span>
                              {prof.employee_number && (
                                <span className="hidden sm:inline-flex items-center gap-0.5 font-mono text-[10px] text-slate-400">
                                  <Hash className="w-2.5 h-2.5" />
                                  PPR: {prof.employee_number}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Column 2: Grade & Specialty */}
                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border",
                            gradeInfo.badgeClass
                          )}>
                            <Award className="w-3 h-3 text-amber-500" />
                            {gradeInfo.label}
                          </span>
                          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                            {prof.specialty || 'Finance & Gestion'}
                          </p>
                        </div>
                      </td>

                      {/* Column 3: Department */}
                      <td className="px-4 py-3.5">
                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-xl border text-[11px] font-bold"
                          style={{ borderColor: 'transparent' }}
                        >
                          <span className={cn("w-2 h-2 rounded-full shrink-0", deptTheme.dot)} />
                          <span className={deptTheme.text}>
                            {prof.department || 'Sciences de Gestion'}
                          </span>
                        </div>
                      </td>

                      {/* Column 4: Contract Type (Clean, compliant with Rule 6) */}
                      <td className="px-4 py-3.5">
                        {prof.contract_type === 'permanent' ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <Shield className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                            <span>Titulaire (PES/PH)</span>
                          </div>
                        ) : prof.contract_type === 'visiting' ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            <Clock className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                            <span>Vacataire (CGI 17%)</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Briefcase className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            <span>Contractuel (CDD)</span>
                          </div>
                        )}
                      </td>

                      {/* Column 5: Status */}
                      <td className="px-4 py-3.5 text-center">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide",
                          prof.is_active
                            ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700"
                        )}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", prof.is_active ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
                          {prof.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>

                      {/* Column 6: Action Buttons */}
                      <td className="px-5 py-3.5 text-end" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          
                          {/* View Profile Drawer */}
                          <button
                            onClick={() => setSelectedProfForView(prof)}
                            title="Consulter la fiche complète"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit Details */}
                          <button
                            onClick={() => openEdit(prof)}
                            title="Modifier le dossier"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(prof)}
                            title="Supprimer du corps professoral"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
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
        </div>
      ) : (
        /* ── TROMBINOSCOPE / GRID CARDS VIEW ──────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((prof) => {
            const initials = `${prof.first_name?.[0] || ''}${prof.last_name?.[0] || ''}`.toUpperCase()
            const deptTheme = getDeptTheme(prof.department)
            const gradeInfo = getGradeBadge(prof.grade)

            return (
              <div 
                key={prof.id}
                onClick={() => setSelectedProfForView(prof)}
                className="group relative bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-all flex flex-col justify-between cursor-pointer"
              >
                {/* Department Accent Bar */}
                <div className={cn("h-2 w-full bg-gradient-to-r", deptTheme.lightBg)} />

                <div className="p-5 space-y-4">
                  {/* Top card identity */}
                  <div className="flex items-start justify-between gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-black text-sm shadow-sm relative shrink-0",
                      deptTheme.lightBg
                    )}>
                      {initials}
                      {prof.is_active && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900" />
                      )}
                    </div>

                    <span className={cn(
                      "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border",
                      gradeInfo.badgeClass
                    )}>
                      {gradeInfo.label}
                    </span>
                  </div>

                  {/* Names */}
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
                      Pr. {prof.last_name} {prof.first_name}
                    </h3>
                    {prof.name_ar && (
                      <p dir="rtl" className="text-xs font-serif font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                        {prof.name_ar}
                      </p>
                    )}
                    <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-1 truncate">
                      {prof.specialty || 'Finance & Management'}
                    </p>
                  </div>

                  {/* Metadata Chips */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate text-[11px] font-semibold">{prof.department || 'Sciences de Gestion'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate text-[11px]">{prof.email}</span>
                    </div>

                    {prof.phone && (
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="text-[11px]">{prof.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div 
                  className="px-5 py-3 bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between"
                  onClick={e => e.stopPropagation()}
                >
                  <span className={cn(
                    "text-[10px] font-extrabold uppercase",
                    prof.contract_type === 'permanent' ? "text-blue-600 dark:text-blue-400" : "text-purple-600 dark:text-purple-400"
                  )}>
                    {prof.contract_type === 'permanent' ? '🏛️ Titulaire' : '⏱️ Vacataire'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => setSelectedProfForView(prof)}
                      title="Voir Profil"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => openEdit(prof)}
                      title="Modifier"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDelete(prof)}
                      title="Supprimer"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          5. SLIDE-OVER DRAWER: FICHE PROFIL DÉTAILLÉE DU PROFESSEUR
      ══════════════════════════════════════════════════════════════ */}
      {selectedProfForView && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setSelectedProfForView(null)}
          />

          {/* Drawer Panel */}
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl z-10 overflow-y-auto flex flex-col justify-between animate-in slide-in-from-right duration-250 border-s border-slate-200 dark:border-slate-800">
            
            {/* Drawer Header */}
            <div>
              <div className="relative p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
                <button 
                  onClick={() => setSelectedProfForView(null)}
                  className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shrink-0">
                    {`${selectedProfForView.first_name?.[0] || ''}${selectedProfForView.last_name?.[0] || ''}`.toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white leading-tight">
                      Pr. {selectedProfForView.first_name} {selectedProfForView.last_name}
                    </h2>
                    {selectedProfForView.name_ar && (
                      <p dir="rtl" className="text-sm font-serif font-bold text-amber-300 mt-0.5">
                        {selectedProfForView.name_ar}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                        {selectedProfForView.grade || 'PES'}
                      </span>
                      <span className="text-xs text-slate-300 font-medium truncate">
                        {selectedProfForView.specialty || 'Finance & Management'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="p-6 space-y-6">
                
                {/* Department & Status Section */}
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    Affectation Académique & Statut
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Département</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {selectedProfForView.department || 'Sciences de Gestion'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Régime Contractuel</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {selectedProfForView.contract_type === 'permanent' ? 'Titulaire Fonction Publique' : 'Vacataire Externe'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Date de Recrutement</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {selectedProfForView.hire_date ? new Date(selectedProfForView.hire_date).toLocaleDateString('fr-FR') : 'Non renseignée'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">État du Compte</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Compte Actif
                      </span>
                    </div>
                  </div>
                </div>

                {/* Administrative Identifiers */}
                <div className="space-y-3">
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    Identifiants Administratifs & Contact
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 text-xs">
                      <span className="text-slate-400 flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-indigo-500" /> Email Académique
                      </span>
                      <a href={`mailto:${selectedProfForView.email}`} className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                        {selectedProfForView.email}
                      </a>
                    </div>

                    {selectedProfForView.phone && (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 text-xs">
                        <span className="text-slate-400 flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-emerald-500" /> Téléphone
                        </span>
                        <span className="font-bold text-slate-800 dark:text-white font-mono">
                          {selectedProfForView.phone}
                        </span>
                      </div>
                    )}

                    {selectedProfForView.employee_number && (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 text-xs">
                        <span className="text-slate-400 flex items-center gap-2">
                          <Hash className="w-3.5 h-3.5 text-amber-500" /> Matricule PPR / SOM
                        </span>
                        <span className="font-bold text-slate-800 dark:text-white font-mono">
                          {selectedProfForView.employee_number}
                        </span>
                      </div>
                    )}

                    {selectedProfForView.cin && (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 text-xs">
                        <span className="text-slate-400 flex items-center gap-2">
                          <Award className="w-3.5 h-3.5 text-blue-500" /> Carte Nationale (CIN)
                        </span>
                        <span className="font-bold text-slate-800 dark:text-white font-mono">
                          {selectedProfForView.cin}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Legal / Statutory Compliance Note (Rule 6) */}
                <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800/70 text-xs space-y-1">
                  <div className="font-extrabold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Conformité Statutaire & Droits Documentaires</span>
                  </div>
                  <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/70 leading-relaxed">
                    {selectedProfForView.contract_type === 'permanent'
                      ? 'En tant que fonctionnaire titulaire d\'État, ce professeur est éligible aux attestations de travail, de salaire et ordres de mission permanent.'
                      : 'Enseignant vacataire régi par l\'Art. 73-II-F du CGI marocain (retenue 17%). Accès exclusif aux décomptes horaires et attestations IGR.'}
                  </p>
                </div>

              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  const profToEdit = selectedProfForView
                  setSelectedProfForView(null)
                  openEdit(profToEdit)
                }}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                <span>Modifier le dossier</span>
              </Button>

              <Button
                variant="primary"
                onClick={() => {
                  window.location.href = `mailto:${selectedProfForView.email}`
                }}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700"
              >
                <Mail className="w-4 h-4" />
                <span>Contacter par mail</span>
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          6. CREATE / EDIT MODAL
      ══════════════════════════════════════════════════════════════ */}
      <Modal 
        open={showModal} 
        onClose={() => setShowModal(false)}
        title={editingId ? "Modifier le Dossier Enseignant" : "Ajouter un Enseignant au Corps Professoral"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-indigo-50/70 dark:bg-slate-800/70 p-4 rounded-2xl border border-indigo-100 dark:border-slate-700 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Identité & Statut Académique</div>
              <div className="text-[11px] text-slate-500">Renseignez les données administratives et l'affectation départementale officielle.</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Prénom (Français) *</label>
              <Input required value={form.first_name} onChange={setF('first_name')} placeholder="ex: Mohammed" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nom de Famille (Français) *</label>
              <Input required value={form.last_name} onChange={setF('last_name')} placeholder="ex: BENJELLOUN" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nom Complet en Arabe (بالعربية)</label>
              <Input dir="rtl" value={form.name_ar} onChange={setF('name_ar')} placeholder="مثال: محمد بنجلون" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Matricule PPR / SOM (Fonction Publique)</label>
              <Input value={form.employee_number} onChange={setF('employee_number')} placeholder="ex: 1849201" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Académique (@encg-fes.ac.ma) *</label>
              <Input required type="email" value={form.email} onChange={setF('email')} placeholder="m.benjelloun@encg-fes.ac.ma" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Téléphone Mobile</label>
              <Input value={form.phone} onChange={setF('phone')} placeholder="+212 6xx xxx xxx" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Grade Académique *</label>
              <Input value={form.grade} onChange={setF('grade')} placeholder="PES, Professeur Habilité, PA..." />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Spécialité Principale</label>
              <Input value={form.specialty} onChange={setF('specialty')} placeholder="Finance d'entreprise, Marketing, Audit..." />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <CustomSelect
              label="Type de Contrat *"
              icon={Briefcase}
              value={form.contract_type}
              onChange={(val) => setForm(prev => ({ ...prev, contract_type: val }))}
              placeholder="Sélectionner le type de contrat"
              options={[
                { value: 'permanent', label: 'Permanent (PES/PH)', badge: 'Titulaire' },
                { value: 'contractual', label: 'Contractuel (CDD)', badge: 'CDD' },
                { value: 'visiting', label: 'Vacataire (Horaire)', badge: 'Horaire' }
              ]}
            />

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Date d'Embauche / Recrutement</label>
              <Input type="date" value={form.hire_date} onChange={setF('hire_date')} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            <CustomSelect
              label="Département d'Affectation *"
              icon={Building2}
              value={form.department_id}
              onChange={(val) => setForm(prev => ({ ...prev, department_id: val }))}
              placeholder="-- Choisir un Département Pédagogique --"
              options={departments.map((dept: Department) => ({
                value: dept.id,
                label: dept.name,
                badge: dept.code || undefined
              }))}
            />
          </div>

          <div className="flex items-center gap-3 pt-2 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <input 
              type="checkbox" 
              id="is_active" 
              checked={form.is_active as boolean}
              onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer" 
            />
            <label htmlFor="is_active" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
              Enseignant Actif & Autorisé à accéder aux relevés et fiches de notes
            </label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" isLoading={saveMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
              {editingId ? "Mettre à jour le Dossier" : "Enregistrer l'Enseignant"}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  )
}
