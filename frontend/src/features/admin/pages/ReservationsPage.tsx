import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit, Trash2, Calendar as CalendarIcon, User, Clock, CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setLoading(true)
        const res = await api.get('/room-bookings')
        setReservations(res.data.data || res.data)
      } catch (error) {
        console.error('Failed to fetch reservations:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchReservations()
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette réservation ?')) return
    try {
      await api.delete(`/room-bookings/${id}`)
      toast.success('Réservation supprimée')
      setReservations(prev => prev.filter(r => r.id !== id))
    } catch { toast.error('Erreur lors de la suppression') }
  }

  return (
    <div className="space-y-8 animate-in p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2863] italic">Gestion des Réservations de Salles</h1>
        </div>
        <Link 
          to="/admin/reservations/create"
          className="flex items-center gap-2 px-5 py-2.5 bg-[#0f2863] text-white font-bold rounded-full hover:bg-[#1a387e] transition-colors text-xs uppercase tracking-wide shadow-sm"
        >
          <Plus className="w-4 h-4" /> Créer une réservation
        </Link>
      </div>

      {/* Orange Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-8 text-white rounded-[2rem] shadow-md relative overflow-hidden">
        <h2 className="text-2xl font-bold italic mb-2 relative z-10">Supervision des Réservations</h2>
        <p className="text-white/90 text-sm font-medium max-w-2xl relative z-10">
          Gérez, approuvez, rejetez ou modifiez l'ensemble des réservations d'infrastructures de l'UPF.
        </p>
      </div>

      {/* Card Table */}
      <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden p-6 md:p-8">
        <h3 className="text-lg font-bold text-[#0f2863] italic mb-6">Demandes & Affectations Actives</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Salle Réservée</th>
                <th className="px-6 py-4">Professeur</th>
                <th className="px-6 py-4">Timing & Créneau</th>
                <th className="px-6 py-4">Statut</th>
                <th className="px-6 py-4 text-right">Actions de Management</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-3" />
                  <p className="text-slate-400">Chargement des réservations...</p>
                </td></tr>
              ) : reservations.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-400">Aucune réservation trouvée.</td></tr>
              ) : reservations.map(res => {
                const bookerName = res.booker ? `${res.booker.first_name} ${res.booker.last_name}` : 'Inconnu'
                const startDate = new Date(res.start_time)
                const endDate = new Date(res.end_time)
                
                return (
                  <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                          <CalendarIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{res.room_name || 'N/A'}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider line-clamp-1 max-w-[200px]" title={res.purpose}>{res.purpose || 'Aucun motif'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 text-xs font-bold">
                          {bookerName[0]}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{bookerName}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Demandeur</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-800 text-xs mb-1 capitalize">
                        {format(startDate, 'EEEE d MMM yyyy', { locale: fr })}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1",
                        res.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 
                        res.status === 'rejected' ? 'bg-red-100 text-red-600' : 
                        res.status === 'cancelled' ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-600'
                      )}>
                        <CheckCircle2 className="w-3 h-3" /> {res.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => handleDelete(res.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors">
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
    </div>
  )
}
