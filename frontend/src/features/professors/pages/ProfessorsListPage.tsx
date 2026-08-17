import { useState, FormEvent, useRef, useEffect } from 'react'
import { Search, Plus, Edit2, Trash2, GraduationCap, Users, Briefcase, ChevronDown, Check, Building2 } from 'lucide-react'
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
          {Icon && <Icon className="w-3.5 h-3.5 text-indigo-500" />}
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
            ? "border-indigo-500 ring-4 ring-indigo-500/15 text-indigo-900 dark:text-indigo-200" 
            : "border-slate-200 dark:border-slate-700/80 hover:border-indigo-400 dark:hover:border-indigo-500 text-slate-800 dark:text-slate-100",
          disabled && "opacity-40 cursor-not-allowed"
        )}
      >
        <span className={cn("truncate font-bold", !selectedOption && "text-slate-400 font-medium")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-2", open && "rotate-180 text-indigo-600")} />
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
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                    : "text-slate-700 dark:text-slate-200 hover:bg-indigo-50/50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-300"
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
                {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
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
  grade: '', specialty: '', contract_type: 'permanent',
  hire_date: '', is_active: true, department_id: ''
};

export default function ProfessorsListPage() {
  const { t } = useTranslation(['professors', 'common'])
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [contractFilter, setContractFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  const { data, isLoading } = useQuery({
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
      toast.success(t('common:messages.success'))
      queryClient.invalidateQueries({ queryKey: ['professors'] })
      setShowModal(false)
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || (t('common:messages.error')))
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/hr/professors/${id}`),
    onSuccess: () => {
      toast.success(t('common:messages.success'))
      queryClient.invalidateQueries({ queryKey: ['professors'] })
    }
  })

  const openCreate = () => { setEditingId(null); setForm({ ...EMPTY_FORM }); setShowModal(true) }
  const openEdit = (p: Professor) => {
    setEditingId(p.id)
    setForm({
      first_name: p.first_name, last_name: p.last_name, email: p.email,
      phone: p.phone, grade: p.grade, specialty: p.specialty,
      contract_type: p.contract_type, hire_date: p.hire_date ?? '',
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
    if (confirm(t('common:messages.confirm_delete'))) {
      deleteMutation.mutate(id)
    }
  }

  const setF = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }))

  const filtered = professors.filter(p =>
    (!search || `${p.first_name} ${p.last_name} ${p.email}`.toLowerCase().includes(search.toLowerCase())) &&
    (!contractFilter || p.contract_type === contractFilter)
  )

  const CONTRACT_LABELS: Record<string, string> = {
    permanent: t('professors:contracts.permanent', { defaultValue: 'Permanent' }),
    contractual: t('professors:contracts.contractual', { defaultValue: 'Contractuel' }),
    visiting: t('professors:contracts.visiting', { defaultValue: 'Vacataire' }),
  }

  return (
    <div className="space-y-8 animate-in relative p-4 md:p-8 max-w-[1500px] mx-auto font-sans pb-24">
      {/* Deep Navy Hero Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40 space-y-6">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        {/* Top Header Content */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-amber-300 shadow-2xl shrink-0">
              <GraduationCap className="w-8 h-8 md:w-10 md:h-10 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-blue-400/30">
                <Users className="w-4 h-4 text-amber-400" /> Annuaire Officiel des Enseignants ENCG Fès
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                {t('professors:list.title')}
              </h1>
              <p className="text-blue-100/90 text-xs md:text-sm font-medium mt-1 max-w-2xl">
                {t('professors:list.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap shrink-0">
            <ExcelActions model="professors" label={t('professors:list.title')} onImportSuccess={() => queryClient.invalidateQueries({ queryKey: ['professors'] })} />
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-wider shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              {t('professors:list.add_button')}
            </button>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/10">
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 block">{t('common:total')}</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">{professors.length}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">{t('professors:contracts.permanent_pl', { defaultValue: 'Permanents' })}</span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">{professors.filter(p => p.contract_type === 'permanent').length}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 block">{t('professors:contracts.contractual_pl', { defaultValue: 'Contractuels / Vacataires' })}</span>
            <span className="text-2xl font-black text-purple-300 font-mono mt-1 block">{professors.filter(p => p.contract_type !== 'permanent').length}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">{t('professors:status.active')}</span>
            <span className="text-2xl font-black text-amber-300 font-mono mt-1 block">{professors.filter(p => p.is_active).length}</span>
          </div>
        </div>
      </div>

      {/* Control Bar & Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2.5rem] shadow-xl overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder={t('professors:list.search')} 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
          <div className="w-full md:w-64">
            <CustomSelect
              value={contractFilter}
              onChange={(val) => setContractFilter(val)}
              placeholder={t('professors:contracts.all', { defaultValue: 'Tous les contrats' })}
              options={[
                { value: 'permanent', label: t('professors:contracts.permanent', { defaultValue: 'Permanent' }), badge: 'Titulaire' },
                { value: 'contractual', label: t('professors:contracts.contractual', { defaultValue: 'Contractuel' }), badge: 'CDD' },
                { value: 'visiting', label: t('professors:contracts.visiting', { defaultValue: 'Vacataire' }), badge: 'Horaire' }
              ]}
            />
          </div>

        </div>

        <div className="overflow-x-auto min-h-[300px] border border-slate-100 dark:border-slate-800 rounded-2xl">
          {isLoading ? (
            <div className="flex justify-center items-center p-16">
              <Spinner size="lg" className="text-indigo-600" />
            </div>
          ) : (
            <table className="w-full text-sm text-start">
              <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">{t('professors:list.columns.professor')}</th>
                  <th className="px-6 py-4">{t('professors:list.columns.specialty')}</th>
                  <th className="px-6 py-4">{t('professors:contracts.type', { defaultValue: 'Type de contrat' })}</th>
                  <th className="px-6 py-4">{t('professors:list.columns.department')}</th>
                  <th className="px-6 py-4 text-center">{t('professors:list.columns.status')}</th>
                  <th className="px-6 py-4 text-end">{t('professors:list.columns.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-16 text-slate-400 font-bold text-xs">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <GraduationCap size={32} className="opacity-50 text-indigo-500" />
                    </div>
                    <p className="font-bold text-slate-700 dark:text-slate-200">{t('professors:list.empty')}</p>
                    <Button variant="link" onClick={openCreate} className="mt-2 text-indigo-600 font-bold">{t('professors:list.add_button')}</Button>
                  </td></tr>
                ) : filtered.map((prof) => (
                  <tr key={prof.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#0f2863] to-blue-600 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-md">
                          {prof.first_name?.[0] || ''}{prof.last_name?.[0] || ''}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 dark:text-white text-sm">{prof.last_name} {prof.first_name}</p>
                          <p className="text-xs font-medium text-slate-400 mt-0.5">{prof.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-slate-800 dark:text-slate-200 text-xs">{prof.grade || '—'}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">{prof.specialty || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border",
                        prof.contract_type === 'permanent' ? "border-indigo-300 text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60" : "border-amber-300 text-amber-600 bg-amber-50 dark:bg-amber-950/60"
                      )}>
                        {CONTRACT_LABELS[prof.contract_type]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-xs font-bold">{prof.department || 'Sciences de Gestion'}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border",
                        prof.is_active ? "border-emerald-300 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60" : "border-slate-300 text-slate-500 bg-slate-100"
                      )}>
                        {prof.is_active ? t('professors:status.active') : t('professors:status.inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-end">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(prof)} className="h-8 w-8 p-0 text-[var(--muted-foreground)] hover:text-amber-600 hover:bg-amber-500/10">
                          <Edit2 size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(prof.id)} className="h-8 w-8 p-0 text-[var(--muted-foreground)] hover:text-[var(--color-destructive)] hover:bg-[var(--color-destructive)/10]">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal using the UI/UX Pro Max generic Modal */}
      <Modal 
        open={showModal} 
        onClose={() => setShowModal(false)}
        title={editingId ? (t('professors:create.title')) : (t('professors:list.add_button'))}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[var(--foreground)]">{t('common:name', { defaultValue: 'Prénom' })} *</label>
              <Input required value={form.first_name} onChange={setF('first_name')} placeholder="Ahmed" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[var(--foreground)]">{t('common:name', { defaultValue: 'Nom' })} *</label>
              <Input required value={form.last_name} onChange={setF('last_name')} placeholder="BENSOUDA" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[var(--foreground)]">{t('common:email', { defaultValue: 'Email' })} *</label>
              <Input required type="email" value={form.email} onChange={setF('email')} placeholder="prof@encg-fes.ma" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[var(--foreground)]">{t('common:phone', { defaultValue: 'Téléphone' })}</label>
              <Input value={form.phone} onChange={setF('phone')} placeholder="+212 6xx xxx xxx" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[var(--foreground)]">{t('professors:form.grade', { defaultValue: 'Grade académique' })}</label>
              <Input value={form.grade} onChange={setF('grade')} placeholder="Professeur Habilité, PES..." />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[var(--foreground)]">{t('professors:list.columns.specialty')}</label>
              <Input value={form.specialty} onChange={setF('specialty')} placeholder="Finance, Management..." />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CustomSelect
              label={t('professors:contracts.type', { defaultValue: 'Type de contrat' }) + ' *'}
              icon={Briefcase}
              value={form.contract_type}
              onChange={(val) => setForm(prev => ({ ...prev, contract_type: val }))}
              placeholder="Sélectionner le type de contrat"
              options={[
                { value: 'permanent', label: t('professors:contracts.permanent', { defaultValue: 'Permanent' }), badge: 'Titulaire' },
                { value: 'contractual', label: t('professors:contracts.contractual', { defaultValue: 'Contractuel' }), badge: 'CDD' },
                { value: 'visiting', label: t('professors:contracts.visiting', { defaultValue: 'Vacataire' }), badge: 'Horaire' }
              ]}
            />

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('professors:form.hire_date', { defaultValue: 'Date d\'embauche' })}</label>
              <Input type="date" value={form.hire_date} onChange={setF('hire_date')} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <CustomSelect
              label={t('professors:list.columns.department')}
              icon={Building2}
              value={form.department_id}
              onChange={(val) => setForm(prev => ({ ...prev, department_id: val }))}
              placeholder={t('professors:form.select_dept', { defaultValue: '-- Choisir un département --' })}
              options={departments.map((dept: Department) => ({
                value: dept.id,
                label: dept.name,
                badge: `DEP-${dept.id}`
              }))}
            />
          </div>


          <div className="flex items-center gap-3 pt-2">
            <input type="checkbox" id="is_active" checked={form.is_active as boolean}
              onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
              className="w-4 h-4 rounded border-[var(--border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]" />
            <label htmlFor="is_active" className="text-sm font-semibold text-[var(--foreground)]">
              {t('professors:form.is_active', { defaultValue: 'Professeur actif' })}
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-[var(--border)]">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
              {t('common:buttons.cancel')}
            </Button>
            <Button type="submit" variant="primary" isLoading={saveMutation.isPending}>
              {editingId ? (t('common:buttons.edit')) : (t('common:buttons.save'))}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
