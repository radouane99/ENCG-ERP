import { useState } from 'react'
import { FileText, Download, CalendarDays, Clock, MapPin } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { examsApi } from '@shared/api/exams'

export default function StudentMyConvocationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-convocations'],
    queryFn: async () => {
      // Temporary mock fetch, should map to the actual endpoint
      // We will use the generic api client
      const response = await fetch('/api/v1/student-portal/convocations', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
      const result = await response.json()
      return result.convocations || []
    },
  })

  const convocations = data || []

  return (
    <div className="space-y-6 animate-in p-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#0f2863] italic">Mes Convocations</h1>
          <p className="text-xs text-slate-500">
            Retrouvez ici toutes vos convocations aux examens
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6">
        {isLoading ? (
          <div className="text-center text-slate-500 py-8">Chargement...</div>
        ) : (
          <div className="space-y-4">
            {convocations.length === 0 ? (
              <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-2xl border border-slate-100">
                Vous n'avez aucune convocation pour le moment.
              </div>
            ) : (
              convocations.map((conv: any) => (
                <div key={conv.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-white border border-slate-200 rounded-2xl hover:border-indigo-300 transition-colors shadow-sm gap-4">
                  <div>
                    <div className="text-xs font-bold text-indigo-600 mb-1 tracking-wider uppercase">{conv.code}</div>
                    <h3 className="text-lg font-bold text-slate-800 mb-3">{conv.module}</h3>
                    
                    <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-600">
                      <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                        <CalendarDays className="w-4 h-4 text-slate-400" /> {conv.date}
                      </div>
                      <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                        <Clock className="w-4 h-4 text-slate-400" /> {conv.time} ({conv.duration})
                      </div>
                      <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-md border border-amber-200">
                        <MapPin className="w-4 h-4" /> {conv.room} - {conv.seat}
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shrink-0"
                    onClick={() => window.open(`/api/v1/student-portal/convocations/${conv.id}/download`, '_blank')}
                  >
                    <Download className="w-4 h-4" /> Télécharger PDF
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
