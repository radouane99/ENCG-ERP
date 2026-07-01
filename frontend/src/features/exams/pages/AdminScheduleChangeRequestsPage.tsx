import { useState, useEffect } from 'react'
import { Hourglass, CheckSquare, XCircle, List, Mailbox, Loader2, Check, X } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import { examsApi } from '@shared/api/exams'

export default function AdminScheduleChangeRequestsPage() {
  const [activeFilter, setActiveFilter] = useState('pending')
  const [requests, setRequests] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchRequests = async () => {
    try {
      setIsLoading(true)
      const data = await examsApi.getScheduleChangeRequests()
      setRequests(data)
    } catch (error) {
      console.error('Failed to fetch requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleUpdateStatus = async (id: number, status: 'approved' | 'rejected') => {
    try {
      await examsApi.updateScheduleChangeStatus(id, status)
      setRequests(requests.map(r => r.id === id ? { ...r, status } : r))
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const filteredRequests = requests.filter(r => activeFilter === 'all' || r.status === activeFilter)

  return (
    <div className="space-y-6 animate-in p-6 max-w-5xl mx-auto pb-20">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0f2863] flex items-center gap-3">
          📬 Demandes de Modification d'Emploi du Temps
        </h1>
        <p className="text-sm text-slate-500 mt-1">Boîte d'entrée des requêtes formelles de modification des créneaux</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8 bg-slate-50 p-1.5 rounded-2xl w-fit border border-slate-100">
        <button 
          onClick={() => setActiveFilter('pending')}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm",
            activeFilter === 'pending' ? "bg-white text-slate-800" : "text-slate-500 hover:text-slate-700 hover:bg-white/50 shadow-none"
          )}
        >
          <Hourglass className="w-4 h-4 text-amber-500" /> En attente <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">{requests.filter(r => r.status === 'pending').length}</span>
        </button>
        <button 
          onClick={() => setActiveFilter('approved')}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm",
            activeFilter === 'approved' ? "bg-white text-slate-800" : "text-slate-500 hover:text-slate-700 hover:bg-white/50 shadow-none"
          )}
        >
          <CheckSquare className="w-4 h-4 text-emerald-500" /> Approuvées <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">{requests.filter(r => r.status === 'approved').length}</span>
        </button>
        <button 
          onClick={() => setActiveFilter('rejected')}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm",
            activeFilter === 'rejected' ? "bg-white text-slate-800" : "text-slate-500 hover:text-slate-700 hover:bg-white/50 shadow-none"
          )}
        >
          <XCircle className="w-4 h-4 text-rose-500" /> Rejetées <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">{requests.filter(r => r.status === 'rejected').length}</span>
        </button>
        <button 
          onClick={() => setActiveFilter('all')}
          className={cn(
            "px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm",
            activeFilter === 'all' ? "bg-white text-slate-800" : "text-slate-500 hover:text-slate-700 hover:bg-white/50 shadow-none"
          )}
        >
          <List className="w-4 h-4 text-slate-400" /> Toutes <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-xs">{requests.length}</span>
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-24 flex flex-col items-center justify-center text-center animate-in fade-in">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <Mailbox className="w-10 h-10 text-blue-500" />
          </div>
          <p className="text-lg font-bold text-slate-600">
            Aucune demande pour ce statut
          </p>
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in">
          {filteredRequests.map((req) => (
            <div key={req.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex items-start gap-6 hover:shadow-md transition-shadow cursor-pointer">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                req.status === 'approved' ? "bg-emerald-50 text-emerald-500" :
                req.status === 'rejected' ? "bg-rose-50 text-rose-500" : "bg-amber-50 text-amber-500"
              )}>
                {req.status === 'approved' ? <CheckSquare className="w-6 h-6" /> :
                 req.status === 'rejected' ? <XCircle className="w-6 h-6" /> : <Hourglass className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">Décalage de l'examen de {req.module_name}</h3>
                    <p className="text-sm text-slate-500 font-medium">Demandé par {req.professor_name} — Dép. {req.department}</p>
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border",
                    req.status === 'approved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                    req.status === 'rejected' ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-amber-50 text-amber-600 border-amber-100"
                  )}>
                    {req.status === 'approved' ? 'Approuvée' : req.status === 'rejected' ? 'Rejetée' : 'En attente'}
                  </span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl mt-4 flex gap-8">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ANCIEN CRÉNEAU</p>
                    <p className="text-sm font-medium text-slate-600 line-through">{req.old_date} à {req.old_start_time}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">NOUVEAU CRÉNEAU PROPOSÉ</p>
                    <p className="text-sm font-bold text-blue-700">{req.proposed_date} à {req.proposed_start_time}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">MOTIF</p>
                    <p className="text-sm font-medium text-slate-700">{req.reason}</p>
                  </div>
                </div>
                
                {req.status === 'pending' && (
                  <div className="mt-4 flex items-center gap-2 justify-end border-t border-slate-100 pt-4">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleUpdateStatus(req.id, 'approved') }}
                      className="bg-[#0f2863] hover:bg-[#1a387e] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
                    >
                      <Check className="w-4 h-4" /> Approuver le changement
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleUpdateStatus(req.id, 'rejected') }}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors"
                    >
                      <X className="w-4 h-4" /> Rejeter
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
