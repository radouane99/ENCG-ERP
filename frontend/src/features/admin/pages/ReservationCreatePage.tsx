import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Sparkles, Calendar as CalendarIcon, Loader2 } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { toast } from 'sonner'

export default function ReservationCreatePage() {
  const navigate = useNavigate()
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [startTime, setStartTime] = useState('08:30')
  const [endTime, setEndTime] = useState('10:30')
  const [roomId, setRoomId] = useState('')
  const [professorId, setProfessorId] = useState('')
  const [purpose, setPurpose] = useState('')
  const [status, setStatus] = useState('pending')
  
  const [rooms, setRooms] = useState<any[]>([])
  const [professors, setProfessors] = useState<any[]>([])
  
  const [hasConflict, setHasConflict] = useState(false)
  const [checkingConflict, setCheckingConflict] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomsRes, profsRes] = await Promise.all([
          api.get('/rooms'),
          api.get('/professors')
        ])
        setRooms(roomsRes.data.data || roomsRes.data)
        setProfessors(profsRes.data.data || profsRes.data)
        
        if ((roomsRes.data.data || roomsRes.data).length > 0) {
          setRoomId((roomsRes.data.data || roomsRes.data)[0].id.toString())
        }
        if ((profsRes.data.data || profsRes.data).length > 0) {
          // Professor user_id is needed for booked_by
          setProfessorId((profsRes.data.data || profsRes.data)[0].user_id.toString())
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
        toast.error('Erreur lors du chargement des données')
      }
    }
    fetchData()
  }, [])

  // Intelligent system logic: Check availability
  useEffect(() => {
    const checkAvailability = async () => {
      if (!roomId || !date || !startTime || !endTime) return
      
      try {
        setCheckingConflict(true)
        const res = await api.get('/room-bookings/check-availability', {
          params: {
            room_id: roomId,
            date: date,
            start_time: startTime,
            end_time: endTime
          }
        })
        
        setHasConflict(!res.data.data.is_available)
      } catch (error) {
        console.error('Failed to check availability:', error)
      } finally {
        setCheckingConflict(false)
      }
    }
    
    // Add a small delay to avoid too many requests
    const timeoutId = setTimeout(() => {
      checkAvailability()
    }, 500)
    
    return () => clearTimeout(timeoutId)
  }, [date, startTime, endTime, roomId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (hasConflict) {
      toast.error('Veuillez résoudre le conflit d\'horaire avant de réserver.')
      return
    }
    
    if (!roomId || !professorId || !purpose || !date || !startTime || !endTime) {
      toast.error('Veuillez remplir tous les champs obligatoires.')
      return
    }

    try {
      setIsSubmitting(true)
      
      const selectedRoom = rooms.find(r => r.id.toString() === roomId)
      
      await api.post('/room-bookings', {
        room_id: roomId,
        room_name: selectedRoom?.name || 'Salle Inconnue',
        booked_by: professorId, // Using the professor's user ID
        purpose: purpose,
        start_time: `${date} ${startTime}:00`,
        end_time: `${date} ${endTime}:00`,
        status: status
      })
      
      toast.success('Réservation créée avec succès')
      navigate('/admin/reservations')
      
    } catch (error: any) {
      console.error('Failed to create reservation:', error)
      toast.error(error.response?.data?.message || 'Erreur lors de la création')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 animate-in p-6 max-w-[1000px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2863] italic">Créer une Réservation de Salle</h1>
        </div>
        <Link to="/admin/reservations" className="px-5 py-2.5 bg-white border border-slate-200 text-[#0f2863] font-bold rounded-full hover:bg-slate-50 transition-colors text-xs uppercase tracking-wide shadow-sm">
          Retour à la liste
        </Link>
      </div>

      <div className="bg-white border border-slate-100 rounded-[2rem] shadow-sm overflow-hidden flex flex-col items-center">
        {/* Blue Banner */}
        <div className="bg-[#0f2863] p-8 text-white m-4 rounded-[1.5rem] shadow-md relative overflow-hidden w-[calc(100%-2rem)] text-center">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl"></div>
          <h2 className="text-2xl font-bold italic mb-2 relative z-10">Réservation Administrative</h2>
          <p className="text-blue-200 text-xs font-medium relative z-10 mx-auto">
            Planifiez une séance exceptionnelle pour un professeur dans l'une des salles disponibles de l'UPF.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 w-full max-w-3xl space-y-8">
          <h3 className="text-lg font-bold text-[#0f2863] italic mb-6">Détails de la Réservation</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Professeur Bénéficiaire</label>
              <select 
                value={professorId}
                onChange={(e) => setProfessorId(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
              >
                {professors.map(prof => (
                  <option key={prof.id} value={prof.user_id}>
                    {prof.user?.first_name} {prof.user?.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Salle Allouée</label>
              <select 
                className="w-full rounded-2xl border border-blue-500 bg-white px-5 py-3.5 text-sm font-bold text-[#0f2863] shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                required
              >
                {rooms.map(room => (
                  <option key={room.id} value={room.id}>
                    {room.name} {room.capacity ? `(Capacité: ${room.capacity} places)` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Date de la Séance</label>
              <input 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Statut de la Réservation</label>
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
              >
                <option value="approved">Approuvé</option>
                <option value="pending">En attente</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Heure Début</label>
              <input 
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Heure Fin</label>
              <input 
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-3.5 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Motif Académique / Pédagogique</label>
            <textarea 
              rows={3}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              required
              placeholder="ex : Soutenance de Master, Séance exceptionnelle de rattrapage..."
              className={cn(
                "w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none resize-none",
                hasConflict && "border-red-300 bg-red-50/30"
              )}
            ></textarea>
          </div>

          {hasConflict && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
              Cette salle est déjà réservée ou a cours sur ce créneau horaire.
            </div>
          )}

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isSubmitting || hasConflict || checkingConflict}
              className="w-full py-4 bg-[#0f2863] text-white font-bold rounded-xl hover:bg-[#1a387e] transition-colors text-sm tracking-wide shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CalendarIcon className="w-4 h-4" />
              )}
              {isSubmitting ? 'Création en cours...' : 'Créer la Réservation'}
            </button>
          </div>
        </form>

        <div className="w-full p-8 pt-0 max-w-3xl">
          <h4 className="text-sm font-bold text-[#0f2863] flex items-center gap-2 mb-4">
            <CalendarIcon className="w-4 h-4" /> Planning de la salle le {new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </h4>
          
          {checkingConflict ? (
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center">
              <Loader2 className="w-6 h-6 text-slate-400 mx-auto mb-2 animate-spin" />
              <h5 className="font-bold text-slate-600 mb-1">Vérification de la disponibilité...</h5>
            </div>
          ) : hasConflict ? (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                <div className="w-4 h-4 rounded-full bg-red-500" />
              </div>
              <h5 className="font-bold text-red-800 mb-1">La salle n'est pas disponible !</h5>
              <p className="text-red-600/80 text-xs font-medium">Un conflit a été détecté avec l'emploi du temps ou une autre réservation.</p>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center">
              <Sparkles className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
              <h5 className="font-bold text-emerald-800 mb-1">La salle est totalement libre ce jour-là !</h5>
              <p className="text-emerald-600/80 text-xs font-medium">Aucun cours ni réservation ne sont programmés.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
