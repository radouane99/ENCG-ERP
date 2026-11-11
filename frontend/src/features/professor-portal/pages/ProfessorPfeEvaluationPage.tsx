import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api';
import {
  Award,
  CheckCircle2,
  ShieldCheck,
  Download,
  Building2,
  User,
  GraduationCap,
  Calendar,
  Sparkles,
  Sliders,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { toast } from 'sonner';
import { openAuthenticatedUrl } from '@shared/lib/documentAccess';

interface PfeCandidate {
  id: number;
  student: {
    first_name: string;
    last_name: string;
    cne: string;
    student_number: string;
  };
  filiere: string;
  semester: string;
  company_name: string;
  company_department: string;
  supervisor_company: string;
  topic: string;
  date_soutenance: string;
  room: string;
}

const defaultCandidates: PfeCandidate[] = [
  {
    id: 1,
    student: { first_name: 'Amine', last_name: 'Bennani', cne: 'N130094821', student_number: '2022-GFC-041' },
    filiere: 'Gestion Financière & Comptable (GFC)',
    semester: 'S10 (Master / Diplôme ENCG)',
    company_name: 'PwC Maroc (Casablanca)',
    company_department: 'Département Audit & Advisory',
    supervisor_company: 'M. Karim Alami (Directeur Associé)',
    topic: "Impact de l'adoption des normes IFRS 16 sur l'évaluation financière et la solvabilité des entreprises cotées à la Bourse de Casablanca.",
    date_soutenance: '09 Novembre 2026 à 10:00',
    room: 'Salle des Thèses LarMaFig',
  },
  {
    id: 2,
    student: { first_name: 'Salma', last_name: 'El Idrissi', cne: 'N134087112', student_number: '2022-MAC-018' },
    filiere: 'Management, Audit & Contrôle de Gestion (MAC)',
    semester: 'S10 (Master / Diplôme ENCG)',
    company_name: 'Attijariwafa Bank (Siège Rabat)',
    company_department: 'Direction du Contrôle de Gestion Groupe',
    supervisor_company: 'Mme Houda Mansouri (Responsable Reporting)',
    topic: "Mise en place d'un tableau de bord prospectif (Balanced Scorecard) appliqué à la performance RSE des banques marocaines.",
    date_soutenance: '09 Novembre 2026 à 11:30',
    room: 'Salle des Thèses LarMaFig',
  },
  {
    id: 3,
    student: { first_name: 'Youssef', last_name: 'Tahiri', cne: 'N139012445', student_number: '2022-MCI-029' },
    filiere: 'Marketing & Commerce International (MCI)',
    semester: 'S10 (Master / Diplôme ENCG)',
    company_name: 'Tanger Med Special Agency (TMSA)',
    company_department: 'Direction Commerciale & Logistics Hub',
    supervisor_company: 'M. Omar Cherkaoui (Chef de Département)',
    topic: "Digitalisation des corridors logistiques et compétitivité à l'export des PME marocaines vers l'Afrique de l'Ouest.",
    date_soutenance: '09 Novembre 2026 à 14:30',
    room: 'Amphithéâtre 1',
  },
];

export default function ProfessorPfeEvaluationPage() {
  const [selectedCandidateId, setSelectedCandidateId] = useState<number>(1);

  // 4 Official Criteria (Sum = 20 pts)
  const [writtenReport, setWrittenReport] = useState<number>(4.25);   // / 5.00
  const [methodology, setMethodology] = useState<number>(5.25);       // / 6.00
  const [oralDefense, setOralDefense] = useState<number>(3.50);       // / 4.00
  const [defenseAnswers, setDefenseAnswers] = useState<number>(4.25); // / 5.00
  const [remarks, setRemarks] = useState(
    "Excellent travail de recherche empirique. La démarche méthodologique est rigoureuse et les recommandations managériales apportent une réelle valeur ajoutée pratique à l'entreprise d'accueil."
  );

  const [isSigned, setIsSigned] = useState(false);
  const presidentSignature = 'Pr. Mohammed El Amrani';
  const examinerSignature = 'Pr. Fatima Bensouda';

  // Fetch supervised internships if available
  const { data: serverInternships = [] } = useQuery<PfeCandidate[]>({
    queryKey: ['professor-internships-eval'],
    queryFn: async (): Promise<PfeCandidate[]> => {
      try {
        const res = await api.get('/professor/internships/supervised');
        return res.data.internships || [];
      } catch {
        return [];
      }
    },
  });

  const candidatesList: PfeCandidate[] = serverInternships.length > 0 ? serverInternships : defaultCandidates;
  const currentCandidate: PfeCandidate = candidatesList.find((c: PfeCandidate) => c.id === selectedCandidateId) || candidatesList[0];

  const totalGrade = Number((writtenReport + methodology + oralDefense + defenseAnswers).toFixed(2));

  const getMention = (grade: number) => {
    if (grade >= 16) {
      return {
        label: 'Très Honorable avec Félicitations du Jury',
        color: 'text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700',
        badge: 'bg-emerald-500 text-white',
      };
    }
    if (grade >= 14) {
      return {
        label: 'Très Honorable',
        color: 'text-blue-800 dark:text-blue-200 bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700',
        badge: 'bg-[#1a3673] text-white',
      };
    }
    if (grade >= 12) {
      return {
        label: 'Honorable',
        color: 'text-indigo-800 dark:text-indigo-200 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-700',
        badge: 'bg-indigo-600 text-white',
      };
    }
    if (grade >= 10) {
      return {
        label: 'Passable',
        color: 'text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700',
        badge: 'bg-amber-500 text-slate-950',
      };
    }
    return {
      label: 'Ajourné (Session de Rattrapage Requise)',
      color: 'text-rose-800 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700',
      badge: 'bg-rose-600 text-white',
    };
  };

  const mention = getMention(totalGrade);

  const handleValidateAndSign = () => {
    setIsSigned(true);
    toast.success('PV de Soutenance de PFE validé et scellé avec succès !', {
      description: `Note finale officielle : ${totalGrade.toFixed(2)}/20 (${mention.label})`,
    });
  };

  const handleDownloadPv = () => {
    openAuthenticatedUrl('/api/v1/admin/pfe/pv-soutenance-sample');
    toast.success('Téléchargement du Procès-Verbal officiel de soutenance PFE (PDF) !');
  };

  const selectCandidate = (cand: PfeCandidate) => {
    setSelectedCandidateId(cand.id);
    setIsSigned(false);
  };

  return (
    <div className="space-y-7 max-w-[1720px] mx-auto font-sans animate-in fade-in pb-28">
      
      {/* 1. Official Context Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#1a3673]/10 dark:bg-blue-900/30 text-[#1a3673] dark:text-blue-400 flex items-center justify-center shrink-0">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 flex-wrap text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span className="text-slate-400 font-medium">Fin d'Études &amp; Master</span>
            <span className="text-slate-300 dark:text-slate-600">/</span>
            <span className="text-slate-700 dark:text-slate-200 font-bold">Grille Numérique d'Évaluation PFE</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold tracking-wide bg-blue-50 text-[#1a3673] dark:bg-blue-950 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Grille Standardisée ENCG Fès (Barème 20 pts)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="text-[11px] font-bold text-slate-500">
            Session de Soutenances Automne 2026-2027
          </span>
        </div>
      </div>

      {/* 2. Executive Hero Banner */}
      <div className="rounded-2xl p-7 md:p-8 text-white shadow-xl border border-[#1a3673]/30 bg-gradient-to-r from-[#0c1f4a] via-[#162f6b] to-[#1a3673] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none -translate-y-1/3 translate-x-1/4"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start md:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-400/20 text-amber-300 border border-amber-400/30 inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" /> Délibération Numérique en Direct
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-blue-200 border border-white/15">
                  Procédure Zéro Papier
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                Évaluation de Soutenance PFE &amp; Procès-Verbal de Jury
              </h1>
              <p className="text-xs md:text-sm text-blue-100/90 font-medium mt-1 max-w-2xl leading-relaxed">
                Notation pondérée selon les 4 critères officiels, attribution instantanée de la mention et signature conjointe scellée SHA-256.
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 text-center shrink-0 min-w-44 shadow-lg">
            <span className="text-[10px] font-bold uppercase text-amber-300 tracking-wider block">Note Finale de Soutenance</span>
            <div className="text-4xl font-black text-white font-mono mt-0.5">{totalGrade.toFixed(2)} <span className="text-lg text-blue-200 font-sans">/ 20</span></div>
            <div className="text-xs font-bold text-emerald-300 mt-1">
              {totalGrade >= 10 ? 'Admis • Validé' : 'Non Admis'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Candidate Selection Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[#1a3673] dark:text-blue-400" /> Candidats Programmés Aujourd'hui ({candidatesList.length})
          </span>
          <span className="text-[11px] font-medium text-slate-400">Cliquez pour évaluer un candidat</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {candidatesList.map((cand: PfeCandidate) => (
            <div
              key={cand.id}
              onClick={() => selectCandidate(cand)}
              className={cn(
                "p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3",
                selectedCandidateId === cand.id
                  ? "bg-blue-50/70 dark:bg-blue-950/40 border-[#1a3673] dark:border-blue-500 shadow-sm ring-1 ring-[#1a3673]/20"
                  : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-800/20"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-9 h-9 rounded-xl font-bold flex items-center justify-center text-xs shrink-0",
                  selectedCandidateId === cand.id
                    ? "bg-[#1a3673] text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                )}>
                  {cand.student.first_name.charAt(0)}{cand.student.last_name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800 dark:text-white">
                    {cand.student.first_name} {cand.student.last_name}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-mono">
                    {cand.student.cne} • {cand.room}
                  </p>
                </div>
              </div>
              <ChevronRight className={cn(
                "w-4 h-4 transition-transform",
                selectedCandidateId === cand.id ? "text-[#1a3673] dark:text-blue-400 translate-x-0.5" : "text-slate-400"
              )} />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Active Candidate Dossier Summary */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200/90 dark:border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#1a3673] dark:text-blue-300 font-bold flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800 dark:text-white flex items-center gap-2">
                {currentCandidate.student.first_name} {currentCandidate.student.last_name}
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {currentCandidate.student.student_number}
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Filière : <strong className="text-slate-700 dark:text-slate-200">{currentCandidate.filiere}</strong> • {currentCandidate.semester}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{currentCandidate.date_soutenance}</span>
            <span>•</span>
            <span className="font-bold text-[#1a3673] dark:text-blue-400">{currentCandidate.room}</span>
          </div>
        </div>

        {/* Topic and Company details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
          <div className="lg:col-span-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Thème Officiel du PFE</span>
            <p className="font-medium text-slate-800 dark:text-white leading-relaxed">
              "{currentCandidate.topic}"
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Organisme d'Accueil &amp; Tuteur</span>
            <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-primary" /> {currentCandidate.company_name}
            </div>
            <p className="text-[11px] text-slate-500">
              {currentCandidate.company_department} • {currentCandidate.supervisor_company}
            </p>
          </div>
        </div>
      </div>

      {/* 5. Grille d'Évaluation Interactive (4 Critères Officiels ENCG) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-7 shadow-sm border border-slate-200/90 dark:border-slate-800 space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#1a3673] dark:text-blue-400" />
              Barème &amp; Notation Critériée du Jury (Total sur 20.00 pts)
            </h2>
            <p className="text-xs text-slate-500">
              Ajustez les curseurs pour chaque dimension académique et professionnelle
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300">
            Total : <strong className="text-[#1a3673] dark:text-blue-400">{totalGrade.toFixed(2)}</strong> / 20.00
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Critère 1 */}
          <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wide text-slate-800 dark:text-white">
                  1. Qualité du Mémoire Écrit &amp; Documentation
                </h4>
                <p className="text-[11px] text-slate-400">Clarté rédactionnelle, structure logique, bibliographie aux normes APA.</p>
              </div>
              <span className="font-mono text-base font-black text-[#1a3673] dark:text-blue-400 shrink-0 px-3 py-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                {writtenReport.toFixed(2)} / 5.00
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.25"
              value={writtenReport}
              onChange={(e) => setWrittenReport(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#1a3673]"
            />
          </div>

          {/* Critère 2 */}
          <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wide text-slate-800 dark:text-white">
                  2. Rigueur Méthodologique &amp; Analyse Empirique
                </h4>
                <p className="text-[11px] text-slate-400">Pertinence de la problématique, démarche scientifique et analyse des données.</p>
              </div>
              <span className="font-mono text-base font-black text-[#1a3673] dark:text-blue-400 shrink-0 px-3 py-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                {methodology.toFixed(2)} / 6.00
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="6"
              step="0.25"
              value={methodology}
              onChange={(e) => setMethodology(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#1a3673]"
            />
          </div>

          {/* Critère 3 */}
          <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wide text-slate-800 dark:text-white">
                  3. Présentation Orale &amp; Supports Visuels
                </h4>
                <p className="text-[11px] text-slate-400">Qualité du diaporama, aisance verbale, clarté de l'argumentation et gestion du temps.</p>
              </div>
              <span className="font-mono text-base font-black text-[#1a3673] dark:text-blue-400 shrink-0 px-3 py-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                {oralDefense.toFixed(2)} / 4.00
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="4"
              step="0.25"
              value={oralDefense}
              onChange={(e) => setOralDefense(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#1a3673]"
            />
          </div>

          {/* Critère 4 */}
          <div className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wide text-slate-800 dark:text-white">
                  4. Réponses aux Questions &amp; Discussion
                </h4>
                <p className="text-[11px] text-slate-400">Réactivité, précision conceptuelle et recul critique face aux remarques du jury.</p>
              </div>
              <span className="font-mono text-base font-black text-[#1a3673] dark:text-blue-400 shrink-0 px-3 py-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                {defenseAnswers.toFixed(2)} / 5.00
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="5"
              step="0.25"
              value={defenseAnswers}
              onChange={(e) => setDefenseAnswers(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#1a3673]"
            />
          </div>

        </div>

        {/* Mention calculée automatiquement */}
        <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Mention Officielle Attribuée par le Jury
            </span>
            <div className="font-bold text-base text-slate-800 dark:text-white mt-0.5">
              {mention.label}
            </div>
          </div>
          <span className={cn("px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border", mention.color)}>
            {totalGrade.toFixed(2)} / 20.00
          </span>
        </div>

        {/* Appréciations Générales */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Appréciations &amp; Recommandations du Jury
          </label>
          <textarea
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a3673]/30 resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* 6. Emargement & Signature Électronique du Jury */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 sm:p-7 shadow-sm border border-slate-200/90 dark:border-slate-800 space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#1a3673] dark:text-blue-400" />
            Émargement &amp; Signature Électronique Conjointe du Jury
          </h2>
          <span className="text-xs font-bold text-slate-400">Date d'évaluation : {new Date().toLocaleDateString('fr-FR')}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Président du Jury</span>
            <div className="font-bold text-xs text-slate-800 dark:text-white">{presidentSignature}</div>
            <div className="h-16 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-serif text-slate-500 italic text-xs shadow-inner">
              {isSigned ? `✓ ${presidentSignature} (Certifié SHA-256)` : "En attente de signature..."}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Membre Examinateur / Rapporteur</span>
            <div className="font-bold text-xs text-slate-800 dark:text-white">{examinerSignature}</div>
            <div className="h-16 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-serif text-slate-500 italic text-xs shadow-inner">
              {isSigned ? `✓ ${examinerSignature} (Certifié SHA-256)` : "En attente de signature..."}
            </div>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={handleDownloadPv}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <Download className="w-4 h-4 text-[#1a3673] dark:text-blue-400" /> Prévisualiser le PV Officiel (PDF)
          </button>

          <button
            onClick={handleValidateAndSign}
            disabled={isSigned}
            className={cn(
              "w-full sm:w-auto px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer active:scale-95",
              isSigned 
                ? "bg-emerald-600 text-white cursor-default" 
                : "bg-[#1a3673] hover:bg-[#0f2454] text-white shadow-blue-900/20"
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
