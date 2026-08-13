import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UploadCloud, Zap, FileText, CheckCircle2, ChevronRight, Save, Play } from 'lucide-react';
import { cn } from '@shared/lib/utils';

import { useMutation } from '@tanstack/react-query';
import api from '@/shared/lib/api';

interface QCMQuestion {
  q: string;
  a: string[];
  correct: number;
}

export default function ProfessorQCMGenerator() {
  const { t, i18n } = useTranslation(['professors', 'common']);
  const isRtl = i18n.language === 'ar';
  const [step, setStep] = useState<'upload' | 'generating' | 'review'>('upload');
  const [progress, setProgress] = useState(0);
  const [questions, setQuestions] = useState<QCMQuestion[]>([]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/professor/ai/generate-qcm', {
        topic: "Bases de données relationnelles et SQL",
        difficulty: "intermediate",
        count: 5
      });
      return res.data;
    },
    onSuccess: (data) => {
      if (data.questions) {
        // Transform backend response to match UI
        const formatted: QCMQuestion[] = data.questions.map((q: any) => ({
          q: q.question,
          a: q.options,
          correct: q.options.indexOf(q.correct_answer)
        }));
        setQuestions(formatted);
      }
      setStep('review');
    },
    onError: () => {
      setStep('review'); // Fallback or show error
    }
  });

  useEffect(() => {
    if (step === 'generating') {
      const interval = setInterval(() => {
        setProgress(p => {
          if (p >= 90) {
            clearInterval(interval);
            return 90;
          }
          return p + 5;
        });
      }, 300);
      return () => clearInterval(interval);
    }
  }, [step]);



  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8 font-sans animate-in fade-in duration-500 pb-24">
      
      {/* Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-8 md:p-10 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden border border-indigo-900/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="relative z-10 space-y-2">
          <span className="bg-purple-500/20 text-purple-200 border border-purple-400/30 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest inline-flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Copilote IA — Évaluations Interactives
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Générateur QCM & Examens par IA</h1>
          <p className="text-sm text-slate-300 font-medium max-w-2xl">
            Transformez vos supports de cours (PDF, DOCX, PPTX) en évaluations sous forme de QCM en quelques secondes.
          </p>
        </div>
      </div>

      {step === 'upload' && (
        <div className="bg-white rounded-3xl p-12 shadow-sm border border-slate-200/90 flex flex-col items-center justify-center text-center border-dashed border-2 hover:border-purple-400 hover:bg-purple-50/20 transition-all cursor-pointer group"
             onClick={() => {
               setProgress(0);
               setStep('generating');
               generateMutation.mutate();
             }}>
          <div className="w-20 h-20 bg-purple-100 text-purple-700 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-md shadow-purple-600/10">
            <UploadCloud className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Glissez votre support de cours ici</h2>
          <p className="text-xs font-semibold text-slate-500 mb-6">Formats supportés : PDF, PPTX, DOCX (Max 20MB)</p>
          <button className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white px-8 py-3.5 rounded-2xl font-extrabold text-xs shadow-lg shadow-purple-950/20 flex items-center gap-2 hover:scale-105 transition-all">
            <FileText className="w-4 h-4 text-purple-300" /> Parcourir les fichiers ou Démo Directe
          </button>
        </div>
      )}

      {step === 'generating' && (
        <div className="bg-white rounded-3xl p-12 shadow-sm border border-slate-200/90 flex flex-col items-center justify-center text-center min-h-[400px]">
          <div className="relative w-28 h-28 mb-8">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90 animate-spin-slow">
              <circle cx="56" cy="56" r="50" fill="transparent" stroke="#e2e8f0" strokeWidth="8" />
              <circle cx="56" cy="56" r="50" fill="transparent" stroke="url(#gradient)" strokeWidth="8" strokeDasharray="314" strokeDashoffset={314 - (314 * progress) / 100} className="transition-all duration-300" />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="w-9 h-9 text-purple-600 animate-pulse" />
            </div>
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">L'Intelligence Artificielle analyse votre cours...</h2>
          <p className="text-xs font-semibold text-slate-500 mb-4">Génération des questions et réponses en cours ({progress}%)</p>
          <div className="w-64 bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-800">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              <div>
                <h3 className="font-bold">Génération terminée avec succès !</h3>
                <p className="text-sm">L'IA a généré {questions.length} questions interactives.</p>
              </div>
            </div>
            <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-sm">
              <Play className="w-4 h-4" /> Publier au Classroom
            </button>
          </div>

          <div className="space-y-4">
            {questions.map((item, qIdx) => (
              <div key={qIdx} className="bg-white rounded-2xl p-6 shadow-sm border border-white/5">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-black text-sm shrink-0">
                    {qIdx + 1}
                  </div>
                  <input 
                    type="text" 
                    defaultValue={item.q}
                    className="flex-1 font-bold text-white bg-transparent border-b border-dashed border-gray-300 focus:border-purple-500 focus:outline-none pb-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 pl-12">
                  {item.a.map((ans: string, aIdx: number) => (
                    <div key={aIdx} className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border text-sm transition-colors cursor-pointer",
                      aIdx === item.correct 
                        ? "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold" 
                        : "border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.05]"
                    )}>
                      <div className={cn(
                        "w-4 h-4 rounded-full border flex items-center justify-center",
                        aIdx === item.correct ? "border-emerald-500 bg-emerald-500" : "border-gray-300 bg-white"
                      )}>
                        {aIdx === item.correct && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                      </div>
                      <input 
                        type="text" 
                        defaultValue={ans}
                        className="bg-transparent focus:outline-none w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-4">
            <button className="flex items-center gap-2 text-purple-600 font-bold hover:text-purple-800 transition-colors">
              Générer d'autres questions <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
