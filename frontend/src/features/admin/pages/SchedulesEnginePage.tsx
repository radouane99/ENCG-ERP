import { useState, useEffect } from 'react'
import { Plus, Search, CheckCircle2, Lock, ArrowLeftRight, Edit2, Trash2, Check, User, MapPin, Loader2, Calendar, X } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { toast } from 'sonner'
import { Modal } from '@shared/components/ui/Modal'

export default function SchedulesEnginePage() {
  const [isGenerated, setIsGenerated] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Filters state
  const [filieres, setFilieres] = useState<any[]>([])
  const [groupes, setGroupes] = useState<any[]>([])
  const [academicYears, setAcademicYears] = useState<any[]>([])
  
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedGroupe, setSelectedGroupe] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')
  
  const [timetableItems, setTimetableItems] = useState<any[]>([])
  
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

  useEffect(() => {
    if (selectedGroupe) {
      api.get('/modules').then(r => setModules(r.data.data || r.data)).catch(console.error)
    }
  }, [selectedGroupe])

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

  const handleGenerate = () => fetchTimetable()

  const openCreateModal = () => {
    setEditingId(null)
    setFormData({
      module_id: '',
      professor_id: '',
      room_id: '',
      day_of_week: '1',
      start_time: '08:30',
      end_time: '10:15',
      session_type: 'CM'
    })
    setIsModalOpen(true)
  }

  const openEditModal = (item: any) => {
    // extract ID from full id string like session-1@encg-erp.com
    const idMatch = String(item.id).match(/session-(\d+)/)
    const dbId = idMatch ? parseInt(idMatch[1]) : item.id
    setEditingId(dbId)
    
    // Convert ISO start to day and time
    const startObj = new Date(item.start)
    const endObj = new Date(item.end)
    const dayOfWeek = startObj.getDay() || 7 // 1=Mon...7=Sun
    
    const formatTime = (d: Date) => d.toISOString().substring(11, 16)
    
    setFormData({
      module_id: item.extendedProps?.module_id || '', 
      professor_id: item.extendedProps?.professor_id || '',
      room_id: item.extendedProps?.room_id || '',
      day_of_week: dayOfWeek.toString(),
      start_time: formatTime(startObj),
      end_time: formatTime(endObj),
      session_type: item.extendedProps?.type || 'CM'
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (item: any) => {
    const idMatch = String(item.id).match(/session-(\d+)/)
    const dbId = idMatch ? parseInt(idMatch[1]) : item.id

    if (confirm('Voulez-vous vraiment supprimer cette affectation ?')) {
      try {
        await api.delete(`/timetable/${dbId}`)
        toast.success('Affectation supprimée')
        fetchTimetable()
      } catch (e) {
        toast.error('Erreur lors de la suppression')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedYear || !selectedSemester || !selectedGroupe) {
      toast.error('Veuillez sélectionner l\\'année, semestre et groupe d\\'abord')
      return
    }

    const payload = {
      ...formData,
      academic_year_id: selectedYear,
      semester_id: selectedSemester,
      group_id: selectedGroupe,
      institution_id: 1 // Default
    }

    try {
      if (editingId) {
        await api.put(`/timetable/${editingId}`, payload)
        toast.success('Affectation mise à jour')
      } else {
        await api.post('/timetable', payload)
        toast.success('Affectation créée')
      }
      setIsModalOpen(false)
      fetchTimetable()
    } catch (err) {
      console.error(err)
      toast.error('Erreur de sauvegarde')
    }
  }

  const daysMapping = ['LUNDI', 'MARDI', 'MERCREDI', 'JEUDI', 'VENDREDI', 'SAMEDI']
  const timeSlots = ['08:30', '10:30', '14:30', '16:30']

  const renderCell = (dayStr: string, timeSlotStr: string) => {
    // Map dayStr to day index (1-6)
    const dayIndex = daysMapping.indexOf(dayStr) + 1
    
    // Find matching items
    const cellItems = timetableItems.filter(item => {
      const d = new Date(item.start)
      const itemDay = d.getDay()
      const itemTime = d.toISOString().substring(11, 16)
      return itemDay === dayIndex && itemTime.startsWith(timeSlotStr.substring(0, 2))
    })

    if (cellItems.length === 0) {
      return <td key={`${dayStr}-${timeSlotStr}`} className="p-4 border-b border-slate-100 border-r align-top min-h-[140px]"></td>
    }

    return (
      <td key={`${dayStr}-${timeSlotStr}`} className="p-4 border-b border-slate-100 border-r align-top">
        <div className="space-y-2">
          {cellItems.map((item, idx) => (
            <div key={idx} className="relative group rounded-2xl border p-4 transition-all duration-300 hover:shadow-lg bg-white border-blue-100 shadow-blue-100/50 hover:-translate-y-1">
              <div className="flex justify-between items-start mb-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-50 text-blue-600">
                   {item.extendedProps?.type || 'CM'}
                </div>
              </div>
              <h4 className="text-sm font-black text-[#0f2863] leading-snug mb-3 line-clamp-2">
                {item.title}
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <User className="w-3.5 h-3.5" /> {item.extendedProps?.professor || 'Inconnu'}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <MapPin className="w-3.5 h-3.5" /> {item.extendedProps?.room || 'Non assigné'}
                </div>
              </div>
              
              <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button onClick={() => openEditModal(item)} className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center hover:bg-amber-200 transition-colors" title="Éditer">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(item)} className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors" title="Supprimer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
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
          <button onClick={openCreateModal} className="flex items-center gap-2 px-5 py-2.5 bg-[#0f2863] text-white font-bold rounded-full hover:bg-[#1a387e] transition-colors text-xs uppercase tracking-wide shadow-sm">
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
            <h2 className="text-xl font-bold text-[#0f2863] italic">Grille Hebdomadaire</h2>
            <div className="flex items-center gap-3">
              <span className="px-4 py-1.5 border border-emerald-200 text-emerald-600 bg-emerald-50/30 font-bold rounded-lg text-xs uppercase tracking-wide">
                Publié
              </span>
            </div>
          </div>
          
          <div className="overflow-x-auto p-4 md:p-8 pt-0">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center border-b border-slate-100 w-32">Jour</th>
                  {timeSlots.map(t => (
                     <th key={t} className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center border-b border-slate-100 min-w-[200px]">{t}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {daysMapping.map(day => (
                  <tr key={day}>
                    <td className="p-4 text-xs font-bold text-[#0f2863] uppercase tracking-wider text-center border-b border-slate-100 border-r align-middle bg-slate-50/30">
                      {day}
                    </td>
                    {timeSlots.map(time => renderCell(day, time))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Modifier l'affectation" : "Nouvelle Affectation"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Module</label>
            <select required value={formData.module_id} onChange={e => setFormData({...formData, module_id: e.target.value})} className="w-full border p-2 rounded">
              <option value="">Sélectionner un module</option>
              {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Professeur</label>
            <select required value={formData.professor_id} onChange={e => setFormData({...formData, professor_id: e.target.value})} className="w-full border p-2 rounded">
              <option value="">Sélectionner un professeur</option>
              {professors.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Salle (optionnel)</label>
            <select value={formData.room_id} onChange={e => setFormData({...formData, room_id: e.target.value})} className="w-full border p-2 rounded">
              <option value="">Aucune</option>
              {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jour</label>
              <select value={formData.day_of_week} onChange={e => setFormData({...formData, day_of_week: e.target.value})} className="w-full border p-2 rounded">
                <option value="1">Lundi</option>
                <option value="2">Mardi</option>
                <option value="3">Mercredi</option>
                <option value="4">Jeudi</option>
                <option value="5">Vendredi</option>
                <option value="6">Samedi</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Type</label>
              <select value={formData.session_type} onChange={e => setFormData({...formData, session_type: e.target.value})} className="w-full border p-2 rounded">
                <option value="CM">CM (Cours Magistral)</option>
                <option value="TD">TD (Travaux Dirigés)</option>
                <option value="TP">TP (Travaux Pratiques)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Heure Début</label>
              <input type="time" required value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Heure Fin</label>
              <input type="time" required value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} className="w-full border p-2 rounded" />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-md text-sm font-bold">Annuler</button>
            <button type="submit" className="px-4 py-2 bg-[#0f2863] text-white rounded-md text-sm font-bold">Enregistrer</button>
          </div>

        </form>
      </Modal>

    </div>
  )
}
