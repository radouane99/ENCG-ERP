import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Users, Plus, Search, Eye, Edit2,
  Trash2, FileText, Briefcase, DollarSign,
  AlertCircle, CheckCircle2, ChevronDown
} from 'lucide-react'
import api from '@shared/lib/api'
import ExcelActions from '@shared/components/ui/ExcelActions'
import { cn } from '@shared/lib/utils'
import { Button } from '@shared/components/ui/Button'
import { Badge } from '@shared/components/ui/Badge'
import { Input } from '@shared/components/ui/Input'
import { Modal } from '@shared/components/ui/Modal'
import { toast } from 'sonner'

const EMPTY_FORM = {
  first_name: '', last_name: '', email: '', phone: '',
  grade: '', specialty: '', contract_type: 'visiting',
  hire_date: '', is_active: true, department_id: ''
};

export default function VacatairesListPage() {
  const { t, i18n } = useTranslation('common')
  const isRtl = i18n.language === 'ar'
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  const { data: vacatairesData, isLoading } = useQuery({
    queryKey: ['hr-vacataires', search],
    queryFn: () => api.get('/hr/vacataires', { params: { search } }).then(res => res.data.data)
  })

  const { data: deptsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => api.get('/departments').then(r => r.data)
  })
  const departments: any[] = deptsData?.data || []

  const saveMutation = useMutation({
    mutationFn: (payload: any) => editingId ? api.put(`/hr/professors/${editingId}`, payload) : api.post('/hr/professors', payload),
    onSuccess: () => {
      toast.success(isRtl ? 'تم الحفظ بنجاح' : 'Sauvegardé avec succès !')
      queryClient.invalidateQueries({ queryKey: ['hr-vacataires'] })
      setShowModal(false)
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || (isRtl ? 'حدث خطأ' : 'Erreur lors de la sauvegarde.'))
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/hr/professors/${id}`),
    onSuccess: () => {
      toast.success(isRtl ? 'تم الحذف' : 'Supprimé avec succès.')
      queryClient.invalidateQueries({ queryKey: ['hr-vacataires'] })
    }
  })

  const openCreate = () => { setEditingId(null); setForm({ ...EMPTY_FORM }); setShowModal(true) }
  const openEdit = (p: any) => {
    setEditingId(p.id)
    setForm({
      first_name: p.first_name, last_name: p.last_name, email: p.email,
      phone: p.phone, grade: p.grade, specialty: p.specialty,
      contract_type: 'visiting', hire_date: p.hire_date ?? '',
      is_active: p.is_active, department_id: p.department_id?.toString() ?? ''
    })
    setShowModal(true)
  }

  const handleDelete = (id: number) => {
    if (confirm(isRtl ? 'حذف هذا الزائر؟' : 'Supprimer ce vacataire ?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { ...form, department_id: form.department_id ? parseInt(form.department_id as string) : null }
    saveMutation.mutate(payload)
  }

  const setF = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }))

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto p-4 md:p-6 pb-20 animate-in fade-in" dir={isRtl ? "rtl" : "ltr"}>

      {/* Premium Header */}
      <div className="bg-gradient-to-r from-[#1F3A5F] to-[#2A4D7C] rounded-[2rem] p-8 text-white shadow-xl shadow-[#1F3A5F]/20 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 end-0 -mt-10 -me-10 w-40 h-40 bg-white opacity-5 rounded-full blur-3xl mix-blend-overlay"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-[1.2rem] flex items-center justify-center border border-white/20">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black mb-1 tracking-tight">
              {isRtl ? 'إدارة الأساتذة الزائرين' : 'Gestion des Vacataires'}
            </h1>
            <p className="text-white/80 font-medium text-sm">
              {isRtl ? 'الموارد البشرية، العقود والمدفوعات' : 'Ressources Humaines, contrats et paiements'}
            </p>
          </div>
        </div>
        <div className="relative z-10 flex gap-3">
          <ExcelActions model="vacataires" label={isRtl ? 'استيراد/تصدير' : 'Excel'} onImportSuccess={() => queryClient.invalidateQueries({ queryKey: ['hr-vacataires'] })} />
          <Button onClick={openCreate} variant="primary" leadingIcon={<Plus size={16} />} className="bg-emerald-500 hover:bg-emerald-600 border-none">
            {isRtl ? 'إضافة أستاذ زائر' : 'Nouveau Vacataire'}
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">{isRtl ? 'إجمالي الزائرين' : 'Total Vacataires'}</p>
            <p className="text-3xl font-black text-[hsl(var(--foreground))]">{vacatairesData?.length || 0}</p>
          </div>
          <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">{isRtl ? 'العقود النشطة' : 'Contrats Actifs'}</p>
            <p className="text-3xl font-black text-[hsl(var(--foreground))]">{vacatairesData?.filter((v: any) => v.vacation_contracts?.length > 0)?.length || 0}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
            <FileText size={24} />
          </div>
        </div>
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-1">{isRtl ? 'المدفوعات المعلقة' : 'Paiements en attente'}</p>
            <p className="text-3xl font-black text-[hsl(var(--foreground))] text-amber-600">3</p>
          </div>
          <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center">
            <AlertCircle size={24} />
          </div>
        </div>
      </div>

      {/* Main List */}
      <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-[2rem] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[hsl(var(--border))] flex items-center justify-between bg-[hsl(var(--muted)/30)]">
          <h2 className="font-bold text-[hsl(var(--foreground))] text-lg px-2">
            {isRtl ? 'قائمة الأساتذة الزائرين' : 'Liste des Intervenants'}
          </h2>
          <div className="w-72">
            <Input
              placeholder={isRtl ? 'بحث عن أستاذ...' : 'Rechercher un professeur...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              icon={<Search size={16} />}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--color-primary))]"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-start">
              <thead className="bg-[hsl(var(--muted)/50)] text-[hsl(var(--muted-foreground))] font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-4">{isRtl ? 'الاسم' : 'Intervenant'}</th>
                  <th className="px-6 py-4">{isRtl ? 'القسم' : 'Département'}</th>
                  <th className="px-6 py-4">{isRtl ? 'حالة العقد (الحالي)' : 'Statut Contrat'}</th>
                  <th className="px-6 py-4 text-center">{isRtl ? 'المدفوعات' : 'Paiement'}</th>
                  <th className="px-6 py-4 text-end">{isRtl ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))]">
                {vacatairesData?.length > 0 ? vacatairesData.map((v: any) => {
                  const latestContract = v.vacation_contracts?.[0];
                  return (
                    <tr key={v.id} className="hover:bg-[hsl(var(--muted)/30)] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
                            {v.first_name[0]}{v.last_name[0]}
                          </div>
                          <div>
                            <p className="font-bold text-[hsl(var(--foreground))]">{v.last_name} {v.first_name}</p>
                            <p className="text-[11px] text-[hsl(var(--muted-foreground))] font-medium">{v.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-[hsl(var(--muted-foreground))]">{v.department?.name || 'Général'}</span>
                      </td>
                      <td className="px-6 py-4">
                        {latestContract ? (
                          latestContract.status === 'pending' ? (
                            <Badge variant="outline" className="text-amber-600 bg-amber-500/10 border-amber-200">
                              {isRtl ? 'عقد قيد الانتظار' : 'En attente de signature'}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-emerald-600 bg-emerald-500/10 border-emerald-200">
                              <CheckCircle2 size={12} className="me-1" /> {isRtl ? 'مُوَقَّع' : 'Signé'}
                            </Badge>
                          )
                        ) : (
                          <Badge variant="outline" className="text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] border-none">
                            {isRtl ? 'بدون عقد' : 'Pas de contrat actif'}
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Button variant="outline" className="text-xs h-7 px-3 bg-[hsl(var(--background))]" icon={<DollarSign size={14} />}>
                          {isRtl ? 'دفع' : 'Payer'}
                        </Button>
                      </td>
                      <td className="px-6 py-4 text-end">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 text-[hsl(var(--muted-foreground))] hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                            <FileText size={16} />
                          </button>
                          <button onClick={() => openEdit(v)} className="p-2 text-[hsl(var(--muted-foreground))] hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(v.id)} className="p-2 text-[hsl(var(--muted-foreground))] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                }) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-[hsl(var(--muted-foreground))] font-medium">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="w-8 h-8 opacity-20" />
                        {isRtl ? 'لم يتم العثور على أي أساتذة' : 'Aucun vacataire trouvé.'}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal 
        open={showModal} 
        onClose={() => setShowModal(false)}
        title={editingId ? (isRtl ? 'تحديث الزائر' : 'Modifier le vacataire') : (isRtl ? 'زائر جديد' : 'Nouveau Vacataire')}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[hsl(var(--foreground))]">{isRtl ? 'الاسم' : 'Prénom'} *</label>
              <Input required value={form.first_name} onChange={setF('first_name')} placeholder="Ahmed" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[hsl(var(--foreground))]">{isRtl ? 'النسب' : 'Nom'} *</label>
              <Input required value={form.last_name} onChange={setF('last_name')} placeholder="BENSOUDA" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[hsl(var(--foreground))]">{isRtl ? 'البريد' : 'Email'} *</label>
              <Input required type="email" value={form.email} onChange={setF('email')} placeholder="prof@encg-fes.ma" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[hsl(var(--foreground))]">{isRtl ? 'الهاتف' : 'Téléphone'}</label>
              <Input value={form.phone} onChange={setF('phone')} placeholder="+212 6xx xxx xxx" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[hsl(var(--foreground))]">{isRtl ? 'الدرجة' : 'Grade académique'}</label>
              <Input value={form.grade} onChange={setF('grade')} placeholder="Professeur, Expert..." />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-[hsl(var(--foreground))]">{isRtl ? 'التخصص' : 'Spécialité'}</label>
              <Input value={form.specialty} onChange={setF('specialty')} placeholder="Finance, Management..." />
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
              {isRtl ? 'زائر نشط' : 'Vacataire actif'}
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
