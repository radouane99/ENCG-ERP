import { useState, FormEvent, useRef, useEffect } from 'react'
import {
  Search, Plus, Edit2, Trash2, GraduationCap, Users, Briefcase,
  ChevronDown, Check, Building2, LayoutGrid, Table as TableIcon,
  Mail, Phone, Award, ShieldCheck, Sparkles, Filter, X,
  FileSpreadsheet, Download, RefreshCw, MoreVertical, Eye, Calendar
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
    <div ref={ref} className={cn("relative space-y-1.5 w-full", open ? "z-[100]" : "z-10")}>
      {label && (
        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
          {Icon && <Icon className="w-3.5 h-3.5 text-blue-500" />}
          {label}
        </label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full px-4 py-3 bg-white dark:bg-slate-800 border rounded-2xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-xs text-left",
          open 
            ? "border-blue-500 ring-4 ring-blue-500/15 text-blue-900 dark:text-blue-200" 
            : "border-slate-200 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-500 text-slate-800 dark:text-slate-100",
          disabled && "opacity-40 cursor-not-allowed"
        )}
      >
        <span className={cn("truncate font-bold", !selectedOption && "text-slate-400 font-medium")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2", open && "rotate-180 text-blue-600")} />
      </button>

      {open && !disabled && (
        <div className="absolute z-[9999] top-full left-0 mt-2 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl py-2 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl">
          <div
            onClick={() => {
              onChange('')
              setOpen(false)
            }}
            className="px-4 py-2.5 text-xs font-medium text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer flex items-center justify-between"
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
                  "px-4 py-2.5 text-xs font-bold cursor-pointer flex items-center justify-between transition-colors group",
                  isSelected
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    : "text-slate-700 dark:text-slate-200 hover:bg-blue-50/50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-300"
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="truncate">{opt.label}</span>
                  {opt.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {opt.badge}
                    </span>
                  )}
                </div>
                {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface Professor {
  id: number;
  employee_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  grade: string;
  specialty: string;
  contract_type: 'permanent' | 'contractual' | 'visiting';
  hire_date: string;
  is_active: boolean;
  department: string;
  department_id: number | null;
}

const EMPTY_FORM = {
  first_name: '', last_name: '', email: '', phone: '',
  grade: 'PES', specialty: '', contract_type: 'permanent',
  hire_date: '', is_active: true, department_id: ''
};

export default function ProfessorsListPage() {
  const { t } = useTranslation(['professors', 'common'])
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [contractFilter, setContractFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [selectedProfForView, setSelectedProfForView] = useState<Professor | null>(null)

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

  const saveMutation = useMutation({
    mutationFn: (payload: Partial<Professor>) => editingId ? api.put(`/hr/professors/${editingId}`, payload) : api.post('/hr/professors', payload),
    onSuccess: () => {
      toast.success(t('common:messages.success', { defaultValue: 'Enregistrement effectué avec succès !' }))
      queryClient.invalidateQueries({ queryKey: ['professors'] })
      setShowModal(false)
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e?.response?.data?.message || t('common:messages.error', { defaultValue: 'Une erreur est survenue.' }))
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/hr/professors/${id}`),
    onSuccess: () => {
      toast.success(t('common:messages.success', { defaultValue: 'Professeur supprimé avec succès.' }))
      queryClient.invalidateQueries({ queryKey: ['professors'] })
    }
  })

  const openCreate = () => { setEditingId(null); setForm({ ...EMPTY_FORM }); setShowModal(true) }
  const openEdit = (p: Professor) => {
    setEditingId(p.id)
    setForm({
      first_name: p.first_name, last_name: p.last_name, email: p.email,
      phone: p.phone, grade: p.grade || 'PES', specialty: p.specialty || '',
      contract_type: p.contract_type || 'permanent', hire_date: p.hire_date ?? '',
      is_active: p.is_active, department_id: p.department_id?.toString() ?? ''
    })
    setShowModal(true)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const payload = { ...form, department_id: form.department_id ? parseInt(form.department_id as string) : null }
    saveMutation.mutate(payload as any)
  }

  const handleDelete = (id: number) => {
    if (confirm(t('common:messages.confirm_delete', { defaultValue: 'Êtes-vous sûr de vouloir supprimer cet enseignant ?' }))) {
      deleteMutation.mutate(id)
    }
  }

  const setF = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }))

  const filtered = professors.filter(p => {
    const matchesSearch = !search || `${p.first_name} ${p.last_name} ${p.email} ${p.specialty} ${p.department}`.toLowerCase().includes(search.toLowerCase())
    const matchesContract = !contractFilter || p.contract_type === contractFilter
    const matchesDept = !departmentFilter || (p.department_id && String(p.department_id) === String(departmentFilter)) || (p.department && p.department.toLowerCase().includes(departmentFilter.toLowerCase()))
    return matchesSearch && matchesContract && matchesDept
  })

  const CONTRACT_LABELS: Record<string, string> = {
    permanent: t('professors:contracts.permanent', { defaultValue: 'Permanent (PES/PH)' }),
    contractual: t('professors:contracts.contractual', { defaultValue: 'Contractuel (CDD)' }),
    visiting: t('professors:contracts.visiting', { defaultValue: 'Vacataire (Horaire)' }),
  }

  const permanentCount = professors.filter(p => p.contract_type === 'permanent').length
  const contractCount = professors.filter(p => p.contract_type !== 'permanent').length
  const activeCount = professors.filter(p => p.is_active).length

  return (
    <div className="space-y-8 animate-in relative p-4 md:p-8 max-w-[1550px] mx-auto font-sans pb-28">
      
      {/* 🚀 DEEP NAVY LUXURY HERO HEADER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0a193c] via-[#0f2863] to-[#1e3b8a] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40 space-y-8">
        <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-blue-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header Row */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-amber-300 shadow-2xl shrink-0 group hover:scale-105 transition-transform">
              <GraduationCap className="w-9 h-9 md:w-10 md:h-10 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400/20 to-blue-500/20 text-amber-300 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-amber-400/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> ANNUAIRE OFFICIEL DU CORPS ENSEIGNANT • ENCG FÈS
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                {t('professors:list.title', { defaultValue: 'Corps Professoral & Enseignants' })}
              </h1>
              <p className="text-blue-100/80 text-xs md:text-sm font-medium mt-1 max-w-2xl">
                {t('professors:list.subtitle', { defaultValue: 'Gestion et cartographie intégrale du corps professoral, affectations aux départements et suivi statutaire.' })}
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-3 flex-wrap shrink-0">
            <ExcelActions 
              model="professors" 
              label={t('professors:list.title', { defaultValue: 'Professeurs' })} 
              variant="hero"
              onImportSuccess={() => queryClient.invalidateQueries({ queryKey: ['professors'] })} 
            />
            
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-[#0f2863] font-black rounded-2xl transition-all text-xs uppercase tracking-wider shadow-xl hover:scale-105 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#0f2863] stroke-[3]" />
              {t('professors:list.add_button', { defaultValue: 'Nouveau Professeur' })}
            </button>
          </div>
        </div>

        {/* Dynamic KPI Stats Grid */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/10">
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 hover:border-white/25 transition-all">
            <div className="flex items-center justify-between text-blue-200">
              <span className="text-[10px] font-black uppercase tracking-wider">Total Enseignants</span>
              <Users className="w-4 h-4 text-blue-300" />
            </div>
            <div className="text-2xl font-black text-white font-mono mt-1.5">{professors.length}</div>
            <div className="text-[10px] text-blue-200/70 mt-0.5">Corps professoral actif BDD</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 hover:border-emerald-400/40 transition-all">
            <div className="flex items-center justify-between text-emerald-300">
              <span className="text-[10px] font-black uppercase tracking-wider">Permanents (PES/PH)</span>
              <Award className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1.5">{permanentCount}</div>
            <div className="text-[10px] text-emerald-200/70 mt-0.5">Titulaires de la fonction publique</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 hover:border-purple-400/40 transition-all">
            <div className="flex items-center justify-between text-purple-300">
              <span className="text-[10px] font-black uppercase tracking-wider">Vacataires / CDD</span>
              <Briefcase className="w-4 h-4 text-purple-300" />
            </div>
            <div className="text-2xl font-black text-purple-300 font-mono mt-1.5">{contractCount}</div>
            <div className="text-[10px] text-purple-200/70 mt-0.5">Experts intervenants externes</div>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 hover:border-amber-400/40 transition-all">
            <div className="flex items-center justify-between text-amber-300">
              <span className="text-[10px] font-black uppercase tracking-wider">Actifs & Opérationnels</span>
              <ShieldCheck className="w-4 h-4 text-amber-300" />
            </div>
            <div className="text-2xl font-black text-amber-300 font-mono mt-1.5">{activeCount}</div>
            <div className="text-[10px] text-amber-200/70 mt-0.5">Comptes validés & synchronisés</div>
          </div>
        </div>
      </div>

      {/* 🔍 SEARCH, FILTERS & VIEW TOGGLE BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-[2rem] shadow-xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          
          {/* Search Input */}
          <div className="relative w-full lg:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder={t('professors:list.search', { defaultValue: 'Rechercher par nom, email, spécialité ou département...' })} 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex items-center gap-3 w-full lg:w-auto">
            <div className="w-full sm:w-56">
              <CustomSelect
                value={departmentFilter}
                onChange={(val) => setDepartmentFilter(val)}
                placeholder="Tous les départements"
                options={departments.map((d: Department) => ({
                  value: d.id,
                  label: d.name,
                  badge: d.code
                }))}
              />
            </div>

            <div className="w-full sm:w-52">
              <CustomSelect
                value={contractFilter}
                onChange={(val) => setContractFilter(val)}
                placeholder={t('professors:contracts.all', { defaultValue: 'Tous les contrats' })}
                options={[
                  { value: 'permanent', label: 'Permanent', badge: 'Titulaire' },
                  { value: 'contractual', label: 'Contractuel', badge: 'CDD' },
                  { value: 'visiting', label: 'Vacataire', badge: 'Horaire' }
                ]}
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shrink-0">
              <button
                onClick={() => setViewMode('table')}
                title="Vue Tableau"
                className={cn(
                  "p-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                  viewMode === 'table'
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                )}
              >
                <TableIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                title="Vue Cartes (Grille)"
                className={cn(
                  "p-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                  viewMode === 'grid'
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => refetch()}
              title="Rafraîchir les données"
              className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-white hover:border-blue-300 transition-all cursor-pointer shrink-0"
            >
              <RefreshCw className={cn("w-4 h-4", isRefetching && "animate-spin text-blue-600")} />
            </button>
          </div>
        </div>

        {/* Active Filter Tags */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-white">
              {filtered.length} {filtered.length > 1 ? 'enseignants trouvés' : 'enseignant trouvé'}
            </span>
            {(search || contractFilter || departmentFilter) && (
              <button 
                onClick={() => { setSearch(''); setContractFilter(''); setDepartmentFilter(''); }}
                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1 ml-2"
              >
                <X className="w-3 h-3" /> Réinitialiser les filtres
              </button>
            )}
          </div>
          <div className="text-[11px] font-medium text-slate-400">
            ENCG Fès • Année Universitaire 2026-2027
          </div>
        </div>
      </div>

      {/* 📊 DATA DISPLAY: GRID VS TABLE */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-16 text-center shadow-xl">
          <Spinner size="lg" className="text-blue-600 mx-auto mb-4" />
          <p className="text-xs font-bold text-slate-500">Chargement du corps professoral en cours...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-16 text-center shadow-xl">
          <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-4 text-blue-600">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-slate-800 dark:text-white">{t('professors:list.empty', { defaultValue: 'Aucun enseignant trouvé' })}</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">Aucun résultat ne correspond à vos critères de recherche ou de filtre.</p>
          <Button variant="link" onClick={openCreate} className="mt-3 text-blue-600 font-bold">
            + Ajouter un nouvel enseignant
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        /* ── GRID CARDS VIEW ────────────────────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((prof) => {
            const initials = `${prof.first_name?.[0] || ''}${prof.last_name?.[0] || ''}`.toUpperCase()
            return (
              <div 
                key={prof.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 shadow-md hover:shadow-xl hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-all group relative overflow-hidden flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top card header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0f2863] to-blue-600 flex items-center justify-center text-white font-black text-base shadow-lg shrink-0">
                      {initials}
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border",
                      prof.is_active 
                        ? "border-emerald-300 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:border-emerald-800" 
                        : "border-slate-300 text-slate-500 bg-slate-100 dark:bg-slate-800"
                    )}>
                      {prof.is_active ? 'Actif' : 'Inactif'}
                    </span>
                  </div>

                  {/* Name & Title */}
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {prof.last_name} {prof.first_name}
                    </h3>
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" />
                      {prof.grade || 'PES'} • {prof.specialty || 'Finance & Management'}
                    </p>
                  </div>

                  {/* Department & Contract badges */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="truncate">{prof.department || 'Sciences de Gestion'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{prof.email}</span>
                    </div>

                    {prof.phone && (
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{prof.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className={cn(
                    "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border",
                    prof.contract_type === 'permanent' 
                      ? "border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-950/60 dark:border-blue-800" 
                      : "border-purple-200 text-purple-700 bg-purple-50 dark:bg-purple-950/60 dark:border-purple-800"
                  )}>
                    {CONTRACT_LABELS[prof.contract_type] || 'Permanent'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => openEdit(prof)}
                      title="Modifier les informations"
                      className="p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(prof.id)}
                      title="Supprimer"
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ── TABLE VIEW ─────────────────────────────────────────── */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-[2.5rem] shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-start">
              <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">{t('professors:list.columns.professor', { defaultValue: 'Professeur / Enseignant' })}</th>
                  <th className="px-6 py-4">Grade & Spécialité</th>
                  <th className="px-6 py-4">Département</th>
                  <th className="px-6 py-4">Type de Contrat</th>
                  <th className="px-6 py-4 text-center">{t('professors:list.columns.status', { defaultValue: 'Statut' })}</th>
                  <th className="px-6 py-4 text-end">{t('professors:list.columns.actions', { defaultValue: 'Actions' })}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((prof) => {
                  const initials = `${prof.first_name?.[0] || ''}${prof.last_name?.[0] || ''}`.toUpperCase()
                  return (
                    <tr key={prof.id} className="hover:bg-blue-50/40 dark:hover:bg-slate-800/60 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0f2863] to-blue-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-md">
                            {initials}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 dark:text-white text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {prof.last_name} {prof.first_name}
                            </p>
                            <p className="text-xs font-medium text-slate-400 mt-0.5 flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              {prof.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <p className="font-black text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-amber-500" />
                          {prof.grade || 'PES'}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">{prof.specialty || 'Finance & Gestion'}</p>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                          <span className="text-slate-700 dark:text-slate-200 text-xs font-bold truncate max-w-[200px]">
                            {prof.department || 'Sciences de Gestion'}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border",
                          prof.contract_type === 'permanent' 
                            ? "border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-950/60 dark:border-blue-800" 
                            : "border-purple-300 text-purple-700 bg-purple-50 dark:bg-purple-950/60 dark:border-purple-800"
                        )}>
                          {CONTRACT_LABELS[prof.contract_type] || 'Permanent'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border",
                          prof.is_active 
                            ? "border-emerald-300 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:border-emerald-800" 
                            : "border-slate-300 text-slate-500 bg-slate-100 dark:bg-slate-800"
                        )}>
                          {prof.is_active ? t('professors:status.active', { defaultValue: 'Actif' }) : t('professors:status.inactive', { defaultValue: 'Inactif' })}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => openEdit(prof)}
                            title="Modifier"
                            className="p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(prof.id)}
                            title="Supprimer"
                            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
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
      )}

      {/* 🌟 CREATE & EDIT PROFESSOR MODAL */}
      <Modal 
        open={showModal} 
        onClose={() => setShowModal(false)}
        title={editingId ? "Modifier le Dossier de l'Enseignant" : "Ajouter un Nouvel Enseignant au Corps Professoral"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-blue-50/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-blue-100 dark:border-slate-700 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">Identité & Statut Académique</div>
              <div className="text-[11px] text-slate-500">Renseignez les données administratives et l'affectation départementale.</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Prénom *</label>
              <Input required value={form.first_name} onChange={setF('first_name')} placeholder="ex: Mohammed" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Nom de Famille *</label>
              <Input required value={form.last_name} onChange={setF('last_name')} placeholder="ex: BENJELLOUN" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Académique (@encg-fes.ac.ma) *</label>
              <Input required type="email" value={form.email} onChange={setF('email')} placeholder="m.benjelloun@encg-fes.ac.ma" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Téléphone Mobile</label>
              <Input value={form.phone} onChange={setF('phone')} placeholder="+212 6xx xxx xxx" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Grade Académique</label>
              <Input value={form.grade} onChange={setF('grade')} placeholder="PES, Professeur Habilité, PA..." />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Spécialité Principale</label>
              <Input value={form.specialty} onChange={setF('specialty')} placeholder="Finance d'entreprise, Marketing, SI..." />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Date d'Embauche / Recrutement</label>
              <Input type="date" value={form.hire_date} onChange={setF('hire_date')} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <CustomSelect
              label="Département d'Affectation *"
              icon={Building2}
              value={form.department_id}
              onChange={(val) => setForm(prev => ({ ...prev, department_id: val }))}
              placeholder="-- Choisir un Département Pédagogique --"
              options={departments.map((dept: Department) => ({
                value: dept.id,
                label: dept.name,
                badge: dept.code
              }))}
            />
          </div>

          <div className="flex items-center gap-3 pt-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <input 
              type="checkbox" 
              id="is_active" 
              checked={form.is_active as boolean}
              onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer" 
            />
            <label htmlFor="is_active" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
              Enseignant Actif & Autorisé à accéder aux relevés et fiches de notes
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" isLoading={saveMutation.isPending}>
              {editingId ? "Mettre à jour le Dossier" : "Enregistrer l'Enseignant"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
