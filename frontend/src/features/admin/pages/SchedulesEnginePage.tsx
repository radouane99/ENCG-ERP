import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Search, CheckCircle2, Lock, ArrowLeftRight, Edit2, Trash2, Check, User, MapPin, Loader2, Calendar, Sparkles, ShieldCheck, Layers } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { toast } from 'sonner'
import { Modal } from '@shared/components/ui/Modal'

export default function SchedulesEnginePage() {
  const { t, i18n } = useTranslation(['timetable', 'common'])
  const isRtl = i18n.language === 'ar'

  const [filieres, setFilieres] = useState<any[]>([])
  const [groupes, setGroupes] = useState<any[]>([])
  const [academicYears, setAcademicYears] = useState<any[]>([])
  
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedGroupe, setSelectedGroupe] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('5')
  
  // AI Simulation State
  const [aiSimulation, setAiSimulation] = useState<any | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [activeGroupTab, setActiveGroupTab] = useState<'group1' | 'group2'>('group1')

  // Manual Timetable State
  const [timetableItems, setTimetableItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [isGenerated, setIsGenerated] = useState(false)
  
  // Data for Form
  const [modules, setModules] = useState<any[]>([])
  const [professors, setProfessors] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  
  const [formData, setFormData] = useState({
    module_id: '',
    professor_id: '',
    room_id: '',
    day_of_week: '1',
    start_time: '08:30',
    end_time: '10:15',
    session_type: 'CM'
  })

  useEffect(() => {
    api.get('/filieres').then(r => setFilieres(r.data.data || r.data)).catch(console.error)
    api.get('/academic-years').then(r => setAcademicYears(r.data.data || r.data)).catch(console.error)
    api.get('/professors').then(r => setProfessors(r.data.data || r.data)).catch(console.error)
    api.get('/rooms').then(r => setRooms(r.data.data || r.data)).catch(console.error)
  }, [])

  useEffect(() => {
    if (selectedFiliere) {
      setSelectedGroupe('')
      api.get('/groups', { params: { filiere_id: selectedFiliere } })
        .then(r => setGroupes(r.data.data || r.data)).catch(console.error)
    }
  }, [selectedFiliere])

  // Generate AI Timetable Simulation (Groupe 1 & Groupe 2, 0 Weekend, 0 Collisions)
  const handleGenerateAiSimulation = async () => {
    if (!selectedFiliere) {
      toast.warning('Veuillez sélectionner au moins une filière pour lancer la simulation IA')
      return
    }

    try {
      setAiLoading(true)
      const res = await api.post('/schedules/ai-simulation', {
        filiere_id: parseInt(selectedFiliere),
        semester_number: parseInt(selectedSemester) || 5
      })

      if (res.data.success === false) {
        toast.error(res.data.message || 'Erreur lors de la génération de la simulation IA')
        return
      }

      setAiSimulation(res.data)
      toast.success(res.data.message || 'Simulation d\'emploi du temps optimisée par IA générée avec succès !')
    } catch (error: any) {
      console.error('AI Timetable generation error:', error)
      toast.error(error.response?.data?.message || 'Erreur lors de la génération de la simulation IA')
    } finally {
      setAiLoading(false)
    }
  }

  const fetchTimetable = async () => {
    if (!selectedGroupe && !selectedFiliere) {
      toast.warning('Veuillez sélectionner au moins une filière')
      return
    }
    try {
      setLoading(true)
      const typeParam = selectedGroupe ? 'group' : 'filiere'
      const idParam = selectedGroupe || selectedFiliere
      const res = await api.get(`/timetable/export/${typeParam}/${idParam}`)
      setTimetableItems(res.data.data || res.data || [])
      setIsGenerated(true)
    } catch (error) {
      console.error('Timetable error:', error)
      toast.error('Erreur lors du chargement de la matrice')
    } finally {
      setLoading(false)
    }
  }

  const daysList = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
  const timeSlotsList = ['08:30 - 10:30', '10:45 - 12:45', '14:00 - 16:00', '16:15 - 18:15']

  const currentGroupSchedule = activeGroupTab === 'group1' 
    ? (aiSimulation?.group_1_schedule || [])
    : (aiSimulation?.group_2_schedule || [])

  return (
    <div className={cn("space-y-8 animate-in p-6 max-w-[1400px] mx-auto pb-20", isRtl && "rtl")}>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0f2863] to-[#002e5b] text-white p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold mb-3 text-blue-200">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Moteur d'Optimisation d'Emplois du Temps par IA — ENCG Fès</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Générateur d'Emplois du Temps par IA</h1>
          <p className="text-slate-300 text-sm mt-2 max-w-2xl">
            Génération automatique sans collision (0 cours le week-end, équilibre des charges enseignants, gestion de la capacité des salles & deux groupes d'études).
          </p>
        </div>

        <button 
          onClick={handleGenerateAiSimulation}
          disabled={aiLoading}
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 px-6 py-3.5 rounded-2xl font-bold text-sm shadow-lg shadow-amber-400/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shrink-0"
        >
          {aiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          <span>{aiLoading ? 'Génération IA...' : 'Générer Emploi du Temps IA'}</span>
        </button>
      </div>

      {/* Control & Selection Panel */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-[#0f2863] flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-600" />
          <span>Sélection de la Filière & du Semestre</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Filière d'Enseignement</label>
            <select
              value={selectedFiliere}
              onChange={(e) => setSelectedFiliere(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-[#0f2863] focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner une Filière</option>
              {filieres.map((f: any) => (
                <option key={f.id} value={f.id}>{f.name} ({f.code || 'ENCG'})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Semestre d'Études</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-[#0f2863] focus:ring-2 focus:ring-blue-500"
            >
              <option value="1">Semestre 1 (S1 - Tronc Commun)</option>
              <option value="2">Semestre 2 (S2 - Tronc Commun)</option>
              <option value="3">Semestre 3 (S3 - Tronc Commun)</option>
              <option value="4">Semestre 4 (S4 - Tronc Commun)</option>
              <option value="5">Semestre 5 (S5 - Spécialités)</option>
              <option value="6">Semestre 6 (S6 - Spécialités)</option>
              <option value="7">Semestre 7 (S7 - Master ENCG)</option>
              <option value="8">Semestre 8 (S8 - Master ENCG)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerateAiSimulation}
              disabled={aiLoading || !selectedFiliere}
              className="w-full flex items-center justify-center gap-2 bg-[#0f2863] hover:bg-[#1a387e] text-white py-3.5 rounded-2xl font-bold text-sm shadow-md transition-all disabled:opacity-50"
            >
              {aiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-amber-300" />}
              <span>Lancer Simulation IA (2 Groupes)</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI Timetable Simulation Result Display */}
      {aiSimulation && (
        <div className="space-y-6 animate-in zoom-in-95">
          {/* AI Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
              <div className="text-xs font-bold text-slate-400 uppercase">Taux Zéro Conflit</div>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">{aiSimulation.ai_stats.collision_free_score}</div>
              <div className="text-[10px] text-slate-500 mt-1">Salles & Profs 100% Libres</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
              <div className="text-xs font-bold text-slate-400 uppercase">Capacité des Salles</div>
              <div className="text-2xl font-extrabold text-blue-600 mt-1">{aiSimulation.ai_stats.room_capacity_fit}</div>
              <div className="text-[10px] text-slate-500 mt-1">Amphis & Salles Optimisés</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
              <div className="text-xs font-bold text-slate-400 uppercase">Cours en Week-end</div>
              <div className="text-2xl font-extrabold text-emerald-600 mt-1">0 Samedi / Dimanche</div>
              <div className="text-[10px] text-slate-500 mt-1">Lundi au Vendredi Uniquement</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
              <div className="text-xs font-bold text-slate-400 uppercase">Équilibre Charge Profs</div>
              <div className="text-2xl font-extrabold text-purple-600 mt-1">{aiSimulation.ai_stats.prof_workload_balance}</div>
              <div className="text-[10px] text-slate-500 mt-1">Répartition Équitable</div>
            </div>
          </div>

          {/* Group 1 & Group 2 Tabs */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-[#0f2863]">
                  Emploi du Temps IA — {aiSimulation.filiere} ({aiSimulation.semester})
                </h3>
                <p className="text-xs text-slate-500 mt-1">Proposition d'emploi du temps hebdomadaire optimisée sans aucun chevauchement.</p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveGroupTab('group1')}
                  className={cn(
                    "px-5 py-2.5 rounded-xl font-bold text-xs transition-all",
                    activeGroupTab === 'group1'
                      ? "bg-[#0f2863] text-white shadow-md"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  📅 Groupe 1
                </button>
                <button
                  onClick={() => setActiveGroupTab('group2')}
                  className={cn(
                    "px-5 py-2.5 rounded-xl font-bold text-xs transition-all",
                    activeGroupTab === 'group2'
                      ? "bg-[#0f2863] text-white shadow-md"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  )}
                >
                  📅 Groupe 2
                </button>
              </div>
            </div>

            {/* Weekly Grid */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-4 text-xs font-bold text-slate-600 uppercase text-center border-r border-slate-200 w-36">JOUR</th>
                    {timeSlotsList.map((slot, i) => (
                      <th key={i} className="p-4 text-xs font-bold text-[#0f2863] uppercase text-center border-r border-slate-200 min-w-[220px]">
                        {slot}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {daysList.map((day) => (
                    <tr key={day} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 text-xs font-extrabold text-[#0f2863] text-center bg-slate-50/50 border-r border-slate-200 uppercase">
                        {day}
                      </td>

                      {timeSlotsList.map((slotLabel, slotIdx) => {
                        const startTime = slotLabel.split(' - ')[0]
                        const item = currentGroupSchedule.find((s: any) => s.day === day && s.start_time === startTime)

                        return (
                          <td key={slotIdx} className="p-3 border-r border-slate-100 align-top">
                            {item ? (
                              <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-all space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded">
                                    {item.code}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-400">{item.group}</span>
                                </div>

                                <h4 className="text-xs font-bold text-slate-900 leading-snug">{item.module}</h4>

                                <div className="space-y-1 pt-1 text-[11px] text-slate-500">
                                  <div className="flex items-center gap-1.5 font-medium">
                                    <User className="w-3.5 h-3.5 text-slate-400" />
                                    <span>{item.professor}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 font-bold text-[#0f2863]">
                                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                                    <span>{item.room}</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="h-24 bg-slate-50/30 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center text-[10px] text-slate-300 font-semibold">
                                Créneau Libre
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
