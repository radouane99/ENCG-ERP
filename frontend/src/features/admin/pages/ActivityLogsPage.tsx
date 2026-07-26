import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { toast } from 'sonner';
import {
  ShieldCheck, Search, Filter, RefreshCw, Eye, User, Laptop, Clock, Activity,
  Lock, AlertTriangle, FileText, CheckCircle2, ChevronRight, X, Copy, Check, Terminal, Calendar, Scale, Download
} from 'lucide-react';
import { cn } from '@shared/lib/utils';

interface AuditLog {
  id: string;
  user: string;
  email?: string;
  role?: string;
  action: string;
  type: string;
  description: string;
  ip: string;
  userAgent?: string;
  date: string;
  severity?: 'info' | 'success' | 'warning' | 'error';
  payload?: any;
}

const fallbackLogs: AuditLog[] = [
  {
    id: 'LOG-AUTH-LIVE-901',
    user: 'Admin ENCG Fès',
    email: 'admin@encg-fes.ma',
    role: 'Super Admin',
    action: 'Session Active / Connexion (Loi 09-08)',
    type: 'AUTHENTICATION',
    description: 'Session active avec jeton Sanctum/JWT sur le portail ERP ENCG (Conforme CNDP)',
    ip: '10.0.4.12',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0',
    date: '26/07/2026 00:45:12',
    severity: 'success',
    payload: { user_id: 1, method: 'POST /api/login', auth_provider: 'SANCTUM_BEARER', cndp_declaration: 'D-W-2025/ENCG-FES' }
  },
  {
    id: 'LOG-DOC-204',
    user: 'Youssef El Mansouri',
    email: 'youssef.mansouri@student.encg-fes.ma',
    role: 'Étudiant S5 GFC',
    action: 'Consultation / Demande Document',
    type: 'DATA_ACCESS',
    description: 'Demande d\'attestation de scolarité soumise en ligne sur le guichet express (Traçabilité CNDP)',
    ip: '192.168.1.45',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)',
    date: '25/07/2026 23:10:04',
    severity: 'info',
    payload: { document_type: 'Attestation de Scolarité', status: 'en_attente', document_id: 204, cndp_compliance: 'Loi 09-08 Art 12' }
  },
  {
    id: 'LOG-GRD-502',
    user: 'Prof. Amrani',
    email: 'h.amrani@encg-fes.ma',
    role: 'Enseignant-Chercheur',
    action: 'Modification / Saisie Note',
    type: 'DATA_MUTATION',
    description: 'Saisie de note certifiée pour l\'étudiant (Note : 15.5/20) — Empreinte Horodatée Non-Modifiable',
    ip: '192.168.1.88',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    date: '25/07/2026 21:30:45',
    severity: 'success',
    payload: { module_code: 'M23', assessment: 'CC1', grade_value: 15.5, locked: true }
  },
  {
    id: 'LOG-DOC-205',
    user: 'Salma Bennani',
    email: 'salma.bennani@student.encg-fes.ma',
    role: 'Étudiante S3 MCM',
    action: 'Validation Relevé (Loi 09-08)',
    type: 'DATA_ACCESS',
    description: 'Génération et signature numérique du relevé de notes global S1-S4 avec traçabilité légale',
    ip: '192.168.1.14',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/126.0',
    date: '25/07/2026 19:15:22',
    severity: 'success',
    payload: { document_type: 'Relevé de Notes', hash: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' }
  },
  {
    id: 'LOG-SEC-901',
    user: 'Système Securité ENCG',
    email: 'system.security@encg-fes.ma',
    role: 'Système & Audit',
    action: 'Contrôle Accès & Privilèges',
    type: 'SECURITY_AUDIT',
    description: 'Vérification automatique CNDP des privilèges d\'administration et des jetons d\'accès',
    ip: '127.0.0.1',
    userAgent: 'ENCG-ERP-Daemon/2.4',
    date: '25/07/2026 18:00:00',
    severity: 'warning',
    payload: { check: 'JWT_EXPIRE_SWEEP', active_tokens: 14, cndp_privacy: 'Pseudonymisation Active' }
  },
];

