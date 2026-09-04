import React, { useState } from 'react';
import { 
  Clock, 
  Download, 
  CreditCard, 
  ShieldCheck,
  CheckCircle2,
  Calendar,
  CalendarDays,
  BookOpen,
  GraduationCap,
  TrendingUp,
  Award,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api';
import { useAuthStore } from '@stores/authStore';
import { openAuthenticatedUrl } from '@shared/lib/documentAccess';
import { toast } from 'sonner';

export default function ProfessorWorkloadPage() {
  const { user, hasRole } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'annual' | 'monthly' | 'weekly' | 'modules'>('annual');
  const [adminSimulatedRole, setAdminSimulatedRole] = useState<'auto' | 'permanent' | 'vacataire'>('auto');

  const { data: workloadData, isLoading, isError } = useQuery({
    queryKey: ['professor-workload'],
    queryFn: async () => {
      const res = await api.get('/professor-portal/workload');
      return res.data?.data ?? null;
    }
  });

  // Automatic Role Detection:
  // 1. Spatie role 'vacataire'
  // 2. Or user.roles array contains 'vacataire'
  // 3. Or backend workload summary marks contract as vacataire
  const isVacataireDetected = hasRole('vacataire') || 
                             (user?.roles && Array.isArray(user.roles) && user.roles.includes('vacataire')) || 
                             Boolean(workloadData?.is_vacataire);

  // Administrative simulation only for admins / dept heads
  const isAdminOrHead = hasRole('super-admin') || hasRole('admin') || hasRole('department-head');
  
  const isVacataire = (isAdminOrHead && adminSimulatedRole !== 'auto')
    ? (adminSimulatedRole === 'vacataire')
    : isVacataireDetected;

  const handleDownloadWorkloadPdf = () => {
    openAuthenticatedUrl('/api/professor-portal/workload-pdf');
    toast.success(
      isVacataire 
        ? '📄 Téléchargement du Bordereau de Vacation Officiel & Décompte pour Paiement !'
        : '📄 Téléchargement du Bordereau Annuel des Services Pédagogiques & Attestation de Service Fait !'
    );
  };

  // Loading Skeleton Screen
  if (isLoading) {
    return (
      <div className="space-y-8 font-sans p-2 animate-pulse text-slate-900 dark:text-slate-100">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-2xl w-80"></div>
        <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-[2.5rem] w-full"></div>
        <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-3xl w-full"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
          ))}
        </div>
      </div>
    );
  }

  // Error / Empty State if no professor profile found
  if (isError || !workloadData) {
    return (
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 text-center space-y-4 max-w-xl mx-auto my-12">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Aucune donnée de charge d'enseignement</h2>
        <p className="text-sm text-slate-500">
          Aucun profil enseignant ou créneau d'enseignement n'a été trouvé pour votre compte dans la base de données.
        </p>
      </div>
    );
  }

  // 100% Live Database Data - No mock fallbacks
  const w = workloadData;

  return (
    <div className="space-y-8 font-sans animate-in fade-in duration-500 text-slate-900 dark:text-slate-100 pb-28">
      
      {/* ── Role Status Badge & Optional Admin Switcher ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700/60">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 pl-2">
          <GraduationCap className="w-4 h-4 text-[#001A4B] dark:text-blue-400" />
          <span>Statut Enseignant Détecté :</span>
          <span className={cn(
            "px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wider",
            isVacataire 
              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300/60" 
              : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300/60"
          )}>
            {isVacataire ? "Enseignant Vacataire (Paiement à l'Heure)" : "Professeur Permanent (Statutaire MESRSFC)"}
          </span>
        </div>

        {/* Administration Inspection Switcher (Only visible to admin / dept-head) */}
        {isAdminOrHead && (
          <div className="flex items-center gap-1.5 text-xs font-bold bg-white dark:bg-slate-900 p-1 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest px-2 font-black">Mode Test Admin :</span>
            <button
              onClick={() => setAdminSimulatedRole('auto')}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                adminSimulatedRole === 'auto' ? "bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-500"
              )}
            >
              Auto
            </button>
            <button
              onClick={() => setAdminSimulatedRole('permanent')}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                adminSimulatedRole === 'permanent' ? "bg-[#001A4B] text-white" : "text-slate-500"
              )}
            >
              Permanent
            </button>
            <button
              onClick={() => setAdminSimulatedRole('vacataire')}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                adminSimulatedRole === 'vacataire' ? "bg-amber-500 text-[#001A4B]" : "text-slate-500"
              )}
            >
              Vacataire
            </button>
          </div>
        )}
      </div>

      {/* ── Executive Header Banner ── */}
      <div className={cn(
        "rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl border flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden transition-all duration-300",
        isVacataire
          ? "bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#1e1b4b] border-amber-500/20"
          : "bg-gradient-to-br from-[#001A4B] via-[#082663] to-[#0d1d3d] border-white/10"
      )}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-5 relative z-10">
          <div className={cn(
            "w-16 h-16 rounded-3xl flex items-center justify-center shadow-xl shrink-0 font-black",
            isVacataire 
              ? "bg-gradient-to-br from-amber-400 to-amber-500 shadow-amber-500/20 text-[#001A4B]" 
              : "bg-gradient-to-br from-emerald-400 to-teal-500 shadow-emerald-500/20 text-[#001A4B]"
          )}>
            {isVacataire ? <CreditCard className="w-8 h-8" /> : <Clock className="w-8 h-8" />}
          </div>
          <div className="space-y-1">
            <span className={cn(
              "px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1 border",
              isVacataire
                ? "bg-amber-500/20 text-amber-300 border-amber-400/30"
                : "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
            )}>
              {isVacataire ? (
                <>
                  <CreditCard className="w-3.5 h-3.5 text-amber-400" /> Gestion RH & Décompte des Vacations
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Service Pédagogique & Suivi des Séances
                </>
              )}
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              {isVacataire 
                ? "Décompte des Heures de Vacation & Rémunération" 
                : "Suivi des Enseignements & Charge Statutaire"}
            </h1>
            <p className="text-xs md:text-sm text-blue-200 font-medium max-w-2xl">
              {isVacataire
                ? "Suivi transparent de vos volumes horaires de vacation réalisés, décomptes mensuels et ordonnancement de paiement."
                : "Suivi certifié des heures d'enseignement (CM, TD, TP), séances validées au cahier de textes et avancement statutaire."}
            </p>
          </div>
        </div>

        <button
          onClick={handleDownloadWorkloadPdf}
          className="px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shrink-0 cursor-pointer bg-amber-400 hover:bg-amber-300 text-[#001A4B] shadow-amber-400/20"
        >
          <Download className="w-4 h-4" /> 
          {isVacataire ? "Bordereau de Vacation (PDF)" : "Bordereau Certifié (PDF)"}
        </button>
      </div>

      {/* ── AUTOMATIC VIEW SWITCHING: PERMANENT vs VACATAIRE ── */}
      {!isVacataire ? (
        /* ============================================================ */
        /*               PROFESSEUR PERMANENT VIEW                      */
        /* ============================================================ */
        <>
          {/* Statutory Hours Progression Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600" />
                  Progression de la Charge Annuelle Statutaire
                </h2>
                <p className="text-xs text-slate-400 font-medium">Année Académique 2026/2027 • ENCG Fès • Quota légal (PES / PH / PA)</p>
              </div>

              <span className="px-3.5 py-1 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-black">
                Professeur Permanent
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline text-sm font-black">
                <span className="text-slate-800 dark:text-white">
                  Heures Enseignées Réalisées : <strong className="text-blue-600 dark:text-blue-400 text-lg">{w.hours_done ?? 0}h</strong>
                </span>
                <span className="text-slate-500 font-mono text-xs">
                  Objectif Statutaire Annuel : <strong>{w.statutory_hours ?? 200}h</strong> ({w.remaining_hours ?? 0}h restantes)
                </span>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-4 p-0.5 border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, w.completion_percent ?? 0)}%` }}
                ></div>
              </div>

              <div className="flex justify-between text-xs font-bold text-slate-500 pt-1">
                <span>Cours Magistraux (CM) : <strong className="text-slate-800 dark:text-white">{w.hours_cm ?? 0}h</strong></span>
                <span>Travaux Dirigés (TD) : <strong className="text-slate-800 dark:text-white">{w.hours_td ?? 0}h</strong></span>
                <span>Travaux Pratiques (TP) : <strong className="text-slate-800 dark:text-white">{w.hours_tp ?? 0}h</strong></span>
                <span className="text-emerald-600 dark:text-emerald-400 font-black">{w.completion_percent ?? 0}% complété</span>
              </div>
            </div>
          </div>

          {/* KPI Cards: PURE PEDAGOGICAL (NO MONEY / NO VIREMENT) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
              <div className="w-13 h-13 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Volume Hebdomadaire</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">{w.weekly_hours ?? 0} Heures / sem.</div>
                <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  {w.weekly_schedule_summary?.length ?? 0} séances par semaine
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
              <div className="w-13 h-13 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cahier de Textes</div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{w.cahier_de_texte_count ?? 0} Séances</div>
                <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">{w.cahier_de_texte_compliance ?? 'Non renseigné'}</div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
              <div className="w-13 h-13 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Avancement Syllabus</div>
                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{w.syllabus_progress ?? 0}% Réalisé</div>
                <div className="text-[11px] font-bold text-slate-500">Moyenne globale des modules</div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
              <div className="w-13 h-13 rounded-2xl bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 flex items-center justify-center font-black shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Service Fait</div>
                <div className="text-xs font-black text-slate-900 dark:text-white leading-snug">{w.service_status}</div>
                <div className="text-[11px] font-bold text-teal-600 dark:text-teal-400">Statut officiel académique</div>
              </div>
            </div>
          </div>

          {/* Temporal Period Tabs Selector (Par Semaine / Par Mois / Par An / Modules) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wide">
                  Détail Pédagogique des Séances & Horaires
                </h2>
                <p className="text-xs text-slate-400 font-medium">Consultez vos séances par semaine, par mois ou par module enseigné</p>
              </div>

              {/* Tabs Navigation */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                <button
                  onClick={() => setActiveTab('annual')}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5",
                    activeTab === 'annual'
                      ? "bg-white dark:bg-slate-900 text-[#001A4B] dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <Calendar className="w-3.5 h-3.5" /> Vue Annuelle
                </button>
                <button
                  onClick={() => setActiveTab('monthly')}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5",
                    activeTab === 'monthly'
                      ? "bg-white dark:bg-slate-900 text-[#001A4B] dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <CalendarDays className="w-3.5 h-3.5" /> Par Mois
                </button>
                <button
                  onClick={() => setActiveTab('weekly')}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5",
                    activeTab === 'weekly'
                      ? "bg-white dark:bg-slate-900 text-[#001A4B] dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <Clock className="w-3.5 h-3.5" /> Par Semaine
                </button>
                <button
                  onClick={() => setActiveTab('modules')}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5",
                    activeTab === 'modules'
                      ? "bg-white dark:bg-slate-900 text-[#001A4B] dark:text-white shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  <BookOpen className="w-3.5 h-3.5" /> Par Module
                </button>
              </div>
            </div>

            {/* TAB CONTENT 1: VUE ANNUELLE & STATUTAIRE */}
            {activeTab === 'annual' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 space-y-2">
                    <div className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">Volume CM Réalisé</div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {w.hours_cm ?? 0}h <span className="text-xs font-normal text-slate-500">/ {Math.round((w.hours_cm ?? 0) / 2)} séances</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Cours Magistraux en amphithéâtre et grandes promotions.</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 space-y-2">
                    <div className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">Volume TD Réalisé</div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {w.hours_td ?? 0}h <span className="text-xs font-normal text-slate-500">/ {Math.round((w.hours_td ?? 0) / 2)} séances</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Travaux Dirigés dispensés par groupes d'études réduits.</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 space-y-2">
                    <div className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider">Volume TP & Ateliers</div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">
                      {w.hours_tp ?? 0}h <span className="text-xs font-normal text-slate-500">/ {Math.round((w.hours_tp ?? 0) / 2)} séances</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Travaux Pratiques en laboratoires informatiques & études de cas.</p>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Attestation Officielle de Service Fait disponible au téléchargement avec visa numérique du Chef de Département et du Doyen.
                    </span>
                  </div>
                  <button 
                    onClick={handleDownloadWorkloadPdf}
                    className="text-xs font-black text-blue-600 dark:text-blue-400 hover:underline shrink-0 cursor-pointer"
                  >
                    Télécharger PDF →
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: VUE MENSUELLE */}
            {activeTab === 'monthly' && (
              <div className="overflow-x-auto animate-in fade-in duration-300">
                {(!w.monthly_breakdown || w.monthly_breakdown.length === 0) ? (
                  <div className="py-12 text-center text-xs font-bold text-slate-400">
                    Aucun décompte mensuel disponible.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        <th className="pb-3 pl-2">Mois</th>
                        <th className="pb-3 text-center">Séances Réalisées</th>
                        <th className="pb-3 text-center">Cours Magistral (CM)</th>
                        <th className="pb-3 text-center">Travaux Dirigés (TD)</th>
                        <th className="pb-3 text-center">Travaux Pratiques (TP)</th>
                        <th className="pb-3 text-center">Total Heures</th>
                        <th className="pb-3 text-right pr-2">Certification Cahier de Texte</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-bold">
                      {w.monthly_breakdown.map((row: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-4 pl-2 font-black text-slate-900 dark:text-white">{row.month} 2026</td>
                          <td className="py-4 text-center text-slate-700 dark:text-slate-300">{row.sessions || Math.round((row.total ?? 0) / 2)} séances</td>
                          <td className="py-4 text-center text-slate-700 dark:text-slate-300">{row.cm ?? 0}h</td>
                          <td className="py-4 text-center text-slate-700 dark:text-slate-300">{row.td ?? 0}h</td>
                          <td className="py-4 text-center text-slate-700 dark:text-slate-300">{row.tp ?? 0}h</td>
                          <td className="py-4 text-center">
                            <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-xl font-black font-mono">
                              {row.total ?? 0}h
                            </span>
                          </td>
                          <td className="py-4 text-right pr-2">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                              row.status?.includes('Certifié') 
                                ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" 
                                : "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                            )}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: VUE HEBDOMADAIRE (RYTHME DE SEMAINE) */}
            {activeTab === 'weekly' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {(!w.weekly_schedule_summary || w.weekly_schedule_summary.length === 0) ? (
                  <div className="py-12 text-center text-xs font-bold text-slate-400">
                    Aucun créneau planifié dans l'emploi du temps.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {w.weekly_schedule_summary.map((slot: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-black uppercase">
                            {slot.day}
                          </span>
                          <span className="font-mono text-xs font-bold text-slate-500">{slot.time}</span>
                        </div>
                        <div>
                          <div className="text-sm font-black text-slate-900 dark:text-white">{slot.module}</div>
                          <div className="text-xs text-slate-500 font-medium mt-0.5">
                            {slot.group} • {slot.room}
                          </div>
                        </div>
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700/50 flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-600 dark:text-slate-400">Type : {slot.type}</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-black">{slot.duration_hours ?? 2}h certifiées</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 4: VUE PAR MODULE & SYLLABUS */}
            {activeTab === 'modules' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                {(!w.modules_breakdown || w.modules_breakdown.length === 0) ? (
                  <div className="py-12 text-center text-xs font-bold text-slate-400">
                    Aucun module affecté dans l'emploi du temps.
                  </div>
                ) : (
                  w.modules_breakdown.map((mod: any, idx: number) => (
                    <div key={idx} className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-black text-slate-700 dark:text-slate-300">
                              {mod.code}
                            </span>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white">{mod.name}</h3>
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-1">{mod.filiere} • Type : {mod.type}</p>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-black text-blue-600 dark:text-blue-400">
                            {mod.total}h <span className="text-xs text-slate-400">({mod.sessions} séances)</span>
                          </div>
                          <span className="text-xs font-bold text-slate-400">CM : {mod.cm}h | TD/TP : {mod.td + (mod.tp || 0)}h</span>
                        </div>
                      </div>

                      {/* Progress Bar for Module Syllabus */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-600 dark:text-slate-400">Avancement des chapitres au Cahier de Textes</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-black">{mod.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${mod.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>
        </>
      ) : (
        /* ============================================================ */
        /*               PROFESSEUR VACATAIRE VIEW                      */
        /* ============================================================ */
        <>
          {/* Vacation Hours Progression */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-500" />
                  Décompte des Heures de Vacation Réalisées
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  Réf. Contrat de Vacation : <strong className="font-mono text-slate-700 dark:text-slate-300">{w.contract_ref}</strong> • ENCG Fès
                </p>
              </div>

              <span className="px-3.5 py-1 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-black">
                Enseignant Vacataire
              </span>
            </div>

            {/* Volume Stats */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline text-sm font-black">
                <span className="text-slate-800 dark:text-white">
                  Heures Effectuées & Facturables : <strong className="text-amber-600 dark:text-amber-400 text-lg">{w.hours_done ?? 0}h</strong>
                </span>
                <span className="text-slate-500 font-mono text-xs">
                  Paiement horaire à la vacation : <strong>{w.hourly_rate ?? 0} MAD / heure</strong>
                </span>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-4 p-0.5 border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `100%` }}
                ></div>
              </div>

              <div className="flex justify-between text-xs font-bold text-slate-500 pt-1">
                <span>CM : <strong className="text-slate-800 dark:text-white">{w.hours_cm ?? 0}h</strong></span>
                <span>TD : <strong className="text-slate-800 dark:text-white">{w.hours_td ?? 0}h</strong></span>
                <span>Total Séances : <strong className="text-slate-800 dark:text-white">{w.total_sessions ?? 0} séances</strong></span>
                <span className="text-emerald-600 dark:text-emerald-400 font-black">Service validé</span>
              </div>
            </div>
          </div>

          {/* FINANCIAL KPI CARDS ("DKSHI DYAL L'KHLASS") */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black shrink-0">
                <Clock className="w-7 h-7" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Heures de Vacation</div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">{w.hours_done ?? 0} Heures</div>
                <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400">Total liquidable 2026</div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black shrink-0">
                <CreditCard className="w-7 h-7" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Montant Brut Prévisionnel</div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {w.estimated_payment ? w.estimated_payment.toLocaleString() : ((w.hours_done ?? 0) * (w.hourly_rate ?? 0)).toLocaleString()} MAD
                </div>
                <div className="text-[11px] font-bold text-slate-500">Taux : {w.hourly_rate ?? 0} MAD / h</div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Circuit du Virement</div>
                <div className="text-xs font-black text-slate-900 dark:text-white leading-snug">{w.virement_status}</div>
                <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400">Bordereau Trésorerie</div>
              </div>
            </div>
          </div>

          {/* Monthly Payment Breakdown Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wide">
                Bordereau Mensuel des Vacations pour Paiement
              </h2>
              <span className="text-xs font-bold text-slate-400">Contrôlé par le Service Comptabilité</span>
            </div>

            <div className="overflow-x-auto">
              {(!w.monthly_breakdown || w.monthly_breakdown.length === 0) ? (
                <div className="py-12 text-center text-xs font-bold text-slate-400">
                  Aucun décompte mensuel disponible.
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <th className="pb-3 pl-2">Mois</th>
                      <th className="pb-3 text-center">CM</th>
                      <th className="pb-3 text-center">TD</th>
                      <th className="pb-3 text-center">Total Heures</th>
                      <th className="pb-3 text-center">Taux Horaire</th>
                      <th className="pb-3 text-center">Montant Brut</th>
                      <th className="pb-3 text-right pr-2">État Règlement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-bold">
                    {w.monthly_breakdown.map((row: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-4 pl-2 font-black text-slate-900 dark:text-white">{row.month} 2026</td>
                        <td className="py-4 text-center text-slate-700 dark:text-slate-300">{row.cm ?? 0}h</td>
                        <td className="py-4 text-center text-slate-700 dark:text-slate-300">{row.td ?? 0}h</td>
                        <td className="py-4 text-center font-mono font-black text-slate-900 dark:text-white">{row.total ?? 0}h</td>
                        <td className="py-4 text-center text-slate-500">{w.hourly_rate ?? 0} MAD</td>
                        <td className="py-4 text-center text-emerald-600 dark:text-emerald-400 font-black">
                          {(row.amount || (row.total ?? 0) * (w.hourly_rate ?? 0)).toLocaleString()} MAD
                        </td>
                        <td className="py-4 text-right pr-2">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                            row.status?.includes('Payé') || row.status?.includes('Certifié')
                              ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" 
                              : "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                          )}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

    </div>
  );
}
