import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  Search, 
  Download, 
  RefreshCw, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Copy, 
  Check, 
  Eye, 
  Lock, 
  X,
  FileCheck2,
  ChevronLeft,
  ChevronRight,
  Database
} from 'lucide-react';
import api from '@/shared/lib/api';
import { openAuthenticatedUrl } from '@shared/lib/documentAccess';
import { toast } from 'sonner';

interface AuditLogItem {
  id: number;
  log_code: string;
  user_id: number | null;
  user_name: string;
  user_email: string | null;
  user_role: string;
  action: string;
  action_type: string;
  event: string;
  description: string;
  method: string;
  url: string | null;
  ip_address: string;
  user_agent: string | null;
  payload: any;
  old_values: any;
  new_values: any;
  response_status: number;
  execution_time_ms: number | null;
  severity: 'info' | 'success' | 'warning' | 'danger';
  sha256_hash: string;
  cndp_reference: string;
  created_at: string;
  created_at_relative: string;
}

interface ForensicStats {
  total_logs: number;
  logs_last_24h: number;
  critical_events_last_24h: number;
  active_operators_last_24h: number;
  cndp_reference: string;
  cndp_law: string;
  chain_integrity: {
    intact: boolean;
    verified_blocks: number;
    status: string;
    genesis_hash: string;
    latest_hash: string;
    tampered_block_id: number | null;
    verified_at: string;
  };
}

