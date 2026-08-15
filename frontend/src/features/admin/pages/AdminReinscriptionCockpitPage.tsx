import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users, CheckCircle2, Clock, AlertTriangle, Send, Search,
  Filter, Download, RefreshCw, Sparkles, Building2, Phone,
  Mail, Calendar, ArrowRight, ShieldCheck, Check
} from 'lucide-react';
import api from '@shared/lib/api';
import { toast } from 'sonner';
import { cn } from '@shared/lib/utils';

export default function AdminReinscriptionCockpitPage() {
  const queryClient = useQueryClient();
  const [levelFilter, setLevelFilter] = useState<'all' | '2A' | '3A' | '4A' | '5A'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: resData, isLoading, refetch } = useQuery({
    queryKey: ['admin-reinscription-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/reinscriptions/stats');
      return res.data?.data || res.data;
    },
  });

  const reminderMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/admin/reinscriptions/send-reminders');
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Rappels envoyés avec succès aux retardataires !');
      queryClient.invalidateQueries({ queryKey: ['admin-reinscription-stats'] });
    },
    onError: () => {
      toast.error("Erreur lors de l'envoi des rappels.");
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-slate-500 font-bold text-sm">Chargement du Cockpit des Réinscriptions...</p>
      </div>
    );
  }

  const d = resData || {};
  const byLevel = d.by_level || {};
  const studentsList: any[] = d.students || [];

  const filteredStudents = studentsList.filter((s) => {
    const matchesSearch =
      (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.cne || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.cin || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (levelFilter !== 'all') {
      if (levelFilter === '2A' && !s.current_level.includes('2ème')) return false;
      if (levelFilter === '3A' && !s.current_level.includes('3ème')) return false;
      if (levelFilter === '4A' && !s.current_level.includes('4ème')) return false;
      if (levelFilter === '5A' && !s.current_level.includes('5ème')) return false;
    }

    if (statusFilter === 'confirmed' && !s.is_confirmed) return false;
    if (statusFilter === 'pending' && s.is_confirmed) return false;

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in pb-24">
      {/* Header Banner */}
      <div className="bg-[#0f2863] rounded-[2.5rem] p-8 md:p-10 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 border border-blue-400/20">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-400/30">
            <Sparkles className="w-3.5 h-3.5" /> Campagne de Rentrée {d.academic_year || '2026/2027'}
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Cockpit de Suivi des Réinscriptions Annuelles
          </h1>
          <p className="text-blue-200 text-xs md:text-sm max-w-xl">
            Contrôle en temps réel des effectifs réinscrits par niveau et gestion des relances pour la rentrée universitaire.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => refetch()}
            className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all border border-white/15 cursor-pointer shadow-sm"
            title="Rafraîchir les statistiques"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => reminderMutation.mutate()}
            disabled={reminderMutation.isPending || d.total_pending === 0}
            className="px-5 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {reminderMutation.isPending ? 'Envoi...' : `Relancer les Retardataires (${d.total_pending || 0})`}
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-black uppercase tracking-wider">Effectif Admis Total</span>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{d.total_eligible || 0}</div>
          <span className="text-[11px] text-slate-400 font-bold mt-1 block">Étudiants éligibles à la réinscription</span>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-black uppercase tracking-wider">Réinscrits Confirmés</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-700 dark:text-emerald-300">{d.total_confirmed || 0}</div>
          <span className="text-[11px] text-emerald-600 font-bold mt-1 block">Taux : {d.confirmation_rate || 0}% de l'effectif</span>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-black uppercase tracking-wider">En Attente de Confirmation</span>
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-700 dark:text-amber-300">{d.total_pending || 0}</div>
          <span className="text-[11px] text-amber-600 font-bold mt-1 block">À relancer avant la rentrée</span>
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between text-indigo-600 mb-2">
            <span className="text-xs font-black uppercase tracking-wider">Groupes Pédagogiques</span>
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-indigo-700 dark:text-indigo-300">100%</div>
          <span className="text-[11px] text-indigo-600 font-bold mt-1 block">Affectation auto à la confirmation</span>
        </div>
      </div>

      {/* Level Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(byLevel).map(([key, val]: [string, any]) => {
          const rate = val.total > 0 ? Math.round((val.confirmed / val.total) * 100) : 0;
          return (
            <div key={key} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-black text-xs uppercase text-slate-800 dark:text-slate-200">{val.label}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 dark:bg-blue-950 text-[#0f2863] dark:text-blue-300">
                  {rate}%
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${rate}%` }} />
              </div>
              <div className="flex justify-between text-[11px] text-slate-500 font-bold">
                <span>{val.confirmed} Confirmés</span>
                <span>{val.pending} En attente</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par Nom, CNE ou CIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Level filter tabs */}
            {(['all', '2A', '3A', '4A', '5A'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-black uppercase transition-all cursor-pointer",
                  levelFilter === lvl
                    ? "bg-[#0f2863] text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                )}
              >
                {lvl === 'all' ? 'Tous Niveaux' : lvl}
              </button>
            ))}

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block" />

            {/* Status filter tabs */}
            {(['all', 'confirmed', 'pending'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  "px-3.5 py-2 rounded-xl text-xs font-black uppercase transition-all cursor-pointer",
                  statusFilter === st
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                )}
              >
                {st === 'all' ? 'Tous Statuts' : st === 'confirmed' ? 'Confirmés' : 'En Attente'}
              </button>
            ))}
          </div>
        </div>

        {/* Student Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-black uppercase text-[10px]">
                <th className="py-3 px-4">Étudiant</th>
                <th className="py-3 px-4">CNE / CIN</th>
                <th className="py-3 px-4">Niveau Cible</th>
                <th className="py-3 px-4">Filière</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Récépissé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.map((s: any) => (
                <tr key={s.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                    {s.name}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-600 dark:text-slate-300">
                    {s.cne} <span className="text-[10px] text-slate-400 block font-normal">{s.cin}</span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                    {s.current_level}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {s.filiere}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    <div>{s.phone}</div>
                    <span className="text-[10px] text-slate-400">{s.email}</span>
                  </td>
                  <td className="py-3 px-4">
                    {s.is_confirmed ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                        <Check className="w-3 h-3" /> Réinscrit
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                        <Clock className="w-3 h-3" /> En attente
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[10px] text-slate-500">
                    {s.is_confirmed ? s.receipt_ref : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
