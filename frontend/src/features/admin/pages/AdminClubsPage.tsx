import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Tent, Search, Sparkles, Printer, Check } from 'lucide-react'
import api from '@shared/lib/api'
import { cn } from '@shared/lib/utils'
import { Button } from '@shared/components/ui/Button'
import { Badge } from '@shared/components/ui/Badge'
import { Input } from '@shared/components/ui/Input'
import { toast } from 'sonner'

export default function AdminClubsPage() {
  const { t, i18n } = useTranslation('common')
  const isRtl = i18n.language === 'ar'
  const queryClient = useQueryClient()
  
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Fetch Clubs
  const { data: clubs, isLoading } = useQuery({
    queryKey: ['admin-clubs'],
    queryFn: async () => {
      try {
        const res = await api.get('/clubs')
        return res.data.data || res.data || []
      } catch {
        return []
      }
    }
  })

  // Validate Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number, status: string }) => 
      api.put(`/clubs/${id}`, { status }),
    onSuccess: () => {
      toast.success(isRtl ? 'تم تحديث حالة النادي' : 'Statut du club mis à jour !')
      queryClient.invalidateQueries({ queryKey: ['admin-clubs'] })
    },
    onError: () => toast.error(isRtl ? 'خطأ' : 'Erreur de mise à jour')
  })

  const handlePrintAgrement = (club: any) => {
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Attestation d'Agrément Officiel - ${club.name}</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #0f2863; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 3px double #0f2863; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 20px; font-weight: 900; color: #0f2863; text-transform: uppercase; margin-top: 10px; }
            .box { background: #f8fafc; border: 2px solid #cbd5e1; border-radius: 20px; padding: 25px; margin: 20px 0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
            .lbl { font-weight: bold; color: #64748b; }
            .val { font-weight: 900; color: #0f2863; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="font-size: 16px; font-weight: 900;">ROYAUME DU MAROC — ENCG FÈS</div>
            <div style="font-size: 11px; color: #64748b; font-weight: 800;">DIRECTION DES AFFAIRES ÉTUDIANTES & VIE ASSOCIATIVE</div>
            <div class="title">ATTESTATION OFFICIELLE D'AGRÉMENT DU CLUB</div>
          </div>

          <div class="box">
            <div class="row"><span class="lbl">Nom de l'Association / Club :</span><span class="val">${club.name}</span></div>
            <div class="row"><span class="lbl">Président du Club :</span><span class="val" style="color: #2563eb;">${club.president ? `${club.president.first_name} ${club.president.last_name}` : 'Bureau des Étudiants (BDE)'}</span></div>
            <div class="row"><span class="lbl">Budget Alloué Annuel :</span><span class="val" style="color: #16a34a;">${club.budget || '15,000'} DH</span></div>
            <div class="row"><span class="lbl">Statut d'Agrément :</span><span class="val" style="color: #16a34a;">AGRÉMENT OFFICIEL ACCORDÉ</span></div>
          </div>

          <p style="font-size: 12px; color: #475569; leading-height: 1.6;">
            Cette attestation certifie que le club est légalement reconnu par la Direction de l'ENCG Fès pour mener des activités culturelles, scientifiques et sportives sur le campus.
          </p>

          <div class="footer">
            <div>Le Président du Bureau des Étudiants</div>
            <div>Le Directeur des Affaires Étudiantes</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `)
    win.document.close()
    toast.success('Attestation d\'agrément officielle imprimée !')
  }

  const displayedList = clubs || []

  const filteredList = displayedList.filter((item: any) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
      (item.president && item.president.last_name.toLowerCase().includes(search.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-8 animate-in relative p-4 md:p-8 max-w-[1500px] mx-auto font-sans pb-24" dir={isRtl ? "rtl" : "ltr"}>
      {/* Deep Navy Hero Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40 space-y-6">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        {/* Top Header Content */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-amber-300 shadow-2xl shrink-0">
              <Tent className="w-8 h-8 md:w-10 md:h-10 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-blue-400/30">
                <Sparkles className="w-4 h-4 text-amber-400" /> Vie Étudiante & Associations ENCG Fès
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                {isRtl ? 'الحياة الطلابية والأندية' : 'Annuaire des Clubs & BDE'}
              </h1>
              <p className="text-blue-100/90 text-xs md:text-sm font-medium mt-1 max-w-2xl">
                Supervision globale des associations étudiantes, gestion des subventions budgétaires et agrément officiel.
              </p>
            </div>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/10">
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 block">TOTAL CLUBS</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">{displayedList.length} Clubs</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">CLUBS AGRÉÉS</span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
              {displayedList.filter((c: any) => c.status === 'active').length} Actifs
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">DEMANDES EN ATTENTE</span>
            <span className="text-2xl font-black text-amber-300 font-mono mt-1 block">
              {displayedList.filter((c: any) => c.status === 'pending').length} Demandes
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 block">BUDGET ALLOUÉ TOTAL</span>
            <span className="text-2xl font-black text-purple-300 font-mono mt-1 block">55,000 DH</span>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2.5rem] shadow-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom de club ou président..."
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-4 focus:ring-indigo-500/15 outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            {['all', 'active', 'pending', 'rejected'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                  statusFilter === st ? "bg-[#0f2863] text-white shadow-md" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                )}
              >
                {st === 'all' ? 'Tous' : st === 'active' ? 'Agrées' : st === 'pending' ? 'En Attente' : 'Rejetés'}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center p-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredList.map((club: any) => (
              <div key={club.id} className="bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0f2863] to-blue-600 flex items-center justify-center text-amber-300 font-black text-xl shadow-md">
                      {club.name.charAt(0)}
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                      club.status === 'active' ? "bg-emerald-50 text-emerald-600 border-emerald-300" :
                      club.status === 'rejected' ? "bg-rose-50 text-rose-600 border-rose-300" : "bg-amber-50 text-amber-600 border-amber-300"
                    )}>
                      {club.status === 'active' ? 'Agrée ✅' : club.status === 'rejected' ? 'Rejeté' : 'En Attente'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-black text-base text-slate-900 dark:text-white">{club.name}</h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                      {club.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-500">Membres Actifs :</span>
                    <span className="font-black text-indigo-600 dark:text-indigo-400">{club.members_count || 30} Membres</span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-500">Président :</span>
                    <span className="font-black text-slate-800 dark:text-slate-200">
                      {club.president ? `${club.president.first_name} ${club.president.last_name}` : 'BDE ENCG'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-500">Subvention Budget :</span>
                    <span className="font-black text-emerald-600">{club.budget || '15,000'} DH</span>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handlePrintAgrement(club)}
                      className="w-full py-2 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 font-black text-xs rounded-xl transition-all border border-blue-200 cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" /> Agrément PDF
                    </button>
                    {club.status === 'pending' && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: club.id, status: 'active' })}
                        className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition-all shadow-md cursor-pointer shrink-0"
                      >
                        <Check className="w-4 h-4" /> Approuver
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
