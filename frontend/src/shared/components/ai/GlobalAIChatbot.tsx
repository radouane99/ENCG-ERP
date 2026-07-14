import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, Send, Loader2, MessageSquare, Sparkles, RefreshCw,
  BookOpen, Calendar, FileText, BarChart2, HelpCircle,
  Minimize2, Maximize2, Bot, User
} from 'lucide-react';
import { useAuthStore } from '@stores/authStore';
import api from '@shared/lib/api';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@shared/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

interface QuickAction {
  label: string;
  icon: React.ReactNode;
  message: string;
  color: string;
}

function getRoleActions(roles: string[]): QuickAction[] {
  if (roles.includes('super-admin') || roles.includes('institution-admin')) {
    return [
      { label: 'Analyse prédictive', icon: <BarChart2 className="w-3.5 h-3.5" />, message: 'Quels sont les étudiants les plus à risque de décrochage actuellement ?', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
      { label: 'Rapport absences', icon: <FileText className="w-3.5 h-3.5" />, message: 'Génère un résumé du taux d\'absence global cette semaine.', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
      { label: 'Planning salles', icon: <Calendar className="w-3.5 h-3.5" />, message: 'Quelles salles sont disponibles cette semaine pour une réservation ?', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    ];
  }
  if (roles.includes('professor')) {
    return [
      { label: 'Mon planning', icon: <Calendar className="w-3.5 h-3.5" />, message: 'Quelles sont mes heures de cours cette semaine ?', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
      { label: 'Générer un QCM', icon: <BookOpen className="w-3.5 h-3.5" />, message: 'Génère un QCM de 5 questions sur la Comptabilité de Gestion.', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
      { label: 'Statistiques', icon: <BarChart2 className="w-3.5 h-3.5" />, message: 'Montre-moi le taux de présence de mes cours.', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
    ];
  }
  // Student
  return [
    { label: 'Mon emploi du temps', icon: <Calendar className="w-3.5 h-3.5" />, message: 'Quel est mon emploi du temps cette semaine ?', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    { label: 'Mes notes', icon: <BarChart2 className="w-3.5 h-3.5" />, message: 'Quelles sont mes dernières notes et ma moyenne générale ?', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    { label: 'Demande document', icon: <FileText className="w-3.5 h-3.5" />, message: 'Comment faire une demande d\'attestation de scolarité ?', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    { label: 'Aide', icon: <HelpCircle className="w-3.5 h-3.5" />, message: 'Qu\'est-ce que tu peux faire pour moi ?', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  ];
}

// Simple markdown bold rendering
function renderText(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function GlobalAIChatbot() {
  const { user, hasAnyRole } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const userRoles: string[] = (user as any)?.roles ?? [];
  const quickActions = getRoleActions(userRoles);

  // Load chat history from backend
  const { data: historyData } = useQuery({
    queryKey: ['chatbot-history'],
    queryFn: () => api.get('/chatbot/history').then(res => res.data.messages ?? []),
    enabled: isOpen && messages.length === 0,
    staleTime: Infinity,
  });

  // Initialize messages from backend history
  useEffect(() => {
    if (historyData && historyData.length > 0 && messages.length === 0) {
      const loaded: Message[] = historyData.map((m: any, i: number) => ({
        id: `hist-${i}`,
        role: m.role === 'user' ? 'user' : 'bot',
        text: m.content,
        timestamp: new Date(),
      }));
      setMessages(loaded);
    } else if (isOpen && messages.length === 0 && !historyData) {
      setMessages([{
        id: 'welcome',
        role: 'bot',
        text: `Bonjour ${user?.name?.split(' ')[0] ?? ''} ! 👋 Je suis votre assistant IA de l'ENCG Fès, propulsé par **Gemini**.\n\nJe peux vous aider avec vos cours, notes, plannings, documents et bien plus encore. Comment puis-je vous aider ?`,
        timestamp: new Date(),
      }]);
    }
  }, [historyData, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [messages, isTyping, isOpen]);

  const handleSendMessage = useCallback(async (e?: React.FormEvent, predefinedText?: string) => {
    e?.preventDefault();
    const text = predefinedText ?? inputValue;
    if (!text.trim() || isTyping) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Determine role label for API
    const roleLabel = userRoles.includes('super-admin') || userRoles.includes('institution-admin')
      ? 'Administrateur'
      : userRoles.includes('professor')
      ? 'Professeur'
      : 'Étudiant';

    try {
      const res = await api.post('/chatbot/message', {
        message: text,
        role: roleLabel,
      });

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: res.data.data?.reply ?? res.data.reply ?? 'Je n\'ai pas pu générer une réponse.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      toast.error("Erreur de connexion à l'IA.");
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        text: "Désolé, je rencontre des difficultés techniques. Veuillez réessayer dans un instant.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsTyping(false);
    }
  }, [inputValue, isTyping, userRoles]);

  const clearHistory = () => {
    setMessages([{
      id: Date.now().toString(),
      role: 'bot',
      text: 'Conversation réinitialisée. Comment puis-je vous aider ?',
      timestamp: new Date(),
    }]);
  };

  if (!user) return null;

  const windowClass = isExpanded
    ? 'fixed bottom-0 right-0 w-full h-full sm:w-[600px] sm:h-[700px] sm:bottom-6 sm:right-6 rounded-none sm:rounded-3xl'
    : 'fixed bottom-6 right-6 w-[380px] h-[560px] rounded-3xl';

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          id="global-ai-chatbot-trigger"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 group"
          aria-label="Ouvrir l'assistant IA"
        >
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-2xl shadow-indigo-500/40 flex items-center justify-center text-white transition-all duration-300 group-hover:scale-110 group-hover:shadow-indigo-500/60">
              <Sparkles className="w-6 h-6" />
            </div>
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-2xl bg-indigo-500 opacity-20 animate-ping" />
            {/* Badge */}
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-background flex items-center justify-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full" />
            </span>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={cn(
            'z-50 bg-[hsl(var(--background))] border border-[hsl(var(--border))] shadow-2xl flex flex-col overflow-hidden transition-all duration-300',
            windowClass
          )}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-violet-600 to-indigo-600 p-4 flex items-center justify-between text-white shrink-0">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-base leading-tight">Assistant ENCG IA</h3>
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-violet-200">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                  Gemini 1.5 Pro · En ligne
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 relative z-10">
              <button
                onClick={clearHistory}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Effacer la conversation"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsExpanded(e => !e)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title={isExpanded ? 'Réduire' : 'Agrandir'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[hsl(var(--muted))]/30">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn('flex gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {msg.role === 'bot' && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white shrink-0 shadow-md border border-white/10">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div className={cn(
                  'max-w-[80%] px-4 py-3 rounded-2xl text-sm shadow-sm',
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-sm'
                    : 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))] rounded-tl-sm'
                )}>
                  <p className="whitespace-pre-wrap leading-relaxed">{renderText(msg.text)}</p>
                  <p className={cn('text-[10px] mt-1.5 font-medium', msg.role === 'user' ? 'text-violet-200' : 'text-[hsl(var(--muted-foreground))]')}>
                    {msg.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-[hsl(var(--foreground))]" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2.5 justify-start animate-in fade-in duration-200">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white shrink-0 shadow-md">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex gap-1 items-center">
                  {[0, 150, 300].map(delay => (
                    <div
                      key={delay}
                      className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="px-4 py-2.5 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))] flex gap-2 overflow-x-auto shrink-0 scrollbar-hide">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => handleSendMessage(undefined, action.message)}
                disabled={isTyping}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border whitespace-nowrap transition-all hover:scale-105 disabled:opacity-50',
                  action.color
                )}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 bg-[hsl(var(--card))] border-t border-[hsl(var(--border))] shrink-0">
            <form
              onSubmit={(e) => handleSendMessage(e)}
              className="flex gap-2 items-center bg-[hsl(var(--muted))] p-1.5 rounded-2xl border border-[hsl(var(--border))] focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Posez votre question..."
                disabled={isTyping}
                className="flex-1 bg-transparent px-3 py-2 text-sm font-medium focus:outline-none text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 text-white w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all shadow-md"
              >
                {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
            <p className="text-center text-[10px] text-[hsl(var(--muted-foreground))] mt-1.5 font-medium">
              Propulsé par Google Gemini 1.5 Pro · ENCG Fès
            </p>
          </div>
        </div>
      )}
    </>
  );
}
