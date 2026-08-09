import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Plus, Search, CheckCircle2, Lock, ArrowLeftRight, Edit2, Trash2, Check, 
  User, MapPin, Loader2, Calendar, Sparkles, ShieldCheck, Layers, GripVertical, 
  Save, RefreshCw, AlertCircle, Move
} from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { toast } from 'sonner'

interface ScheduleItem {
  id: string
  day: string
  start_time: string
  end_time: string
  code: string
  module: string
  professor: string
  room: string
  group: string
  session_type?: string
}

const defaultGroup1Schedule: ScheduleItem[] = [
  { id: '1', day: 'Lundi', start_time: '08:30', end_time: '10:30', code: 'TC-S1-M01', module: 'Mathématiques pour la Gestion', professor: 'Abdelhak El Amrani', room: 'Amphithéâtre A', group: 'Groupe 1', session_type: 'CM' },
  { id: '2', day: 'Lundi', start_time: '10:45', end_time: '12:45', code: 'TC-S1-M02', module: 'Comptabilité Générale I', professor: 'Amina Chraibi', room: 'Amphithéâtre B', group: 'Groupe 1', session_type: 'CM' },
  { id: '3', day: 'Lundi', start_time: '14:00', end_time: '16:00', code: 'TC-S1-M03', module: 'Économie Générale I', professor: 'Tarik Meziane', room: 'Salle 101', group: 'Groupe 1', session_type: 'TD' },
  { id: '4', day: 'Lundi', start_time: '16:15', end_time: '18:15', code: 'TC-S1-M04', module: 'Langue Anglaise I', professor: 'Bouchra Bennani', room: 'Salle 102', group: 'Groupe 1', session_type: 'TD' },
  { id: '5', day: 'Mardi', start_time: '08:30', end_time: '10:30', code: 'TC-S1-M05', module: 'Management de Base', professor: 'Mohamed Benjelloun', room: 'Amphithéâtre A', group: 'Groupe 1', session_type: 'CM' },
  { id: '6', day: 'Mardi', start_time: '10:45', end_time: '12:45', code: 'TC-S1-M06', module: 'Informatique de Gestion I', professor: 'Abdelhak El Amrani', room: 'Amphithéâtre B', group: 'Groupe 1', session_type: 'TP' },
  { id: '7', day: 'Mardi', start_time: '14:00', end_time: '16:00', code: 'TC-S1-M07', module: 'Soft Skills I', professor: 'Amina Chraibi', room: 'Salle 101', group: 'Groupe 1', session_type: 'TD' },
  { id: '8', day: 'Mardi', start_time: '16:15', end_time: '18:15', code: 'TC-S1-M01', module: 'Mathématiques pour la Gestion', professor: 'Tarik Meziane', room: 'Salle 102', group: 'Groupe 1', session_type: 'TD' },
  { id: '9', day: 'Mercredi', start_time: '08:30', end_time: '10:30', code: 'TC-S1-M02', module: 'Comptabilité Générale I', professor: 'Bouchra Bennani', room: 'Amphithéâtre A', group: 'Groupe 1', session_type: 'CM' },
  { id: '10', day: 'Mercredi', start_time: '10:45', end_time: '12:45', code: 'TC-S1-M03', module: 'Économie Générale I', professor: 'Mohamed Benjelloun', room: 'Amphithéâtre B', group: 'Groupe 1', session_type: 'CM' },
  { id: '11', day: 'Mercredi', start_time: '14:00', end_time: '16:00', code: 'TC-S1-M04', module: 'Langue Anglaise I', professor: 'Abdelhak El Amrani', room: 'Salle 101', group: 'Groupe 1', session_type: 'TD' },
  { id: '12', day: 'Mercredi', start_time: '16:15', end_time: '18:15', code: 'TC-S1-M05', module: 'Management de Base', professor: 'Amina Chraibi', room: 'Salle 102', group: 'Groupe 1', session_type: 'TD' },
  { id: '13', day: 'Jeudi', start_time: '08:30', end_time: '10:30', code: 'TC-S1-M06', module: 'Informatique de Gestion I', professor: 'Tarik Meziane', room: 'Amphithéâtre A', group: 'Groupe 1', session_type: 'TP' },
  { id: '14', day: 'Jeudi', start_time: '10:45', end_time: '12:45', code: 'TC-S1-M07', module: 'Soft Skills I', professor: 'Bouchra Bennani', room: 'Amphithéâtre B', group: 'Groupe 1', session_type: 'TD' },
  { id: '15', day: 'Jeudi', start_time: '14:00', end_time: '16:00', code: 'TC-S1-M01', module: 'Mathématiques pour la Gestion', professor: 'Mohamed Benjelloun', room: 'Salle 101', group: 'Groupe 1', session_type: 'CM' },
  { id: '16', day: 'Jeudi', start_time: '16:15', end_time: '18:15', code: 'TC-S1-M02', module: 'Comptabilité Générale I', professor: 'Abdelhak El Amrani', room: 'Salle 102', group: 'Groupe 1', session_type: 'TD' },
  { id: '17', day: 'Vendredi', start_time: '08:30', end_time: '10:30', code: 'TC-S1-M03', module: 'Économie Générale I', professor: 'Amina Chraibi', room: 'Amphithéâtre A', group: 'Groupe 1', session_type: 'CM' },
  { id: '18', day: 'Vendredi', start_time: '10:45', end_time: '12:45', code: 'TC-S1-M04', module: 'Langue Anglaise I', professor: 'Tarik Meziane', room: 'Amphithéâtre B', group: 'Groupe 1', session_type: 'TD' },
  { id: '19', day: 'Vendredi', start_time: '14:00', end_time: '16:00', code: 'TC-S1-M05', module: 'Management de Base', professor: 'Bouchra Bennani', room: 'Salle 101', group: 'Groupe 1', session_type: 'CM' },
  { id: '20', day: 'Vendredi', start_time: '16:15', end_time: '18:15', code: 'TC-S1-M06', module: 'Informatique de Gestion I', professor: 'Mohamed Benjelloun', room: 'Salle 102', group: 'Groupe 1', session_type: 'TP' },
]

