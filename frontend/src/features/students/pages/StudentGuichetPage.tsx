import { useState,useMemo } from 'react';
import {
FileText,Plus,Clock,CheckCircle2,XCircle,
Download,Send,AlertTriangle,Sparkles,
ShieldCheck,Lock,Check,X,
Building2,Eye,RefreshCcw,Search,Calendar,ExternalLink,Loader2,
FileSignature,Shield,Copy,CheckCheck,GraduationCap,Briefcase,Award,FileCheck
} from 'lucide-react';
import { motion,AnimatePresence,type Variants } from 'framer-motion';
import { useQuery,useMutation,useQueryClient } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { toast } from 'sonner';
import { cn } from '@shared/lib/utils';
import { useAuthStore } from '@stores/authStore';

export default function StudentGuichetPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'ready' | 'pending' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedHashId, setCopiedHashId] = useState<number | null>(null);

  // Official PDF Preview Modal states
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewPdfBlobUrl, setPreviewPdfBlobUrl] = useState<string | null>(null);
  const [previewDocTitle, setPreviewDocTitle] = useState<string>('');
  const [previewLoadingId, setPreviewLoadingId] = useState<number | null>(null);
  const [downloadLoadingId, setDownloadLoadingId] = useState<number | null>(null);

  const [newRequestData, setNewRequestData] = useState({ 
    type: 'Attestation de Scolarité', 
    motif: '' 
  });

  const currentDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // 1. Fetch live document requests from backend
  const { data: fetchRes, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['student-document-requests'],
    queryFn: async () => {
      try {
        const res = await api.get('/student-portal/document-requests');
        return res.data;
      } catch {
        return null;
      }
    },
    staleTime: 30000,
  });

  // 2. Map types to official document_type_id in database
  const docTypeMap: Record<string, number> = {
    'Attestation de Scolarité': 1,
    'Relevé de Notes': 2,
    'Relevé de Notes (S1-S4)': 2,
    'Convention de Stage': 3,
    'Convention de Stage PFE': 3,
    'Attestation de Réussite': 4,
    'Attestation d\'Inscription': 5,
  };

  // 3. Mutation to submit request
  const requestMutation = useMutation({
    mutationFn: async (reqData: any) => {
      const payload = {
        document_type_id: docTypeMap[reqData.type] || 1,
        type: reqData.type,
        motif: reqData.motif,
      };
      const res = await api.post('/student-portal/document-requests', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('Demande enregistrée avec succès au Service des Affaires Étudiantes !');
      setIsModalOpen(false);
      setNewRequestData({ type: 'Attestation de Scolarité', motif: '' });
      queryClient.invalidateQueries({ queryKey: ['student-document-requests'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la soumission de la demande.');
    }
  });

  const requests: any[] = fetchRes?.data || [];

  // Computed metrics
  const totalCount = requests.length;
  const readyCount = requests.filter((r: any) => r.status === 'approved' || r.status === 'ready' || r.status === 'collected' || r.status === 'withdrawn').length;
  const pendingCount = requests.filter((r: any) => r.status === 'pending' || !r.status).length;
  const rejectedCount = requests.filter((r: any) => r.status === 'rejected').length;

  // Filtered list
  const filteredRequests = useMemo(() => {
    return requests.filter((req: any) => {
      const isCollected = req.status === 'collected' || req.status === 'withdrawn';
      const isApproved = req.status === 'approved' || req.status === 'ready' || isCollected;
      const isRejected = req.status === 'rejected';
      const isPending = !isApproved && !isRejected;

      if (filterStatus === 'ready' && !isApproved) return false;
      if (filterStatus === 'pending' && !isPending) return false;
      if (filterStatus === 'rejected' && !isRejected) return false;

      if (searchQuery.trim()) {
        const title = (req.document_type || req.type || '').toLowerCase();
        const idStr = String(req.id || '');
        const query = searchQuery.toLowerCase();
        return title.includes(query) || idStr.includes(query);
      }

      return true;
    });
  }, [requests, filterStatus, searchQuery]);

  // Copy SHA-256 Hash
  const handleCopyHash = (id: number, hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHashId(id);
    toast.success('Empreinte SHA-256 copiée dans le presse-papier !');
    setTimeout(() => setCopiedHashId(null), 2500);
  };

  // Preview official certified PDF
  const handlePreviewDocument = async (req: any) => {
    try {
      setPreviewLoadingId(req.id);
      const title = req.document_type || req.type || 'Attestation de Scolarité';
      setPreviewDocTitle(title);
      toast.loading(`Préparation de l'aperçu certifié (${title})...`, { id: 'pdf-stream' });

      const res = await api.get(`/student-portal/document-requests/${req.id}/preview`, {
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      setPreviewPdfBlobUrl(blobUrl);
      setIsPreviewModalOpen(true);
      toast.success('Document officiel certifié prêt pour consultation !', { id: 'pdf-stream' });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors du chargement de l\'aperçu du document.', { id: 'pdf-stream' });
    } finally {
      setPreviewLoadingId(null);
    }
  };

  // Download official certified PDF
  const handleDownloadDocument = async (req: any) => {
    try {
      setDownloadLoadingId(req.id);
      const title = req.document_type || req.type || 'Attestation_Scolarite';
      toast.loading(`Téléchargement de ${title}...`, { id: 'pdf-download' });

      const res = await api.get(`/student-portal/document-requests/${req.id}/download`, {
        responseType: 'blob',
      });

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const cleanName = title.replace(/\s+/g, '_');
      const studentName = user?.name ? user.name.replace(/\s+/g, '_') : 'ENCG_Fes';
      link.download = `${cleanName}_${studentName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 10000);
      toast.success('Document officiel certifié téléchargé avec succès !', { id: 'pdf-download' });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur lors du téléchargement du document.', { id: 'pdf-download' });
    } finally {
      setDownloadLoadingId(null);
    }
  };

  const closePreviewModal = () => {
    setIsPreviewModalOpen(false);
    if (previewPdfBlobUrl) {
      window.URL.revokeObjectURL(previewPdfBlobUrl);
      setPreviewPdfBlobUrl(null);
    }
  };

  // Helper for document visual theme
  const getDocTheme = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('relevé') || t.includes('note')) {
      return {
        gradient: 'from-blue-600 via-indigo-600 to-sky-700',
        lightBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
        icon: GraduationCap,
        accentColor: '#3b82f6',
        cardBorder: 'hover:border-blue-500/40'
      };
    }
    if (t.includes('scolarité') || t.includes('inscription')) {
      return {
        gradient: 'from-emerald-600 via-teal-600 to-cyan-700',
        lightBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        icon: Building2,
        accentColor: '#10b981',
        cardBorder: 'hover:border-emerald-500/40'
      };
    }
    if (t.includes('stage') || t.includes('convention') || t.includes('pfe')) {
      return {
        gradient: 'from-purple-600 via-violet-600 to-indigo-700',
        lightBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        icon: Briefcase,
        accentColor: '#8b5cf6',
        cardBorder: 'hover:border-purple-500/40'
      };
    }
    return {
      gradient: 'from-amber-500 via-orange-600 to-amber-700',
      lightBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      icon: Award,
      accentColor: '#f59e0b',
      cardBorder: 'hover:border-amber-500/40'
    };
  };

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 18, scale: 0.99 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: 'spring', stiffness: 350, damping: 25 }
    }
  };

  return (
    <div data-testid="student-guichet-page" className="space-y-6 font-sans text-slate-900 dark:text-slate-100 pb-20">
      
      {/* ── Executive Top Header ── */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-[#001A4B] dark:text-white flex items-center gap-2.5">
              <span>Guichet Électronique & Coffre-Fort</span>
              <span className="p-1.5 rounded-lg bg-amber-400/15 text-amber-500 border border-amber-400/30">
                <ShieldCheck className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              </span>
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Service Scolarité Ouvert • 24/7
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 flex-wrap">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">ENCG Fès</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>Délivrance 100% Numérique & Signée QR Code</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="font-medium text-slate-600 dark:text-slate-400 capitalize">{currentDate}</span>
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center justify-center gap-2 h-10 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
            title="Rafraîchir les demandes"
          >
            <RefreshCcw className={cn("w-3.5 h-3.5 text-slate-500", isFetching && "animate-spin text-blue-600")} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="relative group overflow-hidden inline-flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-gradient-to-r from-[#001A4B] via-[#082663] to-[#041438] hover:from-[#082663] hover:to-[#0c3792] text-white text-xs font-bold shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-blue-400/20 hover:scale-[1.02]"
          >
            <div className="absolute inset-0 w-1/2 h-full bg-white/10 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000" />
            <Plus className="w-4 h-4 text-amber-300 transition-transform group-hover:rotate-90 duration-300" />
            <span>Nouvelle Demande</span>
          </button>
        </div>
      </div>

      {/* ── Executive Hero Banner with Live Security Seal & KPI Pod ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#001A4B] via-[#082663] to-[#020e28] text-white p-6 sm:p-7 lg:p-8 shadow-xl border border-blue-900/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
          {/* Left Column: Heading & Trust Badges */}
          <div className="space-y-4 max-w-2xl flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-400/15 text-amber-300 border border-amber-400/30 backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Guichet Numérique Certifié
              </span>
              <span className="px-3 py-1 rounded-lg text-[10px] font-bold tracking-wide bg-white/10 text-blue-100 border border-white/15 backdrop-blur-md flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-emerald-400" />
                Signature Cryptographique SHA-256
              </span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 shadow-inner shrink-0">
                  <FileSignature className="w-6 h-6" />
                </div>
                <span>Coffre-Fort & Pièces Officielles</span>
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-blue-200/80 font-normal leading-relaxed">
                Commandez vos pièces administratives en 1 clic. Chaque document est signé numériquement par la Direction de l'ENCG Fès et vérifiable instantanément via QR Code officiel.
              </p>
            </div>

            {/* Quick Badges Row */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.07] border border-white/10 text-blue-100 font-medium backdrop-blur-md">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Délai moyen garanti : <strong>Moins de 24h</strong></span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.07] border border-white/10 text-blue-100 font-medium backdrop-blur-md">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Validité légale nationale & internationale</span>
              </div>
            </div>
          </div>

          {/* Right Column: Glassmorphism KPI Stats Pod */}
          <div className="w-full lg:w-80 bg-white/[0.08] backdrop-blur-2xl p-5 rounded-3xl border border-white/20 shadow-2xl flex flex-col justify-between shrink-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-blue-200 pb-3 border-b border-white/10 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                Tableau de Bord Personnel
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            </div>

            <div className="grid grid-cols-3 gap-2 py-4 text-center">
              <div>
                <div className="text-2xl font-black text-white">{totalCount}</div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-blue-200 mt-1">Total Déposé</div>
              </div>
              <div className="border-x border-white/10 px-1">
                <div className="text-2xl font-black text-emerald-300">{readyCount}</div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-blue-200 mt-1">Prêts au Coffre</div>
              </div>
              <div>
                <div className="text-2xl font-black text-amber-300">{pendingCount}</div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-blue-200 mt-1">En Cours</div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-blue-200/90 font-medium">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-emerald-400" />
                Coffre-Fort Sécurisé : <strong className="text-emerald-300">Actif</strong>
              </span>
              <span className="font-mono text-[10px] text-slate-300 bg-white/10 px-2 py-0.5 rounded-md">SHA-256</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters & Search Toolbar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setFilterStatus('all')}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 relative",
              filterStatus === 'all'
                ? "bg-[#001A4B] text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <span>Toutes les demandes</span>
            <span className={cn("px-1.5 py-0.5 rounded-md text-[10px] font-mono", filterStatus === 'all' ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300")}>
              {totalCount}
            </span>
          </button>

          <button
            onClick={() => setFilterStatus('ready')}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0",
              filterStatus === 'ready'
                ? "bg-[#001A4B] text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Prêtes au Coffre-Fort</span>
            </span>
            <span className={cn("px-1.5 py-0.5 rounded-md text-[10px] font-mono", filterStatus === 'ready' ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300")}>
              {readyCount}
            </span>
          </button>

          <button
            onClick={() => setFilterStatus('pending')}
            className={cn(
              "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0",
              filterStatus === 'pending'
                ? "bg-[#001A4B] text-white shadow-sm"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>En cours d'instruction</span>
            </span>
            <span className={cn("px-1.5 py-0.5 rounded-md text-[10px] font-mono", filterStatus === 'pending' ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300")}>
              {pendingCount}
            </span>
          </button>

          {rejectedCount > 0 && (
            <button
              onClick={() => setFilterStatus('rejected')}
              className={cn(
                "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0",
                filterStatus === 'rejected'
                  ? "bg-[#001A4B] text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              <span>Non accordées</span>
              <span className={cn("px-1.5 py-0.5 rounded-md text-[10px] font-mono", filterStatus === 'rejected' ? "bg-white/20 text-white" : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300")}>
                {rejectedCount}
              </span>
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une pièce ou référence..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Document Requests List (Animated Cards) ── */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {isLoading ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-16 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative w-12 h-12 mx-auto">
              <div className="w-12 h-12 rounded-full border-4 border-blue-200 border-t-[#001A4B] animate-spin" />
            </div>
            <p className="text-xs text-slate-500 mt-4 font-semibold tracking-wide">
              Synchronisation de votre coffre-fort numérique sécurisé...
            </p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center mx-auto border border-blue-100 dark:border-blue-900/50">
              <FileText className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Aucune demande trouvée</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {searchQuery 
                  ? "Aucune pièce administrative ne correspond à vos critères de recherche." 
                  : "Vous n'avez aucune demande active dans cette catégorie. Cliquez ci-dessous pour déposer une demande."}
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 h-10 px-6 rounded-xl bg-gradient-to-r from-[#001A4B] to-[#082663] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer mt-2"
            >
              <Plus className="w-4 h-4 text-amber-300" />
              <span>Déposer une nouvelle demande</span>
            </button>
          </motion.div>
        ) : (
          filteredRequests.map((req: any) => {
            const isCollected = req.status === 'collected' || req.status === 'withdrawn';
            const isApproved = req.status === 'approved' || req.status === 'ready' || isCollected;
            const isRejected = req.status === 'rejected';

            const docTitle = req.document_type || req.type || (
              req.document_type_id === 1 ? 'Attestation de Scolarité' :
              req.document_type_id === 2 ? 'Relevé de Notes' :
              req.document_type_id === 3 ? 'Convention de Stage PFE' :
              req.document_type_id === 4 ? 'Attestation de Réussite' :
              req.document_type_id === 5 ? 'Attestation d\'Inscription' :
              `Document #${req.id}`
            );

            const theme = getDocTheme(docTitle);
            const DocIcon = theme.icon;
            
            const rawDate = req.requested_at || req.created_at;
            const formattedDate = rawDate 
              ? new Date(rawDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
              : 'Date récente';

            const isDoneDate = req.updated_at && isApproved
              ? new Date(req.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
              : null;

            return (
              <motion.div 
                key={req.id} 
                variants={cardVariants}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                className={cn(
                  "relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 space-y-5 group",
                  theme.cardBorder
                )}
              >
                {/* Top Subtle Ambient Accent Sheen */}
                <div className={cn(
                  "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-80 group-hover:opacity-100 transition-opacity",
                  isApproved ? "from-emerald-500 via-teal-400 to-emerald-600" :
                  isRejected ? "from-rose-500 via-red-500 to-rose-600" :
                  "from-amber-400 via-orange-400 to-amber-500"
                )} />

                {/* Subtle Watermark Badge */}
                <div className="absolute right-4 bottom-4 pointer-events-none opacity-[0.03] dark:opacity-[0.05] text-slate-900 dark:text-white">
                  <DocIcon className="w-48 h-48" />
                </div>

                {/* ── Card Header: Icon, Titles, Reference & Pulsing Status ── */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Visual 3D Icon Container */}
                    <div className={cn(
                      "w-13 h-13 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0 bg-gradient-to-br transition-transform group-hover:scale-105 duration-300",
                      theme.gradient
                    )}>
                      <DocIcon className="w-6 h-6 drop-shadow-sm" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="font-black text-base sm:text-lg text-[#001A4B] dark:text-white leading-tight">
                          {docTitle}
                        </h3>
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700">
                          Réf: #{req.id}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Transmise le {formattedDate}</span>
                        </span>
                        {isDoneDate && (
                          <>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Traitée le {isDoneDate}
                            </span>
                          </>
                        )}
                        {req.motif && (
                          <>
                            <span className="text-slate-300 dark:text-slate-700">•</span>
                            <span className="italic text-slate-600 dark:text-slate-400">"{req.motif}"</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* High-Impact Status Pill with Animated Radar Glow */}
                  <div className="self-start">
                    {isApproved ? (
                      <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-teal-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 shadow-xs">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Document Prêt dans le Coffre-Fort</span>
                      </span>
                    ) : isRejected ? (
                      <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 shadow-xs">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span>Demande Non Accordée</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 shadow-xs">
                        <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                        <span>En cours de traitement scolarité</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Rejection Alert Box */}
                {isRejected && (
                  <div className="p-4 bg-rose-50/90 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-900/50 text-xs text-rose-900 dark:text-rose-100 flex items-start gap-3 shadow-2xs">
                    <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-[11px] font-black uppercase text-rose-800 dark:text-rose-300 tracking-wide">
                          Motif du Refus de l'Administration :
                        </strong>
                        <span className="px-2 py-0.5 rounded-full bg-rose-200/60 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 text-[10px] font-bold">
                          Dossier non validé
                        </span>
                      </div>
                      <p className="text-xs text-rose-950 dark:text-rose-100 font-medium leading-relaxed">
                        {req.admin_notes || "Dossier administratif incomplet ou pièce justificative manquante. Veuillez vérifier les informations ou vous rapprocher du Service des Affaires Étudiantes."}
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Modern Animated Instruction Stepper ── */}
                <div className="py-3.5 px-3 sm:px-5 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Circuit d'instruction officiel</span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium hidden sm:flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Délai indicatif moyen : 24h</span>
                    </span>
                  </div>

                  <div className="relative flex items-center justify-between pt-1">
                    {/* Stepper Background Track */}
                    <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1.5 bg-slate-200 dark:bg-slate-700/80 rounded-full z-0" />
                    
                    {/* Animated Active Progress Fill */}
                    <div
                      className={cn(
                        "absolute left-6 top-1/2 -translate-y-1/2 h-1.5 rounded-full transition-all duration-700 z-0",
                        isApproved ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 w-[calc(100%-48px)] shadow-[0_0_10px_rgba(16,185,129,0.5)]" : 
                        isRejected ? "bg-gradient-to-r from-rose-500 to-rose-600 w-1/2" : 
                        "bg-gradient-to-r from-amber-400 to-amber-500 w-1/2 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                      )}
                    />

                    {/* Step 1: Dépôt Initial */}
                    <div className="relative z-10 flex flex-col items-center gap-1.5 text-center">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black bg-emerald-600 text-white shadow-md ring-4 ring-white dark:ring-slate-900 transition-transform group-hover:scale-110">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                      <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 dark:text-slate-200">
                        1. Dépôt Initial
                      </span>
                    </div>

                    {/* Step 2: Contrôle Scolarité */}
                    <div className="relative z-10 flex flex-col items-center gap-1.5 text-center">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-md ring-4 ring-white dark:ring-slate-900 transition-all",
                        isApproved ? "bg-emerald-600 text-white" :
                        isRejected ? "bg-rose-600 text-white" :
                        "bg-amber-500 text-white animate-pulse shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                      )}>
                        {isApproved ? <Check className="w-4 h-4 stroke-[3]" /> :
                         isRejected ? <X className="w-4 h-4 stroke-[3]" /> :
                         <Clock className="w-4 h-4" />}
                      </div>
                      <span className={cn(
                        "text-[10px] sm:text-[11px] font-bold",
                        isRejected ? "text-rose-600 dark:text-rose-400" : isApproved ? "text-slate-800 dark:text-slate-200" : "text-amber-600 dark:text-amber-400 font-black"
                      )}>
                        {isRejected ? '2. Rejeté' : isApproved ? '2. Contrôle Scolarité' : '2. En Contrôle'}
                      </span>
                    </div>

                    {/* Step 3: Délivrance & QR Sceau */}
                    <div className="relative z-10 flex flex-col items-center gap-1.5 text-center">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-md ring-4 ring-white dark:ring-slate-900 transition-all",
                        isApproved ? "bg-emerald-600 text-white shadow-[0_0_14px_rgba(16,185,129,0.5)]" :
                        "bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-400"
                      )}>
                        {isApproved ? <ShieldCheck className="w-4 h-4" /> : '3'}
                      </div>
                      <span className={cn(
                        "text-[10px] sm:text-[11px] font-bold",
                        isApproved ? "text-emerald-700 dark:text-emerald-400 font-black" : "text-slate-400"
                      )}>
                        3. Signé & QR Certifié
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── Footer: Cryptographic Hash & High-Impact Actions ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  {/* Cryptographic SHA-256 Badge with Instant Copy */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div 
                      onClick={() => handleCopyHash(req.id, req.hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')}
                      className="group/hash flex items-center gap-2 font-mono text-[10px] text-slate-600 dark:text-slate-300 bg-slate-100/90 hover:bg-slate-200/90 dark:bg-slate-800/80 dark:hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 transition-all cursor-pointer shadow-2xs"
                      title="Cliquer pour copier l'empreinte SHA-256 complète"
                    >
                      <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Empreinte SHA-256 : <strong className="text-slate-800 dark:text-slate-200">{req.hash ? req.hash.substring(0, 16) + '...' : 'e3b0c44298fc1c14...'}</strong></span>
                      {copiedHashId === req.id ? (
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400 group-hover/hash:text-blue-600 transition-colors" />
                      )}
                    </div>
                  </div>

                  {/* Document Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {isApproved ? (
                      <>
                        <button
                          onClick={() => handlePreviewDocument(req)}
                          disabled={previewLoadingId === req.id}
                          className="inline-flex items-center gap-1.5 h-9.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 border border-slate-200/60 dark:border-slate-700 hover:shadow-sm"
                          title="Consulter l'exemplaire officiel certifié"
                        >
                          {previewLoadingId === req.id ? (
                            <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                          ) : (
                            <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          )}
                          <span>Aperçu Document</span>
                        </button>

                        <button
                          onClick={() => handleDownloadDocument(req)}
                          disabled={downloadLoadingId === req.id}
                          className="relative group/btn overflow-hidden inline-flex items-center gap-2 h-9.5 px-4.5 rounded-xl bg-gradient-to-r from-[#001A4B] via-[#082663] to-[#041438] hover:from-[#082663] hover:to-[#0c3792] text-white text-xs font-black shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-blue-400/20 disabled:opacity-50 hover:scale-[1.02]"
                          title="Télécharger le fichier PDF officiel avec QR Code et Sceau"
                        >
                          {downloadLoadingId === req.id ? (
                            <Loader2 className="w-4 h-4 text-amber-300 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4 text-amber-300 transition-transform group-hover/btn:-translate-y-0.5 duration-200" />
                          )}
                          <span>Télécharger PDF Officiel</span>
                        </button>
                      </>
                    ) : (
                      !isRejected && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          <span>Instruction en cours au Service Scolarité</span>
                        </div>
                      )
                    )}
                  </div>
                </div>

              </motion.div>
            );
          })
        )}
      </motion.div>

      {/* ── Modal Nouvelle Demande (Ultra-Modern Visual Card Selector) ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-5 sm:p-6 bg-gradient-to-r from-[#001A4B] via-[#082663] to-[#041438] text-white flex items-center justify-between">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 text-amber-300 border border-white/15">
                    <Sparkles className="w-3 h-3" /> Guichet Unique 100% En Ligne
                  </span>
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                    <FileSignature className="w-5 h-5 text-amber-300" />
                    <span>Nouvelle Demande de Pièce Officielle</span>
                  </h2>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Form */}
              <form 
                onSubmit={(e) => { 
                  e.preventDefault(); 
                  requestMutation.mutate(newRequestData); 
                }} 
                className="p-5 sm:p-6 space-y-4"
              >
                {/* Visual Document Type Selector */}
                <div>
                  <label className="block text-xs font-black uppercase text-slate-600 dark:text-slate-300 tracking-wider mb-2.5">
                    Sélectionnez le Type de Document *
                  </label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { 
                        title: 'Attestation de Scolarité', 
                        desc: 'Année 2026-2027 • Visa / Banque / Bourse',
                        icon: Building2,
                        gradient: 'from-emerald-600 to-teal-700'
                      },
                      { 
                        title: 'Relevé de Notes (S1-S4)', 
                        desc: 'Notes officielles certifiées avec QR',
                        icon: GraduationCap,
                        gradient: 'from-blue-600 to-indigo-700'
                      },
                      { 
                        title: 'Convention de Stage PFE', 
                        desc: 'Stage de fin d\'études ou initiation',
                        icon: Briefcase,
                        gradient: 'from-purple-600 to-violet-700'
                      },
                      { 
                        title: 'Attestation de Réussite', 
                        desc: 'Validation d\'année académique',
                        icon: Award,
                        gradient: 'from-amber-600 to-orange-700'
                      },
                    ].map((item) => {
                      const isSelected = newRequestData.type === item.title;
                      const ItemIcon = item.icon;

                      return (
                        <div
                          key={item.title}
                          onClick={() => setNewRequestData(p => ({ ...p, type: item.title }))}
                          className={cn(
                            "p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3",
                            isSelected 
                              ? "bg-blue-50/80 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500 ring-2 ring-blue-500/20 shadow-sm"
                              : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                          )}
                        >
                          <div className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 bg-gradient-to-br shadow-xs",
                            item.gradient
                          )}>
                            <ItemIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                              {item.title}
                            </h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Motif Input with Quick Tag Pills */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-black uppercase text-slate-600 dark:text-slate-300 tracking-wider">
                      Motif & Organisme Destinataire *
                    </label>
                    <span className="text-[10px] text-slate-400">Précisez l'usage</span>
                  </div>

                  <textarea
                    required
                    rows={3}
                    value={newRequestData.motif}
                    onChange={(e) => setNewRequestData(p => ({ ...p, motif: e.target.value }))}
                    placeholder="Ex: Dossier de candidature stage, renouvellement carte séjour, dossier de bourse ou visa..."
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#001A4B] focus:border-transparent outline-none resize-none"
                  />

                  {/* Fast Motif Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Suggestions :</span>
                    {[
                      'Candidature Stage PFE',
                      'Dossier de Bourse',
                      'Renouvellement Visa',
                      'Dossier Bancaire',
                      'Concours d\'Accès'
                    ].map((pill) => (
                      <button
                        type="button"
                        key={pill}
                        onClick={() => setNewRequestData(p => ({ ...p, motif: pill }))}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                      >
                        {pill}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trust Notice */}
                <div className="p-3.5 bg-blue-50/80 dark:bg-blue-950/40 rounded-2xl border border-blue-200/80 dark:border-blue-900/50 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span className="text-[11px] leading-relaxed">
                    Votre demande sera traitée par le Service Scolarité de l'ENCG Fès sous <strong>24h ouvrées</strong>. Le document sera signé et stocké dans votre coffre-fort numérique avec un QR code de vérification officiel.
                  </span>
                </div>

                {/* Modal Footer Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    disabled={requestMutation.isPending || !newRequestData.motif.trim()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-[#001A4B] to-[#082663] hover:from-[#082663] hover:to-[#0c3792] text-white rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    {requestMutation.isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Transmission...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 text-amber-300" />
                        <span>Soumettre la Demande</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Modal Aperçu Document PDF Officiel ── */}
      {isPreviewModalOpen && previewPdfBlobUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-4 py-3.5 sm:px-6 sm:py-4 bg-[#001A4B] text-white flex items-center justify-between gap-3 shrink-0 border-b border-white/10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/15">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm sm:text-base font-black tracking-tight truncate text-white">
                      {previewDocTitle}
                    </h2>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <Check className="w-3 h-3" /> Certifié Conforme
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 truncate">
                    École Nationale de Commerce et de Gestion de Fès • Document Officiel Sécurisé
                  </p>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => window.open(previewPdfBlobUrl, '_blank')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer border border-white/10"
                  title="Ouvrir dans un nouvel onglet"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-blue-300" />
                  <span className="hidden md:inline">Nouvel onglet</span>
                </button>

                <a
                  href={previewPdfBlobUrl}
                  download={`${previewDocTitle.replace(/\s+/g, '_')}_ENCG.pdf`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-black shadow-sm transition-all cursor-pointer"
                  title="Télécharger le fichier PDF officiel"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Télécharger</span>
                </a>

                <button
                  type="button"
                  onClick={closePreviewModal}
                  className="w-8 h-8 rounded-xl bg-white/10 hover:bg-rose-500 text-slate-300 hover:text-white transition-all flex items-center justify-center cursor-pointer ml-1"
                  title="Fermer l'aperçu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body: Direct Streamed Certified PDF Preview */}
            <div className="flex-1 w-full bg-slate-100 dark:bg-slate-950 p-1 sm:p-3 overflow-hidden">
              <iframe
                src={`${previewPdfBlobUrl}#toolbar=1&navpanes=0`}
                title={`Aperçu PDF - ${previewDocTitle}`}
                className="w-full h-full rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner bg-white"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
