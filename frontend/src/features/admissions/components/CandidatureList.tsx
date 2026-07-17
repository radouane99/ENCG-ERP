import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Filter, MoreHorizontal, CheckCircle2, XCircle, Clock, Eye, Download, Users } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'

export default function CandidatureList() {
  const { t, i18n } = useTranslation('common')
  const isRtl = i18n.language === 'ar'
  const [searchQuery, setSearchQuery] = useState('')
  const [candidatures, setCandidatures] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, pending: 0, accepted: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCandidatures = async () => {
      try {
        setLoading(true)
        const campRes = await api.get('/admin/admissions/campaigns?status=active');
        const campaignId = campRes.data.data?.[0]?.id || 1;
        
        const res = await api.get(`/admin/admissions/campaigns/${campaignId}/applications`);
        setCandidatures(res.data.data || []);
        setStats(res.data.stats || { total: 0, pending: 0, accepted: 0, rejected: 0 })
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchCandidatures()
  }, [])

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestion des Candidatures</h1>
          <p className="text-muted-foreground mt-1 text-sm">Gérez les admissions et les concours TAFSEM/Passerelles.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium shadow-sm hover:bg-primary/90 transition-colors text-sm">
            <Users className="w-4 h-4" />
            Nouvelle Campagne
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-card border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Candidats</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="p-5 rounded-xl bg-card border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">En attente</p>
            <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="p-5 rounded-xl bg-card border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Admis (Pré-sélection)</p>
            <p className="text-2xl font-bold text-foreground">{stats.accepted}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="p-5 rounded-xl bg-card border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Rejetés</p>
            <p className="text-2xl font-bold text-foreground">{stats.rejected}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
            <XCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters & Table Container */}
      <div className="bg-card border rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b flex flex-col sm:flex-row gap-4 items-center justify-between bg-muted/20">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher (Nom, CNE, ID)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-background border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">
              <Filter className="w-4 h-4" />
              Filtres
            </button>
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-background border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors">
              <Download className="w-4 h-4" />
              Exporter
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
              <tr>
                <th scope="col" className="px-6 py-3 font-semibold">Candidat</th>
                <th scope="col" className="px-6 py-3 font-semibold">Type / Filière</th>
                <th scope="col" className="px-6 py-3 font-semibold">Baccalauréat</th>
                <th scope="col" className="px-6 py-3 font-semibold text-center">Score Global</th>
                <th scope="col" className="px-6 py-3 font-semibold">Statut</th>
                <th scope="col" className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {candidatures.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">Aucune candidature trouvée.</td></tr>
              ) : candidatures.map((candidat) => (
                <tr key={candidat.id} className="bg-card hover:bg-muted/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {candidat.last_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{candidat.last_name} {candidat.first_name}</p>
                        <p className="text-xs text-muted-foreground">{candidat.cne}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">S1</p>
                    <p className="text-xs text-muted-foreground">{candidat.reference_number}</p>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {candidat.bac_mention}
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-foreground">
                    {candidat.selection_score ? candidat.selection_score : (candidat.bac_average ? candidat.bac_average : '-')}
                  </td>
                  <td className="px-6 py-4">
                    {candidat.status === 'accepted' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-500 border border-green-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Pré-sélectionné
                      </span>
                    )}
                    {(candidat.status === 'pending' || candidat.status === 'under_review') && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-600 dark:text-orange-500 border border-orange-500/20">
                        <Clock className="w-3.5 h-3.5" /> En cours
                      </span>
                    )}
                    {candidat.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive border border-destructive/20">
                        <XCircle className="w-3.5 h-3.5" /> Rejeté
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors" title="Voir le dossier">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="p-4 border-t flex items-center justify-between text-sm text-muted-foreground bg-muted/10">
          <p>Affichage de 1 Ã  4 sur 1,248 candidats</p>
          <div className="flex gap-1">
            <button className="px-3 py-1 border rounded-md hover:bg-muted disabled:opacity-50" disabled>Précédent</button>
            <button className="px-3 py-1 border rounded-md bg-primary text-primary-foreground">1</button>
            <button className="px-3 py-1 border rounded-md hover:bg-muted">2</button>
            <button className="px-3 py-1 border rounded-md hover:bg-muted">3</button>
            <span className="px-2 py-1">...</span>
            <button className="px-3 py-1 border rounded-md hover:bg-muted">Suivant</button>
          </div>
        </div>
      </div>
    </div>
  )
}
