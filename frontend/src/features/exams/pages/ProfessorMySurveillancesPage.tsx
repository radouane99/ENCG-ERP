import { useState } from 'react'
import { FileText, Download, CalendarDays, Clock, MapPin, CheckCircle2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

export default function ProfessorMySurveillancesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-surveillances'],
    queryFn: async () => {
      const response = await fetch('/api/v1/professor/my-surveillances', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      const result = await response.json()
      return result.data || []
    },
  })

  const surveillances = data || []

  return (
    <div className="space-y-6 animate-in p-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#0f2863] italic">Mes Ordres de Surveillance</h1>
          <p className="text-xs text-slate-500">
            Retrouvez ici toutes vos affectations de surveillance pour les examens
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6">
        {isLoading ? (
          <div className="text-center text-slate-500 py-8">Chargement...</div>
        ) : (
          <div className="space-y-4">
            {surveillances.length === 0 ? (
              <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-2xl border border-slate-100">
                Vous n'avez aucune affectation de surveillance pour le moment.
              </div>
            ) : (
              surveillances.map((surv: any) => (
                <div key={surv.surveillance_id} className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl hover:border-teal-300 transition-colors shadow-sm gap-4 relative overflow-hidden">
                  
                  {surv.confirmed_at && (
                    <div className="absolute top-0 right-0 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> CONFIRMÉ
                    </div>
                  )}

                  <div>
                    <div className="text-xs font-bold text-teal-600 mb-1 tracking-wider uppercase">{surv.session_name} - {surv.session_type}</div>
                    <h3 className="text-lg font-bold text-slate-800 mb-3">{surv.module_name}</h3>
                    
                    <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-600">
                      <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                        <CalendarDays className="w-4 h-4 text-slate-400" /> {surv.exam_date}
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                        <Clock className="w-4 h-4 text-slate-400" /> {surv.start_time ? surv.start_time.substring(0,5) : ''}
                      </div>
                      <div className="flex items-center gap-1.5 bg-teal-50 text-teal-700 px-2.5 py-1 rounded-md border border-teal-200">
                        <MapPin className="w-4 h-4" /> {surv.room_name}
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-bold">
                        {surv.role}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                    {!surv.confirmed_at && (
                      <button 
                        className="h-10 px-4 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                        onClick={async () => {
                          await fetch(`/api/verify/surveillance/${surv.qr_token}/confirm`)
                          window.location.reload()
                        }}
                      >
                        <CheckCircle2 className="w-4 h-4" /> Confirmer
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
