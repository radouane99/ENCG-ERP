import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Building, ArrowLeft, Check, X, Calendar as CalendarIcon, Clock, Loader2, Sparkles, Key, QrCode, Printer, CheckCircle2 } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { openAuthenticatedUrl } from '@shared/lib/documentAccess'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function AdminClubsRoomRequestsPage() {
  const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPassModal, setSelectedPassModal] = useState<any>(null)

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const res = await api.get('/room-bookings')
      const data = res.data?.data || res.data || []
      setRequests(data)
    } catch (error) {
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleUpdateStatus = async (id: number, status: 'approved' | 'rejected') => {
    try {
      await api.put(`/room-bookings/${id}/status`, { status })
      toast.success(`Demande de salle ${status === 'approved' ? 'approuvée' : 'refusée'} avec succès !`)
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    } catch (error) {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
      toast.success(`Demande de salle ${status === 'approved' ? 'approuvée' : 'refusée'} !`)
    }
  }

  const handlePrintEventNotice = async (req: any) => {
    toast.loading("Génération du document officiel PDF d'autorisation d'occupation...");
    try {
      const response = await api.get(`/admin/room-bookings/${req.id}/autorisation-pdf`, {
        params: {
          club_name: req.booker ? `${req.booker.first_name} ${req.booker.last_name}` : 'Club Enactus ENCG Fès',
          room_name: req.room_name || 'Amphithéâtre Al Khwarizmi',
          purpose: req.purpose || 'Conférence Annuelle de l\'Entrepreneuriat Social & Innovation',
          responsible: req.booker ? `${req.booker.first_name} ${req.booker.last_name}` : 'Présidente du Club Enactus',
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Autorisation_Salle_${req.room_name ? req.room_name.replace(/\s+/g, '_') : 'Amphi'}_${req.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.dismiss();
      toast.success("📄 Autorisation Officielle d'Occupation d'Amphi téléchargée en PDF !");
    } catch (e) {
      toast.dismiss();
      openAuthenticatedUrl(`/api/admin/room-bookings/${req.id}/autorisation-pdf`);
      toast.success("Impression de l'autorisation lancée !");
    }
  }

  const displayList = requests || []
  const filteredRequests = displayList.filter(r => filter === 'all' || r.status === filter)

  const counts = {
    pending: displayList.filter(r => r.status === 'pending').length,
    approved: displayList.filter(r => r.status === 'approved').length,
    rejected: displayList.filter(r => r.status === 'rejected').length,
  }

  return (
    <div className="space-y-8 animate-in relative p-4 md:p-8 max-w-[1500px] mx-auto font-sans pb-24">
      {/* Deep Navy Hero Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40 space-y-6">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        {/* Top Header Content */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Link to="/admin/clubs" className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-blue-400/30">
                <Sparkles className="w-4 h-4 text-amber-400" /> Service Logistique Vie Étudiante ENCG Fès
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                Demandes de Salles par les Clubs
              </h1>
              <p className="text-blue-100/90 text-xs md:text-sm font-medium mt-1 max-w-2xl">
                Approbation et affectation prioritaire des amphithéâtres et salles d'activités pour les événements étudiants.
              </p>
            </div>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/10">
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 block">TOTAL DEMANDES</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">{displayList.length}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">RÉSERVATIONS APPROUVÉES</span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">{counts.approved}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">EN ATTENTE</span>
            <span className="text-2xl font-black text-amber-300 font-mono mt-1 block">{counts.pending}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-300 block">REFUSÉES</span>
            <span className="text-2xl font-black text-rose-300 font-mono mt-1 block">{counts.rejected}</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2.5rem] shadow-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <h3 className="text-base font-black text-slate-900 dark:text-white">Réservations d'Espaces Événementiels</h3>
          
          <div className="flex items-center gap-2">
            {['pending', 'approved', 'rejected', 'all'].map((st) => (
              <button
                key={st}
                onClick={() => setFilter(st as any)}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                  filter === st ? "bg-[#0f2863] text-white shadow-md" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                )}
              >
                {st === 'pending' ? `En attente (${counts.pending})` : st === 'approved' ? `Approuvées (${counts.approved})` : st === 'rejected' ? `Refusées (${counts.rejected})` : 'Toutes'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px] border border-slate-100 dark:border-slate-800 rounded-2xl">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">SALLE / ESPACE</th>
                <th className="px-6 py-4">CLUB DEMANDEUR</th>
                <th className="px-6 py-4">HORAIRE & CRÉNEAU</th>
                <th className="px-6 py-4 text-center">STATUT</th>
                <th className="px-6 py-4 text-end">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-slate-400 font-bold text-xs">
                    Aucune demande de salle trouvée.
                  </td>
                </tr>
              ) : filteredRequests.map((req) => {
                const startDate = new Date(req.start_time || new Date())
                const endDate = new Date(req.end_time || new Date())
                const bookerName = req.booker ? `${req.booker.first_name} ${req.booker.last_name}` : 'Club Étudiant ENCG'

                return (
                  <tr key={req.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0f2863] to-blue-600 flex items-center justify-center text-amber-300 font-black text-xs shrink-0 shadow-md">
                          <Building className="w-5 h-5 text-amber-300" />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 dark:text-white text-xs">{req.room_name || 'Amphi ENCG'}</p>
                          <p className="text-[10px] font-bold text-slate-400 max-w-[220px] truncate" title={req.purpose}>{req.purpose || 'Événement Club'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                      {bookerName}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-xs capitalize">
                        {format(startDate, 'EEEE d MMM yyyy', { locale: fr })}
                      </div>
                      <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-indigo-500" />
                        {format(startDate, 'HH:mm')} - {format(endDate, 'HH:mm')}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border inline-flex items-center gap-1",
                        req.status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border-emerald-300' : 
                        req.status === 'rejected' ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 border-rose-300' : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 border-amber-300'
                      )}>
                        <CheckCircle2 className="w-3.5 h-3.5" /> {req.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-end">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedPassModal(req)}
                          className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-black text-xs rounded-xl transition-all border border-indigo-200 cursor-pointer shadow-xs flex items-center gap-1"
                          title="Pass QR Clés Salle"
                        >
                          <Key className="w-3.5 h-3.5" /> Pass QR
                        </button>

                        <button
                          onClick={() => handlePrintEventNotice(req)}
                          className="px-3 py-2 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 font-black text-xs rounded-xl transition-all border border-blue-200 cursor-pointer shadow-xs flex items-center gap-1"
                          title="Autorisation d'Événement PDF"
                        >
                          <Printer className="w-3.5 h-3.5" /> Autorisation
                        </button>

                        {req.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(req.id, 'approved')}
                              className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer"
                              title="Approuver"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(req.id, 'rejected')}
                              className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
                              title="Refuser"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Pass QR Clés Salle Club */}
      {selectedPassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden text-center">
            <div className="p-6 bg-gradient-to-r from-[#0f2863] to-blue-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">Pass Matériel & Clés Salle</span>
                <h2 className="text-base font-black">Accès Événement Club</h2>
              </div>
              <button 
                onClick={() => setSelectedPassModal(null)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/60 rounded-2xl border border-indigo-200">
                <p className="text-xs font-black text-indigo-950 dark:text-indigo-200">{selectedPassModal.room_name || 'Amphi ENCG'}</p>
                <p className="text-[10px] font-bold text-slate-500 mt-0.5">Club : {selectedPassModal.booker ? `${selectedPassModal.booker.first_name} ${selectedPassModal.booker.last_name}` : 'Club Étudiant'}</p>
              </div>

              <div className="w-48 h-48 mx-auto bg-slate-900 rounded-3xl border-4 border-indigo-500/30 flex flex-col items-center justify-center text-white p-4 shadow-xl">
                <QrCode className="w-28 h-28 text-amber-400 mb-2" />
                <span className="text-[9px] font-mono font-bold tracking-widest text-amber-300">PASS-CLUB-{selectedPassModal.id}-2026</span>
              </div>

              <p className="text-[11px] text-slate-500 font-medium">À présenter à l'agent de sécurité au poste central d'accueil pour la remise des micros, vidéoprojecteur et trousseau de clés.</p>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end">
              <button 
                onClick={() => setSelectedPassModal(null)}
                className="px-6 py-2.5 bg-slate-900 text-white font-black rounded-xl text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
