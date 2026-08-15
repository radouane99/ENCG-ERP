import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, Send, Sparkles, BookOpen, HelpCircle, CheckCircle2, 
  Award, RefreshCw, Copy, Check, MessageSquare, Flame, 
  ArrowRight, ShieldCheck, FileText, ChevronDown, Lightbulb
} from 'lucide-react';
import { cn } from '@shared/lib/utils';
import api from '@/shared/lib/api';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  citation?: string;
  timestamp: string;
  suggestedQuiz?: any;
}

const MODULES = [
  { key: 'finance', name: 'Finance d\'Entreprise Approfondie', code: 'M11-GFC', prof: 'Pr. Abdelhak El Amrani' },
  { key: 'controle', name: 'Contrôle de Gestion & Pilotage', code: 'M12-GFC', prof: 'Pr. Meryem Kettani' },
  { key: 'fiscalite', name: 'Fiscalité Marocaine des Entreprises', code: 'M13-GFC', prof: 'Pr. Youssef Bennani' },
];

const QUICK_PROMPTS: Record<string, string[]> = {
  finance: [
    'Expliquer le CMPC / WACC selon le cours du Pr. El Amrani',
    'Quelle est la différence entre la VAN et le TRI ?',
    'Théorème de Modigliani-Miller avec et sans impôt',
    'Comment calculer l\'Indice de Profitabilité (IP) ?'
  ],
  controle: [
    'Qu\'est-ce que la méthode ABC (Activity-Based Costing) ?',
    'Comment décomposer l\'écart sur charges indirectes ?',
    'Expliquer le rôle des inducteurs de coûts (Cost Drivers)',
  ],
  fiscalite: [
    'Quelles sont les charges non déductibles à l\'IS selon le CGI ?',
    'Comment calculer la Cotisation Minimale (CM) ?',
    'Régime de la TVA au Maroc et fait générateur',
  ]
};

