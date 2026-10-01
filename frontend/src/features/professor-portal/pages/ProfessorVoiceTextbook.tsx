import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  Save, 
  FileText, 
  Loader2, 
  Clock, 
  ShieldCheck,
  RefreshCw,
  Download,
  Award,
  Layers,
  Volume2,
  VolumeX,
  Edit3,
  Trash2,
  Plus,
  Search,
  Printer,
  ChevronDown,
  Zap,
  RotateCcw
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api';
import { openAuthenticatedUrl } from '@shared/lib/documentAccess';
import { CustomSelect, SelectOption } from '@shared/components/ui/CustomSelect';
import { toast } from 'sonner';

interface ModuleItem {
  id: number;
  name: string;
  code?: string;
  filiere?: { name?: string; code?: string };
}

interface StructuredSession {
  title: string;
  pedagogical_objectives: string[];
  notions_covered: string;
  work_assigned: string;
  attendance_summary?: string;
  estimated_progress?: number;
  taxonomy_level?: string;
}

const SPECIMEN_SAMPLE: StructuredSession = {
  title: "Diagnostic Financier & Analyse des Flux de Trésorerie (Modèle OEC)",
  pedagogical_objectives: [
    "Maîtriser la méthodologie de calcul de la Capacité d'Autofinancement (CAF) selon les approches additive et soustractive",
    "Analyser la dynamique de variation du Besoin en Fonds de Roulement (BFR) d'exploitation",
    "Interpréter la trésorerie nette et formuler un diagnostic d'équilibre financier global"
  ],
  notions_covered: "Tableau des Flux de Trésorerie (OEC), Capacité d'Autofinancement, Ratios de liquidité générale et réduite, Matrice de trésorerie prévisionnelle sur étude de cas Souss-Céréales.",
  work_assigned: "Finaliser les cas pratiques 4 et 5 sur tableur Excel et préparer la note de synthèse financière pour la prochaine séance.",
  attendance_summary: "Séance CM (2.0h) • Certifiée conforme système LMD",
  estimated_progress: 8,
  taxonomy_level: "Application, Analyse & Évaluation Managériale"
};

const SAMPLE_TEMPLATES = [
  {
    label: 'Finance / GFC (S6)',
    desc: 'Tableau des Flux & CAF',
    text: "Aujourd'hui, séance de 2 heures consacrée à l'analyse financière approfondie et au tableau des flux de trésorerie selon le modèle de l'Ordre des Experts-Comptables (OEC). Nous avons calculé la Capacité d'Autofinancement (CAF), la variation du BFR d'exploitation et la trésorerie nette sur l'étude de cas Souss-Céréales. Pour la prochaine séance, finaliser les cas pratiques 4 et 5 sur Excel.",
  },
  {
    label: 'Comptabilité IFRS (S4)',
    desc: 'Dépréciations d’Actifs (IAS 36)',
    text: "Séance de Travaux Dirigés sur les tests de dépréciation d'actifs selon la norme IAS 36 et l'évaluation de la juste valeur selon IFRS 13. Application pratique sur les Unités Génératrices de Trésorerie (UGT) et la perte de valeur du goodwill. Devoir assigné : préparer les écritures de reclassement du cas Maroc-Distribution.",
  },
  {
    label: 'Audit & Contrôle (S8)',
    desc: 'COSO 2013 & Matrice Risques',
    text: "Séance de Master sur l'évaluation du contrôle interne et la méthodologie COSO 2013. Construction d'une cartographie des risques opérationnels et élaboration des tests de cheminement. Pour la semaine prochaine, rédiger une note d'orientation d'audit de 3 pages sur le cycle Achats-Fournisseurs.",
  }
];

