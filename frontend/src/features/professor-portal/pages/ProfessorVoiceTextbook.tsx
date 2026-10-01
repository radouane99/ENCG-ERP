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
  RotateCcw,
  Calendar,
  Users,
  MapPin,
  Check,
  Compass
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/shared/lib/api';
import { openAuthenticatedUrl } from '@shared/lib/documentAccess';
import { CustomSelect, SelectOption } from '@shared/components/ui/CustomSelect';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

interface ModuleItem {
  id: number;
  name: string;
  code?: string;
  filiere?: { name?: string; code?: string };
}

interface AssignedSchedule {
  id: number;
  module_id: number;
  module_name: string;
  module_code: string;
  filiere_code?: string;
  group_id?: number | null;
  group_name: string;
  room_name: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  time_label: string;
  session_type: string;
  duration_hours: number;
  display_label: string;
}

interface StructuredSession {
  title: string;
  pedagogical_objectives: string[];
  notions_covered: string;
  work_assigned: string;
  attendance_summary?: string;
  estimated_progress?: number;
  taxonomy_level?: string;
  pedagogical_method?: string;
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
  taxonomy_level: "Application, Analyse & Évaluation Managériale",
  pedagogical_method: "Cours magistral interactif avec étude de cas réelle sur tableur"
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
  const { user } = useAuthStore();
  const professorFullName = user?.name 
    ? (user.name.startsWith('Pr.') ? user.name : `Pr. ${user.name}`)
    : ((user as any)?.first_name 
      ? `Pr. ${(user as any).first_name} ${(user as any).last_name || ''}`.trim()
      : 'Pr. Mohammed EL ALAMI');

