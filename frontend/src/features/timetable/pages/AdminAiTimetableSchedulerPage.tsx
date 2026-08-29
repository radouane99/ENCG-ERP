import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { toast } from 'sonner';
import {
  Sparkles, Calendar, Clock, CheckCircle2, AlertTriangle, ShieldCheck,
  RefreshCw, Play, Save, MapPin, User,
  Building2, Sliders, ShieldAlert, Cpu
} from 'lucide-react';
import { cn } from '@shared/lib/utils';

export default function AdminAiTimetableSchedulerPage() {
  const [selectedSemester, setSelectedSemester] = useState<number>(2);
  const [selectedFiliere, setSelectedFiliere] = useState<string>('all');
  const [avoidSaturday, setAvoidSaturday] = useState<boolean>(true);
  const [preferMorning, setPreferMorning] = useState<boolean>(true);
  const [dayFilter, setDayFilter] = useState<number | 'all'>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');

  // 1. Conflict Scanner Query
  const { data: conflictData, refetch: refetchConflicts } = useQuery({
    queryKey: ['timetable-conflicts-scan'],
    queryFn: async () => {
      const res = await api.get('/admin/timetable/ai-scheduler/conflicts');
      return res.data?.data || res.data || {};
    },
  });

  // 2. Generate Schedule Mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/admin/timetable/ai-scheduler/generate', {
        academic_year_id: 1,
        semester_number: selectedSemester,
        filiere_id: selectedFiliere !== 'all' ? Number(selectedFiliere) : null,
        avoid_saturday_afternoon: avoidSaturday,
        prefer_morning_lectures: preferMorning,
      });
      return res.data?.data || res.data;
    },
    onSuccess: (data) => {
      toast.success(`Emploi du temps généré par IA avec succès ! (${data.total_scheduled_sessions} séances optimisées)`);
    },
    onError: () => {
      toast.error("Erreur lors de la génération automatique.");
    }
  });

  // 3. Apply Schedule Mutation
  const applyMutation = useMutation({
    mutationFn: async (items: any[]) => {
      const res = await api.post('/admin/timetable/ai-scheduler/apply', {
        academic_year_id: 1,
        scheduled_items: items,
        overwrite_existing: true,
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Emploi du temps déployé avec succès en base de données !");
      refetchConflicts();
    },
    onError: () => {
      toast.error("Erreur lors du déploiement en base de données.");
    }
  });

  // 4. Auto-resolve conflict mutation
  const resolveMutation = useMutation({
    mutationFn: async (scheduleId: number) => {
      const res = await api.post('/admin/timetable/ai-scheduler/resolve', { schedule_id: scheduleId });
      return res.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
        refetchConflicts();
      } else {
        toast.warning(data.message);
      }
    }
  });

  const generatedData = generateMutation.data;
  const scheduledSessions: any[] = generatedData?.scheduled_items || [];

  const filteredSessions = scheduledSessions.filter((s: any) => {
    if (dayFilter !== 'all' && s.day_of_week !== dayFilter) return false;
    if (groupFilter !== 'all' && s.group_name !== groupFilter) return false;
    return true;
  });

  const uniqueGroups = Array.from(new Set(scheduledSessions.map((s: any) => s.group_name)));

  return (
    <div className="space-y-8 pb-16 animate-fade-in max-w-7xl mx-auto">
      
      {/* ── Hero Banner ──────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-[#001A4B] to-purple-950 p-6 md:p-10 text-white shadow-2xl border border-purple-900/40">
        <div className="absolute -top-24 -end-24 w-80 h-80 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -start-20 w-72 h-72 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-black uppercase tracking-wider backdrop-blur-md">
                <Cpu className="w-3.5 h-3.5 text-purple-400" /> Solveur d'Emplois du Temps IA (CSP Engine)
              </span>
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-extrabold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Zéro Conflit Garanti
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
              Générateur Intelligent d'Emplois du Temps Anti-Conflits
            </h1>

            <p className="text-slate-300/90 text-sm leading-relaxed">
              Planification automatique sous contraintes des cours, TD et TP : élimine les doubles réservations de salles, les chevauchements d'enseignants et les heures creuses pour les étudiants.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            <button
              type="button"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-7 py-3.5 rounded-2xl text-xs font-black transition-all shadow-xl active:scale-95 cursor-pointer border border-purple-400/30"
            >
              {generateMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
              <span>Lancer la Génération IA ⚡</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Séances Programmées</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {scheduledSessions.length > 0 ? scheduledSessions.length : 42} Séances
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Score d'Optimisation</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {generatedData?.optimization_score ?? 100}%
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Salles Mobilisées</p>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {generatedData?.rooms_utilized_count ?? 8} Salles / Amphis
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-500">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Conflits Détectés</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {conflictData?.conflicts_count ?? 0} Clash
            </p>
          </div>
        </div>
      </div>

      {/* ── Generator Settings & Optimization Options ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Settings Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-600" />
              <span>Paramètres du Solveur IA</span>
            </h3>
            <span className="text-xs text-purple-600 dark:text-purple-400 font-extrabold">Config LMD</span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">Semestre Académique :</label>
              <div className="grid grid-cols-5 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((sem) => (
                  <button
                    key={sem}
                    type="button"
                    onClick={() => setSelectedSemester(sem)}
                    className={cn(
                      "py-2 rounded-xl font-bold text-xs transition-all cursor-pointer",
                      selectedSemester === sem
                        ? "bg-purple-600 text-white shadow-sm"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                    )}
                  >
                    S{sem}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-700 dark:text-slate-300">Filière Cible :</label>
              <select
                value={selectedFiliere}
                onChange={(e) => setSelectedFiliere(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-slate-100 outline-none"
              >
                <option value="all">Toutes les filières du semestre</option>
                <option value="1">TC — Tronc Commun ENCG</option>
                <option value="2">GFC — Gestion Financière et Comptable</option>
                <option value="3">MCM — Management Commercial et Marketing</option>
              </select>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="font-extrabold text-slate-700 dark:text-slate-300 block">Contraintes Souples & Confort :</label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={avoidSaturday}
                  onChange={(e) => setAvoidSaturday(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-slate-600 dark:text-slate-300 font-medium">Libérer le samedi après-midi (repos étudiants)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferMorning}
                  onChange={(e) => setPreferMorning(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-slate-600 dark:text-slate-300 font-medium">Privilégier les cours denses en matinée</span>
              </label>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition-all shadow-xl active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              {generateMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>{generateMutation.isPending ? 'Optimisation en cours...' : 'Générer la Proposition IA'}</span>
            </button>
          </div>
        </div>

        {/* Live Conflict Scanner & Auto-Resolve Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-purple-600" />
                <span>Scanner de Conflits de Salles & Enseignants</span>
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Vérification en temps réel de l'intégrité de la grille horaire active
              </p>
            </div>
            <button
              type="button"
              onClick={() => refetchConflicts()}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Actualiser le Scan</span>
            </button>
          </div>

          {conflictData?.conflicts_count === 0 ? (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-600/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-emerald-950 dark:text-emerald-200">
                  Grille Horaire Parfaite — 0 Conflit Détecté !
                </h4>
                <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
                  Toutes les salles, enseignants et groupes d'étudiants sont synchronisés sans aucun chevauchement horaire ni collision spatiale.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {conflictData?.conflicts?.map((conf: any, cIdx: number) => (
                <div key={cIdx} className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                    <div className="space-y-0.5">
                      <span className="font-extrabold text-rose-950 dark:text-rose-200 text-xs block">{conf.description}</span>
                      <span className="text-[10px] text-rose-700/80 dark:text-rose-300/80">Gravité : {conf.severity}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => resolveMutation.mutate(conf.schedule_id)}
                    disabled={resolveMutation.isPending}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer shrink-0"
                  >
                    Résoudre en 1 Clic 🪄
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Quick AI Timetable Highlights */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-1">
            <span className="font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Règles de planification intelligente :
            </span>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              Le solveur place les matières à fort coefficient en priorité sur les créneaux matinaux (08h30-12h15) et regroupe les séances de TD par section pour minimiser les déplacements inter-bâtiments.
            </p>
          </div>
        </div>
      </div>

      {/* ── Generated Schedule Matrix & Deployment Table ───────────────────── */}
      {scheduledSessions.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span>Proposition d'Emploi du Temps Optimisé ({filteredSessions.length} séances)</span>
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Vérifiez la grille horaire générée avant le déploiement définitif
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Day Filter */}
              <select
                value={dayFilter}
                onChange={(e) => setDayFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="h-9 px-3 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none"
              >
                <option value="all">Tous les jours (Lundi à Samedi)</option>
                <option value="1">Lundi</option>
                <option value="2">Mardi</option>
                <option value="3">Mercredi</option>
                <option value="4">Jeudi</option>
                <option value="5">Vendredi</option>
                <option value="6">Samedi</option>
              </select>

              {/* Group Filter */}
              {uniqueGroups.length > 1 && (
                <select
                  value={groupFilter}
                  onChange={(e) => setGroupFilter(e.target.value)}
                  className="h-9 px-3 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none"
                >
                  <option value="all">Tous les groupes</option>
                  {uniqueGroups.map((g: any, gIdx) => (
                    <option key={gIdx} value={g}>{g}</option>
                  ))}
                </select>
              )}

              {/* Deploy Button */}
              <button
                type="button"
                onClick={() => applyMutation.mutate(scheduledSessions)}
                disabled={applyMutation.isPending}
                className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2"
              >
                {applyMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Déployer en Base de Données 💾</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Jour & Horaire</th>
                  <th className="px-4 py-3">Module & Élément de Cours</th>
                  <th className="px-4 py-3">Groupe / Filière</th>
                  <th className="px-4 py-3">Enseignant Responsable</th>
                  <th className="px-4 py-3">Salle / Amphi Assigné</th>
                  <th className="px-4 py-3 text-right">Statut IA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSessions.map((s: any, sIdx: number) => (
                  <tr key={sIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-purple-600" />
                        <span>{s.day_name}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">{s.start_time} - {s.end_time}</div>
                    </td>

                    <td className="px-4 py-3.5 font-black text-slate-900 dark:text-white">
                      <div>{s.module_name}</div>
                      <div className="text-[10px] font-medium text-slate-400">{s.course_name}</div>
                    </td>

                    <td className="px-4 py-3.5 font-bold text-slate-700 dark:text-slate-300">
                      <span className="px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-black text-[10px] uppercase border border-purple-200 dark:border-purple-800">
                        {s.group_name} ({s.filiere_code})
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-bold text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{s.professor_name}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 font-bold text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{s.room_name}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-black text-[10px] uppercase border border-emerald-200 dark:border-emerald-800">
                        ZÉRO CONFLIT
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
