import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Tent, Search, Sparkles, Check, Download, ShieldCheck } from 'lucide-react';
import api from '@shared/lib/api'
import { cn } from '@shared/lib/utils';
import { toast } from 'sonner';
import { generateClubAgrementHtml } from '../utils/clubDocumentGenerator';

export default function AdminClubsPage() {
  const { i18n } = useTranslation('common');
  const isRtl = i18n.language === 'ar'
  const queryClient = useQueryClient()
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch Clubs
  // Fetch Clubs
const { data: clubs, isLoading } = useQuery({
    queryKey: ['admin-clubs'],
    queryFn: async () => {
        try {
            const res = await api.get('/clubs');
            return res.data.data || res.data || [];
        }
        catch {
            return [];
        }
    }
});

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
    if (!win) {
      toast.error('Veuillez autoriser les fenêtres pop-up pour afficher le document')
      return
    }
    const html = generateClubAgrementHtml(club)
    win.document.open()
    win.document.write(html)
    win.document.close()
    setTimeout(() => {
      win.focus()
      win.print()
    }, 400)
    toast.success('Attestation d\'agrément officielle générée !')
  }

  const handleDownloadAgrementPdf = async (club: any) => {
    try {
      toast.info('Génération du PDF officiel en cours...')
      const res = await api.get(`/clubs/${club.id}/agrement-pdf`, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `Attestation_Agrement_${(club.name || 'Club').replace(/\s+/g, '_')}_2026.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Téléchargement du PDF officiel réussi !')
    } catch {
      handlePrintAgrement(club)
    }
  }

  const displayedList = clubs || []

  const filteredList = displayedList.filter((item: any) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
      (item.president && item.president.last_name.toLowerCase().includes(search.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-8 animate-in relative max-w-[1500px] mx-auto font-sans pb-24" dir={isRtl ? "rtl" : "ltr"}>
      {/* Deep Navy Hero Header Banner */}
      <div className="relative overflow-hidden p-8 md:p-10 text-white border border-blue-800/40 space-y-6 erp-page-banner">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        {/* Top Header Content */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-amber-300 shadow-sm shrink-0">
              <Tent className="w-8 h-8 md:w-10 md:h-10 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2 border border-blue-400/30">
                <Sparkles className="w-4 h-4 text-amber-400" /> Vie Étudiante & Associations ENCG Fès
              </div>
              <h1 className="text-white leading-tight erp-page-title">
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
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200 block">TOTAL CLUBS</span>
            <span className="text-2xl font-bold text-white font-mono mt-1 block">{displayedList.length} Clubs</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">CLUBS AGRÉÉS</span>
            <span className="text-2xl font-bold text-emerald-400 font-mono mt-1 block">
              {displayedList.filter((c: any) => c.status === 'active').length} Actifs
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">DEMANDES EN ATTENTE</span>
            <span className="text-2xl font-bold text-amber-300 font-mono mt-1 block">
              {displayedList.filter((c: any) => c.status === 'pending').length} Demandes
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 block">BUDGET ALLOUÉ TOTAL</span>
            <span className="text-2xl font-bold text-purple-300 font-mono mt-1 block">55,000 DH</span>
          </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-card dark:bg-card border border-slate-200/80 dark:border-border rounded-2xl shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border dark:border-border pb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom de club ou président..."
              className="w-full pl-11 pr-4 py-2.5 bg-muted/50 dark:bg-card border border-border dark:border-slate-700/80 text-xs font-bold text-foreground dark:text-foreground focus:ring-4 focus:ring-indigo-500/15 outline-none transition-all rounded-[var(--control-radius)]"
            />
          </div>

          <div className="flex items-center gap-2">
            {['all', 'active', 'pending', 'rejected'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer",
                  statusFilter === st ? "bg-[#0f2863] text-white shadow-md" : "bg-muted dark:bg-card text-muted-foreground hover:bg-slate-200"
                )}
              >
                {st === 'all' ? 'Tous' : st === 'active' ? 'Agrées' : st === 'pending' ? 'En Attente' : 'Rejetés'}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center p-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredList.map((club: any) => (
              <div key={club.id} className="bg-slate-50/50 dark:bg-slate-800/40 border border-border dark:border-slate-700/80 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0f2863] to-blue-600 flex items-center justify-center text-amber-300 font-bold text-xl shadow-md">
                      {club.name.charAt(0)}
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                      club.status === 'active' ? "bg-emerald-50 text-emerald-600 border-emerald-300" :
                      club.status === 'rejected' ? "bg-rose-50 text-rose-600 border-rose-300" : "bg-amber-50 text-amber-600 border-amber-300"
                    )}>
                      {club.status === 'active' ? 'Agrée ✅' : club.status === 'rejected' ? 'Rejeté' : 'En Attente'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-base text-foreground dark:text-white">{club.name}</h3>
                    <p className="text-xs font-medium text-muted-foreground dark:text-muted-foreground line-clamp-2 mt-1">
                      {club.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-border dark:border-border">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-muted-foreground">Membres Actifs :</span>
                    <span className="font-bold text-primary dark:text-indigo-400">{club.members_count || 30} Membres</span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-muted-foreground">Président :</span>
                    <span className="font-bold text-foreground dark:text-foreground">
                      {club.president ? `${club.president.first_name} ${club.president.last_name}` : 'BDE ENCG'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-muted-foreground">Subvention Budget :</span>
                    <span className="font-bold text-emerald-600">{club.budget || '15,000'} DH</span>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handlePrintAgrement(club)}
                      title="Imprimer ou Aperçu Officiel"
                      className="flex-1 py-2 bg-primary/5 dark:bg-blue-950/60 hover:bg-primary/10 text-primary dark:text-blue-400 font-bold text-xs rounded-xl transition-all border border-primary/20 cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Agrément PDF
                    </button>
                    <button
                      onClick={() => handleDownloadAgrementPdf(club)}
                      title="Télécharger le fichier PDF officiel"
                      className="p-2 bg-muted dark:bg-card hover:bg-primary hover:text-white text-slate-700 dark:text-foreground rounded-xl transition-all border border-border dark:border-border cursor-pointer shadow-xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    {club.status === 'pending' && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: club.id, status: 'active' })}
                        className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer shrink-0"
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
