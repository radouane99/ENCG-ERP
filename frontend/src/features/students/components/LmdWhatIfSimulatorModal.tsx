import React, { useState, useEffect, useMemo } from 'react';
import {
  FlaskConical,
  Sparkles,
  X,
  RotateCcw,
  Target,
  AlertTriangle,
  CheckCircle2,
  Calculator,
  TrendingUp,
  Layers,
  Award,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import api from '@shared/lib/api';
import { toast } from 'sonner';

export interface SimModuleInput {
  id: string | number;
  name: string;
  code?: string;
  coefficient: number;
  originalGrade: number | null;
  simulatedGrade: number;
  semesterNumber: number;
}

interface LmdWhatIfSimulatorModalProps {
  open: boolean;
  onClose: () => void;
  grades: any[];
  selectedSemester: string;
  currentSemesterCode: string;
  judgeLoading: boolean;
  onRunAiJudge: () => Promise<void>;
}

export default function LmdWhatIfSimulatorModal({
  open,
  onClose,
  grades,
  selectedSemester,
  currentSemesterCode,
  judgeLoading,
  onRunAiJudge,
}: LmdWhatIfSimulatorModalProps) {
  const [activeTab, setActiveTab] = useState<'semester' | 'module'>('semester');
  const [targetGpa, setTargetGpa] = useState<number>(10.0);
  const [simModules, setSimModules] = useState<SimModuleInput[]>([]);
  const [serverRescuePlan, setServerRescuePlan] = useState<any[] | null>(null);
  const [serverSimLoading, setServerSimLoading] = useState(false);

  // Single module calculator state (CC1 25% + CC2 25% + Exam 50%)
  const [simCc1, setSimCc1] = useState<string>('13');
  const [simCc2, setSimCc2] = useState<string>('14');
  const [simExam, setSimExam] = useState<string>('12');

  const activeSemesterNumber = useMemo(() => {
    const raw = selectedSemester !== 'all' ? selectedSemester : currentSemesterCode;
    const parsed = parseInt(String(raw).replace(/\D/g, ''), 10);
    return Number.isFinite(parsed) && parsed >= 1 && parsed <= 10 ? parsed : 2;
  }, [selectedSemester, currentSemesterCode]);

  const eliminatoryThreshold = activeSemesterNumber >= 5 ? 7.0 : 6.0;

  // Initialize module list from student's real grades when modal opens or semester changes
  useEffect(() => {
    if (!open) return;

    const filtered = grades.filter((g: any) => {
      if (selectedSemester === 'all') return true;
      const sem = String(g.semester_number || g.semester || '').toUpperCase();
      return sem.includes(selectedSemester.toUpperCase());
    });

    const sourceList = filtered.length > 0 ? filtered : grades.slice(0, 8);

    const mapped: SimModuleInput[] = sourceList.map((g: any, idx: number) => {
      const rawGrade =
        g.moyenne_finale !== null && g.moyenne_finale !== undefined
          ? Number(g.moyenne_finale)
          : g.moyenne_normale !== null && g.moyenne_normale !== undefined
          ? Number(g.moyenne_normale)
          : null;

      const coeff = Number(g.coefficient || g.module?.coefficient || 1) || 1;
      const semNum =
        parseInt(String(g.semester_number || g.semester || activeSemesterNumber).replace(/\D/g, ''), 10) ||
        activeSemesterNumber;

      return {
        id: g.module_id || g.id || idx,
        name: g.module_name || g.module?.name || `Module ${idx + 1}`,
        code: g.module_code || g.module?.code || '',
        coefficient: coeff,
        originalGrade: rawGrade !== null && Number.isFinite(rawGrade) ? Number(rawGrade.toFixed(2)) : null,
        simulatedGrade: rawGrade !== null && Number.isFinite(rawGrade) ? Number(rawGrade.toFixed(2)) : 10.0,
        semesterNumber: semNum,
      };
    });

    setSimModules(mapped);
    setServerRescuePlan(null);
  }, [open, grades, selectedSemester, activeSemesterNumber]);

  // Live What-If Semester Compensation Calculation
  const semesterSimulation = useMemo(() => {
    if (simModules.length === 0) {
      return {
        average: 0,
        totalCoeff: 0,
        hasEliminatory: false,
        nonValidatedCount: 0,
        decision: 'EN_COURS',
        decisionLabel: 'Aucun module chargé',
        mention: 'Sans Mention',
        rescuePlan: [],
      };
    }

    let totalWeighted = 0;
    let totalCoeff = 0;
    let hasEliminatory = false;
    let nonValidatedCount = 0;

    simModules.forEach((m) => {
      const coeff = Math.max(0.5, m.coefficient);
      const grade = Math.min(20, Math.max(0, m.simulatedGrade));
      totalWeighted += grade * coeff;
      totalCoeff += coeff;
      if (grade < eliminatoryThreshold) hasEliminatory = true;
      if (grade < 10.0) nonValidatedCount++;
    });

    const average = totalCoeff > 0 ? Number((totalWeighted / totalCoeff).toFixed(2)) : 0;

    let decision = 'RATTRAPAGE';
    let decisionLabel = 'Ajourné — Session de Rattrapage (RAT)';
    if (nonValidatedCount === 0) {
      decision = 'VALIDE';
      decisionLabel = 'Semestre Validé (V)';
    } else if (average >= 10.0 && !hasEliminatory) {
      decision = 'COMPENSE';
      decisionLabel = 'Validé par Compensation (VPC)';
    }

    let mention = 'Sans Mention';
    if (average >= 16) mention = 'Très Bien';
    else if (average >= 14) mention = 'Bien';
    else if (average >= 12) mention = 'Assez Bien';
    else if (average >= 10) mention = 'Passable';

    const targetSum = targetGpa * totalCoeff;
    const rescuePlan = simModules
      .filter((m) => m.simulatedGrade < 10.0)
      .map((m) => {
        const otherSum = totalWeighted - m.simulatedGrade * m.coefficient;
        const neededAlone = (targetSum - otherSum) / m.coefficient;
        const minRequiredAlone = Number(Math.max(eliminatoryThreshold, neededAlone).toFixed(2));
        return {
          id: m.id,
          name: m.name,
          coefficient: m.coefficient,
          current_grade: m.simulatedGrade,
          is_eliminatory: m.simulatedGrade < eliminatoryThreshold,
          min_to_lift_eliminatory: eliminatoryThreshold,
          target_alone_for_semester_goal: minRequiredAlone <= 20 ? minRequiredAlone : null,
          can_compensate_alone: minRequiredAlone <= 20,
          points_gained_at_10: Number(((10.0 - m.simulatedGrade) * m.coefficient).toFixed(2)),
        };
      });

    return {
      average,
      totalCoeff,
      hasEliminatory,
      nonValidatedCount,
      decision,
      decisionLabel,
      mention,
      rescuePlan,
    };
  }, [simModules, eliminatoryThreshold, targetGpa]);

  const singleModuleSimulatedAverage = useMemo(() => {
    const cc1 = parseFloat(simCc1) || 0;
    const cc2 = parseFloat(simCc2) || 0;
    const exam = parseFloat(simExam) || 0;
    return Number((cc1 * 0.25 + cc2 * 0.25 + exam * 0.5).toFixed(2));
  }, [simCc1, simCc2, simExam]);

  const handleUpdateModuleGrade = (id: string | number, newGrade: number) => {
    const clamped = Math.min(20, Math.max(0, Number.isFinite(newGrade) ? newGrade : 0));
    setSimModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, simulatedGrade: clamped } : m))
    );
  };

  const handleResetToOriginal = () => {
    setSimModules((prev) =>
      prev.map((m) => ({
        ...m,
        simulatedGrade: m.originalGrade !== null ? m.originalGrade : 10.0,
      }))
    );
    setServerRescuePlan(null);
  };

  const handleVerifyWithOfficialEngine = async () => {
    if (simModules.length === 0) return;
    setServerSimLoading(true);
    try {
      const res = await api.post('/student-portal/ai/simulate-semester', {
        semester_number: activeSemesterNumber,
        target_gpa: targetGpa,
        modules: simModules.map((m) => ({
          name: m.name,
          coefficient: m.coefficient,
          grade: m.simulatedGrade,
        })),
      });
      const plan = res.data?.data?.rescue_plan;
      if (Array.isArray(plan)) {
        setServerRescuePlan(plan);
      }
      toast.success('Simulation certifiée par le moteur LMD officiel !');
    } catch {
      toast.error('Impossible de contacter le moteur LMD serveur.');
    } finally {
      setServerSimLoading(false);
    }
  };

  if (!open) return null;

  const displayedRescuePlan = serverRescuePlan ?? semesterSimulation.rescuePlan;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-card rounded-2xl p-6 sm:p-7 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-lg border border-border space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5 text-primary">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground dark:text-white">
                Simulateur Interactif LMD & Compensation (&laquo; What-If &raquo;)
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Normes ENCG Fès — Seuil éliminatoire : {eliminatoryThreshold.toFixed(2)}/20 | Validation : 10.00/20
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('semester')}
            className={cn(
              'flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer',
              activeTab === 'semester'
                ? 'bg-card text-[#1a3673] dark:text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Layers className="w-4 h-4" />
            Compensation Semestrielle & Plan Rattrapage ({simModules.length} modules)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('module')}
            className={cn(
              'flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer',
              activeTab === 'module'
                ? 'bg-card text-[#1a3673] dark:text-white shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Calculator className="w-4 h-4" />
            Calculateur Rapide de Module (CC1 + CC2 + Examen)
          </button>
        </div>

        {activeTab === 'semester' ? (
          <div className="space-y-5">
            {/* Live KPI Banner */}
            <div
              className={cn(
                'p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4',
                semesterSimulation.decision === 'VALIDE' &&
                  'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900',
                semesterSimulation.decision === 'COMPENSE' &&
                  'bg-indigo-50/70 border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-900',
                semesterSimulation.decision === 'RATTRAPAGE' &&
                  'bg-rose-50/70 border-rose-200 dark:bg-rose-950/30 dark:border-rose-900'
              )}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                      semesterSimulation.decision === 'VALIDE' && 'bg-emerald-600 text-white',
                      semesterSimulation.decision === 'COMPENSE' && 'bg-indigo-600 text-white',
                      semesterSimulation.decision === 'RATTRAPAGE' && 'bg-rose-600 text-white'
                    )}
                  >
                    {semesterSimulation.decisionLabel}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" /> {semesterSimulation.mention}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {semesterSimulation.hasEliminatory ? (
                    <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Attention : Au moins un module est sous le seuil éliminatoire ({eliminatoryThreshold}/20), bloquant la compensation.
                    </span>
                  ) : semesterSimulation.decision === 'COMPENSE' ? (
                    <span className="text-indigo-700 dark:text-indigo-300 font-medium">
                      Aucune note éliminatoire et moyenne &ge; 10.00/20 : vos modules entre {eliminatoryThreshold} et 9.99 sont compensés !
                    </span>
                  ) : semesterSimulation.decision === 'VALIDE' ? (
                    <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                      Tous vos modules sont validés directement (&ge; 10.00/20).
                    </span>
                  ) : (
                    <span>
                      Ajustez les curseurs ci-dessous pour simuler les notes à obtenir au rattrapage afin d&apos;atteindre 10.00/20.
                    </span>
                  )}
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] font-bold uppercase text-muted-foreground block">
                  Moyenne Pondérée Simulée
                </span>
                <span
                  className={cn(
                    'text-2xl font-black font-mono',
                    semesterSimulation.average >= 10
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  )}
                >
                  {semesterSimulation.average.toFixed(2)} <small className="text-xs font-bold">/ 20</small>
                </span>
              </div>
            </div>

            {/* Target GPA Selector & Reset Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-xs font-bold text-foreground">Objectif visé :</span>
                {[
                  { label: '10.00 (Validation)', value: 10.0 },
                  { label: '12.00 (Assez Bien)', value: 12.0 },
                  { label: '14.00 (Bien / Choix Filière)', value: 14.0 },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTargetGpa(opt.value)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border',
                      targetGpa === opt.value
                        ? 'bg-[#1a3673] text-white border-[#1a3673]'
                        : 'bg-card text-muted-foreground border-border hover:text-foreground'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleResetToOriginal}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground border border-border flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser à mes notes réelles
              </button>
            </div>

            {/* Interactive Module Sliders */}
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {simModules.map((mod) => {
                const isElim = mod.simulatedGrade < eliminatoryThreshold;
                const isVal = mod.simulatedGrade >= 10.0;
                const diff =
                  mod.originalGrade !== null
                    ? Number((mod.simulatedGrade - mod.originalGrade).toFixed(2))
                    : 0;

                return (
                  <div
                    key={mod.id}
                    className="p-3 rounded-xl border border-border bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-foreground truncate">{mod.name}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-[10px] font-mono font-bold text-muted-foreground shrink-0">
                          Coeff. {mod.coefficient}
                        </span>
                        {diff !== 0 && (
                          <span
                            className={cn(
                              'text-[10px] font-mono font-bold px-1.5 py-0.5 rounded',
                              diff > 0
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            )}
                          >
                            {diff > 0 ? `+${diff}` : diff} pts
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        Note actuelle :{' '}
                        <strong>
                          {mod.originalGrade !== null ? `${mod.originalGrade.toFixed(2)}/20` : 'Non saisie'}
                        </strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <input
                        type="range"
                        min="0"
                        max="20"
                        step="0.25"
                        value={mod.simulatedGrade}
                        onChange={(e) => handleUpdateModuleGrade(mod.id, parseFloat(e.target.value))}
                        className="w-28 sm:w-36 accent-[#1a3673] cursor-pointer"
                      />
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.25"
                        value={mod.simulatedGrade}
                        onChange={(e) => handleUpdateModuleGrade(mod.id, parseFloat(e.target.value))}
                        className="w-16 px-2 py-1 text-center font-mono text-xs font-bold rounded-lg border border-border bg-card"
                      />
                      <span
                        className={cn(
                          'w-14 text-center py-0.5 rounded-full text-[10px] font-bold uppercase',
                          isVal
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : isElim
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        )}
                      >
                        {isVal ? 'Validé' : isElim ? 'Élim.' : 'Comp.'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rescue & Compensation Plan per Module */}
            {displayedRescuePlan.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4" /> Plan de Sauvetage & Compensation (Objectif {targetGpa.toFixed(2)}/20)
                  </h4>
                  <button
                    type="button"
                    onClick={handleVerifyWithOfficialEngine}
                    disabled={serverSimLoading}
                    className="text-[11px] font-bold text-[#1a3673] dark:text-amber-200 underline cursor-pointer disabled:opacity-50"
                  >
                    {serverSimLoading ? 'Calcul officiel...' : 'Certifier avec le moteur serveur'}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {displayedRescuePlan.map((item: any, i: number) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-card border border-amber-200/80 dark:border-amber-900/60 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between font-bold text-foreground">
                        <span className="truncate">{item.name}</span>
                        <span className="text-rose-600 font-mono">{Number(item.current_grade ?? 0).toFixed(2)}/20</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {item.is_eliminatory && (
                          <span className="text-rose-600 font-semibold block">
                            • Minimum {item.min_to_lift_eliminatory}/20 requis pour lever la note éliminatoire.
                          </span>
                        )}
                        {item.can_compensate_alone && item.target_alone_for_semester_goal !== null ? (
                          <span>
                            • Viser <strong>{Number(item.target_alone_for_semester_goal).toFixed(2)}/20</strong> sur ce seul module suffit pour atteindre {targetGpa.toFixed(2)}/20 au semestre.
                          </span>
                        ) : (
                          <span>
                            • Relever ce module à <strong>10.00/20</strong> rapporte <strong>+{item.points_gained_at_10} pts</strong> pondérés.
                          </span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Single Module Quick Interactive Calculator */
          <div className="p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-primary/20 dark:border-primary space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-primary dark:text-indigo-300 tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Simulation Instantanée de Module
              </span>
              <span className="text-[10px] font-bold text-primary dark:text-indigo-300 bg-primary/10 dark:bg-indigo-900/60 px-2 py-0.5 rounded-full font-mono">
                Formule LMD : 25% + 25% + 50%
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-foreground block mb-1">
                  CC 1 (25%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.25"
                  value={simCc1}
                  onChange={(e) => setSimCc1(e.target.value)}
                  className="w-full px-3 py-2 border border-border bg-card text-sm font-bold rounded-[var(--control-radius)]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-foreground block mb-1">
                  CC 2 (25%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.25"
                  value={simCc2}
                  onChange={(e) => setSimCc2(e.target.value)}
                  className="w-full px-3 py-2 border border-border bg-card text-sm font-bold rounded-[var(--control-radius)]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-foreground block mb-1">
                  Examen (50%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.25"
                  value={simExam}
                  onChange={(e) => setSimExam(e.target.value)}
                  className="w-full px-3 py-2 border border-border bg-card text-sm font-bold rounded-[var(--control-radius)]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-indigo-200/60 dark:border-primary">
              <span className="text-xs font-bold text-muted-foreground">Moyenne simulée du module :</span>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'text-xl font-bold font-mono',
                    singleModuleSimulatedAverage >= 10
                      ? 'text-emerald-600'
                      : singleModuleSimulatedAverage >= eliminatoryThreshold
                      ? 'text-amber-600'
                      : 'text-rose-600'
                  )}
                >
                  {singleModuleSimulatedAverage.toFixed(2)} / 20
                </span>
                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase',
                    singleModuleSimulatedAverage >= 10
                      ? 'bg-emerald-100 text-emerald-800'
                      : singleModuleSimulatedAverage >= eliminatoryThreshold
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  )}
                >
                  {singleModuleSimulatedAverage >= 10
                    ? 'V (Validé)'
                    : singleModuleSimulatedAverage >= eliminatoryThreshold
                    ? 'RAT (Compensable)'
                    : 'NV (Éliminatoire)'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* AI Copilot Ask */}
        <div className="space-y-2.5 pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Délibération Assistée par Jury IA LMD
            </h4>
          </div>
          <button
            type="button"
            onClick={async () => {
              await onRunAiJudge();
              onClose();
            }}
            disabled={judgeLoading}
            className="w-full py-3 rounded-2xl bg-[#1a3673] hover:bg-[#082663] text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            {judgeLoading
              ? 'Analyse en cours par le Jury IA...'
              : "Lancer l'Analyse Officielle du Jury IA sur mon Dossier"}
          </button>
        </div>
      </div>
    </div>
  );
}

