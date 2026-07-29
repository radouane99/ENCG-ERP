import React, { useState } from 'react';
import { Search, CheckCircle2, Clock, AlertTriangle, XCircle, FileText, Download, ChevronRight, RefreshCw, Sun, Moon } from 'lucide-react';
import api from '@shared/lib/api';
import AiScolarBotWidget from '@shared/components/AiScolarBotWidget';


// ─── Types ───────────────────────────────────────────────────────────────────
type InscriptionStatus =
  | 'submitted'
  | 'dossier_incomplet'
  | 'dossier_complet'
  | 'valide'
  | 'inscrit'
  | 'reinscrit';

interface StatusResult {
  cne: string;
  nom: string;
  inscription_status: InscriptionStatus;
  student_number: string | null;
  filiere: string | null;
  submitted_at: string | null;
  validated_at: string | null;
  missing_documents: string[];
  academic_year: string;
}

// ─── Status Config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<InscriptionStatus, {
  label: string; icon: React.ReactNode; color: string;
  bg: string; border: string; desc: string; step: number;
}> = {
  submitted: {
    label: 'Dossier Soumis',
    icon: <Clock className="w-5 h-5" />,
    color: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-200 dark:border-blue-800',
    desc: 'Votre dossier a été reçu et est en cours de traitement.',
    step: 1,
  },
  dossier_incomplet: {
    label: 'Documents Manquants',
    icon: <AlertTriangle className="w-5 h-5" />,
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800',
    desc: 'Des documents sont manquants. Veuillez les soumettre au plus vite.',
    step: 2,
  },
  dossier_complet: {
    label: 'Dossier Complet',
    icon: <FileText className="w-5 h-5" />,
    color: 'text-indigo-700 dark:text-indigo-300',
    bg: 'bg-indigo-50 dark:bg-indigo-950/40',
    border: 'border-indigo-200 dark:border-indigo-800',
    desc: 'Votre dossier est complet. Il est en attente de validation par la commission.',
    step: 3,
  },
  valide: {
    label: 'Dossier Validé ✅',
    icon: <CheckCircle2 className="w-5 h-5" />,
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800',
    desc: 'Votre dossier a été approuvé par la commission d\'admission.',
    step: 4,
  },
  inscrit: {
    label: 'Inscription Confirmée 🎓',
    icon: <CheckCircle2 className="w-5 h-5" />,
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800',
    desc: 'Félicitations ! Votre inscription est officielle. Votre numéro a été généré.',
    step: 5,
  },
  reinscrit: {
    label: 'Réinscription Confirmée 🔁',
    icon: <CheckCircle2 className="w-5 h-5" />,
    color: 'text-teal-700 dark:text-teal-300',
    bg: 'bg-teal-50 dark:bg-teal-950/40',
    border: 'border-teal-200 dark:border-teal-800',
    desc: 'Votre réinscription pour l\'année en cours est confirmée.',
    step: 5,
  },
};

const DOC_LABELS: Record<string, string> = {
  photo: '📷 Photo d\'identité',
  bac_recto: '📜 Baccalauréat (Recto)',
  bac_verso: '📜 Baccalauréat (Verso)',
  cin_recto_verso: '🪪 Carte Nationale d\'Identité',
  releve_notes: '📊 Relevé de Notes Baccalauréat',
  extrait_naissance: '📜 Extrait de Naissance',
  engagement_reglement: '📝 Engagement Règlement Intérieur',
  fiche_medicale: '🩺 Fiche Médicale',
};