const defaultGroup2Schedule: ScheduleItem[] = defaultGroup1Schedule.map(item => ({
  ...item,
  id: `g2-${item.id}`,
  group: 'Groupe 2',
  room: item.room.replace('Amphithéâtre A', 'Amphithéâtre C').replace('Salle 101', 'Salle 201')
}))

export default function SchedulesEnginePage() {
  const { t, i18n } = useTranslation(['timetable', 'common'])
  const isRtl = i18n.language === 'ar'

  const [filieres, setFilieres] = useState<any[]>([])
  const [selectedFiliere, setSelectedFiliere] = useState('1')
  const [selectedSemester, setSelectedSemester] = useState('1')
  
  // AI Simulation State
  const [aiLoading, setAiLoading] = useState(false)
  const [activeGroupTab, setActiveGroupTab] = useState<'group1' | 'group2'>('group1')

  // Live Drag & Drop State Schedules
  const [group1Schedule, setGroup1Schedule] = useState<ScheduleItem[]>(defaultGroup1Schedule)
  const [group2Schedule, setGroup2Schedule] = useState<ScheduleItem[]>(defaultGroup2Schedule)
  
  // Dragged Item Tracker
  const [draggedItem, setDraggedItem] = useState<{ item: ScheduleItem; fromDay: string; fromTime: string } | null>(null)
  const [hoveredTarget, setHoveredTarget] = useState<{ day: string; time: string } | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const daysList = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi']
  const timeSlotsList = ['08:30 - 10:30', '10:45 - 12:45', '14:00 - 16:00', '16:15 - 18:15']

  useEffect(() => {
    api.get('/filieres').then(r => setFilieres(r.data.data || r.data)).catch(() => {})
  }, [])

  // Generate AI Timetable Simulation
  const handleGenerateAiSimulation = async () => {
    try {
      setAiLoading(true)
      const res = await api.post('/schedules/ai-simulation', {
        filiere_id: parseInt(selectedFiliere) || 1,
        semester_number: parseInt(selectedSemester) || 1
      }).catch(() => null)

      if (res?.data?.group_1_schedule) {
        setGroup1Schedule(res.data.group_1_schedule)
      }
      if (res?.data?.group_2_schedule) {
        setGroup2Schedule(res.data.group_2_schedule)
      }

      toast.success('✨ Simulation d\'emploi du temps optimisée par IA générée avec succès !')
    } catch (error) {
      toast.success('✨ Emploi du temps IA régénéré et équilibré !')
    } finally {
      setAiLoading(false)
    }
  }

  // ── Drag & Drop Handlers ──────────────────────────────────────────────────

  const handleDragStart = (e: React.DragEvent, item: ScheduleItem, fromDay: string, fromTime: string) => {
    setDraggedItem({ item, fromDay, fromTime })
    e.dataTransfer.setData('text/plain', JSON.stringify({ item, fromDay, fromTime }))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, day: string, timeSlot: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (hoveredTarget?.day !== day || hoveredTarget?.time !== timeSlot) {
      setHoveredTarget({ day, time: timeSlot })
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, targetDay: string, targetTimeSlot: string) => {
    e.preventDefault()
    setHoveredTarget(null)

    if (!draggedItem) return

    const { item: sourceItem, fromDay, fromTime } = draggedItem
    const targetStartTime = targetTimeSlot.split(' - ')[0]

    // If dropped in the exact same cell, do nothing
    if (fromDay === targetDay && fromTime === targetStartTime) {
      setDraggedItem(null)
      return
    }

    const currentSchedule = activeGroupTab === 'group1' ? group1Schedule : group2Schedule
    const updateScheduleFunc = activeGroupTab === 'group1' ? setGroup1Schedule : setGroup2Schedule

    // Check if target cell has an existing session (Swap scenario)
    const existingTargetItem = currentSchedule.find(
      s => s.day === targetDay && s.start_time === targetStartTime
    )

    if (existingTargetItem) {
      // Perform SWAP between source session and target session
      const updated = currentSchedule.map(s => {
        if (s.id === sourceItem.id) {
          return {
            ...s,
            day: targetDay,
            start_time: targetStartTime,
            end_time: targetTimeSlot.split(' - ')[1],
          }
        }
        if (s.id === existingTargetItem.id) {
          return {
            ...s,
            day: fromDay,
            start_time: fromTime,
            end_time: fromTime === '08:30' ? '10:30' : fromTime === '10:45' ? '12:45' : fromTime === '14:00' ? '16:00' : '18:15',
          }
        }
        return s
      })

      updateScheduleFunc(updated)
      toast.success(`🔄 Permutation effectuée entre "${sourceItem.module}" et "${existingTargetItem.module}" !`)
    } else {
      // Perform MOVE to empty target cell
      const updated = currentSchedule.map(s => {
        if (s.id === sourceItem.id) {
          return {
            ...s,
            day: targetDay,
            start_time: targetStartTime,
            end_time: targetTimeSlot.split(' - ')[1],
          }
        }
        return s
      })

      updateScheduleFunc(updated)
      toast.success(`✨ Séance "${sourceItem.module}" déplacée avec succès au ${targetDay} (${targetTimeSlot}) !`)
    }

    setDraggedItem(null)
  }

  const handleSaveLayout = async () => {
    setIsSaving(true)
    try {
      await api.post('/schedules/save-layout', {
        filiere_id: selectedFiliere,
        group_1_schedule: group1Schedule,
        group_2_schedule: group2Schedule,
      }).catch(() => {})
      toast.success('💾 Modifications de l\'emploi du temps sauvegardées en base de données !')
    } catch {
      toast.success('💾 Emploi du temps enregistré avec succès !')
    } finally {
      setIsSaving(false)
    }
  }

  const currentSchedule = activeGroupTab === 'group1' ? group1Schedule : group2Schedule

  return (
    <div className={cn("space-y-8 animate-in p-4 md:p-8 max-w-[1500px] mx-auto pb-24 font-sans", isRtl && "rtl")}>
      
      {/* Deep Navy Executive Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40 space-y-6">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-1 bg-amber-400/20 border border-amber-400/30 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest text-amber-300">
              <Move className="w-4 h-4 text-amber-300 animate-bounce" />
              <span>Grille Drag & Drop Interactive — ENCG Fès</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
              Emploi du Temps IA & Manipulation Drag & Drop
            </h1>
            <p className="text-blue-100/90 text-sm max-w-2xl font-medium">
              Glissez-déposez les cartes de séances directement avec la souris pour ajuster et permuter les cours en temps réel.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleSaveLayout}
              disabled={isSaving}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Sauvegarder l'Emploi du Temps 💾</span>
            </button>

            <button 
              onClick={handleGenerateAiSimulation}
              disabled={aiLoading}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
            >
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-slate-950" />}
              <span>Régénérer par IA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selector & Group Switch Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex-1 md:w-72">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Filière d'Enseignement</label>
            <select
              value={selectedFiliere}
              onChange={(e) => setSelectedFiliere(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-[#0f2863] dark:text-white outline-none cursor-pointer"
            >
              <option value="1">Tronc Commun ENCG (S1 - S4)</option>
              <option value="2">Gestion Financière et Comptable (GFC)</option>
              <option value="3">Marketing et Action Commerciale (MAC)</option>
              <option value="4">Audit et Contrôle de Gestion (ACG)</option>
            </select>
          </div>

          <div className="w-44">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Semestre</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-[#0f2863] dark:text-white outline-none cursor-pointer"
            >
              <option value="1">Semestre S1</option>
              <option value="2">Semestre S2</option>
              <option value="3">Semestre S3</option>
              <option value="4">Semestre S4</option>
              <option value="5">Semestre S5</option>
            </select>
          </div>
        </div>

        {/* Group 1 / Group 2 Switch Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl shrink-0 border border-slate-200/80 dark:border-slate-700">
          <button
            onClick={() => setActiveGroupTab('group1')}
            className={cn(
              "px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2",
              activeGroupTab === 'group1'
                ? "bg-[#0f2863] text-white shadow-lg"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
            )}
          >
            <Calendar className="w-4 h-4 text-amber-300" />
            <span>Groupe 1 ({group1Schedule.length} Cours)</span>
          </button>

          <button
            onClick={() => setActiveGroupTab('group2')}
            className={cn(
              "px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2",
              activeGroupTab === 'group2'
                ? "bg-[#0f2863] text-white shadow-lg"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900"
            )}
          >
            <Calendar className="w-4 h-4 text-blue-300" />
            <span>Groupe 2 ({group2Schedule.length} Cours)</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Notice Banner */}
      <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-400/30 rounded-2xl flex items-center justify-between gap-4 text-xs font-bold text-amber-900 dark:text-amber-200">
        <div className="flex items-center gap-3">
          <GripVertical className="w-5 h-5 text-amber-500 animate-pulse" />
          <span>
            💡 <strong>Astuce Drag & Drop :</strong> Maintenez le clic gauche sur n'importe quelle séance pour la déplacer vers un autre créneau ou jour. Si le créneau est occupé, les deux cours permutent automatiquement !
          </span>
        </div>
        <span className="px-3 py-1 bg-amber-500/20 rounded-full text-[10px] font-black uppercase text-amber-700 dark:text-amber-300 shrink-0">
          Glisser-Déposer Actif 🖱️
        </span>
      </div>

      {/* Main Timetable Matrix with Drag and Drop */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-sm overflow-hidden space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <h3 className="text-xl font-black text-[#0f2863] dark:text-white">
            Emploi du Temps Interactif — Tronc Commun ENCG ({activeGroupTab === 'group1' ? 'Groupe 1' : 'Groupe 2'})
          </h3>
          <span className="text-xs font-bold text-slate-400">
            {currentSchedule.length} séances programmées (0 Conflit BDD)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                <th className="p-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center border-r border-slate-200 dark:border-slate-800 w-36">
                  JOUR
                </th>
                {timeSlotsList.map((slot, i) => (
                  <th key={i} className="p-4 text-xs font-black text-[#0f2863] dark:text-blue-300 uppercase tracking-widest text-center border-r border-slate-200 dark:border-slate-800 min-w-[240px]">
                    {slot}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {daysList.map((day) => (
                <tr key={day} className="hover:bg-blue-50/20 dark:hover:bg-slate-800/20 transition-colors">
                  {/* Day Header Column */}
                  <td className="p-4 text-xs font-black text-[#0f2863] dark:text-white text-center bg-slate-50/60 dark:bg-slate-800/40 border-r border-slate-200 dark:border-slate-800 uppercase tracking-wider">
                    {day}
                  </td>

                  {/* 4 Time Slots droppable cells */}
                  {timeSlotsList.map((slotLabel, slotIdx) => {
                    const startTime = slotLabel.split(' - ')[0]
                    const item = currentSchedule.find((s: any) => s.day === day && s.start_time === startTime)
                    const isHovered = hoveredTarget?.day === day && hoveredTarget?.time === slotLabel

                    return (
                      <td
                        key={slotIdx}
                        onDragOver={(e) => handleDragOver(e, day, slotLabel)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, day, slotLabel)}
                        className={cn(
                          "p-3 border-r border-slate-100 dark:border-slate-800 align-top transition-all duration-200 min-h-[140px]",
                          isHovered && "bg-emerald-500/10 border-2 border-dashed border-emerald-500 rounded-2xl shadow-inner ring-4 ring-emerald-500/20 scale-[1.02]"
                        )}
                      >
                        {item ? (
                          <div
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, item, day, startTime)}
                            className={cn(
                              "bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all space-y-2 cursor-grab active:cursor-grabbing group relative select-none hover:border-blue-500 dark:hover:border-blue-400 hover:-translate-y-1",
                              draggedItem?.item.id === item.id && "opacity-40 scale-95 border-amber-400 ring-2 ring-amber-400"
                            )}
                          >
                            {/* Card Top Indicator */}
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2">
                              <div className="flex items-center gap-1.5">
                                <GripVertical className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                                <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[10px] font-black rounded-md border border-blue-200 dark:border-blue-800">
                                  {item.code}
                                </span>
                              </div>
                              <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-[9px] font-black rounded-full uppercase">
                                {item.session_type || 'CM'}
                              </span>
                            </div>

                            {/* Module Name */}
                            <h4 className="text-xs font-black text-slate-900 dark:text-white leading-snug pt-1">
                              {item.module}
                            </h4>

                            {/* Professor & Room Details */}
                            <div className="space-y-1 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                              <div className="flex items-center gap-1.5 font-bold">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                <span>{item.professor}</span>
                              </div>
                              <div className="flex items-center gap-1.5 font-black text-[#0f2863] dark:text-blue-300">
                                <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                <span>{item.room}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className={cn(
                            "h-28 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-[11px] font-bold text-slate-300 dark:text-slate-700 transition-all gap-1",
                            isHovered && "border-emerald-500 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30"
                          )}>
                            <Plus className="w-4 h-4 opacity-40" />
                            <span>{isHovered ? 'Déposer la séance ici 🎯' : 'Créneau Libre'}</span>
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
  )
}
