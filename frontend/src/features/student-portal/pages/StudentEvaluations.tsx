import React from 'react';
import { ClipboardCheck, ShieldCheck, BookOpen } from 'lucide-react';
import { cn } from '@shared/lib/utils';

export default function StudentEvaluations() {
  const evaluations = [
    { name: 'Introduction - Génie Informatique', prof: 'Radouane el asri' },
    { name: 'Développement mobile', prof: 'Radouane el asri' },
  ];

  return (
    <div className="max-w-[1000px] mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in zoom-in duration-500 pb-24">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-blue-50 text-[#003a8c] rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm">
          <ClipboardCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-[#003a8c] italic">Évaluation des Enseignements</h1>
          <p className="text-white/50 font-medium">Exprimez votre avis de manière 100% anonyme pour nous aider Ã  améliorer la qualité de nos cours.</p>
        </div>
      </div>

      {/* Anonymity Guarantee Banner */}
      <div className="bg-[#1e3a8a] rounded-[2rem] p-8 shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center gap-8 border border-blue-800">
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}>
        </div>
        
        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/20 relative z-10 backdrop-blur-sm">
          <div className="relative">
            <ClipboardCheck className="w-8 h-8 text-blue-200" />
            <ShieldCheck className="w-5 h-5 text-emerald-400 absolute -bottom-2 -right-2" />
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-xl font-black text-white mb-2 flex items-center gap-2">
            Anonymat Garanti Ã  100% <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </h2>
          <p className="text-blue-100 text-sm font-medium leading-relaxed max-w-3xl">
            Afin d'assurer une liberté d'expression totale, vos réponses sont stockées de façon totalement anonyme. 
            Le système enregistre uniquement une empreinte sécurisée Ã  sens unique pour s'assurer que chaque étudiant 
            n'évalue qu'une seule fois un cours.
          </p>
        </div>
      </div>

      {/* Evaluation List */}
      <div className="space-y-4">
        {evaluations.map((evalItem, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-shadow group">
            
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100 shrink-0">
                <BookOpen className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white group-hover:text-[#003a8c] transition-colors">{evalItem.name}</h3>
                <p className="text-sm font-medium text-white/50">
                  Enseignant(e) : <span className="text-white/80 font-bold">{evalItem.prof}</span>
                </p>
              </div>
            </div>

            <button className="shrink-0 bg-[#001A4B] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#003a8c] transition-colors shadow-sm w-full md:w-auto">
              ÉVALUER
            </button>

          </div>
        ))}
      </div>

    </div>
  );
}
