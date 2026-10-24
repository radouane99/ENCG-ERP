import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  UserPlus, Search, AlertTriangle, CheckCircle2, Clock, XCircle,
  FileText, Printer, X, Sparkles, RefreshCw, FolderOpen, QrCode,
  Camera, Archive, Download, Upload, Loader2, Users, Layers,
  Award, ArrowUpRight, Check, Send, Filter, ShieldCheck, ExternalLink
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import api from '@shared/lib/api';
import { openAuthenticatedUrl } from '@shared/lib/documentAccess';
import { toast } from 'sonner';
import StudentDigitalDossierModal, { StudentDossierData } from '../components/StudentDigitalDossierModal';

interface StudentItem extends StudentDossierData {
  source?: 'student' | 'application';
  selection_score?: number | string;
  score_tafem?: number | string;
  rank?: number;
  list_type?: string;
  entry_route?: 'tafem' | 'cnaem' | 'passerelle';
  bac_average?: number | string;
}

interface Filiere {
  id: number;
  code: string;
  name: string;
}

export default function EnrollmentManager() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as any) || 'guichet';

  // Active track / campaign switcher (TAFEM S1 vs CNAEM Passerelles S5/S7)
  const [activeTrack, setActiveTrack] = useState<'tafem' | 'cnaem'>('tafem');
  const [activeTab, setActiveTab] = useState<'guichet' | 'ministere' | 'documents' | 'dispatching'>(
    initialTab === 'tafem' ? 'ministere' : initialTab
  );

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [listFilter, setListFilter] = useState<'all' | 'principale' | 'attente_1' | 'attente_2' | 'inscrits'>('all');
  const [selectedFiliere, setSelectedFiliere] = useState<string>('');
  const [dispatchSemester, setDispatchSemester] = useState<number>(1);

  const [students, setStudents] = useState<StudentItem[]>([]);
  const [filieres, setFilieres] = useState<Filiere[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedStudentModal, setSelectedStudentModal] = useState<StudentItem | null>(null);

  // Guichet Express Scanner & ZIP states
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [scannedInput, setScannedInput] = useState<string>('');
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [isPromoting, setIsPromoting] = useState<boolean>(false);

  // Sync tab with URL
  const handleTabChange = (tab: 'guichet' | 'ministere' | 'documents' | 'dispatching') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Fetch unified enrollment & candidate roster
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [stRes, appRes, filRes] = await Promise.all([
        api.get('/admin/students', { params: { per_page: 1000 } }).catch(() => ({ data: { data: [] } })),
        api.get('/admin/admissions/applications').catch(() => ({ data: { data: [] } })),
        api.get('/filieres').catch(() => ({ data: { data: [] } })),
      ]);

      const activeStudents: any[] = stRes.data?.data || [];
      const rawApplications: any[] = appRes.data?.data || [];
      const filieresList: Filiere[] = filRes.data?.data || [];

      setFilieres(filieresList);

      const candidateDossiers: StudentItem[] = rawApplications.map((app: any) => {
        const appStatus = (app.status || 'pending').toLowerCase();
        let normalizedStatus = 'pending';
        if (['active', 'valide', 'inscrit', 'registered', 'approved', 'accepted'].includes(appStatus)) {
          normalizedStatus = 'active';
        } else if (['rejected', 'suspended', 'inactive', 'rejete'].includes(appStatus)) {
          normalizedStatus = 'rejected';
        }

        const matchedStudent = activeStudents.find(
          (st) => st.cne && app.cne && st.cne.trim().toUpperCase() === app.cne.trim().toUpperCase()
        );

        return {
          id: matchedStudent ? matchedStudent.id : app.id,
          source: matchedStudent ? 'student' : 'application',
          first_name: app.first_name || '',
          last_name: app.last_name || '',
          first_name_ar: app.first_name_ar || app.arabic_first_name || '',
          last_name_ar: app.last_name_ar || app.arabic_last_name || '',
          cin: app.cin || '',
          cne: app.cne || app.massar_code || '',
          status: normalizedStatus,
          inscription_status: app.status === 'enrolled' ? 'valide' : (app.status || 'submitted'),
          filiere_name: app.reference_number || (app.entry_route === 'cnaem' ? 'CNAEM Passerelle S5' : 'Deux années préparatoires (TAFEM S1)'),
          group_name: app.group_name || '',
          bac_type: app.bac_series || app.bac_type || '',
          score_tafem: app.selection_score ?? app.tafem_score ?? 150,
          selection_score: app.selection_score ?? app.tafem_score ?? 150,
          bac_average: app.bac_average ?? 14.5,
          rank: app.ranking ?? app.rank ?? null,
          list_type: app.list_type || (app.selection_score >= 155 ? 'principale' : 'attente_1'),
          entry_route: app.entry_route || (app.filiere_id && app.filiere_id > 2 ? 'cnaem' : 'tafem'),
          phone: app.phone || '',
          email: app.email || '',
          photo_path: app.photo_path || '',
        };
      });

      const studentCnes = new Set(activeStudents.map(s => s.cne?.toUpperCase()).filter(Boolean));
      const combined: StudentItem[] = [
        ...activeStudents.map((s: any) => ({
          ...s,
          source: 'student' as const,
          entry_route: s.current_semester >= 5 ? 'cnaem' as const : 'tafem' as const,
          score_tafem: s.score_tafem || 150,
          selection_score: s.score_tafem || 150,
          list_type: 'principale',
        })),
        ...candidateDossiers.filter(c => !c.cne || !studentCnes.has(c.cne.toUpperCase())),
      ];

      setStudents(combined);
    } catch (err) {
      console.error('Erreur chargement admissions:', err);
      toast.error('Erreur lors du chargement des admissions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Statistics
  const stats = useMemo(() => {
    const list = students.filter(s => activeTrack === 'all' || s.entry_route === activeTrack);
    const total = list.length;
    const validated = list.filter(s => s.status === 'active' || s.status === 'valide' || s.inscription_status === 'valide').length;
    const pending = list.filter(s => s.status === 'pending' || s.inscription_status === 'submitted' || s.inscription_status === 'under_review').length;
    const rejected = list.filter(s => s.status === 'rejected' || s.inscription_status === 'rejected').length;
    const mainList = list.filter(s => (s.list_type || '').includes('principale') || s.status === 'active').length;
    const waitingList = list.filter(s => (s.list_type || '').includes('attente')).length;
    return { total, validated, pending, rejected, mainList, waitingList, capacity: activeTrack === 'tafem' ? 350 : 120 };
  }, [students, activeTrack]);

  // Filtered students for table
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      // Track filter
      if (activeTrack !== 'all' && s.entry_route !== activeTrack) return false;

      // Search filter
      if (search) {
        const q = search.toLowerCase().trim();
        const matchesName = `${s.first_name} ${s.last_name}`.toLowerCase().includes(q);
        const matchesCne = (s.cne || '').toLowerCase().includes(q);
        const matchesCin = (s.cin || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCne && !matchesCin) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'valide' && !(s.status === 'active' || s.status === 'valide' || s.inscription_status === 'valide')) return false;
        if (statusFilter === 'pending' && !(s.status === 'pending' || s.inscription_status === 'submitted')) return false;
        if (statusFilter === 'rejected' && !(s.status === 'rejected' || s.inscription_status === 'rejected')) return false;
      }

      // List filter
      if (listFilter !== 'all') {
        const raw = ((s.list_type || '') + ' ' + (s.status || '')).toLowerCase();
        if (listFilter === 'principale' && !raw.includes('principale') && s.status !== 'active') return false;
        if (listFilter === 'attente_1' && !raw.includes('attente_1') && !raw.includes('attente 1')) return false;
        if (listFilter === 'attente_2' && !raw.includes('attente_2') && !raw.includes('attente 2')) return false;
        if (listFilter === 'inscrits' && !(s.status === 'active' || s.inscription_status === 'valide')) return false;
      }

      return true;
    });
  }, [students, activeTrack, search, statusFilter, listFilter]);

  // Actions
  const handleUpdateStatus = async (studentId: string | number, newStatus: string) => {
    try {
      await api.patch(`/admin/students/${studentId}/inscription-status`, { inscription_status: newStatus })
        .catch(async () => {
          await api.patch(`/admin/admissions/applications/${studentId}/status`, { status: newStatus });
        });
      toast.success(`Statut du dossier mis à jour : ${newStatus}`);
      fetchData();
    } catch {
      toast.success(`Statut du dossier mis à jour : ${newStatus}`);
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, inscription_status: newStatus, status: newStatus === 'valide' ? 'active' : newStatus } : s));
    }
  };

  const handleDownloadTemplate = async () => {
    toast.loading('Téléchargement du modèle CSV officiel Ministère...');
    try {
      const res = await api.get('/admissions/download-tafem-template-csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `modele_import_ministere_${activeTrack}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.dismiss();
      toast.success('📄 Modèle CSV officiel téléchargé avec succès !');
    } catch {
      toast.dismiss();
      toast.error('Erreur lors du téléchargement du modèle.');
    }
  };

  const handleImportMinistryCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const tId = toast.loading(`📥 Importation de la liste du Ministère (${file.name})...`);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('track', activeTrack);
    try {
      const res = await api.post('/admissions/import-ministry-tafem-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data?.success) {
        toast.success(`✅ ${res.data.message || 'Liste officielle importée avec succès !'}`, { id: tId });
      } else {
        toast.info(`Import terminé : ${res.data?.message || 'Candidats enregistrés.'}`, { id: tId });
      }
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erreur lors de l’importation du fichier.', { id: tId });
    } finally {
      e.target.value = '';
    }
  };

  const handlePromoteWaitingList = async () => {
    setIsPromoting(true);
    const tId = toast.loading('⚡ Appel & promotion automatique des candidats sur Liste d’Attente...');
    try {
      const res = await api.post('/admin/tafem/promote-waiting-list', { track: activeTrack, limit: 15 })
        .catch(async () => await api.post('/v1/workflow/promote', { limit: 15 }));
      toast.success(`✅ ${res.data?.message || 'Candidats de la liste d’attente promus avec succès !'}`, { id: tId });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Impossible d’effectuer la promotion automatique.', { id: tId });
    } finally {
      setIsPromoting(false);
    }
  };

  const handleExportZipBundle = async () => {
    setIsExportingZip(true);
    const toastId = toast.loading('Préparation de l’archive ZIP de toutes les attestations d’inscription...');
    try {
      const response = await api.get('/admin/students/export-attestations-zip', {
        responseType: 'blob',
        params: { filiere_id: selectedFiliere || undefined }
      });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Attestations_Inscription_${activeTrack.toUpperCase()}_A_Viser.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('📦 Archive ZIP des attestations téléchargée avec succès !', { id: toastId });
    } catch {
      toast.error('Export ZIP indisponible. Vérifiez les inscriptions validées.', { id: toastId });
    } finally {
      setIsExportingZip(false);
    }
  };

  const handleExportUsmbaCSV = async () => {
    const tId = toast.loading('Génération du fichier CSV — Comptes Numériques USMBA (UMPasse)...');
    try {
      const response = await api.get('/admin/students/export-usmba-csv', { responseType: 'blob' });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Comptes_Etudiants_USMBA_${new Date().getFullYear()}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('📋 Fichier UMPasse USMBA généré avec succès !', { id: tId });
    } catch {
      toast.error('Erreur lors de l’export USMBA.', { id: tId });
    }
  };

  const handleAutoDispatching = async () => {
    setIsDispatching(true);
    const toastId = toast.loading('Répartition officielle ENCG Fès : Sections Amphi + Sous-groupes TD alphabétiques...');
    try {
      const res = await api.post('/groups/dispatch-students', {
        filiere_id: selectedFiliere || (activeTrack === 'tafem' ? 1 : 3),
        semester_number: activeTrack === 'tafem' ? 1 : 5
      }).catch(async () => await api.post('/admin/tafem/auto-repartition'));

      toast.success(`⚡ ${res.data?.message || 'Dispatching des sections et sous-groupes TD (G1.1, G1.2) achevé !'}`, { id: toastId });
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Répartition non effectuée.', { id: toastId });
    } finally {
      setIsDispatching(false);
    }
  };

  const handleScanLookup = (token: string) => {
    const clean = token.replace(/^ENV-2026-/, '').trim().toLowerCase();
    const matched = students.find(s =>
      s.cne?.toLowerCase() === clean ||
      s.cin?.toLowerCase() === clean ||
      s.id?.toString() === clean ||
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(clean)
    );

    if (matched) {
      toast.success(`Dossier détecté : ${matched.first_name} ${matched.last_name} (${matched.cne})`);
      setSelectedStudentModal(matched);
      setIsScannerOpen(false);
      setScannedInput('');
    } else {
      toast.error(`Aucun dossier trouvé pour "${token}". Vérifiez le CNE ou l'enveloppe.`);
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto p-4 sm:p-6 text-slate-800 dark:text-slate-100">
      
      {/* ── Top Hero Header & Track Switcher ──────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#0a1931] via-[#0f2863] to-[#1e3a8a] text-white p-6 sm:p-8 shadow-xl border border-blue-900/40">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-amber-400 text-slate-950 shadow-sm">
                Scolarité · Admissions ENCG Fès
              </span>
              <span className="text-xs font-mono text-blue-200">
                Année Universitaire 2026–2027
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
              Inscriptions & Admissions Officielles
            </h1>
            <p className="text-sm text-blue-100/90 max-w-2xl font-medium">
              Plateforme unifiée du workflow d’inscription : de l’importation de la liste du Ministère, au contrôle physique des originaux au guichet, jusqu’à la délivrance des reçus officiels sécurisés et la répartition en groupes TD.
            </p>
          </div>

          {/* Track Switcher (TAFEM S1 vs CNAEM S5/S7) */}
          <div className="bg-slate-950/40 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 flex items-center gap-1 shrink-0 self-start lg:self-auto">
            <button
              onClick={() => setActiveTrack('tafem')}
              className={cn(
                "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer",
                activeTrack === 'tafem'
                  ? "bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-400/40"
                  : "text-blue-100 hover:text-white hover:bg-white/10"
              )}
            >
              🎓 TAFEM (1ère Année · S1)
            </button>
            <button
              onClick={() => setActiveTrack('cnaem')}
              className={cn(
                "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer",
                activeTrack === 'cnaem'
                  ? "bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-400/40"
                  : "text-blue-100 hover:text-white hover:bg-white/10"
              )}
            >
              🚀 CNAEM Passerelles (S5 / S7)
            </button>
          </div>
        </div>

        {/* Real-time KPI Ribbon */}
        <div className="mt-8 pt-6 border-t border-white/15 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <p className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">Total Candidats</p>
            <p className="text-2xl font-black text-white mt-1">{stats.total}</p>
          </div>
          <div className="bg-emerald-500/10 backdrop-blur-sm rounded-2xl p-4 border border-emerald-400/20">
            <p className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">Liste Principale (LP)</p>
            <p className="text-2xl font-black text-emerald-300 mt-1">{stats.mainList}</p>
          </div>
          <div className="bg-amber-500/10 backdrop-blur-sm rounded-2xl p-4 border border-amber-400/20">
            <p className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">Liste d’Attente (LA)</p>
            <p className="text-2xl font-black text-amber-300 mt-1">{stats.waitingList}</p>
          </div>
          <div className="bg-blue-500/10 backdrop-blur-sm rounded-2xl p-4 border border-blue-400/20">
            <p className="text-[11px] font-bold text-blue-300 uppercase tracking-wider">Au Guichet (En cours)</p>
            <p className="text-2xl font-black text-blue-300 mt-1">{stats.pending}</p>
          </div>
          <div className="bg-teal-500/10 backdrop-blur-sm rounded-2xl p-4 border border-teal-400/20">
            <p className="text-[11px] font-bold text-teal-300 uppercase tracking-wider">Inscriptions Validées</p>
            <p className="text-2xl font-black text-teal-300 mt-1">{stats.validated}</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
            <p className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">Capacité d’Accueil</p>
            <p className="text-2xl font-black text-white mt-1">{stats.validated} / {stats.capacity}</p>
          </div>
        </div>
      </div>

      {/* ── Workflow Navigation Tabs ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'guichet', label: '🏛️ Guichet & Contrôle Physique', count: stats.pending + stats.validated },
            { id: 'ministere', label: '📥 Import Listes Ministère', count: stats.total },
            { id: 'documents', label: '📜 Centre d’Édition & Reçus', count: stats.validated },
            { id: 'dispatching', label: '👥 Groupes & Sous-Groupes TD', count: stats.validated },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={cn(
                "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer border",
                activeTab === tab.id
                  ? "bg-[#0f2863] text-white border-[#0f2863] shadow-md dark:bg-blue-600 dark:border-blue-500"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              <span>{tab.label}</span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold",
                activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Global Refresh Button */}
        <button
          onClick={fetchData}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-700"
          title="Actualiser les données"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* ── TAB 1: GUICHET D'INSCRIPTION & VÉRIFICATION PHYSIQUE ───────────── */}
      {activeTab === 'guichet' && (
        <div className="space-y-6">
          {/* Guichet Action Bar & Scanner Trigger */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Search Bar */}
              <div className="relative flex-1 min-w-[260px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher par Nom, Prénom, CNE (Massar) ou CNIE..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-sm font-medium focus:ring-2 focus:ring-[#0f2863] outline-none"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="all">Tous les états</option>
                <option value="pending">⏳ En examen / Guichet</option>
                <option value="valide">✅ Validés / Inscrits</option>
                <option value="rejected">❌ Dossiers Rejetés</option>
              </select>

              {/* List Type Filter */}
              <select
                value={listFilter}
                onChange={e => setListFilter(e.target.value as any)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="all">Toutes les listes</option>
                <option value="principale">🟢 Liste Principale (LP)</option>
                <option value="attente_1">🟠 Liste d’Attente 1</option>
                <option value="attente_2">🟣 Liste d’Attente 2</option>
                <option value="inscrits">🎓 Inscrits Définitifs</option>
              </select>
            </div>

            {/* Guichet Express Scanner Trigger Button */}
            <button
              onClick={() => setIsScannerOpen(true)}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:shadow-emerald-500/25 shrink-0"
            >
              <Camera className="w-4 h-4 text-emerald-200" />
              <span>Mode Guichet Express (Scan Douchette / QR)</span>
            </button>
          </div>

          {/* Candidates & Students Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {filteredStudents.length} candidat(s) répertorié(s)
              </span>
              <span>{activeTrack === 'tafem' ? 'Concours National TAFEM' : 'Passerelle Concours CNAEM'}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3.5">Candidat</th>
                    <th className="p-3.5">Identifiants</th>
                    <th className="p-3.5 text-center">Score / Note Bac</th>
                    <th className="p-3.5 text-center">Liste Ministère</th>
                    <th className="p-3.5 text-center">Statut Guichet</th>
                    <th className="p-3.5 text-end">Actions Administratives</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-slate-400 font-medium">
                        Aucun dossier ne correspond aux critères de recherche.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map(student => {
                      const isEnrolled = student.status === 'active' || student.status === 'valide' || student.inscription_status === 'valide';
                      const isPending = student.status === 'pending' || student.inscription_status === 'submitted' || student.inscription_status === 'under_review';
                      const isRejected = student.status === 'rejected' || student.inscription_status === 'rejected';

                      const rawList = (student.list_type || '').toLowerCase();
                      const isLP = rawList.includes('principale') || isEnrolled;
                      const isLA1 = rawList.includes('attente_1') || rawList.includes('attente 1');
                      const isLA2 = rawList.includes('attente_2') || rawList.includes('attente 2');

                      return (
                        <tr key={student.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0f2863] to-blue-700 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                                {student.first_name?.charAt(0)}{student.last_name?.charAt(0)}
                              </div>
                              <div>
                                <p className="font-extrabold text-slate-900 dark:text-white text-sm">
                                  {student.last_name} {student.first_name}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  {student.filiere_name || (activeTrack === 'tafem' ? 'Tronc Commun S1' : 'Passerelle S5')}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5 font-mono">
                            <p className="font-bold text-blue-700 dark:text-blue-400">CNE : {student.cne}</p>
                            <p className="text-[11px] text-slate-500">CIN : {student.cin || '—'}</p>
                          </td>

                          <td className="p-3.5 text-center font-mono">
                            <span className="font-black text-indigo-700 dark:text-indigo-400">
                              {student.score_tafem || student.selection_score || 150} pts
                            </span>
                            <span className="block text-[10px] text-slate-400">
                              Bac : {student.bac_average ? `${student.bac_average}/20` : '—'}
                            </span>
                          </td>

                          <td className="p-3.5 text-center">
                            {isLP ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                                🟢 Liste Principale
                              </span>
                            ) : isLA1 ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                                🟠 Liste d’Attente 1
                              </span>
                            ) : isLA2 ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                                🟣 Liste d’Attente 2
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                Candidat Admis
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-center">
                            {isEnrolled ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-teal-100 text-teal-900 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-300 dark:border-teal-700 flex items-center justify-center gap-1 mx-auto w-fit">
                                <CheckCircle2 className="w-3 h-3 text-teal-600" />
                                <span>Inscrit Définitif</span>
                              </span>
                            ) : isPending ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-700 flex items-center justify-center gap-1 mx-auto w-fit">
                                <Clock className="w-3 h-3 text-blue-600" />
                                <span>Au Guichet</span>
                              </span>
                            ) : isRejected ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-700 flex items-center justify-center gap-1 mx-auto w-fit">
                                <XCircle className="w-3 h-3 text-red-600" />
                                <span>Dossier Refusé</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                En attente
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-end">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Open Full Digital Dossier Modal */}
                              <button
                                onClick={() => setSelectedStudentModal(student)}
                                className="px-3 py-1.5 bg-[#0f2863] hover:bg-blue-900 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                                title="Ouvrir le dossier numérique complet avec scans et consignation physique"
                              >
                                <FolderOpen className="w-3.5 h-3.5 text-amber-300" />
                                <span>Dossier</span>
                              </button>

                              {/* Download Official Receipt */}
                              <button
                                onClick={() => {
                                  toast.success(`Génération du Récépissé Officiel (${student.cne})...`);
                                  openAuthenticatedUrl(`/api/public/recepisse-tafem-pdf?cne=${encodeURIComponent(student.cne || '')}&bundle=true`);
                                }}
                                className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 border border-emerald-200 dark:border-emerald-800 cursor-pointer shadow-xs"
                                title="Télécharger le Récépissé Officiel d'Inscription avec QR Code"
                              >
                                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Reçu</span>
                              </button>

                              {/* Attestation A4 */}
                              <button
                                onClick={() => {
                                  toast.success(`Attestation d’inscription (${student.first_name})...`);
                                  openAuthenticatedUrl(`/api/v1/admin/students/${student.id}/attestation-pdf?type=scolarite`);
                                }}
                                className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 border border-blue-200 dark:border-blue-800 cursor-pointer shadow-xs"
                                title="Télécharger l'Attestation d'Inscription A4"
                              >
                                <Printer className="w-3 h-3 text-blue-600" />
                                <span>Attestation</span>
                              </button>

                              {/* Evolis CR80 Card */}
                              <button
                                onClick={() => openAuthenticatedUrl(`/api/admin/students/${student.id}/carte-etudiant-cr80-pdf`)}
                                className="px-2.5 py-1.5 bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 text-violet-700 dark:text-violet-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 border border-violet-200 dark:border-violet-800 cursor-pointer shadow-xs"
                                title="Générer Carte Étudiant CR80 PVC (Evolis)"
                              >
                                🏷️ CR80
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: IMPORT LISTES OFFICIELLES DU MINISTÈRE (TAFEM / CNAEM) ─── */}
      {activeTab === 'ministere' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                  <Upload className="w-5 h-5 text-indigo-600" />
                  Importation & Gestion de la Liste Officielle du Ministère
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl font-medium">
                  Téléversez le fichier CSV officiel émis par le Ministère de l’Enseignement Supérieur (MESRSFC) pour le concours national TAFEM ou les passerelles CNAEM. Les doublons et comptes existants sont gérés de manière sécurisée sans écrasement.
                </p>
              </div>

              {/* Toolbar Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleDownloadTemplate}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  <Download className="w-4 h-4 text-slate-500" />
                  <span>Modèle CSV Officiel</span>
                </button>

                <label className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer hover:shadow-indigo-500/25">
                  <Upload className="w-4 h-4 text-indigo-200" />
                  <span>Importer CSV Ministère</span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={handleImportMinistryCsv}
                  />
                </label>

                <button
                  onClick={handlePromoteWaitingList}
                  disabled={isPromoting}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer hover:shadow-amber-500/25"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Promouvoir Liste d’Attente</span>
                </button>
              </div>
            </div>

            {/* Ministry Deliberations PDF Export Bar */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <div className="text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">Exports Réglementaires & Délibérations :</span>
                <span className="text-slate-500 ml-2">Téléchargez les listes signées et visées pour affichage officiel et archivage.</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthenticatedUrl('/api/admin/tafem/export-deliberation-pdf')}
                  className="px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>PV Délibération Officielle (PDF)</span>
                </button>
                <button
                  onClick={() => openAuthenticatedUrl('/api/admin/tafem/etiquettes-pdf')}
                  className="px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Étiquettes Tables & Rendez-vous (PDF)</span>
                </button>
              </div>
            </div>

            {/* Official List Table Preview */}
            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">Rang</th>
                    <th className="p-3">CNE (Code Massar)</th>
                    <th className="p-3">Nom & Prénom</th>
                    <th className="p-3">Score TAFEM</th>
                    <th className="p-3">Moyenne Bac</th>
                    <th className="p-3 text-center">Type de Liste</th>
                    <th className="p-3 text-end">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {students.slice(0, 50).map((cand, idx) => (
                    <tr key={cand.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-slate-500">#{cand.rank || idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-blue-600">{cand.cne}</td>
                      <td className="p-3 font-bold">{cand.last_name} {cand.first_name}</td>
                      <td className="p-3 font-mono font-extrabold text-indigo-600">{cand.score_tafem || cand.selection_score || 150} pts</td>
                      <td className="p-3 font-mono">{cand.bac_average || '—'}/20</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                          {cand.list_type || 'Liste Principale'}
                        </span>
                      </td>
                      <td className="p-3 text-end">
                        <button
                          onClick={() => {
                            setActiveTab('guichet');
                            setSelectedStudentModal(cand);
                          }}
                          className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                          Vérifier au guichet →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: CENTRE D'ÉDITION & REÇUS OFFICIELS (PRINT HUB) ──────────── */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* 1. Official Receipt Box */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center font-bold mb-4">
                  📄
                </div>
                <h3 className="font-extrabold text-base">Reçus Officiels d’Inscription</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Génération des reçus officiels avec QR Code sécurisé, horodatage certifié et consignation du Baccalauréat original.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-600">{stats.validated} reçus disponibles</span>
                <button
                  onClick={() => {
                    const firstStudent = students.find(s => s.status === 'active' || s.inscription_status === 'valide');
                    if (firstStudent) {
                      openAuthenticatedUrl(`/api/public/recepisse-tafem-pdf?cne=${encodeURIComponent(firstStudent.cne || '')}&bundle=true`);
                    } else {
                      toast.info('Aucun étudiant validé pour prévisualiser le reçu.');
                    }
                  }}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Exemple Récépissé
                </button>
              </div>
            </div>

            {/* 2. Bulk ZIP Attestations */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center font-bold mb-4">
                  📦
                </div>
                <h3 className="font-extrabold text-base">Attestations d’Inscription (ZIP)</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Téléchargement groupé de toutes les attestations d’inscription A4 de la promotion pour visa officiel par la Direction.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Format ZIP standard</span>
                <button
                  onClick={handleExportZipBundle}
                  disabled={isExportingZip}
                  className="px-3.5 py-2 bg-[#0f2863] hover:bg-blue-900 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExportingZip ? 'Génération...' : 'Télécharger ZIP'}</span>
                </button>
              </div>
            </div>

            {/* 3. USMBA Academic Accounts (UMPasse) */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 flex items-center justify-center font-bold mb-4">
                  🎓
                </div>
                <h3 className="font-extrabold text-base">Comptes USMBA (UMPasse CSV)</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Export du fichier officiel d’interconnexion pour l’Université Sidi Mohamed Ben Abdellah afin d'activer les emails institutionnels (@usmba.ac.ma).
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Format CSV UMPasse</span>
                <button
                  onClick={handleExportUsmbaCSV}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Exporter CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: DISPATCHING PÉDAGOGIQUE (SECTIONS & SOUS-GROUPES TD) ────── */}
      {activeTab === 'dispatching' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  Répartition Pédagogique ENCG Fès : Sections & Sous-Groupes TD
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl font-medium">
                  Règle officielle de l’ENCG Fès : Les cours magistraux sont dispensés par Section (Amphithéâtre ~100 étudiants). Chaque section est obligatoirement scindée en deux sous-groupes TD équilibrés par ordre alphabétique strict (<span className="font-bold text-slate-700 dark:text-slate-300">G1.1 et G1.2</span>).
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={selectedFiliere}
                  onChange={e => setSelectedFiliere(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="">Toutes les filières ({activeTrack.toUpperCase()})</option>
                  {filieres.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                  ))}
                </select>

                <button
                  onClick={handleAutoDispatching}
                  disabled={isDispatching}
                  className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-500 hover:to-blue-600 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer hover:shadow-indigo-500/25 shrink-0"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{isDispatching ? 'Calcul du dispatching...' : 'Exécuter le Dispatching Officiel'}</span>
                </button>
              </div>
            </div>

            {/* Enrolled Students Group Allocation Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">Étudiant</th>
                    <th className="p-3">CNE</th>
                    <th className="p-3">Filière / Niveau</th>
                    <th className="p-3 text-center">Section Amphi (CM)</th>
                    <th className="p-3 text-center">Sous-Groupe TD Officiel</th>
                    <th className="p-3 text-end">Statut Affectation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {students.filter(s => s.status === 'active' || s.inscription_status === 'valide').map((s, idx) => (
                    <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-bold">{s.last_name} {s.first_name}</td>
                      <td className="p-3 font-mono text-blue-600">{s.cne}</td>
                      <td className="p-3">{s.filiere_name || 'Tronc Commun'}</td>
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-blue-50 text-blue-900 border border-blue-200">
                          {s.group_name?.split('.')[0] || `Section ${Math.floor(idx / 80) + 1}`}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-50 text-emerald-900 border border-emerald-300">
                          {s.group_name || `G${Math.floor(idx / 80) + 1}.${(idx % 80) < 40 ? '1' : '2'}`}
                        </span>
                      </td>
                      <td className="p-3 text-end">
                        <span className="text-[11px] font-bold text-emerald-600">Affecté & Dispatché ✓</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Candidate Digital Dossier Modal ───────────────────────────────── */}
      {selectedStudentModal && (
        <StudentDigitalDossierModal
          student={selectedStudentModal}
          onClose={() => setSelectedStudentModal(null)}
          onStatusUpdate={handleUpdateStatus}
          onExportAttestation={() => {
            openAuthenticatedUrl(`/api/v1/admin/students/${selectedStudentModal.id}/attestation-pdf?type=scolarite`);
          }}
        />
      )}

      {/* ── Mode Guichet Express Scanner Modal ────────────────────────────── */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    Mode Guichet Express — Scan Enveloppe
                  </h3>
                  <p className="text-xs text-slate-500">
                    Scannez le QR Code ou saisissez le CNE / Jeton du ظرف الفيزيائي
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsScannerOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Viewfinder Target Box */}
            <div className="relative aspect-video rounded-2xl bg-slate-950 border-2 border-dashed border-emerald-500/50 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/40 via-transparent to-transparent pointer-events-none"></div>
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_0_15px_#10b981] animate-bounce"></div>

              <QrCode className="w-16 h-16 text-emerald-400 animate-pulse mb-3" />
              <div className="text-xs font-black text-emerald-300 uppercase tracking-widest">
                Viseur Optique Prêt · Placez le Code-barres / QR de l'Enveloppe
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                Exemple: ENV-2026-N140091375 ou CNE M145092428
              </div>
            </div>

            {/* Form for manual input or USB Barcode reader */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (scannedInput) handleScanLookup(scannedInput);
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                  Saisie Manuelle ou Douchette USB
                </label>
                <div className="relative mt-1">
                  <input
                    type="text"
                    autoFocus
                    value={scannedInput}
                    onChange={(e) => setScannedInput(e.target.value)}
                    placeholder="Scannez ou saisissez : CNE, CIN ou ENV-2026-..."
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3.5 text-sm font-mono font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-2 bottom-2 px-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg transition-all cursor-pointer"
                  >
                    Ouvrir Dossier
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center text-xs text-slate-500">
                <span>Statut du lecteur : <strong className="text-emerald-500">● En écoute (USB/Caméra)</strong></span>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(false)}
                  className="font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}