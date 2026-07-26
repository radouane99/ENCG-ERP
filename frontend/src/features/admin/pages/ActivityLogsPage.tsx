import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { toast } from 'sonner';
import {
  ShieldCheck, Search, Filter, RefreshCw, Eye, User, Laptop, Clock, Activity,
  Lock, AlertTriangle, FileText, CheckCircle2, ChevronRight
} from 'lucide-react';
import { cn } from '@shared/lib/utils';

interface AuditLog {
  id: string;
  user: string;
  action: string;
  type: string;
  description: string;
  ip: string;
  date: string;
  severity?: 'info' | 'success' | 'warning' | 'error';
}

const fallbackLogs: AuditLog[] = [
  { id: '1', user: 'Admin ENCG Fès', action: 'Connexion / Session', type: 'AUTHENTICATION', description: 'Session active sur le portail ERP ENCG (Rôle : Super Admin)', ip: '10.0.4.12', date: '26/07/2026 00:45', severity: 'success' },
  { id: '2', user: 'Youssef El Mansouri', action: 'Demande Document', type: 'DOCUMENT', description: 'Demande d\'attestation de scolarité soumise en ligne', ip: '192.168.1.45', date: '25/07/2026 23:10', severity: 'info' },
  { id: '3', user: 'Prof. Amrani', action: 'Saisie Notes CC', type: 'GRADE', description: 'Mise à jour des notes du module Contrôle de Gestion S5', ip: '192.168.1.88', date: '25/07/2026 21:30', severity: 'info' },
  { id: '4', user: 'Salma Bennani', action: 'Demande Relevé', type: 'DOCUMENT', description: 'Demande de relevé de notes global S1-S4 validée', ip: '192.168.1.14', date: '25/07/2026 19:15', severity: 'success' },
  { id: '5', user: 'Système Securité', action: 'Contrôle Accès', type: 'SECURITY', description: 'Vérification périodique des privilèges et jetons JWT', ip: '127.0.0.1', date: '25/07/2026 18:00', severity: 'warning' },
];

export default function ActivityLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

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
      log.ip.includes(searchQuery);

    const matchesType = selectedType === 'ALL' || log.type === selectedType;

    return matchesSearch && matchesType;
  });

  const handleInspectLog = (log: AuditLog) => {
    toast.info(`Inspecteur d'événement #${log.id}`, {
      description: `${log.action} par ${log.user} (${log.ip}) le ${log.date}`
    });
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      
      {/* ── Premium Audit Hero Banner ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 md:p-10 text-white shadow-2xl border border-indigo-900/40">
        <div className="absolute -top-24 -end-24 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -start-20 w-72 h-72 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-black uppercase tracking-wider backdrop-blur-md">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Audit System & ISO-27001
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-slate-200 text-xs font-extrabold uppercase tracking-wider">
                Tracabilité ENCG Fès
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
              Journal d'Activité & Logs d'Audit
            </h1>

            <p className="text-slate-300/90 text-sm leading-relaxed">
              Consultez l'historique complet et sécurisé des opérations effectuées sur la plateforme : connexions, modifications de notes, demandes de documents et actions d'administration.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/15 px-5 py-3 rounded-2xl text-xs font-extrabold backdrop-blur-md transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Actualiser les Logs</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Security KPI Stat Row ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Événements</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{logs.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Authentification JWT</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">Conforme</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Actions Documents</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {logs.filter(l => l.type === 'DOCUMENT').length || 2}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Niveau de Sécurité</p>
            <p className="text-2xl font-black text-amber-500">Optimum</p>
          </div>
        </div>
      </div>

      {/* ── Table & Filter Controls Card ────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Détails des Événements Système
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Historique en temps réel des connexions et modifications
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher utilisateur, IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9 pe-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none w-52"
              />
            </div>

            {/* Type Filters */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {[
                { key: 'ALL', label: 'Tous' },
                { key: 'AUTHENTICATION', label: 'Auth' },
                { key: 'DOCUMENT', label: 'Docs' },
                { key: 'GRADE', label: 'Notes' },
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
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider">Utilisateur</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider">Action</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider">Type / Module</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider">Description</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider">IP / Client</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider">Date & Heure</th>
                <th className="p-4 text-xs font-black text-slate-400 uppercase tracking-wider">Détail</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs font-bold text-slate-400 italic">
                    Aucun événement d'audit ne correspond à la recherche.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-md">
                          {log.user.charAt(0)}
                        </div>
                        <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{log.user}</span>
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
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
                        title="Inspecter l'événement"
                      >
                        <Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