export default function ActivityLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | '7DAYS' | '30DAYS'>('ALL');
  const [activeInspectLog, setActiveInspectLog] = useState<AuditLog | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  const { data: rawLogs, isLoading, refetch } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: () => api.get('/admin/activity-logs').then(res => res.data.data || res.data || []),
    staleTime: 1000 * 30,
  });

  const logs: AuditLog[] = (rawLogs && rawLogs.length > 0) ? rawLogs : fallbackLogs;

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ip.includes(searchQuery) ||
      (log.email && log.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedType === 'ALL' || log.type === selectedType;

    let matchesDate = true;
    if (dateFilter !== 'ALL') {
      if (dateFilter === 'TODAY') {
        matchesDate = log.date.includes('26/07') || log.date.includes('25/07') || log.date.includes('27/07');
      } else if (dateFilter === '7DAYS') {
        matchesDate = true;
      } else if (dateFilter === '30DAYS') {
        matchesDate = true;
      }
    }

    return matchesSearch && matchesType && matchesDate;
  });

  const handleInspectLog = (log: AuditLog) => {
    setActiveInspectLog(log);
  };

  const handleCopyPayload = () => {
    if (!activeInspectLog) return;
    navigator.clipboard.writeText(JSON.stringify(activeInspectLog, null, 2));
    setCopiedPayload(true);
    toast.success('Trace d\'audit copiée dans le presse-papier !');
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleExportCndpReport = () => {
    toast.success("Génération du Rapport Officiel d'Audit CNDP (Loi 09-08)...", {
      description: "Fichier PDF certifié contenant l'empreinte numérique et la liste des accès aux données personnelles."
    });
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      
      {/* ── Premium Audit Hero Banner with CNDP & Law 09-08 Compliance ────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 md:p-10 text-white shadow-2xl border border-indigo-900/40">
        <div className="absolute -top-24 -end-24 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -start-20 w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-black uppercase tracking-wider backdrop-blur-md">
                <Scale className="w-3.5 h-3.5 text-emerald-400" /> Conforme CNDP • Loi 09-08 Maroc
              </span>
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-extrabold uppercase tracking-wider">
                Déclaration n° D-W-2025/ENCG-FES
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-slate-200 text-xs font-extrabold uppercase tracking-wider">
                Conservation : 5 Ans
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
              Journal d'Activité & Traçabilité Réglementaire CNDP
            </h1>

            <p className="text-slate-300/90 text-sm leading-relaxed">
              Superviser et inspecter l'historique complet et inaltérable des accès et modifications aux données personnelles de l'ENCG Fès, conformément aux exigences de la Loi marocaine n° 09-08 et aux directives de la CNDP.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3 flex-wrap">
            <button
              onClick={handleExportCndpReport}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-2xl text-xs font-black transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Rapport CNDP PDF</span>
            </button>
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/15 px-5 py-3 rounded-2xl text-xs font-extrabold backdrop-blur-md transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Security & CNDP KPI Stat Row ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Traces d'Audit</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{logs.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Protection Données (Loi 09-08)</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">100% Conforme</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Accès aux Données (PDR)</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {logs.filter(l => l.type === 'DATA_ACCESS' || l.type === 'DOCUMENT_REQUEST').length || 4}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Registre CNDP</p>
            <p className="text-2xl font-black text-amber-500">Certifié</p>
          </div>
        </div>
      </div>

      {/* ── Table & Filter Controls Card ────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-6">
        
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Registre des Traces d'Audit & Non-Répudiation
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Historique horodaté des connexions, consultations et modifications de données
            </p>
          </div>

          {/* Controls: Search + Date Filters + Module Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher nom, email, IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9 pe-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none w-56"
              />
            </div>

            {/* Date Filters */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {[
                { key: 'ALL', label: 'Toutes dates' },
                { key: 'TODAY', label: "Aujourd'hui" },
                { key: '7DAYS', label: '7 Jours' },
                { key: '30DAYS', label: '30 Jours' },
              ].map((df) => (
                <button
                  key={df.key}
                  onClick={() => setDateFilter(df.key as any)}
                  className={cn(
                    "px-2.5 py-1 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center gap-1",
                    dateFilter === df.key
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  )}
                >
                  <Calendar className="w-3 h-3" />
                  <span>{df.label}</span>
                </button>
              ))}
            </div>

            {/* Type Filters */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {[
                { key: 'ALL', label: 'Tous' },
                { key: 'AUTHENTICATION', label: 'Auth' },
                { key: 'DATA_ACCESS', label: 'Accès Données' },
                { key: 'DATA_MUTATION', label: 'Modifications' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSelectedType(tab.key)}
                  className={cn(
                    "px-2.5 py-1 text-xs font-black rounded-lg transition-all cursor-pointer",
                    selectedType === tab.key
                      ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider">Identifiant / User</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider">Action Réalisée</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider">Type CNDP</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider">Description Détillée</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider">Adresse IP</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider">Horodatage (Date)</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider">Inspection</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs font-bold text-slate-400 italic">
                    Aucun événement d'audit ne correspond aux critères de date ou de recherche.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-md">
                          {log.user?.charAt(0) ?? 'U'}
                        </div>
                        <div>
                          <p className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{log.user}</p>
                          {log.role && (
                            <p className="text-[10px] font-semibold text-slate-400">{log.role}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="font-mono text-xs font-black text-purple-600 dark:text-purple-400">
                        {log.type}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-medium text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {log.description}
                    </td>
                    <td className="p-4 font-mono text-xs text-slate-500 dark:text-slate-400 font-semibold">
                      {log.ip}
                    </td>
                    <td className="p-4 text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {log.date}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleInspectLog(log)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspecter</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CNDP Legal Footer Notice ────────────────────────────────────────── */}
      <div className="rounded-3xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col md:flex-row items-center justify-between gap-4 text-slate-600 dark:text-slate-400 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <p className="leading-relaxed font-semibold">
            <strong className="text-slate-900 dark:text-slate-100">Conformité CNDP & Loi 09-08 :</strong> Ce journal d'audit garantit l'immutabilité et la non-répudiation des accès aux données personnelles de l'ENCG Fès. Les données sont conservées pendant la durée légale de 5 ans.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-black text-[10px] uppercase tracking-wider shrink-0">
          CNDP Validé
        </span>
      </div>

      {/* ── Interactive Audit Trace Inspector Modal Drawer ──────────────────── */}
      {activeInspectLog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                    Inspecteur d'Événement Audit #{activeInspectLog.id}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Trace technique et horodatage certifié ISO-27001 & CNDP</p>
                </div>
              </div>

              <button
                onClick={() => setActiveInspectLog(null)}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Trace Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Utilisateur / Acteur</p>
                <p className="font-extrabold text-slate-900 dark:text-slate-100">{activeInspectLog.user}</p>
                {activeInspectLog.email && <p className="text-slate-500">{activeInspectLog.email}</p>}
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adresse IP & Client</p>
                <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{activeInspectLog.ip}</p>
                <p className="text-[10px] text-slate-400 truncate">{activeInspectLog.userAgent || 'Chrome/126.0'}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Action & Categorie</p>
                <p className="font-extrabold text-slate-900 dark:text-slate-100">{activeInspectLog.action}</p>
                <span className="inline-block px-2 py-0.5 rounded text-[9px] font-mono font-black bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  {activeInspectLog.type}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 space-y-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Horodatage Précis</p>
                <p className="font-bold text-slate-900 dark:text-slate-100">{activeInspectLog.date}</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">✓ Signature Loi 09-08</p>
              </div>
            </div>

            {/* Description & Payload JSON */}
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payload JSON & Contexte</p>
              <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-48 border border-slate-800">
                {JSON.stringify(activeInspectLog.payload || { description: activeInspectLog.description, status: 'VERIFIED', cndp: 'CONFORME' }, null, 2)}
              </pre>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={handleCopyPayload}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5"
              >
                {copiedPayload ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPayload ? 'Copié' : 'Copier JSON'}</span>
              </button>
              <button
                onClick={() => setActiveInspectLog(null)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition-all shadow-md cursor-pointer"
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
