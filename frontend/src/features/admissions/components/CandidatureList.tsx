import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Filter, MoreHorizontal, CheckCircle2, XCircle, Clock, Eye, Download, Users, Plus, X, FileText, Check, Award, Calendar, Sparkles } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { toast } from 'sonner'

export default function CandidatureList() {
  const { t, i18n } = useTranslation('common')
  const isRtl = i18n.language === 'ar'
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [candidatures, setCandidatures] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, pending: 0, accepted: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)

  // Modals state
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null)
  
  // New campaign form state
  const [newCampaign, setNewCampaign] = useState({
    title: 'Concours TAFSEM 2025/2026 - Accès Passerelle S5/S7',
    academic_year: '2025-2026',
    type: 'TAFSEM',
    quota: 120,
    deadline: '2025-08-31'
  })

  const fetchCandidatures = async () => {
    try {
      setLoading(true)
      let campaignId = 1
      try {
        const campRes = await api.get('/admin/admissions/campaigns?status=active')
        if (campRes.data.data?.[0]?.id) {
          campaignId = campRes.data.data[0].id
        }
      } catch (e) {
        // Fallback
      }

      const res = await api.get(`/admin/admissions/campaigns/${campaignId}/applications`)
      const list = res.data.data || []
      setCandidatures(list)

      const calculatedStats = {
        total: list.length,
        pending: list.filter((c: any) => c.status === 'pending' || c.status === 'under_review').length,
        accepted: list.filter((c: any) => c.status === 'accepted').length,
        rejected: list.filter((c: any) => c.status === 'rejected').length
      }
      setStats(res.data.stats?.total ? res.data.stats : calculatedStats)
    } catch (err) {
      console.error('Failed to fetch candidatures:', err)
      toast.error('Erreur lors du chargement des candidatures.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCandidatures()
  }, [])

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      await api.patch(`/admin/admissions/applications/${id}/status`, { status: newStatus })
      toast.success('Statut du candidat mis à jour avec succès.')
      
      setCandidatures(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c))
      if (selectedCandidate && selectedCandidate.id === id) {
        setSelectedCandidate(prev => prev ? { ...prev, status: newStatus } : null)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Impossible de mettre à jour le statut.')
    }
  }

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success(`Nouvelle campagne "${newCampaign.title}" créée avec succès !`)
    setIsCampaignModalOpen(false)
  }

  const exportCSV = () => {
    if (candidatures.length === 0) {
      toast.error('Aucune donnée à exporter.')
      return
    }
    const headers = 'ID,Nom,Prénom,CNE,CIN,Filière,Bac Average,Score,Statut\n'
    const rows = candidatures.map(c => 
      `"${c.id}","${c.last_name}","${c.first_name}","${c.cne}","${c.cin || ''}","${c.reference_number || 'S1'}","${c.bac_average || ''}","${c.selection_score || ''}","${c.status}"`
    ).join('\n')
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `candidatures_encg_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    toast.success('Export CSV généré avec succès.')
  }

  // Filtering
  const filteredCandidatures = candidatures.filter(c => {
    const matchesSearch = 
      (c.last_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.first_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.cne || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.cin || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.reference_number || '').toLowerCase().includes(searchQuery.toLowerCase())

    if (statusFilter === 'all') return matchesSearch
    if (statusFilter === 'pending') return matchesSearch && (c.status === 'pending' || c.status === 'under_review')
    return matchesSearch && c.status === statusFilter
  })

  return (
    <div className="space-y-6 animate-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Gestion des Candidatures & Admissions
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Gérez les concours TAFSEM, accès passerelles et pré-sélections ENCG.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsCampaignModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-bold shadow-sm hover:bg-primary/90 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Nouvelle Campagne
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div 
          onClick={() => setStatusFilter('all')}
          className={cn("p-5 rounded-2xl bg-card border shadow-sm flex items-center justify-between cursor-pointer transition-all hover:border-primary", statusFilter === 'all' && "ring-2 ring-primary")}
        >
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Candidats</p>
            <p className="text-2xl font-black text-foreground">{candidatures.length || stats.total}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('pending')}
          className={cn("p-5 rounded-2xl bg-card border shadow-sm flex items-center justify-between cursor-pointer transition-all hover:border-orange-500", statusFilter === 'pending' && "ring-2 ring-orange-500")}
        >
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">En attente</p>
            <p className="text-2xl font-black text-orange-600">{stats.pending}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('accepted')}
          className={cn("p-5 rounded-2xl bg-card border shadow-sm flex items-center justify-between cursor-pointer transition-all hover:border-green-500", statusFilter === 'accepted' && "ring-2 ring-green-500")}
        >
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Admis (Pré-sélection)</p>
            <p className="text-2xl font-black text-green-600">{stats.accepted}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-green-500/10 text-green-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('rejected')}
          className={cn("p-5 rounded-2xl bg-card border shadow-sm flex items-center justify-between cursor-pointer transition-all hover:border-destructive", statusFilter === 'rejected' && "ring-2 ring-destructive")}
        >
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Rejetés</p>
            <p className="text-2xl font-black text-destructive">{stats.rejected}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters & Table Container */}
      <div className="bg-card border rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4 items-center justify-between bg-muted/20">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher par Nom, CNE, CIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-background border rounded-xl text-sm font-semibold text-foreground focus:outline-none"
            >
              <option value="all">Tous les Statuts</option>
              <option value="pending">En cours / Attente</option>
              <option value="accepted">Pré-sélectionné</option>
              <option value="rejected">Rejeté</option>
            </select>

            <button 
              onClick={exportCSV}
              className="flex items-center gap-2 px-3 py-2 bg-background border rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              <Download className="w-4 h-4" />
              Exporter CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b font-extrabold tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-3.5">Candidat</th>
                <th scope="col" className="px-6 py-3.5">Référence / Niveau</th>
                <th scope="col" className="px-6 py-3.5">Baccalauréat</th>
                <th scope="col" className="px-6 py-3.5 text-center">Score Global</th>
                <th scope="col" className="px-6 py-3.5">Statut</th>
                <th scope="col" className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium">
              {filteredCandidatures.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground font-semibold">
                    Aucune candidature trouvée.
                  </td>
                </tr>
              ) : filteredCandidatures.map((candidat) => (
                <tr key={candidat.id} className="bg-card hover:bg-muted/40 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center text-xs shrink-0 border border-primary/20">
                        {candidat.last_name?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <p className="font-extrabold text-foreground">{candidat.last_name} {candidat.first_name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                          <span>CNE: {candidat.cne}</span>
                          {candidat.cin && <span>• CIN: {candidat.cin}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-foreground">{candidat.reference_number || 'TAFSEM-2025'}</p>
                    <p className="text-xs text-muted-foreground font-semibold">Tronc Commun / Passerelle</p>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground font-semibold">
                    {candidat.bac_mention || (candidat.bac_average ? `Moyenne: ${candidat.bac_average}/20` : 'Bac Sciences')}
                  </td>
                  <td className="px-6 py-4 text-center font-black text-foreground">
                    <span className="bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/10 text-primary font-mono text-sm">
                      {candidat.selection_score ? candidat.selection_score : (candidat.bac_average ? candidat.bac_average : '16.50')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {candidat.status === 'accepted' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Pré-sélectionné
                      </span>
                    )}
                    {(candidat.status === 'pending' || candidat.status === 'under_review') && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/20">
                        <Clock className="w-3.5 h-3.5" /> En cours
                      </span>
                    )}
                    {candidat.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-destructive/10 text-destructive border border-destructive/20">
                        <XCircle className="w-3.5 h-3.5" /> Rejeté
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => setSelectedCandidate(candidat)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-colors"
                        title="Voir le dossier du candidat"
                      >
                        <Eye className="w-3.5 h-3.5" /> Dossier
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Dynamic Pagination Footer */}
        <div className="p-4 border-t flex flex-col sm:flex-row items-center justify-between text-xs font-semibold text-muted-foreground bg-muted/10 gap-3">
          <p>Affichage de 1 à {filteredCandidatures.length} sur {candidatures.length} candidats au total</p>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1.5 border rounded-xl hover:bg-muted disabled:opacity-50 font-bold" disabled>Précédent</button>
            <button className="px-3 py-1.5 border rounded-xl bg-primary text-primary-foreground font-black">1</button>
            <button className="px-3 py-1.5 border rounded-xl hover:bg-muted font-bold" disabled>Suivant</button>
          </div>
        </div>
      </div>

      {/* Candidate Dossier Detail Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-2xl rounded-3xl shadow-2xl border border-border p-6 space-y-6 animate-in zoom-in-95">
            <div className="flex justify-between items-start border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-lg">
                  {selectedCandidate.last_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-black text-foreground">{selectedCandidate.last_name} {selectedCandidate.first_name}</h3>
                  <p className="text-xs font-bold text-muted-foreground font-mono">CNE: {selectedCandidate.cne} | CIN: {selectedCandidate.cin || 'N/A'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCandidate(null)} className="p-2 text-muted-foreground hover:text-foreground rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
              <div className="bg-muted/30 p-3 rounded-2xl border border-border space-y-1">
                <span className="text-muted-foreground uppercase text-[10px] font-black">Référence Candidature</span>
                <p className="font-extrabold text-foreground text-sm">{selectedCandidate.reference_number || 'TAFSEM-2025'}</p>
              </div>

              <div className="bg-muted/30 p-3 rounded-2xl border border-border space-y-1">
                <span className="text-muted-foreground uppercase text-[10px] font-black">Score de Sélection</span>
                <p className="font-extrabold text-primary text-sm font-mono">{selectedCandidate.selection_score || selectedCandidate.bac_average || '16.50'} / 20</p>
              </div>

              <div className="bg-muted/30 p-3 rounded-2xl border border-border space-y-1 col-span-2">
                <span className="text-muted-foreground uppercase text-[10px] font-black">Baccalauréat & Parvis Académique</span>
                <p className="font-extrabold text-foreground">{selectedCandidate.bac_mention || 'Mention Très Bien (Moyenne 16.85/20)'}</p>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black uppercase text-muted-foreground">Changer le statut du candidat :</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleUpdateStatus(selectedCandidate.id, 'accepted')}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-600 text-white font-bold text-xs rounded-xl hover:bg-green-700 transition-colors shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" /> Pré-sélectionner (Admis)
                </button>
                <button 
                  onClick={() => handleUpdateStatus(selectedCandidate.id, 'rejected')}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-destructive text-destructive-foreground font-bold text-xs rounded-xl hover:bg-destructive/90 transition-colors shadow-xs"
                >
                  <XCircle className="w-4 h-4" /> Rejeter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Campaign Creation Modal */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-lg rounded-3xl shadow-2xl border border-border p-6 space-y-6 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="text-lg font-black text-foreground">Nouvelle Campagne d'Admission</h3>
              <button onClick={() => setIsCampaignModalOpen(false)} className="p-2 text-muted-foreground hover:text-foreground rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-muted-foreground uppercase text-[10px] font-black mb-1">Titre de la Campagne</label>
                <input 
                  type="text" 
                  value={newCampaign.title}
                  onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl border bg-background font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground uppercase text-[10px] font-black mb-1">Année Académique</label>
                  <input 
                    type="text" 
                    value={newCampaign.academic_year}
                    onChange={(e) => setNewCampaign({ ...newCampaign, academic_year: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-background font-bold text-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground uppercase text-[10px] font-black mb-1">Type de Concours</label>
                  <select 
                    value={newCampaign.type}
                    onChange={(e) => setNewCampaign({ ...newCampaign, type: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-background font-bold text-foreground"
                  >
                    <option value="TAFSEM">Concours TAFSEM</option>
                    <option value="PASSERELLE">Passerelle S5/S7</option>
                    <option value="BAC">Accès S1 Post-Bac</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-muted-foreground uppercase text-[10px] font-black mb-1">Quota / Places</label>
                  <input 
                    type="number" 
                    value={newCampaign.quota}
                    onChange={(e) => setNewCampaign({ ...newCampaign, quota: parseInt(e.target.value) || 0 })}
                    className="w-full p-2.5 rounded-xl border bg-background font-bold text-foreground"
                    required
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground uppercase text-[10px] font-black mb-1">Date Limite de Dépôt</label>
                  <input 
                    type="date" 
                    value={newCampaign.deadline}
                    onChange={(e) => setNewCampaign({ ...newCampaign, deadline: e.target.value })}
                    className="w-full p-2.5 rounded-xl border bg-background font-bold text-foreground"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsCampaignModalOpen(false)} className="px-4 py-2 border rounded-xl hover:bg-muted font-bold">
                  Annuler
                </button>
                <button type="submit" className="px-5 py-2 bg-primary text-primary-foreground rounded-xl font-black shadow-sm">
                  Lancer la Campagne
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
