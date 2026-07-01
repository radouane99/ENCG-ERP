import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, Plus, Grid, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@shared/lib/utils'

export default function InteractiveCalendarPage() {
  const [viewMode, setViewMode] = useState<'Semaine' | 'Jour' | 'Liste'>('Semaine')
  const [showRattrapageModal, setShowRattrapageModal] = useState(false)

  const events = [
    { id: 1, day: 'lundi', date: '29 juin 2026', startTime: '8:30', endTime: '10:30', title: 'INF-101 — Génie Informatique - Groupe 1', status: 'draft', top: '8.33%', height: '16.66%' },
    { id: 2, day: 'lundi', date: '29 juin 2026', startTime: '10:30', endTime: '12:15', title: 'INF-103 — Génie Informatique - Groupe 1', status: 'published', top: '25%', height: '14.58%' },
    { id: 3, day: 'lundi', date: '29 juin 2026', startTime: '10:45', endTime: '12:00', title: 'INF-102 — Génie Informatique - Groupe 2', status: 'draft', top: '27.08%', height: '10.41%' },
    { id: 4, day: 'mardi', date: '30 juin 2026', startTime: '8:30', endTime: '10:15', title: 'INF-107 — Génie Informatique - Groupe 1', status: 'published', top: '8.33%', height: '14.58%' },
    { id: 5, day: 'mardi', date: '30 juin 2026', startTime: '10:30', endTime: '12:30', title: 'INF-103 — Génie Informatique - Groupe 1', status: 'draft', top: '25%', height: '16.66%' },
    { id: 6, day: 'mercredi', date: '1 juillet 2026', startTime: '8:00', endTime: '10:00', title: 'INF-107 — Génie Informatique - Groupe 1', status: 'moved', top: '4.16%', height: '16.66%' },
    { id: 7, day: 'mercredi', date: '1 juillet 2026', startTime: '8:30', endTime: '10:15', title: 'INF-102 — Génie Informatique - Groupe 2', status: 'draft', top: '8.33%', height: '14.58%' },
    { id: 8, day: 'mercredi', date: '1 juillet 2026', startTime: '10:30', endTime: '12:15', title: 'INF-101 — Génie Informatique - Groupe 1', status: 'published', top: '25%', height: '14.58%' },
    { id: 9, day: 'jeudi', date: '2 juillet 2026', startTime: '14:00', endTime: '16:00', title: 'INF-104 — Génie Informatique - Groupe 1', status: 'draft', top: '54.16%', height: '16.66%' },
  ]

  const renderListView = () => {
    const grouped = events.reduce((acc, event) => {
      const key = `${event.day} ${event.date}`
      if (!acc[key]) acc[key] = []
      acc[key].push(event)
      return acc
    }, {} as Record<string, typeof events>)

    return (
      <div className="bg-white border border-slate-100 rounded-b-2xl p-4">
        <div className="border border-slate-200 rounded-xl overflow-hidden">
          {Object.entries(grouped).map(([date, dayEvents], index) => (
            <div key={date}>
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
                <span className="font-bold text-slate-700 capitalize">{date.split(' ')[0]}</span>
                <span className="text-sm font-bold text-slate-500">{date.split(' ').slice(1).join(' ')}</span>
              </div>
              <div className="divide-y divide-slate-100">
                {dayEvents.map(event => (
                  <div key={event.id} className={cn("px-4 py-3 flex items-center gap-4 border-l-4", 
                    event.status === 'published' ? 'border-l-emerald-500 bg-emerald-500 text-white' : 
                    'border-l-amber-500 bg-[#e88c00] text-white'
                  )}>
                    <div className="w-32 shrink-0 font-bold text-sm bg-white/20 px-2 py-1 rounded inline-block text-center shadow-sm">
                      {event.startTime} - {event.endTime}
                    </div>
                    <div className="flex-1 font-bold text-sm">
                      {event.status === 'moved' && <span className="w-2 h-2 rounded-full bg-blue-400 inline-block mr-2" />}
                      {event.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderWeekView = () => {
    const days = ['lun. 29/06', 'mar. 30/06', 'mer. 01/07', 'jeu. 02/07', 'ven. 03/07', 'sam. 04/07', 'dim. 05/07']
    const hours = Array.from({ length: 13 }, (_, i) => `${i + 7}:30`)

    return (
      <div className="bg-white border border-slate-100 rounded-b-2xl flex overflow-x-auto">
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
          {days.map((day, i) => (
            <div key={day} className="flex-1 border-r border-slate-100 relative">
              <div className="h-12 border-b border-slate-100 flex items-center justify-center font-bold text-sm text-slate-700">
                {day}
              </div>
              <div className="relative" style={{ height: `${13 * 48}px` }}>
                {/* Grid lines */}
                {hours.map((_, h) => (
                  <div key={h} className="h-12 border-b border-slate-50" />
                ))}
                
                {/* Events for this day */}
                {events.filter(e => {
                  const dayName = e.day.slice(0, 3)
                  return day.startsWith(dayName)
                }).map(event => (
                  <div 
                    key={event.id}
                    className={cn(
                      "absolute left-1 right-1 rounded-lg p-2 text-white text-[10px] font-bold leading-tight shadow-sm cursor-grab active:cursor-grabbing border-l-4",
                      event.status === 'published' ? 'bg-emerald-500 border-l-emerald-600' : 'bg-[#e88c00] border-l-amber-600'
                    )}
                    style={{ top: event.top, height: event.height }}
                  >
                    <div className="flex items-center gap-1 mb-1">
                      {event.status === 'moved' && <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                      <span>{event.startTime} - {event.endTime}</span>
                    </div>
                    <div className="line-clamp-2">{event.title}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in p-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0f2863] italic">Calendrier Interactif — Emplois du Temps</h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">Vue hebdomadaire avec drag & drop pour déplacer les séances</p>
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
          <button className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors text-xs uppercase tracking-wide">
            <Grid className="w-4 h-4" /> Vue Grille
          </button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm p-8">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Filtres</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Filière</label>
            <select className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#0f2863] focus:outline-none focus:border-blue-500 transition-colors">
              <option>Génie Informatique</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Groupe</label>
            <select className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#0f2863] focus:outline-none focus:border-blue-500 transition-colors">
              <option>Génie Informatique - Groupe 1</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Professeur</label>
            <select className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#0f2863] focus:outline-none focus:border-blue-500 transition-colors">
              <option>Radouane el asri</option>
            </select>
          </div>
          <div>
            <button className="w-full px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors text-xs uppercase tracking-wide shadow-md h-[46px]">
              Appliquer
            </button>
          </div>
        </div>
        
        <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span className="text-xs font-bold text-slate-600">Brouillon</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-bold text-slate-600">Publié / Verrouillé</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span className="text-xs font-bold text-slate-600">Cours déplacé (non enregistré)</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 italic font-medium">Glissez-déposez pour modifier un créneau</p>
        </div>
      </div>

      {/* Calendar View Controls & Grid */}
      <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex flex-col">
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

          <h2 className="text-2xl font-bold text-slate-800">29 juin — 5 juil. 2026</h2>

          <div className="flex bg-slate-800 p-1 rounded-xl">
            {(['Semaine', 'Jour', 'Liste'] as const).map(mode => (
              <button 
                key={mode}
                onClick={() => setViewMode(mode)}
                className={cn(
                  "px-6 py-2 text-xs font-bold rounded-lg transition-colors",
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

      {/* IA Rattrapage Modal */}
      {showRattrapageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="bg-[#8b5cf6] p-6 text-white relative">
              <button 
                onClick={() => setShowRattrapageModal(false)}
                className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="font-bold text-xl flex items-center gap-2">
                <Sparkles className="w-5 h-5" /> Assistant de Rattrapage IA
              </h3>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Module</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-purple-500 transition-colors">
                    <option>Avancé - Économie & Gestion</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Professeur</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-purple-500 transition-colors">
                    <option>Radouane el asri</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Groupe</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-purple-500 transition-colors">
                    <option>Économie & Gestion - Groupe ...</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Période</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-purple-500 transition-colors">
                    <option>Semaine prochaine (7j)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4">
                <button className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-colors text-sm uppercase tracking-wide shadow-md">
                  Trouver un créneau
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
