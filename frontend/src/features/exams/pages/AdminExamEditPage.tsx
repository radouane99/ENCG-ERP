import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'

export default function AdminExamEditPage() {
  const { id } = useParams()

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
              <option>Génie Informatique</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Groupe</label>
            <select className="w-full h-12 px-4 rounded-xl border border-slate-200 text-slate-700 bg-white outline-none focus:border-blue-500">
              <option>Génie Informatique - Groupe 2</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Module</label>
            <select className="w-full h-12 px-4 rounded-xl border border-slate-200 text-slate-700 bg-white outline-none focus:border-blue-500">
              <option>Avancé - Génie Informatique</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Session d'examen</label>
            <select className="w-full h-12 px-4 rounded-xl border border-slate-200 text-slate-700 bg-white outline-none focus:border-blue-500">
              <option>Rattrapage Automne (15/05 - 15/06)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Type d'examen</label>
            <select className="w-full h-12 px-4 rounded-xl border border-slate-200 text-slate-700 bg-white outline-none focus:border-blue-500">
              <option>Contrôle Continu 1</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Salle (Optionnelle mais recommandée)</label>
            <select className="w-full h-12 px-4 rounded-xl border border-slate-200 text-slate-700 bg-white outline-none focus:border-blue-500">
              <option>Amphi Al Khwarizmi (Capacité: 300)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Date</label>
            <div className="relative">
              <input type="text" defaultValue="01/06/2026" className="w-full h-12 pl-4 pr-10 rounded-xl border border-slate-200 text-slate-700 bg-white outline-none focus:border-blue-500" />
              <Calendar className="w-5 h-5 text-slate-400 absolute right-4 top-3.5 pointer-events-none" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Heure de début</label>
            <div className="relative">
              <input type="text" defaultValue="11:00" className="w-full h-12 pl-4 pr-10 rounded-xl border border-slate-200 text-slate-700 bg-white outline-none focus:border-blue-500" />
              <Clock className="w-5 h-5 text-slate-400 absolute right-4 top-3.5 pointer-events-none" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600">Durée (minutes)</label>
            <input type="number" defaultValue="90" className="w-full h-12 px-4 rounded-xl border border-slate-200 text-slate-700 bg-white outline-none focus:border-blue-500" />
          </div>
        </div>

        <div className="mb-12">
          <label className="text-sm font-medium text-slate-600 block mb-4">Surveillants assignés</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-blue-100 bg-blue-50/30 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500" />
              <span className="text-sm text-slate-700 font-medium">Prof. Fatima Zahra Bennani</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-xl border border-blue-100 bg-blue-50/30 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500" />
              <span className="text-sm text-slate-700 font-medium">Prof. Hicham Alaoui</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-xl border border-blue-100 bg-blue-50/30 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500" />
              <span className="text-sm text-slate-700 font-medium">Prof. Salma Tazi</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-xl border border-blue-100 bg-blue-50/30 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500" />
              <span className="text-sm text-slate-700 font-medium">Prof. Youssef El Mansouri</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-xl border border-blue-100 bg-blue-50/30 cursor-pointer">
              <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500" />
              <span className="text-sm text-slate-700 font-medium">Radouane el asri</span>
            </label>
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
