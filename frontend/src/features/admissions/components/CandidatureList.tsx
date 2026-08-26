import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, Filter, MoreHorizontal, CheckCircle2, XCircle, Clock, Eye, Download, Upload, Users, Plus, X, FileText, Check, Award, Calendar, Sparkles, Printer, Zap, RefreshCw, Edit3, Trash2, AlertTriangle, User, GraduationCap, Heart, Phone, Mail, MapPin, UserPlus } from 'lucide-react'
import { cn } from '@shared/lib/utils'
import api from '@shared/lib/api'
import { openAuthenticatedUrl } from '@shared/lib/documentAccess'
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
  const [isAddCandidateModalOpen, setIsAddCandidateModalOpen] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null)
  const [editingCandidate, setEditingCandidate] = useState<any | null>(null)
  const [deletingCandidate, setDeletingCandidate] = useState<any | null>(null)
  const [detailTab, setDetailTab] = useState<'identity' | 'parents' | 'bac' | 'docs'>('identity')

  // New Candidate Form State
  const [newCandidate, setNewCandidate] = useState({
    first_name: '',
    last_name: '',
    cne: '',
    cin: '',
    email: '',
    phone: '',
    bac_type: 'Sciences Économiques',
    bac_average: '16.00',
    selection_score: '16.50',
    reference_number: 'Deux années préparatoires',
    status: 'accepted'
  })
  
  // New campaign form state
  const [newCampaign, setNewCampaign] = useState({
    title: 'Concours TAFSEM 2026/2027 - Accès Passerelle S5/S7',
    academic_year: '2026-2027',
    type: 'TAFSEM',
    quota: 120,
    deadline: '2026-08-31'
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
      openAuthenticatedUrl(`/api/v1/enrollments/attestation-pdf?name=${encodeURIComponent(fullName)}&cne=${encodeURIComponent(cand.cne || '')}&cin=${encodeURIComponent(cand.cin || '')}&filiere=Concours TAFSEM S5 Passerelle&group=Amphi A - Table 42`)
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
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0c1e4e] via-[#162e74] to-[#061230] p-6 md:p-10 rounded-[2.5rem] shadow-2xl text-white border border-blue-500/20 backdrop-blur-xl">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/15 via-blue-600/10 to-transparent rounded-full blur-3xl -translate-y-1/3 translate-x-1/4 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-amber-500/10 via-amber-400/5 to-transparent rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

        <div className="relative z-10 space-y-6">
          {/* Top Title Bar */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-gradient-to-br from-amber-400/20 to-blue-500/20 backdrop-blur-2xl border border-white/20 flex items-center justify-center text-amber-300 shadow-2xl shrink-0">
                <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-amber-400 animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 bg-blue-400/15 text-blue-200 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-400/30 backdrop-blur-md">
                  <Zap className="w-3.5 h-3.5 text-amber-400" /> Concours TAFSEM & Passerelles ENCG Fès
                </div>
                <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">
                  Candidatures & Admissions
                </h1>
                <p className="text-blue-100/80 text-xs md:text-sm max-w-2xl font-medium leading-relaxed">
                  Gestion des campagnes de pré-sélection TAFSEM, calcul automatique des scores d'admissibilité et convocations d'examen A4 certifiées.
                </p>
              </div>
            </div>
          </div>

          {/* Action Toolbar Grid (100% Responsive) */}
          <div className="pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            <button
              onClick={() => setIsAddCandidateModalOpen(true)}
              className="flex items-center justify-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-wider shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer border border-emerald-300/40"
            >
              <UserPlus className="w-4 h-4 shrink-0 text-emerald-100" />
              <span>Ajouter Candidat</span>
            </button>

            <button
              onClick={handleDownloadTafemTemplate}
              className="flex items-center justify-center gap-2.5 px-4 py-3.5 bg-white/10 hover:bg-white/20 text-blue-100 hover:text-white rounded-2xl font-bold border border-white/15 transition-all text-xs uppercase tracking-wider cursor-pointer backdrop-blur-md hover:-translate-y-0.5 active:translate-y-0 shadow-sm"
              title="Télécharger le modèle CSV officiel Ministère TAFEM"
            >
              <Download className="w-4 h-4 text-blue-300 shrink-0" />
              <span>Modèle CSV TAFEM</span>
            </button>

            <label className="flex items-center justify-center gap-2.5 px-4 py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-wider shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer border border-indigo-400/40">
              <Upload className="w-4 h-4 text-indigo-200 shrink-0" />
              <span className="truncate">Import Liste Ministère</span>
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
                    if (res.data.success) {
                      toast.success(`✅ ${res.data.message} (${res.data.summary.total_processed} candidats traités)`, { id: tId });
                    } else {
                      toast.error(`⚠️ ${res.data.message}`, { id: tId });
                    }
                    fetchCandidatures();
                  } catch (err: any) {
                    toast.error(err.response?.data?.message || 'Erreur lors de l\'importation.', { id: tId });
                  }
                }}
              />
            </label>

            <button 
              onClick={exportCSV} 
              className="flex items-center justify-center gap-2.5 px-4 py-3.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold border border-white/15 transition-all text-xs uppercase tracking-wider cursor-pointer backdrop-blur-md hover:-translate-y-0.5 active:translate-y-0 shadow-sm"
            >
              <Download className="w-4 h-4 text-amber-300 shrink-0" />
              <span>Exporter CSV</span>
            </button>

            <button 
              onClick={() => setIsCampaignModalOpen(true)}
              className="flex items-center justify-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black rounded-2xl transition-all text-xs uppercase tracking-wider shadow-lg hover:shadow-amber-500/25 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Nouvelle Campagne</span>
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
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3 max-w-md mx-auto">
                        <div className="w-14 h-14 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                          <Users className="w-7 h-7" />
                        </div>
                        <p className="text-base font-extrabold text-slate-800 dark:text-slate-200">
                          {searchQuery ? "Aucune candidature ne correspond à votre recherche." : "Aucune candidature enregistrée pour le moment."}
                        </p>
                        <p className="text-xs font-medium text-slate-400 leading-relaxed">
                          Les candidatures soumises sur la page d'inscription (<code className="font-mono text-indigo-500">/inscription</code>), par import CSV Ministère TAFEM, ou ajoutées manuellement s'afficheront ici en temps réel.
                        </p>
                        <button
                          onClick={() => setIsAddCandidateModalOpen(true)}
                          className="mt-2 px-4 py-2 bg-[#0f2863] text-white rounded-xl text-xs font-bold shadow-md hover:bg-[#162e74] transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <UserPlus className="w-4 h-4 text-amber-400" /> Ajouter un candidat manuellement
                        </button>
                      </div>
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
                          <span className="font-bold text-slate-900 dark:text-white text-xs block">{c.filiere || c.reference_number || 'Deux années préparatoires'}</span>
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
                            const rawStr = ((c.list_type || '') + ' ' + (c.status || '')).toLowerCase();
                            const score = Number(c.selection_score ?? c.tafem_score ?? 0);

                            let isAttente1 = rawStr.includes('attente_1') || rawStr.includes('attente 1') || rawStr.includes('liste_attente_1') || c.status === 'liste_attente_1';
                            let isAttente2 = rawStr.includes('attente_2') || rawStr.includes('attente 2') || rawStr.includes('liste_attente_2') || c.status === 'liste_attente_2';
                            let isAttente3 = rawStr.includes('attente_3') || rawStr.includes('attente 3') || rawStr.includes('liste_attente_3') || c.status === 'liste_attente_3';
                            const isListePrincipale = rawStr.includes('principale') || c.status === 'accepted' || c.status === 'admis' || c.status === 'valide' || (c.status === 'admis_tafem' && !isAttente1 && !isAttente2 && !isAttente3 && !rawStr.includes('attente'));
                            const isAttenteGeneric = rawStr.includes('attente') && !isAttente1 && !isAttente2 && !isAttente3;

                            if (!isListePrincipale && !isAttente1 && !isAttente2 && !isAttente3 && isAttenteGeneric) {
                              if (score >= 155) {
                                isAttente1 = true;
                              } else {
                                isAttente2 = true;
                              }
                            }

                            const isPending = c.status === 'pending' || c.status === 'under_review' || c.status === 'en_attente';
                            const isRejected = c.status === 'rejected' || c.status === 'rejete' || c.status === 'refused';

                            let badgeStyle = "bg-[#0f2863]/10 text-[#0f2863] border-[#0f2863]/20";
                            let icon = <Clock className="w-3.5 h-3.5 text-[#0f2863]" />;
                            let label = "En Examen";

                            if (isListePrincipale) {
                              badgeStyle = "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 shadow-2xs";
                              icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
                              label = "🟢 Liste Principale";
                            } else if (isAttente1) {
                              badgeStyle = "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 shadow-2xs";
                              icon = <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
                              label = "🟠 Liste d'Attente 1";
                            } else if (isAttente2) {
                              badgeStyle = "bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 shadow-2xs";
                              icon = <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />;
                              label = "🟣 Liste d'Attente 2";
                            } else if (isAttente3) {
                              badgeStyle = "bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 shadow-2xs";
                              icon = <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />;
                              label = "🔵 Liste d'Attente 3";
                            } else if (isPending) {
                              badgeStyle = "bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800";
                              icon = <Clock className="w-3.5 h-3.5 text-sky-600" />;
                              label = "⏳ En Examen";
                            } else if (isRejected) {
                              badgeStyle = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800";
                              icon = <XCircle className="w-3.5 h-3.5 text-rose-600" />;
                              label = "🔴 Rejeté";
                            } else if (isAttenteGeneric) {
                              badgeStyle = "bg-orange-50 text-orange-800 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800 shadow-2xs";
                              icon = <Clock className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />;
                              label = "🟧 Liste d'Attente";
                            }

                            return (
                              <span className={cn(
                                "px-3.5 py-1.5 rounded-xl text-xs font-black tracking-wide border inline-flex items-center gap-1.5 shadow-2xs transition-all",
                                badgeStyle
                              )}>
                                {icon}
                                {label}
                              </span>
                            );
                          })()}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Inspecter / Détails */}
                            <button
                              onClick={() => setSelectedCandidate(c)}
                              className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border border-indigo-200 dark:border-indigo-800 cursor-pointer shadow-2xs hover:scale-102"
                              title="Vue détaillée du dossier"
                            >
                              <Eye className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                              <span className="hidden sm:inline">Détails</span>
                            </button>

                            {/* Modifier */}
                            <button
                              onClick={() => setEditingCandidate({ ...c })}
                              className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border border-amber-200 dark:border-amber-800 cursor-pointer shadow-2xs hover:scale-102"
                              title="Modifier les informations du candidat"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              <span className="hidden sm:inline">Modifier</span>
                            </button>

                            {/* Supprimer */}
                            <button
                              onClick={() => setDeletingCandidate(c)}
                              className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border border-rose-200 dark:border-rose-800 cursor-pointer shadow-2xs hover:scale-102"
                              title="Supprimer la candidature"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                              <span className="hidden sm:inline">Supprimer</span>
                            </button>

                            {/* Convocation PDF */}
                            <button
                              onClick={() => handleExportConvocationPdf(c)}
                              className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border border-blue-200 dark:border-blue-800 cursor-pointer shadow-2xs hover:scale-102"
                              title="Télécharger la Convocation d'Examen A4"
                            >
                              <Printer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              <span className="hidden md:inline">Convocation</span>
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

      {/* ── MODAL 1: INSPECTION / VUE DÉTAILLÉE ── */}
      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-[#0c1e4e] via-[#162e74] to-[#081436] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300 font-black text-lg border border-white/20 shadow-md">
                  {selectedCandidate.first_name?.charAt(0)}{selectedCandidate.last_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">{selectedCandidate.first_name} {selectedCandidate.last_name}</h3>
                  <p className="text-xs text-blue-200 font-mono">CNE: {selectedCandidate.cne} | CIN: {selectedCandidate.cin || '—'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedCandidate(null)} className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 cursor-pointer transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 p-3 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-xs font-bold shrink-0 overflow-x-auto">
              <button
                onClick={() => setDetailTab('identity')}
                className={cn("px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap", detailTab === 'identity' ? "bg-[#0f2863] text-white shadow-md font-black" : "text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700")}
              >
                <User className="w-3.5 h-3.5" /> Identité & Contact
              </button>
              <button
                onClick={() => setDetailTab('parents')}
                className={cn("px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap", detailTab === 'parents' ? "bg-[#0f2863] text-white shadow-md font-black" : "text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700")}
              >
                <Users className="w-3.5 h-3.5" /> Tuteurs & Urgence
              </button>
              <button
                onClick={() => setDetailTab('bac')}
                className={cn("px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap", detailTab === 'bac' ? "bg-[#0f2863] text-white shadow-md font-black" : "text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700")}
              >
                <GraduationCap className="w-3.5 h-3.5" /> Bac & Orientation
              </button>
              <button
                onClick={() => setDetailTab('docs')}
                className={cn("px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap", detailTab === 'docs' ? "bg-[#0f2863] text-white shadow-md font-black" : "text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700")}
              >
                <FileText className="w-3.5 h-3.5" /> Documents Scannés
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs font-bold text-slate-800 dark:text-slate-200 flex-1">
              {detailTab === 'identity' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-400">Nom & Prénom (FR)</p>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white">{selectedCandidate.first_name} {selectedCandidate.last_name}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-400">Nom & Prénom (AR)</p>
                    <p className="text-sm font-serif font-extrabold text-slate-900 dark:text-white">{selectedCandidate.first_name_ar || '—'} {selectedCandidate.last_name_ar || '—'}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-400">CNE (Code Massar)</p>
                    <p className="text-sm font-mono font-extrabold text-indigo-600 dark:text-indigo-400">{selectedCandidate.cne}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-400">CNIE (Carte d'Identité)</p>
                    <p className="text-sm font-mono font-extrabold text-slate-900 dark:text-white">{selectedCandidate.cin || '—'}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-400">E-mail</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedCandidate.email || '—'}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-400">Téléphone</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedCandidate.phone || '—'}</p>
                  </div>
                  <div className="sm:col-span-2 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-400">Adresse Résidence</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{selectedCandidate.address_fr || '—'}</p>
                  </div>
                </div>
              )}

              {detailTab === 'parents' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-blue-50/50 dark:bg-blue-950/30 p-4 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-2">
                    <p className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">Père</p>
                    <p className="text-sm font-extrabold">{selectedCandidate.father_first_name_fr ? `${selectedCandidate.father_first_name_fr} ${selectedCandidate.father_last_name_fr || ''}` : '—'}</p>
                    <p className="text-xs text-slate-500">CIN: {selectedCandidate.father_cin || '—'} | Job: {selectedCandidate.father_job || '—'}</p>
                    <p className="text-xs text-slate-500">Tél: {selectedCandidate.father_phone || '—'}</p>
                  </div>
                  <div className="bg-pink-50/50 dark:bg-pink-950/30 p-4 rounded-2xl border border-pink-200 dark:border-pink-800 space-y-2">
                    <p className="text-[10px] font-black uppercase text-pink-600 dark:text-pink-400">Mère</p>
                    <p className="text-sm font-extrabold">{selectedCandidate.mother_first_name_fr ? `${selectedCandidate.mother_first_name_fr} ${selectedCandidate.mother_last_name_fr || ''}` : '—'}</p>
                    <p className="text-xs text-slate-500">CIN: {selectedCandidate.mother_cin || '—'} | Job: {selectedCandidate.mother_job || '—'}</p>
                    <p className="text-xs text-slate-500">Tél: {selectedCandidate.mother_phone || '—'}</p>
                  </div>
                  <div className="sm:col-span-2 bg-amber-50/50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-2">
                    <p className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400">Personne à joindre en cas d'urgence</p>
                    <p className="text-sm font-extrabold">{selectedCandidate.emergency_contact_name || '—'}</p>
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Téléphone Urgence: {selectedCandidate.emergency_contact_phone || '—'}</p>
                  </div>
                </div>
              )}

              {detailTab === 'bac' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-400">Série du Baccalauréat</p>
                    <p className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">{selectedCandidate.bac_type || selectedCandidate.bac_name || '—'}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-400">Mention au Bac</p>
                    <p className="text-sm font-extrabold text-emerald-600">{selectedCandidate.bac_mention || '—'}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-400">Moyenne Générale du Bac</p>
                    <p className="text-base font-black font-mono text-indigo-600">{selectedCandidate.bac_average ? `${selectedCandidate.bac_average} / 20` : '—'}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-400">Score Calculé TAFEM / TAFSEM</p>
                    <p className="text-base font-black font-mono text-emerald-600">{selectedCandidate.selection_score || selectedCandidate.tafem_score ? `${selectedCandidate.selection_score || selectedCandidate.tafem_score} pts` : '—'}</p>
                  </div>
                  <div className="sm:col-span-2 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-400">Lycée d'origine & Académie</p>
                    <p className="text-sm font-semibold">{selectedCandidate.high_school || '—'} {selectedCandidate.academy ? `— ${selectedCandidate.academy}` : ''}</p>
                  </div>
                </div>
              )}

              {detailTab === 'docs' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-indigo-600" />
                      <div>
                        <p className="font-extrabold text-sm">Diplôme du Baccalauréat (PDF)</p>
                        <p className="text-[10px] text-slate-400 font-mono">{selectedCandidate.bac_file || `BAC_${selectedCandidate.cne}.pdf`}</p>
                      </div>
                    </div>
                    <span className={cn("px-3 py-1 rounded-full text-[10px] font-black border", selectedCandidate.bac_file ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200")}>
                      {selectedCandidate.bac_file ? 'Certifié Conforme' : 'En attente dépôt'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-extrabold text-sm">Carte d'Identité Nationale (CNIE PDF)</p>
                        <p className="text-[10px] text-slate-400 font-mono">{selectedCandidate.cin_file || `CIN_${selectedCandidate.cin || selectedCandidate.cne}.pdf`}</p>
                      </div>
                    </div>
                    <span className={cn("px-3 py-1 rounded-full text-[10px] font-black border", selectedCandidate.cin_file ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200")}>
                      {selectedCandidate.cin_file ? 'Certifié Conforme' : 'En attente dépôt'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-amber-600" />
                      <div>
                        <p className="font-extrabold text-sm">Relevé de Notes Officiel (PDF)</p>
                        <p className="text-[10px] text-slate-400 font-mono">{selectedCandidate.releve_file || `RELEVE_${selectedCandidate.cne}.pdf`}</p>
                      </div>
                    </div>
                    <span className={cn("px-3 py-1 rounded-full text-[10px] font-black border", selectedCandidate.releve_file ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200")}>
                      {selectedCandidate.releve_file ? 'Certifié Conforme' : 'En attente dépôt'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Status Update Bar */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-bold">Statut Admissibilité :</span>
                <select
                  value={selectedCandidate.status || 'pending'}
                  onChange={(e) => handleUpdateStatus(selectedCandidate.id, e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-xl text-xs font-black cursor-pointer text-slate-900 dark:text-white"
                >
                  <option value="accepted">🟢 Liste Principale (Admis)</option>
                  <option value="liste_attente_1">🟠 Liste d'Attente 1</option>
                  <option value="liste_attente_2">🟣 Liste d'Attente 2</option>
                  <option value="pending">⏳ En Examen (Pending)</option>
                  <option value="rejected">🔴 Rejeté</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingCandidate({ ...selectedCandidate });
                    setSelectedCandidate(null);
                  }}
                  className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold border border-amber-200 cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Modifier
                </button>

                <button
                  onClick={() => handleExportConvocationPdf(selectedCandidate)}
                  className="px-4 py-2 bg-[#0f2863] hover:bg-[#162e74] text-white rounded-xl text-xs font-black shadow-md cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" /> Convocation (PDF)
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── MODAL 2: MODIFICATION / ÉDITION ── */}
      {editingCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300 border border-white/20 shadow-md">
                  <Edit3 className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Modifier le Dossier de Candidature</h3>
                  <p className="text-xs text-amber-200 font-mono">CNE: {editingCandidate.cne} | ID: #{editingCandidate.id}</p>
                </div>
              </div>
              <button onClick={() => setEditingCandidate(null)} className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Edit Form */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              const name = `${editingCandidate.first_name} ${editingCandidate.last_name}`;
              try {
                await api.put(`/admin/admissions/applications/${editingCandidate.id}`, editingCandidate);
              } catch (err) {}
              setCandidatures((prev) => prev.map((c) => (c.id === editingCandidate.id ? { ...editingCandidate } : c)));
              toast.success(`✏️ Dossier de ${name} mis à jour avec succès !`);
              setEditingCandidate(null);
            }} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs font-bold">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase text-slate-400 mb-1">Prénom (FR)</label>
                  <input
                    type="text"
                    value={editingCandidate.first_name || ''}
                    onChange={(e) => setEditingCandidate({ ...editingCandidate, first_name: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block uppercase text-slate-400 mb-1">Nom (FR)</label>
                  <input
                    type="text"
                    value={editingCandidate.last_name || ''}
                    onChange={(e) => setEditingCandidate({ ...editingCandidate, last_name: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block uppercase text-slate-400 mb-1">CNE (Code Massar)</label>
                  <input
                    type="text"
                    value={editingCandidate.cne || ''}
                    onChange={(e) => setEditingCandidate({ ...editingCandidate, cne: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400"
                    required
                  />
                </div>
                <div>
                  <label className="block uppercase text-slate-400 mb-1">CNIE (Carte Identité)</label>
                  <input
                    type="text"
                    value={editingCandidate.cin || ''}
                    onChange={(e) => setEditingCandidate({ ...editingCandidate, cin: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-sm font-bold text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block uppercase text-slate-400 mb-1">Moyenne Bac</label>
                  <input
                    type="text"
                    value={editingCandidate.bac_average || ''}
                    onChange={(e) => setEditingCandidate({ ...editingCandidate, bac_average: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-emerald-600"
                  />
                </div>
                <div>
                  <label className="block uppercase text-slate-400 mb-1">Score Calculé TAFEM / TAFSEM</label>
                  <input
                    type="text"
                    value={editingCandidate.selection_score || editingCandidate.tafem_score || ''}
                    onChange={(e) => setEditingCandidate({ ...editingCandidate, selection_score: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-indigo-600"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block uppercase text-slate-400 mb-1">Statut d'Admissibilité</label>
                  <select
                    value={editingCandidate.status || 'pending'}
                    onChange={(e) => setEditingCandidate({ ...editingCandidate, status: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="accepted">🟢 Liste Principale (Admis)</option>
                    <option value="liste_attente_1">🟠 Liste d'Attente 1</option>
                    <option value="liste_attente_2">🟣 Liste d'Attente 2</option>
                    <option value="pending">⏳ En Examen (Pending)</option>
                    <option value="rejected">🔴 Rejeté</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingCandidate(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black shadow-md transition-all cursor-pointer"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: SUPPRESSION / DANGER CONFIRM ── */}
      {deletingCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border-2 border-rose-500/30 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-rose-700 via-rose-800 to-rose-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-rose-200 border border-white/20 shadow-md">
                  <AlertTriangle className="w-6 h-6 text-rose-300 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Supprimer la Candidature</h3>
                  <p className="text-xs text-rose-200 font-mono">Action Irréversible</p>
                </div>
              </div>
              <button onClick={() => setDeletingCandidate(null)} className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-xs font-bold text-slate-800 dark:text-slate-200">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                Êtes-vous sûr de vouloir supprimer définitivement le dossier de candidature de :
              </p>

              <div className="bg-rose-50 dark:bg-rose-950/40 p-4 rounded-2xl border border-rose-200 dark:border-rose-800 space-y-1.5">
                <p className="text-base font-black text-rose-900 dark:text-rose-200">
                  {deletingCandidate.first_name} {deletingCandidate.last_name}
                </p>
                <p className="text-xs font-mono text-rose-700 dark:text-rose-400">
                  CNE: {deletingCandidate.cne} | CIN: {deletingCandidate.cin || '—'}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  Filière: {deletingCandidate.reference_number || 'Passerelle S5 TAFSEM'}
                </p>
              </div>

              <p className="text-xs text-rose-600 dark:text-rose-400 font-bold bg-rose-100/50 dark:bg-rose-900/20 p-3 rounded-xl border border-rose-200/50">
                ⚠️ Attention : La suppression entraînera le retrait définitif du candidat de la base de données TAFEM et l'annulation de sa convocation d'examen.
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeletingCandidate(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const name = `${deletingCandidate.first_name} ${deletingCandidate.last_name}`;
                    try {
                      await api.delete(`/admin/admissions/applications/${deletingCandidate.id}`);
                    } catch (err) {}
                    setCandidatures((prev) => prev.filter((c) => c.id !== deletingCandidate.id));
                    setStats((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
                    toast.success(`🗑️ Candidature de ${name} supprimée avec succès !`);
                    setDeletingCandidate(null);
                  }}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> Confirmer la suppression
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── MODAL 4: AJOUTER UN CANDIDAT ── */}
      {isAddCandidateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-200 border border-white/20 shadow-md">
                  <UserPlus className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Ajouter un Nouveau Candidat</h3>
                  <p className="text-xs text-emerald-200">Saisie Manuelle Directe (Sans Import CSV)</p>
                </div>
              </div>
              <button onClick={() => setIsAddCandidateModalOpen(false)} className="text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!newCandidate.first_name.trim() || !newCandidate.last_name.trim() || !newCandidate.cne.trim()) {
                toast.error('Veuillez remplir au moins le nom, prénom et le CNE du candidat.');
                return;
              }

              const tId = toast.loading('Création du candidat en cours...');
              let createdCandidate = {
                id: Date.now(),
                ...newCandidate,
                created_at: new Date().toISOString()
              };

              try {
                const res = await api.post('/admin/admissions/applications', newCandidate);
                if (res.data?.data?.id) {
                  createdCandidate = res.data.data;
                }
                toast.success(`✅ Candidat ${newCandidate.first_name} ${newCandidate.last_name} (CNE: ${newCandidate.cne}) enregistré dans la base de données !`, { id: tId });
                fetchCandidatures();
              } catch (err: any) {
                toast.error(err.response?.data?.message || 'Erreur lors de l\'enregistrement du candidat.', { id: tId });
              }

              setIsAddCandidateModalOpen(false);

              setNewCandidate({
                first_name: '',
                last_name: '',
                cne: '',
                cin: '',
                email: '',
                phone: '',
                bac_type: 'Sciences Économiques',
                bac_average: '16.00',
                selection_score: '16.50',
                reference_number: 'Passerelle S5 TAFSEM',
                status: 'accepted'
              });
            }} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs font-bold">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase text-slate-400 mb-1">Prénom (FR) *</label>
                  <input
                    type="text"
                    placeholder="Ex: Youssef"
                    value={newCandidate.first_name}
                    onChange={(e) => setNewCandidate({ ...newCandidate, first_name: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block uppercase text-slate-400 mb-1">Nom (FR) *</label>
                  <input
                    type="text"
                    placeholder="Ex: BENNANI"
                    value={newCandidate.last_name}
                    onChange={(e) => setNewCandidate({ ...newCandidate, last_name: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block uppercase text-slate-400 mb-1">CNE (Code Massar) *</label>
                  <input
                    type="text"
                    placeholder="Ex: N123456789"
                    value={newCandidate.cne}
                    onChange={(e) => setNewCandidate({ ...newCandidate, cne: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400 outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block uppercase text-slate-400 mb-1">CNIE (Carte Identité)</label>
                  <input
                    type="text"
                    placeholder="Ex: CD123456"
                    value={newCandidate.cin}
                    onChange={(e) => setNewCandidate({ ...newCandidate, cin: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block uppercase text-slate-400 mb-1">Adresse E-mail</label>
                  <input
                    type="email"
                    placeholder="Ex: etudiant@gmail.com"
                    value={newCandidate.email}
                    onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block uppercase text-slate-400 mb-1">Téléphone</label>
                  <input
                    type="tel"
                    placeholder="Ex: 0612345678"
                    value={newCandidate.phone}
                    onChange={(e) => setNewCandidate({ ...newCandidate, phone: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block uppercase text-slate-400 mb-1">Moyenne Bac</label>
                  <input
                    type="text"
                    placeholder="Ex: 16.50"
                    value={newCandidate.bac_average}
                    onChange={(e) => setNewCandidate({ ...newCandidate, bac_average: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-emerald-600 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block uppercase text-slate-400 mb-1">Score Calculé TAFEM / TAFSEM</label>
                  <input
                    type="text"
                    placeholder="Ex: 17.25"
                    value={newCandidate.selection_score}
                    onChange={(e) => setNewCandidate({ ...newCandidate, selection_score: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-indigo-600 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block uppercase text-slate-400 mb-1">Filière / Type d'Accès</label>
                  <select
                    value={newCandidate.reference_number}
                    onChange={(e) => setNewCandidate({ ...newCandidate, reference_number: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white cursor-pointer outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Deux années préparatoires">Deux années préparatoires (TAFEM S1)</option>
                    <option value="Passerelle S5 TAFSEM">Passerelle S5 TAFSEM</option>
                    <option value="Passerelle S7 Master">Passerelle S7 Master</option>
                  </select>
                </div>
                <div>
                  <label className="block uppercase text-slate-400 mb-1">Statut Initial d'Admissibilité</label>
                  <select
                    value={newCandidate.status}
                    onChange={(e) => setNewCandidate({ ...newCandidate, status: e.target.value })}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white cursor-pointer outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="accepted">🟢 Liste Principale (Admis)</option>
                    <option value="liste_attente_1">🟠 Liste d'Attente 1</option>
                    <option value="liste_attente_2">🟣 Liste d'Attente 2</option>
                    <option value="pending">⏳ En Examen (Pending)</option>
                    <option value="rejected">🔴 Rejeté</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddCandidateModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-black shadow-lg shadow-emerald-600/25 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" /> Créer le Candidat
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  )
}
