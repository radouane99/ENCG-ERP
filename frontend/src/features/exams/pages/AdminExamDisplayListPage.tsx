import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, Download, FileText, ArrowLeft } from 'lucide-react'
import { cn } from '@shared/lib/utils'

export default function AdminExamDisplayListPage() {
  const { id } = useParams()

  const students = [
    { place: 1, matricule: 'S20260030', nom: 'Ali El Fassi', statut: 'En attente' },
    { place: 2, matricule: 'S20260047', nom: 'Amine Tahiri', statut: 'En attente' },
    { place: 3, matricule: 'S20260037', nom: 'Aya Alaoui', statut: 'En attente' },
    { place: 4, matricule: 'S20260027', nom: 'Ayoub Boujida', statut: 'En attente' },
    { place: 5, matricule: 'S20260033', nom: 'Chaimae Benani', statut: 'En attente' },
    { place: 6, matricule: 'S20260038', nom: 'Fatima Sekkat', statut: 'En attente' },
    { place: 7, matricule: 'S20260029', nom: 'Khadija Idrissi', statut: 'En attente' },
    { place: 8, matricule: 'S20260036', nom: 'Mehdi Tazi', statut: 'En attente' },
    { place: 9, matricule: 'S20260031', nom: 'Mohammed Bennis', statut: 'En attente' },
    { place: 10, matricule: 'S20260048', nom: 'Mohammed Bennis', statut: 'En attente' },
  ]

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
          <button className="h-10 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
            <Download className="w-4 h-4" /> Télécharger PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm mb-8 flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">MODULE</p>
          <p className="font-bold text-slate-800 text-lg">Avancé - Génie Informatique</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DATE & HEURE</p>
          <p className="font-bold text-blue-700 text-lg">01/06/2026 à 11:00:00</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SALLE</p>
          <p className="font-bold text-blue-700 text-lg">Amphi Al Khwarizmi</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">GROUPE / FILIÈRE</p>
          <p className="font-bold text-slate-800 text-lg">Génie Informatique - Groupe 2<br/><span className="text-sm font-medium text-slate-500">(Génie Informatique)</span></p>
        </div>
        
        <div className="w-full mt-6 pt-6 border-t border-slate-100 flex items-start">
          <div className="space-y-1">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SURVEILLANTS ASSIGNÉS</p>
             <p className="font-bold text-red-500 text-sm">Aucun surveillant</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Étudiants concernés (25)</h2>
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
              {students.map((student, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-black text-slate-800">{student.place}</td>
                  <td className="px-6 py-4 text-slate-500">{student.matricule}</td>
                  <td className="px-6 py-4 font-bold text-slate-700">{student.nom}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                      {student.statut}
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
