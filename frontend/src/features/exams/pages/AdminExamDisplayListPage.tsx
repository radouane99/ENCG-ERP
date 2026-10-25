import { Link,useParams } from 'react-router-dom'
import { Download,FileText,ArrowLeft,Loader2,Eye } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { examsApi } from '@shared/api/exams'
import api from '@shared/lib/api'
import { openExamDoorSignPdf,examDoorSignPdfUrl } from '@shared/lib/documentAccess'
import { toast } from 'sonner'

export default function AdminExamDisplayListPage() {
  const { id } = useParams()

  const { data: detailsData, isLoading } = useQuery({
    queryKey: ['exam-details', id],
    queryFn: () => examsApi.getExamDetails(Number(id)),
    enabled: !!id
  })

  const downloadDoorSign = async () => {
    if (!id) return
    const response = await api.get(examDoorSignPdfUrl(id).replace(/^\/api/, ''), {
      responseType: 'blob',
      headers: { Accept: 'application/pdf' },
    })
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `Affiche_Porte_Exam_${id}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-muted"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
  }

  const exam = detailsData?.exam
  const students = detailsData?.seatings || []
  const surveillants = detailsData?.surveillances || []

  return (
    <div className="space-y-6 animate-in max-w-7xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[#0f2863] italic flex items-center gap-3 erp-page-title">
          <FileText className="w-6 h-6 text-amber-500" /> Liste d'Affichage
        </h1>
        <div className="flex items-center gap-3">
          <Link to="/admin/exams" className="h-10 px-4 rounded-xl border border-border bg-card text-muted-foreground text-sm font-bold flex items-center gap-2 hover:bg-muted/50 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour au Planning
          </Link>
          
          <button
            onClick={() => {
              void openExamDoorSignPdf(id!).catch(() => toast.error("Impossible d'ouvrir l'affiche de porte."))
            }}
            className="h-10 px-4 rounded-xl border border-primary bg-primary/5 text-primary hover:bg-primary/10 text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Eye className="w-4 h-4" /> Aperçu PDF (Navigateur)
          </button>

          <button
            onClick={() => {
              void downloadDoorSign().catch(() => toast.error("Impossible de télécharger l'affiche de porte."))
            }}
            className="h-10 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" /> Télécharger PDF
          </button>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-8 shadow-sm mb-8 flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MODULE</p>
          <p className="font-bold text-foreground text-lg">{exam?.module?.name}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DATE & HEURE</p>
          <p className="font-bold text-primary text-lg">{new Date(exam?.exam_date).toLocaleDateString('fr-FR')} à {exam?.start_time}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SALLE</p>
          <p className="font-bold text-primary text-lg">{exam?.room?.name}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">GROUPE / FILIÈRE</p>
          <p className="font-bold text-foreground text-lg">{exam?.group?.name}<br/><span className="text-sm font-medium text-muted-foreground">({exam?.module?.filiere?.name})</span></p>
        </div>
        
        <div className="w-full mt-6 pt-6 border-t border-border flex items-start">
          <div className="space-y-1">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SURVEILLANTS ASSIGNÉS</p>
             <p className={cn("text-sm font-bold", surveillants.length > 0 ? "text-foreground" : "text-red-500")}>
               {surveillants.length > 0 ? surveillants.map((s: any) => s.name).join(', ') : "Aucun surveillant"}
             </p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Étudiants concernés ({students.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] text-slate-400 uppercase tracking-wider bg-slate-50/50">
              <tr>
                <th className="px-6 py-4 font-bold w-24">N° PLACE</th>
                <th className="px-6 py-4 font-bold w-32">MATRICULE</th>
                <th className="px-6 py-4 font-bold">NOM & PRÉNOM</th>
                <th className="px-6 py-4 font-bold text-right">STATUT CONVOCATION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-foreground">{student.seat_number}</td>
                  <td className="px-6 py-4 text-muted-foreground">{student.cne}</td>
                  <td className="px-6 py-4 font-bold text-slate-700">{student.student_name}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={cn("text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full",
                      student.sent_at ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {student.sent_at ? 'Envoyé' : 'En attente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
