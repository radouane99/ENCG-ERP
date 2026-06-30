import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Filter, MoreHorizontal, CheckCircle2, XCircle, Clock, Eye, Download, Users } from 'lucide-react'
import { cn } from '@shared/lib/utils'

// Mock Data
const candidatures = [
  { id: 'APP-2026-001', name: 'Amina Bennani', cne: 'N120000001', type: 'Passerelle S5', score: 14.5, status: 'approved', date: '2026-06-20', bac: 'Sc. Maths' },
  { id: 'APP-2026-002', name: 'Youssef Alaoui', cne: 'M130000002', type: 'Passerelle S7', score: 12.8, status: 'pending', date: '2026-06-21', bac: 'Sc. Eco' },
  { id: 'APP-2026-003', name: 'Sara Idrissi', cne: 'R140000003', type: 'TAFSEM', score: 16.2, status: 'approved', date: '2026-06-22', bac: 'Sc. Physique' },
  { id: 'APP-2026-004', name: 'Omar Chraibi', cne: 'J150000004', type: 'Passerelle S5', score: 9.5, status: 'rejected', date: '2026-06-23', bac: 'SVT' },
]

export default function CandidatureList() {
  const { t, i18n } = useTranslation('common')
  const isRtl = i18n.language === 'ar'
  const [searchQuery, setSearchQuery] = useState('')

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
            <p className="text-2xl font-bold text-foreground">1,248</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="p-5 rounded-xl bg-card border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">En attente</p>
            <p className="text-2xl font-bold text-foreground">412</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>
        <div className="p-5 rounded-xl bg-card border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Admis (Pré-sélection)</p>
            <p className="text-2xl font-bold text-foreground">680</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
        <div className="p-5 rounded-xl bg-card border shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Rejetés</p>
            <p className="text-2xl font-bold text-foreground">156</p>
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
              {candidatures.map((candidat) => (
                <tr key={candidat.id} className="bg-card hover:bg-muted/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {candidat.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{candidat.name}</p>
                        <p className="text-xs text-muted-foreground">{candidat.cne}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-foreground">{candidat.type}</p>
                    <p className="text-xs text-muted-foreground">{candidat.id}</p>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {candidat.bac}
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-foreground">
                    {candidat.score.toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    {candidat.status === 'approved' && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-500 border border-green-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Pré-sélectionné
                      </span>
                    )}
                    {candidat.status === 'pending' && (
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
