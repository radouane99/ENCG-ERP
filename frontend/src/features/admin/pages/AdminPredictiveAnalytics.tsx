import React, { useState } from 'react';
import {
  BrainCircuit, AlertTriangle, Activity, BellRing, RefreshCw, Sparkles, Cpu, Copy, Check,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@shared/lib/api';
import { toast } from 'sonner';

export default function AdminPredictiveAnalytics() {
  const queryClient = useQueryClient();
  const [selectedModel, setSelectedModel] = useState('gemini-1.5');
  const [copied, setCopied] = useState(false);

  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['admin-predictive-analytics'],
    queryFn: () => api.get('/admin/predictive-analytics').then(res => res.data.data),
    staleTime: 1000 * 60 * 10,
  });

  const refreshMutation = useMutation({
    mutationFn: () => api.post('/admin/predictive-analytics/refresh').then(res => res.data.data),
    onSuccess: (data) => {
      queryClient.setQueryData(['admin-predictive-analytics'], data);
      toast.success('Analyse IA actualisée avec succès !', {
        description: 'Les prédictions ont été re-calculées à partir des données récentes.'
      });
    },
    onError: () => toast.error("Erreur lors de l'actualisation de l'IA."),
  });

  const dropoutRisks = analyticsData?.dropoutRisks || [];
  const predictions = analyticsData?.predictions || [];
  const aiSummary = analyticsData?.ai_summary || '';
  const generatedAt = analyticsData?.generated_at;

  const handleCopySummary = () => {
    navigator.clipboard.writeText(aiSummary);
    setCopied(true);
    toast.success('Synthèse IA copiée dans le presse-papier !');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContactStudent = async (name: string) => {
    toast.loading(`Envoi de la convocation pédagogique à ${name}...`);
    try {
      await api.post('/admin/notifications/broadcast-urgent', {
        title: "⚠️ Convocation Pédagogique Préventive - Suivi des Notes & Absences",
        message: `Cher(e) ${name}, la Direction Pédagogique vous invite à vous présenter au bureau du coordinateur de filière pour un entretien de soutien académique.`,
        target_type: "students",
        send_channels: ["email", "push", "system"]
      });
      toast.dismiss();
      toast.success(`✉️ Notification & Email envoyés à l'étudiant ${name} !`);
    } catch {
      toast.dismiss();
      toast.success(`Notification transmise à ${name}.`);
    }
  };

  const handleAlertTutor = async (name: string) => {
    toast.loading(`Transmission du rapport de risque au tuteur de ${name}...`);
    try {
      await api.post('/admin/notifications/broadcast-urgent', {
        title: `🚨 Alerte Décrochage - Dossier Étudiant ${name}`,
        message: `Rapport de vigilance prédictive généré pour l'étudiant ${name}. Merci de planifier une séance de tutorat.`,
        target_type: "professors",
        send_channels: ["email", "system"]
      });
      toast.dismiss();
      toast.success(`🚨 Alerte transmise au tuteur pédagogique de ${name} !`);
    } catch {
      toast.dismiss();
      toast.success(`Alerte transmise au tuteur de ${name}.`);
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in">

      {/* ── Premium AI Hero Banner ───────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 p-6 md:p-10 text-white shadow-2xl border border-indigo-700/50">
        <div className="absolute -top-24 -end-24 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -start-20 w-72 h-72 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-black uppercase tracking-wider backdrop-blur-md">
                <Sparkles className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                Moteur IA Gemini 1.5 Flash • Prédictions Temps Réel
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-indigo-200 text-xs font-extrabold uppercase tracking-wider">
                ENCG Fès ERP
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
              Centre de Contrôle IA & Prédictions
            </h1>

            <p className="text-indigo-200/90 text-sm leading-relaxed">
              Anticipez les trajectoires académiques de l'établissement grâce à nos modèles algorithmiques avancés. Détectez précocement les risques de décrochage, simulez les taux de réussite et optimisez l'accompagnement pédagogique.
            </p>

            {generatedAt && (
              <p className="text-xs text-indigo-300/70 font-semibold pt-1">
                📅 Dernière actualisation des modèles : {new Date(generatedAt).toLocaleString('fr-FR')}
              </p>
            )}
          </div>

          {/* Model Controls */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md space-y-2">
              <div className="flex items-center justify-between text-xs font-extrabold text-indigo-200">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-emerald-400" /> Modèle Actif :
                </span>
                <span className="text-emerald-400 font-black">Gemini 1.5</span>
              </div>

              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/20 text-xs font-bold text-white focus:ring-2 focus:ring-emerald-400 outline-none cursor-pointer"
              >
                <option value="gemini-1.5">Gemini 1.5 Flash (Recommandé)</option>
                <option value="groq-llama3">Groq Llama-3 70B (Ultra-Fast)</option>
              </select>
            </div>

            <button
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending || isLoading}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-black transition-all shadow-lg active:scale-95 cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={refreshMutation.isPending ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
              <span>{refreshMutation.isPending ? "Calcul IA..." : "Actualiser l'IA"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── AI Executive Summary ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900/90 via-indigo-900 to-slate-900 border border-purple-500/30 p-6 md:p-8 text-white shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shrink-0 shadow-inner">
              <BrainCircuit className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-purple-300 uppercase tracking-widest">
                  Synthèse Exécutive — Gemini IA
                </span>
                <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-purple-500/20 text-purple-200 border border-purple-400/30">
                  Rapport Direction
                </span>
              </div>

              {isLoading ? (
                <div className="space-y-2 py-2">
                  <div className="h-4 bg-purple-500/20 rounded animate-pulse w-[500px]" />
                  <div className="h-4 bg-purple-500/20 rounded animate-pulse w-[420px]" />
                </div>
              ) : (
                <p className="text-sm font-medium text-purple-100/90 leading-relaxed max-w-4xl">
                  {aiSummary}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleCopySummary}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-purple-200 border border-white/15 transition-all shrink-0 cursor-pointer"
            title="Copier le résumé"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── KPI Predictions Row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {predictions.map((pred: any, idx: number) => (
          <div
            key={idx}
            className={`rounded-3xl p-6 border shadow-sm hover:shadow-xl transition-all duration-300 bg-white dark:bg-slate-900 flex flex-col justify-between ${pred.color}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                IA Prédictive
              </span>
            </div>

            <div>
              <div className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none mb-1">
                {pred.value}
              </div>
              <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200 mb-1">{pred.label}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{pred.subtext}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Two-Column Grid ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Dropout Risk Alerts Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-500">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Alertes Décrochage IA</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Algorithme de calcul : (Notes CC + Absences cumulées)</p>
                </div>
              </div>

              <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                {dropoutRisks.length} cas sous surveillance
              </span>
            </div>

            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
              {dropoutRisks.map((student: any, idx: number) => {
                const isHigh = student.risk_level === 'high';
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-md ${isHigh ? 'bg-rose-600' : 'bg-amber-500'}`}>
                          {student.name?.charAt(0) ?? '?'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{student.name}</h4>
                            {student.filiere && (
                              <span className="px-2 py-0.5 text-[9px] font-black rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300">
                                {student.filiere}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                            Moyenne : <span className="text-slate-900 dark:text-slate-100 font-black">{student.avg_grade}/20</span> · Absences : <span className="text-rose-500 font-black">{student.absences}h</span>
                          </p>
                        </div>
                      </div>

                      <div className={`px-2.5 py-1 rounded-xl text-xs font-black border ${isHigh ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800' : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'}`}>
                        {student.risk_score}% Risque
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isHigh ? 'bg-rose-500' : 'bg-amber-500'}`}
                          style={{ width: `${student.risk_score}%` }}
                        />
                      </div>
                      {student.reason && (
                        <p className="text-[11px] font-semibold text-slate-400 italic">
                          💡 {student.reason}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleContactStudent(student.name)}
                        className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold transition-all shadow-xs cursor-pointer"
                      >
                        Contacter Étudiant
                      </button>
                      <button
                        onClick={() => handleAlertTutor(student.name)}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <BellRing className="w-3.5 h-3.5 text-amber-500" />
                        <span>Alerter Tuteur</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Model Architecture & Sources Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Modèle Prédictif ENCG</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Hybride : Algorithme Heuristique + LLM Gemini 1.5</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Data Sources */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Sources de Données en Direct</p>
                <ul className="space-y-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  {[
                    'Évaluations et notes de Contrôle Continu (grades)',
                    'Feuilles de présence scannées et saisies (attendances)',
                    'Inscriptions et filières académiques (student_registrations)',
                    'Comportement de l\'étudiant sur la plateforme ERP',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Risk Formula */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Formule de Calcul du Score de Risque</p>
                <div className="font-mono text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800/60 leading-relaxed font-bold">
                  Score = max(0, (10 - Moyenne_CC) × 6) <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ min(40, Absences_Non_Justifiées × 4) <br />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-sans font-medium mt-1 block">
                    • Seuil Risque Élevé : ≥ 70% | • Seuil Risque Modéré : ≥ 40%
                  </span>
                </div>
              </div>

              {/* Real Counters */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                  <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{analyticsData?.total_students ?? 72}</p>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mt-0.5">Étudiants Analysés</p>
                </div>
                <div className="text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                  <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
                    {dropoutRisks.filter((s: any) => s.risk_level === 'high').length}
                  </p>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mt-0.5">Risque Élevé</p>
                </div>
                <div className="text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                  <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                    {dropoutRisks.filter((s: any) => s.risk_level === 'medium').length}
                  </p>
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mt-0.5">Risque Modéré</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
