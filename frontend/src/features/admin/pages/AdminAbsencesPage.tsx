import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Search, Trash2, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import { absencesApi } from '@shared/api/absences'
import { toast } from 'sonner'

export default function AdminAbsencesPage() {
  const [absences, setAbsences] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>({})
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchJustifications = async () => {
    try {
      setLoading(true)
      const res = await absencesApi.getJustifications({ status: statusFilter || undefined, page, per_page: 15 })
      setAbsences(res.data)
      setStats(res.stats || {})
      setTotalPages(res.meta?.last_page || 1)
    } catch (error) {
      console.error('Failed to fetch absences:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchJustifications() }, [statusFilter, page])

  const handleApprove = async (id: number) => {
    try {
      await absencesApi.updateStatus(id, 'approved')
      toast.success('Justificatif approuvé avec succès')
      fetchJustifications()
    } catch { toast.error('Erreur lors de la validation') }
  }

  const handleReject = async (id: number) => {
    const reason = prompt('Motif de rejet (optionnel):')
    try {
      await absencesApi.updateStatus(id, 'rejected', reason || undefined)
      toast.success('Justificatif rejeté')
      fetchJustifications()
    } catch { toast.error('Erreur lors du rejet') }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce justificatif ?')) return
    try {
      await absencesApi.deleteJustification(id)
      toast.success('Justificatif supprimé')
      fetchJustifications()
    } catch { toast.error('Erreur lors de la suppression') }
  }

  const getStatusBadge = (status: string) => {
    const map: any = {
      pending:  'text-amber-600 bg-amber-50 border-amber-200',
      approved: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      rejected: 'text-red-600 bg-red-50 border-red-200',
    }
    const labels: any = { pending: 'EN ATTENTE', approved: 'APPROUVÉ', rejected: 'REJETÉ' }
    return { cls: map[status] || 'text-slate-500 bg-slate-50 border-slate-200', label: labels[status] || 'INCONNU' }
  }

  return (
    <div className="space-y-8 animate-in p-6 max-w-[1200px] mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-center gap-6 mb-8 text-center">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2863] italic">Validation des Justificatifs d'Absences</h1>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
          <div className="text-2xl font-black text-amber-600">{stats.pending || 0}</div>
          <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">EN ATTENTE</div>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
          <div className="text-2xl font-black text-emerald-600">{stats.approved || 0}</div>
          <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">APPROUVÉS</div>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-center">
          <div className="text-2xl font-black text-red-500">{stats.rejected || 0}</div>
          <div className="text-[10px] font-bold text-red-400 uppercase tracking-widest">REJETÉS</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-end bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
        <div className="flex-1 w-full space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-2">Etat du Justificatif</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          >
            <option value="">Tous les états</option>
            <option value="pending">En attente</option>
            <option value="approved">Approuvé</option>
            <option value="rejected">Rejeté</option>
          </select>
        </div>
        <div className="w-full md:w-auto">
          <button onClick={() => fetchJustifications()} className="w-full md:w-32 py-3.5 bg-[#0f2863] text-white font-bold rounded-2xl hover:bg-[#1a387e] transition-colors text-xs uppercase tracking-wider shadow-md">
            Filtrer
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden p-6 md:p-8">
        <h3 className="text-lg font-bold text-[#0f2863] italic mb-6">Registre des Justificatifs d'Absences</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Date / ID</th>
                <th className="px-6 py-4">Étudiant</th>
                <th className="px-6 py-4">Module & Type</th>
                <th className="px-6 py-4">Motif</th>
                <th className="px-6 py-4 text-center">État</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-4" />
                    <p className="text-slate-400">Chargement des justificatifs...</p>
                  </td>
                </tr>
              ) : absences.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 font-medium">Aucun justificatif trouvé.</td>
                </tr>
              ) : absences.map((abs) => {
                const badge = getStatusBadge(abs.status)
                return (
                  <tr key={abs.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-800 text-sm mb-1">{abs.created_at}</div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">ID: #{abs.id}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-800 text-sm mb-1">{abs.student?.name || 'N/A'}</div>
                      <div className="text-[10px] text-slate-500">{abs.student?.student_number}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-800 text-sm mb-1">{abs.attendance?.module_name || 'N/A'}</div>
                      {abs.attendance?.type && (
                        <div className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-200 text-slate-600 text-[9px] font-bold uppercase tracking-wider">
                          {abs.attendance.type}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-sm text-slate-600">{abs.reason}</div>
                      {abs.rejection_reason && (
                        <div className="text-[10px] text-red-500 mt-1">Rejet: {abs.rejection_reason}</div>
                      )}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={cn('px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border', badge.cls)}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {abs.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(abs.id)}
                              className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approuver
                            </button>
                            <button
                              onClick={() => handleReject(abs.id)}
                              className="px-3 py-2 bg-red-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-red-600 transition-colors shadow-sm flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Rejeter
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(abs.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
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

        {/* Pagination */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="text-xs text-slate-400">Page {page} / {totalPages}</span>
          <div className="flex gap-1">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 text-xs disabled:opacity-50">&lt;</button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 text-xs disabled:opacity-50">&gt;</button>
          </div>
        </div>
      </div>
    </div>
  )
}
