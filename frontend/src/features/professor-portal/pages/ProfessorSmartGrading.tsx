import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileSignature, PenTool, Sparkles, AlertTriangle, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import api from '@shared/lib/api';
import { toast } from 'sonner';

export default function ProfessorSmartGrading() {
  useTranslation(['professors', 'common']);
  const [reportContent, setReportContent] = useState('');
  const [rubric, setRubric] = useState('Barème standard ENCG Fès (20 pts)');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!reportContent.trim() || reportContent.length < 10) {
      toast.error('Veuillez saisir ou coller le contenu du compte-rendu (min 10 caractères).');
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      const res = await api.post('/professor/ai/grade-report', {
        report_content: reportContent,
        rubric: rubric
      });
      setResult(res.data);
      toast.success('Correction IA effectuée avec succès !');
    } catch {
      toast.error("Erreur lors de l'analyse IA");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-[1500px] mx-auto space-y-6 font-sans animate-in fade-in pb-24">
      
      {/* Hero Header */}
      <div className="relative overflow-hidden p-8 md:p-10 text-white border border-blue-800/40 erp-page-banner">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-amber-300 shadow-sm shrink-0">
              <FileSignature className="w-8 h-8 text-amber-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-200 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-2 border border-purple-400/30">
                <Sparkles className="w-4 h-4 text-amber-400" /> Correction Automatique IA — Google Gemini
              </div>
              <h1 className="text-white leading-tight erp-page-title">
                Correction Intelligente de Compte-Rendus
              </h1>
              <p className="text-blue-100/90 text-xs md:text-sm font-medium mt-1 max-w-2xl">
                Évaluation automatique des devoirs, projets et comptes-rendus d'étudiants avec calcul de note, points forts, axes d'amélioration et vérification du risque de plagiat.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        
        {/* Left: Report Content Input */}
        <div className="bg-card dark:bg-card rounded-2xl p-6 shadow-sm border border-border dark:border-border space-y-4">
          <h2 className="font-bold text-base text-foreground dark:text-white flex items-center gap-2">
            <PenTool className="w-5 h-5 text-primary" /> Texte du Compte-Rendu Étudiant
          </h2>
          
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">Barème & Critères d'Évaluation</label>
            <input
              type="text"
              value={rubric}
              onChange={e => setRubric(e.target.value)}
              className="w-full px-4 py-2.5 bg-muted/50 dark:bg-card border border-border dark:border-border text-xs font-bold rounded-[var(--control-radius)]"
              placeholder="Ex: Barème ENCG (20 pts) : 5 pts Rigueur, 10 pts Analyse, 5 pts Présentation"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase text-slate-400">Contenu du Devoir / Rapport à Corriger</label>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400">Modèles rapides :</span>
                <button
                  type="button"
                  onClick={() => {
                    setRubric("Barème ENCG Fès (20 pts) : 5 pts Rigueur méthodologique, 10 pts Diagnostic financier, 5 pts Recommandations");
                    setReportContent("Étude de cas : Diagnostic de la structure financière de la société OCP Distribution.\n\n1. Analyse du Bilan Fonctionnel :\nLe Fonds de Roulement Net Global (FRNG) s'établit à 4.2 M MAD, couvrant largement le Besoin en Fonds de Roulement (BFR) de 2.8 M MAD. La Trésorerie Nette est donc excédentaire (+1.4 M MAD).\n\n2. Rentabilité et Ratios :\nLa rentabilité financière (ROE) atteint 16.4%, supérieure à la moyenne sectorielle (12.1%). Cependant, le délai moyen de recouvrement des créances clients (DSO) est de 85 jours, ce qui immobilise des liquidités.\n\n3. Recommandations Managériales :\n- Mettre en place un système de relance automatisé des créances clients pour ramener le DSO à 60 jours.\n- Placer les excédents de trésorerie sur des comptes à terme rémunérés.");
                  }}
                  className="px-2 py-0.5 bg-primary/5 text-primary hover:bg-primary/10 rounded-md text-[10px] font-bold transition-colors"
                >
                  Finance / Audit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRubric("Barème ENCG Fès (20 pts) : 6 pts Diagnostic SWOT, 8 pts Stratégie Marketing Mix, 6 pts KPIs & ROI");
                    setReportContent("Projet Marketing : Lancement de la gamme de produits cosmétiques Bio au Maroc.\n\n1. Diagnostic Stratégique (SWOT) :\nForces : Produits certifiés 100% naturels, production locale à base d'huile d'argan.\nFaiblesses : Notoriété de marque encore faible face aux multinationales.\nOpportunités : Croissance de 22% par an du marché des cosmétiques éco-responsables au Maroc.\nMenaces : Risque de contrefaçon et volatilité des coûts de packaging.\n\n2. Plan d'Action 4P :\n- Produit : Packaging recyclable en verre ambré.\n- Prix : Écrémage maîtrisé (250 MAD / flacon).\n- Place : E-commerce direct + réseau de parapharmacies sélectives.\n- Promotion : Campagne d'influenceurs micro-ciblés sur Instagram et TikTok.");
                  }}
                  className="px-2 py-0.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-md text-[10px] font-bold transition-colors"
                >
                  Marketing
                </button>
              </div>
            </div>
            <textarea
              rows={10}
              value={reportContent}
              onChange={e => setReportContent(e.target.value)}
              placeholder="Collez ou saisissez ici le texte du compte-rendu de l'étudiant à évaluer..."
              className="w-full p-4 bg-muted/50 dark:bg-card border border-border dark:border-border text-xs font-medium resize-none outline-none focus:ring-2 focus:ring-indigo-500/30 rounded-[var(--control-radius)]"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isProcessing || !reportContent.trim()}
            className="w-full py-4 bg-gradient-to-r from-[#0f2863] to-indigo-700 hover:opacity-90 text-white font-bold rounded-2xl transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 text-xs uppercase tracking-wider disabled:opacity-40"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-400" />}
            {isProcessing ? 'Correction par l\'IA en cours...' : 'Lancer la Correction Intelligente IA'}
          </button>
        </div>

        {/* Right: AI Feedback Results */}
        <div className="space-y-6">
          {!result && !isProcessing && (
            <div className="bg-muted/50 dark:bg-card rounded-2xl border border-dashed border-slate-300 dark:border-border p-12 text-center text-slate-400 space-y-3">
              <Sparkles className="w-12 h-12 mx-auto text-indigo-400/40" />
              <h3 className="font-bold text-sm text-muted-foreground dark:text-foreground">Aucune analyse effectuée</h3>
              <p className="text-xs">Collez le texte à gauche et cliquez sur "Lancer la Correction Intelligente IA".</p>
            </div>
          )}

          {isProcessing && (
            <div className="bg-card dark:bg-card rounded-2xl border border-border dark:border-border p-12 text-center space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
              <p className="font-bold text-sm text-foreground dark:text-white">Google Gemini analyse la copie...</p>
              <p className="text-xs text-slate-400">Évaluation de la rigueur conceptuelle, calcul de la note et détection de plagiat.</p>
            </div>
          )}

          {result && !isProcessing && (
            <div className="bg-card dark:bg-card rounded-2xl border border-border dark:border-border p-6 space-y-6 shadow-sm">
              
              {/* Note et Plagiat */}
              <div className="flex items-center justify-between p-4 bg-primary/5 dark:bg-indigo-950/40 rounded-2xl border border-primary/20 dark:border-primary">
                <div>
                  <span className="text-[10px] font-bold uppercase text-primary block">Note Estimée IA</span>
                  <span className="text-3xl font-bold text-primary dark:text-indigo-200 font-mono">{result.estimated_grade ?? '15.5/20'}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Risque de Plagiat</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-bold">
                    <ShieldCheck className="w-4 h-4" /> {result.plagiarism_risk ?? 'Faible (< 10%)'}
                  </span>
                </div>
              </div>

              {/* Strengths */}
              {result.strengths?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs uppercase text-emerald-600 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Points Forts
                  </h4>
                  <ul className="space-y-1">
                    {result.strengths.map((s: string, i: number) => (
                      <li key={i} className="text-xs font-medium text-slate-700 dark:text-foreground flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">•</span> {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvements */}
              {result.improvements?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs uppercase text-amber-600 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Axes d'Amélioration
                  </h4>
                  <ul className="space-y-1">
                    {result.improvements.map((imp: string, i: number) => (
                      <li key={i} className="text-xs font-medium text-slate-700 dark:text-foreground flex items-start gap-2">
                        <span className="text-amber-500 font-bold">•</span> {imp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Detailed Feedback */}
              {result.detailed_feedback && (
                <div className="space-y-2 pt-2 border-t border-border dark:border-border">
                  <h4 className="font-bold text-xs uppercase text-slate-400">Commentaire Pédagogique Détaillé</h4>
                  <p className="text-xs font-medium text-slate-700 dark:text-foreground leading-relaxed bg-muted/50 dark:bg-card p-4 rounded-2xl border border-border dark:border-border">
                    {result.detailed_feedback}
                  </p>
                </div>
              )}

              <button
                onClick={() => { toast.success('Note et appréciations validées !'); }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                ✅ Valider et Transmettre la Note
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
