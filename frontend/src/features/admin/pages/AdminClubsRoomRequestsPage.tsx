import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Building, ArrowLeft, Check, X, Calendar as CalendarIcon, Clock, Loader2 } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function AdminClubsRoomRequestsPage() {
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const res = await api.get('/room-bookings')
      // For demo, assuming clubs are those where purpose contains 'club' or just showing all
      // You can filter specifically if backend provides a flag
      setRequests(res.data.data || res.data)
    } catch (error) {
      toast.error('Erreur lors du chargement des demandes')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id: number, status: 'approved' | 'rejected') => {
    try {
      await api.put(`/room-bookings/${id}/status`, { status })
      toast.success(`Demande ${status === 'approved' ? 'approuvée' : 'refusée'}`)
      fetchRequests() // Refresh
    } catch (error) {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const filteredRequests = requests.filter(r => filter === 'all' || r.status === filter)

  const counts = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  }

  return (
    <div className="space-y-6 animate-in p-6 max-w-7xl mx-auto pb-20">
      <div className="flex items-center justify-center mb-12 relative">
        <Link to="/admin/clubs" className="absolute left-0 flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-3 mb-1">
            <Building className="w-6 h-6 text-[#0f2863]" />
            <h1 className="text-xl font-bold text-[#0f2863] italic">Demandes de Salles — Clubs</h1>
          </div>
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            APPROUVER OU REFUSER LES RÉSERVATIONS DEMANDÉES PAR LES PRÉSIDENTS DE CLUBS
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => setFilter('pending')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors",
            filter === 'pending' ? "bg-amber-500 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          )}
        >
          {filter === 'pending' && <span className="w-4 h-4 flex items-center justify-center rounded-full bg-white/20"><ClockIcon className="w-3 h-3" /></span>}
          En attente <span className="opacity-70">({counts.pending})</span>
        </button>
        <button 
          onClick={() => setFilter('approved')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors",
            filter === 'approved' ? "bg-emerald-500 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          )}
        >
          {filter === 'approved' ? <span className="w-4 h-4 flex items-center justify-center rounded-full bg-white/20"><Check className="w-3 h-3" /></span> : <Check className="w-4 h-4 text-emerald-500" />}
          Approuvées <span className="opacity-70">({counts.approved})</span>
        </button>
        <button 
          onClick={() => setFilter('rejected')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors",
            filter === 'rejected' ? "bg-red-500 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          )}
        >
          {filter === 'rejected' ? <span className="w-4 h-4 flex items-center justify-center rounded-full bg-white/20"><X className="w-3 h-3" /></span> : <X className="w-4 h-4 text-red-500" />}
          Refusées <span className="opacity-70">({counts.rejected})</span>
        </button>
        <button 
          onClick={() => setFilter('all')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors",
            filter === 'all' ? "bg-slate-700 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
          )}
        >
          <Building className="w-4 h-4 opacity-50" />
          Toutes
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#0f2863] mb-4" />
            <p className="text-sm font-medium text-slate-500">Chargement des demandes...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-12">
            <Building className="w-12 h-12 text-slate-300 mb-4" />
            <h3 className="text-sm font-bold text-slate-700 mb-2">Aucune demande de salle</h3>
            <p className="text-xs text-slate-400">Aucune réservation trouvée pour ce filtre.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredRequests.map(req => {
              const startDate = new Date(req.start_time)
              const endDate = new Date(req.end_time)
              const bookerName = req.booker ? `${req.booker.first_name} ${req.booker.last_name}` : 'Club Inconnu'

              return (
                <div key={req.id} className="flex flex-col md:flex-row items-center justify-between p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <CalendarIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-[#0f2863]">{req.room_name || 'Salle Non Définie'}</h4>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">— {bookerName}</span>
                      </div>
                      <p className="text-xs font-medium text-slate-500 line-clamp-1">{req.purpose || 'Aucun motif'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-800 capitalize">
                        {format(startDate, 'EEEE d MMM yyyy', { locale: fr })}
                      </div>
                      <div className="text-[10px] font-medium text-slate-500 flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3" />
                        {format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {req.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleUpdateStatus(req.id, 'approved')}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-colors"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleUpdateStatus(req.id, 'rejected')}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-500 hover:text-white transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {req.status === 'approved' && (
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                          Approuvée
                        </span>
                      )}
                      {req.status === 'rejected' && (
                        <span className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                          Refusée
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function ClockIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  )
}

