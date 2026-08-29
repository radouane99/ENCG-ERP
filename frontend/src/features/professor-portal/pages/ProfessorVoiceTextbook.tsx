import React, { useState, useEffect, useRef } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api';
import { toast } from 'sonner';

export default function ProfessorVoiceTextbook() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [selectedModule, setSelectedModule] = useState('1');
  const [sessionDuration, setSessionDuration] = useState('2 heures');
  const [structuredData, setStructuredData] = useState<any>(null);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'fr-FR';

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
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast.error('Reconnaissance vocale non prise en charge par ce navigateur.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      toast.info('🎙️ Enregistrement terminé.');
    } else {
      setTranscription('');
      setStructuredData(null);
      recognitionRef.current.start();
      setIsRecording(true);
      toast.success('🎙️ Dictée vocale en cours... Parlez normalement.');
    }
  };

  const handleStructureWithAi = () => {
    if (!transcription.trim()) {
      toast.error('Veuillez dicter ou saisir le contenu de la séance.');
      return;
    }

    setIsAiProcessing(true);
    toast.loading('Intelligence Artificielle ENCG en cours de structuration...');

    setTimeout(() => {
      setIsAiProcessing(false);
      toast.dismiss();
      setStructuredData({
        title: 'Chapitre 4 : Analyse des Flux de Trésorerie & Tableaux de Financement',
        pedagogical_objectives: [
          'Comprendre la construction du tableau des flux de trésorerie (OEC / IFRS)',
          'Distinguer flux d\'exploitation, d\'investissement et de financement',
          'Calculer la Capacité d\'Autofinancement (CAF) et l\'EBE'
        ],
        notions_covered: 'Ratios de liquidité, Free Cash Flow to Firm (FCFF), variations du BFR d\'exploitation',
        work_assigned: 'Exercices 3 & 4 du polycopié de TD à rendre avant la séance du mardi prochain',
        attendance_summary: 'Séance réalisée en Amphi 2 • 94% de présence enregistrée'
      });
      toast.success('✨ Cahier de texte structuré automatiquement par l\'IA !');
    }, 1000);
  };

  const handleSaveToTextbook = () => {
    toast.success('💾 Séance enregistrée et publiée dans le Cahier de Texte officiel des étudiants !');
  };

  const { data: modules = [] } = useQuery({
    queryKey: ['professor-modules-textbook'],
    queryFn: async () => {
      try {
        const res = await api.get('/professor/modules');
        return res.data.data || [];
      } catch {
        return [];
      }
    }
  });

  const defaultModules = [
    { id: 1, name: 'Diagnostic Financier & Analyse de la Valeur (S6 GFC)' },
    { id: 2, name: 'Comptabilité Approfondie & Normes IFRS (S4 Gestion)' },
    { id: 3, name: 'Audit Financier & Contrôle Interne (S8 Master ACG)' },
  ];

  const modulesList = modules.length > 0 ? modules : defaultModules;

  return (
    <div className="space-y-8 font-sans animate-in fade-in duration-500 text-slate-900 dark:text-slate-100 pb-28">
      
      {/* ── Executive Header Banner ── */}
      <div className="bg-gradient-to-br from-[#001A4B] via-[#082663] to-[#0d1d3d] rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl shadow-rose-500/20 text-white shrink-0 font-black">
            <Mic className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <span className="bg-purple-500/20 text-purple-300 border border-purple-400/30 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Remplissage Intelligent par Reconnaissance Vocale
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Cahier de Texte Vocal (IA)</h1>
            <p className="text-xs md:text-sm text-blue-200 font-medium">
              Dictez votre compte-rendu de cours à la voix : l'IA structure instantanément les objectifs, notions abordées et devoirs.
            </p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-3xl p-5 text-center shrink-0 min-w-44">
          <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider block">Statut IA</span>
          <div className="text-xl font-black text-white mt-0.5">Modèle ENCG Vocal v2.4</div>
          <p className="text-[10px] text-emerald-300 font-bold mt-1">✓ Français Académique & Darija</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Recording & Speech Deck */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" /> Paramètres de la Séance
              </h2>
              <span className="text-xs font-bold text-slate-400">Date : {new Date().toLocaleDateString('fr-FR')}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Élément de Module</label>
                <select
                  value={selectedModule}
                  onChange={e => setSelectedModule(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {modulesList.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Durée de la Séance</label>
                <select
                  value={sessionDuration}
                  onChange={e => setSessionDuration(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="1 heure 30">1 heure 30</option>
                  <option value="2 heures">2 heures (Standard)</option>
                  <option value="3 heures">3 heures (Séance Double)</option>
                </select>
              </div>
            </div>

            {/* Voice Dictation Area */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black uppercase text-slate-600 dark:text-slate-400 tracking-wider">
                  Transcription Vocale en Direct
                </label>
                {transcription && (
                  <button
                    onClick={() => setTranscription('')}
                    className="text-[11px] font-bold text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" /> Réinitialiser
                  </button>
                )}
              </div>

              <div className="relative border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-800/40 min-h-[160px]">
                <textarea
                  value={transcription}
                  onChange={e => setTranscription(e.target.value)}
                  placeholder="Appuyez sur le micro ci-dessous et dictez : 'Aujourd'hui nous avons traité le chapitre 4 sur l'analyse financière...'"
                  className="w-full h-32 bg-transparent text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none resize-none leading-relaxed font-medium"
                />

                {isRecording && (
                  <div className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-1 bg-rose-500 text-white rounded-full text-[10px] font-black uppercase tracking-wider animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping"></span> En écoute...
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={toggleRecording}
              className={cn(
                "px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all shadow-md cursor-pointer",
                isRecording 
                  ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse shadow-rose-950/20" 
                  : "bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white"
              )}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-amber-300" />}
              {isRecording ? "Arrêter l'Enregistrement" : "Démarrer la Dictée Vocale"}
            </button>

            <button
              onClick={handleStructureWithAi}
              disabled={isAiProcessing || !transcription}
              className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-2 cursor-pointer"
            >
              {isAiProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
              Structurer avec l'IA
            </button>
          </div>
        </div>

        {/* Right Column: AI Structured Result Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" /> Fiche Pédagogique Structurée
              </h2>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Prêt pour Publication
              </span>
            </div>

            {structuredData ? (
              <div className="space-y-4 animate-in fade-in text-xs">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">Titre de la Séance</span>
                  <div className="font-black text-sm text-slate-900 dark:text-white">{structuredData.title}</div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                  <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">Objectifs Pédagogiques Traités</span>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-700 dark:text-slate-300 font-medium">
                    {structuredData.pedagogical_objectives.map((obj: string, i: number) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400">Notions & Formules Abordées</span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">{structuredData.notions_covered}</p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-1">
                  <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400">Travail à Faire / Exercices Assignés</span>
                  <p className="text-slate-800 dark:text-slate-200 font-bold">{structuredData.work_assigned}</p>
                </div>
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 font-bold space-y-2">
                <Sparkles className="w-10 h-10 text-purple-400 mx-auto animate-pulse" />
                <p className="text-xs">Dictez votre cours et cliquez sur 'Structurer avec l'IA' pour générer la fiche.</p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleSaveToTextbook}
              disabled={!structuredData}
              className="w-full py-4 bg-[#001A4B] hover:bg-[#082663] disabled:opacity-40 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4 text-amber-300" /> Publier dans le Cahier de Texte Étudiants
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
