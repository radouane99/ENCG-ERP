import { useState } from 'react'
import { AlertCircle, Search, Filter, MessageCircle, FileText, Download } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { examsApi } from '@shared/api/exams'
import { cn } from '@shared/lib/utils'

export default function AdminExamIncidentsPage() {
  const { data: incidentsData, isLoading } = useQuery({
    queryKey: ['exam-incidents'],
    queryFn: () => examsApi.getIncidents(),
  })

  const incidents = incidentsData?.data || []

  return (
    <div className="space-y-6 animate-in p-6 max-w-7xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0f2863] italic">Registre des Incidents</h1>
            <p className="text-xs text-slate-500">
              Gestion des cas de fraude, retards et absences injustifiées
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="h-10 px-4 rounded-xl bg-[#0f2863] hover:bg-[#1a387e] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors shadow-sm">
            <Download className="w-4 h-4" /> EXPORTER LE REGISTRE
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6">
        {isLoading ? (
          <div className="text-center text-slate-500 py-8">Chargement des incidents...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 bg-slate-50/50">
                <tr>
                  <th className="px-4 py-3 font-medium rounded-tl-xl">ÉTUDIANT</th>
                  <th className="px-4 py-3 font-medium">EXAMEN & MODULE</th>
                  <th className="px-4 py-3 font-medium">TYPE</th>
                  <th className="px-4 py-3 font-medium">SIGNALÉ PAR</th>
                  <th className="px-4 py-3 font-medium">DATE</th>
                  <th className="px-4 py-3 font-medium rounded-tr-xl">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {incidents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-500">Aucun incident enregistré</td>
                  </tr>
                ) : (
                  incidents.map((incident: any) => (
                    <tr key={incident.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800">{incident.student?.user?.name || 'Étudiant inconnu'}</div>
                        <div className="text-xs text-slate-500">CNE: {incident.student?.cne || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-700">{incident.exam?.module?.name}</div>
                        <div className="text-xs text-slate-500">{incident.exam?.session?.name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-2.5 py-1 rounded-md text-xs font-medium border",
                          incident.type === 'fraude' && "bg-rose-50 text-rose-700 border-rose-200",
                          incident.type === 'retard' && "bg-amber-50 text-amber-700 border-amber-200",
                          incident.type === 'absence_injustifiee' && "bg-slate-100 text-slate-700 border-slate-200",
                          incident.type === 'autre' && "bg-indigo-50 text-indigo-700 border-indigo-200"
                        )}>
                          {incident.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-600">{incident.reporter?.name || 'Système'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-600">
                          {new Date(incident.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 p-1.5 rounded-md transition-colors" title="Voir les détails">
                          <FileText className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
