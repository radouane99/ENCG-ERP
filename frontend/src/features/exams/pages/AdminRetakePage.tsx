import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, CheckCircle, XCircle, Clock, AlertTriangle, Filter, Check, X } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import { examsApi } from '@shared/api/exams'

export default function AdminRetakePage() {
  const [students, setStudents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchRetakes = async () => {
    try {
      setIsLoading(true)
      const data = await examsApi.getRetakes()
      setStudents(data)
    } catch (error) {
      console.error('Failed to fetch retakes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRetakes()
  }, [])

  const handleUpdateStatus = async (id: number, status: 'Accordé' | 'Refusé') => {
    try {
      await examsApi.updateRetakeStatus(id, status)
      // Optimistic update
      setStudents(students.map(s => s.id === id ? { ...s, status, dateAction: new Date().toLocaleDateString('fr-FR') } : s))
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }


  return (
    <div className="space-y-6 animate-in p-6 max-w-[1400px] mx-auto pb-20">
      
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-[#0f2863] italic flex items-center gap-3">
          🎓 Liste de Rattrapage
        </h1>
        <div className="flex items-center gap-3">
          <Link to="/admin/pilotage" className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 transition-colors">
            — PILOTAGE
          </Link>
        </div>
      </div>

      <div className="bg-[#198754] rounded-2xl p-6 text-white mb-6 shadow-sm">
        <h2 className="text-2xl font-bold italic mb-2">Éligibilité au Rattrapage</h2>
        <p className="text-sm font-medium text-emerald-100">Gestion des droits de rattrapage : absent justifié ou note insuffisante.</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center">
          <p className="text-3xl font-black text-amber-500 mb-1">{students.filter(s => s.status === 'En attente').length}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">EN ATTENTE</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center">
          <p className="text-3xl font-black text-blue-700 mb-1">{students.length}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ÉLIGIBLES</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center">
          <p className="text-3xl font-black text-blue-700 mb-1">{students.filter(s => s.status === 'Accordé').length}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ACCORDÉS</p>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center">
          <p className="text-3xl font-black text-red-500 mb-1">{students.filter(s => s.status === 'Refusé').length}</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">NON ÉLIGIBLES</p>
        </div>
      </div>

      <div className="bg-white rounded-full border border-slate-200 p-2 shadow-sm mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4 px-4 flex-1">
          <div className="flex items-center gap-3">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">SESSION</label>
            <select className="h-10 px-3 rounded-xl bg-transparent border-none text-sm font-medium text-slate-700 outline-none w-48 cursor-pointer hover:bg-slate-50 transition-colors">
              <option>Toutes sessions</option>
            </select>
          </div>
          <div className="w-px h-6 bg-slate-200"></div>
          <div className="flex items-center gap-3">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">FILIÈRE</label>
            <select className="h-10 px-3 rounded-xl bg-transparent border-none text-sm font-medium text-slate-700 outline-none w-40 cursor-pointer hover:bg-slate-50 transition-colors">
              <option>Toutes filières</option>
            </select>
          </div>
          <div className="w-px h-6 bg-slate-200"></div>
          <div className="flex items-center gap-3">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">RAISON</label>
            <select className="h-10 px-3 rounded-xl bg-transparent border-none text-sm font-medium text-slate-700 outline-none w-32 cursor-pointer hover:bg-slate-50 transition-colors">
              <option>Toutes</option>
            </select>
          </div>
          <div className="w-px h-6 bg-slate-200"></div>
          <div className="flex items-center gap-3">
            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">DÉCISION</label>
            <select className="h-10 px-3 rounded-xl bg-transparent border-none text-sm font-medium text-slate-700 outline-none w-32 cursor-pointer hover:bg-slate-50 transition-colors">
              <option>Tous</option>
            </select>
          </div>
        </div>
        <button className="bg-[#0f2863] hover:bg-[#1a387e] text-white px-8 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors shadow-sm">
          FILTRER
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="text-[9px] text-slate-400 uppercase tracking-wider bg-slate-50/50">
            <tr>
              <th className="px-6 py-5 font-bold w-16">#</th>
              <th className="px-6 py-5 font-bold w-48">ÉTUDIANT</th>
              <th className="px-6 py-5 font-bold">FILIÈRE / GROUPE</th>
              <th className="px-6 py-5 font-bold">MODULE / EXAMEN</th>
              <th className="px-6 py-5 font-bold">RAISON</th>
              <th className="px-6 py-5 font-bold text-center">ÉLIGIBILITÉ</th>
              <th className="px-6 py-5 font-bold text-center">DÉCISION ADMIN</th>
              <th className="px-6 py-5 font-bold text-right w-48">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((student) => (
              <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 font-black text-slate-500">{student.id}</td>
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-800">{student.nom}</p>
                  <p className="text-xs text-slate-400">{student.cne}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-700">{student.filiere}</p>
                  <span className="inline-flex items-center gap-1 mt-1 bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px] font-medium">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    {student.groupe}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-800">{student.module}</p>
                  <p className="text-xs text-slate-400">{student.date}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-bold">
                    {student.raison}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={cn(
                    "inline-flex px-3 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider",
                    student.status === 'Refusé' ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                  )}>
                    {student.status === 'Refusé' ? 'Non Éligible' : 'Éligible'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  {student.status === 'Refusé' && (
                    <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-red-100">
                      <X className="w-3.5 h-3.5" /> Refusé
                    </span>
                  )}
                  {student.status === 'Accordé' && (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                      <Check className="w-3.5 h-3.5" /> Accordé
                    </span>
                  )}
                  {student.status === 'En attente' && (
                    <span className="inline-flex items-center gap-1 text-slate-400 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">
                      — En attente
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {student.status === 'En attente' ? (
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleUpdateStatus(student.id, 'Accordé')}
                        className="bg-[#0f2863] hover:bg-[#1a387e] text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" /> Accorder
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(student.id, 'Refusé')}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors border border-rose-100"
                      >
                        <X className="w-3.5 h-3.5" /> Refuser
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-300">{student.dateAction || student.date_decision}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
