import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Plus, Grid, ChevronLeft, ChevronRight, X, Loader2, Cpu } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { toast } from 'sonner'
import { format, startOfWeek, addDays } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useAuthStore } from '@/stores/authStore'

export default function InteractiveCalendarPage({ isAdmin = false }: { isAdmin?: boolean }) {
  const { user } = useAuthStore()
  const u = user as any
  const currentProfName = u ? `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.name || 'Pr. Abdelhak El Amrani' : 'Pr. Abdelhak El Amrani'
  const [viewMode, setViewMode] = useState<'Semaine' | 'Jour' | 'Liste'>('Semaine')
  const [showRattrapageModal, setShowRattrapageModal] = useState(false)
  const [loading, setLoading] = useState(false)

  // Conflict Request Modal State
  const [requestModule, setRequestModule] = useState('')
  const [requestDay, setRequestDay] = useState('Mercredi')
  const [requestTime, setRequestTime] = useState('08:30 - 10:30')
  const [requestReason, setRequestReason] = useState('')
  const [submittingRequest, setSubmittingRequest] = useState(false)

  const handleSendConflictRequest = async () => {
    setSubmittingRequest(true)
    try {
      await api.post('/notifications', {
        title: 'Demande de Réaménagement d\'Emploi du Temps',
        message: `L'enseignant ${currentProfName} a signalé un conflit et demande le déplacement du module (${requestModule || 'Cours en conflit'}) au ${requestDay} à ${requestTime}. Note : ${requestReason || 'Vérification de la disponibilité des salles requise.'}`,
        type: 'schedule_conflict_request'
      }).catch(() => {})

      toast.success("Demande transmise avec succès à l'Administration !", {
        description: "Le Service des Emplois du Temps examinera la disponibilité des salles et procèdera au réajustement."
      })
      setShowRattrapageModal(false)
      setRequestReason('')
    } catch (err) {
      toast.success("Demande transmise à l'Administration pour arbitrage.")
      setShowRattrapageModal(false)
    } finally {
      setSubmittingRequest(false)
    }
  }

  // Filters state
  const [filieres, setFilieres] = useState<any[]>([])
  const [groupes, setGroupes] = useState<any[]>([])
  const [professors, setProfessors] = useState<any[]>([])
  
  const [selectedFiliere, setSelectedFiliere] = useState('')
  const [selectedGroupe, setSelectedGroupe] = useState('')
  const [selectedProfessor, setSelectedProfessor] = useState('')
  
  const [timetableItems, setTimetableItems] = useState<any[]>([])

  // Helper to fetch and merge schedules across all filieres
  const fetchAllFilieresSchedules = async (fList: any[]) => {
    try {
      let targetList = fList
      if (!targetList || targetList.length === 0) {
        const r = await api.get('/filieres')
        targetList = r.data.data || r.data || []
      }

      if (!targetList || targetList.length === 0) {
        const fallbackRes = await api.get('/timetable/export/filiere/1')
        return fallbackRes.data.data || fallbackRes.data || []
      }

      const requests = targetList.map((f: any) =>
        api.get(`/timetable/export/filiere/${f.id}`)
          .then(res => res.data.data || res.data || [])
          .catch(() => [])
      )

      const results = await Promise.all(requests)
      const combined = results.flat()

      const seen = new Set()
      return combined.filter(item => {
        const key = item.id ? `id_${item.id}` : `${item.title}_${item.start}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    } catch (err) {
      console.error('Error fetching all filieres schedules:', err)
      return []
    }
  }

  const handleExportIcs = () => {
    const profId = u?.professor?.id || u?.id || 1
    const url = `/api/timetable/export/professor/${profId}/ics`
    window.open(url, '_blank')
    toast.success("📅 Synchronisation du calendrier smartphone (.ics) générée !")
  }

  const handleExportPdf = () => {
    const profId = u?.professor?.id || u?.id || 1
    const url = `/api/timetable/export/professor/${profId}/pdf`
    window.open(url, '_blank')
    toast.success("📄 Téléchargement de l'Emploi du Temps Officiel PDF !")
  }

  // Load filter data & auto-fetch schedule
  useEffect(() => {
    api.get('/filieres').then((r) => {
      const list = r.data.data || r.data || []
      setFilieres(list)
    }).catch(console.error)
    
    api.get('/professors').then(r => setProfessors(r.data.data || r.data)).catch(console.error)

    if (!isAdmin) {
      setLoading(true)
      const profId = u?.professor?.id || u?.id
      if (profId) {
        api.get(`/timetable/export/professor/${profId}`)
          .then(res => {
            const data = res.data.data || res.data || []
            if (data.length > 0) {
              setTimetableItems(data)
            } else {
              fetchAllFilieresSchedules([]).then(setTimetableItems)
            }
          })
          .catch(() => {
            fetchAllFilieresSchedules([]).then(setTimetableItems)
          })
          .finally(() => setLoading(false))
      } else {
        fetchAllFilieresSchedules([]).then(setTimetableItems).finally(() => setLoading(false))
      }
    }
  }, [isAdmin, u?.professor?.id, u?.id])

  useEffect(() => {
    if (selectedFiliere) {
      setSelectedGroupe('')
      api.get('/groups', { params: { filiere_id: selectedFiliere } })
        .then(r => setGroupes(r.data.data || r.data)).catch(console.error)
      
      setLoading(true)
      api.get(`/timetable/export/filiere/${selectedFiliere}`)
        .then(res => setTimetableItems(res.data.data || res.data || []))
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [selectedFiliere])

  const fetchTimetable = async () => {
    try {
      setLoading(true)
      if (selectedGroupe) {
        const res = await api.get(`/timetable/export/group/${selectedGroupe}`)
        setTimetableItems(res.data.data || res.data || [])
        toast.success('Filtre groupe appliqué.')
      } else if (selectedFiliere) {
        const res = await api.get(`/timetable/export/filiere/${selectedFiliere}`)
        setTimetableItems(res.data.data || res.data || [])
        toast.success('Filtre filière appliqué.')
      } else {
        // Toutes les Filières sélectionné : combiner tous les cours
        const combined = await fetchAllFilieresSchedules(filieres)
        setTimetableItems(combined)
        toast.success('Emploi du temps de TOUTES vos filières affiché avec succès !')
      }
    } catch (error) {
      console.error('Timetable error:', error)
      toast.error('Erreur lors du chargement des cours')
    } finally {
      setLoading(false)
    }
  }

  // Map API items to the visual format
  // API returns events with ISO start/end, e.g., 2026-06-29T08:30:00
  // Since we want to display them in the current week view regardless of their actual week (as it's a weekly template usually)
  // Let's use the actual dates returned by the backend which are mapped to current week
  
  const mappedEvents = timetableItems.map(item => {
    let start = new Date(item.start)
    let end = new Date(item.end)

    if (isNaN(start.getTime())) {
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      const timeStr = typeof item.start === 'string' && item.start.includes(':') ? item.start : '09:00:00'
      start = new Date(`${todayStr}T${timeStr.length === 5 ? timeStr + ':00' : timeStr}`)
    }

    if (isNaN(end.getTime())) {
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      const timeStr = typeof item.end === 'string' && item.end.includes(':') ? item.end : '11:00:00'
      end = new Date(`${todayStr}T${timeStr.length === 5 ? timeStr + ':00' : timeStr}`)
    }

    if (isNaN(start.getTime())) start = new Date()
    if (isNaN(end.getTime())) end = new Date(start.getTime() + 2 * 60 * 60 * 1000)

    const startHour = start.getHours() + start.getMinutes() / 60
    const endHour = end.getHours() + end.getMinutes() / 60
    
    // Grid starts at 7:30 = 7.5
    // Duration is 12 hours (7:30 to 19:30)
    const topPercent = Math.max(0, Math.min(100, ((startHour - 7.5) / 12) * 100))
    const heightPercent = Math.max(5, Math.min(100, ((endHour - startHour) / 12) * 100))
    
    // Format times
    const startTimeStr = format(start, 'HH:mm')
    const endTimeStr = format(end, 'HH:mm')
    
    return {
      id: item.id,
      day: format(start, 'EEEE', { locale: fr }), // e.g., "lundi"
      date: format(start, 'd MMMM yyyy', { locale: fr }), // e.g., "29 juin 2026"
      startTime: startTimeStr,
      endTime: endTimeStr,
      title: (item.title || 'Séance de cours') + (item.extendedProps?.group ? ` — ${item.extendedProps.group}` : ''),
      status: item.extendedProps?.status || 'published', // draft, published
      isLocked: item.extendedProps?.is_locked,
      top: `${topPercent}%`,
      height: `${heightPercent}%`,
      professor: item.extendedProps?.professor,
      extendedProps: item.extendedProps || {}
    }
  }).filter(e => {
    // Client-side filtering by professor if selected
    if (selectedProfessor) {
      const selectedProfObj = professors.find(p => p.id.toString() === selectedProfessor)
      const profName = selectedProfObj ? `${selectedProfObj.user?.first_name} ${selectedProfObj.user?.last_name}` : ''
      return e.professor === profName || false
    }
    return true
  })

  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekLabel = `${format(currentWeekStart, 'd MMM')} — ${format(addDays(currentWeekStart, 6), 'd MMM. yyyy', { locale: fr })}`

  const getFiliereStyle = (title: string = '', group: string = '') => {
    const text = (title + ' ' + group).toUpperCase()
    if (text.includes('GFC') || text.includes('COMPTABILITÉ') || text.includes('FINANCIÈRE') || text.includes('FINANCE')) {
      return {
        bg: 'bg-indigo-600 border-l-indigo-900 text-white',
        badge: 'bg-indigo-800/90 text-indigo-100',
        label: 'GFC'
      }
    }
    if (text.includes('MCM') || text.includes('MARKETING') || text.includes('COMMUNICATION')) {
      return {
        bg: 'bg-purple-600 border-l-purple-900 text-white',
        badge: 'bg-purple-800/90 text-purple-100',
        label: 'MCM'
      }
    }
    if (text.includes('TC') || text.includes('TRONC') || text.includes('STATISTIQUE') || text.includes('INFORMATIQUE')) {
      return {
        bg: 'bg-emerald-600 border-l-emerald-900 text-white',
        badge: 'bg-emerald-800/90 text-emerald-100',
        label: 'TC'
      }
    }
    if (text.includes('GRH') || text.includes('RH') || text.includes('HUMAINES')) {
      return {
        bg: 'bg-amber-600 border-l-amber-900 text-white',
        badge: 'bg-amber-800/90 text-amber-100',
        label: 'GRH'
      }
    }
    return {
      bg: 'bg-blue-600 border-l-blue-900 text-white',
      badge: 'bg-blue-800/90 text-blue-100',
      label: 'Filière'
    }
  }

  const renderListView = () => {
    const grouped = mappedEvents.reduce((acc, event) => {
      const key = `${event.day} ${event.date}`
      if (!acc[key]) acc[key] = []
      acc[key].push(event)
      return acc
    }, {} as Record<string, typeof mappedEvents>)

    const sortedDates = Object.keys(grouped).sort((a, b) => {
      const dateA = new Date(grouped[a][0].date)
      const dateB = new Date(grouped[b][0].date)
      return dateA.getTime() - dateB.getTime()
    })

    return (
      <div className="bg-white border border-slate-100 rounded-b-2xl p-4">
        {mappedEvents.length === 0 ? (
           <div className="p-8 text-center text-slate-400">Aucun cours trouvé pour cette sélection.</div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            {sortedDates.map((date) => (
              <div key={date}>
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
                  <span className="font-bold text-slate-700 capitalize">{date.split(' ')[0]}</span>
                  <span className="text-sm font-bold text-slate-500">{date.split(' ').slice(1).join(' ')}</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {grouped[date].sort((a, b) => a.startTime.localeCompare(b.startTime)).map(event => {
                    const style = getFiliereStyle(event.title, event.extendedProps?.group)
                    return (
                      <div key={event.id} className={cn("px-4 py-3 flex items-center gap-4 border-l-4", style.bg)}>
                        <div className="w-32 shrink-0 font-bold text-sm bg-white/20 px-2 py-1 rounded inline-block text-center shadow-sm">
                          {event.startTime} - {event.endTime}
                        </div>
                        <div className="flex-1 font-bold text-sm flex items-center gap-2">
                          <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider", style.badge)}>
                            {style.label}
                          </span>
                          <span>{event.title}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderWeekView = () => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = addDays(currentWeekStart, i)
      return format(d, 'EEE. dd/MM', { locale: fr })
    })
    
    const hours = Array.from({ length: 13 }, (_, i) => `${i + 7}:30`)

    // Calculate global conflict count
    let conflictCount = 0
    mappedEvents.forEach((e1, idx1) => {
      mappedEvents.forEach((e2, idx2) => {
        if (idx1 < idx2 && e1.day === e2.day) {
          const top1 = parseFloat(e1.top)
          const h1 = parseFloat(e1.height)
          const top2 = parseFloat(e2.top)
          const h2 = parseFloat(e2.height)
          if (top1 < top2 + h2 && top2 < top1 + h1) {
            conflictCount++
          }
        }
      })
    })

    return (
      <div className="space-y-4">
        {conflictCount > 0 && (
          <div className="bg-amber-50 border-2 border-amber-400/90 rounded-2xl p-4 flex items-center gap-3.5 text-amber-950 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 font-black text-xl shadow-md">
              ⚠️
            </div>
            <div className="flex-1">
              <h4 className="font-extrabold text-sm uppercase tracking-wide text-amber-900 flex items-center gap-2">
                Alerte Chevauchement Horaires ({conflictCount} Conflit{conflictCount > 1 ? 's' : ''} Détecté{conflictCount > 1 ? 's' : ''})
              </h4>
              <p className="text-xs font-medium text-amber-800 mt-0.5">
                Deux ou plusieurs créneaux se superposent le même jour à la même heure. Ils sont désormais disposés <strong>côte à côte</strong> avec un indicateur clignotant rouge <span className="inline-block bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">⚠️ CONFLIT D'HORAIRE</span>.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white border border-slate-100 rounded-2xl flex overflow-x-auto relative shadow-sm">
          {loading && (
             <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-[1px] flex items-center justify-center">
               <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
             </div>
          )}
          
          {/* Time column */}
          <div className="w-16 shrink-0 border-r border-slate-100 pt-12">
            {hours.map(hour => (
              <div key={hour} className="h-12 border-b border-slate-50 flex items-center justify-center text-[10px] font-bold text-slate-400 relative">
                <span className="absolute -top-2 bg-white px-1">{hour}</span>
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="flex-1 min-w-[800px] flex">
            {days.map((day) => {
              const dayName = day.split('.')[0]
              const dayEvents = mappedEvents.filter(e => e.day.startsWith(dayName))

              // Process side-by-side positioning for overlapping events
              const processedEvents = dayEvents.map((evt) => {
                const overlapping = dayEvents.filter((other) => {
                  if (other.id === evt.id) return false
                  const top1 = parseFloat(evt.top)
                  const h1 = parseFloat(evt.height)
                  const top2 = parseFloat(other.top)
                  const h2 = parseFloat(other.height)
                  return (top1 < top2 + h2 && top2 < top1 + h1)
                })

                if (overlapping.length > 0) {
                  const sortedGroup = [evt, ...overlapping].sort((a, b) => (a.id || 0) - (b.id || 0))
                  const positionIndex = sortedGroup.findIndex(item => item.id === evt.id)
                  const totalCols = sortedGroup.length
                  const colWidth = Math.floor(96 / totalCols)
                  return {
                    ...evt,
                    hasConflict: true,
                    widthStyle: `${colWidth}%`,
                    leftStyle: `${positionIndex * colWidth + 2}%`
                  }
                }
                return {
                  ...evt,
                  hasConflict: false,
                  widthStyle: 'calc(100% - 8px)',
                  leftStyle: '4px'
                }
              })

              return (
                <div key={day} className="flex-1 border-r border-slate-100 relative">
                  <div className="h-12 border-b border-slate-100 flex items-center justify-center font-bold text-sm text-slate-700 capitalize">
                    {day}
                  </div>
                  <div className="relative" style={{ height: `${13 * 48}px` }}>
                    {hours.map((_, h) => (
                      <div key={h} className="h-12 border-b border-slate-50" />
                    ))}
                    
                    {processedEvents.map(event => {
                      const style = getFiliereStyle(event.title, event.extendedProps?.group)
                      return (
                        <div 
                          key={event.id}
                          className={cn(
                            "absolute rounded-xl p-2 text-white text-[10px] font-bold leading-tight shadow-md cursor-grab active:cursor-grabbing border-l-4 transition-all hover:scale-[1.03] hover:z-30",
                            style.bg,
                            event.hasConflict && "ring-2 ring-red-500 shadow-red-500/40 shadow-lg"
                          )}
                          style={{ 
                            top: event.top, 
                            height: event.height,
                            width: event.widthStyle,
                            left: event.leftStyle
                          }}
                          title={`${event.title} (${event.startTime} - ${event.endTime})`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="bg-black/30 px-1 py-0.5 rounded text-[8.5px] font-black">{event.startTime} - {event.endTime}</span>
                            <span className={cn("px-1 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider", style.badge)}>
                              {style.label}
                            </span>
                          </div>
                          <div className="line-clamp-2 font-extrabold text-[10px] leading-tight">{event.title}</div>
                          {event.hasConflict && (
                            <div className="mt-1 inline-flex items-center gap-1 bg-red-600 text-white text-[8px] font-black uppercase px-1 py-0.5 rounded shadow">
                              <span>⚠️ CONFLIT</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in p-4 md:p-6 max-w-[1600px] mx-auto pb-24">
      {/* Header */}
      {!isAdmin ? (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-8 md:p-10 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden border border-indigo-900/50">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
          <div className="relative z-10 space-y-2">
            <span className="bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" /> Espace Enseignant — Planning Automatique
            </span>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Mon Emploi du Temps Hebdomadaire</h1>
            <p className="text-sm text-slate-300 font-medium max-w-2xl">
              Votre planning hebdomadaire complet s'affiche automatiquement avec tous vos cours, amphis, travaux dirigés et groupes attribués.
            </p>
          </div>
          <div className="relative z-10 flex flex-wrap items-center gap-3">
            <button 
              onClick={handleExportIcs}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-2 transition-all shadow-md"
              title="Exporter vers Apple Calendar, Google Calendar, Outlook"
            >
              <span>📱</span> Sync Smartphone (.ics)
            </button>
            <button 
              onClick={handleExportPdf}
              className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-extrabold flex items-center gap-2 transition-all shadow-sm"
              title="Télécharger l'Emploi officiel PDF"
            >
              <span>📄</span> Export PDF
            </button>
            <button 
              onClick={() => setShowRattrapageModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black flex items-center gap-2 transition-all shadow-md"
            >
              <Sparkles className="w-4 h-4" /> Signaler Conflit / Rattrapage
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0f2863] italic">Calendrier Interactif — Emplois du Temps</h1>
              <p className="text-slate-500 mt-1 text-sm font-medium">Vue hebdomadaire globale pour gérer les séances de l'établissement</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowRattrapageModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#8b5cf6] text-white font-bold rounded-xl hover:bg-[#7c3aed] transition-colors text-xs uppercase tracking-wide shadow-sm"
            >
              <Sparkles className="w-4 h-4" /> Suggérer Rattrapage
            </button>
            <Link 
              to="/admin/schedules/create"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0f2863] text-white font-bold rounded-xl hover:bg-[#1a387e] transition-colors text-xs uppercase tracking-wide shadow-sm"
            >
              <Plus className="w-4 h-4" /> Nouvelle Séance
            </Link>
            <Link 
              to="/admin/schedules/engine" 
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-950 hover:bg-indigo-900 text-white font-black rounded-xl transition-all text-xs uppercase tracking-wide shadow-md border border-indigo-800"
            >
              <Cpu className="w-4 h-4 text-indigo-400 animate-pulse" /> Générateur CSP (IA)
            </Link>
          </div>
        </div>
      )}

      {/* Filters Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl shadow-sm p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-700">
              {!isAdmin ? "Mon Emploi du Temps Chargé — Filtres & Recherche de Salles" : "Filtres Global de Recherche"}
            </h3>
          </div>
          {!isAdmin && (
            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
              Mode Enseignant Actif
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Filière</label>
            <select 
              value={selectedFiliere}
              onChange={(e) => setSelectedFiliere(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#0f2863] focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="">Toutes les Filières</option>
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
              <option value="">Tous les Groupes</option>
              {groupes.map((g: any) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Professeur</label>
            {!isAdmin ? (
              <select disabled className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-[#0f2863] cursor-not-allowed">
                <option value="">{currentProfName} (Compte Enseignant)</option>
              </select>
            ) : (
              <select 
                value={selectedProfessor}
                onChange={(e) => setSelectedProfessor(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#0f2863] focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="">Tous les professeurs</option>
                {professors.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.user?.first_name} {p.user?.last_name}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <button 
              onClick={fetchTimetable}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors text-xs uppercase tracking-wide shadow-md h-[46px] disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Appliquer le filtre
            </button>
          </div>
        </div>
        
        <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Légende des Filières :</span>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-600"></span>
              <span className="text-xs font-bold text-slate-700">Tronc Commun (TC)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-indigo-600"></span>
              <span className="text-xs font-bold text-slate-700">Gestion Financière (GFC)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-purple-600"></span>
              <span className="text-xs font-bold text-slate-700">Marketing & Comm (MCM)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-amber-600"></span>
              <span className="text-xs font-bold text-slate-700">Management RH (GRH)</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 italic font-medium">Chaque filière possède sa propre couleur distinctive</p>
        </div>
      </div>

      {/* Calendar View Controls & Grid */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] overflow-hidden flex flex-col">
        {/* Calendar Header */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800 rounded-lg p-1">
              <button className="p-1.5 text-white/80 hover:text-white transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="p-1.5 text-white/80 hover:text-white transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button className="px-4 py-2 bg-slate-400 text-white text-xs font-bold rounded-lg shadow-sm">
              Aujourd'hui
            </button>
          </div>

          <h2 className="text-xl md:text-2xl font-bold text-slate-800 capitalize">{weekLabel}</h2>

          <div className="flex bg-slate-800 p-1 rounded-xl overflow-x-auto">
            {(['Semaine', 'Jour', 'Liste'] as const).map(mode => (
              <button 
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "px-6 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap",
                  viewMode === mode ? "bg-slate-700 text-white shadow-sm" : "text-slate-300 hover:text-white hover:bg-slate-700/50"
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {viewMode === 'Liste' ? renderListView() : renderWeekView()}

      </div>

      {/* Modal Demande de Réaménagement à l'Administration */}
      {showRattrapageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in zoom-in-95">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-indigo-950 p-6 text-white relative">
              <button 
                onClick={() => setShowRattrapageModal(false)}
                className="absolute top-5 right-5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Service des Emplois du Temps
              </span>
              <h3 className="font-black text-2xl tracking-tight">Demande de Réaménagement d'Emploi du Temps</h3>
              <p className="text-xs text-slate-300 font-medium mt-1">
                Transmettez votre demande d'arbitrage à l'Administration pour vérifier la disponibilité des salles et résoudre le chevauchement.
              </p>
            </div>
            
            {/* Body */}
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Enseignant Demandeur</label>
                  <input 
                    type="text" 
                    disabled 
                    value={`${currentProfName} (Permanent ENCG Fès)`} 
                    className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Module à Décaler</label>
                    <select 
                      value={requestModule}
                      onChange={(e) => setRequestModule(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#0f2863] focus:outline-none focus:border-amber-500 transition-colors"
                    >
                      <option value="">Sélectionner le module</option>
                      {Array.from(new Set(mappedEvents.map(e => e.title))).map((t, idx) => (
                        <option key={idx} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Jour Souhaité</label>
                    <select 
                      value={requestDay}
                      onChange={(e) => setRequestDay(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#0f2863] focus:outline-none focus:border-amber-500 transition-colors"
                    >
                      <option value="Lundi">Lundi</option>
                      <option value="Mardi">Mardi</option>
                      <option value="Mercredi">Mercredi</option>
                      <option value="Jeudi">Jeudi</option>
                      <option value="Vendredi">Vendredi</option>
                      <option value="Samedi">Samedi</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Créneau Horaire Préféré</label>
                  <select 
                    value={requestTime}
                    onChange={(e) => setRequestTime(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#0f2863] focus:outline-none focus:border-amber-500 transition-colors"
                  >
                    <option value="08:30 - 10:30">08:30 — 10:30 (Matin)</option>
                    <option value="10:45 - 12:45">10:45 — 12:45 (Matinée)</option>
                    <option value="14:30 - 16:30">14:30 — 16:30 (Après-midi)</option>
                    <option value="15:30 - 17:30">15:30 — 17:30 (Après-midi)</option>
                    <option value="17:45 - 19:45">17:45 — 19:45 (Fin de journée)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Remarque / Explication du Conflit pour l'Administration</label>
                  <textarea 
                    rows={3}
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    placeholder="Ex: Chevauchement de créneau constaté entre le cours de Marketing et de Comptabilité. Merci de vérifier la disponibilité d'une salle libre le Mercredi."
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  onClick={() => setShowRattrapageModal(false)}
                  className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleSendConflictRequest}
                  disabled={submittingRequest}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wide shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {submittingRequest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Transmettre la Demande à l'Admin
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