const STEPS = [
  { step: 1, label: 'Soumission' },
  { step: 2, label: 'Vérification' },
  { step: 3, label: 'Complet' },
  { step: 4, label: 'Validation' },
  { step: 5, label: 'Inscrit' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function MonInscriptionPage() {
  const [cne, setCne] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StatusResult | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  const handleSearch = async () => {
    if (!cne.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.get('/public/inscription/status', { params: { cne: cne.trim() } });
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Aucun dossier trouvé pour ce CNE.');
    } finally {
      setLoading(false);
    }
  };

  const currentConfig = result ? STATUS_CONFIG[result.inscription_status] : null;
  const currentStep = currentConfig?.step ?? 0;

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">

        {/* ── Hero Header ───────────────────────────────────────────── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0f2863] via-[#1a387e] to-[#09193d] text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=60 height=60 viewBox=0 0 60 60 xmlns=http://www.w3.org/2000/svg%3E%3Cg fill=none fill-rule=evenodd%3E%3Cg fill=%23ffffff opacity=0.04%3E%3Ccircle cx=30 cy=30 r=2/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto px-6 py-14 text-center">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="absolute top-4 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all cursor-pointer"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-blue-200" />}
            </button>

            <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/30 text-amber-300 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest mb-5">
              🎓 ENCG Fès — USMBA
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-3">
              Suivi de mon Dossier d'Inscription
            </h1>
            <p className="text-blue-200 text-sm max-w-xl mx-auto mb-8">
              Entrez votre CNE (Code National Étudiant) pour consulter l'état de traitement de votre dossier en temps réel.
            </p>

            {/* Search box */}
            <div className="flex items-center gap-3 max-w-lg mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={cne}
                  onChange={e => setCne(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Ex: M145092428"
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 font-bold text-sm outline-none focus:ring-2 focus:ring-amber-400 shadow-lg"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 py-3.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-black text-sm rounded-2xl shadow-lg hover:scale-105 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                {loading ? 'Recherche...' : 'Consulter'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Results ──────────────────────────────────────────────── */}
        <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">

          {/* Error */}
          {error && (
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-3xl p-6 flex items-start gap-4">
              <XCircle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-rose-700 dark:text-rose-300 text-sm">Dossier introuvable</p>
                <p className="text-rose-600 dark:text-rose-400 text-xs mt-1">{error}</p>
              </div>
            </div>
          )}

          {result && currentConfig && (
            <>
              {/* Status Card */}
              <div className={`rounded-3xl border p-6 shadow-md ${currentConfig.bg} ${currentConfig.border}`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${currentConfig.bg} border ${currentConfig.border}`}>
                      <span className={currentConfig.color}>{currentConfig.icon}</span>
                    </div>
                    <div>
                      <p className={`text-xs font-black uppercase tracking-widest ${currentConfig.color}`}>Statut actuel</p>
                      <h2 className={`text-xl font-black mt-0.5 ${currentConfig.color}`}>{currentConfig.label}</h2>
                    </div>
                  </div>
                  {result.student_number && (
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">N° Inscription</p>
                      <p className="font-black text-slate-900 dark:text-white font-mono mt-0.5">{result.student_number}</p>
                    </div>
                  )}
                </div>
                <p className={`text-sm mt-4 font-medium ${currentConfig.color}`}>{currentConfig.desc}</p>
              </div>

              {/* Progress Tracker */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-5">Progression du Dossier</h3>
                <div className="flex items-center gap-0">
                  {STEPS.map((s, idx) => (
                    <React.Fragment key={s.step}>
                      <div className="flex flex-col items-center flex-1 min-w-0">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${
                          currentStep >= s.step
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : currentStep === s.step - 1
                            ? 'bg-amber-400 border-amber-400 text-white animate-pulse'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                        }`}>
                          {currentStep > s.step ? '✓' : s.step}
                        </div>
                        <p className={`text-[9px] font-bold mt-1.5 text-center leading-tight ${
                          currentStep >= s.step ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                        }`}>{s.label}</p>
                      </div>
                      {idx < STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1 rounded-full transition-all ${
                          currentStep > s.step ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'
                        }`} />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Student Info Card */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Nom complet', value: result.nom },
                  { label: 'CNE', value: result.cne },
                  { label: 'Filière', value: result.filiere ?? '—' },
                  { label: 'Année Académique', value: result.academic_year },
                  { label: 'Soumis le', value: result.submitted_at ?? '—' },
                  { label: 'Validé le', value: result.validated_at ?? '—' },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Missing Documents */}
              {result.missing_documents.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-3xl p-6 shadow-sm">
                  <h3 className="text-sm font-black text-amber-700 dark:text-amber-300 flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-4 h-4" /> Documents manquants à fournir
                  </h3>
                  <div className="space-y-2">
                    {result.missing_documents.map(docKey => (
                      <div key={docKey} className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                        <div className="w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0" />
                        {DOC_LABELS[docKey] ?? docKey}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-4 font-medium">
                    → Veuillez vous présenter au guichet Scolarité avec les originaux ou soumettre les scans via le portail.
                  </p>
                </div>
              )}

              {/* Download Attestation if inscrit */}
              {(result.inscription_status === 'inscrit' || result.inscription_status === 'reinscrit') && (
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-6 text-white shadow-lg">
                  <h3 className="font-black text-lg mb-1">🎓 Votre inscription est officielle !</h3>
                  <p className="text-emerald-100 text-sm mb-4">
                    Téléchargez votre attestation d'inscription officielle ENCG Fès.
                  </p>
                  <a
                    href={`/api/admin/students/${encodeURIComponent(result.cne)}/attestation-pdf`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 bg-white text-emerald-700 px-5 py-2.5 rounded-xl font-black text-sm hover:bg-emerald-50 transition-all shadow cursor-pointer"
                  >
                    <Download className="w-4 h-4" /> Télécharger l'Attestation PDF
                  </a>
                </div>
              )}
            </>
          )}

          {/* Instructions when empty */}
          {!result && !error && (
            <div className="text-center py-16 text-slate-400">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-sm font-medium">Entrez votre CNE ci-dessus pour consulter votre dossier</p>
              <p className="text-xs mt-2">Le CNE est disponible sur votre relevé de notes du Baccalauréat</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400">
          <p>ENCG Fès — Portail de Suivi d'Inscription | Année Académique 2026-2027</p>
          <p className="mt-1">Pour toute assistance : <strong>scolarite@encg-fes.ac.ma</strong> | Tél : 0535 xx xx xx</p>
        </footer>

        {/* AI ScolarBot Widget (AI Module #4) */}
        <AiScolarBotWidget />
      </div>
    </div>
  );
}

