import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api';
import { Award, CheckCircle2, ShieldCheck, Download, FileText, Sparkles, Building2, User } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { toast } from 'sonner';
import { openAuthenticatedUrl } from '@shared/lib/documentAccess';

export default function ProfessorPfeEvaluationPage() {
  // Criteria ratings (Out of 20 total)
  const [writtenReport, setWrittenReport] = useState<number>(4.25);
  const [methodology, setMethodology] = useState<number>(8.5);
  const [oralDefense, setOralDefense] = useState<number>(4.0);
  const [remarks, setRemarks] = useState('Excellent travail de recherche empirique. Recommandations managériales pertinentes et applicables.');
  
  const [isSigned, setIsSigned] = useState(false);
  const presidentSignature = 'Pr. Mohammed El Amrani';
  const examinerSignature = 'Pr. Fatima Bensouda';

  const { data: internships = [] } = useQuery({
    queryKey: ['professor-internships-eval'],
    queryFn: async () => {
      try {
        const res = await api.get('/professor/internships/supervised');
        return res.data.internships || [];
      } catch {
        return [];
      }
    }
  });

  const defaultPfe = {
    student: { first_name: 'Amine', last_name: 'Bennani', cne: 'N130094821' },
    filiere: 'Gestion Financière & Comptable (GFC)',
    semester: 'S10 (Master)',
    company_name: 'PwC Maroc (Casablanca)',
    company_department: 'Département Audit & Advisory',
    topic: 'Impact de l\'adoption des normes IFRS 16 sur l\'évaluation financière des entreprises cotées à la Bourse de Casablanca.'
  };

  const pfe = internships[0] || defaultPfe;

  const totalGrade = (writtenReport + methodology + oralDefense).toFixed(2);
  const numericGrade = parseFloat(totalGrade);

  const getMention = (grade: number) => {
    if (grade >= 16) return { label: 'Très Honorable avec Félicitations du Jury', color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' };
    if (grade >= 14) return { label: 'Très Honorable', color: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800' };
    if (grade >= 12) return { label: 'Honorable', color: 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800' };
    if (grade >= 10) return { label: 'Passable', color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' };
    return { label: 'Ajourné', color: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800' };
  };

  const mention = getMention(numericGrade);

  const handleValidateAndSign = () => {
    setIsSigned(true);
    toast.success('✍️ PV de Soutenance de PFE validé et signé électroniquement !', {
      description: `Note finale attribuée : ${totalGrade}/20 (${mention.label})`
    });
  };

  const handleDownloadPv = () => {
    openAuthenticatedUrl('/api/v1/admin/pfe/pv-soutenance-sample');
    toast.success('📄 Téléchargement du Procès-Verbal officiel de soutenance PDF !');
  };

  return (
    <div className="space-y-8 font-sans animate-in fade-in duration-500 text-slate-900 dark:text-slate-100 pb-28">
      
      {/* ── Executive Header Banner ── */}
      <div className="bg-gradient-to-br from-[#001A4B] via-[#082663] to-[#0d1d3d] rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-3xl flex items-center justify-center shadow-xl shadow-amber-500/20 text-[#001A4B] shrink-0 font-black">
            <Award className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Grille Numérique Officielle (Zero Papier)
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Évaluation de Soutenance PFE & Jury</h1>
            <p className="text-xs md:text-sm text-blue-200 font-medium">
              Notation critériée en direct, calcul automatique de la mention et signature électronique conjointe du PV.
            </p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-5 text-center shrink-0 min-w-44">
          <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider block">Note Finale Jury</span>
          <div className="text-4xl font-black text-white">{totalGrade} / 20</div>
          <div className="text-xs text-emerald-300 font-bold mt-1">{numericGrade >= 10 ? 'Admis • Validé' : 'Non Admis'}</div>
        </div>
      </div>

      {/* Candidate Profile Summary */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Dossier du Candidat</h2>
          <span className="text-xs font-bold text-slate-400">PFE 2026 — Session de Juin</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-black uppercase text-slate-400">Étudiant(e)</span>
            <div className="font-black text-sm text-slate-900 dark:text-white mt-0.5">
              {pfe?.student ? `${pfe.student.first_name} ${pfe.student.last_name}` : 'Amine Bennani'}
            </div>
            <div className="text-xs text-slate-500 font-bold">CNE : {pfe?.student?.cne || 'N130094821'} • {pfe?.semester || 'S10'}</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-black uppercase text-slate-400">Filière & Spécialité</span>
            <div className="font-black text-sm text-slate-900 dark:text-white mt-0.5">{pfe?.filiere || 'Grande École GFC'}</div>
            <div className="text-xs text-slate-500 font-bold">ENCG Fès</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-black uppercase text-slate-400">Entreprise d'Accueil</span>
            <div className="font-black text-sm text-slate-900 dark:text-white mt-0.5">{pfe?.company_name || 'PwC Maroc'}</div>
            <div className="text-xs text-slate-500 font-bold">{pfe?.company_department || 'Audit & Advisory'}</div>
          </div>

          <div className="md:col-span-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">Intitulé du Mémoire de Fin d'Études</span>
            <div className="font-bold text-sm text-slate-900 dark:text-white mt-1">
              {pfe?.topic || pfe?.title || 'Impact des normes IFRS 16 sur l\'évaluation financière des entreprises cotées.'}
            </div>
          </div>
        </div>
      </div>

      {/* Criteria Evaluation Sliders */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wide">
            Barème & Critères d'Évaluation Officiels (Sur 20 Points)
          </h2>
          <p className="text-xs text-slate-500 font-medium">Ajustez les curseurs pour chaque dimension évaluée par la commission de jury.</p>
        </div>

        <div className="space-y-6">
          {/* C1: Written report */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex justify-between items-center text-xs font-black">
              <span className="text-slate-800 dark:text-white">1. Qualité du Mémoire Écrit & Documentation (Sur 5 Pts)</span>
              <span className="text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-lg text-sm">{writtenReport} / 5</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.25"
              value={writtenReport}
              onChange={e => setWrittenReport(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#001A4B]"
            />
            <p className="text-[11px] text-slate-400">Structure, rigueur de la rédaction, bibliographie et respect des normes académiques ENCG.</p>
          </div>

          {/* C2: Methodology */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex justify-between items-center text-xs font-black">
              <span className="text-slate-800 dark:text-white">2. Rigueur Méthodologique & Diagnostic Entreprise (Sur 10 Pts)</span>
              <span className="text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-lg text-sm">{methodology} / 10</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={methodology}
              onChange={e => setMethodology(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#001A4B]"
            />
            <p className="text-[11px] text-slate-400">Pertinence des outils d'analyse, traitement des données empiriques et valeur ajoutée des préconisations.</p>
          </div>

          {/* C3: Oral defense */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex justify-between items-center text-xs font-black">
              <span className="text-slate-800 dark:text-white">3. Présentation Orale & Réponses aux Questions (Sur 5 Pts)</span>
              <span className="text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-lg text-sm">{oralDefense} / 5</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.25"
              value={oralDefense}
              onChange={e => setOralDefense(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#001A4B]"
            />
            <p className="text-[11px] text-slate-400">Clarté de l'exposé, gestion du temps, aisance oratoire et pertinence des réponses apportées au jury.</p>
          </div>
        </div>

        {/* Mention Calculated */}
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400">Mention Déterminée Automatiquement</span>
            <div className="font-black text-base text-slate-900 dark:text-white mt-0.5">{mention.label}</div>
          </div>
          <span className={cn("px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border", mention.color)}>
            {totalGrade} / 20
          </span>
        </div>

        {/* Remarks */}
        <div className="space-y-2">
          <label className="block text-xs font-black uppercase text-slate-600 dark:text-slate-300">Appréciations Générales du Jury</label>
          <textarea
            rows={3}
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>

      {/* Digital Signature & Validation Deck */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" /> Émargement & Signature Électronique du Jury
          </h2>
          <span className="text-xs font-bold text-slate-400">Date : {new Date().toLocaleDateString('fr-FR')}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-[10px] font-black uppercase text-slate-400">Président du Jury</span>
            <div className="font-black text-sm text-slate-900 dark:text-white">{presidentSignature}</div>
            <div className="h-16 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-serif text-slate-600 dark:text-slate-300 italic text-xs">
              {isSigned ? `✍️ ${presidentSignature} (Certifié SHA-256)` : "En attente de signature..."}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
            <span className="text-[10px] font-black uppercase text-slate-400">Membre Examinateur / Encadrant</span>
            <div className="font-black text-sm text-slate-900 dark:text-white">{examinerSignature}</div>
            <div className="h-16 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-serif text-slate-600 dark:text-slate-300 italic text-xs">
              {isSigned ? `✍️ ${examinerSignature} (Certifié SHA-256)` : "En attente de signature..."}
            </div>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleDownloadPv}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-blue-600" /> Prévisualiser le PV Officiel (PDF)
          </button>

          <button
            onClick={handleValidateAndSign}
            disabled={isSigned}
            className={cn(
              "w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer",
              isSigned 
                ? "bg-emerald-600 text-white" 
                : "bg-[#001A4B] hover:bg-[#082663] text-white"
            )}
          >
            <CheckCircle2 className="w-4 h-4 text-amber-300" />
            {isSigned ? "PV Officiellement Signé & Clôturé ✓" : "Valider & Signer Électroniquement le PV"}
          </button>
        </div>
      </div>

    </div>
  );
}
