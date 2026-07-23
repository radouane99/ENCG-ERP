import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, Download, FileText, ArrowLeft, Loader2 } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { examsApi } from '@shared/api/exams'
import api from '@shared/lib/api'

export default function AdminExamDisplayListPage() {
  const { id } = useParams()

  const { data: detailsData, isLoading } = useQuery({
    queryKey: ['exam-details', id],
    queryFn: () => examsApi.getExamDetails(Number(id)),
    enabled: !!id
  })

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-100"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
  }

  const exam = detailsData?.exam
  const students = detailsData?.seatings || []
  const surveillants = detailsData?.surveillances || []

  // Removed hardcoded students

  return (
    <div className="space-y-6 animate-in p-6 max-w-7xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#0f2863] italic flex items-center gap-3">
          <FileText className="w-6 h-6 text-amber-500" /> Liste d'Affichage
        </h1>
        <div className="flex items-center gap-3">
          <Link to="/admin/exams" className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour au Planning
          </Link>
          <button
            onClick={async () => {
              if (!id) return;
              try {
                let res;
                const endpoints = [
                  `/admin/exams/${id}/door-sign-pdf`,
                  `/exams/${id}/door-sign-pdf`,
                  `/admin/exams/${id}/rooms/${exam?.room_id || exam?.room?.id || 1}/door-sign-pdf`,
                  `/exams/${id}/rooms/${exam?.room_id || exam?.room?.id || 1}/door-sign-pdf`
                ];

                for (const ep of endpoints) {
                  try {
                    res = await api.get(ep, { responseType: 'blob' });
                    if (res && res.data) break;
                  } catch {
                    // Try next endpoint
                  }
                }

                if (!res || !res.data) {
                  window.open(`/api/admin/exams/${id}/door-sign-pdf`, '_blank');
                  return;
                }

                const blob = new Blob([res.data], { type: 'application/pdf' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `Affiche_Porte_Exam_${id}.pdf`);
                document.body.appendChild(link);
                link.click();
                link.remove();
              } catch (e) {
                console.error('Erreur lors du téléchargement de l\'affiche de porte', e);
              }
            }}
            className="h-10 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" /> Imprimer Affiche de Porte (PDF)
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm mb-8 flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MODULE</p>
          <p className="font-bold text-slate-800 text-lg">{exam?.module?.name}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DATE & HEURE</p>
          <p className="font-bold text-blue-700 text-lg">{new Date(exam?.exam_date).toLocaleDateString('fr-FR')} à {exam?.start_time}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SALLE</p>
          <p className="font-bold text-blue-700 text-lg">{exam?.room?.name}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">GROUPE / FILIÈRE</p>
          <p className="font-bold text-slate-800 text-lg">{exam?.group?.name}<br/><span className="text-sm font-medium text-slate-500">({exam?.module?.filiere?.name})</span></p>
        </div>
        
        <div className="w-full mt-6 pt-6 border-t border-slate-100 flex items-start">
          <div className="space-y-1">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SURVEILLANTS ASSIGNÉS</p>
             <p className={cn("text-sm font-bold", surveillants.length > 0 ? "text-slate-800" : "text-red-500")}>
               {surveillants.length > 0 ? surveillants.map((s: any) => s.name).join(', ') : "Aucun surveillant"}
             </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Étudiants concernés ({students.length})</h2>
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
                  <td className="px-6 py-4 font-black text-slate-800">{student.seat_number}</td>
                  <td className="px-6 py-4 text-slate-500">{student.cne}</td>
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
