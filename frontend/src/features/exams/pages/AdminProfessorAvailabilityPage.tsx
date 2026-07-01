import { useState, useEffect } from 'react'
import { Bell, Users, MailQuestion, Hourglass, CheckSquare, AlertTriangle, Loader2 } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import { examsApi } from '@shared/api/exams'

export default function AdminProfessorAvailabilityPage() {
  const [selectedProfs, setSelectedProfs] = useState<number[]>([])
  const [professeurs, setProfesseurs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfessors = async () => {
    try {
      setIsLoading(true)
      const data = await examsApi.getProfessorAvailabilities()
      setProfesseurs(data)
    } catch (error) {
      console.error('Failed to fetch professors:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProfessors()
  }, [])

  const handleAlert = async (ids: number[]) => {
    try {
      await examsApi.alertProfessors(ids)
      alert(`${ids.length} professeurs alertés avec succès !`)
      setSelectedProfs([])
    } catch (error) {
      console.error('Failed to alert professors:', error)
    }
  }



  const getInitials = (name: string) => {
    return name.replace('Prof. ', '').substring(0, 1).toUpperCase()
  }

  const toggleSelectAll = () => {
    if (selectedProfs.length === professeurs.length) {
      setSelectedProfs([])
    } else {
      setSelectedProfs(professeurs.map(p => p.id))
    }
  }

  const toggleSelect = (id: number) => {
    if (selectedProfs.includes(id)) {
      setSelectedProfs(selectedProfs.filter(pid => pid !== id))
    } else {
      setSelectedProfs([...selectedProfs, id])
    }
  }

  return (
    <div className="space-y-6 animate-in p-6 max-w-[1400px] mx-auto pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2863] flex items-center gap-3">
            📅 Disponibilités Professeurs
          </h1>
          <p className="text-sm text-slate-500 mt-1">Gérez et envoyez les demandes de disponibilités par semestre</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold">1/5 soumises</span>
          <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> 4 en attente
          </span>
        </div>
      </div>

      {/* Alert Banner */}
      <div className="bg-orange-500 rounded-2xl p-4 text-white shadow-sm flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-2 rounded-xl">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold">Disponibilités en attente</h3>
            <p className="text-sm text-orange-100">{professeurs.filter(p => p.statut === 'Non envoyé').length} professeur(s) non notifié(s) et {professeurs.filter(p => p.statut === 'En attente').length} en attente de réponse.</p>
          </div>
        </div>
        <button 
          onClick={() => handleAlert(professeurs.filter(p => p.statut !== 'Soumise').map(p => p.id))}
          className="bg-white text-orange-500 hover:bg-orange-50 px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm flex items-center gap-2"
        >
          <Bell className="w-3.5 h-3.5" /> Alerter tous les non-soumis
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">TOTAL</p>
            <p className="text-3xl font-black text-slate-800">{professeurs.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <MailQuestion className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">NON ENVOYÉ</p>
            <p className="text-3xl font-black text-slate-800">{professeurs.filter(p => p.statut === 'Non envoyé').length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
            <Hourglass className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">EN ATTENTE</p>
            <p className="text-3xl font-black text-slate-800">{professeurs.filter(p => p.statut === 'En attente').length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
            <CheckSquare className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">SOUMISES</p>
            <p className="text-3xl font-black text-slate-800">{professeurs.filter(p => p.statut === 'Soumise').length}</p>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6 flex items-center justify-between">
        <div className="w-48">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">SEMESTRE</label>
          <select className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm text-slate-700 font-bold outline-none">
            <option>S7</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <label className="flex items-center gap-3 cursor-pointer text-sm font-medium text-slate-600">
            <input 
              type="checkbox" 
              checked={selectedProfs.length === professeurs.length}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500" 
            />
            Tout sélectionner
          </label>
          <button 
            disabled={selectedProfs.length === 0}
            onClick={() => handleAlert(selectedProfs)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors",
              selectedProfs.length > 0 
                ? "bg-amber-100 text-amber-700 hover:bg-amber-200" 
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            )}
          >
            <Bell className="w-3.5 h-3.5" /> Alerter les Professeurs
          </button>
        </div>
        <table className="w-full text-sm text-left">
          <thead className="text-[9px] text-slate-400 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4 w-12"></th>
              <th className="px-6 py-4 font-bold">PROFESSEUR</th>
              <th className="px-6 py-4 font-bold">DÉPARTEMENT</th>
              <th className="px-6 py-4 font-bold">CONTRAT</th>
              <th className="px-6 py-4 font-bold text-center">STATUT DISPONIBILITÉ</th>
              <th className="px-6 py-4 font-bold text-center">CRÉNEAUX DÉCLARÉS</th>
              <th className="px-6 py-4 font-bold">SOUMIS LE</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center">
                  <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
                </td>
              </tr>
            ) : professeurs.map((prof) => (
              <tr key={prof.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <input 
                    type="checkbox" 
                    checked={selectedProfs.includes(prof.id)}
                    onChange={() => toggleSelect(prof.id)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer" 
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                      {getInitials(prof.nom)}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{prof.nom}</p>
                      <p className="text-xs text-slate-400">{prof.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600">{prof.dept}</td>
                <td className="px-6 py-4 text-slate-600">{prof.contrat}</td>
                <td className="px-6 py-4 text-center">
                  {prof.statut === 'Soumise' ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold border border-emerald-100">
                      <CheckSquare className="w-3.5 h-3.5" /> Soumise
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-bold">
                      <MailQuestion className="w-3.5 h-3.5" /> Non envoyé
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-center text-slate-800 font-bold">{prof.creneaux}</td>
                <td className="px-6 py-4 text-xs text-slate-400">{prof.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}
