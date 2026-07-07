import { useState, FormEvent } from 'react'
import { Search, Plus, Edit2, Trash2, X, GraduationCap, Users, Briefcase, CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ExcelActions from '@shared/components/ui/ExcelActions'
import { Button } from '@shared/components/ui/Button'
import { Input } from '@shared/components/ui/Input'
import { Badge } from '@shared/components/ui/Badge'
import { Modal } from '@shared/components/ui/Modal'
import { Spinner } from '@shared/components/ui/Spinner'

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
  const { t, i18n } = useTranslation('common')
  const isRtl = i18n.language === 'ar'
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
  const departments: any[] = deptsData?.data || []

  const saveMutation = useMutation({
    mutationFn: (payload: any) => editingId ? api.put(`/hr/professors/${editingId}`, payload) : api.post('/hr/professors', payload),
    onSuccess: () => {
      toast.success(isRtl ? 'تم الحفظ بنجاح' : 'Sauvegardé avec succès !')
      queryClient.invalidateQueries({ queryKey: ['professors'] })
      setShowModal(false)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || (isRtl ? 'خطأ في الحفظ' : 'Erreur lors de la sauvegarde.'))
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/hr/professors/${id}`),
    onSuccess: () => {
      toast.success(isRtl ? 'تم الحذف' : 'Supprimé avec succès.')
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
    saveMutation.mutate(payload)
  }

  const handleDelete = (id: number) => {
    if (confirm(isRtl ? 'هل تريد حذف هذا الأستاذ؟' : 'Supprimer ce professeur ?')) {
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
    permanent: isRtl ? 'دائم' : 'Permanent',
    contractual: isRtl ? 'متعاقد' : 'Contractuel',
    visiting: isRtl ? 'زائر' : 'Vacataire',
  }

  const CONTRACT_VARIANTS: Record<string, "default" | "warning" | "navy"> = {
    permanent: 'default',
    contractual: 'warning',
    visiting: 'navy',
  }

  return (
    <div className="space-y-6 animate-in relative p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">{isRtl ? 'هيئة التدريس' : 'Corps Professoral'}</h1>
          <p className="text-[hsl(var(--muted-foreground))] mt-1 text-sm">{isRtl ? 'إدارة الأساتذة الدائمين، المتعاقدين، والزوار' : 'Gérez les professeurs permanents, contractuels et vacataires.'}</p>
        </div>
        <div className="flex items-center gap-3">
          <ExcelActions model="professors" label={isRtl ? 'أساتذة' : 'Professeurs'} onImportSuccess={() => queryClient.invalidateQueries({ queryKey: ['professors'] })} />
          <Button onClick={openCreate} className="flex items-center gap-2">
            <Plus size={18} />
            {isRtl ? 'أستاذ جديد' : 'Nouveau Professeur'}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">{isRtl ? 'الإجمالي' : 'Total'}</p>
            <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{professors.length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[hsl(var(--color-primary))/10] text-[hsl(var(--color-primary))] flex items-center justify-center"><Users className="w-6 h-6" /></div>
        </div>
        <div className="p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">{isRtl ? 'دائمون' : 'Permanents'}</p>
            <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{professors.filter(p => p.contract_type === 'permanent').length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[hsl(var(--color-primary))/10] text-[hsl(var(--color-primary))] flex items-center justify-center"><Briefcase className="w-6 h-6" /></div>
        </div>
        <div className="p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">{isRtl ? 'متعاقدون' : 'Contractuels'}</p>
            <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{professors.filter(p => p.contract_type === 'contractual').length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center"><GraduationCap className="w-6 h-6" /></div>
        </div>
        <div className="p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">{isRtl ? 'نشط' : 'Actifs'}</p>
            <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{professors.filter(p => p.is_active).length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-600 flex items-center justify-center"><CheckCircle className="w-6 h-6" /></div>
        </div>
      </div>

      {/* Table & Filters */}
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-3xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[hsl(var(--border))] flex flex-col sm:flex-row gap-4 items-center bg-[hsl(var(--muted)/20)]">
          <div className="relative w-full flex-1">
            <Input 
              icon={<Search size={16} />}
              placeholder={isRtl ? 'البحث عن أستاذ...' : 'Rechercher un professeur...'} 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-[hsl(var(--background))]"
            />
          </div>
          <select 
            value={contractFilter} 
            onChange={e => setContractFilter(e.target.value)}
            className="px-4 py-2.5 text-sm bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] min-w-[180px]"
          >
            <option value="">{isRtl ? 'جميع العقود' : 'Tous les contrats'}</option>
            <option value="permanent">{isRtl ? 'دائم' : 'Permanent'}</option>
            <option value="contractual">{isRtl ? 'متعاقد' : 'Contractuel'}</option>
            <option value="visiting">{isRtl ? 'زائر' : 'Vacataire'}</option>
          </select>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {isLoading ? (
            <div className="flex justify-center items-center p-12"><Spinner size="lg" /></div>
          ) : (
            <table className="w-full text-sm text-start">
              <thead className="text-xs text-[hsl(var(--muted-foreground))] uppercase bg-[hsl(var(--muted)/50)] border-b border-[hsl(var(--border))]">
                <tr>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'الأستاذ' : 'Professeur'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'الدرجة / التخصص' : 'Grade / Spécialité'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'نوع العقد' : 'Type de contrat'}</th>
                  <th className="px-6 py-4 font-semibold">{isRtl ? 'القسم' : 'Département'}</th>
                  <th className="px-6 py-4 font-semibold text-center">{isRtl ? 'الحالة' : 'Statut'}</th>
                  <th className="px-6 py-4 font-semibold text-end">{isRtl ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-16 text-[hsl(var(--muted-foreground))]">
                    <div className="w-16 h-16 bg-[hsl(var(--muted))] rounded-full flex items-center justify-center mx-auto mb-4">
                      <GraduationCap size={32} className="opacity-50" />
                    </div>
                    <p className="font-medium text-[hsl(var(--foreground))]">{isRtl ? 'لم يتم العثور على أساتذة' : 'Aucun professeur trouvé.'}</p>
                    <Button variant="link" onClick={openCreate} className="mt-2">{isRtl ? '+ إضافة الأستاذ الأول' : '+ Ajouter le premier professeur'}</Button>
                  </td></tr>
                ) : filtered.map((prof) => (
                  <tr key={prof.id} className="hover:bg-[hsl(var(--muted)/30)] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(var(--color-primary))] to-[hsl(var(--color-secondary))] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm">
                          {prof.first_name?.[0] || ''}{prof.last_name?.[0] || ''}
                        </div>
                        <div>
                          <p className="font-bold text-[hsl(var(--foreground))]">{prof.last_name} {prof.first_name}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{prof.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-[hsl(var(--foreground))]">{prof.grade || '—'}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{prof.specialty || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={CONTRACT_VARIANTS[prof.contract_type] || 'default'} size="sm">
                        {CONTRACT_LABELS[prof.contract_type]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-[hsl(var(--muted-foreground))] text-sm">{prof.department}</td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={prof.is_active ? 'success' : 'outline'} size="sm">
                        {prof.is_active ? (isRtl ? 'نشط' : 'Actif') : (isRtl ? 'غير نشط' : 'Inactif')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-end">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(prof)} className="h-8 w-8 p-0 text-[hsl(var(--muted-foreground))] hover:text-amber-600 hover:bg-amber-500/10">
                          <Edit2 size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(prof.id)} className="h-8 w-8 p-0 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--color-destructive))] hover:bg-[hsl(var(--color-destructive))/10]">
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
        title={editingId ? (isRtl ? 'تحديث بيانات الأستاذ' : 'Modifier le professeur') : (isRtl ? 'أستاذ جديد' : 'Nouveau Professeur')}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[hsl(var(--foreground))]">{isRtl ? 'الاسم الأول' : 'Prénom'} *</label>
              <Input required value={form.first_name} onChange={setF('first_name')} placeholder="Ahmed" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[hsl(var(--foreground))]">{isRtl ? 'الاسم العائلي' : 'Nom'} *</label>
              <Input required value={form.last_name} onChange={setF('last_name')} placeholder="BENSOUDA" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[hsl(var(--foreground))]">{isRtl ? 'البريد الإلكتروني' : 'Email'} *</label>
              <Input required type="email" value={form.email} onChange={setF('email')} placeholder="prof@encg-fes.ma" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[hsl(var(--foreground))]">{isRtl ? 'الهاتف' : 'Téléphone'}</label>
              <Input value={form.phone} onChange={setF('phone')} placeholder="+212 6xx xxx xxx" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[hsl(var(--foreground))]">{isRtl ? 'الدرجة الأكاديمية' : 'Grade académique'}</label>
              <Input value={form.grade} onChange={setF('grade')} placeholder="Professeur Habilité, PES..." />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[hsl(var(--foreground))]">{isRtl ? 'التخصص' : 'Spécialité'}</label>
              <Input value={form.specialty} onChange={setF('specialty')} placeholder="Finance, Management..." />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[hsl(var(--foreground))]">{isRtl ? 'نوع العقد' : 'Type de contrat'} *</label>
              <select 
                value={form.contract_type} 
                onChange={setF('contract_type')} 
                className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm ring-offset-[hsl(var(--background))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              >
                <option value="permanent">{isRtl ? 'دائم' : 'Permanent'}</option>
                <option value="contractual">{isRtl ? 'متعاقد' : 'Contractuel'}</option>
                <option value="visiting">{isRtl ? 'زائر' : 'Vacataire'}</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[hsl(var(--foreground))]">{isRtl ? 'تاريخ التوظيف' : 'Date d\'embauche'}</label>
              <Input type="date" value={form.hire_date} onChange={setF('hire_date')} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[hsl(var(--foreground))]">{isRtl ? 'القسم' : 'Département'}</label>
              <select 
                value={form.department_id} 
                onChange={setF('department_id')} 
                className="flex h-10 w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm ring-offset-[hsl(var(--background))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              >
                <option value="">{isRtl ? '-- اختيار القسم --' : '-- Choisir un département --'}</option>
                {departments.map((dept: any) => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input type="checkbox" id="is_active" checked={form.is_active as boolean}
              onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
              className="w-4 h-4 rounded border-[hsl(var(--border))] text-[hsl(var(--color-primary))] focus:ring-[hsl(var(--color-primary))]" />
            <label htmlFor="is_active" className="text-sm font-semibold text-[hsl(var(--foreground))]">
              {isRtl ? 'أستاذ نشط' : 'Professeur actif'}
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-6 border-t border-[hsl(var(--border))]">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)}>
              {isRtl ? 'إلغاء' : 'Annuler'}
            </Button>
            <Button type="submit" variant="primary" isLoading={saveMutation.isPending}>
              {editingId ? (isRtl ? 'تحديث' : 'Mettre à jour') : (isRtl ? 'حفظ' : 'Enregistrer')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
