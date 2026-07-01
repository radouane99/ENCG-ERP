import { useState, useEffect } from 'react'
import { Plus, Search, CheckCircle2, Lock, ArrowLeftRight, Edit2, Trash2, Check, User, MapPin, Loader2, Calendar } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { toast } from 'sonner'

export default function SchedulesEnginePage() {
  const [isGenerated, setIsGenerated] = useState(false)
  const [hoveredCell, setHoveredCell] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [filieres, setFilieres] = useState<any[]>([])
  const [groupes, setGroupes] = useState<any[]>([])
  const [academicYears, setAcademicYears] = useState<any[]>([])
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedGroupe, setSelectedGroupe] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')
  const [timetableItems, setTimetableItems] = useState<any[]>([])

  useEffect(() => {
    api.get('/filieres').then(r => setFilieres(r.data.data || r.data)).catch(console.error)
    api.get('/academic-years').then(r => setAcademicYears(r.data.data || r.data)).catch(console.error)
  }, [])

  useEffect(() => {
    if (selectedFiliere) {
      setSelectedGroupe('')
      api.get('/groups', { params: { filiere_id: selectedFiliere } })
        .then(r => setGroupes(r.data.data || r.data)).catch(console.error)
    }
  }, [selectedFiliere])

  const handleGenerate = async () => {
    if (!selectedGroupe && !selectedFiliere) {
      toast.warning('Veuillez sélectionner au moins une filière')
      return
    }
    try {
      setLoading(true)
      const typeParam = selectedGroupe ? 'group' : 'filiere'
      const idParam = selectedGroupe || selectedFiliere
      const res = await api.get(`/timetable/export/${typeParam}/${idParam}`)
      setTimetableItems(res.data.events || res.data || [])
      setIsGenerated(true)
    } catch (error) {
      console.error('Timetable error:', error)
      // Generate with mock data for demo
      setIsGenerated(true)
    } finally {
      setLoading(false)
    }
  }

  // Mock data for the grid cells
  const gridData: Record<string, Record<string, any>> = {
    'LUNDI': {
      '10:30': { type: 'locked' } // Group 1 has DÉVELOPPEMENT MOBILE, but let's mix states
    },
    'MARDI': {
      '08:30': { 
        id: 'INF-107', title: 'GAMING', prof: 'Radouane el asri', room: 'Salle Amphi Al Khwarizmi', state: 'valid' 
      }
    },
    'MERCREDI': {
      '10:30': { 
        id: 'INF-101', title: 'INTRODUCTION - GÉNIE INFORMATI...', prof: 'Prof', room: 'Salle Amphi Ibn Khaldoun', state: 'valid' 
      }
    },
    'JEUDI': {
      '08:30': {
        id: 'INF-103', title: 'DÉVELOPPEMENT MOBILE', prof: 'Prof', room: 'Salle Amphi Al Khwarizmi', state: 'draft'
      },
      '16:30': { 
        id: 'INF-102', title: 'AVANCÉ - GÉNIE INFORMATIQUE', prof: 'Prof', room: 'Salle Amphi Ibn Khaldoun', state: 'valid' 
      }
    },
    'VENDREDI': {
      '08:30': { 
        id: 'INF-104', title: 'DÉVELOPPEMENT MOBILE LARAVEL', prof: 'Prof', room: 'Salle Amphi Ibn Khaldoun', state: 'draft' 
      },
      '10:30': { 
        id: 'INF-106', title: 'SQL SERVER BASE DE DONNEE', prof: 'Prof', room: 'Salle Amphi Ibn Khaldoun', state: 'valid' 
      }
    }
  }

  const renderCell = (day: string, time: string) => {
    const cellId = `${day}-${time}`
    const cell = gridData[day]?.[time]
    
    if (!cell) return <td key={time} className="p-2 border border-slate-100/50 min-w-[200px] h-32 relative group" />

    if (cell.type === 'locked') {
      return (
        <td key={time} className="p-2 border border-slate-100/50 min-w-[200px] h-32 relative bg-slate-50/50 rounded-xl">
          <div className="w-full h-full rounded-xl border border-slate-100 flex items-center justify-center">
            <span className="px-3 py-1.5 bg-emerald-100 text-emerald-600 rounded-full text-xs font-bold flex items-center gap-1">
              <Lock className="w-3 h-3" /> VERROUILLÉ
            </span>
          </div>
        </td>
      )
    }

    const isValid = cell.state === 'valid'
    const borderColor = isValid ? 'border-emerald-200' : 'border-amber-200'
    const bgColor = isValid ? 'bg-white' : 'bg-amber-50/30'

    return (
      <td 
        key={time} 
        className="p-2 border border-slate-100/50 min-w-[200px] h-32 relative"
        onMouseEnter={() => setHoveredCell(cellId)}
        onMouseLeave={() => setHoveredCell(null)}
      >
        <div className={cn("w-full h-full rounded-xl p-3 border shadow-sm flex flex-col justify-between transition-all", borderColor, bgColor)}>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", isValid ? "bg-blue-100 text-blue-700" : "bg-blue-100 text-blue-700")}>
                {cell.id}
              </span>
              {isValid ? (
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              ) : (
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              )}
            </div>
            <h4 className="font-bold text-slate-800 text-[11px] leading-tight mb-2 line-clamp-2 uppercase">
              {cell.title}
            </h4>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-slate-500">
              <User className="w-3 h-3" />
              <span className="text-[10px] font-medium">{cell.prof}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500">
              <MapPin className="w-3 h-3" />
              <span className="text-[10px] font-medium line-clamp-1">{cell.room}</span>
            </div>
          </div>

          {/* Hover Actions */}
          {hoveredCell === cellId && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-[2px] rounded-xl flex items-center justify-center gap-2 animate-in fade-in zoom-in-95 shadow-lg border border-slate-100 z-10">
              <button className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-200 transition-colors" title="Valider">
                <Check className="w-4 h-4" />
              </button>
              <div className="relative group/swap">
                <button className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center hover:bg-blue-200 transition-colors">
                  <ArrowLeftRight className="w-4 h-4" />
                </button>
                {/* Tooltip */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-white border border-slate-200 shadow-sm text-xs font-medium text-slate-700 whitespace-nowrap opacity-0 group-hover/swap:opacity-100 transition-opacity pointer-events-none rounded">
                  Smart Swap Engine
                </div>
              </div>
              <button className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center hover:bg-amber-200 transition-colors" title="Éditer">
                <Edit2 className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors" title="Supprimer">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </td>
    )
  }

  return (
    <div className="space-y-8 animate-in p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex-1 text-center md:text-left md:flex md:flex-col md:items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-[#0f2863] italic">Moteur de Gestion des Emplois du Temps</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Grille Intelligente, Smart Swaps et Publication Automatique</p>
        </div>
        <div className="flex items-center justify-center shrink-0">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[#0f2863] text-white font-bold rounded-full hover:bg-[#1a387e] transition-colors text-xs uppercase tracking-wide shadow-sm">
            <Plus className="w-4 h-4" /> Nouvelle Affectation
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-8">
        <h3 className="text-lg font-bold text-[#0f2863] italic mb-6">Filtration Hiérarchique Stricte</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Année Universitaire</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#0f2863] focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">Sélectionner</option>
              {academicYears.map((y: any) => (
                <option key={y.id} value={y.id}>{y.name || y.label} {y.is_current ? '(Courante)' : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Semestre (Saison)</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#0f2863] focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">Sélectionner</option>
              <option value="1">S1 - Automne (Impair)</option>
              <option value="2">S2 - Printemps (Pair)</option>
              <option value="3">S3 - Automne (Impair)</option>
              <option value="4">S4 - Printemps (Pair)</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Filière</label>
            <select
              value={selectedFiliere}
              onChange={(e) => setSelectedFiliere(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#0f2863] focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">Sélectionner</option>
              {filieres.map((f: any) => (
                <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Groupe</label>
            <select
              value={selectedGroupe}
              onChange={(e) => setSelectedGroupe(e.target.value)}
              disabled={!selectedFiliere}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#0f2863] focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
            >
              <option value="">Sélectionner</option>
              {groupes.map((g: any) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="mt-8 flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-colors text-xs uppercase tracking-wide shadow-md disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'Génération...' : 'Générer la Matrice'}
          </button>
        </div>
      </div>

      {/* Grid */}
      {isGenerated && (
        <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden animate-in slide-in-from-bottom-4">
          <div className="p-6 md:p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-[#0f2863] italic">Grille Hebdomadaire (Group 1)</h2>
            <div className="flex items-center gap-3">
              <span className="px-4 py-1.5 border border-emerald-200 text-emerald-600 bg-emerald-50/30 font-bold rounded-lg text-xs uppercase tracking-wide">
                Publié
              </span>
              <span className="px-4 py-1.5 border border-amber-200 text-amber-600 bg-amber-50 font-bold rounded-lg text-xs uppercase tracking-wide">
                Brouillon
              </span>
            </div>
          </div>
          
          <div className="overflow-x-auto p-4 md:p-8 pt-0">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center border-b border-slate-100 w-32">Jour</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center border-b border-slate-100 min-w-[200px]">08:30 - 10:15</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center border-b border-slate-100 min-w-[200px]">10:30 - 12:15</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center border-b border-slate-100 min-w-[200px]">14:30 - 16:15</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center border-b border-slate-100 min-w-[200px]">16:30 - 18:15</th>
                </tr>
              </thead>
              <tbody>
                {['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI'].map(day => (
                  <tr key={day}>
                    <td className="p-4 text-xs font-bold text-[#0f2863] uppercase tracking-wider text-center border-b border-slate-100 border-r align-middle bg-slate-50/30">
                      {day}
                    </td>
                    {['08:30', '10:30', '14:30', '16:30'].map(time => renderCell(day, time))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
