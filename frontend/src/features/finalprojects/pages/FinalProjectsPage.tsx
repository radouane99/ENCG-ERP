import React, { useState, useEffect } from 'react'
import { Search, Plus, Edit2, Trash2, X, Building } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

interface StudentOption {
  id: number;
  first_name: string;
  last_name: string;
  cne: string;
}

interface FinalProject {
  id: number;
  title: string;
  type: 'pfe' | 'pfa';
  company_name: string;
  company_city: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'defended';
  student_name: string;
  student_id: number;
  academic_year: string;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  submitted: 'Soumis pour validation',
  approved: 'Approuvé (En cours)',
  rejected: 'Refusé',
  defended: 'Soutenu'
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground border-border',
  submitted: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  approved: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  rejected: 'bg-red-500/10 text-red-600 border-red-500/20',
  defended: 'bg-green-500/10 text-green-600 border-green-500/20'
}

const EMPTY = { title: '', type: 'pfe', company_name: '', company_city: '', status: 'draft', student_id: '' }

export default function FinalProjectsPage() {
  const { t } = useTranslation('modules');

  const [projects, setProjects] = useState<FinalProject[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...EMPTY })
  const [students, setStudents] = useState<StudentOption[]>([])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await api.get('/final-projects', { params: { search, status: statusFilter } })
      setProjects(res.data.data || [])
      if (students.length === 0) {
        const sRes = await api.get('/students')
        setStudents(sRes.data?.data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [search, statusFilter])

  const openCreate = () => { setEditingId(null); setForm({ ...EMPTY }); setShowModal(true) }
  const openEdit = (p: FinalProject) => {
    setEditingId(p.id)
    setForm({
      title: p.title,
      type: p.type,
      company_name: p.company_name || '',
      company_city: p.company_city || '',
      status: p.status,
      student_id: p.student_id?.toString() || ''
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = { ...form, student_id: parseInt(form.student_id) }
      editingId
        ? await api.put(`/final-projects/${editingId}`, payload)
        : await api.post('/final-projects', payload)
      toast.success(editingId ? t('final_projects.messages.update_success') : t('final_projects.messages.create_success'))
      setShowModal(false); fetchData()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e?.response?.data?.message || t('final_projects.messages.error'))
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t('final_projects.messages.delete_confirm'))) return
    try {
      await api.delete(`/final-projects/${id}`)
      toast.success(t('final_projects.messages.delete_success'))
      fetchData()
    } catch {
      toast.error(t('final_projects.messages.error'))
    }
  }

  const inputCls = "w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
  const labelCls = "block text-xs font-bold text-muted-foreground uppercase mb-1"

  return (
    <div className="space-y-6 animate-in p-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('final_projects.title')}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t('final_projects.subtitle')}</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium shadow-sm hover:bg-primary/90 text-sm">
          <Plus className="w-4 h-4" /> {t('final_projects.new_btn')}
        </button>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder={t('final_projects.search')} value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none">
            <option value="">{t('final_projects.filter_status')}</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto min-h-[250px]">
          {loading ? <div className="flex justify-center items-center p-12 text-muted-foreground">{t('final_projects.messages.loading')}</div> : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-3 font-semibold">{t('final_projects.table.subject')}</th>
                  <th className="px-6 py-3 font-semibold text-center">{t('final_projects.table.type')}</th>
                  <th className="px-6 py-3 font-semibold">{t('final_projects.table.student')}</th>
                  <th className="px-6 py-3 font-semibold">{t('final_projects.table.company')}</th>
                  <th className="px-6 py-3 font-semibold text-center">{t('final_projects.table.status')}</th>
                  <th className="px-6 py-3 font-semibold text-right">{t('final_projects.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {projects.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">{t('final_projects.table.empty')}</td></tr>
                ) : projects.map(p => (
                  <tr key={p.id} className="hover:bg-muted/50 group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-foreground line-clamp-2" title={p.title}>{p.title}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs font-bold uppercase tracking-wider bg-muted px-2 py-1 rounded border">{p.type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-foreground">{p.student_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      {p.company_name ? (
                        <div>
                          <p className="font-medium flex items-center gap-1.5"><Building className="w-3.5 h-3.5 text-muted-foreground"/> {p.company_name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 ml-5">{p.company_city}</p>
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border", STATUS_COLORS[p.status])}>
                        {t(`final_projects.status.${p.status}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(p)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-md"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-4 border-b bg-muted/30">
              <h3 className="font-bold text-lg">{editingId ? t('final_projects.modal.edit') : t('final_projects.modal.create')}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-muted-foreground hover:bg-muted rounded-md"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className={labelCls}>{t('final_projects.modal.subject')}</label>
                <textarea required value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} className={cn(inputCls, "min-h-[80px] resize-none")} placeholder={t('final_projects.modal.subject_placeholder')} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>{t('final_projects.modal.type')}</label>
                  <select value={form.type} onChange={e => setForm(p => ({...p, type: e.target.value}))} className={inputCls}>
                    <option value="pfe">{t('final_projects.modal.type_pfe')}</option>
                    <option value="pfa">{t('final_projects.modal.type_pfa')}</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{t('final_projects.modal.status')}</label>
                  <select value={form.status} onChange={e => setForm(p => ({...p, status: e.target.value}))} className={inputCls}>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelCls}>{t('final_projects.modal.student')}</label>
                <select required value={form.student_id} onChange={e => setForm(p => ({...p, student_id: e.target.value}))} className={inputCls}>
                  <option value="">{t('final_projects.modal.student_placeholder')}</option>
                  {students.map((s: StudentOption) => <option key={s.id} value={s.id}>{s.last_name} {s.first_name} ({s.cne})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className={labelCls}>{t('final_projects.modal.company')}</label>
                  <input value={form.company_name} onChange={e => setForm(p => ({...p, company_name: e.target.value}))} className={inputCls} placeholder={t('final_projects.modal.company_placeholder')} />
                </div>
                <div>
                  <label className={labelCls}>{t('final_projects.modal.city')}</label>
                  <input value={form.company_city} onChange={e => setForm(p => ({...p, company_city: e.target.value}))} className={inputCls} placeholder={t('final_projects.modal.city_placeholder')} />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg">{t('final_projects.modal.cancel')}</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90 rounded-lg shadow-sm">{editingId ? t('final_projects.modal.update') : t('final_projects.modal.save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
