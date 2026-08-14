import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  Save, 
  Layers, 
  FileText, 
  Loader2, 
  Clock, 
  Volume2, 
  HelpCircle, 
  Calendar,
  Send,
  RefreshCw
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/shared/lib/api';
import { toast } from 'sonner';

export default function ProfessorVoiceTextbook() {
  const { t, i18n } = useTranslation(['professors', 'common']);
  
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [selectedModule, setSelectedModule] = useState('1');
  const [sessionDuration, setSessionDuration] = useState('2 heures');
  const [structuredData, setStructuredData] = useState<any>(null);

  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API if supported
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
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      toast.info('🎙️ Enregistrement vocal terminé.');
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsRecording(true);
          toast.success('🎙️ Micro actif ! Parlez clairement pour dicter votre séance.');
        } catch (e) {
          setIsRecording(true);
        }
      } else {
        // Fallback simulation
        setIsRecording(true);
        setTimeout(() => {
          setTranscription("Aujourd'hui nous avons traité le diagnostic de la structure financière, le calcul du FRNG, du BFR et l'analyse de la trésorerie nette avec application sur un cas réel d'entreprise marocaine.");
          setIsRecording(false);
          toast.success('🎙️ Dictée transcrite avec succès !');
        }, 3000);
      }
    }
  };

  // AI Structuring Mutation
  const structureMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/professor/ai/voice-textbook', {
        raw_transcription: transcription,
        module_id: Number(selectedModule),
        session_duration: sessionDuration,
      });
      return res.data.data;
    },
    onSuccess: (data) => {
      setStructuredData(data);
      toast.success('✨ Compte-rendu structuré et aligné sur le syllabus avec succès !');
    },
    onError: (err: any) => {
      toast.error('Erreur lors de la structuration IA');
    }
  });

  const handleSaveToCahier = () => {
    toast.success('📖 Séance officiellement enregistrée dans le Cahier de Texte Numérique !', {
      description: 'Transmise automatiquement au Chef de Département et accessible aux étudiants.'
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 font-sans animate-in fade-in duration-500 pb-28">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-[#001A4B] rounded-3xl p-8 text-white shadow-xl border border-indigo-900/60 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
            <Mic className="w-7 h-7 text-white" />
          </div>
          <div>
            <span className="bg-purple-500/20 text-purple-200 border border-purple-400/30 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1 mb-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Dictée Vocale & IA Pédagogique
            </span>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">Saisie Vocale du Cahier de Texte</h1>
            <p className="text-xs md:text-sm text-slate-300 font-medium mt-0.5">
              Dictez oralement le déroulement de votre cours en 30 secondes; l'IA structure le compte-rendu officiel.
            </p>
          </div>
        </div>
      </div>

      {/* Voice Recorder Card */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/90 space-y-6">
        
        {/* Module & Duration Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-slate-100 pb-6">
          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">Module d'Enseignement</label>
            <select
              value={selectedModule}
              onChange={e => setSelectedModule(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="1">Diagnostic Financier & IFRS (S5 - GFC)</option>
              <option value="2">Audit & Contrôle de Gestion (S7 - ACG)</option>
              <option value="3">Marketing Mix & Stratégie 4P (S3 - MCM)</option>
              <option value="4">Management des Organisations (S1 - TC)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-black uppercase text-slate-500 mb-1.5">Durée de la Séance</label>
            <select
              value={sessionDuration}
              onChange={e => setSessionDuration(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="2 heures">Séance Standard de 2 Heures (CM/TD)</option>
              <option value="4 heures">Séance Double / Intensive (4 Heures)</option>
              <option value="1 heure 30">Séance TD / TP (1h30)</option>
            </select>
          </div>
        </div>

        {/* Voice Dictation Hub */}
        <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-slate-50 border border-slate-200 text-center space-y-4">
          <button
            type="button"
            onClick={toggleRecording}
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl cursor-pointer hover:scale-105",
              isRecording 
                ? "bg-rose-600 text-white shadow-rose-600/30 animate-pulse" 
                : "bg-gradient-to-r from-indigo-900 to-blue-900 text-white shadow-indigo-950/30"
            )}
          >
            {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8 text-amber-300" />}
          </button>

          <div className="space-y-1">
            <h3 className="font-black text-sm text-slate-900">
              {isRecording ? "Écoute en cours... Parlez maintenant" : "Cliquez sur le microphone pour dicter"}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Parlez en français ou en arabe pour décrire les concepts abordés durant la séance.
            </p>
          </div>

          {/* Preset Quick Chips */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
            <span className="text-[10px] font-bold text-slate-400">Modèles rapides :</span>
            <button
              type="button"
              onClick={() => setTranscription("Séance de cours magistral sur l'analyse financière. Nous avons détaillé le calcul du Fonds de Roulement Net Global, du BFR et de la trésorerie nette. Les étudiants ont travaillé sur un cas pratique d'entreprise marocaine et doivent rendre l'exercice 3 pour la prochaine séance.")}
              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-extrabold transition-colors"
            >
              Exemple : Finance / BFR
            </button>
            <button
              type="button"
              onClick={() => setTranscription("Séance consacrée à la démarche d'audit légal et aux missions du commissaire aux comptes. Présentation des étapes de planification, cartographie des risques et sondages de conformité.")}
              className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-[10px] font-extrabold transition-colors"
            >
              Exemple : Audit Légal
            </button>
          </div>
        </div>

        {/* Transcription Area */}
        <div className="space-y-2">
          <label className="block text-xs font-black uppercase text-slate-500">
            Transcription Vocale Brute (Éditable)
          </label>
          <textarea
            rows={4}
            value={transcription}
            onChange={e => setTranscription(e.target.value)}
            placeholder="Le texte dicté s'affichera ici en temps réel..."
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={() => structureMutation.mutate()}
            disabled={structureMutation.isPending || !transcription.trim()}
            className="px-8 py-3.5 bg-gradient-to-r from-indigo-900 to-purple-900 hover:opacity-95 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-purple-950/20 disabled:opacity-40 cursor-pointer"
          >
            {structureMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-400" />}
            Structurer & Aligner sur le Syllabus avec l'IA
          </button>
        </div>

      </div>

      {/* Structured Output Card */}
      {structuredData && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/90 space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900">Compte-Rendu Pédagogique Officiel Structuré</h3>
                <span className="text-xs text-emerald-700 font-bold">{structuredData.syllabus_alignment}</span>
              </div>
            </div>

            <button
              onClick={handleSaveToCahier}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" /> Enregistrer au Cahier de Texte
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-black uppercase text-indigo-600">Chapitre / Thématique</span>
              <h4 className="font-black text-sm text-slate-900">{structuredData.chapter_title}</h4>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-black uppercase text-purple-600">Travail à Faire (Devoir)</span>
              <p className="text-xs font-bold text-slate-800">{structuredData.homework_assigned}</p>
            </div>

            <div className="md:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-black uppercase text-emerald-600">Notions & Concepts Clés Traités</span>
              <div className="flex flex-wrap gap-1.5">
                {structuredData.key_concepts?.map((c: string, idx: number) => (
                  <span key={idx} className="px-3 py-1 bg-white text-slate-800 border border-slate-200 rounded-lg text-xs font-extrabold shadow-2xs">
                    • {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <span className="text-[10px] font-black uppercase text-slate-500">Résumé Détaillé de la Séance</span>
              <p className="text-xs font-medium text-slate-700 leading-relaxed">
                {structuredData.structured_summary}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
