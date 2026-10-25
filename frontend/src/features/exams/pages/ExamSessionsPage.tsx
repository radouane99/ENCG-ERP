import { useState,useEffect,useCallback } from 'react'
import { Plus,Edit2,Trash2,X,CalendarDays,CheckCircle,Lock } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'

interface ExamSession {
  id: number;
  name: string;
  type: 'normal' | 'rattrapage' | 'derogation';
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_locked: boolean;
  academic_year: string;
  semester: string;
  exams_count?: number;
  academic_year_id: number | null;
  semester_id: number | null;
}

const TYPE_LABELS: Record<string, string> = {
  normal: 'Session Normale',
  rattrapage: 'Rattrapage',
  derogation: 'Dérogation'
}

const TYPE_COLORS: Record<string, string> = {
  normal: 'bg-blue-500/10 text-blue-600',
  rattrapage: 'bg-amber-500/10 text-amber-600',
  derogation: 'bg-purple-500/10 text-purple-600'
}

const EMPTY = { name: '', type: 'normal', start_date: '', end_date: '', is_active: false, academic_year_id: '', semester_id: '' }

export default function ExamSessionsPage() {
  const [sessions, setSessions] = useState<ExamSession[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ ...EMPTY })

  const [options, setOptions] = useState({ years: [], semesters: [] })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setLoadError(false)
      const res = await api.get('/exam-sessions')
      setSessions(res.data.data || [])
    } catch (err) {
      setLoadError(true)
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    Promise.all([api.get('/academic-years'), api.get('/semesters')])
      .then(([yRes, sRes]) => {
        setOptions({ years: yRes.data.data || [], semesters: sRes.data?.data || [] })
      })
      .catch((err) => console.error(err))
  }, [])

  const openCreate = () => { setEditingId(null); setForm({ ...EMPTY }); setShowModal(true) }
  
  const openEdit = (s: ExamSession) => {
    setEditingId(s.id)
    setForm({
      name: s.name,
      type: s.type,
      start_date: s.start_date || '',
      end_date: s.end_date || '',
      is_active: s.is_active,
      academic_year_id: s.academic_year_id?.toString() || '',
      semester_id: s.semester_id?.toString() || ''
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      const payload = {
        ...form,
        academic_year_id: form.academic_year_id ? parseInt(form.academic_year_id) : null,
        semester_id: form.semester_id ? parseInt(form.semester_id) : null
      }
      
      if (editingId) {
        await api.put(`/exam-sessions/${editingId}`, payload)
      } else {
        await api.post('/exam-sessions', payload)
      }
      toast.success(editingId ? 'Session mise à jour !' : 'Session créée !')
      setShowModal(false)
      fetchData()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette session ?')) return
    try {
      await api.delete(`/exam-sessions/${id}`)
      toast.success('Session supprimée.')
      fetchData()
    } catch {
      toast.error('Erreur.')
    }
  }

  const handleSetActive = async (s: ExamSession) => {
    try {
      await api.put(`/exam-sessions/${s.id}`, { is_active: true })
      toast.success(`Session ${s.name} activée.`)
      fetchData()
    } catch {
      toast.error('Erreur.')
    }
  }

  const handleLock = async (session: ExamSession) => {
    if (!confirm(session.is_locked ? 'Déverrouiller explicitement cette session ?' : 'Clôturer cette session après vérification des PV et incidents ?')) return
    try {
      await api.put(`/exam-sessions/${session.id}`, { is_locked: !session.is_locked })
      toast.success(session.is_locked ? 'Session déverrouillée.' : 'Session clôturée.')
      await fetchData()
    } catch (error: any) { toast.error(error?.response?.data?.message || 'Action refusée.') }
  }

  const inputCls = "w-full px-3 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
  const labelCls = "block text-xs font-bold text-muted-foreground uppercase mb-1"

  return (
    <div className="space-y-6 animate-in p-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Sessions d'Examens</h1>
          <p className="text-muted-foreground mt-1 text-sm">Gérez les sessions normales, de rattrapage et les dérogations.</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium shadow-sm hover:bg-primary/90 text-sm">
          <Plus className="w-4 h-4" /> Nouvelle Session
        </button>
      </div>

      {loadError && <div role="alert" className="rounded-xl border border-destructive p-4 text-destructive">Chargement des sessions impossible. <button type="button" className="underline" onClick={() => void fetchData()}>Réessayer</button></div>}
      {loading ? <div className="text-muted-foreground p-12 text-center">Chargement...</div> : !loadError && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.length === 0 ? (
            <div className="md:col-span-2 lg:col-span-3 text-center py-16 text-muted-foreground">
              <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Aucune session d'examen définie.</p>
              <button onClick={openCreate} className="mt-2 text-sm text-primary hover:underline">+ Créer la première session</button>
            </div>
          ) : sessions.map(s => (
            <div key={s.id} className={cn("p-5 rounded-2xl border shadow-sm bg-card relative overflow-hidden transition-all hover:border-primary/30", s.is_active && "border-primary/50 ring-1 ring-primary/20 shadow-primary/5")}>
              {s.is_active && <div className="absolute top-3 right-3"><span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Active</span></div>}
              {s.is_locked && <div className="absolute top-3 left-3"><Lock className="w-3.5 h-3.5 text-muted-foreground" aria-label="Verrouillée" /></div>}
              
              <div className="mt-2">
                <span className={cn("text-xs font-bold px-2 py-1 rounded-md mb-2 inline-block", TYPE_COLORS[s.type])}>{TYPE_LABELS[s.type] || s.type}</span>
                <p className="font-bold text-foreground text-lg">{s.name}</p>
                <p className="text-sm text-muted-foreground">{s.academic_year} • {s.semester}</p>
              </div>
              
              {(s.start_date || s.end_date) && (
                <div className="mt-4 p-3 bg-muted/40 rounded-lg flex justify-between items-center text-sm border border-border/50">
                   <div><p className="text-xs text-muted-foreground">Début</p><p className="font-medium">{s.start_date || '—'}</p></div>
                   <div><p className="text-xs text-muted-foreground text-right">Fin</p><p className="font-medium text-right">{s.end_date || '—'}</p></div>
                </div>
              )}
              
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                <Link className="font-medium text-primary underline" to={`/admin/exams?session_id=${s.id}`}>Préparer les épreuves</Link>
                <Link className="font-medium text-primary underline" to={`/admin/exams/sessions/${s.id}/live`}>Superviser</Link>
                <button type="button" className="text-muted-foreground underline" onClick={() => void handleLock(s)}>{s.is_locked ? 'Déverrouiller' : 'Clôturer la session'}</button>
              </div>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                {!s.is_active && !s.is_locked && (
                  <button onClick={() => handleSetActive(s)} className="flex-1 text-xs font-medium text-primary border border-primary/30 hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors">
                    Activer
                  </button>
                )}
                <div className="flex-1 flex justify-end gap-1">
                  <button aria-label={`Modifier ${s.name}`} disabled={s.is_locked} onClick={() => openEdit(s)} className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md"><Edit2 className="w-4 h-4" /></button>
                  {!s.is_locked && !s.exams_count && <button aria-label={`Supprimer ${s.name}`} onClick={() => handleDelete(s.id)} className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-md"><Trash2 className="w-4 h-4" /></button>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-label={editingId ? 'Modifier la session' : 'Nouvelle session'} className="bg-card border rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b bg-muted/30">
              <h3 className="font-bold text-lg">{editingId ? 'Modifier la session' : 'Nouvelle Session'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-muted-foreground hover:bg-muted rounded-md"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className={labelCls}>Nom de la session *</label>
                <input required value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} className={inputCls} placeholder="Ex: Printemps 2026 - Session 1" />
              </div>
              
              <div>
                <label className={labelCls}>Type de session *</label>
                <select value={form.type} onChange={e => setForm(p => ({...p, type: e.target.value}))} className={inputCls}>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Année</label>
                  <select required value={form.academic_year_id} onChange={e => setForm(p => ({...p, academic_year_id: e.target.value, semester_id: ''}))} className={inputCls}>
                    <option value="">— Choisir —</option>
                    {options.years.map((y: any) => <option key={y.id} value={y.id}>{y.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Semestre</label>
                  <select required disabled={!form.academic_year_id} value={form.semester_id} onChange={e => setForm(p => ({...p, semester_id: e.target.value}))} className={inputCls}>
                    <option value="">— Choisir —</option>
                    {options.semesters.filter((s: any) => Number(s.academic_year_id) === Number(form.academic_year_id)).map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Date début</label><input type="date" required value={form.start_date} onChange={e => setForm(p => ({...p, start_date: e.target.value}))} className={inputCls} /></div>
                <div><label className={labelCls}>Date fin</label><input type="date" required min={form.start_date} value={form.end_date} onChange={e => setForm(p => ({...p, end_date: e.target.value}))} className={inputCls} /></div>
              </div>

              <div className="flex items-center gap-3 mt-2">
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 accent-primary rounded" />
                <label htmlFor="is_active" className="text-sm text-foreground">Définir comme session active (désactivera les autres de la même année)</label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-lg">Annuler</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90 rounded-lg shadow-sm disabled:opacity-50">{saving ? 'Enregistrement…' : editingId ? 'Mettre à jour' : 'Enregistrer'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
