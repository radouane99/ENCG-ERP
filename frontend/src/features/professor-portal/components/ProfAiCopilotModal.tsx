import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, BookOpen, AlertTriangle, TrendingUp, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { Spinner } from '@shared/components/ui/Spinner';

interface ProfAiCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: number;
}

export function ProfAiCopilotModal({ isOpen, onClose, moduleId }: ProfAiCopilotModalProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['prof-ai-analytics', moduleId],
    queryFn: async () => {
      const res = await api.get(`/professor/ai/class-analytics/${moduleId}`);
      return res.data;
    },
    enabled: isOpen && !!moduleId
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl border border-white/20 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-900 p-6 flex justify-between items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
            <div className="relative z-10 flex items-center gap-3 text-white">
              <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                <Sparkles className="w-6 h-6 text-purple-200" />
              </div>
              <div>
                <h2 className="text-xl font-black">Copilote IA : Analyse de Classe</h2>
                <p className="text-sm text-indigo-200 font-medium">{data?.module || 'Chargement...'}</p>
              </div>
            </div>
            <button onClick={onClose} className="relative z-10 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Spinner className="w-10 h-10 text-purple-600" />
                <p className="text-sm font-bold text-slate-500 animate-pulse">L'IA de l'ENCG analyse vos résultats...</p>
              </div>
            ) : isError ? (
              <div className="text-center py-10 text-rose-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-bold">Impossible de charger l'analyse IA.</p>
              </div>
            ) : data && (
              <div className="space-y-6">
                
                {/* KPIs */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                    <div className="bg-emerald-50 p-3 rounded-xl mb-3"><TrendingUp className="w-6 h-6 text-emerald-600" /></div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Moyenne Globale</div>
                    <div className="text-2xl font-black text-slate-800">{data.average_score}</div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                    <div className="bg-blue-50 p-3 rounded-xl mb-3"><BookOpen className="w-6 h-6 text-blue-600" /></div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Taux de Réussite</div>
                    <div className="text-2xl font-black text-slate-800">{data.pass_rate}</div>
                  </div>
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
                    <div className="bg-purple-50 p-3 rounded-xl mb-3"><Users className="w-6 h-6 text-purple-600" /></div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Étudiants Évalués</div>
                    <div className="text-2xl font-black text-slate-800">{data.total_students_graded}</div>
                  </div>
                </div>

                {/* Struggling Topics */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-4 h-4 text-amber-500" /> 
                    Concepts Mal Compris (Identifiés par l'IA)
                  </h3>
                  <ul className="space-y-3">
                    {data.struggling_topics?.map((topic: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3 bg-amber-50/50 p-3 rounded-xl text-sm font-medium text-amber-900 border border-amber-100/50">
                        <span className="bg-amber-200 text-amber-800 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold">{idx + 1}</span>
                        {topic}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommendations */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100">
                  <h3 className="text-sm font-black text-indigo-900 uppercase tracking-wider flex items-center gap-2 mb-4">
                    <Sparkles className="w-4 h-4 text-purple-500" /> 
                    Recommandations Pédagogiques
                  </h3>
                  <div className="space-y-3">
                    {data.ai_recommendations?.map((rec: string, idx: number) => (
                      <div key={idx} className="flex gap-3 items-start">
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></div>
                        <p className="text-sm text-indigo-950/80 font-medium leading-relaxed">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
