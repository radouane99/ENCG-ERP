import { Link } from 'react-router-dom'
import { Printer, ArrowLeft } from 'lucide-react'

export default function AdminExamAttendanceSheetPage() {
  const students = [
    { place: 1, matricule: 'S20260030', nom: 'ALI EL FASSI' },
    { place: 2, matricule: 'S20260047', nom: 'AMINE TAHIRI' },
    { place: 3, matricule: 'S20260037', nom: 'AYA ALAOUI' },
    { place: 4, matricule: 'S20260027', nom: 'AYOUB BOUJIDA' },
    { place: 5, matricule: 'S20260033', nom: 'CHAIMAE BENANI' },
    { place: 6, matricule: 'S20260038', nom: 'FATIMA SEKKAT' },
    { place: 7, matricule: 'S20260029', nom: 'KHADIJA IDRISSI' },
    { place: 8, matricule: 'S20260036', nom: 'MEHDI TAZI' },
    { place: 9, matricule: 'S20260031', nom: 'MOHAMMED BENNIS' },
    { place: 10, matricule: 'S20260048', nom: 'MOHAMMED BENNIS' },
    { place: 11, matricule: 'S20260045', nom: 'NADA ALAOUI' },
    { place: 12, matricule: 'S20260046', nom: 'NADA CHRAIBI' },
    { place: 13, matricule: 'S20260044', nom: 'NADA TAZI' },
    { place: 14, matricule: 'S20260035', nom: 'OMAR FILALI' },
    { place: 15, matricule: 'S20260039', nom: 'OMAR TAHIRI' },
    { place: 16, matricule: 'S20260041', nom: 'OTHMANE SEKKAT' },
    { place: 17, matricule: 'S20260043', nom: 'OTHMANE SEKKAT' },
    { place: 18, matricule: 'S20260028', nom: 'SALMA BENANI' },
    { place: 19, matricule: 'S20260012', nom: 'SALMA EL FASSI' },
    { place: 20, matricule: 'S20260099', nom: 'TARIQ LAHLOU' },
    { place: 21, matricule: 'S20260088', nom: 'TARIQ MANSOURI' },
    { place: 22, matricule: 'S20260077', nom: 'YASSINE TAZI' },
    { place: 23, matricule: 'S20260066', nom: 'YOUSSEF IDRISSI' },
    { place: 24, matricule: 'S20260055', nom: 'ZINEB ALAOUI' },
    { place: 25, matricule: 'S20260044', nom: 'ZINEB GUESSOUS' },
  ]

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
          <div>
            <h1 className="text-lg font-black text-[#0f2863] uppercase tracking-wider">UNIVERSITÉ PRIVÉE DE FÈS</h1>
            <p className="text-[10px] text-slate-500">Direction des Affaires Académiques</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 mb-1">Fiche d'émargement - Avancé - Génie Informatique</p>
            <h2 className="text-xl font-bold text-[#0f2863] uppercase tracking-widest">FICHE D'ÉMARGEMENT DES EXAMENS</h2>
          </div>
        </div>

        {/* Info Grid */}
        <div className="mb-8 grid grid-cols-2 gap-x-12 gap-y-2 text-[11px]">
          <div className="flex items-center">
            <span className="font-bold text-[#0f2863] w-28">Module:</span>
            <span className="text-slate-700">Avancé - Génie Informatique</span>
          </div>
          <div className="flex items-center">
            <span className="font-bold text-[#0f2863] w-28">Heure:</span>
            <span className="text-slate-700">11:00 - 12:30 (90 min)</span>
          </div>
          <div className="flex items-center">
            <span className="font-bold text-[#0f2863] w-28">Filière & Groupe:</span>
            <span className="text-slate-700">Génie Informatique - Génie Informatique - Groupe 2</span>
          </div>
          <div className="flex items-center">
            <span className="font-bold text-[#0f2863] w-28">Salle:</span>
            <span className="text-slate-700">Amphi Al Khwarizmi</span>
          </div>
          <div className="flex items-center">
            <span className="font-bold text-[#0f2863] w-28">Date:</span>
            <span className="text-slate-700">01/06/2026</span>
          </div>
          <div className="flex items-center">
            <span className="font-bold text-[#0f2863] w-28">Effectif Attendu:</span>
            <span className="text-slate-700">25 étudiants</span>
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
              {students.map((student, idx) => (
                <tr key={idx}>
                  <td className="py-2 px-3 border border-slate-300 font-bold text-center">{student.place}</td>
                  <td className="py-2 px-3 border border-slate-300 font-medium text-slate-700"></td>
                  <td className="py-2 px-3 border border-slate-300 font-bold text-slate-800 uppercase">{student.nom}</td>
                  <td className="py-2 px-3 border border-slate-300 text-center text-slate-400">—</td>
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
              <li>Aucun surveillant assigné</li>
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
          <span>https://gestion-universitaire-plateforme-de-gestion-acad-production.up.railway.app/admin/exams/4/attendance-sheet</span>
          <span>1/2</span>
        </div>
      </div>
    </div>
  )
}
