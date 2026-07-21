import { Link, useParams } from 'react-router-dom'
import { Printer, ArrowLeft, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { examsApi } from '@shared/api/exams'

export default function AdminExamAttendanceSheetPage() {
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
  // The previous students mock array is removed

  return (
    <div className="min-h-screen bg-slate-100 p-8 pb-20 flex flex-col items-center font-sans">
      <div className="w-full max-w-[210mm] mb-6 flex justify-between items-center print:hidden">
        <Link to="/admin/exams" className="h-10 px-4 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>
        <button 
          onClick={() => window.print()}
          className="h-10 px-6 rounded-xl bg-[#0f2863] hover:bg-[#1a387e] text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
        >
          <Printer className="w-4 h-4" /> Imprimer la Fiche
        </button>
      </div>

      {/* A4 Paper Container */}
      <div className="bg-white w-[210mm] min-h-[297mm] shadow-lg p-12 print:shadow-none print:w-auto print:h-auto print:p-0 flex flex-col relative">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-[#0f2863] pb-6 mb-8">
          <div className="flex items-center gap-6">
            <img src="/logo-encg.png" alt="Logo ENCG" className="h-16 object-contain" />
            <div>
              <h1 className="text-lg font-black text-[#0f2863] uppercase tracking-wider">ECOLE NATIONALE DE COMMERCE ET DE GESTION</h1>
              <p className="text-[10px] text-slate-500">Direction des Affaires Académiques - ENCG Fès</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 mb-1">
              Fiche d'émargement - {exam?.module?.name || 'N/A'} - {exam?.module?.filiere?.name || 'N/A'}
            </p>
            <h2 className="text-xl font-bold text-[#0f2863] uppercase tracking-widest">FICHE D'ÉMARGEMENT</h2>
          </div>
        </div>

        {/* Info Grid */}
        <div className="mb-8 grid grid-cols-2 gap-x-12 gap-y-2 text-[11px]">
          <div className="flex items-center">
            <span className="font-bold text-[#0f2863] w-28">Module:</span>
            <span className="text-slate-700">{exam?.module?.name}</span>
          </div>
          <div className="flex items-center">
            <span className="font-bold text-[#0f2863] w-28">Heure:</span>
            <span className="text-slate-700">{exam?.start_time?.substring(0,5)} ({exam?.duration_minutes} min)</span>
          </div>
          <div className="flex items-center">
            <span className="font-bold text-[#0f2863] w-28">Filière & Groupe:</span>
            <span className="text-slate-700">
              {exam?.module?.filiere?.name || 'N/A'} {exam?.group ? ` - ${exam.group.name}` : ''}
            </span>
          </div>
          <div className="flex items-center">
            <span className="font-bold text-[#0f2863] w-28">Salle:</span>
            <span className="text-slate-700">{exam?.room?.name}</span>
          </div>
          <div className="flex items-center">
            <span className="font-bold text-[#0f2863] w-28">Date:</span>
            <span className="text-slate-700">{exam?.exam_date ? new Date(exam.exam_date).toLocaleDateString('fr-FR') : 'N/A'}</span>
          </div>
          <div className="flex items-center">
            <span className="font-bold text-[#0f2863] w-28">Effectif Attendu:</span>
            <span className="text-slate-700">{students.length} étudiants</span>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1">
          <table className="w-full text-[10px] border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-50">
                <th className="py-2 px-3 border border-slate-300 font-bold w-12 text-center">N°</th>
                <th className="py-2 px-3 border border-slate-300 font-bold w-32 text-left">CNE / MASSAR</th>
                <th className="py-2 px-3 border border-slate-300 font-bold text-left">NOM ET PRÉNOM</th>
                <th className="py-2 px-3 border border-slate-300 font-bold w-24 text-center">N° PLACE</th>
                <th className="py-2 px-3 border border-slate-300 font-bold w-48 text-center">SIGNATURE</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student: any, idx: number) => (
                <tr key={idx}>
                  <td className="py-2 px-3 border border-slate-300 font-bold text-center">{idx + 1}</td>
                  <td className="py-2 px-3 border border-slate-300 font-medium text-slate-700">{student.cne}</td>
                  <td className="py-2 px-3 border border-slate-300 font-bold text-slate-800 uppercase">{student.student_name}</td>
                  <td className="py-2 px-3 border border-slate-300 font-bold text-center text-slate-800">{student.seat_number}</td>
                  <td className="py-2 px-3 border border-slate-300"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Boxes */}
        <div className="mt-8 grid grid-cols-2 gap-8 break-inside-avoid">
          <div className="border border-[#0f2863]/20 rounded-xl p-4 text-[10px]">
            <p className="font-bold text-[#0f2863] mb-2">Surveillants Affectés :</p>
            <ul className="list-disc pl-4 text-slate-600 space-y-1 mb-8">
              {surveillants.length === 0 ? (
                <li>Aucun surveillant assigné</li>
              ) : (
                surveillants.map((s: any) => (
                  <li key={s.id}>{s.name}</li>
                ))
              )}
            </ul>
            <div className="border-t border-slate-300 pt-2">
              <span className="text-slate-400">Signatures :</span>
            </div>
          </div>
          
          <div className="border border-[#0f2863]/20 rounded-xl p-4 text-[10px]">
            <p className="font-bold text-[#0f2863] mb-1">Observation du déroulement :</p>
            <p className="text-slate-400 mb-8 italic">(Absences massives, incidents, retards, etc.)</p>
          </div>
        </div>

        <div className="mt-8 text-center text-[8px] text-slate-400 flex justify-between items-center">
          <span>https://plateforme-encg.com/admin/exams/{id}/attendance-sheet</span>
          <span>1/1</span>
        </div>
      </div>
    </div>
  )
}
