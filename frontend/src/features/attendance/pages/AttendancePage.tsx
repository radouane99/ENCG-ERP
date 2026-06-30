import { useState, useEffect } from 'react'
import { Search, Trash2, CheckCircle, XCircle, Clock, AlertTriangle, ShieldCheck } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { toast } from 'sonner'

interface AttendanceSession {
  id: number;
  module_name: string;
  group_name: string;
  room_name: string;
  status: 'active' | 'completed' | 'cancelled';
  professor_name: string;
  records_count: number;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  active: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée'
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/10 text-green-600 border-green-500/20',
  completed: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  cancelled: 'bg-red-500/10 text-red-600 border-red-500/20'
}

export default function AttendancePage() {
  const [sessions, setSessions] = useState<AttendanceSession[]>([])
  const [stats, setStats] = useState({ total_sessions: 0, active_sessions: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await api.get('/attendances', { params: { search } })
      setSessions(res.data.data || [])
      setStats(res.data.stats || { total_sessions: 0, active_sessions: 0 })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [search])

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette session d\'absence et tout son historique ?')) return
    try {
      await api.delete(`/attendances/${id}`)
      toast.success('Session supprimée.')
      fetchData()
    } catch {
      toast.error('Erreur.')
    }
  }

  return (
    <div className="space-y-6 animate-in p-6 relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestion des Absences</h1>
          <p className="text-muted-foreground mt-1 text-sm">Vue globale des sessions d'émargement et d'enregistrement des présences.</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-card border shadow-sm flex items-center justify-between">
          <div><p className="text-sm font-medium text-muted-foreground mb-1">Total Sessions</p><p className="text-2xl font-bold text-foreground">{stats.total_sessions}</p></div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/10 text-primary"><ShieldCheck className="w-5 h-5" /></div>
        </div>
        <div className="p-5 rounded-xl bg-card border shadow-sm flex items-center justify-between">
          <div><p className="text-sm font-medium text-muted-foreground mb-1">Sessions Actives</p><p className="text-2xl font-bold text-foreground">{stats.active_sessions}</p></div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-500/10 text-green-600"><Clock className="w-5 h-5" /></div>
        </div>
      </div>

      <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-muted/20">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Rechercher par module ou groupe..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
        
        <div className="overflow-x-auto min-h-[250px]">
          {loading ? <div className="flex justify-center items-center p-12 text-muted-foreground">Chargement...</div> : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                <tr>
                  <th className="px-6 py-3 font-semibold">Date & Heure</th>
                  <th className="px-6 py-3 font-semibold">Module</th>
                  <th className="px-6 py-3 font-semibold">Professeur</th>
                  <th className="px-6 py-3 font-semibold text-center">Présents</th>
                  <th className="px-6 py-3 font-semibold text-center">Statut</th>
                  <th className="px-6 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sessions.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Aucune session d'absence.</td></tr>
                ) : sessions.map(s => (
                  <tr key={s.id} className="hover:bg-muted/50 group">
                    <td className="px-6 py-4 font-medium text-foreground">{s.created_at}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-foreground">{s.module_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{s.group_name} • {s.room_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{s.professor_name}</p>
                    </td>
                    <td className="px-6 py-4 text-center font-bold">
                      {s.records_count}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border", STATUS_COLORS[s.status])}>
                        {STATUS_LABELS[s.status] || s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleDelete(s.id)} className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-md"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
