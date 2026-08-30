import React, { useState, useMemo } from 'react'
import {
  Calendar, ChevronLeft, ChevronRight, Download, Sparkles, Loader2,
  RefreshCw,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import api from '@shared/lib/api'
import { cn } from '@shared/lib/utils'
import { toast } from 'sonner'

const EVENT_COLORS: Record<string, string> = {
  exam: 'bg-rose-100 text-rose-700 border-rose-200',
  holiday: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  soutenance: 'bg-purple-100 text-purple-700 border-purple-200',
  default: 'bg-blue-100 text-blue-700 border-blue-200',
}

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

export default function AdminAcademicCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [filter, setFilter] = useState<'all' | 'exam' | 'holiday' | 'soutenance'>('all')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['academic-calendar-events'],
    queryFn: async () => {
      const res = await api.get('/admin/academic-calendar/events')
      return res.data?.events ?? []
    }
  })

  const events: any[] = data ?? []

  // Build calendar grid
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startWeekDay = (firstDay.getDay() + 6) % 7 // Monday = 0
    const days: (Date | null)[] = []
    for (let i = 0; i < startWeekDay; i++) days.push(null)
    for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))
    return days
  }, [year, month])

  const getEventsForDay = (date: Date) => {
    return events.filter(e => {
      const eDate = new Date(e.start)
      return eDate.getFullYear() === date.getFullYear() &&
        eDate.getMonth() === date.getMonth() &&
        eDate.getDate() === date.getDate() &&
        (filter === 'all' || e.type === filter)
    })
  }

  const handleExportIcal = () => {
    const filteredEvents = filter === 'all' ? events : events.filter(e => e.type === filter)
    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ENCG FES//CALENDRIER ACADEMIQUE//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      ...filteredEvents.map(e => [
        'BEGIN:VEVENT',
        `SUMMARY:${e.title}`,
        `DTSTART:${new Date(e.start).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTEND:${new Date(e.end ?? e.start).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DESCRIPTION:${e.type} — ENCG Fès`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
      ].join('\r\n')),
      'END:VCALENDAR'
    ].join('\r\n')

    const blob = new Blob([icsLines], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `CalendrierAcademique_ENCG_${year}.ics`
    document.body.appendChild(a)
    a.click()
    a.remove()
    toast.success('Export iCal (Google Calendar / Outlook) téléchargé !')
  }

  const selectedDayEvents = selectedDay ? getEventsForDay(selectedDay) : []

  return (
    <div className="max-w-[1500px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in pb-24">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl shrink-0">
              <Calendar className="w-8 h-8 md:w-10 md:h-10 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-sky-500/20 text-sky-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-sky-400/30">
                <Sparkles className="w-4 h-4 text-amber-400" /> Connecté à la Base de Données Réelle
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                Calendrier Académique Annuel
              </h1>
              <p className="text-blue-100/90 text-xs md:text-sm font-medium mt-1">
                Examens, congés, jurys et soutenances PFE — alimenté par les données réelles ENCG Fès
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap shrink-0">
            <button onClick={() => { refetch(); toast.success('Calendrier actualisé !') }} className="flex items-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-wider cursor-pointer">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button onClick={handleExportIcal} className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-wider cursor-pointer">
              <Download className="w-4 h-4" /> Export iCal
            </button>
          </div>
        </div>
      </div>

      {/* Filter + Legend */}
      <div className="flex items-center gap-3 flex-wrap">
        {(['all', 'exam', 'holiday', 'soutenance'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-4 py-2 rounded-2xl text-xs font-black border transition-all cursor-pointer',
              filter === f
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
            )}
          >
            {f === 'all' ? '📅 Tous' : f === 'exam' ? '📝 Examens' : f === 'holiday' ? '🏖️ Congés' : '🎓 Soutenances'}
          </button>
        ))}
        <div className="ml-auto text-xs font-bold text-slate-400">
          {events.length} événements chargés depuis la DB
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          {/* Month nav */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="w-9 h-9 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="font-black text-lg text-slate-900 dark:text-white">
              {MONTHS_FR[month]} {year}
            </h2>
            <button
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="w-9 h-9 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
            {DAYS.map(d => (
              <div key={d} className="py-2 text-center text-[10px] font-black uppercase tracking-wider text-slate-400">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} className="border-b border-r border-slate-50 dark:border-slate-800/50 h-20" />
              const dayEvents = getEventsForDay(day)
              const isToday = day.toDateString() === new Date().toDateString()
              const isSelected = selectedDay?.toDateString() === day.toDateString()

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={cn(
                    'border-b border-r border-slate-100 dark:border-slate-800 h-20 p-1.5 cursor-pointer transition-colors overflow-hidden',
                    isSelected ? 'bg-indigo-50 dark:bg-indigo-950/40' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  )}
                >
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center text-xs font-black mb-1',
                    isToday ? 'bg-indigo-600 text-white' : 'text-slate-700 dark:text-slate-300'
                  )}>
                    {day.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map(e => (
                      <div key={e.id} className={cn('px-1.5 py-0.5 rounded-lg text-[9px] font-black truncate border', EVENT_COLORS[e.type] ?? EVENT_COLORS.default)}>
                        {e.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[9px] font-black text-slate-400 pl-1">+{dayEvents.length - 2} autres</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Sidebar — selected day events or upcoming */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                {selectedDay
                  ? `📅 ${selectedDay.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`
                  : '📅 Prochains Événements'}
              </h3>
            </div>
            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-indigo-600" /></div>
              ) : (selectedDay ? selectedDayEvents : events.filter(e => new Date(e.start) >= new Date()).slice(0, 10)).map(e => (
                <div key={e.id} className={cn('p-3 rounded-2xl border', EVENT_COLORS[e.type] ?? EVENT_COLORS.default)}>
                  <p className="font-black text-xs">{e.title}</p>
                  <p className="text-[10px] font-bold opacity-70 mt-0.5">
                    {new Date(e.start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              ))}
              {!isLoading && events.length === 0 && (
                <p className="text-center text-xs text-slate-400 py-8">
                  Aucun événement en base de données.<br />
                  Planifiez des examens ou congés depuis les modules correspondants.
                </p>
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-4 space-y-2">
            <h4 className="font-black text-xs uppercase tracking-wider text-slate-400">Légende</h4>
            {[
              { type: 'exam', label: 'Examens & Épreuves' },
              { type: 'holiday', label: 'Congés & Vacances' },
              { type: 'soutenance', label: 'Soutenances PFE' },
            ].map(l => (
              <div key={l.type} className={cn('flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold', EVENT_COLORS[l.type])}>
                <div className="w-2 h-2 rounded-full bg-current" /> {l.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
