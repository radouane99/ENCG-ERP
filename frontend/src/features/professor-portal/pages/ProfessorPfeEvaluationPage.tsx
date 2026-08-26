import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Award, 
  FileText, 
  CheckCircle2, 
  UserCheck, 
  Sparkles, 
  Building, 
  Calendar, 
  Save, 
  Printer, 
  Send, 
  ShieldCheck,
  Signature
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { toast } from 'sonner';
import { openAuthenticatedUrl } from '@shared/lib/documentAccess';

export default function ProfessorPfeEvaluationPage() {
  const { t, i18n } = useTranslation(['professors', 'common']);

  // Criteria ratings (Out of 20 total)
  const [writtenReport, setWrittenReport] = useState<number>(4.5); // /5
  const [methodology, setMethodology] = useState<number>(8.5); // /10
  const [oralDefense, setOralDefense] = useState<number>(4.0); // /5
  const [remarks, setRemarks] = useState('Excellente maîtrise du sujet, analyse rigoureuse des données empiriques et recommandations pertinentes pour l\'entreprise d\'accueil.');
  
  const [isSigned, setIsSigned] = useState(false);
  const [presidentSignature, setPresidentSignature] = useState('Pr. Abdelhak El Amrani');
  const [examinerSignature, setExaminerSignature] = useState('Pr. Fatima Benjelloun');

  const totalGrade = (writtenReport + methodology + oralDefense).toFixed(2);
  const numericGrade = parseFloat(totalGrade);

  const getMention = (grade: number) => {
    if (grade >= 16) return { label: 'Très Honorable avec Félicitations du Jury', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (grade >= 14) return { label: 'Très Honorable', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (grade >= 12) return { label: 'Honorable', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
    if (grade >= 10) return { label: 'Passable', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { label: 'Ajourné', color: 'text-rose-700 bg-rose-50 border-rose-200' };
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
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in duration-500 pb-28">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-[#001A4B] rounded-3xl p-8 text-white shadow-xl border border-indigo-900/60 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 text-slate-950 shrink-0">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1 mb-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Grille Numérique Officielle (Zero Papier)
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Évaluation de Soutenance PFE & Jury</h1>
            <p className="text-xs md:text-sm text-slate-300 font-medium mt-0.5">
              Notation critériée en direct, calcul automatique de la mention et signature électronique conjointe du PV.
            </p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center shrink-0">
          <div className="text-[10px] font-black uppercase text-amber-200 tracking-wider">Note Finale Jury</div>
          <div className="text-3xl font-black text-amber-400">{totalGrade} / 20</div>
          <div className="text-[10px] text-emerald-300 font-bold mt-0.5">{numericGrade >= 10 ? 'Admis' : 'Non Admis'}</div>
        </div>
      </div>

      {/* Candidate Profile Summary */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/90 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Dossier du Candidat</h2>
          <span className="text-xs font-bold text-slate-400">PFE 2026 — Session de Juin</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-black uppercase text-slate-400">Étudiant(e)</span>
            <div className="font-black text-sm text-slate-900 mt-0.5">Mehdi Tazi</div>
            <div className="text-xs text-slate-500 font-bold">CNE : N134056789 • S10</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-black uppercase text-slate-400">Filière & Spécialité</span>
            <div className="font-black text-sm text-slate-900 mt-0.5">Audit & Contrôle de Gestion</div>
            <div className="text-xs text-slate-500 font-bold">ENCG Fès</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-black uppercase text-slate-400">Entreprise d'Accueil</span>
            <div className="font-black text-sm text-slate-900 mt-0.5">Attijariwafa Bank</div>
            <div className="text-xs text-slate-500 font-bold">Direction de l'Audit Interne</div>
          </div>

          <div className="md:col-span-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] font-black uppercase text-indigo-600">Intitulé du Mémoire de Fin d'Études</span>
            <div className="font-black text-sm text-slate-900 mt-1">
              "Conception et mise en place d'une cartographie des risques opérationnels dans le secteur bancaire marocain selon les normes Bâle III"
            </div>
          </div>
        </div>
      </div>

      {/* Criteria Evaluation Sliders */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/90 space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
            Barème & Critères d'Évaluation Officiels (Sur 20 Points)
          </h2>
          <p className="text-xs text-slate-500 font-medium">Ajustez les curseurs pour chaque dimension évaluée par la commission de jury.</p>
        </div>

        <div className="space-y-6">
          {/* C1: Written report */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs font-black">
              <span className="text-slate-800">1. Qualité du Mémoire Écrit & Documentation (Sur 5 Pts)</span>
              <span className="text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg text-sm">{writtenReport} / 5</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.25"
              value={writtenReport}
              onChange={e => setWrittenReport(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <p className="text-[11px] text-slate-400">Structure, rigueur de la rédaction, bibliographie et respect des normes académiques ENCG.</p>
          </div>

          {/* C2: Methodology */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs font-black">
              <span className="text-slate-800">2. Rigueur Méthodologique & Diagnostic Entreprise (Sur 10 Pts)</span>
              <span className="text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg text-sm">{methodology} / 10</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.5"
              value={methodology}
              onChange={e => setMethodology(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <p className="text-[11px] text-slate-400">Pertinence des outils d'analyse, traitement des données empiriques et valeur ajoutée des préconisations.</p>
          </div>

          {/* C3: Oral defense */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs font-black">
              <span className="text-slate-800">3. Présentation Orale & Réponses aux Questions (Sur 5 Pts)</span>
              <span className="text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg text-sm">{oralDefense} / 5</span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.25"
              value={oralDefense}
              onChange={e => setOralDefense(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <p className="text-[11px] text-slate-400">Clarté de l'exposé, gestion du temps, aisance oratoire et pertinence des réponses apportées au jury.</p>
          </div>
        </div>

        {/* Mention Calculated */}
        <div className="p-4 rounded-2xl border flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase text-slate-400">Mention Déterminée Automatiquement</span>
            <div className="font-black text-sm text-slate-900 mt-0.5">{mention.label}</div>
          </div>
          <span className={cn("px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border", mention.color)}>
            {totalGrade} / 20
          </span>
        </div>

        {/* Remarks */}
        <div className="space-y-2">
          <label className="block text-xs font-black uppercase text-slate-600">Appréciations Générales du Jury</label>
          <textarea
            rows={3}
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
          />
        </div>
      </div>

      {/* Digital Signature & Validation Deck */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/90 space-y-6">
        <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" /> Émargement & Signature Électronique du Jury
          </h2>
          <span className="text-xs font-bold text-slate-400">Date : {new Date().toLocaleDateString('fr-FR')}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[10px] font-black uppercase text-slate-400">Président du Jury</span>
            <div className="font-black text-sm text-slate-900">{presidentSignature}</div>
            <div className="h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-serif text-slate-600 italic">
              {isSigned ? `✍️ ${presidentSignature} (Certifié SHA-256)` : "En attente de validation..."}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[10px] font-black uppercase text-slate-400">Membre Examinateur / Encadrant</span>
            <div className="font-black text-sm text-slate-900">{examinerSignature}</div>
            <div className="h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-serif text-slate-600 italic">
              {isSigned ? `✍️ ${examinerSignature} (Certifié SHA-256)` : "En attente de validation..."}
            </div>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
          <button
            onClick={handleDownloadPv}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-indigo-600" /> Prévisualiser le PV Officiel (PDF)
          </button>

          <button
            onClick={handleValidateAndSign}
            disabled={isSigned}
            className={cn(
              "w-full sm:w-auto px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer",
              isSigned 
                ? "bg-emerald-600 text-white shadow-emerald-950/20" 
                : "bg-gradient-to-r from-[#001A4B] to-indigo-900 hover:opacity-95 text-white shadow-indigo-950/20"
            )}
          >
            <CheckCircle2 className="w-4 h-4 text-amber-300" />
            {isSigned ? "PV Officiellement Signé & Clôturé" : "Valider & Signer Électroniquement le PV"}
          </button>
        </div>
      </div>

    </div>
  );
}
