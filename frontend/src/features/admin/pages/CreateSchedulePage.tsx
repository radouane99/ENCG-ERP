import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@shared/lib/api'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function CreateSchedulePage() {
  const navigate = useNavigate()
  
  // Form State
  const [groupId, setGroupId] = useState('')
  const [moduleId, setModuleId] = useState('')
  const [professorId, setProfessorId] = useState('')
  const [roomId, setRoomId] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  // Queries for Dropdowns
  const { data: groups } = useQuery({
    queryKey: ['groups'],
    queryFn: () => api.get('/groups').then(res => res.data.data || res.data)
  })

  const { data: modules } = useQuery({
    queryKey: ['modules'],
    queryFn: () => api.get('/modules').then(res => res.data.data || res.data)
  })

  const { data: professors } = useQuery({
    queryKey: ['professors'],
    queryFn: () => api.get('/professors').then(res => res.data.data || res.data)
  })

  const { data: rooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => api.get('/rooms').then(res => res.data.data || res.data)
  })

  // Mutation to Save
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      // POST to the timetable store endpoint
      return api.post('/timetable', payload)
    },
    onSuccess: () => {
      toast.success('Séance enregistrée avec succès')
      navigate('/admin/timetable/calendar')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création de la séance')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!groupId || !moduleId || !professorId || !roomId || !date || !startTime || !endTime) {
      toast.warning('Veuillez remplir tous les champs')
      return
    }

    createMutation.mutate({
      group_id: groupId,
      module_id: moduleId,
      professor_id: professorId,
      room_id: roomId,
      date: date,
      start_time: startTime,
      end_time: endTime
    })
  }

  return (
    <div className="space-y-8 animate-in p-6 max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2863] italic">Planifier une Nouvelle Séance</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Vérification des conflits en temps réel</p>
        </div>
        <Link to="/admin/timetable/calendar" className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors text-xs uppercase tracking-wide">
          Retour
        </Link>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden flex flex-col">
        {/* Dark Blue Banner */}
        <div className="bg-[#0f2863] p-10 text-white m-4 rounded-[1.5rem] shadow-md relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl"></div>
          <h2 className="text-3xl font-bold italic mb-2 relative z-10">Nouvelle Affectation</h2>
          <p className="text-blue-200 text-sm font-medium max-w-lg relative z-10">
            Définissez le groupe, le module, le professeur et le créneau. Les conflits sont détectés automatiquement.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <h3 className="text-xl font-bold text-[#0f2863] italic mb-6">Détails de la Séance</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Groupe / Promotion</label>
              <select 
                value={groupId} onChange={e => setGroupId(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
              >
                <option value="">— Sélectionner —</option>
                {groups?.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Module Enseigné</label>
              <select 
                value={moduleId} onChange={e => setModuleId(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
              >
                <option value="">— Sélectionner —</option>
                {modules?.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Professeur En Charge</label>
              <select 
                value={professorId} onChange={e => setProfessorId(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
              >
                <option value="">— Sélectionner —</option>
                {professors?.map((p: any) => <option key={p.id} value={p.id}>{p.user?.first_name} {p.user?.last_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Salle Allouée</label>
              <select 
                value={roomId} onChange={e => setRoomId(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
              >
                <option value="">— Sélectionner —</option>
                {rooms?.map((r: any) => <option key={r.id} value={r.id}>{r.name} ({r.capacity} places)</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Date de la Séance</label>
              <input 
                type="date"
                value={date} onChange={e => setDate(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Horaires</label>
              <div className="flex items-center gap-4">
                <input 
                  type="time"
                  value={startTime} onChange={e => setStartTime(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                />
                <span className="text-slate-400 font-bold">-</span>
                <input 
                  type="time"
                  value={endTime} onChange={e => setEndTime(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit" 
              disabled={createMutation.isPending}
              className="w-full flex justify-center items-center gap-2 py-4 bg-[#0f2863] text-white font-bold rounded-2xl hover:bg-[#1a387e] transition-colors text-sm tracking-wide shadow-md disabled:opacity-70"
            >
              {createMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : '✓'}
              Enregistrer la Séance
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