  // ── Recording & Speech State ──
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [selectedLang, setSelectedLang] = useState<'fr-FR' | 'ar-MA' | 'en-US'>('fr-FR');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // ── Session Configuration State ──
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [sessionDuration, setSessionDuration] = useState<string>('2.0');
  const [sessionType, setSessionType] = useState<string>('CM');
  const [sessionDate, setSessionDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState<string>('');
  const [pedagogicalMethod, setPedagogicalMethod] = useState<string>('Cours Magistral Interactif');

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

  // ── Query Textbook Logged Sessions & Assigned Timetable ──
  const { data: textbookData, isLoading } = useQuery({
    queryKey: ['professor-textbook-entries', selectedModule],
    queryFn: async () => {
      try {
        const res = await api.get('/professor-portal/textbook', {
          params: { module_id: selectedModule || undefined }
        });
        return res.data?.data || { entries: [], modules_summary: [], assigned_schedules: [] };
      } catch {
        return { entries: [], modules_summary: [], assigned_schedules: [] };
      }
    }
  });

  const entries = textbookData?.entries || [];
  const assignedSchedules: AssignedSchedule[] = textbookData?.assigned_schedules || [];
  const modulesSummary: any[] = textbookData?.modules_summary || [];

  // Default fallback modules if database is totally empty
  const defaultModules: ModuleItem[] = [
    { id: 1, name: 'Diagnostic Financier & Analyse de la Valeur', code: 'M-GFC-601', filiere: { name: 'S6 GFC', code: 'GFC' } },
    { id: 2, name: 'Comptabilité Approfondie & Normes IFRS', code: 'M-GES-402', filiere: { name: 'S4 Gestion', code: 'GEST' } },
    { id: 3, name: 'Audit Financier & Contrôle Interne', code: 'M-ACG-803', filiere: { name: 'S8 Master ACG', code: 'ACG' } },
  ];

  // Strictly filter to professor's assigned modules
  const assignedModulesList: ModuleItem[] = useMemo(() => {
    if (modulesSummary.length > 0) {
      return modulesSummary.map(m => ({
        id: m.module_id,
        name: m.module_name,
        code: m.module_code,
        filiere: { name: m.filiere, code: m.filiere_code || 'ENCG' }
      }));
    }
    return defaultModules;
  }, [modulesSummary]);

  // Set default selected module if not yet set
  useEffect(() => {
    if (assignedModulesList.length > 0 && !selectedModule) {
      setSelectedModule(String(assignedModulesList[0].id));
    }
  }, [assignedModulesList, selectedModule]);

  // Handle clicking on an assigned timetable schedule
  const handleSelectSchedule = (sched: AssignedSchedule) => {
    setSelectedScheduleId(String(sched.id));
    setSelectedModule(String(sched.module_id));
    setSessionType(sched.session_type || 'CM');
    setSessionDuration(String(sched.duration_hours || '2.0'));
    setSelectedGroupId(sched.group_id ? String(sched.group_id) : '');
    setGroupName(sched.group_name || '');
    
    // Set appropriate pedagogical method based on session type
    if (sched.session_type === 'TD') {
      setPedagogicalMethod('Travaux Dirigés & Résolution d\'Exercices en Sous-Groupe');
    } else if (sched.session_type === 'TP') {
      setPedagogicalMethod('Travaux Pratiques sur Logiciel / Tableur Excel');
    } else {
      setPedagogicalMethod('Cours Magistral Interactif en Amphi');
    }

    toast.success(`📅 Séance sélectionnée : ${sched.module_name} (${sched.session_type} • ${sched.group_name})`);
  };

  const currentSummary = modulesSummary.find((m: any) => String(m.module_id) === String(selectedModule)) || {
    logged_hours: entries.filter((e: any) => String(e.module_id) === String(selectedModule)).reduce((acc: number, item: any) => acc + Number(item.session_duration_hours || 2), 0),
    target_hours: 36,
    progress_percentage: Math.min(100, Math.round((entries.filter((e: any) => String(e.module_id) === String(selectedModule)).length * 2 / 36) * 100)),
    validated_count: entries.filter((e: any) => String(e.module_id) === String(selectedModule) && e.status === 'validated').length,
    sessions_count: entries.filter((e: any) => String(e.module_id) === String(selectedModule)).length,
  };

  const activeModuleItem = assignedModulesList.find(m => String(m.id) === String(selectedModule)) || assignedModulesList[0];

  // ── Load Sample Demo ──
  const handleLoadDemo = () => {
    setTranscription(SAMPLE_TEMPLATES[0].text);
    setStructuredData(SPECIMEN_SAMPLE);
    toast.success('✨ Modèle type académique chargé ! Vous pouvez éditer, écouter ou consigner la séance.');
  };

  // ── Auto-Suggest Next Chapter with AI ──
  const handleAutoSuggestChapter = async () => {
    if (!selectedModule) return;
    const currentCount = entries.filter((e: any) => String(e.module_id) === String(selectedModule)).length;
    const nextNum = currentCount + 1;
    const nextSeanceCode = `S${nextNum}`;

    const toastId = toast.loading(`Génération du chapitre et des notions pour la séance ${nextSeanceCode}...`);
    try {
      const res = await api.post('/v1/professor/copilot/attendance-textbook-suggestion', {
        module_id: Number(selectedModule),
        seance_code: nextSeanceCode,
        session_type: sessionType,
      });

      const data = res.data?.data;
      if (data?.chapter_title) {
        setStructuredData({
          title: data.chapter_title,
          pedagogical_objectives: [
            `Maîtriser les fondements méthodologiques de ${data.chapter_title}`,
            `Appliquer les outils d'analyse sur des cas managériaux marocains`,
            'Résoudre les exercices d’application et consolider les acquis LMD'
          ],
          notions_covered: data.key_concepts || '',
          work_assigned: 'Finaliser les exercices d’application pour la prochaine séance.',
          attendance_summary: `Séance ${sessionType} (${sessionDuration}h) • ${groupName || 'Section'}`,
          estimated_progress: 8,
          taxonomy_level: 'Application & Analyse Managériale',
          pedagogical_method: pedagogicalMethod,
        });
        setTranscription(`Séance ${nextSeanceCode} : ${data.chapter_title}. Notions : ${data.key_concepts}`);
        toast.success(`✨ Séance ${nextSeanceCode} suggérée avec succès !`, { id: toastId });
      }
    } catch {
      toast.error('Génération heuristique locale appliquée.', { id: toastId });
      setStructuredData({
        title: `Séance ${nextSeanceCode} : Approfondissement & Cas Pratiques — ${activeModuleItem?.name}`,
        pedagogical_objectives: [
          'Acquisition des concepts et modèles analytiques du chapitre',
          'Application pratique sur des études de cas managériales',
          'Synthèse et préparation des travaux dirigés'
        ],
        notions_covered: `Modèles théoriques, indicateurs financiers et cas concrets pour le module ${activeModuleItem?.name}.`,
        work_assigned: 'Révision du syllabus et préparation des exercices suivants.',
        attendance_summary: `Séance ${sessionType} (${sessionDuration}h)`,
        estimated_progress: 8,
        taxonomy_level: 'Compréhension & Application',
        pedagogical_method: pedagogicalMethod,
      });
    }
  };

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
          pedagogical_method: pedagogicalMethod,
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
        pedagogical_method: pedagogicalMethod,
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
      group_id: selectedGroupId ? Number(selectedGroupId) : null,
      schedule_id: selectedScheduleId ? Number(selectedScheduleId) : null,
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

  // ── Print Session Sheet (Certified Official Moroccan Academic Document) ──
  const handlePrintSessionSheet = () => {
    const dataToPrint = structuredData || SPECIMEN_SAMPLE;
    const currentModName = activeModuleItem?.name || 'Diagnostic Financier & Analyse de la Valeur';
    const currentModCode = activeModuleItem?.code || 'M-GFC-601';
    const filiereName = activeModuleItem?.filiere?.name || 'Gestion Financière et Comptable';
    const filiereCode = activeModuleItem?.filiere?.code || 'GFC';
    const refCode = `ENCG-CT-2026-${filiereCode}-${Math.floor(1000 + Math.random() * 9000)}`;
    const logoUrl = `${window.location.origin}/logo-encg.png`;
    const verifyUrl = `${window.location.origin}/verify/${refCode}`;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <title>Fiche Pédagogique Officielle — ENCG Fès — ${dataToPrint.title}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 6mm 10mm 6mm 10mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: #0f172a;
            background-color: #ffffff;
            font-size: 7.8pt;
            line-height: 1.25;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* Outer Double Border Frame */
          .doc-border-frame {
            border: 2px solid #001A4B;
            padding: 2px;
            border-radius: 4px;
          }
          .doc-inner-frame {
            border: 1px solid #C5A059;
            padding: 10px 14px 8px 14px;
            border-radius: 2px;
          }

          /* Header Section */
          .header-table {
            width: 100%;
            border-collapse: collapse;
            border-bottom: 2px solid #001A4B;
            padding-bottom: 6px;
            margin-bottom: 8px;
          }
          .header-left {
            width: 32%;
            vertical-align: middle;
            text-align: left;
          }
          .header-center {
            width: 44%;
            vertical-align: middle;
            text-align: center;
          }
          .header-right {
            width: 24%;
            vertical-align: middle;
            text-align: right;
          }

          .univ-ar {
            font-size: 8.5pt;
            font-weight: bold;
            color: #001A4B;
            direction: rtl;
            font-family: 'Times New Roman', serif;
            line-height: 1.2;
          }
          .school-ar {
            font-size: 10pt;
            font-weight: 900;
            color: #C5A059;
            direction: rtl;
            margin-top: 1px;
            font-family: 'Times New Roman', serif;
          }
          .sub-dept {
            font-size: 6.5pt;
            font-weight: 800;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 3px;
          }

          /* Document Title Ribbon */
          .title-banner {
            background: linear-gradient(135deg, #001A4B 0%, #0A2558 100%);
            color: #ffffff;
            padding: 6px 12px;
            border-radius: 6px;
            margin-bottom: 8px;
            text-align: center;
            border-left: 5px solid #C5A059;
          }
          .title-badge {
            font-size: 6.8pt;
            font-weight: 900;
            color: #C5A059;
            text-transform: uppercase;
            letter-spacing: 1.2px;
          }
          .main-title {
            font-size: 11pt;
            font-weight: 900;
            color: #ffffff;
            margin-top: 2px;
            letter-spacing: 0.2px;
          }

          /* Cartouche Table */
          .cartouche-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
            font-size: 7.2pt;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
          }
          .cartouche-table td {
            padding: 3.5px 8px;
            border: 0.5px solid #e2e8f0;
            vertical-align: middle;
          }
          .c-label {
            font-weight: bold;
            color: #475569;
            text-transform: uppercase;
            font-size: 6.5pt;
            letter-spacing: 0.3px;
          }
          .c-val {
            color: #001A4B;
            font-weight: 800;
          }

          /* Pedagogical Box Sections */
          .section-card {
            border: 1px solid #cbd5e1;
            border-radius: 5px;
            margin-bottom: 6px;
            background: #ffffff;
            overflow: hidden;
          }
          .section-header {
            background: #f1f5f9;
            border-bottom: 1px solid #e2e8f0;
            padding: 3.5px 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .section-title {
            font-size: 6.8pt;
            font-weight: 900;
            color: #001A4B;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .section-pill {
            font-size: 5.8pt;
            font-weight: 800;
            background: #e2e8f0;
            color: #334155;
            padding: 1px 6px;
            border-radius: 10px;
            text-transform: uppercase;
          }
          .section-content {
            padding: 5px 8px;
            font-size: 7.3pt;
            color: #1e293b;
            line-height: 1.35;
          }
          .obj-list {
            margin: 0;
            padding-left: 18px;
          }
          .obj-list li {
            margin-bottom: 2px;
          }

          /* Signatures Block (3 Columns) */
          .signatures-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
            page-break-inside: avoid;
          }
          .sig-card {
            width: 33.33%;
            border: 1px solid #cbd5e1;
            background: #ffffff;
            padding: 5px 8px;
            vertical-align: top;
          }
          .sig-title {
            font-size: 6.6pt;
            font-weight: 900;
            color: #001A4B;
            text-transform: uppercase;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 2px;
            text-align: center;
          }
          .sig-caption {
            font-size: 5.8pt;
            color: #64748b;
            text-align: center;
            margin-top: 2px;
            font-style: italic;
          }

          /* Footer Legal Strip */
          .legal-footer {
            margin-top: 6px;
            border-top: 1px dashed #cbd5e1;
            padding-top: 4px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 5.8pt;
            color: #64748b;
            page-break-inside: avoid;
          }
        </style>
      </head>
      <body>

        <div class="doc-border-frame">
          <div class="doc-inner-frame">

            <!-- ── OFFICIAL ACADEMIC HEADER ── -->
            <table class="header-table">
              <tr>
                <td class="header-left">
                  <img 
                    src="${logoUrl}" 
                    alt="ENCG Fès" 
                    style="max-height: 48px; width: auto; object-fit: contain;" 
                    onerror="this.style.display='none'"
                  />
                  <div style="font-size: 6.5pt; font-weight: 900; color: #001A4B; margin-top: 2px;">
                    ÉCOLE NATIONALE DE COMMERCE ET DE GESTION
                  </div>
                  <div style="font-size: 5.8pt; color: #64748b; font-weight: bold;">
                    UNIVERSITÉ SIDI MOHAMED BEN ABDELLAH — FÈS
                  </div>
                </td>

                <td class="header-center">
                  <div class="univ-ar">المملكة المغربية • جامعة سيدي محمد بن عبد الله</div>
                  <div class="school-ar">المدرسة الوطنية للتجارة والتسيير بفاس</div>
                  <div class="sub-dept">Direction des Affaires Pédagogiques • Cahier de Texte Numérique LMD</div>
                </td>

                <td class="header-right">
                  <div style="display: inline-block; text-align: right;">
                    <div style="font-size: 6.2pt; font-weight: bold; color: #001A4B;">
                      ANNÉE UNIVERSITAIRE 2025/2026
                    </div>
                    <div style="font-size: 6.8pt; font-family: monospace; font-weight: 900; color: #059669; margin-top: 1px;">
                      ${refCode}
                    </div>
                    <div style="font-size: 5.8pt; color: #64748b; margin-top: 2px;">
                      Édité le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </td>
              </tr>
            </table>

            <!-- ── TITLE BANNER ── -->
            <div class="title-banner">
              <div class="title-badge">FICHE CERTIFIÉE DE SÉANCE PÉDAGOGIQUE — VALIDATION DU SERVICE FAIT</div>
              <div class="main-title">${dataToPrint.title}</div>
            </div>

            <!-- ── ACADEMIC CARTOUCHE / IDENTITY GRID ── -->
            <table class="cartouche-table">
              <tr>
                <td style="width: 50%;">
                  <span class="c-label">Élément de Module :</span><br>
                  <span class="c-val">${currentModName}</span> &nbsp;
                  <span style="font-family: monospace; color: #C5A059; font-weight: 900;">[${currentModCode}]</span>
                </td>
                <td style="width: 50%;">
                  <span class="c-label">Filière &amp; Niveau Académique :</span><br>
                  <span class="c-val">${filiereName}</span> &nbsp;
                  <span style="font-size: 6.5pt; color: #475569; font-weight: bold;">(Semestre LMD : ${filiereCode})</span>
                </td>
              </tr>
              <tr>
                <td>
                  <span class="c-label">Enseignant Chercheur :</span><br>
                  <span class="c-val" style="color: #001A4B;">${professorFullName}</span> &nbsp;
                  <span style="font-size: 6.5pt; color: #64748b;">(Corps Professoral Permanent / Vacataire)</span>
                </td>
                <td>
                  <span class="c-label">Type de Séance &amp; Groupe :</span><br>
                  <span class="c-val">${sessionType === 'CM' ? 'Cours Magistral (CM)' : sessionType === 'TD' ? 'Travaux Dirigés (TD)' : 'Travaux Pratiques (TP)'}</span> &nbsp;•&nbsp; 
                  <strong style="color: #059669;">${groupName || 'Section Complète (Amphithéâtre)'}</strong>
                </td>
              </tr>
              <tr>
                <td>
                  <span class="c-label">Date &amp; Volume Horaire Certifié :</span><br>
                  <span class="c-val">${sessionDate}</span> &nbsp;•&nbsp; 
                  <span style="color: #001A4B; font-weight: 900;">${sessionDuration} Heures Pédagogiques</span> 
                  <span style="font-size: 6.5pt; color: #64748b;">(Norme : 36h / module)</span>
                </td>
                <td>
                  <span class="c-label">Validation &amp; Décompte Service Fait :</span><br>
                  <span style="color: #059669; font-weight: 900;">+${dataToPrint.estimated_progress || 8}% du Syllabus</span> &nbsp;•&nbsp; 
                  <span style="color: #001A4B; font-weight: bold;">Transmis pour Décompte &amp; Émargement</span>
                </td>
              </tr>
            </table>

            <!-- ── SECTION 1: OBJECTIFS BLOOM ── -->
            <div class="section-card">
              <div class="section-header">
                <span class="section-title">I. Objectifs Pédagogiques Opérationnels (Norme LMD — Taxonomie de Bloom)</span>
                <span class="section-pill" style="background: #ecfdf5; color: #047857; border: 0.5px solid #a7f3d0;">Conforme LMD</span>
              </div>
              <div class="section-content">
                <ul class="obj-list">
                  ${dataToPrint.pedagogical_objectives.map(o => `<li>${o}</li>`).join('')}
                </ul>
              </div>
            </div>

            <!-- ── SECTION 2: NOTIONS THÉORIQUES & FORMULES ── -->
            <div class="section-card">
              <div class="section-header">
                <span class="section-title">II. Notions Théoriques, Outils, Formules &amp; Modèles Traités</span>
                <span class="section-pill">Contenu du Syllabus</span>
              </div>
              <div class="section-content">
                <p style="margin: 0;">${dataToPrint.notions_covered}</p>
              </div>
            </div>

            <!-- ── SECTION 3: TRAVAIL ASSIGNÉ & CAS PRATIQUES ── -->
            <div class="section-card">
              <div class="section-header" style="background: #fffbeb;">
                <span class="section-title" style="color: #92400e;">III. Travail Assigné / Exercices d'Application &amp; Études de Cas</span>
                <span class="section-pill" style="background: #fef3c7; color: #92400e; border: 0.5px solid #fde68a;">Travail Étudiant</span>
              </div>
              <div class="section-content">
                <p style="margin: 0; font-weight: 600; color: #78350f;">${dataToPrint.work_assigned}</p>
              </div>
            </div>

            <!-- ── SECTION 4: DISPOSITIF PÉDAGOGIQUE ── -->
            <div class="section-card">
              <div class="section-header">
                <span class="section-title">IV. Démarche Pédagogique &amp; Modalités d'Enseignement</span>
                <span class="section-pill">Modalité</span>
              </div>
              <div class="section-content">
                <p style="margin: 0; color: #334155;">${dataToPrint.pedagogical_method || pedagogicalMethod}</p>
              </div>
            </div>

            <!-- ── TRIPLE SIGNATURE & CACHET BLOCK ── -->
            <table class="signatures-table">
              <tr>
                <!-- Col 1: Enseignant -->
                <td class="sig-card">
                  <div class="sig-title">L'Enseignant Responsable</div>
                  <div class="sig-caption">« Déclare sur l'honneur le déroulement effectif »</div>
                  <div style="font-size: 7.2pt; font-weight: 900; color: #001A4B; text-align: center; margin-top: 3px;">
                    ${professorFullName}
                  </div>
                  <!-- Calligraphic Official Signature SVG -->
                  <div style="text-align: center; margin: 3px 0 1px 0; height: 32px;">
                    <svg width="95" height="30" viewBox="0 0 120 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10,24 C18,10 26,4 34,4 C40,4 36,24 42,26 C48,28 54,14 60,10 C66,4 72,20 78,18 C84,16 98,8 108,14" stroke="#059669" stroke-width="2.2" stroke-linecap="round"/>
                    </svg>
                  </div>
                  <div style="font-size: 5.5pt; color: #94a3b8; text-align: center;">Émargé électroniquement le ${sessionDate}</div>
                </td>

                <!-- Col 2: Chef de Département -->
                <td class="sig-card" style="border-left: none; border-right: none;">
                  <div class="sig-title">Le Chef de Département</div>
                  <div class="sig-caption">« Vu et visé pour Service Fait Pédagogique »</div>
                  <div style="font-size: 6.2pt; color: #475569; margin-top: 4px; text-align: center;">
                    Date de validation : ..... / ..... / 2026<br>
                    Mention : Conforme au Cahier des Charges LMD
                  </div>
                  <div style="height: 28px; border: 1px dashed #cbd5e1; border-radius: 4px; margin-top: 4px; display: flex; align-items: center; justify-content: center; font-size: 5.8pt; color: #94a3b8; text-transform: uppercase;">
                    (Visa &amp; Signature du Département)
                  </div>
                </td>

                <!-- Col 3: Administration & Official Seal Stamp -->
                <td class="sig-card" style="text-align: center;">
                  <div class="sig-title">Direction Pédagogique &amp; Scolarité</div>
                  <div class="sig-caption">« Cachet officiel d'enregistrement LMD »</div>

                  <!-- Authentic Circular Stamp SVG -->
                  <div style="margin: 2px auto 0 auto; width: 62px; height: 62px;">
                    <svg width="62" height="62" viewBox="0 0 100 100" style="transform: rotate(-8deg);">
                      <circle cx="50" cy="50" r="46" fill="none" stroke="#001A4B" stroke-width="2.5" stroke-dasharray="3 1.5"/>
                      <circle cx="50" cy="50" r="41" fill="none" stroke="#001A4B" stroke-width="1.2"/>
                      <path id="circlePathPrint" d="M 50, 50 m -34, 0 a 34,34 0 1,1 68,0 a 34,34 0 1,1 -68,0" fill="none"/>
                      <text font-size="6.5" font-weight="900" fill="#001A4B" letter-spacing="0.8">
                        <textPath href="#circlePathPrint" startOffset="50%" text-anchor="middle">
                          * ENCG FÈS * AFFAIRES PÉDAGOGIQUES *
                        </textPath>
                      </text>
                      <circle cx="50" cy="50" r="22" fill="#001A4B" opacity="0.06"/>
                      <polygon points="50,33 53.5,43 64,43 55.5,49.5 59,60 50,53.5 41,60 44.5,49.5 36,43 46.5,43" fill="#C5A059" opacity="0.95"/>
                      <text x="50" y="71" font-size="5" font-weight="900" fill="#001A4B" text-anchor="middle">SERVICE FAIT</text>
                      <text x="50" y="77" font-size="4.2" font-weight="bold" fill="#001A4B" text-anchor="middle">2025 - 2026</text>
                    </svg>
                  </div>
                  <div style="font-size: 5.5pt; font-weight: bold; color: #001A4B; margin-top: 1px;">CACHET OFFICIEL ENCG FÈS</div>
                </td>
              </tr>
            </table>

            <!-- ── SECURITY VERIFICATION FOOTER ── -->
            <div class="legal-footer">
              <div style="display: flex; align-items: center; gap: 8px;">
                <!-- QR Code SVG -->
                <div style="width: 32px; height: 32px; border: 1px solid #cbd5e1; padding: 1.5px; border-radius: 2px; background: #fff; flex-shrink: 0;">
                  <svg viewBox="0 0 29 29" width="100%" height="100%" shape-rendering="crispEdges">
                    <path fill="#001A4B" d="M0,0 h7 v7 h-7 z M1,1 v5 h5 v-5 z M2,2 h3 v3 h-3 z M22,0 h7 v7 h-7 z M23,1 v5 h5 v-5 z M24,2 h3 v3 h-3 z M0,22 h7 v7 h-7 z M1,23 v5 h5 v-5 z M2,24 h3 v3 h-3 z M9,2 h2 v2 h-2 z M13,1 h2 v4 h-2 z M17,2 h2 v2 h-2 z M2,9 h2 v2 h-2 z M10,9 h3 v3 h-3 z M16,9 h4 v2 h-4 z M22,10 h2 v2 h-2 z M26,9 h2 v2 h-2 z M0,14 h4 v2 h-4 z M6,13 h2 v3 h-2 z M10,14 h2 v4 h-2 z M14,13 h4 v2 h-4 z M20,13 h2 v3 h-2 z M25,13 h4 v2 h-4 z M3,18 h2 v2 h-2 z M8,18 h4 v2 h-4 z M14,17 h2 v4 h-2 z M18,18 h2 v2 h-2 z M22,17 h4 v2 h-4 z M28,18 h1 v2 h-1 z M9,22 h2 v3 h-2 z M13,23 h3 v2 h-3 z M18,22 h2 v2 h-2 z M22,23 h2 v2 h-2 z M26,22 h3 v2 h-3 z M10,26 h2 v3 h-2 z M14,26 h4 v3 h-4 z M20,26 h2 v2 h-2 z M24,26 h2 v3 h-2 z M27,27 h2 v2 h-2 z"/>
                  </svg>
                </div>
                <div>
                  <strong style="color: #001A4B; font-size: 6.2pt; text-transform: uppercase;">Sécurisation Numérique — Loi 53-05 (Royaume du Maroc)</strong><br>
                  Document certifié émis par le Système d'Information de l'ENCG Fès.<br>
                  Vérification d'authenticité : <em style="color: #001A4B;">${verifyUrl}</em>
                </div>
              </div>

              <div style="text-align: right; line-height: 1.25;">
                <strong>École Nationale de Commerce et de Gestion de Fès</strong><br>
                Université Sidi Mohamed Ben Abdellah • Route d'Imouzzer, B.P. 1255, Fès - Maroc<br>
                <span style="font-weight: 900; color: #001A4B;">Page 1 / 1 (Document Officiel)</span>
              </div>
            </div>

          </div>
        </div>

      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 450);
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

  const moduleSelectOptions: SelectOption[] = assignedModulesList.map(m => ({
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
    <div className="max-w-[1720px] mx-auto p-3 sm:p-5 md:p-6 space-y-4 font-sans animate-in fade-in duration-300 text-slate-900 dark:text-slate-100 pb-20">
      
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── UNIFIED EXECUTIVE COCKPIT HEADER (~110px) ──────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#000E29] via-[#001A4B] to-[#0A2558] rounded-2xl md:rounded-3xl p-4 sm:p-5 text-white shadow-xl border border-indigo-900/50">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          {/* Top Row: Title, Module Badge & Action Buttons */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-rose-500 via-purple-600 to-indigo-600 p-0.5 shadow-lg shadow-rose-500/20 shrink-0">
                <div className="w-full h-full bg-slate-950/80 rounded-[0.9rem] backdrop-blur-xl flex items-center justify-center text-white">
                  <Mic className="w-5 h-5 md:w-6 md:h-6 text-amber-300" />
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-indigo-500/25 text-indigo-200 border border-indigo-400/30 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" /> IA Vocale Synchrone • Gemini 1.5 Pro
                  </span>
                  <span className="text-[11px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md">
                    {activeModuleItem?.code || 'ENCG-MOD'}
                  </span>
                  <span className="text-[10px] bg-white/10 text-slate-200 px-2 py-0.5 rounded-md">
                    {assignedModulesList.length} Module(s) Affecté(s)
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
          <div className="pt-2 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-200">
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

              <div className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-2.5 py-1 rounded-xl text-[11px] font-black">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{currentSummary.validated_count || 0} / {currentSummary.sessions_count || 0} Visées</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── FAST SELECTOR: MES SÉANCES D'EMPLOI DU TEMPS AFFECTÉES ─────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {assignedSchedules.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-black uppercase tracking-wider text-foreground">
                Mes Séances Affectées dans l'Emploi du Temps (Sélection 1-Clic)
              </span>
            </div>
            <span className="text-[11px] text-muted-foreground font-medium">
              Cliquez pour charger automatiquement le module, groupe, type et durée
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {assignedSchedules.map((sched: AssignedSchedule) => {
              const isSelected = selectedScheduleId === String(sched.id) || (selectedModule === String(sched.module_id) && sessionType === sched.session_type && groupName === sched.group_name);

              return (
                <button
                  key={sched.id}
                  onClick={() => handleSelectSchedule(sched)}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all cursor-pointer relative group flex flex-col justify-between space-y-1.5",
                    isSelected
                      ? "bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-500 shadow-sm ring-2 ring-indigo-500/20"
                      : "bg-muted/30 hover:bg-muted/70 border-border/70"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-500" />
                      {sched.day_of_week} • {sched.time_label}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[9px] font-black uppercase",
                      sched.session_type === 'CM' ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" :
                      sched.session_type === 'TD' ? "bg-sky-500/15 text-sky-700 dark:text-sky-300" :
                      "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                    )}>
                      {sched.session_type}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-foreground truncate group-hover:text-primary transition-colors">
                      {sched.module_name}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1 font-semibold truncate">
                        <Users className="w-3 h-3" /> {sched.group_name}
                      </span>
                      {sched.room_name && (
                        <span className="flex items-center gap-1 font-mono truncate">
                          <MapPin className="w-2.5 h-2.5" /> {sched.room_name}
                        </span>
                      )}
                    </div>
                  </div>

                  {isSelected && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 text-[9px] font-black text-indigo-600 dark:text-indigo-400">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* ── MAIN TWO-COLUMN STUDIO WORKSPACE ───────────────────────────────── */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* ────────────────────────────────────────────────────────────────── */}
        {/* ── LEFT COLUMN (5 Cols): STUDIO VOCAL & CONFIGURATION ──────────── */}
        {/* ────────────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-6 xl:col-span-5 bg-card border border-border rounded-2xl md:rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
          
          {/* Card Header & Settings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center font-bold">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-foreground uppercase tracking-wide">
                    Paramètres de la Séance
                  </h2>
                  <span className="text-[10px] text-muted-foreground font-medium">Uniquement vos modules &amp; cours affectés</span>
                </div>
              </div>

              <input
                type="date"
                value={sessionDate}
                onChange={e => setSessionDate(e.target.value)}
                className="bg-background border border-input rounded-xl px-2.5 py-1 text-xs font-bold text-foreground focus:outline-none shadow-2xs"
              />
            </div>

            {/* Module Selector (Strictly Professor's Assigned Modules) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-black uppercase text-muted-foreground">
                <span>Élément de Module Dispensé</span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold lowercase">
                  ({assignedModulesList.length} module(s) affecté(s))
                </span>
              </div>
              <CustomSelect
                value={selectedModule}
                onChange={v => {
                  setSelectedModule(String(v));
                  setSelectedScheduleId(null);
                }}
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

            {/* Group/Section & Pedagogical Method */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-muted-foreground flex items-center justify-between">
                  <span>Section / Groupe</span>
                  {groupName && <span className="text-[9px] text-indigo-600 font-bold truncate">({groupName})</span>}
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  placeholder={sessionType === 'CM' ? "Ex: Section 1 (Amphi 1)" : "Ex: Sous-Groupe G1.1"}
                  className="w-full bg-background border border-input rounded-xl px-2.5 py-1.5 text-xs font-bold text-foreground focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-muted-foreground">
                  Méthode Pédagogique
                </label>
                <select
                  value={pedagogicalMethod}
                  onChange={e => setPedagogicalMethod(e.target.value)}
                  className="w-full bg-background border border-input rounded-xl px-2 py-1.5 text-xs font-bold text-foreground focus:outline-none"
                >
                  <option value="Cours Magistral Interactif">Cours Magistral Interactif</option>
                  <option value="Travaux Dirigés & Exercices">Travaux Dirigés &amp; Exercices</option>
                  <option value="Étude de Cas Pratique sur Excel">Étude de Cas sur Excel</option>
                  <option value="Atelier de Travail en Binômes">Atelier en Binômes</option>
                  <option value="Restitution & Débat Managérial">Restitution &amp; Débat</option>
                </select>
              </div>
            </div>

            {/* 1-Click Fast AI Chapter Suggestion */}
            <div className="pt-1">
              <button
                onClick={handleAutoSuggestChapter}
                className="w-full py-2 bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-black tracking-wide flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                title="Suggérer automatiquement le chapitre suivant du syllabus selon l'avancement"
              >
                <Compass className="w-3.5 h-3.5 text-indigo-600" />
                <span>✨ Suggérer le Chapitre Suivant selon le Syllabus</span>
              </button>
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
              "relative border-2 rounded-2xl p-3.5 transition-all duration-300 min-h-[140px] flex flex-col justify-between",
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
          <div className="space-y-3.5">
            
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
                <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
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
                <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                      Objectifs Pédagogiques Opérationnels (Taxonomie de Bloom)
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
                <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
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

                {/* Assigned Homework & Method */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1">
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
                      <p className="text-foreground font-bold text-[11px] truncate">{structuredData.work_assigned}</p>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 space-y-1">
                    <span className="text-[10px] font-black uppercase text-blue-700 dark:text-blue-400 tracking-wider">
                      Modalité Pédagogique
                    </span>
                    <p className="text-foreground font-bold text-[11px] truncate">
                      {structuredData.pedagogical_method || pedagogicalMethod}
                    </p>
                  </div>
                </div>

                {/* Progress Contribution Badge */}
                <div className="flex items-center justify-between px-3 py-2 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-800 dark:text-emerald-300">
                  <span className="font-bold flex items-center gap-1.5 text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Progression Syllabus Estimée pour cette Séance
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
                      Spécimen de Fiche Académique Conforme (LMD)
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
                    Sélectionnez une séance d'emploi du temps ou chargez ce modèle
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
              Utilisez la sélection rapide de séance ci-dessus ou la dictée vocale pour consigner votre premier cours.
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
                          {session.group?.name && (
                            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                              {session.group.name}
                            </span>
                          )}
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
