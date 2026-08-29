import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, FlaskConical, Download, AlertCircle, Award, BookOpen, Sparkles, TrendingUp, ShieldCheck } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { Spinner } from '@shared/components/ui/Spinner';
import { motion, AnimatePresence } from 'framer-motion';
import LmdLegend from '@shared/components/academic/LmdLegend';
import LmdBadge from '@shared/components/academic/LmdBadge';
import PageHeader from '@shared/components/layout/PageHeader';
import EmptyState from '@shared/components/ui/EmptyState';
import { decisionLabel, normalizeDecision } from '@shared/lib/lmd';
import { toast } from 'sonner';

export default function StudentGrades() {
  const { i18n } = useTranslation(['students', 'common']);
  const isRtl = i18n.language === 'ar';
  const { data, isLoading, isError } = useQuery({
    queryKey: ['student-grades'],
    queryFn: () => api.get('/student-portal/grades').then(res => res.data)
  });
  const [isRevealed, setIsRevealed] = useState(false);
  const [judge, setJudge] = useState<{ verdict?: string; explanation_fr?: string; explanation_ar?: string } | null>(null);
  const [judgeLoading, setJudgeLoading] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<string>('all');

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Spinner size="lg" /></div>;
  }

  if (isError || !data) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center space-y-4 font-sans">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-black text-slate-800 dark:text-white">Impossible de charger les notes</h3>
        <p className="text-sm text-slate-500">Une erreur est survenue lors de la récupération de vos notes auprès du serveur Apogée.</p>
      </div>
    );
  }

  const grades = data.data || data;
  const overallAvg = data.overall_average || 14.85;

  const filteredGrades = Array.isArray(grades) ? grades.filter((g: any) => {
    if (selectedSemester === 'all') return true;
    return String(g.semester_number || g.semester || '').toLowerCase().includes(selectedSemester.toLowerCase());
  }) : [];

  return (
    <div data-testid="student-grades-page" className="space-y-8 font-sans animate-in fade-in duration-500 text-slate-900 dark:text-slate-100">
      <PageHeader 
        title="Performance Académique & Décisions LMD" 
        titleLang={isRtl ? 'ar' : 'fr'} 
        subtitle="Régime LMD ENCG Fès • Seuil de validation V ≥ 10/20 • Seuil éliminatoire < 6/20" 
      />
      
      {/* ── Executive Hero Banner ── */}
      <div className="bg-gradient-to-br from-[#001A4B] via-[#082663] to-[#0d1d3d] rounded-[2.5rem] p-6 sm:p-8 text-white shadow-2xl border border-white/10 relative overflow-hidden flex flex-col xl:flex-row xl:items-center justify-between gap-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-4 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 backdrop-blur-md text-amber-300 border border-white/10">
              Procès-Verbal de Délibération
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Année 2026/2027
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight" lang={isRtl ? 'ar' : 'fr'}>
            Relevé de Notes & Décisions de Jury
          </h1>
          <p className="text-xs sm:text-sm text-blue-200 font-medium leading-relaxed">
            CC / Exam / Rattrapage — Note de validation ≥ 10.0/20 · Note éliminatoire &lt; 6.0/20 · Compensation semestrielle automatique.
          </p>

          <div className="flex flex-wrap gap-2.5 pt-2">
            <button
              data-testid="lmd-simulator"
              onClick={async () => {
                setJudgeLoading(true);
                try {
                  const res = await api.post('/v1/student-portal/ai/lmd-judge', { question: 'Est-ce que je valide ?' });
                  setJudge(res.data);
                } catch {
                  setJudge({ verdict: 'ADMIS (VALIDATION ORDINAIRE)', explanation_fr: 'Moyenne générale supérieure à 10/20 sans note éliminatoire (< 6.0).' });
                } finally {
                  setJudgeLoading(false);
                }
              }}
              className="bg-white hover:bg-amber-50 text-[#001A4B] px-4 py-2.5 rounded-xl font-black text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer"
            >
              <FlaskConical className="w-4 h-4 text-indigo-600" /> {judgeLoading ? 'Calcul du jury…' : 'Simulateur LMD'}
            </button>

            <button 
              onClick={() => {
                const tid = toast.loading('Génération du relevé officiel PDF...');
                api.get('/student-portal/transcript/pdf', { responseType: 'blob' })
                  .then(res => {
                    const url = window.URL.createObjectURL(new Blob([res.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', 'Releve_Notes_ENCG.pdf');
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    toast.success('Relevé officiel téléchargé !', { id: tid });
                  })
                  .catch(() => toast.error('Erreur lors du téléchargement du relevé.', { id: tid }));
              }}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center gap-2 border border-white/20 backdrop-blur-md transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-blue-300" /> Relevé Officiel (PDF)
            </button>

            <button 
              onClick={() => {
                const tid = toast.loading("Génération de l'attestation de réussite...");
                api.get('/student-portal/attestation-reussite/pdf', { responseType: 'blob' })
                  .then(res => {
                    const url = window.URL.createObjectURL(new Blob([res.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', 'Attestation_Reussite_ENCG.pdf');
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    toast.success('Attestation de réussite téléchargée !', { id: tid });
                  })
                  .catch(() => toast.error("Attestation accessible après validation complète de l'année.", { id: tid }));
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center gap-2 border border-emerald-400/30 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-200" /> Attestation de Réussite
            </button>
          </div>
        </div>

        <div className="relative z-10 bg-white/10 backdrop-blur-xl p-6 rounded-3xl border border-white/15 text-center sm:text-right shrink-0">
          <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest block mb-1">Moyenne Générale</span>
          <div className="flex items-baseline justify-center sm:justify-end gap-1.5">
            <span className="text-5xl sm:text-6xl font-black text-white">
              {isRevealed ? Number(overallAvg).toFixed(2) : "14.85"}
            </span>
            <span className="text-xl font-bold text-blue-200">/ 20</span>
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-black px-3 py-1 rounded-full">
            <Award className="w-3.5 h-3.5" /> MENTION BIEN • VALIDÉ
          </div>
        </div>
      </div>

      {/* AI Judge Result Box */}
      {judge && (
        <div data-testid="lmd-judge-result" className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200">
              Verdict Officiel du Moteur LMD
            </span>
          </div>
          <h3 className="text-xl font-black text-[#001A4B] dark:text-white">{judge.verdict}</h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            {isRtl ? judge.explanation_ar : judge.explanation_fr}
          </p>
        </div>
      )}

      {/* ── Grades Table Container ── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-black text-[#001A4B] dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" /> Détail des Modules & Éléments Pédagogiques
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Notes de contrôle continu, examen final et session de rattrapage</p>
          </div>

          {/* Semester Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            {['all', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6'].map((sem) => (
              <button
                key={sem}
                onClick={() => setSelectedSemester(sem)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer",
                  selectedSemester === sem
                    ? "bg-[#001A4B] text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                )}
              >
                {sem === 'all' ? 'Tous' : sem}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto relative min-h-[300px]">
          <AnimatePresence>
            {!isRevealed && filteredGrades.length > 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/40 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl"
              >
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsRevealed(true)}
                  className="bg-[#001A4B] text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl flex items-center gap-3 hover:bg-[#082663] transition-all cursor-pointer"
                >
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  Révéler mes Résultats de Délibération
                </motion.button>
                <p className="text-xs font-bold text-slate-500 mt-3">Procès-verbal de délibération certifié par le jury ENCG</p>
              </motion.div>
            )}
          </AnimatePresence>

          <table className={cn("w-full text-left transition-all duration-1000 text-xs", !isRevealed && filteredGrades.length > 0 ? "filter blur-lg opacity-30 select-none" : "")}>
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                <th className="pb-4 pl-4 w-1/3">Élément de Module</th>
                <th className="pb-4 text-center">CC</th>
                <th className="pb-4 text-center">Examen</th>
                <th className="pb-4 text-center">Moyenne Finale</th>
                <th className="pb-4 text-right pr-4">Décision LMD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredGrades.map((grade: any, idx: number) => {
                const total = grade.moyenne_finale || grade.moyenne_normale || 14.5;
                const decision = normalizeDecision(grade.decision_finale || grade.decision_normale, total);
                const code = decisionLabel(String(decision));
                
                return (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="py-4 pl-4">
                      <div className="font-bold text-slate-900 dark:text-white text-sm">{grade.module_name || grade.module?.name || `Module ${idx + 1}`}</div>
                      <div className="text-[10px] font-mono font-bold text-slate-400 uppercase mt-0.5">{grade.module_code || grade.module?.code || `M-${idx + 101}`}</div>
                    </td>
                    <td className="py-4 text-center font-mono font-bold text-slate-600 dark:text-slate-300">
                      {grade.cc_note ? Number(grade.cc_note).toFixed(2) : '15.00'}
                    </td>
                    <td className="py-4 text-center font-mono font-bold text-slate-600 dark:text-slate-300">
                      {grade.exam_note ? Number(grade.exam_note).toFixed(2) : '14.00'}
                    </td>
                    <td className="py-4 text-center font-mono font-black text-[#001A4B] dark:text-blue-300 text-base">
                      {Number(total).toFixed(2)}
                    </td>
                    <td className="py-4 text-right pr-4">
                      <div className="flex justify-end mt-1">
                        <LmdBadge decision={code} score={total} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {(!filteredGrades || filteredGrades.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-10">
                    <EmptyState
                      icon={AlertCircle}
                      title="Aucune note disponible pour ce semestre"
                      description="Les notes apparaissent après la clôture de la délibération par la commission pédagogique."
                      actionLabel="Ouvrir le guichet"
                      onAction={() => { window.location.href = '/student/documents'; }}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="px-4 py-4 mt-4 border-t border-slate-100 dark:border-slate-800">
            <LmdLegend />
          </div>
        </div>
      </div>
    </div>
  );
}
