import { useState, useEffect } from 'react'
import { Search, Edit2, Trash2, X, FileText, CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

interface Application {
  id: number;
  reference_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  cin: string;
  cne: string;
  bac_mention: string;
  bac_average: number;
  bac_year: number;
  status: 'pending' | 'under_review' | 'accepted' | 'rejected' | 'waitlisted';
  selection_score: number | null;
  campaign: string;
}

interface Stats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  under_review: 'En cours d\'examen',
  accepted: 'Admis',
  rejected: 'Refusé',
  waitlisted: 'Sur liste d\'attente'
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  under_review: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  accepted: 'bg-green-500/10 text-green-600 border-green-500/20',
  rejected: 'bg-red-500/10 text-red-600 border-red-500/20',
  waitlisted: 'bg-purple-500/10 text-purple-600 border-purple-500/20'
};

export default function ApplicationsPage() {
  const { t } = useTranslation('admissions')

  const [applications, setApplications] = useState<Application[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, accepted: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingApp, setEditingApp] = useState<Application | null>(null)
  
  const [form, setForm] = useState({
    status: 'pending',
    selection_score: '',
    rejection_reason: ''
  })

  const fetchData = async () => {
    try {
      setLoading(true)
      const campRes = await api.get('/admin/admissions/campaigns?status=active');
      const campaignId = campRes.data.data?.[0]?.id || 1;
      
      const res = await api.get(`/admin/admissions/campaigns/${campaignId}/applications`);
      let data = res.data.data || [];
      
      if (search) {
        const s = search.toLowerCase();
        data = data.filter((app: Application) => 
          app.first_name?.toLowerCase().includes(s) ||
          app.last_name?.toLowerCase().includes(s) ||
          app.cne?.toLowerCase().includes(s) ||
          app.cin?.toLowerCase().includes(s) ||
          app.reference_number?.toLowerCase().includes(s)
        );
      }
      if (statusFilter) {
        data = data.filter((app: Application) => app.status === statusFilter);
      }

      setApplications(data)
      setStats(res.data.stats || { total: 0, pending: 0, accepted: 0, rejected: 0 })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [search, statusFilter])

  const openReview = (app: Application) => {
    setEditingApp(app)
    setForm({
      status: app.status,
      selection_score: app.selection_score?.toString() || '',
      rejection_reason: ''
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingApp) return

    try {
      await api.patch(`/admin/admissions/applications/${editingApp.id}/status`, {
        status: form.status,
        selection_score: form.selection_score ? parseFloat(form.selection_score) : null,
        rejection_reason: form.status === 'rejected' ? form.rejection_reason : null
      })
      toast.success(t('applications.messages.update_success'))
      setShowModal(false)
      fetchData()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('applications.messages.update_error'))
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t('applications.messages.delete_confirm'))) return
    try {
      await api.delete(`/admin/admissions/applications/${id}`)
      toast.success(t('applications.messages.delete_success'))
      fetchData()
    } catch {
      toast.error(t('applications.messages.delete_error'))
    }
  }

  const inputCls = "w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
  const labelCls = "block text-xs font-bold text-muted-foreground uppercase mb-1"

  return (
    <div className="space-y-6 animate-in p-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t('applications.title')}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t('applications.subtitle')}</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t('applications.kpis.total'), value: stats.total, icon: <FileText className="w-5 h-5" />, color: 'bg-primary/10 text-primary' },
          { label: t('applications.kpis.pending'), value: stats.pending, icon: <Clock className="w-5 h-5" />, color: 'bg-amber-500/10 text-amber-600' },
          { label: t('applications.kpis.accepted'), value: stats.accepted, icon: <CheckCircle className="w-5 h-5" />, color: 'bg-green-500/10 text-green-600' },
          { label: t('applications.kpis.rejected'), value: stats.rejected, icon: <AlertCircle className="w-5 h-5" />, color: 'bg-red-500/10 text-red-600' },
        ].map((c, i) => (
          <div key={i} className="p-5 rounded-xl bg-card border shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{c.label}</p>
              <p className="text-2xl font-bold text-foreground">{c.value}</p>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${c.color}`}>{c.icon}</div>
          </div>
        ))}
      </div>

      {/* Filters & Table */}
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/20 flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder={t('applications.filters.search')} value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none">
            <option value="">{t('applications.filters.all_status')}</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        
        <div className="overflow-x-auto min-h-[250px]">
          {loading ? <div className="flex justify-center items-center p-12 text-muted-foreground">{t('applications.messages.loading')}</div> : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-3 font-semibold">{t('applications.table.candidate')}</th>
                  <th className="px-6 py-3 font-semibold">{t('applications.table.ids')}</th>
                  <th className="px-6 py-3 font-semibold text-center">{t('applications.table.bac')}</th>
                  <th className="px-6 py-3 font-semibold text-center">{t('applications.table.score')}</th>
                  <th className="px-6 py-3 font-semibold text-center">{t('applications.table.status')}</th>
                  <th className="px-6 py-3 font-semibold text-right">{t('applications.table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {applications.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">{t('applications.table.empty')}</td></tr>
                ) : applications.map(app => (
                  <tr key={app.id} className="hover:bg-muted/50 group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-foreground">{app.last_name} {app.first_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{app.reference_number}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-medium">CNE: {app.cne}</p>
                      <p className="text-xs text-muted-foreground">CIN: {app.cin}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="font-bold text-foreground">{app.bac_average}/20</p>
                      <p className="text-xs text-muted-foreground">{app.bac_mention} ({app.bac_year})</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {app.selection_score ? (
                         <span className="inline-flex items-center gap-1 font-bold text-primary">
                           <TrendingUp className="w-3.5 h-3.5" /> {app.selection_score}/20
                         </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border", STATUS_COLORS[app.status])}>
                        {t(`applications.status_labels.${app.status}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openReview(app)} className="px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-md transition-colors border border-primary/20"> {t('applications.table.review')} </button>
                        <button onClick={() => handleDelete(app.id)} className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-md"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && editingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b bg-muted/30">
              <h3 className="font-bold text-lg">{t('applications.modal.title')}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-muted-foreground hover:bg-muted rounded-md"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-4 bg-muted/30 border-b">
              <p className="font-semibold text-foreground text-center text-lg">{editingApp.last_name} {editingApp.first_name}</p>
              <p className="text-xs text-muted-foreground text-center mb-2">{t('applications.modal.ref')}: {editingApp.reference_number}</p>
              <div className="flex justify-center gap-4 text-sm mt-3">
                <div className="text-center"><p className="text-muted-foreground text-xs">{t('applications.modal.bac_avg')}</p><p className="font-bold">{editingApp.bac_average}</p></div>
                <div className="text-center"><p className="text-muted-foreground text-xs">{t('applications.modal.bac_year')}</p><p className="font-bold">{editingApp.bac_year}</p></div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className={labelCls}>{t('applications.modal.status_label')}</label>
                <select value={form.status} onChange={e => setForm(p => ({...p, status: e.target.value}))} className={inputCls}>
                  {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>{t('applications.modal.score_label')}</label>
                <input type="number" step="0.01" min="0" max="20" value={form.selection_score} onChange={e => setForm(p => ({...p, selection_score: e.target.value}))} className={inputCls} placeholder={t('applications.modal.score_placeholder')} />
              </div>

              {form.status === 'rejected' && (
                <div>
                  <label className={labelCls}>{t('applications.modal.reason_label')}</label>
                  <input required value={form.rejection_reason} onChange={e => setForm(p => ({...p, rejection_reason: e.target.value}))} className={inputCls} placeholder={t('applications.modal.reason_placeholder')} />
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg">{t('applications.modal.cancel')}</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90 rounded-lg shadow-sm">{t('applications.modal.submit')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
