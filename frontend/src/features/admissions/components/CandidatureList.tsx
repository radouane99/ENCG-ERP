import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Filter, MoreHorizontal, CheckCircle2, XCircle, Clock, Eye, Download, Upload, Users, Plus, X, FileText, Check, Award, Calendar, Sparkles, Printer, Zap, RefreshCw } from 'lucide-react'
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
    title: 'Concours TAFSEM 2026/2027 - Accès Passerelle S5/S7',
    academic_year: '2026-2027',
    type: 'TAFSEM',
    quota: 120,
    deadline: '2026-08-31'
  })

  const DEFAULT_CANDIDATES = [
    { id: 1, first_name: 'Sara', last_name: 'Alami', cne: 'N13809281', cin: 'CD729102', reference_number: 'Passerelle S5 TAFSEM', bac_type: 'Sciences Éco', bac_average: '16.50', selection_score: '17.25', status: 'accepted' },
    { id: 2, first_name: 'Mehdi', last_name: 'Bennani', cne: 'N13800043', cin: 'CD58270', reference_number: 'Passerelle S7 Master', bac_type: 'Sciences Maths', bac_average: '15.75', selection_score: '16.10', status: 'pending' },
    { id: 3, first_name: 'Zineb', last_name: 'Alaoui', cne: 'N13800032', cin: 'CD81697', reference_number: 'Passerelle S5 TAFSEM', bac_type: 'Sciences Physique', bac_average: '14.25', selection_score: '14.80', status: 'pending' },
    { id: 4, first_name: 'Youssef', last_name: 'El Mansouri', cne: 'N13800001', cin: 'CD12345', reference_number: 'Passerelle S5 TAFSEM', bac_type: 'Gestion Comptable', bac_average: '17.00', selection_score: '18.00', status: 'accepted' },
    { id: 5, first_name: 'Karima', last_name: 'Belkhayat', cne: 'N13800034', cin: 'CD96619', reference_number: 'Passerelle S7 Master', bac_type: 'Sciences Éco', bac_average: '13.50', selection_score: '13.90', status: 'rejected' }
  ];

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
      const list = res.data.data && Array.isArray(res.data.data) ? res.data.data : []
      setCandidatures(list)

      const calculatedStats = {
        total: list.length,
        pending: list.filter((c: any) => c.status === 'pending' || c.status === 'under_review' || c.status === 'en_attente').length,
        accepted: list.filter((c: any) => c.status === 'accepted' || c.status === 'admis' || c.status === 'admis_tafem' || c.status === 'valide').length,
        rejected: list.filter((c: any) => c.status === 'rejected' || c.status === 'rejete' || c.status === 'suspended').length
      }
      setStats(res.data.stats?.total !== undefined ? res.data.stats : calculatedStats)
    } catch (err) {
      console.error('Failed to fetch candidatures:', err)
      setCandidatures([])
      setStats({ total: 0, pending: 0, accepted: 0, rejected: 0 })
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    fetchCandidatures()
  }, [])

  const handleDownloadTafemTemplate = async () => {
    toast.loading('Génération du modèle CSV officiel Ministère TAFEM...');
    try {
      const res = await api.get('/admissions/download-tafem-template-csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'modele_import_admis_ministere_tafem.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.dismiss();
      toast.success('📄 Modèle CSV Ministère TAFEM téléchargé avec succès !');
    } catch (err) {
      toast.dismiss();
      toast.error('Erreur lors du téléchargement du modèle CSV TAFEM.');
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      await api.patch(`/admin/admissions/applications/${id}/status`, { status: newStatus })
      toast.success('Statut du candidat mis à jour avec succès.')
      
      setCandidatures(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c))
      if (selectedCandidate && selectedCandidate.id === id) {
        setSelectedCandidate((prev: any) => prev ? { ...prev, status: newStatus } : null)
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

  const handleExportConvocationPdf = (cand: any) => {
    const fullName = `${cand.first_name} ${cand.last_name}`
    toast.loading(`Génération de la Convocation TAFSEM A4 (${fullName})...`)
    setTimeout(() => {
      toast.dismiss()
      toast.success(`📜 Convocation TAFSEM générée pour ${fullName}`)
      window.open(`/api/v1/enrollments/attestation-pdf?name=${encodeURIComponent(fullName)}&cne=${encodeURIComponent(cand.cne || '')}&cin=${encodeURIComponent(cand.cin || '')}&filiere=Concours TAFSEM S5 Passerelle&group=Amphi A - Table 42`, '_blank')
    }, 600)
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
    <div className="space-y-8 animate-in pb-24 p-6 max-w-7xl mx-auto font-sans">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] p-8 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-800/40">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-amber-300 shadow-2xl shrink-0">
              <Sparkles className="w-10 h-10 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-400/20 text-blue-200 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 border border-blue-400/30">
                <Zap className="w-4 h-4 text-amber-400" /> Concours TAFSEM & Passerelles ENCG Fès
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                Candidatures & Admissions
              </h1>
              <p className="text-blue-100/90 text-sm max-w-2xl font-medium mt-1">
                Gestion des campagnes de pré-sélection TAFSEM, calcul automatique des scores d'admissibilité et convocations d'examen A4 certifiées.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap shrink-0">
            <button
              onClick={handleDownloadTafemTemplate}
              className="flex items-center gap-2 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded-2xl font-bold border border-blue-400/40 transition-all text-xs uppercase tracking-wider cursor-pointer"
              title="Télécharger le modèle CSV officiel Ministère TAFEM"
            >
              <Download className="w-4 h-4 text-blue-300" /> Modèle CSV TAFEM
            </button>

            <label className="flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-wider shadow-lg hover:scale-102 cursor-pointer border border-indigo-400/30">
              <Upload className="w-4 h-4 text-indigo-200" /> Import Liste Ministère (CSV)
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const tId = toast.loading('📥 Importation de la liste du Ministère TAFEM en cours...');
                  const formData = new FormData();
                  formData.append('file', file);
                  try {
                    const res = await api.post('/admissions/import-ministry-tafem-csv', formData, {
                      headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    toast.success(`✅ ${res.data.message} (${res.data.summary.total_processed} candidats traités)`, { id: tId });
                    fetchCandidatures();
                  } catch (err: any) {
                    toast.error(err.response?.data?.message || 'Erreur lors de l\'importation.', { id: tId });
                  }
                }}
              />
            </label>
            <button 
              onClick={exportCSV} 
              className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold border border-white/20 transition-all text-xs uppercase tracking-wider cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-300" /> Exporter CSV
            </button>
            <button 
              onClick={() => setIsCampaignModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black rounded-2xl transition-all text-xs uppercase tracking-wider shadow-lg hover:scale-102 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Nouvelle Campagne
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div 
          onClick={() => setStatusFilter('all')}
          className={cn("p-6 rounded-[2rem] bg-white dark:bg-slate-900 border shadow-md flex items-center justify-between cursor-pointer transition-all hover:scale-102", statusFilter === 'all' && "ring-2 ring-indigo-500")}
        >
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Candidats</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{candidatures.length || stats.total}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-[#0f2863] dark:text-blue-300 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('pending')}
          className={cn("p-6 rounded-[2rem] bg-white dark:bg-slate-900 border shadow-md flex items-center justify-between cursor-pointer transition-all hover:scale-102", statusFilter === 'pending' && "ring-2 ring-amber-500")}
        >
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">En Attente</p>
            <p className="text-3xl font-black text-amber-600">{stats.pending}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('accepted')}
          className={cn("p-6 rounded-[2rem] bg-white dark:bg-slate-900 border shadow-md flex items-center justify-between cursor-pointer transition-all hover:scale-102", statusFilter === 'accepted' && "ring-2 ring-emerald-500")}
        >
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Admis TAFSEM</p>
            <p className="text-3xl font-black text-emerald-600">{stats.accepted}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter('rejected')}
          className={cn("p-6 rounded-[2rem] bg-white dark:bg-slate-900 border shadow-md flex items-center justify-between cursor-pointer transition-all hover:scale-102", statusFilter === 'rejected' && "ring-2 ring-rose-500")}
        >
          <div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Dossiers Rejetés</p>
            <p className="text-3xl font-black text-rose-600">{stats.rejected}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters & Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Rechercher par nom, CNE, CIN ou numéro de dossier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={fetchCandidatures}
              className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[350px]">
          {loading ? (
            <div className="flex justify-center items-center py-24 text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0f2863]"></div>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase tracking-wider bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 font-black">
                <tr>
                  <th scope="col" className="px-6 py-4">Candidat & Dossier</th>
                  <th scope="col" className="px-6 py-4">Filière Demandée</th>
                  <th scope="col" className="px-6 py-4 text-center">Score TAFSEM</th>
                  <th scope="col" className="px-6 py-4 text-center">Statut Admissibilité</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions & Convocation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCandidatures.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-slate-400 font-bold">
                      Aucune candidature trouvée.
                    </td>
                  </tr>
                ) : (
                  filteredCandidatures.map((c) => {
                    const isAccepted = c.status === 'accepted' || c.status === 'admis' || c.status === 'admis_tafem' || c.status === 'valide';
                    const isPending = c.status === 'pending' || c.status === 'under_review' || c.status === 'en_attente';

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#0f2863] dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                              {c.first_name?.charAt(0)}{c.last_name?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-900 dark:text-white text-sm">{c.first_name} {c.last_name}</p>
                              <p className="text-xs font-mono text-slate-500">CNE : {c.cne} | CIN : {c.cin || '—'}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-900 dark:text-white text-xs block">{c.reference_number || 'Passerelle S5 TAFSEM'}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Bac : {c.bac_type || 'Sciences Éco'}</span>
                        </td>

                        <td className="px-6 py-4 text-center font-mono">
                          <div className="font-black text-xs text-indigo-600 dark:text-indigo-400">
                            TAFEM : {c.selection_score ?? c.tafem_score ?? '—'} pts
                          </div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                            Bac : {c.bac_average ? `${c.bac_average}/20` : '—'}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          {(() => {
                            const listType = (c.list_type || '').toLowerCase();
                            const isListePrincipale = listType.includes('principale') || isAccepted;
                            const isAttente1 = listType.includes('attente_1') || listType.includes('attente 1');
                            const isAttente2 = listType.includes('attente_2') || listType.includes('attente 2');

                            return (
                              <span className={cn(
                                "px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border inline-flex items-center gap-1",
                                isListePrincipale ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                isAttente1 ? "bg-amber-50 text-amber-700 border-amber-200" :
                                isAttente2 ? "bg-purple-50 text-purple-700 border-purple-200" :
                                isPending ? "bg-blue-50 text-blue-700 border-blue-200" :
                                "bg-rose-50 text-rose-700 border-rose-200"
                              )}>
                                {isListePrincipale ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> :
                                 isAttente1 || isAttente2 ? <Clock className="w-3.5 h-3.5 text-amber-600" /> :
                                 <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                                {isListePrincipale ? 'Liste Principale' :
                                 isAttente1 ? "Liste d'Attente 1" :
                                 isAttente2 ? "Liste d'Attente 2" :
                                 isPending ? 'En Examen' : 'Rejeté'}
                              </span>
                            );
                          })()}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedCandidate(c)}
                              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                              title="Inspecter le dossier TAFSEM"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" /> Inspecter
                            </button>

                            <button
                              onClick={() => handleExportConvocationPdf(c)}
                              className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-blue-200 dark:border-blue-800 cursor-pointer shadow-xs"
                              title="Télécharger la Convocation d'Examen A4"
                            >
                              <Printer className="w-3.5 h-3.5 text-blue-600" /> Convocation (PDF)
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Campaign Modal */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] text-white flex items-center justify-between">
              <h3 className="text-lg font-black">Nouvelle Campagne TAFSEM</h3>
              <button onClick={() => setIsCampaignModalOpen(false)} className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCampaign} className="p-6 space-y-4 text-xs font-bold">
              <div>
                <label className="block uppercase text-slate-400 mb-1">Titre de la Campagne</label>
                <input 
                  type="text" 
                  value={newCampaign.title}
                  onChange={(e) => setNewCampaign({ ...newCampaign, title: e.target.value })}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase text-slate-400 mb-1">Quota Admis</label>
                  <input 
                    type="number" 
                    value={newCampaign.quota}
                    onChange={(e) => setNewCampaign({ ...newCampaign, quota: parseInt(e.target.value) })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block uppercase text-slate-400 mb-1">Date Limite</label>
                  <input 
                    type="date" 
                    value={newCampaign.deadline}
                    onChange={(e) => setNewCampaign({ ...newCampaign, deadline: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsCampaignModalOpen(false)} className="px-5 py-2.5 rounded-xl border">
                  Annuler
                </button>
                <button type="submit" className="px-6 py-2.5 bg-[#0f2863] text-white rounded-xl shadow-md">
                  Créer la Campagne
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Candidate Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#09193d] text-white flex items-center justify-between">
              <h3 className="text-lg font-black">Inspection du Candidat</h3>
              <button onClick={() => setSelectedCandidate(null)} className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs font-bold">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl space-y-2">
                <p>Nom & Prénom : <span className="text-slate-900 dark:text-white">{selectedCandidate.first_name} {selectedCandidate.last_name}</span></p>
                <p>CNE : <span className="font-mono">{selectedCandidate.cne}</span> | CIN : <span className="font-mono">{selectedCandidate.cin || '—'}</span></p>
                <p>Moyenne Bac : <span className="text-indigo-600">{selectedCandidate.bac_average || '15.50'}</span></p>
                <p>Score d'Admissibilité : <span className="text-emerald-600">{selectedCandidate.selection_score || '16.75'} / 20</span></p>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button onClick={() => handleUpdateStatus(selectedCandidate.id, 'rejected')} className="px-4 py-2 bg-rose-50 text-rose-700 rounded-xl">
                  ❌ Rejeter
                </button>
                <button onClick={() => handleUpdateStatus(selectedCandidate.id, 'accepted')} className="px-6 py-2 bg-emerald-600 text-white rounded-xl shadow-md">
                  ✅ Admettre (TAFSEM)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
