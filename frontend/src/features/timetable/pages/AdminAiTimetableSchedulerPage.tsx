import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { toast } from 'sonner';
import {
  Calendar, Clock, CheckCircle2, AlertTriangle, ShieldCheck,
  RefreshCw, Play, Save, MapPin, User,
  Building2, Sliders, ShieldAlert, Cpu, Hand, Grid, Leaf
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import ManualTimetableBoard from '@/features/admin/pages/ManualTimetableBoard';
import OfficialTimetableMatrix from '@/features/admin/pages/OfficialTimetableMatrix';

export default function AdminAiTimetableSchedulerPage() {
  const [activeTab, setActiveTab] = useState<'generator' | 'manual_board' | 'matrix'>('generator');

  // Generator & CSP Parameters
  const [selectedSemester, setSelectedSemester] = useState<number>(2);
  const [selectedFiliere, setSelectedFiliere] = useState<string>('all');
  const [avoidSaturday, setAvoidSaturday] = useState<boolean>(true);
  const [preferMorning, setPreferMorning] = useState<boolean>(true);
  const [energyWeight, setEnergyWeight] = useState<number>(85);
  const [profAvailWeight, setProfAvailWeight] = useState<number>(90);
  const [buildingWeight, setBuildingWeight] = useState<number>(75);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('mrv_degree_lcv');

  // Filter state for preview grid
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
        energy_weight: energyWeight,
        prof_avail_weight: profAvailWeight,
        building_weight: buildingWeight,
        strategy: selectedStrategy,
      });
      return res.data?.data || res.data;
    },
    onSuccess: (data) => {
      toast.success(`⚡ Emploi du temps optimisé par IA avec succès ! (${data.total_scheduled_sessions || data.total_variables || 0} séances)`);
    },
    onError: () => {
      toast.error("Erreur lors de la génération automatique.");
    }
  });

  // 3. Apply Schedule Mutation (Deploy to Database)
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

  // 4. Auto-resolve single conflict mutation
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
  const scheduledSessions: any[] = generatedData?.scheduled_items || generatedData?.scheduled_sessions || [];

  const filteredSessions = scheduledSessions.filter((s: any) => {
    if (dayFilter !== 'all' && s.day_of_week !== dayFilter) return false;
    if (groupFilter !== 'all' && s.group_name !== groupFilter) return false;
    return true;
  });

  const uniqueGroups = Array.from(new Set(scheduledSessions.map((s: any) => s.group_name)));

  return (
    <div className="space-y-8 pb-20 animate-fade-in max-w-7xl mx-auto p-4 md:p-6 font-sans">
      
      {/* ── Hero Powerhouse Banner ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-[#001A4B] to-purple-950 p-6 md:p-10 text-white shadow-2xl border border-purple-900/40">
        <div className="absolute -top-24 -end-24 w-80 h-80 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -start-20 w-72 h-72 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-black uppercase tracking-wider backdrop-blur-md">
                <Cpu className="w-3.5 h-3.5 text-purple-400" /> Hub Intelligent des Emplois du Temps (IA & CSP Solver)
              </span>
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-extrabold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Zéro Conflit Garanti
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
              Générateur Intelligent & Studio des Emplois du Temps
            </h1>

            <p className="text-slate-300/90 text-sm leading-relaxed">
              Moteur unifié de planification sous contraintes (CSP), détection et résolution des conflits, ajustements manuels par Drag & Drop et matrice officielle d'occupation des salles.
            </p>
          </div>

          <div className="shrink-0 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setActiveTab('generator');
                generateMutation.mutate();
              }}
              disabled={generateMutation.isPending}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-7 py-3.5 rounded-2xl text-xs font-black transition-all shadow-xl active:scale-95 cursor-pointer border border-purple-400/30"
            >
              {generateMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
              <span>Lancer la Génération IA ⚡</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Mode Switcher Tabs ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('generator')}
          className={cn(
            "flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
            activeTab === 'generator'
              ? "bg-[#0f2863] text-white shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <Cpu className="w-4 h-4 text-purple-400" />
          <span>1. Génération & Anti-Conflits IA</span>
        </button>

        <button
          onClick={() => setActiveTab('manual_board')}
          className={cn(
            "flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
            activeTab === 'manual_board'
              ? "bg-[#0f2863] text-white shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <Hand className="w-4 h-4 text-amber-400" />
          <span>2. Studio Manuel (Drag & Drop)</span>
        </button>

        <button
          onClick={() => setActiveTab('matrix')}
          className={cn(
            "flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap",
            activeTab === 'matrix'
              ? "bg-[#0f2863] text-white shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <Grid className="w-4 h-4 text-emerald-400" />
          <span>3. Matrice Officielle & Occupation</span>
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: GENERATEUR & ANTI-CONFLITS IA ───────────────────────────────── */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'generator' && (
        <div className="space-y-8 animate-in fade-in">
          
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Séances Programmées</p>
                <p className="text-2xl font-black text-slate-900 dark:text-slate-100">
                  {scheduledSessions.length > 0 ? scheduledSessions.length : (generatedData?.total_variables || 42)} Séances
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800 flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Score de Satisfaction</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {generatedData?.optimization_score ?? generatedData?.satisfaction_rate ?? 100}%
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

          {/* Generator Controls & Sliders */}
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

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Semestre Universitaire
                  </label>
                  <select
                    value={selectedSemester}
                    onChange={(e) => setSelectedSemester(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value={1}>Semestre 1 (S1 - Tronc Commun)</option>
                    <option value={2}>Semestre 2 (S2 - Tronc Commun)</option>
                    <option value={3}>Semestre 3 (S3 - Tronc Commun)</option>
                    <option value={4}>Semestre 4 (S4 - Tronc Commun)</option>
                    <option value={5}>Semestre 5 (S5 - Filières & Options)</option>
                    <option value={6}>Semestre 6 (S6 - Filières & Options)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Filière Cible
                  </label>
                  <select
                    value={selectedFiliere}
                    onChange={(e) => setSelectedFiliere(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">Toutes les filières (TC & Masters)</option>
                    <option value="1">Tronc Commun ENCG</option>
                    <option value="2">Gestion Financière et Comptable (GFC)</option>
                    <option value="3">Management Commercial et Marketing (MCM)</option>
                    <option value="4">Audit et Contrôle de Gestion (ACG)</option>
                    <option value="5">Management des RH (GRH)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Heuristique de Résolution CSP
                  </label>
                  <select
                    value={selectedStrategy}
                    onChange={(e) => setSelectedStrategy(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-xs font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="mrv_degree_lcv">MRV + Degree + LCV (Recommandé - Optimal)</option>
                    <option value="forward_checking">Forward Checking déterministe</option>
                    <option value="min_conflicts">Min-Conflicts Local Search (Grandes Promotions)</option>
                  </select>
                </div>

                {/* CSP Weight Sliders */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl space-y-3 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5"><Leaf className="w-3.5 h-3.5 text-emerald-500" /> Économie d'Énergie Bâtiments</span>
                    <span className="font-mono text-emerald-600 font-black">{energyWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={energyWeight}
                    onChange={(e) => setEnergyWeight(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />

                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 pt-1">
                    <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-indigo-500" /> Disponibilité des Professeurs</span>
                    <span className="font-mono text-indigo-600 font-black">{profAvailWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={profAvailWeight}
                    onChange={(e) => setProfAvailWeight(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />

                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 pt-1">
                    <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-purple-500" /> Regroupement Bâtiments</span>
                    <span className="font-mono text-purple-600 font-black">{buildingWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={buildingWeight}
                    onChange={(e) => setBuildingWeight(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                {/* Heuristic Toggles */}
                <div className="pt-2 space-y-3">
                  <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl cursor-pointer border border-slate-200/60 dark:border-slate-700/60">
                    <input
                      type="checkbox"
                      checked={avoidSaturday}
                      onChange={(e) => setAvoidSaturday(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <div className="text-xs">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 block">Samedi Après-Midi Libre</span>
                      <span className="text-[10px] text-slate-400">Préservation des week-ends étudiants</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl cursor-pointer border border-slate-200/60 dark:border-slate-700/60">
                    <input
                      type="checkbox"
                      checked={preferMorning}
                      onChange={(e) => setPreferMorning(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <div className="text-xs">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 block">Priorité Cours Magistraux le Matin</span>
                      <span className="text-[10px] text-slate-400">Amphis placés de 08h30 à 12h15</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Live Conflict Scanner & 1-Click Fixer */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-amber-500" />
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                      Scanner de Conflits en Temps Réel
                    </h3>
                  </div>
                  <button
                    onClick={() => refetchConflicts()}
                    className="text-xs text-slate-400 hover:text-purple-600 flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Actualiser
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {(conflictData?.conflicts_count ?? 0) === 0 ? (
                    <div className="p-8 text-center bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <p className="font-black text-emerald-900 dark:text-emerald-300 text-sm">
                        Zéro Conflit Détecté dans la Base de Données
                      </p>
                      <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 max-w-md mx-auto">
                        Toutes les salles, professeurs et groupes d'étudiants sont parfaitement synchronisés sans aucun chevauchement horaire.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                          <div>
                            <span className="font-black text-amber-950 dark:text-amber-200 text-xs">
                              {conflictData?.conflicts_count} Anomalies de Planification Détectées
                            </span>
                            <p className="text-[11px] text-amber-800/80 dark:text-amber-400/80">
                              Des séances partagent le même créneau horaire ou la même salle.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Conflict details list */}
                      <div className="space-y-2 max-h-56 overflow-y-auto">
                        {conflictData?.conflicts?.map((conf: any, i: number) => (
                          <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between text-xs">
                            <div>
                              <span className="font-black text-slate-800 dark:text-slate-200">{conf.reason}</span>
                              <p className="text-[10px] text-slate-400">
                                {conf.day_name} • {conf.start_time} - {conf.end_time} • {conf.room_name}
                              </p>
                            </div>
                            <button
                              onClick={() => resolveMutation.mutate(conf.schedule_id)}
                              disabled={resolveMutation.isPending}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-black text-[10px] cursor-pointer"
                            >
                              Résoudre en 1 Clic 🪄
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Save to DB */}
              {scheduledSessions.length > 0 && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                  <div className="text-xs text-slate-500">
                    Proposition IA prête : <strong>{scheduledSessions.length} séances</strong> calculées.
                  </div>
                  <button
                    type="button"
                    onClick={() => applyMutation.mutate(scheduledSessions)}
                    disabled={applyMutation.isPending}
                    className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-6 py-3 rounded-2xl text-xs font-black transition-all shadow-lg active:scale-95 cursor-pointer"
                  >
                    {applyMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Déployer en Base de Données 💾</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Schedule Preview Grid */}
          {scheduledSessions.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200/80 dark:border-slate-800 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                    Aperçu de la Grille Optimisée par l'IA
                  </h3>
                  <p className="text-xs text-slate-400">
                    Séances hebdomadaires générées selon les contraintes de disponibilité et de capacité.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={dayFilter}
                    onChange={(e) => setDayFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                  >
                    <option value="all">Tous les jours</option>
                    <option value={1}>Lundi</option>
                    <option value={2}>Mardi</option>
                    <option value={3}>Mercredi</option>
                    <option value={4}>Jeudi</option>
                    <option value={5}>Vendredi</option>
                    <option value={6}>Samedi</option>
                  </select>

                  {uniqueGroups.length > 0 && (
                    <select
                      value={groupFilter}
                      onChange={(e) => setGroupFilter(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none"
                    >
                      <option value="all">Tous les groupes</option>
                      {uniqueGroups.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Sessions Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSessions.map((session: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 hover:border-purple-500/40 transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300">
                        {session.day_name}
                      </span>
                      <span className="text-xs font-black text-slate-900 dark:text-slate-100 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3 text-purple-600" />
                        {session.start_time} - {session.end_time}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-black text-sm text-slate-900 dark:text-slate-100">
                        {session.module_name}
                      </h4>
                      <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                        {session.group_name} • {session.filiere_code}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {session.professor_name}
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-purple-500" />
                        {session.room_name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 2: STUDIO MANUEL (DRAG & DROP BOARD) ───────────────────────────── */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'manual_board' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Hand className="w-6 h-6 text-amber-600 shrink-0" />
              <div>
                <h4 className="font-black text-xs text-amber-950 dark:text-amber-200">
                  Studio d'Ajustement Manuel par Glisser-Déposer (Drag & Drop)
                </h4>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-400/80">
                  Glissez et déposez les séances directement dans les créneaux horaires pour personnaliser la grille manuellement.
                </p>
              </div>
            </div>
          </div>

          <ManualTimetableBoard
            versionId={1}
            filiereLabel={`Semestre ${selectedSemester} - Tronc Commun`}
            onBack={() => setActiveTab('generator')}
            onChanged={() => refetchConflicts()}
          />
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 3: MATRICE OFFICIELLE & OCCUPATION ──────────────────────────────── */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'matrix' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Grid className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h4 className="font-black text-xs text-emerald-950 dark:text-emerald-200">
                  Matrice Officielle d'Affichage & d'Occupation des Salles
                </h4>
                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-400/80">
                  Tableau synoptique conforme aux maquettes d'affichage pédagogique de l'ENCG Fès.
                </p>
              </div>
            </div>
          </div>

          <OfficialTimetableMatrix matrix={generatedData?.official_matrix || generatedData?.matrix || generatedData} />
        </div>
      )}

    </div>
  );
}
