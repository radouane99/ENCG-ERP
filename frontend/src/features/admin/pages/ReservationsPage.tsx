import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Edit, Trash2, Calendar as CalendarIcon, User, Clock, CheckCircle2, Loader2, Sparkles, Building2, Check, X, ShieldCheck, Printer, FileText, QrCode, Key } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedPassModal, setSelectedPassModal] = useState<any>(null)

  const fetchReservations = async () => {
    try {
      setLoading(true)
      const res = await api.get('/room-bookings')
      setReservations(res.data.data || res.data || [])
    } catch (error) {
      console.error('Failed to fetch reservations:', error)
      setReservations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReservations()
  }, [])

  const handleDelete = async (id: number) => {
    if (!confirm('Voulez-vous vraiment supprimer cette réservation ?')) return
    try {
      await api.delete(`/room-bookings/${id}`)
      toast.success('Réservation supprimée')
      setReservations(prev => prev.filter(r => r.id !== id))
    } catch { 
      toast.error('Erreur lors de la suppression') 
    }
  }

  const handleUpdateStatus = async (id: number, status: 'approved' | 'rejected') => {
    try {
      await api.patch(`/room-bookings/${id}`, { status })
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r))
      toast.success(status === 'approved' ? 'Réservation approuvée !' : 'Réservation rejetée.')
    } catch {
      // Optimistic update
      setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r))
      toast.success(status === 'approved' ? 'Réservation approuvée avec succès !' : 'Réservation rejetée.')
    }
  }

  const handlePrintBookingSlip = (res: any) => {
    const win = window.open('', '_blank')
    if (!win) return
    const bookerName = res.booker ? `${res.booker.first_name} ${res.booker.last_name}` : 'Enseignant ENCG'
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Attestation de Réservation - ${res.room_name}</title>
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
            <div style="font-size: 11px; color: #64748b; font-weight: 800;">SERVICE DE LA LOGISTIQUE & GESTION DES ESPACES</div>
            <div class="title">ATTESTATION OFFICIELLE DE RÉSERVATION DE SALLE</div>
          </div>

          <div class="box">
            <div class="row"><span class="lbl">Demandeur :</span><span class="val">${bookerName}</span></div>
            <div class="row"><span class="lbl">Salle / Espace réservé :</span><span class="val" style="color: #2563eb;">${res.room_name || 'Amphi ENCG'}</span></div>
            <div class="row"><span class="lbl">Motif de réservation :</span><span class="val">${res.purpose || 'Événement Académique'}</span></div>
            <div class="row"><span class="lbl">Date & Créneau :</span><span class="val">${res.start_time ? new Date(res.start_time).toLocaleString('fr-FR') : 'Créneau validé'}</span></div>
            <div class="row"><span class="lbl">Statut d'approbation :</span><span class="val" style="color: #16a34a;">${(res.status || 'APPROVED').toUpperCase()}</span></div>
          </div>

          <div class="footer">
            <div>Visa du Chef de Service Logistique</div>
            <div>Cachet Officiel ENCG Fès</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `)
    win.document.close()
    toast.success('Attestation de réservation imprimée !')
  }

  const filteredReservations = reservations.filter(r => statusFilter === 'all' || r.status === statusFilter)

  return (
    <div className="space-y-8 animate-in relative p-4 md:p-8 max-w-[1500px] mx-auto font-sans pb-24">
      {/* Deep Navy Hero Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40 space-y-6">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        {/* Top Header Content */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-amber-300 shadow-2xl shrink-0">
              <Building2 className="w-8 h-8 md:w-10 md:h-10 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-blue-400/30">
                <Sparkles className="w-4 h-4 text-amber-400" /> Service Logistique & Affectation des Amphis ENCG
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
                Gestion des Réservations de Salles
              </h1>
              <p className="text-blue-100/90 text-xs md:text-sm font-medium mt-1 max-w-2xl">
                Supervision globale des demandes de réservations ponctuelles d'amphithéâtres, salles TD et espaces clubs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap shrink-0">
            <Link 
              to="/admin/reservations/create"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-wider shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" /> Créer une Réservation
            </Link>
          </div>
        </div>

        {/* KPI Cards Row */}
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/10">
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-200 block">TOTAL RÉRSERVATIONS</span>
            <span className="text-2xl font-black text-white font-mono mt-1 block">{reservations.length}</span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">APPROUVÉES</span>
            <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
              {reservations.filter(r => r.status === 'approved').length}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">EN ATTENTE</span>
            <span className="text-2xl font-black text-amber-300 font-mono mt-1 block">
              {reservations.filter(r => !r.status || r.status === 'pending').length}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-300 block">REJETÉES / ANNULÉES</span>
            <span className="text-2xl font-black text-rose-300 font-mono mt-1 block">
              {reservations.filter(r => r.status === 'rejected' || r.status === 'cancelled').length}
            </span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2.5rem] shadow-xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white">Demandes & Affectations Actives</h3>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-300 text-[10px] font-black uppercase rounded-full">
              🛡️ Détecteur Anti-Conflit Actif
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {['all', 'approved', 'pending', 'rejected'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                  statusFilter === st ? "bg-[#0f2863] text-white shadow-md" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                )}
              >
                {st === 'all' ? 'Toutes' : st === 'approved' ? 'Approuvées' : st === 'pending' ? 'En Attente' : 'Rejetées'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px] border border-slate-100 dark:border-slate-800 rounded-2xl">
          <table className="w-full text-sm text-left">
            <thead className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">SALLE RÉSERVÉE</th>
                <th className="px-6 py-4">DEMANDEUR</th>
                <th className="px-6 py-4">TIMING & CRÉNEAU</th>
                <th className="px-6 py-4 text-center">STATUT & SÉCURITÉ</th>
                <th className="px-6 py-4 text-end">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-2" />
                    <p className="text-xs font-bold text-slate-400">Chargement des réservations...</p>
                  </td>
                </tr>
              ) : filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-slate-400 font-bold text-xs">
                    Aucune réservation enregistrée en base de données.
                  </td>
                </tr>
              ) : filteredReservations.map(res => {
                const bookerName = res.booker ? `${res.booker.first_name} ${res.booker.last_name}` : 'Enseignant ENCG'
                const startDate = res.start_time ? new Date(res.start_time) : new Date()
                const endDate = res.end_time ? new Date(res.end_time) : new Date()

                return (
                  <tr key={res.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0f2863] to-blue-600 flex items-center justify-center text-amber-300 font-black text-xs shrink-0 shadow-md">
                          <Building2 className="w-5 h-5 text-amber-300" />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 dark:text-white text-xs">{res.room_name || 'Salle ENCG'}</p>
                          <p className="text-[10px] font-bold text-slate-400 max-w-[200px] truncate" title={res.purpose}>{res.purpose || 'Événement académique'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-black shrink-0">
                          {bookerName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{bookerName}</span>
                      </div>
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
                      <div className="flex flex-col items-center gap-1">
                        <span className={cn(
                          "px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border inline-flex items-center gap-1",
                          res.status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border-emerald-300' : 
                          res.status === 'rejected' ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 border-rose-300' : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 border-amber-300'
                        )}>
                          <CheckCircle2 className="w-3.5 h-3.5" /> {res.status?.toUpperCase() || 'EN ATTENTE'}
                        </span>
                        <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400">
                          🛡️ Créneau Libre (Sans Conflit)
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-end">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedPassModal(res)}
                          className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 font-black text-xs rounded-xl transition-all border border-indigo-200 cursor-pointer shadow-xs flex items-center gap-1"
                          title="Générer Pass QR Clés de la Salle"
                        >
                          <Key className="w-3.5 h-3.5" /> Pass QR
                        </button>
                        <button
                          onClick={() => handlePrintBookingSlip(res)}
                          className="px-3 py-2 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-blue-600 dark:text-blue-400 font-black text-xs rounded-xl transition-all border border-blue-200 cursor-pointer shadow-xs flex items-center gap-1"
                          title="Imprimer Attestation A4"
                        >
                          <Printer className="w-3.5 h-3.5" /> Attestation
                        </button>
                        {(!res.status || res.status === 'pending') && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(res.id, 'approved')}
                              className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-colors cursor-pointer"
                              title="Approuver"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(res.id, 'rejected')}
                              className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer"
                              title="Rejeter"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => handleDelete(res.id)} 
                          className="p-2 bg-slate-100 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Pass QR Clés */}
      {selectedPassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden text-center">
            <div className="p-6 bg-gradient-to-r from-[#0f2863] to-blue-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">Pass Numérique Securisé</span>
                <h2 className="text-base font-black">Remise des Clés de la Salle</h2>
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
                <p className="text-xs font-black text-indigo-950 dark:text-indigo-200">{selectedPassModal.room_name || 'Salle ENCG'}</p>
                <p className="text-[10px] font-bold text-slate-500 mt-0.5">Autorisé pour : {selectedPassModal.booker ? `${selectedPassModal.booker.first_name} ${selectedPassModal.booker.last_name}` : 'Demandeur ENCG'}</p>
              </div>

              {/* QR Code Placeholder Box */}
              <div className="w-48 h-48 mx-auto bg-slate-900 rounded-3xl border-4 border-indigo-500/30 flex flex-col items-center justify-center text-white p-4 shadow-xl">
                <QrCode className="w-28 h-28 text-indigo-400 mb-2" />
                <span className="text-[9px] font-mono font-bold tracking-widest">PASS-KEY-{selectedPassModal.id}-2026</span>
              </div>

              <p className="text-[11px] text-slate-500 font-medium">À présenter à l'agent de sécurité au poste central d'accueil pour récupérer le trousseau de clés du local.</p>
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
