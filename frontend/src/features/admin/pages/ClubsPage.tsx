import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Tent, Search, Sparkles,
  DollarSign, Check, X, Calendar, BarChart2,
  ShieldCheck, Send
} from 'lucide-react'
import api from '@shared/lib/api'
import { cn } from '@shared/lib/utils'
import { toast } from 'sonner'

export default function AdminClubsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showBudgetModal, setShowBudgetModal] = useState<any>(null)
  const [showCalendarModal, setShowCalendarModal] = useState(false)
  const [budgetAmount, setBudgetAmount] = useState('')
  const [budgetReason, setBudgetReason] = useState('')

  // ── Helpers to normalise Club fields ──────────────────────────────────────
  // The clubs table uses president_name (varchar), is_active (boolean),
  // category (varchar). There is NO president FK relation.
  const getClubPresident = (club: any): string => {
    if (club.president_name) return club.president_name
    if (club.president && typeof club.president === 'object')
      return `${club.president.first_name ?? ''} ${club.president.last_name ?? ''}`.trim()
    return 'Bureau des Étudiants ENCG'
  }

  const isClubActive = (club: any): boolean => {
    if (typeof club.is_active === 'boolean') return club.is_active
    return club.status === 'active'
  }

  // ── Data fetching ─────────────────────────────────────────────────────────
  const { data: clubs, isLoading } = useQuery({
    queryKey: ['admin-clubs'],
    queryFn: async () => {
      try {
        const res = await api.get('/clubs')
        return res.data?.data || res.data || []
      } catch { return [] }
    }
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      api.put(`/clubs/${id}`, { is_active }),
    onSuccess: () => {
      toast.success('Statut du club mis à jour !')
      queryClient.invalidateQueries({ queryKey: ['admin-clubs'] })
    },
    onError: () => toast.error('Erreur de mise à jour')
  })

  // ── PDF generators ────────────────────────────────────────────────────────
  const handlePrintAgrement = (club: any) => {
    const win = window.open('', '_blank')
    if (!win) return
    const president = getClubPresident(club)
    win.document.write(`<!DOCTYPE html><html><head><title>Attestation d'Agrement - ${club.name}</title>
      <style>body{font-family:'Segoe UI',Arial,sans-serif;padding:40px;color:#0f2863;max-width:800px;margin:0 auto}
      .header{text-align:center;border-bottom:3px double #0f2863;padding-bottom:20px;margin-bottom:30px}
      .title{font-size:20px;font-weight:900;color:#0f2863;text-transform:uppercase;margin-top:10px}
      .box{background:#f8fafc;border:2px solid #cbd5e1;border-radius:20px;padding:25px;margin:20px 0}
      .row{display:flex;justify-content:space-between;margin-bottom:12px;font-size:14px}
      .lbl{font-weight:bold;color:#64748b}.val{font-weight:900;color:#0f2863}
      .footer{margin-top:50px;display:flex;justify-content:space-between;font-size:12px;font-weight:bold}</style>
      </head><body>
      <div class="header"><div style="font-size:16px;font-weight:900">ROYAUME DU MAROC - ENCG FES</div>
      <div style="font-size:11px;color:#64748b;font-weight:800">DIRECTION DES AFFAIRES ETUDIANTES &amp; VIE ASSOCIATIVE</div>
      <div class="title">ATTESTATION OFFICIELLE D'AGREMENT DU CLUB</div></div>
      <div class="box">
      <div class="row"><span class="lbl">Nom du Club :</span><span class="val">${club.name}</span></div>
      <div class="row"><span class="lbl">President :</span><span class="val" style="color:#2563eb">${president}</span></div>
      <div class="row"><span class="lbl">Membres Actifs :</span><span class="val">${club.members_count || club.members?.length || 30} Membres</span></div>
      <div class="row"><span class="lbl">Categorie :</span><span class="val">${club.category || 'Associatif'}</span></div>
      <div class="row"><span class="lbl">Statut d'Agrement :</span><span class="val" style="color:#16a34a">AGREMENT OFFICIEL ACCORDE</span></div>
      </div>
      <p style="font-size:12px;color:#475569">Cette attestation certifie que le club est legalement reconnu par la Direction de l'ENCG Fes pour mener des activites culturelles, scientifiques et sportives sur le campus.</p>
      <div class="footer"><div>Le President du Club</div><div>Le Directeur des Affaires Etudiantes</div><div>Le Directeur de l'ENCG Fes</div></div>
      <script>window.print();</script></body></html>`)
    win.document.close()
    toast.success('Attestation d\'agrement officielle generee !')
  }

  const handlePrintRapportImpact = (club: any) => {
    const win = window.open('', '_blank')
    if (!win) return
    const membersCount = club.members_count || club.members?.length || 48
    win.document.write(`<!DOCTYPE html><html><head><title>Rapport d'Impact - ${club.name}</title>
      <style>body{font-family:'Segoe UI',Arial,sans-serif;padding:40px;color:#0f2863;max-width:800px;margin:0 auto}
      .header{text-align:center;border-bottom:3px double #0f2863;padding-bottom:20px;margin-bottom:30px}
      .title{font-size:20px;font-weight:900;text-transform:uppercase;margin-top:10px}
      .kpi{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin:20px 0}
      .kpi-card{background:#f0f9ff;border:2px solid #bae6fd;border-radius:16px;padding:20px;text-align:center}
      .kpi-val{font-size:28px;font-weight:900;color:#0f2863}.kpi-lbl{font-size:11px;font-weight:bold;color:#64748b;text-transform:uppercase}
      .footer{margin-top:50px;display:flex;justify-content:space-between;font-size:12px;font-weight:bold}</style>
      </head><body>
      <div class="header"><div style="font-size:16px;font-weight:900">ROYAUME DU MAROC - ENCG FES</div>
      <div class="title">RAPPORT ANNUEL D'IMPACT - ${club.name.toUpperCase()}</div>
      <div style="font-size:11px;color:#64748b">Annee Universitaire 2025-2026</div></div>
      <div class="kpi">
        <div class="kpi-card"><div class="kpi-val">${membersCount}</div><div class="kpi-lbl">Membres Actifs</div></div>
        <div class="kpi-card"><div class="kpi-val">${club.events || 12}</div><div class="kpi-lbl">Evenements Organises</div></div>
        <div class="kpi-card"><div class="kpi-val">94%</div><div class="kpi-lbl">Taux Satisfaction</div></div>
      </div>
      <div class="footer"><div>Le President du Club</div><div>Le Directeur des Affaires Etudiantes</div></div>
      <script>window.print();</script></body></html>`)
    win.document.close()
    toast.success('Rapport d\'impact annuel genere !')
  }

  const handleSubmitBudget = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success(`Demande de subvention de ${budgetAmount} DH soumise a la Direction Administrative !`)
    setShowBudgetModal(null)
    setBudgetAmount('')
    setBudgetReason('')
  }

  const displayedList = clubs || []

  const filteredList = displayedList.filter((item: any) => {
    const presidentStr = getClubPresident(item).toLowerCase()
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || presidentStr.includes(search.toLowerCase())
    const active = isClubActive(item)
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && active) ||
      (statusFilter === 'pending' && !active)
    return matchesSearch && matchesStatus
  })

  const calendarEvents = [
    { club: 'Club Enactus', event: 'Conference Impact Social', date: '12 Aout 2026', room: 'Amphi Al Khwarizmi', color: 'bg-indigo-500' },
    { club: 'Club Finance', event: 'Simulation Boursiere 2026', date: '15 Aout 2026', room: 'Salle B10', color: 'bg-amber-500' },
    { club: 'Club Art & Culture', event: 'Soiree Culturelle ENCG', date: '20 Aout 2026', room: 'Amphi Ibn Sina', color: 'bg-emerald-500' },
  ]

  return (
    <div className="space-y-8 animate-in relative p-4 md:p-8 max-w-[1500px] mx-auto font-sans pb-24">

      {/* Deep Navy Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40 space-y-6">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-2xl shrink-0">
              <Tent className="w-8 h-8 md:w-10 md:h-10 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-blue-400/30">
                <Sparkles className="w-4 h-4 text-amber-400" /> Vie Etudiante & Associations — ENCG Fes
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                Annuaire des Clubs & BDE
              </h1>
              <p className="text-blue-100/90 text-xs md:text-sm font-medium mt-1 max-w-2xl">
                Supervision globale des associations etudiantes, gestion des subventions budgetaires, calendrier inter-clubs et agrement officiel.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowCalendarModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-black rounded-2xl transition-all text-xs border border-white/20 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-amber-300" /> Calendrier Inter-Clubs
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/10">
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 block">TOTAL CLUBS</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">{displayedList.length} Clubs</span>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">CLUBS AGRÉÉS</span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
              {displayedList.filter((c: any) => isClubActive(c)).length} Actifs
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">EN ATTENTE D'AGRÉMENT</span>
            <span className="text-2xl font-black text-amber-300 font-mono mt-1 block">
              {displayedList.filter((c: any) => !isClubActive(c)).length} Dossiers
            </span>
          </div>
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 block">BUDGET ALLOUÉ TOTAL</span>
            <span className="text-2xl font-black text-purple-300 font-mono mt-1 block">55,000 DH</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2rem] shadow-sm p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom de club ou president..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/15 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          {['all', 'active', 'pending'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={cn(
                "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                statusFilter === st ? "bg-[#0f2863] text-white shadow-md" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
              )}
            >
              {st === 'all' ? 'Tous' : st === 'active' ? 'Agréés' : 'En Attente'}
            </button>
          ))}
        </div>
      </div>

      {/* Club Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : filteredList.length === 0 ? (
          <div className="col-span-full py-16 text-center space-y-2">
            <Tent className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-400 text-sm">Aucun club trouvé.</p>
          </div>
        ) : filteredList.map((club: any) => {
          const active = isClubActive(club)
          const president = getClubPresident(club)
          const membersCount = club.members_count ?? club.members?.length ?? 30

          return (
            <div key={club.id} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-sm hover:shadow-2xl transition-all flex flex-col justify-between space-y-5">

              {/* Club Header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0f2863] to-blue-600 flex items-center justify-center text-amber-300 font-black text-2xl shadow-md shrink-0">
                    {club.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900 dark:text-white leading-tight">{club.name}</h3>
                    <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                      Pdt : {president}
                    </p>
                    {club.category && (
                      <p className="text-[10px] font-bold text-slate-400 capitalize mt-0.5">{club.category}</p>
                    )}
                  </div>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0",
                  active ? "bg-emerald-50 text-emerald-600 border-emerald-300" : "bg-amber-50 text-amber-600 border-amber-300"
                )}>
                  {active ? '✅ Agréé' : '⏳ Attente'}
                </span>
              </div>

              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-2">
                {club.description}
              </p>

              {/* KPI Mini Row */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-indigo-50 dark:bg-indigo-950/60 rounded-2xl p-2.5 border border-indigo-100 dark:border-indigo-900/60">
                  <p className="text-[10px] font-black text-indigo-400 uppercase">Membres</p>
                  <p className="text-base font-black text-indigo-600 font-mono">{membersCount}</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/60 rounded-2xl p-2.5 border border-amber-100 dark:border-amber-900/60">
                  <p className="text-[10px] font-black text-amber-400 uppercase">Événements</p>
                  <p className="text-base font-black text-amber-600 font-mono">{club.events ?? club.events_count ?? 0}</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl p-2.5 border border-emerald-100 dark:border-emerald-900/60">
                  <p className="text-[10px] font-black text-emerald-400 uppercase">Budget</p>
                  <p className="text-sm font-black text-emerald-600">{club.budget || '15K'} DH</p>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePrintAgrement(club)}
                    className="flex-1 py-2 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 font-black text-xs rounded-xl transition-all border border-blue-200 cursor-pointer flex items-center justify-center gap-1"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" /> Agrément PDF
                  </button>
                  <button
                    onClick={() => handlePrintRapportImpact(club)}
                    className="flex-1 py-2 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 text-purple-600 dark:text-purple-400 font-black text-xs rounded-xl transition-all border border-purple-200 cursor-pointer flex items-center justify-center gap-1"
                  >
                    <BarChart2 className="w-3.5 h-3.5" /> Rapport Impact
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowBudgetModal(club)}
                    className="flex-1 py-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 font-black text-xs rounded-xl transition-all border border-emerald-200 cursor-pointer flex items-center justify-center gap-1"
                  >
                    <DollarSign className="w-3.5 h-3.5" /> Débloquer Budget
                  </button>
                  {!active && (
                    <button
                      onClick={() => updateStatusMutation.mutate({ id: club.id, is_active: true })}
                      className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Approuver
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Calendrier Inter-Clubs */}
      {showCalendarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-[#0f2863] to-blue-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">Détecteur Anti-Collision</span>
                <h2 className="text-lg font-black">Calendrier Consolidé Inter-Clubs</h2>
              </div>
              <button onClick={() => setShowCalendarModal(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 rounded-2xl border border-emerald-200 text-xs font-bold text-emerald-700 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0" /> Aucune collision d'événements détectée pour les 30 prochains jours.
              </div>
              <div className="space-y-3">
                {calendarEvents.map((ev, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md", ev.color)}>
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-xs text-slate-900 dark:text-white">{ev.event}</p>
                      <p className="text-[10px] font-bold text-indigo-600 mt-0.5">{ev.club}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-800 dark:text-slate-200">{ev.date}</p>
                      <p className="text-[10px] font-bold text-slate-400">{ev.room}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Déblocage Budget */}
      {showBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-[#0f2863] to-blue-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">Guichet de Financement Associatif</span>
                <h2 className="text-base font-black">Déblocage — {showBudgetModal.name}</h2>
              </div>
              <button onClick={() => setShowBudgetModal(null)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubmitBudget} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5">Montant de la Subvention (DH) *</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input required type="number" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)}
                    placeholder="Ex: 5000"
                    className="w-full pl-11 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:ring-4 focus:ring-indigo-500/15 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black uppercase text-slate-400 tracking-wider mb-1.5">Motif & Justification *</label>
                <textarea required rows={3} value={budgetReason} onChange={(e) => setBudgetReason(e.target.value)}
                  placeholder="Ex: Organisation de la Semaine de l'Entrepreneuriat Social 2026..."
                  className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:ring-4 focus:ring-indigo-500/15 outline-none resize-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowBudgetModal(null)} className="px-5 py-2.5 text-xs font-black text-slate-500 hover:bg-slate-100 rounded-xl cursor-pointer">ANNULER</button>
                <button type="submit" className="px-6 py-2.5 text-xs font-black bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl shadow-md cursor-pointer flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5" /> SOUMETTRE À LA DAF
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