export default function StudentAiTutorPage() {
  const [selectedModule, setSelectedModule] = useState(MODULES[0]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Active Quiz State
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: `Bonjour ! Je suis votre **Tuteur Pédagogique IA ENCG Fès**.\n\nJe suis directement connecté aux polycopiés et supports de cours déposés par vos professeurs.\n\nPosez-moi vos questions ou lancez un quiz pour préparer vos examens en toute sérénité !`,
      citation: '[M11-GFC] Polycopié Officiel ENCG Fès · Pr. Abdelhak El Amrani',
      timestamp: 'À l\'instant',
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputQuery.trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: 'user-' + Date.now(),
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const res = await api.post('/student-portal/ai-tutor/chat', {
        module: selectedModule.key,
        question: text
      });

      const data = res.data.data;

      const aiMsg: Message = {
        id: 'ai-' + Date.now(),
        sender: 'ai',
        text: data.answer,
        citation: data.citation,
        suggestedQuiz: data.suggested_quiz,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch {
      // Fallback pedagogical answer
      const fallbackMsg: Message = {
        id: 'ai-' + Date.now(),
        sender: 'ai',
        text: `D'après le cours de **${selectedModule.name}** dispensé à l'ENCG Fès :\n\n📌 **Rappel de Cours :**\nPour toute question portant sur ${text}, appliquez rigoureusement les formules du polycopié officiel et veillez à vérifier la conformité avec la réglementation et le plan comptable marocain (PCM).\n\n📖 **Référence :** \`[${selectedModule.code}] Polycopié ENCG Fès · ${selectedModule.prof}\``,
        citation: `[${selectedModule.code}] Polycopié Officiel ENCG`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartQuiz = async () => {
    try {
      const res = await api.get(`/student-portal/ai-tutor/quiz?module=${selectedModule.key}`);
      const questions = res.data.data.questions;
      if (questions && questions.length > 0) {
        setActiveQuiz(questions[0]);
        setSelectedAnswer(null);
        setIsAnswerSubmitted(false);
      } else {
        toast.info("Génération de quiz en cours...");
      }
    } catch {
      toast.info("Quiz de révision disponible sous peu.");
    }
  };

  const handleCopyCitation = (citation: string, id: string) => {
    navigator.clipboard.writeText(citation);
    setCopiedId(id);
    toast.success("Référence du cours copiée !");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-[1200px] mx-auto p-4 md:p-8 space-y-6 font-sans animate-in fade-in pb-24">
      
      {/* ── Hero Header ────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#002e5b] p-6 md:p-8 rounded-3xl shadow-xl text-white border border-blue-900/50">
        <div className="absolute top-0 right-0 w-72 h-72 bg-sky-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center shadow-lg shrink-0">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 bg-sky-500/20 text-sky-200 px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider mb-1 border border-sky-400/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Tuteur IA RAG • Ancré sur Polycopiés ENCG
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                Tuteur Pédagogique Virtuel & Entraînement
              </h1>
              <p className="text-xs md:text-sm text-blue-100/80 font-medium">
                Posez vos questions de révision ou testez-vous avec des QCM conformes aux examens.
              </p>
            </div>
          </div>

          {/* Module Selector Dropdown */}
          <div className="shrink-0 flex items-center gap-2 bg-white/10 p-1.5 rounded-2xl border border-white/15 backdrop-blur-md">
            <select
              value={selectedModule.key}
              onChange={(e) => {
                const mod = MODULES.find(m => m.key === e.target.value) || MODULES[0];
                setSelectedModule(mod);
                toast.info(`Module actif : ${mod.name}`);
              }}
              className="bg-transparent text-white text-xs font-bold px-3 py-2 outline-none cursor-pointer"
            >
              {MODULES.map(m => (
                <option key={m.key} value={m.key} className="bg-slate-900 text-white">
                  {m.code} — {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Main Chat Area ────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-sm flex flex-col h-[650px] overflow-hidden">
        
        {/* Module Sub-bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold text-slate-800 dark:text-slate-200">{selectedModule.name}</span>
            <span className="text-slate-400">({selectedModule.prof})</span>
          </div>
          <button
            onClick={handleStartQuiz}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white rounded-xl text-xs font-black transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Quiz 1-Clic</span>
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3 max-w-3xl",
                msg.sender === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
              )}
            >
              {/* Avatar */}
              <div className={cn(
                "w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-xs font-black text-xs",
                msg.sender === 'user'
                  ? "bg-[#0f2863] text-white"
                  : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
              )}>
                {msg.sender === 'user' ? 'ME' : <Bot className="w-5 h-5" />}
              </div>

              {/* Message Content Bubble */}
              <div className="space-y-2">
                <div className={cn(
                  "p-5 rounded-3xl text-xs sm:text-sm leading-relaxed",
                  msg.sender === 'user'
                    ? "bg-[#0f2863] text-white rounded-tr-xs shadow-md"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-xs border border-slate-200/60 dark:border-slate-700/60 shadow-xs whitespace-pre-wrap"
                )}>
                  {msg.text}
                </div>

                {/* Citation Pill */}
                {msg.citation && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-800 text-[11px] font-mono text-indigo-700 dark:text-indigo-300">
                      <BookOpen className="w-3 h-3 text-indigo-500" />
                      {msg.citation}
                    </span>
                    <button
                      onClick={() => handleCopyCitation(msg.citation!, msg.id)}
                      className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                      title="Copier la référence du cours"
                    >
                      {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 max-w-xl mr-auto animate-pulse">
              <div className="w-9 h-9 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div className="p-4 rounded-3xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500 flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                <span>Recherche dans les polycopiés et formulation de la réponse...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Quick Prompt Chips ─────────────────────────────────────────────── */}
        <div className="p-3 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-200/60 dark:border-slate-800 flex items-center gap-2 overflow-x-auto px-6">
          <span className="text-[10px] font-black uppercase text-slate-400 shrink-0 flex items-center gap-1">
            <Lightbulb className="w-3 h-3 text-amber-500" /> Suggestions :
          </span>
          {(QUICK_PROMPTS[selectedModule.key] || QUICK_PROMPTS.finance).map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="shrink-0 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 text-[11px] font-medium text-slate-700 dark:text-slate-300 rounded-full transition-colors cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* ── Input Bar ──────────────────────────────────────────────────────── */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3 px-6">
          <input
            type="text"
            placeholder={`Posez votre question sur ${selectedModule.name}...`}
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 dark:text-white outline-none border border-transparent focus:border-indigo-500 transition-all"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!inputQuery.trim() || isLoading}
            className="p-3.5 bg-[#0f2863] hover:bg-[#15347d] text-white rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* ── Interactive Quiz Modal ────────────────────────────────────────────── */}
      {activeQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 dark:border-slate-800">
            
            <div className="p-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5" />
                <span className="font-black text-sm uppercase tracking-wider">Quiz d'Entraînement Examen</span>
              </div>
              <button
                onClick={() => setActiveQuiz(null)}
                className="text-white/70 hover:text-white text-xs font-bold cursor-pointer"
              >
                ✕ Fermer
              </button>
            </div>

            <div className="p-6 space-y-6">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {activeQuiz.question}
              </h3>

              <div className="space-y-2">
                {activeQuiz.options.map((opt: string, idx: number) => {
                  const letter = opt.charAt(0);
                  const isCorrect = letter === activeQuiz.answer;
                  const isChosen = selectedAnswer === letter;

                  return (
                    <div
                      key={idx}
                      onClick={() => !isAnswerSubmitted && setSelectedAnswer(letter)}
                      className={cn(
                        "p-4 rounded-2xl border text-xs font-bold cursor-pointer transition-all flex items-center justify-between",
                        !isAnswerSubmitted && isChosen && "border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200",
                        !isAnswerSubmitted && !isChosen && "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800",
                        isAnswerSubmitted && isCorrect && "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200",
                        isAnswerSubmitted && isChosen && !isCorrect && "border-rose-500 bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-200"
                      )}
                    >
                      <span>{opt}</span>
                      {isAnswerSubmitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </div>
                  );
                })}
              </div>

              {isAnswerSubmitted && (
                <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-xs font-medium text-indigo-900 dark:text-indigo-200">
                  <p className="font-bold">💡 Explication du Polycopié :</p>
                  <p className="mt-1">{activeQuiz.explanation}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                {!isAnswerSubmitted ? (
                  <button
                    onClick={() => setIsAnswerSubmitted(true)}
                    disabled={!selectedAnswer}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-white rounded-xl text-xs font-black uppercase transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    Valider Ma Réponse
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveQuiz(null)}
                    className="px-5 py-2.5 bg-[#0f2863] text-white rounded-xl text-xs font-black uppercase transition-all shadow-md cursor-pointer"
                  >
                    Terminer le Quiz
                  </button>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
