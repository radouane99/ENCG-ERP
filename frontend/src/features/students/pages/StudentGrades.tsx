import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, FlaskConical, Download, AlertCircle } from 'lucide-react';
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
export default function StudentGrades() {
  const { t, i18n } = useTranslation(['students', 'common']);
  const isRtl = i18n.language === 'ar';
  const { data, isLoading, isError } = useQuery({
    queryKey: ['student-grades'],
    queryFn: () => api.get('/student-portal/grades').then(res => res.data)
  });
  const [isRevealed, setIsRevealed] = useState(false);
  const [judge, setJudge] = useState<{ verdict?: string; explanation_fr?: string; explanation_ar?: string } | null>(null);
  const [judgeLoading, setJudgeLoading] = useState(false);

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center"><Spinner size="lg" /></div>;
  }

  if (isError || !data) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h3 className="text-lg font-bold">Impossible de charger les notes</h3>
        <p className="text-sm text-slate-500">Une erreur est survenue lors de la récupération de vos notes.</p>
      </div>
    );
  }

  // Assuming data structure based on the typical response
  const grades = data.data || data;
  const overallAvg = data.overall_average || 0; // or calculate if needed

  return (
    <div data-testid="student-grades-page" className="space-y-6 font-sans animate-in fade-in zoom-in duration-500">
      <PageHeader title="Performance Académique" titleLang={isRtl ? 'ar' : 'fr'} subtitle="CC / Exam / RAT — V ≥ 10 · RAT · NV · < 6/20 éliminatoire" />
      
      {/* Header Banner */}
      <div className="bg-primary rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-lg border border-blue-800/40">
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        </div>
        
        <div className="relative z-10">
          <p className="text-3xl font-black text-white mb-2" lang={isRtl ? 'ar' : 'fr'}>Relevé de notes & décisions LMD</p>
          <p className="text-blue-100">CC / Exam / RAT — V ≥ 10 · RAT · NV · &lt; 6/20 éliminatoire</p>
          <div className="flex flex-wrap gap-3 mt-6">
            <button
              data-testid="lmd-simulator"
              onClick={async () => {
                setJudgeLoading(true);
                try {
                  const res = await api.post('/v1/student-portal/ai/lmd-judge', { question: 'Est-ce que je valide ?' });
                  setJudge(res.data);
                } catch {
                  setJudge({ verdict: '—', explanation_fr: 'Impossible de calculer le verdict LMD pour le moment.' });
                } finally {
                  setJudgeLoading(false);
                }
              }}
              className="bg-white text-primary px-4 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center gap-2 hover:bg-blue-50 transition-colors min-h-11"
            >
              <FlaskConical className="w-4 h-4" /> {judgeLoading ? 'Calcul…' : 'SIMULATEUR'}
            </button>
            <button 
              onClick={() => {
                import('@shared/lib/api').then(({ default: api }) => {
                  import('sonner').then(({ toast }) => {
                    const tid = toast.loading('Génération du relevé en cours...')
                    api.get('/student-portal/transcript/pdf', { responseType: 'blob' })
                      .then(res => {
                        const url = window.URL.createObjectURL(new Blob([res.data]))
                        const link = document.createElement('a')
                        link.href = url
                        link.setAttribute('download', 'Releve_Notes.pdf')
                        document.body.appendChild(link)
                        link.click()
                        link.remove()
                        toast.success('Relevé téléchargé avec succès !', { id: tid })
                      })
                      .catch(() => toast.error('Erreur lors du téléchargement.', { id: tid }))
                  })
                })
              }}
              className="bg-blue-900 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center gap-2 hover:bg-blue-950 border border-blue-800 transition-colors min-h-11"
            >
              <Download className="w-4 h-4" /> RELEVÉ (PDF)
            </button>
            <button 
              onClick={() => {
                import('@shared/lib/api').then(({ default: api }) => {
                  import('sonner').then(({ toast }) => {
                    const tid = toast.loading("Génération de l'attestation de réussite...")
                    api.get('/student-portal/attestation-reussite/pdf', { responseType: 'blob' })
                      .then(res => {
                        const url = window.URL.createObjectURL(new Blob([res.data]))
                        const link = document.createElement('a')
                        link.href = url
                        link.setAttribute('download', 'Attestation_Reussite_ENCG.pdf')
                        document.body.appendChild(link)
                        link.click()
                        link.remove()
                        toast.success('Attestation de réussite téléchargée !', { id: tid })
                      })
                      .catch(() => toast.error("Impossible de générer l'attestation. Vérifiez la validation de votre année.", { id: tid }))
                  })
                })
              }}
              className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md flex items-center gap-2 hover:bg-emerald-700 border border-emerald-500 transition-colors"
            >
              <Download className="w-4 h-4" /> ATTESTATION DE RÉUSSITE (PDF)
            </button>
            <button 
              onClick={() => {
                import('@shared/lib/api').then(({ default: api }) => {
                  import('sonner').then(({ toast }) => {
                    const tid = toast.loading('Édition du Diplôme d\'État ENCG...')
                    api.get('/student-portal/diplome-officiel/pdf', { responseType: 'blob' })
                      .then(res => {
                        const url = window.URL.createObjectURL(new Blob([res.data]))
                        const link = document.createElement('a')
                        link.href = url
                        link.setAttribute('download', 'Diplome_Etat_ENCG_Fes.pdf')
                        document.body.appendChild(link)
                        link.click()
                        link.remove()
                        toast.success('Diplôme officiel téléchargé !', { id: tid })
                      })
                      .catch(() => toast.error('Diplôme accessible uniquement aux lauréats ayant validé le cursus.', { id: tid }))
                  })
                })
              }}
              className="bg-amber-400 text-slate-950 px-4 py-2.5 rounded-xl font-black text-xs shadow-md flex items-center gap-2 hover:bg-amber-300 border border-amber-300 transition-colors"
            >
              <Download className="w-4 h-4 text-slate-950" /> DIPLÔME ENCG (BAC+5)
            </button>
          </div>
        </div>

        <div className="relative z-10 text-right">
          <div className="text-xs font-bold text-blue-200 uppercase tracking-widest mb-1">MOYENNE ANNUELLE</div>
          <div className="flex items-baseline justify-end gap-1">
            <span className="text-6xl font-black text-white">
              {isRevealed ? Number(overallAvg).toFixed(2) : "?.??"}
            </span>
            <span className="text-2xl font-bold text-blue-200">/ 20</span>
          </div>
          {isRevealed && overallAvg >= 10 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 inline-flex items-center gap-1.5 bg-blue-900/40 border border-blue-500/50 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm"
            >
              ANNÉE VALIDÉE <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </motion.div>
          )}
        </div>
      </div>

      {judge && (
        <div data-testid="lmd-judge-result" className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-border shadow-sm">
          <p className="text-xs font-black uppercase tracking-wider text-primary">Verdict LMD (moteur, pas le chatbot)</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{judge.verdict}</p>
          <p className="text-sm text-slate-600 mt-2">{isRtl ? judge.explanation_ar : judge.explanation_fr}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-border">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
          <h2 className="text-2xl font-black text-primary dark:text-white">Mes Notes</h2>
        </div>

        <div className="overflow-x-auto relative min-h-[300px]">
          
          <AnimatePresence>
            {!isRevealed && grades.length > 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/40 backdrop-blur-md rounded-2xl"
              >
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsRevealed(true)}
                  className="bg-[#001A4B] text-white px-8 py-4 rounded-2xl font-black text-xl shadow-2xl flex items-center gap-3 hover:bg-blue-900 transition-colors"
                >
                  <AlertCircle className="w-6 h-6 text-blue-300" />
                  RÉVÉLER MES RÉSULTATS
                </motion.button>
                <p className="text-sm font-bold text-[#001A4B]/60 mt-4">Prêt à découvrir vos notes de la délibération ?</p>
              </motion.div>
            )}
          </AnimatePresence>

          <table className={cn("w-full text-left transition-all duration-1000", !isRevealed && grades.length > 0 ? "filter blur-lg opacity-30 select-none" : "")}>
            <thead>
              <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-slate-100">
                <th className="pb-4 pl-4 w-1/3">MODULE</th>
                <th className="pb-4 text-center">NOTE FINALE</th>
                <th className="pb-4 text-right pr-4">STATUT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {grades.map((grade: any, idx: number) => {
                const total = grade.moyenne_finale || grade.moyenne_normale || 0;
                const decision = normalizeDecision(grade.decision_finale || grade.decision_normale, total);
                const code = decisionLabel(String(decision));
                
                return (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                    <td className="py-5 pl-4">
                      <div className="font-bold text-[#001A4B]">{grade.module_name || grade.module?.name}</div>
                      <div className="text-[10px] text-gray-400 uppercase tracking-wider">{grade.module_code || grade.module?.code}</div>
                    </td>
                    <td className="py-5 text-center font-black text-[#001A4B] text-lg">{Number(total).toFixed(2)}</td>
                    <td className="py-5 text-right pr-4">
                      <div className="flex justify-end mt-1">
                        <LmdBadge decision={code} score={total} />
                      </div>
                    </td>
                  </tr>
                )
              })}
              {(!grades || grades.length === 0) && (
                <tr>
                  <td colSpan={3} className="py-4">
                    <EmptyState
                      icon={AlertCircle}
                      title="Aucune note disponible"
                      description="Les notes apparaissent après la délibération. En attendant, vous pouvez demander un document au guichet."
                      actionLabel="Ouvrir le guichet"
                      onAction={() => { window.location.href = '/student/documents' }}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="px-4 py-3">
            <LmdLegend />
          </div>
        </div>
      </div>

    </div>
  );
}

