import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Target, BarChart2, Folder, FileText, ArrowRight, BookOpen, Users, Building } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'

export default function AdminGradesPage() {
  const navigate = useNavigate()
  
  const [filiere, setFiliere] = useState('')
  const [groupe, setGroupe] = useState('')
  const [module, setModule] = useState('')
  const [filieres, setFilieres] = useState<any[]>([])
  const [groupes, setGroupes] = useState<any[]>([])
  const [modules, setModules] = useState<any[]>([])

  useEffect(() => {
    api.get('/filieres').then(r => setFilieres(r.data.data || r.data)).catch(console.error)
  }, [])

  useEffect(() => {
    if (filiere) {
      setGroupe('')
      setModule('')
      setGroupes([])
      setModules([])
      api.get('/groups', { params: { filiere_id: filiere } })
        .then(r => setGroupes(r.data.data || r.data)).catch(console.error)
    }
  }, [filiere])

  useEffect(() => {
    if (groupe) {
      setModule('')
      setModules([])
      api.get('/modules', { params: { group_id: groupe } })
        .then(r => setModules(r.data.data || r.data)).catch(console.error)
    }
  }, [groupe])

  const isFormComplete = filiere !== '' && groupe !== '' && module !== ''

  const handleOpenRegistry = () => {
    if (isFormComplete) {
      navigate(`/admin/grades/edit?group_id=${groupe}&module_id=${module}`)
    }
  }

  return (
    <div className="space-y-8 animate-in p-6 max-w-[1200px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2863] italic">Gestion Globale des Notes</h1>
        </div>
      </div>

      {/* Console Banner */}
      <div className="bg-gradient-to-r from-[#0f2863] via-[#5c1c73] to-[#a11162] p-8 text-white rounded-[2rem] shadow-lg relative overflow-hidden">
        <h2 className="text-2xl font-bold italic mb-2 flex items-center gap-2">
          Console d'Administration des Notes <Target className="w-6 h-6 text-pink-400" />
        </h2>
        <p className="text-white/80 text-sm font-medium">
          Sélectionnez une filière, puis un groupe — les modules concernés s'affichent automatiquement.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm p-8 space-y-10">
        
        {/* Step 1 */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#0f2863] text-white flex items-center justify-center font-bold text-sm shrink-0">1</div>
            <h3 className="text-xs font-bold text-[#0f2863] uppercase tracking-wider">Choisir la Filière</h3>
          </div>
          <div className="relative pl-11">
            <Building className={cn("w-5 h-5 absolute left-14 top-1/2 -translate-y-1/2 transition-colors", filiere ? "text-pink-600" : "text-slate-400")} />
            <select 
              value={filiere}
              onChange={(e) => setFiliere(e.target.value)}
              className={cn(
                "w-full rounded-2xl border px-12 py-4 text-sm font-bold transition-all outline-none appearance-none bg-no-repeat bg-right",
                filiere ? "border-pink-200 bg-pink-50/30 text-[#0f2863] focus:border-pink-500 focus:ring-1 focus:ring-pink-500" : "border-slate-200 bg-slate-50/50 text-slate-500 focus:border-[#0f2863] focus:ring-1 focus:ring-[#0f2863]"
              )}
              style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundSize: '0.65em auto', backgroundPosition: 'right 1.5rem center' }}
            >
              <option value="">— Toutes les filières —</option>
              {filieres.map((f: any) => (
                <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
          {/* Step 2 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#0f2863] text-white flex items-center justify-center font-bold text-sm shrink-0">2</div>
              <h3 className="text-xs font-bold text-[#0f2863] uppercase tracking-wider">Sélectionner un Groupe</h3>
            </div>
            <div className="relative pl-11">
              <Users className={cn("w-5 h-5 absolute left-14 top-1/2 -translate-y-1/2 transition-colors", groupe ? "text-blue-600" : "text-slate-400")} />
              <select 
                value={groupe}
                onChange={(e) => setGroupe(e.target.value)}
                disabled={!filiere}
                className={cn(
                  "w-full rounded-2xl border px-12 py-4 text-sm font-bold transition-all outline-none appearance-none bg-no-repeat bg-right",
                  groupe ? "border-blue-500 bg-blue-50 text-[#0f2863] shadow-sm focus:ring-1 focus:ring-blue-500" : "border-slate-200 bg-slate-50/50 text-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                )}
                style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundSize: '0.65em auto', backgroundPosition: 'right 1.5rem center' }}
              >
                <option value="">Choisir un groupe...</option>
                {groupes.map((g: any) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Step 3 */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#0f2863] text-white flex items-center justify-center font-bold text-sm shrink-0">3</div>
              <h3 className="text-xs font-bold text-[#0f2863] uppercase tracking-wider">Module du Groupe</h3>
            </div>
            <div className="relative pl-11">
              {module && <div className="w-3 h-3 bg-cyan-400 absolute left-15 top-1/2 -translate-y-1/2 ml-[3.2rem]"></div>}
              <select 
                value={module}
                onChange={(e) => setModule(e.target.value)}
                disabled={!groupe}
                className={cn(
                  "w-full rounded-2xl border px-8 py-4 text-sm font-bold transition-all outline-none appearance-none bg-no-repeat bg-right",
                  module ? "border-emerald-400 bg-emerald-50/30 text-[#0f2863] shadow-sm pl-16 focus:ring-1 focus:ring-emerald-400" : "border-slate-200 bg-slate-50/50 text-slate-500 pl-8 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                )}
                style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundSize: '0.65em auto', backgroundPosition: 'right 1.5rem center' }}
              >
                {!groupe ? <option value="">Choisissez d'abord un groupe</option> : <option value="">Choisir un module...</option>}
                {modules.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.name} ({m.code})</option>
                ))}
              </select>
              {groupe && <p className="text-[10px] font-bold text-[#0f2863] uppercase mt-2 ml-2">{modules.length} MODULE(S) DISPONIBLE(S) POUR CE GROUPE</p>}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-2">Outils d'Export :</span>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-[#0f2863] hover:bg-slate-100 transition-colors">
              <BarChart2 className="w-3.5 h-3.5 text-blue-500" /> Statistiques Globales
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-[#0f2863] hover:bg-slate-100 transition-colors">
              <Folder className="w-3.5 h-3.5 text-amber-500" /> Toutes les Notes
            </button>
            {groupe && (
              <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-[#0f2863] hover:bg-slate-100 transition-colors">
                <Users className="w-3.5 h-3.5 text-purple-500" /> Notes du Groupe
              </button>
            )}
            {module && (
              <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-[#0f2863] hover:bg-slate-100 transition-colors">
                <BookOpen className="w-3.5 h-3.5 text-emerald-500" /> Notes du Module
              </button>
            )}
          </div>
          
          <button 
            onClick={handleOpenRegistry}
            disabled={!isFormComplete}
            className={cn(
              "flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all",
              isFormComplete 
                ? "bg-[#0f2863] text-white hover:bg-[#1a387e] shadow-md hover:shadow-lg hover:-translate-y-0.5" 
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            )}
          >
            Ouvrir le Registre des Notes <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  )
}