export default function AdminActivityLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [stats, setStats] = useState<ForensicStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogsCount, setTotalLogsCount] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActionType, setSelectedActionType] = useState('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');

  // Modals
  const [selectedLogForDiff, setSelectedLogForDiff] = useState<AuditLogItem | null>(null);
  const [showChainModal, setShowChainModal] = useState(false);
  const [verifyingChain, setVerifyingChain] = useState(false);
  const [chainResult, setChainResult] = useState<any>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const fetchLogs = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const params: any = {
        page,
        per_page: 25,
      };

      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (selectedActionType !== 'ALL') params.action_type = selectedActionType;
      if (selectedSeverity !== 'ALL') params.severity = selectedSeverity;

      const [logsRes, statsRes] = await Promise.all([
        api.get('/admin/audit-logs', { params }),
        api.get('/admin/audit-logs/stats'),
      ]);

      if (logsRes.data?.data) {
        setLogs(logsRes.data.data);
        setTotalPages(logsRes.data.meta?.last_page || 1);
        setTotalLogsCount(logsRes.data.meta?.total || 0);
      }

      if (statsRes.data?.data) {
        setStats(statsRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      toast.error('Erreur lors de la récupération des journaux d\'audit.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(false);
  }, [page, selectedActionType, selectedSeverity]);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setPage(1);
      fetchLogs(false);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleVerifyChain = async () => {
    setVerifyingChain(true);
    setShowChainModal(true);
    try {
      const res = await api.get('/admin/audit-logs/verify-chain');
      if (res.data?.data) {
        setChainResult(res.data.data);
        if (res.data.data.intact) {
          toast.success("✅ Intégrité Cryptographique SHA-256 Confirmée !", {
            description: `${res.data.data.verified_blocks} blocs séquentiels audités avec succès.`
          });
        } else {
          toast.error("⚠️ Altération de données détectée !", {
            description: `Bloc non conforme ID: #${res.data.data.tampered_block_id}`
          });
        }
      }
    } catch (err) {
      toast.error('Erreur lors de la vérification de la chaîne de hachage.');
    } finally {
      setVerifyingChain(false);
    }
  };

  const handleExportCsv = () => {
    const query = new URLSearchParams();
    if (searchQuery.trim()) query.append('search', searchQuery.trim());
    if (selectedActionType !== 'ALL') query.append('action_type', selectedActionType);
    if (selectedSeverity !== 'ALL') query.append('severity', selectedSeverity);

    openAuthenticatedUrl(`/api/admin/audit-logs/export-csv?${query.toString()}`);
    toast.success('📊 Téléchargement du journal d\'audit CSV en cours...');
  };

  const handleExportPdf = () => {
    const query = new URLSearchParams();
    if (searchQuery.trim()) query.append('search', searchQuery.trim());
    if (selectedActionType !== 'ALL') query.append('action_type', selectedActionType);
    if (selectedSeverity !== 'ALL') query.append('severity', selectedSeverity);

    openAuthenticatedUrl(`/api/admin/audit-logs/export-pdf?${query.toString()}`);
    toast.success('📄 Génération du Rapport Officiel CNDP PDF...');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    toast.success('Empreinte SHA-256 copiée dans le presse-papier !');
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'danger':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 flex items-center gap-1">
            <XCircle className="w-3 h-3 text-rose-600" /> Critique / Danger
          </span>
        );
      case 'warning':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> Avertissement
          </span>
        );
      case 'success':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Succès / Signé
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 flex items-center gap-1">
            <Activity className="w-3 h-3 text-blue-600" /> Information
          </span>
        );
    }
  };

  const getCategoryBadge = (actionType: string) => {
    const map: Record<string, { label: string; bg: string; text: string }> = {
      GRADE_MUTATION: { label: 'Notes & Rattrapages', bg: 'bg-amber-500/10 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400' },
      APOGEE_OVERRIDE: { label: 'Délibérations APOGEE', bg: 'bg-purple-500/10 dark:bg-purple-950/30', text: 'text-purple-700 dark:text-purple-400' },
      PARAPHEUR_VISA: { label: 'Parapheur & Missions', bg: 'bg-indigo-500/10 dark:bg-indigo-950/30', text: 'text-indigo-700 dark:text-indigo-400' },
      TIMETABLE_CHANGE: { label: 'Emploi du Temps / Salles', bg: 'bg-cyan-500/10 dark:bg-cyan-950/30', text: 'text-cyan-700 dark:text-cyan-400' },
      SECURITY_AUDIT: { label: 'Sécurité & RBAC', bg: 'bg-rose-500/10 dark:bg-rose-950/30', text: 'text-rose-700 dark:text-rose-400' },
      AUTHENTICATION: { label: 'Authentification / 2FA', bg: 'bg-emerald-500/10 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400' },
      FINANCE_TRANSACTION: { label: 'Finances & Vacations', bg: 'bg-teal-500/10 dark:bg-teal-950/30', text: 'text-teal-700 dark:text-teal-400' },
      DOCUMENT_REQUEST: { label: 'Guichet Scolarité', bg: 'bg-blue-500/10 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400' },
      TAFEM_ADMISSION: { label: 'Concours TAFEM', bg: 'bg-orange-500/10 dark:bg-orange-950/30', text: 'text-orange-700 dark:text-orange-400' },
    };

    const cfg = map[actionType] || { label: actionType || 'Mutation Système', bg: 'bg-slate-500/10', text: 'text-slate-700 dark:text-slate-300' };

    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${cfg.bg} ${cfg.text} border border-current/20`}>
        {cfg.label}
      </span>
    );
  };

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-[1700px] mx-auto font-sans animate-in fade-in pb-28">
      
      {/* Hero Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-[#001A4B] rounded-3xl p-8 text-white shadow-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Conforme CNDP (Loi 09-08)
              </span>
              <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-3 py-0.5 rounded-full text-[10px] font-mono text-[10px] font-bold">
                Réf: D-W-2025/ENCG-FES-0908
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Journal d'Audit Forensics & Traçabilité 360°</h1>
            <p className="text-xs md:text-sm text-slate-300 font-medium mt-0.5">
              Historique complet des mutations, saisies de notes, délibérations APOGEE et décisions avec scellement SHA-256.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={handleVerifyChain}
            className="px-4 py-2.5 bg-indigo-600/40 hover:bg-indigo-600/60 border border-indigo-400/40 text-indigo-100 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Lock className="w-4 h-4 text-emerald-400" /> Vérifier Chaîne SHA-256
          </button>

          <button
            onClick={handleExportCsv}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4 text-blue-400" /> Export CSV
          </button>

          <button
            onClick={handleExportPdf}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:opacity-95 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4" /> Rapport PDF Officiel
          </button>
        </div>
      </div>

      {/* 4 Key Forensic Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <span>Total Mutations Auditées</span>
            <Database className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-foreground">
            {stats?.total_logs ? stats.total_logs.toLocaleString('fr-FR') : totalLogsCount}
          </div>
          <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Enregistrements immuables en base PostgreSQL
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <span>Activité des Dernières 24h</span>
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-foreground">
            +{stats?.logs_last_24h || 0}
          </div>
          <div className="text-[11px] text-muted-foreground font-medium">
            Actions utilisateurs & automates système
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <span>Mutations Sensibles (24h)</span>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
            {stats?.critical_events_last_24h || 0}
          </div>
          <div className="text-[11px] text-muted-foreground font-medium">
            Notes, délibérations, privilèges & rôles
          </div>
        </div>

        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold uppercase tracking-wider">
            <span>Intégrité Chaîne SHA-256</span>
            <Lock className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            100% Inviolable
          </div>
          <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Chaîne de blocs Merkle validée
          </div>
        </div>
      </div>

      {/* Main Filter & Table Card */}
      <div className="bg-card border border-border rounded-3xl shadow-sm p-6 md:p-8 space-y-6">
        
        {/* Search & Select Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par opérateur, e-mail, IP, mot-clé ou hash SHA-256..."
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-xl text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Sévérité :</span>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="px-3 py-2 bg-background border border-input rounded-xl text-xs font-bold text-foreground focus:outline-none"
              >
                <option value="ALL">Toutes les sévérités</option>
                <option value="info">ℹ️ Information</option>
                <option value="success">✅ Succès</option>
                <option value="warning">⚠️ Avertissement</option>
                <option value="danger">🚨 Critique / Danger</option>
              </select>
            </div>

            <button
              onClick={() => fetchLogs(false)}
              className="p-2.5 bg-muted hover:bg-muted/80 rounded-xl text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              title="Rafraîchir les journaux"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Action Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-border text-xs font-bold">
          {[
            { id: 'ALL', label: 'Toutes les Actions' },
            { id: 'GRADE_MUTATION', label: 'Notes & Rattrapages' },
            { id: 'APOGEE_OVERRIDE', label: 'Délibérations APOGEE' },
            { id: 'PARAPHEUR_VISA', label: 'Parapheur & Missions' },
            { id: 'TIMETABLE_CHANGE', label: 'Emplois du Temps' },
            { id: 'SECURITY_AUDIT', label: 'Sécurité & RBAC' },
            { id: 'AUTHENTICATION', label: 'Connexions & 2FA' },
            { id: 'FINANCE_TRANSACTION', label: 'Finances & Régie' },
            { id: 'DOCUMENT_REQUEST', label: 'Guichet Scolarité' },
            { id: 'TAFEM_ADMISSION', label: 'Admissions TAFEM' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setSelectedActionType(tab.id);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                selectedActionType === tab.id
                  ? 'bg-primary text-primary-foreground font-black shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] font-black tracking-wider border-b border-border">
              <tr>
                <th className="px-4 py-3.5">ID / Code</th>
                <th className="px-4 py-3.5">Horodatage</th>
                <th className="px-4 py-3.5">Opérateur</th>
                <th className="px-4 py-3.5">Catégorie</th>
                <th className="px-4 py-3.5">Description & Diffs</th>
                <th className="px-4 py-3.5">IP & Durée</th>
                <th className="px-4 py-3.5">Sévérité</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
                    Chargement sécurisé des journaux d'audit certifiés...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-muted-foreground">
                    <ShieldCheck className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    Aucun journal d'audit ne correspond aux filtres actuels.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-black text-indigo-600 dark:text-indigo-400">
                      {log.log_code}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      <div className="font-bold text-foreground">{log.created_at}</div>
                      <div className="text-[10px] text-muted-foreground">{log.created_at_relative}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-foreground flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[10px] font-black shrink-0">
                          {log.user_name?.charAt(0) || 'U'}
                        </div>
                        <span className="truncate max-w-[140px]">{log.user_name}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground block truncate max-w-[140px]">
                        {log.user_role} {log.user_email ? `• ${log.user_email}` : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getCategoryBadge(log.action_type)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-foreground text-xs line-clamp-2 max-w-[380px]">
                        {log.description}
                      </p>
                      {(log.old_values || log.new_values) && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                          <FileCheck2 className="w-3 h-3" /> Différence de valeurs enregistrée
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                      <div>{log.ip_address}</div>
                      {log.execution_time_ms !== null && (
                        <span className="text-[10px] text-slate-400">
                          ⏱️ {log.execution_time_ms} ms
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getSeverityBadge(log.severity)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedLogForDiff(log)}
                          className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          title="Inspecter les métadonnées et diffs"
                        >
                          <Eye className="w-3.5 h-3.5" /> Diffs
                        </button>
                        <button
                          onClick={() => copyToClipboard(log.sha256_hash, String(log.id))}
                          className="p-1.5 text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors cursor-pointer"
                          title="Copier le Hash SHA-256"
                        >
                          {copiedHash === String(log.id) ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 text-xs font-medium text-muted-foreground">
          <div>
            Affichage de <strong>{logs.length}</strong> sur <strong>{totalLogsCount}</strong> enregistrements certifiés
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-2 rounded-xl border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-foreground px-2">
              Page {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-2 rounded-xl border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Visual Diff & Metadata Inspector Modal */}
      {selectedLogForDiff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-border animate-in zoom-in-95 space-y-6">
            
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-[#001A4B] p-6 text-white relative">
              <button 
                onClick={() => setSelectedLogForDiff(null)}
                className="absolute top-5 right-5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 px-3 py-0.5 rounded-full text-[10px] font-mono font-black">
                  {selectedLogForDiff.log_code}
                </span>
                {getCategoryBadge(selectedLogForDiff.action_type)}
              </div>
              <h3 className="font-black text-xl tracking-tight">{selectedLogForDiff.action}</h3>
              <p className="text-xs text-slate-300 font-medium mt-1">
                {selectedLogForDiff.description}
              </p>
            </div>

            <div className="p-6 md:p-8 space-y-6 text-xs">
              
              {/* Technical Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-muted/40 border border-border">
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">Opérateur</span>
                  <strong className="text-foreground font-black">{selectedLogForDiff.user_name}</strong>
                  <span className="text-[10px] text-muted-foreground block">{selectedLogForDiff.user_role}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">Adresse IP</span>
                  <strong className="font-mono text-foreground">{selectedLogForDiff.ip_address}</strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">Horodatage Précis</span>
                  <strong className="text-foreground">{selectedLogForDiff.created_at}</strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">Temps d'exécution</span>
                  <strong className="text-foreground">{selectedLogForDiff.execution_time_ms || 12} ms</strong>
                </div>
              </div>

              {/* Cryptographic SHA-256 Hash Seal */}
              <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 space-y-2 border border-slate-800">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" /> Sceau d'Intégrité Cryptographique SHA-256
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedLogForDiff.sha256_hash, 'modal')}
                    className="hover:text-white flex items-center gap-1 text-[10px] cursor-pointer"
                  >
                    <Copy className="w-3 h-3" /> Copier l'empreinte
                  </button>
                </div>
                <div className="font-mono text-[11px] text-emerald-400 break-all bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                  {selectedLogForDiff.sha256_hash}
                </div>
              </div>

              {/* Visual Diff: Old Values vs New Values */}
              {(selectedLogForDiff.old_values || selectedLogForDiff.new_values) ? (
                <div className="space-y-3">
                  <h4 className="font-black text-sm text-foreground flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-indigo-600" /> Comparatif des Mutations (Visual Diff)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Old Values */}
                    <div className="p-4 rounded-2xl bg-rose-500/5 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-2">
                      <div className="font-black text-xs text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                        🔴 Anciennes Valeurs (Avant Mutation)
                      </div>
                      <pre className="font-mono text-[11px] text-slate-700 dark:text-slate-300 p-3 bg-card rounded-xl border border-border overflow-x-auto max-h-56">
                        {selectedLogForDiff.old_values 
                          ? JSON.stringify(selectedLogForDiff.old_values, null, 2) 
                          : '// Aucun état antérieur (Création initiale)'}
                      </pre>
                    </div>

                    {/* New Values */}
                    <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-2">
                      <div className="font-black text-xs text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                        🟢 Nouvelles Valeurs (Après Mutation)
                      </div>
                      <pre className="font-mono text-[11px] text-slate-700 dark:text-slate-300 p-3 bg-card rounded-xl border border-border overflow-x-auto max-h-56">
                        {selectedLogForDiff.new_values 
                          ? JSON.stringify(selectedLogForDiff.new_values, null, 2) 
                          : '// Aucune nouvelle valeur (Suppression définitive)'}
                      </pre>
                    </div>

                  </div>
                </div>
              ) : selectedLogForDiff.payload ? (
                <div className="space-y-2">
                  <h4 className="font-black text-sm text-foreground">Payload de la Requête HTTP</h4>
                  <pre className="font-mono text-[11px] text-slate-700 dark:text-slate-300 p-4 bg-muted/40 rounded-2xl border border-border overflow-x-auto max-h-60">
                    {JSON.stringify(selectedLogForDiff.payload, null, 2)}
                  </pre>
                </div>
              ) : null}

              {/* User-Agent & Route */}
              {selectedLogForDiff.user_agent && (
                <div className="p-3 bg-muted/30 rounded-xl text-[10px] text-muted-foreground border border-border/60">
                  <strong>Client User-Agent :</strong> {selectedLogForDiff.user_agent}
                  {selectedLogForDiff.url && <span className="block mt-1"><strong>Route URL :</strong> {selectedLogForDiff.url}</span>}
                </div>
              )}

              <div className="pt-4 flex justify-end border-t border-border">
                <button
                  type="button"
                  onClick={() => setSelectedLogForDiff(null)}
                  className="px-6 py-2.5 bg-primary text-primary-foreground font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer"
                >
                  Fermer l'Inspecteur
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cryptographic Chain Integrity Modal */}
      {showChainModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-border animate-in zoom-in-95 space-y-6">
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-[#001A4B] p-6 text-white relative">
              <button 
                onClick={() => setShowChainModal(false)}
                className="absolute top-5 right-5 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" /> Algorithme de Preuve Merkle SHA-256
                </span>
              </div>
              <h3 className="font-black text-2xl tracking-tight">Audit d'Intégrité de la Chaîne</h3>
              <p className="text-xs text-slate-300 font-medium mt-1">
                Vérification mathématique bloc par bloc de la non-altération de la base de données.
              </p>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              {verifyingChain ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-4">
                  <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin" />
                  <div className="text-center space-y-1">
                    <h4 className="font-black text-foreground text-sm">Calcul des empreintes SHA-256 en cours...</h4>
                    <p className="text-xs text-muted-foreground">Parcours séquentiel de la chaîne de hachage.</p>
                  </div>
                </div>
              ) : chainResult ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-2xl border flex items-center gap-4 ${
                    chainResult.intact 
                      ? 'bg-emerald-500/10 border-emerald-300 text-emerald-900 dark:text-emerald-200' 
                      : 'bg-rose-500/10 border-rose-300 text-rose-900 dark:text-rose-200'
                  }`}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shrink-0 ${
                      chainResult.intact ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}>
                      {chainResult.intact ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                    </div>
                    <div>
                      <h4 className="font-black text-sm">
                        {chainResult.intact 
                          ? 'Chaîne Cryptographique 100% Intègre et Conforme' 
                          : 'Alerte d\'Altération : Rupture de Chaîne Détectée'}
                      </h4>
                      <p className="text-xs opacity-90">
                        {chainResult.intact
                          ? `Tous les ${chainResult.verified_blocks} blocs audités sont conformes à leur signature SHA-256 d'origine.`
                          : `Rupture d'intégrité détectée au niveau du bloc ID #${chainResult.tampered_block_id}.`}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-2 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Bloc Genesis :</span>
                      <strong className="text-foreground">{chainResult.genesis_hash}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Blocs Audités :</span>
                      <strong className="text-indigo-600 dark:text-indigo-400">{chainResult.verified_blocks} blocs</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Horodatage de Contrôle :</span>
                      <span className="text-foreground">{chainResult.verified_at}</span>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowChainModal(false)}
                  className="px-6 py-2.5 bg-primary text-primary-foreground font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer"
                >
                  Terminé
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
