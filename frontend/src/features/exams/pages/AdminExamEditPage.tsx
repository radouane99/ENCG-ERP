import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { examsApi } from '@shared/api/exams'

export default function AdminExamEditPage() {
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
  const surveillants = detailsData?.surveillances || []

  return (
    <div className="space-y-6 animate-in p-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin/exams" className="text-slate-400 hover:text-slate-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-[#0f2863]">Modifier un Examen</h1>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Filière</label>
            <select className="w-full h-12 px-4 rounded-xl border border-slate-200 text-slate-700 bg-white outline-none focus:border-blue-500">
              <option>{exam?.module?.filiere?.name || 'N/A'}</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Groupe</label>
            <select className="w-full h-12 px-4 rounded-xl border border-slate-200 text-slate-700 bg-white outline-none focus:border-blue-500">
              <option>{exam?.group?.name || 'N/A'}</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Module</label>
            <select className="w-full h-12 px-4 rounded-xl border border-slate-200 text-slate-700 bg-white outline-none focus:border-blue-500">
              <option>{exam?.module?.name || 'N/A'}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Session d'examen</label>
            <select className="w-full h-12 px-4 rounded-xl border border-slate-200 text-slate-700 bg-white outline-none focus:border-blue-500">
              <option>Session #{exam?.exam_session_id || 'N/A'}</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Type d'examen</label>
            <select className="w-full h-12 px-4 rounded-xl border border-slate-200 text-slate-700 bg-white outline-none focus:border-blue-500">
              <option>{exam?.type || 'EXAMEN'}</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Salle (Optionnelle mais recommandée)</label>
            <select className="w-full h-12 px-4 rounded-xl border border-slate-200 text-slate-700 bg-white outline-none focus:border-blue-500">
              <option>{exam?.room?.name || 'N/A'}</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Date</label>
            <div className="relative">
              <input type="date" defaultValue={exam?.exam_date?.split('T')[0]} className="w-full h-12 pl-4 pr-10 rounded-xl border border-slate-200 text-slate-700 bg-white outline-none focus:border-blue-500" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Heure de début</label>
            <div className="relative">
              <input type="time" defaultValue={exam?.start_time} className="w-full h-12 pl-4 pr-10 rounded-xl border border-slate-200 text-slate-700 bg-white outline-none focus:border-blue-500" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Durée (minutes)</label>
            <input type="number" defaultValue={exam?.duration_minutes} className="w-full h-12 px-4 rounded-xl border border-slate-200 text-slate-700 bg-white outline-none focus:border-blue-500" />
          </div>
        </div>

        <div className="mb-12">
          <label className="text-sm font-medium text-slate-600 block mb-4">Surveillants assignés</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {surveillants.length === 0 ? (
              <div className="text-slate-500 text-sm">Aucun surveillant assigné.</div>
            ) : (
              surveillants.map((s: any) => (
                <label key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-blue-100 bg-blue-50/30 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500" />
                  <span className="text-sm text-slate-700 font-medium">{s.name}</span>
                </label>
              ))
            )}
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-slate-100">
          <Link to="/admin/exams" className="h-12 px-8 rounded-xl bg-[#0f2863] hover:bg-[#1a387e] text-white text-sm font-bold uppercase tracking-wider flex items-center justify-center transition-colors shadow-sm">
            METTRE À JOUR L'EXAMEN
          </Link>
        </div>
      </div>
    </div>
  )
}