export default function ProfessorVoiceTextbook() {
  const queryClient = useQueryClient();

  // ── Recording & Speech State ──
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [selectedLang, setSelectedLang] = useState<'fr-FR' | 'ar-MA' | 'en-US'>('fr-FR');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // ── Session Configuration State ──
  const [selectedModule, setSelectedModule] = useState<string>('1');
  const [sessionDuration, setSessionDuration] = useState<string>('2.0');
  const [sessionType, setSessionType] = useState<string>('CM');
  const [sessionDate, setSessionDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // ── AI Structured Data & In-Place Editing ──
  const [structuredData, setStructuredData] = useState<StructuredSession | null>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [isEditingDraft, setIsEditingDraft] = useState(false);

  // ── History Filter ──
  const [historySearch, setHistorySearch] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState('ALL');
  const [expandedSessionId, setExpandedSessionId] = useState<number | null>(null);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  // ── Timer Effect ──
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // ── Web Speech API Initialization ──
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLang;

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscription(prev => prev ? `${prev} ${currentTranscript}` : currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, [selectedLang]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast.error('Reconnaissance vocale non disponible sur ce navigateur. Vous pouvez saisir votre texte manuellement.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      toast.info('🎙️ Enregistrement vocal arrêté.');
    } else {
      setTranscription('');
      setStructuredData(null);
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        toast.success(`🎙️ Dictée vocale active (${selectedLang === 'ar-MA' ? 'العربية / الدارجة' : 'Français'}). Parlez naturellement.`);
      } catch (err) {
        console.error(err);
        toast.error('Impossible d’accéder au microphone.');
      }
    }
  };

  // ── Text-to-Speech Synthesis ──
  const handleToggleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      toast.error('Synthèse vocale non prise en charge.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      if (!structuredData) return;
      const textToRead = `${structuredData.title}. Objectifs traités : ${structuredData.pedagogical_objectives.join('. ')}. Notions : ${structuredData.notions_covered}. Travail à faire : ${structuredData.work_assigned}.`;
      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = 'fr-FR';
      utterance.rate = 1.05;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
      toast.info('🔊 Lecture audio de la fiche pédagogique en cours...');
    }
  };

  // ── Load Sample Demo ──
  const handleLoadDemo = () => {
    setTranscription(SAMPLE_TEMPLATES[0].text);
    setStructuredData(SPECIMEN_SAMPLE);
    toast.success('✨ Modèle type académique chargé ! Vous pouvez éditer, écouter ou consigner la séance.');
  };

  // ── Query Professor's Modules ──
  const { data: modules = [] } = useQuery<ModuleItem[]>({
    queryKey: ['professor-modules-textbook'],
    queryFn: async () => {
      try {
        const res = await api.get('/professor/modules');
        return res.data?.data || [];
      } catch {
        return [];
      }
    }
  });

  const defaultModules: ModuleItem[] = [
    { id: 1, name: 'Diagnostic Financier & Analyse de la Valeur', code: 'M-GFC-601', filiere: { name: 'S6 GFC', code: 'GFC' } },
    { id: 2, name: 'Comptabilité Approfondie & Normes IFRS', code: 'M-GES-402', filiere: { name: 'S4 Gestion', code: 'GEST' } },
    { id: 3, name: 'Audit Financier & Contrôle Interne', code: 'M-ACG-803', filiere: { name: 'S8 Master ACG', code: 'ACG' } },
  ];
  const modulesList = modules.length > 0 ? modules : defaultModules;

  // Set default selected module if not yet set
  useEffect(() => {
    if (modulesList.length > 0 && !selectedModule) {
      setSelectedModule(String(modulesList[0].id));
    }
  }, [modulesList, selectedModule]);

  // ── Query Textbook Logged Sessions ──
  const { data: textbookData } = useQuery({
    queryKey: ['professor-textbook-entries', selectedModule],
    queryFn: async () => {
      try {
        const res = await api.get('/professor-portal/textbook', {
          params: { module_id: selectedModule }
        });
        return res.data?.data || { entries: [], modules_summary: [] };
      } catch {
        return { entries: [], modules_summary: [] };
      }
    }
  });

  const entries = textbookData?.entries || [];
  const currentSummary = textbookData?.modules_summary?.find((m: any) => String(m.module_id) === String(selectedModule)) || {
    logged_hours: entries.reduce((acc: number, item: any) => acc + Number(item.session_duration_hours || 2), 0),
    target_hours: 36,
    progress_percentage: Math.min(100, Math.round((entries.length * 2 / 36) * 100)),
    validated_count: entries.filter((e: any) => e.status === 'validated').length,
    sessions_count: entries.length,
  };

  const activeModuleItem = modulesList.find(m => String(m.id) === String(selectedModule)) || modulesList[0];

  // ── Structure with AI (Gemini 1.5) ──
  const handleStructureWithAi = async () => {
    if (!transcription.trim()) {
      toast.error('Veuillez dicter ou saisir le contenu de votre séance.');
      return;
    }

    setIsAiProcessing(true);
    const toastId = toast.loading('Intelligence Artificielle ENCG (Gemini) en cours d’analyse et structuration...');

    try {
      const res = await api.post('/v1/professor/copilot/voice-textbook', {
        transcription: transcription.trim(),
        module_id: selectedModule ? Number(selectedModule) : undefined,
        session_type: sessionType,
        session_duration: Number(sessionDuration),
      });

      const structured = res.data?.data;
      if (structured) {
        setStructuredData({
          title: structured.title || 'Séance d’Enseignement',
          pedagogical_objectives: Array.isArray(structured.pedagogical_objectives)
            ? structured.pedagogical_objectives
            : [String(structured.pedagogical_objectives)],
          notions_covered: structured.notions_covered || transcription,
          work_assigned: structured.work_assigned || 'Révision du chapitre.',
          attendance_summary: `Séance ${sessionType} (${sessionDuration}h) • Structurée par IA`,
          estimated_progress: structured.estimated_syllabus_progress || 8,
          taxonomy_level: 'Application & Analyse Managériale',
        });
        toast.success('✨ Fiche pédagogique structurée avec succès !', { id: toastId });
      } else {
        throw new Error('Réponse invalide');
      }
    } catch {
      toast.error('Structuration locale de secours appliquée.', { id: toastId });
      setStructuredData({
        title: `Séance : ${transcription.slice(0, 52)}...`,
        pedagogical_objectives: [
          'Acquisition et maîtrise des concepts fondamentaux de la séance',
          'Application pratique sur des études de cas managériales',
          'Consolidation des compétences professionnelles selon la norme LMD',
        ],
        notions_covered: transcription,
        work_assigned: 'Exercices d’application et révision du syllabus pour le prochain cours.',
        attendance_summary: `Séance ${sessionType} enregistrée`,
        estimated_progress: 8,
        taxonomy_level: 'Compréhension & Application',
      });
    } finally {
      setIsAiProcessing(false);
    }
  };

  // ── Save Session Mutation ──
  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await api.post('/professor-portal/textbook', payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success('💾 Séance certifiée et consignée avec succès pour le Service Fait !');
      queryClient.invalidateQueries({ queryKey: ['professor-textbook-entries'] });
      queryClient.invalidateQueries({ queryKey: ['professor-workload'] });
      setStructuredData(null);
      setTranscription('');
      setIsEditingDraft(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Erreur lors de l’enregistrement de la séance.');
    }
  });

  const handleSaveToTextbook = () => {
    if (!structuredData) return;

    const payload = {
      module_id: Number(selectedModule),
      session_date: sessionDate,
      session_duration_hours: Number(sessionDuration),
      session_type: sessionType,
      chapter_title: structuredData.title,
      key_concepts: structuredData.notions_covered,
      pedagogical_goals: Array.isArray(structuredData.pedagogical_objectives) 
        ? structuredData.pedagogical_objectives.join('; ') 
        : structuredData.pedagogical_objectives,
      homework_assigned: structuredData.work_assigned,
      syllabus_percentage: Math.min(100, (currentSummary.progress_percentage || 0) + (structuredData.estimated_progress || 8)),
    };

    saveMutation.mutate(payload);
  };

  const handleDownloadServiceFait = () => {
    openAuthenticatedUrl(`/api/professor-portal/service-fait/${selectedModule}/pdf`);
    toast.success('📄 Génération de l’Attestation Officielle de Service Fait Pédagogique (PDF)...');
  };

  // ── Print Session Sheet ──
  const handlePrintSessionSheet = () => {
    const dataToPrint = structuredData || SPECIMEN_SAMPLE;
    const currentModName = activeModuleItem?.name || 'Module Universitaire';
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Fiche de Séance Pédagogique — ENCG Fès</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 25px; color: #0f172a; margin: 0; }
          .header { border-bottom: 2px solid #001A4B; padding-bottom: 12px; margin-bottom: 20px; }
          .university { font-size: 11pt; font-weight: bold; color: #001A4B; letter-spacing: 0.5px; }
          .school { font-size: 13pt; font-weight: 900; color: #C5A059; margin-top: 2px; }
          .sub { font-size: 9pt; color: #64748b; font-weight: 600; text-transform: uppercase; margin-top: 3px; }
          .title { font-size: 16pt; font-weight: 900; color: #001A4B; margin-top: 14px; }
          .meta { font-size: 9.5pt; color: #334155; margin-top: 6px; padding: 6px 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; }
          .box { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 14px; margin-bottom: 14px; background: #ffffff; }
          .box-title { font-size: 8.5pt; font-weight: 800; color: #001A4B; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; border-bottom: 1px dashed #e2e8f0; padding-bottom: 4px; }
          ul { margin: 0; padding-left: 20px; font-size: 9.5pt; line-height: 1.5; color: #1e293b; }
          p { margin: 0; font-size: 9.5pt; line-height: 1.5; color: #1e293b; }
          .footer { margin-top: 28px; border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 8pt; color: #64748b; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="university">ROYAUME DU MAROC • UNIVERSITÉ SIDI MOHAMED BEN ABDELLAH</div>
          <div class="school">ÉCOLE NATIONALE DE COMMERCE ET DE GESTION DE FÈS</div>
          <div class="sub">Direction des Affaires Pédagogiques • Cahier de Texte Numérique LMD</div>
          <div class="title">${dataToPrint.title}</div>
          <div class="meta">
            Module : <strong>${currentModName}</strong> &nbsp;|&nbsp;
            Séance : <strong>${sessionType}</strong> &nbsp;|&nbsp;
            Durée : <strong>${sessionDuration}h</strong> &nbsp;|&nbsp;
            Date : <strong>${sessionDate}</strong>
          </div>
        </div>

        <div class="box">
          <div class="box-title">Objectifs Pédagogiques Spécifiques (Taxonomie de Bloom)</div>
          <ul>${dataToPrint.pedagogical_objectives.map(o => `<li>${o}</li>`).join('')}</ul>
        </div>

        <div class="box">
          <div class="box-title">Notions Théoriques, Outils &amp; Formules Clés</div>
          <p>${dataToPrint.notions_covered}</p>
        </div>

        <div class="box">
          <div class="box-title">Travail à Faire / Exercices d'Application</div>
          <p>${dataToPrint.work_assigned}</p>
        </div>

        <div class="footer">
          <span>Document certifié ENCG Fès • Généré le ${new Date().toLocaleDateString('fr-FR')}</span>
          <span>Système LMD Conforme • Service Fait Enseignant</span>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  // ── Filtered History Entries ──
  const filteredEntries = useMemo(() => {
    return entries.filter((e: any) => {
      if (historyTypeFilter !== 'ALL' && e.session_type?.toUpperCase() !== historyTypeFilter) {
        return false;
      }
      if (historySearch) {
        const q = historySearch.toLowerCase();
        const titleMatch = e.chapter_title?.toLowerCase().includes(q);
        const conceptsMatch = e.key_concepts?.toLowerCase().includes(q);
        return titleMatch || conceptsMatch;
      }
      return true;
    });
  }, [entries, historyTypeFilter, historySearch]);

  const moduleSelectOptions: SelectOption[] = modulesList.map(m => ({
    value: String(m.id),
    label: m.name,
    badge: m.filiere?.code || m.code || 'ENCG',
    icon: <BookOpen className="w-3.5 h-3.5 text-blue-500" />
  }));

  const sessionTypeOptions: SelectOption[] = [
    { value: 'CM', label: 'CM (Cours Magistral)', badge: 'AMPHI', icon: <Sparkles className="w-3.5 h-3.5 text-amber-500" /> },
    { value: 'TD', label: 'TD (Travaux Dirigés)', badge: 'SALLE', icon: <BookOpen className="w-3.5 h-3.5 text-blue-500" /> },
    { value: 'TP', label: 'TP (Travaux Pratiques)', badge: 'LABO', icon: <Layers className="w-3.5 h-3.5 text-emerald-500" /> },
  ];

  const durationOptions: SelectOption[] = [
    { value: '1.5', label: '1h30 (Séance courte)', badge: '1.5H', icon: <Clock className="w-3.5 h-3.5 text-sky-500" /> },
    { value: '2.0', label: '2 heures (Standard ENCG)', badge: '2.0H', icon: <Clock className="w-3.5 h-3.5 text-indigo-500" /> },
    { value: '3.0', label: '3 heures (Séance double)', badge: '3.0H', icon: <Clock className="w-3.5 h-3.5 text-purple-500" /> },
    { value: '4.0', label: '4 heures (Séminaire)', badge: '4.0H', icon: <Clock className="w-3.5 h-3.5 text-rose-500" /> },
  ];

  return (
    <div className="max-w-[1720px] mx-auto p-3 sm:p-5 md:p-6 space-y-5 font-sans animate-in fade-in duration-300 text-slate-900 dark:text-slate-100 pb-20">
      
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── UNIFIED EXECUTIVE COCKPIT HEADER (~110px) ──────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#000E29] via-[#001A4B] to-[#0A2558] rounded-2xl md:rounded-3xl p-4 sm:p-5 text-white shadow-xl border border-indigo-900/50">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3.5">
          {/* Top Row: Title, Module Badge & Action Buttons */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-rose-500 via-purple-600 to-indigo-600 p-0.5 shadow-lg shadow-rose-500/20 shrink-0">
                <div className="w-full h-full bg-slate-950/80 rounded-[0.9rem] backdrop-blur-xl flex items-center justify-center text-white">
                  <Mic className="w-5 h-5 md:w-6 md:h-6 text-amber-300" />
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-indigo-500/25 text-indigo-200 border border-indigo-400/30 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" /> IA Vocale Synchrone • Gemini 1.5 Pro
                  </span>
                  <span className="hidden sm:inline-block text-[11px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md">
                    {activeModuleItem?.code || 'ENCG-MOD'}
                  </span>
                </div>
                <h1 className="text-lg md:text-2xl font-black text-white tracking-tight leading-tight mt-0.5">
                  Cahier de Texte Numérique &amp; Copilot Vocal
                </h1>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto shrink-0">
              <button
                onClick={handleLoadDemo}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-xl text-xs font-bold tracking-wide flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                title="Charger un exemple complet pour tester instantanément"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>Démo 1-Clic</span>
              </button>

              <button
                onClick={handleDownloadServiceFait}
                className="px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-[#001A4B] rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-400/20 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Attestation Service Fait (PDF)</span>
              </button>
            </div>
          </div>

          {/* Bottom Integrated Metrics Ribbon */}
          <div className="pt-2.5 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 font-bold text-slate-200">
                <BookOpen className="w-3.5 h-3.5 text-indigo-300" />
                <span className="text-white font-black truncate max-w-[280px] sm:max-w-md">
                  {activeModuleItem?.name}
                </span>
                {activeModuleItem?.filiere?.code && (
                  <span className="text-[10px] bg-indigo-900/60 text-indigo-300 px-1.5 py-0.5 rounded font-mono">
                    {activeModuleItem.filiere.code}
                  </span>
                )}
              </div>
            </div>

            {/* Compact Progress Bar & Badges */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-xl">
                <span className="text-[11px] font-bold text-indigo-200">
                  Volume : <strong className="text-white font-mono">{currentSummary.logged_hours || 0}h</strong> / {currentSummary.target_hours || 36}h
                </span>
                <div className="w-24 bg-white/20 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(4, Math.min(100, currentSummary.progress_percentage || 0))}%` }}
                  />
                </div>
                <span className="font-mono text-[11px] font-black text-amber-300">
                  {currentSummary.progress_percentage || 0}%
                </span>
              </div>

              <div className="hidden sm:flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-2.5 py-1 rounded-xl text-[11px] font-black">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{currentSummary.validated_count || 0} / {currentSummary.sessions_count || 0} Visées</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── MAIN TWO-COLUMN STUDIO WORKSPACE ───────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ────────────────────────────────────────────────────────────────── */}
        {/* ── LEFT COLUMN (5 Cols): STUDIO VOCAL & PARAMÈTRES ─────────────── */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-6 xl:col-span-5 bg-card border border-border rounded-2xl md:rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
          
          {/* Card Header & Compact Settings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-foreground uppercase tracking-wide">
                    Paramètres &amp; Console Vocale
                  </h2>
                  <span className="text-[10px] text-muted-foreground font-medium">Séance conforme LMD (ENCG Fès)</span>
                </div>
              </div>

              <input
                type="date"
                value={sessionDate}
                onChange={e => setSessionDate(e.target.value)}
                className="bg-background border border-input rounded-xl px-2.5 py-1 text-xs font-bold text-foreground focus:outline-none shadow-2xs"
              />
            </div>

            {/* Module Selector */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-black uppercase text-muted-foreground">
                <span>Élément de Module Dispensé</span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold lowercase">
                  ({modulesList.length} modules assignés)
                </span>
              </div>
              <CustomSelect
                value={selectedModule}
                onChange={v => setSelectedModule(String(v))}
                options={moduleSelectOptions}
                className="w-full"
              />
            </div>

            {/* Type & Duration Inline Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-muted-foreground">
                  Type de Séance
                </label>
                <CustomSelect
                  value={sessionType}
                  onChange={v => setSessionType(String(v))}
                  options={sessionTypeOptions}
                  className="w-full"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-muted-foreground">
                  Durée de la Séance
                </label>
                <CustomSelect
                  value={sessionDuration}
                  onChange={v => setSessionDuration(String(v))}
                  options={durationOptions}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Voice Dictation Area */}
          <div className="space-y-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-rose-500" />
                  <span>Dictée Vocale</span>
                </span>
                {isRecording && (
                  <span className="font-mono text-xs font-black text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950 border border-rose-200 animate-pulse">
                    {String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:{String(recordingSeconds % 60).padStart(2, '0')}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Language Selector */}
                <select
                  value={selectedLang}
                  onChange={e => setSelectedLang(e.target.value as any)}
                  className="bg-background border border-input rounded-xl px-2 py-1 text-[11px] font-bold text-foreground focus:outline-none"
                  title="Choisir la langue de reconnaissance vocale"
                >
                  <option value="fr-FR">🇫🇷 Français</option>
                  <option value="ar-MA">🇲🇦 الدارجة / العربية</option>
                  <option value="en-US">🇬🇧 English</option>
                </select>

                {transcription && (
                  <button
                    onClick={() => setTranscription('')}
                    className="text-[11px] font-bold text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                    title="Effacer la transcription"
                  >
                    <RotateCcw className="w-3 h-3" /> Effacer
                  </button>
                )}
              </div>
            </div>

            {/* Dictation Box with Live Audio Visualizer */}
            <div className={cn(
              "relative border-2 rounded-2xl p-3.5 transition-all duration-300 min-h-[145px] flex flex-col justify-between",
              isRecording 
                ? "border-rose-500 bg-rose-500/5 ring-4 ring-rose-500/10 shadow-md shadow-rose-500/10" 
                : "border-dashed border-border bg-muted/30 focus-within:border-primary/50 focus-within:bg-background"
            )}>
              <textarea
                value={transcription}
                onChange={e => setTranscription(e.target.value)}
                placeholder="Appuyez sur le micro et dictez : 'Aujourd'hui nous avons traité le chapitre 4 sur l'analyse des flux de trésorerie...'"
                className="w-full h-24 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none resize-none leading-relaxed font-medium"
              />

              {/* Bottom Visualizer Wave & Counter */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center gap-1.5">
                  {isRecording ? (
                    <div className="flex items-center gap-1 h-5">
                      <span className="w-1 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.3s] h-3.5" />
                      <span className="w-1 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s] h-5" />
                      <span className="w-1 bg-purple-500 rounded-full animate-bounce h-4" />
                      <span className="w-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.2s] h-2.5" />
                      <span className="w-1 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.4s] h-5" />
                      <span className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 ml-2">
                        Enregistrement en direct...
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {transcription ? `${transcription.split(/\s+/).filter(Boolean).length} mots saisis` : 'Prêt pour la dictée ou la saisie directe'}
                    </span>
                  )}
                </div>

                <span className="text-[10px] font-mono text-muted-foreground">
                  {selectedLang === 'ar-MA' ? 'Arabe / Darija' : 'Français Académique'}
                </span>
              </div>
            </div>

            {/* Quick Template Chips */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                Exemples Rapides de Cours (1-Clic) :
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SAMPLE_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setTranscription(tmpl.text);
                      toast.info(`Exemple « ${tmpl.label} » inséré.`);
                    }}
                    className="p-2 rounded-xl bg-muted/60 hover:bg-muted text-left border border-border/80 transition-all cursor-pointer group"
                  >
                    <span className="text-[11px] font-black text-foreground group-hover:text-primary block truncate">
                      {tmpl.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground block truncate">
                      {tmpl.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Trigger Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <button
                onClick={toggleRecording}
                className={cn(
                  "flex-1 min-w-[170px] py-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer active:scale-95",
                  isRecording 
                    ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse shadow-rose-900/30" 
                    : "bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white border border-slate-700"
                )}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-amber-300" />}
                <span>{isRecording ? "Arrêter la Dictée" : "Démarrer la Dictée Vocale"}</span>
              </button>

              <button
                onClick={handleStructureWithAi}
                disabled={isAiProcessing || !transcription.trim()}
                className="flex-1 min-w-[170px] py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:opacity-95 disabled:opacity-40 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                {isAiProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-300" />
                )}
                <span>{isAiProcessing ? "Analyse IA..." : "Structurer avec l'IA"}</span>
              </button>
            </div>

          </div>

        </div>

        {/* ────────────────────────────────────────────────────────────────── */}
        {/* ── RIGHT COLUMN (7 Cols): FICHE PÉDAGOGIQUE OFFICIELLE ─────────── */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-6 xl:col-span-7 bg-card border border-border rounded-2xl md:rounded-3xl p-4 sm:p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            
            {/* Header & Quick Status */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-black text-foreground uppercase tracking-wide">
                      Fiche Pédagogique Officielle
                    </h2>
                    {structuredData ? (
                      <span className="text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        Prête à Consigner
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        Modèle Spécimen LMD
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium">Norme LMD ENCG Fès • Direction des Affaires Pédagogiques</span>
                </div>
              </div>

              {/* Toolbar when data exists */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleToggleSpeak}
                  className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 cursor-pointer transition-colors"
                  title={isSpeaking ? "Arrêter la lecture" : "Écouter la synthèse vocale"}
                >
                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5 animate-pulse text-rose-500" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={handlePrintSessionSheet}
                  className="p-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground border border-border cursor-pointer transition-colors"
                  title="Imprimer la Fiche de Séance (A4)"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>

                {structuredData && (
                  <button
                    onClick={() => setIsEditingDraft(!isEditingDraft)}
                    className={cn(
                      "px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border cursor-pointer transition-colors",
                      isEditingDraft ? "bg-amber-500 text-slate-950 border-amber-600 font-black" : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Edit3 className="w-3 h-3" />
                    <span className="text-[11px]">{isEditingDraft ? 'Terminer' : 'Éditer'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* ── IF DATA IS STRUCTURED: DISPLAY REAL INTERACTIVE FORM ── */}
            {structuredData ? (
              <div className="space-y-3 animate-in fade-in text-xs">
                
                {/* Session Title */}
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1">
                  <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                    Intitulé Officiel de la Séance
                  </span>
                  {isEditingDraft ? (
                    <input
                      type="text"
                      value={structuredData.title}
                      onChange={e => setStructuredData({ ...structuredData, title: e.target.value })}
                      className="w-full bg-background border border-input rounded-xl p-2 text-xs font-black text-foreground focus:outline-none"
                    />
                  ) : (
                    <div className="font-black text-sm text-foreground">{structuredData.title}</div>
                  )}
                </div>

                {/* Pedagogical Objectives */}
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                      Objectifs Pédagogiques Traités (Taxonomie de Bloom)
                    </span>
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      LMD Conforme
                    </span>
                  </div>
                  
                  {isEditingDraft ? (
                    <div className="space-y-2">
                      {structuredData.pedagogical_objectives.map((obj, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={obj}
                            onChange={e => {
                              const updated = [...structuredData.pedagogical_objectives];
                              updated[i] = e.target.value;
                              setStructuredData({ ...structuredData, pedagogical_objectives: updated });
                            }}
                            className="flex-1 bg-background border border-input rounded-xl p-2 text-xs font-medium text-foreground"
                          />
                          <button
                            onClick={() => {
                              const updated = structuredData.pedagogical_objectives.filter((_, idx) => idx !== i);
                              setStructuredData({ ...structuredData, pedagogical_objectives: updated });
                            }}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          setStructuredData({
                            ...structuredData,
                            pedagogical_objectives: [...structuredData.pedagogical_objectives, 'Nouvel objectif pédagogique']
                          });
                        }}
                        className="text-[11px] font-bold text-indigo-600 flex items-center gap-1 hover:underline pt-1"
                      >
                        <Plus className="w-3 h-3" /> Ajouter un objectif
                      </button>
                    </div>
                  ) : (
                    <ul className="space-y-1 list-disc list-inside text-foreground font-medium text-[11px] leading-relaxed">
                      {structuredData.pedagogical_objectives.map((obj: string, i: number) => (
                        <li key={i}>{obj}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Concepts & Formulas */}
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border space-y-1">
                  <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                    Notions Théoriques, Outils &amp; Formules Clés
                  </span>
                  {isEditingDraft ? (
                    <textarea
                      value={structuredData.notions_covered}
                      onChange={e => setStructuredData({ ...structuredData, notions_covered: e.target.value })}
                      className="w-full bg-background border border-input rounded-xl p-2 text-xs font-medium text-foreground h-16"
                    />
                  ) : (
                    <p className="text-foreground font-medium text-[11px] leading-relaxed">{structuredData.notions_covered}</p>
                  )}
                </div>

                {/* Assigned Homework */}
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
                  <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 tracking-wider">
                    Travail à Faire / Exercices Assignés
                  </span>
                  {isEditingDraft ? (
                    <input
                      type="text"
                      value={structuredData.work_assigned}
                      onChange={e => setStructuredData({ ...structuredData, work_assigned: e.target.value })}
                      className="w-full bg-background border border-input rounded-xl p-2 text-xs font-bold text-foreground"
                    />
                  ) : (
                    <p className="text-foreground font-bold text-[11px]">{structuredData.work_assigned}</p>
                  )}
                </div>

                {/* Progress Contribution Badge */}
                <div className="flex items-center justify-between px-3 py-2 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-800 dark:text-emerald-300">
                  <span className="font-bold flex items-center gap-1.5 text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Progression Syllabus Estimée
                  </span>
                  <span className="font-mono font-black text-xs">
                    +{structuredData.estimated_progress || 8}%
                  </span>
                </div>

              </div>
            ) : (
              /* ── RICH HIGH-FIDELITY SPECIMEN PREVIEW (NEVER AN EMPTY VOID!) ── */
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/40 dark:from-slate-900/60 dark:to-indigo-950/20 border border-dashed border-indigo-300 dark:border-indigo-800/60 space-y-3.5">
                
                {/* Specimen Header Ribbon */}
                <div className="flex items-center justify-between pb-2 border-b border-indigo-100 dark:border-indigo-900/40">
                  <div className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span className="text-[10px] font-black uppercase text-indigo-950 dark:text-indigo-200 tracking-wider">
                      Spécimen de Fiche Académique Conforme
                    </span>
                  </div>
                  <span className="text-[9px] font-bold uppercase bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md">
                    Exemple Type
                  </span>
                </div>

                {/* Specimen Preview Body */}
                <div className="space-y-2.5 opacity-90 text-[11px]">
                  <div>
                    <span className="text-[9px] font-black uppercase text-muted-foreground block">
                      Intitulé de Séance :
                    </span>
                    <strong className="text-foreground text-xs font-black">
                      {SPECIMEN_SAMPLE.title}
                    </strong>
                  </div>

                  <div>
                    <span className="text-[9px] font-black uppercase text-muted-foreground block">
                      Objectifs Pédagogiques (Taxonomie de Bloom) :
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-muted-foreground mt-0.5">
                      {SPECIMEN_SAMPLE.pedagogical_objectives.map((obj, idx) => (
                        <li key={idx} className="truncate">{obj}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <span className="text-[9px] font-black uppercase text-muted-foreground block">
                      Notions &amp; Formules :
                    </span>
                    <p className="text-muted-foreground line-clamp-2">
                      {SPECIMEN_SAMPLE.notions_covered}
                    </p>
                  </div>

                  <div>
                    <span className="text-[9px] font-black uppercase text-muted-foreground block">
                      Travail Assigné :
                    </span>
                    <p className="text-muted-foreground font-semibold line-clamp-1">
                      {SPECIMEN_SAMPLE.work_assigned}
                    </p>
                  </div>
                </div>

                {/* Specimen Call to Action */}
                <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between gap-3">
                  <span className="text-[10px] text-muted-foreground font-medium hidden sm:inline">
                    Dictez à gauche ou chargez ce modèle pour le personnaliser
                  </span>
                  <button
                    onClick={handleLoadDemo}
                    className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Charger cet Exemple Type</span>
                  </button>
                </div>

              </div>
            )}

          </div>

          {/* Publication and Print Bar */}
          <div className="pt-3 border-t border-border">
            <button
              onClick={handleSaveToTextbook}
              disabled={!structuredData || saveMutation.isPending}
              className="w-full py-3 bg-gradient-to-r from-[#001A4B] via-[#0A2558] to-[#113A7A] hover:opacity-95 disabled:opacity-40 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
              ) : (
                <Save className="w-4 h-4 text-amber-300" />
              )}
              <span>
                {saveMutation.isPending ? "Consignation en cours..." : "Publier dans le Cahier de Texte & Valider Service Fait"}
              </span>
            </button>
          </div>

        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── HISTORICAL LOG OF LOGGED & VISAED SESSIONS ─────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-card border border-border rounded-2xl md:rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
        
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground">
                Séances Consignées &amp; Visées (Service Fait Pédagogique)
              </h2>
              <p className="text-[11px] text-muted-foreground font-medium">
                Historique officiel transmis au chef de département et à la scolarité pour le décompte des heures
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                placeholder="Rechercher séance..."
                className="pl-8 pr-2.5 py-1 bg-background border border-input rounded-xl text-xs font-bold text-foreground focus:outline-none w-44 shadow-2xs"
              />
            </div>

            {/* Type Filter */}
            <select
              value={historyTypeFilter}
              onChange={e => setHistoryTypeFilter(e.target.value)}
              className="bg-background border border-input rounded-xl px-2.5 py-1 text-xs font-bold text-foreground focus:outline-none shadow-2xs"
            >
              <option value="ALL">Tous types</option>
              <option value="CM">CM (Cours)</option>
              <option value="TD">TD</option>
              <option value="TP">TP</option>
            </select>

            <span className="text-xs font-bold text-muted-foreground px-1">
              {filteredEntries.length} séance(s)
            </span>
          </div>
        </div>

        {/* Sessions List */}
        {filteredEntries.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
              <BookOpen className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-foreground">Aucune séance consignée pour ce filtre</p>
            <p className="text-[11px] text-muted-foreground">
              Utilisez la console vocale ci-dessus pour dicter votre séance ou cliquez sur <strong>Démo 1-Clic</strong> pour tester l'enregistrement.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredEntries.map((session: any) => {
              const isExpanded = expandedSessionId === session.id;

              return (
                <div
                  key={session.id}
                  className="bg-muted/30 border border-border/80 hover:border-primary/40 rounded-xl p-3.5 transition-all duration-200 space-y-2.5"
                >
                  <div 
                    onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-background border border-border flex flex-col items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase leading-none">
                          {new Date(session.session_date).toLocaleDateString('fr-FR', { month: 'short' })}
                        </span>
                        <span className="font-mono text-xs font-black text-foreground leading-none mt-0.5">
                          {new Date(session.session_date).getDate()}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded-md text-[9px] font-black uppercase",
                            session.session_type === 'CM' 
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                              : session.session_type === 'TD'
                              ? "bg-sky-500/15 text-sky-700 dark:text-sky-300"
                              : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          )}>
                            {session.session_type}
                          </span>
                          <h4 className="text-xs font-black text-foreground hover:text-primary transition-colors">
                            {session.chapter_title}
                          </h4>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {session.session_duration_hours}h dispensées • Syllabus cumulé : {session.syllabus_percentage || 25}%
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-auto">
                      {session.status === 'validated' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Visée par Chef Dept</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          <Clock className="w-3 h-3 text-amber-600" />
                          <span>En attente de visa</span>
                        </span>
                      )}

                      <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", isExpanded && "rotate-180")} />
                    </div>
                  </div>

                  {/* Expanded Pedagogical Details Drawer */}
                  {isExpanded && (
                    <div className="pt-2.5 border-t border-border grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px] animate-in fade-in">
                      <div className="p-2.5 bg-background rounded-xl border border-border">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">
                          Objectifs Pédagogiques
                        </span>
                        <p className="text-foreground font-medium">
                          {session.pedagogical_goals || 'Objectifs standard du module consolidés.'}
                        </p>
                      </div>

                      <div className="p-2.5 bg-background rounded-xl border border-border">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">
                          Notions &amp; Formules Clés
                        </span>
                        <p className="text-foreground font-medium">
                          {session.key_concepts || 'Concepts conceptuels et théoriques de la séance.'}
                        </p>
                      </div>

                      <div className="p-2.5 bg-background rounded-xl border border-border">
                        <span className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">
                          Travail Assigné aux Étudiants
                        </span>
                        <p className="text-foreground font-medium">
                          {session.homework_assigned || 'Aucun travail particulier assigné.'}
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}
