import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UploadCloud, Zap, FileText, CheckCircle2, ChevronRight, Save, Play } from 'lucide-react';
import { cn } from '@shared/lib/utils';

import { useMutation } from '@tanstack/react-query';
import api from '@/shared/lib/api';

export default function ProfessorQCMGenerator() {
  const { t, i18n } = useTranslation(['professors', 'common']);
  const isRtl = i18n.language === 'ar';
  const [step, setStep] = useState<'upload' | 'generating' | 'review'>('upload');
  const [progress, setProgress] = useState(0);
  const [questions, setQuestions] = useState<any[]>([]);

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
        const formatted = data.questions.map((q: any) => ({
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
    <div className="max-w-5xl mx-auto p-6 space-y-8 font-sans animate-in fade-in zoom-in duration-500 pb-24">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#001A4B] italic">Générateur QCM IA</h1>
          <p className="text-sm text-white/50">Transformez vos supports de cours en évaluations interactives en quelques secondes.</p>
        </div>
      </div>

      {step === 'upload' && (
        <div className="bg-white rounded-3xl p-12 shadow-sm border border-white/5 flex flex-col items-center justify-center text-center border-dashed border-2 hover:border-purple-300 hover:bg-purple-50/10 transition-colors cursor-pointer group"
             onClick={() => {
               setProgress(0);
               setStep('generating');
               generateMutation.mutate();
             }}>
          <div className="w-24 h-24 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">Glissez votre support de cours ici</h2>
          <p className="text-sm text-white/50 mb-6">Formats supportés : PDF, PPTX, DOCX (Max 20MB)</p>
          <button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-md shadow-purple-500/30 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Parcourir les fichiers
          </button>
        </div>
      )}

      {step === 'generating' && (
        <div className="bg-white rounded-3xl p-12 shadow-sm border border-white/5 flex flex-col items-center justify-center text-center min-h-[400px]">
          <div className="relative w-32 h-32 mb-8">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90 animate-spin-slow">
              <circle cx="64" cy="64" r="60" fill="transparent" stroke="#f3f4f6" strokeWidth="8" />
              <circle cx="64" cy="64" r="60" fill="transparent" stroke="url(#gradient)" strokeWidth="8" strokeDasharray="377" strokeDashoffset={377 - (377 * progress) / 100} className="transition-all duration-300" />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap className="w-10 h-10 text-purple-600 animate-pulse" />
            </div>
          </div>
          <h2 className="text-xl font-black text-white mb-2">L'Intelligence Artificielle analyse votre cours...</h2>
          <p className="text-sm text-white/50 mb-4">Génération des questions et réponses en cours ({progress}%)</p>
          <div className="w-64 bg-white/[0.05] h-2 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
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
                  {item.a.map((ans, aIdx) => (
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
