import { Link } from 'react-router-dom'
import { Printer,ArrowLeft } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '@shared/lib/api'

export default function AdminExamLiveAttendanceReportPage() {
  const { data: studentsData } = useQuery({
    queryKey: ['exam-attendance-report'],
    queryFn: () => api.get(`/students`).then(res => res.data.data || [])
  })
  
  const students = studentsData || []
  return (
    <div className="min-h-screen bg-muted pb-20 flex flex-col items-center font-sans">
      <div className="w-full max-w-[210mm] mb-6 flex justify-between items-center print:hidden">
        <Link to="/admin/exams/4/live-attendance" className="h-10 px-4 rounded-xl border border-border bg-card text-muted-foreground text-sm font-bold flex items-center gap-2 hover:bg-muted/50 transition-colors shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>
        <button 
          onClick={() => window.print()}
          className="h-10 px-6 rounded-xl bg-[#0f2863] hover:bg-[#1a387e] text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
        >
          <Printer className="w-4 h-4" /> Imprimer / PDF
        </button>
      </div>

      {/* A4 Paper Container */}
      <div className="bg-card w-[210mm] min-h-[297mm] shadow-lg p-12 print:shadow-none print:w-auto print:h-auto print:p-0 flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b-2 border-emerald-500 pb-6 mb-8">
          <div className="w-1/4">
            <img src="/logo-encg.png" alt="ENCG Fès" className="h-12 object-contain" />
          </div>
          <div className="w-2/4 text-center">
            <h1 className="text-emerald-600 mb-1 erp-page-title">ÉCOLE NATIONALE DE COMMERCE ET DE GESTION DE FÈS</h1>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Direction des Affaires Académiques & de la Scolarité</p>
          </div>
          <div className="w-1/4 text-right">
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-1">DOCUMENT OFFICIEL</p>
            <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Rapport de Présence d'Examen</p>
            <p className="text-[9px] text-slate-400">Généré le 01/07/2026 à 11:41</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="border border-primary/20 rounded-lg overflow-hidden mb-6">
          <div className="border-b border-primary/20 p-3 bg-indigo-50/30">
            <p className="text-[9px] font-bold text-indigo-300 uppercase tracking-wider mb-1">MODULE</p>
            <p className="text-sm font-bold text-[#0f2863]">Avancé - Génie Informatique</p>
          </div>
          <div className="border-b border-primary/20 p-3 bg-indigo-50/30">
            <p className="text-[9px] font-bold text-indigo-300 uppercase tracking-wider mb-1">GROUPE</p>
            <p className="text-sm font-bold text-[#0f2863]">Génie Informatique - Groupe 2</p>
          </div>
          <div className="p-3 bg-indigo-50/30">
            <p className="text-[9px] font-bold text-indigo-300 uppercase tracking-wider mb-1">DATE & HORAIRE</p>
            <p className="text-sm font-bold text-[#0f2863]">01/06/2026 à 11:00</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 border border-border mb-8 bg-muted/50">
          <div className="p-4 text-center border-r border-border">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">TOTAL INSCRITS</p>
            <p className="text-2xl font-bold text-foreground">0</p>
          </div>
          <div className="p-4 text-center border-r border-border">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">PRÉSENTS</p>
            <p className="text-2xl font-bold text-emerald-600">0 <span className="text-lg">(0%)</span></p>
          </div>
          <div className="p-4 text-center">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">ABSENTS</p>
            <p className="text-2xl font-bold text-red-600">0</p>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 mb-12">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="bg-[#112340] text-white">
                <th className="py-3 px-4 font-bold text-left w-12">#</th>
                <th className="py-3 px-4 font-bold text-left">ÉTUDIANT</th>
                <th className="py-3 px-4 font-bold text-center w-32">CNE / N°</th>
                <th className="py-3 px-4 font-bold text-center w-32">STATUT</th>
                <th className="py-3 px-4 font-bold text-center w-40">HEURE CHECK-IN</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">Aucun étudiant scanné</td>
                </tr>
              ) : (
                students.map((student: any, idx: number) => (
                  <tr key={idx} className="border-b border-border">
                    <td className="py-3 px-4 font-bold">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold">{student.nom}</td>
                    <td className="py-3 px-4 text-center">{student.cne}</td>
                    <td className="py-3 px-4 text-center">{student.statut}</td>
                    <td className="py-3 px-4 text-center">{student.heure}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end border-t border-border pt-8 mt-auto">
          <div className="space-y-1">
            <p className="text-[9px] text-slate-400">École Nationale de Commerce et de Gestion de Fès (ENCG Fès)</p>
            <p className="text-[9px] text-slate-400">Direction des Affaires Académiques</p>
            <p className="text-[10px] font-bold text-emerald-600 mt-2">Signature numérique du système : validée.</p>
          </div>
          <div className="w-64 text-center">
            <p className="text-[10px] text-muted-foreground mb-8">Signature de l'Administration</p>
            <div className="border-b border-slate-300 w-full"></div>
          </div>
        </div>

      </div>
    </div>
  )
}
