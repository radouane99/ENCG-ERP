import { AlertCircle,FileText,Download } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { examsApi } from '@shared/api/exams'
import { openAuthenticatedUrl } from '@shared/lib/documentAccess'
import { cn } from '@shared/lib/utils'

export default function AdminExamIncidentsPage() {
  const { data: incidentsData, isLoading } = useQuery({
    queryKey: ['exam-incidents'],
    queryFn: () => examsApi.getIncidents(),
  })

  const incidents = incidentsData?.data || []

  return (
    <div className="space-y-6 animate-in max-w-7xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-[#0f2863] italic erp-page-title">Registre des Incidents</h1>
            <p className="text-xs text-muted-foreground">
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

      <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">Chargement des incidents...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground bg-slate-50/50">
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
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">Aucun incident enregistré</td>
                  </tr>
                ) : (
                  incidents.map((incident: any) => (
                    <tr key={incident.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{incident.student?.user?.name || 'Étudiant inconnu'}</div>
                        <div className="text-xs text-muted-foreground">CNE: {incident.student?.cne || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-700">{incident.exam?.module?.name}</div>
                        <div className="text-xs text-muted-foreground">{incident.exam?.session?.name}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "px-2.5 py-1 rounded-md text-xs font-medium border",
                          incident.type === 'fraude' && "bg-rose-50 text-rose-700 border-rose-200",
                          incident.type === 'retard' && "bg-amber-50 text-amber-700 border-amber-200",
                          incident.type === 'absence_injustifiee' && "bg-muted text-slate-700 border-border",
                          incident.type === 'autre' && "bg-primary/5 text-primary border-primary/20"
                        )}>
                          {incident.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-muted-foreground">{incident.reporter?.name || 'Système'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-muted-foreground">
                          {new Date(incident.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button 
                            type="button"
                            onClick={() => openAuthenticatedUrl(`/api/incidents/${incident.id}/convocation-pdf`)}
                            className="px-2.5 py-1.5 bg-primary/5 hover:bg-primary/10 text-primary rounded-lg text-xs font-bold transition-all flex items-center gap-1 border border-primary/20"
                            title="Télécharger la Convocation au Conseil de Discipline"
                          >
                            <FileText className="w-3.5 h-3.5" /> Convocation (PDF)
                          </button>

                          <button 
                            type="button"
                            onClick={() => openAuthenticatedUrl(`/api/incidents/${incident.id}/decision-pdf`)}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border border-rose-200" 
                            title="Télécharger la Décision Officielle du Conseil de Discipline"
                          >
                            <FileText className="w-3.5 h-3.5" /> Décision (PDF)
                          </button>
                        </div>
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
