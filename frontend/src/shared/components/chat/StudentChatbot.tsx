import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, GraduationCap, BarChart3, Calendar, FileText, AlertTriangle, Mic, MicOff, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@shared/lib/utils';
import { useAuthStore } from '@stores/authStore';
import { toast } from 'sonner';
import api from '@shared/lib/api';

export default function StudentChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<{role: 'bot' | 'user', text: string}[]>([]);
  const user = useAuthStore(state => state.user);
  const roles = user?.roles || [];
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const isStudent = roles.includes('student');
  const isProfessor = roles.some(r => r.includes('professor') || r.includes('vacataire'));
  const isAdmin = roles.some(r => r.includes('admin') || r.includes('director') || r.includes('officer') || r.includes('manager'));

  const botTitle = isAdmin ? 'Administrateur' : isProfessor ? 'Professeur' : 'Étudiant';
  
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const userName = user?.name ? user.name.split(' ')[0] : '';
      setMessages([
        { role: 'bot', text: `Bonjour ${userName} 👋\nJe suis votre Assistant ${botTitle} IA, propulsé par Gemini 1.5 Pro ✨\n\nComment puis-je vous aider aujourd'hui ?` }
      ]);
    }
  }, [isOpen, user?.name, botTitle]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!message.trim()) return;
    const userMsg = message;
    setMessage('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    
    setIsTyping(true);
    try {
      const res = await api.post('/chatbot/message', { message: userMsg, role: botTitle });
      setMessages(prev => [...prev, { role: 'bot', text: res.data.reply }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'bot', text: "Désolé, une erreur de connexion s'est produite avec l'IA." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      toast.success('Audio capturé avec succès');
      setMessage("Comment puis-je justifier mon absence d'hier ?");
    } else {
      setIsRecording(true);
      toast.info('Écoute en cours... (Mode Démo)', { description: 'Parlez maintenant.' });
      setTimeout(() => {
        if (isRecording) {
            setIsRecording(false);
            setMessage("Comment puis-je justifier mon absence d'hier ?");
        }
      }, 3000);
    }
  };

  const quickActions = isStudent ? [
    { icon: <BarChart3 className="w-3 h-3" />, label: "Mes notes" },
    { icon: <Calendar className="w-3 h-3" />, label: "Mon emploi du temps" },
    { icon: <AlertTriangle className="w-3 h-3" />, label: "Absences" },
  ] : isAdmin ? [
    { icon: <BarChart3 className="w-3 h-3" />, label: "Statistiques" },
    { icon: <FileText className="w-3 h-3" />, label: "Inscriptions" },
  ] : [
    { icon: <Calendar className="w-3 h-3" />, label: "Planning" },
    { icon: <FileText className="w-3 h-3" />, label: "Saisie notes" },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[100] font-sans">
      
      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[380px] sm:w-[400px] bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 ring-1 ring-slate-900/5">
          
          {/* Premium Header */}
          <div className="relative bg-gradient-to-r from-blue-600 via-[#0f2863] to-indigo-800 p-5 overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                    <Sparkles className="w-6 h-6 text-blue-200" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-[#0f2863] animate-pulse"></div>
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg leading-tight tracking-tight">Assistant {botTitle}</h3>
                  <p className="text-blue-200 text-xs flex items-center gap-1.5 font-medium mt-0.5">
                    ENCG Fès • Modèle Gemini Avancé
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-blue-100 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-5 bg-slate-50/50 h-[380px] overflow-y-auto space-y-5 custom-scrollbar">
            {messages.map((msg, idx) => (
              <div key={idx} className={cn("flex gap-3 max-w-[85%]", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
                {msg.role === 'bot' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-[#0f2863] flex items-center justify-center shrink-0 shadow-sm">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={cn(
                  "p-3.5 rounded-2xl text-sm shadow-sm",
                  msg.role === 'bot' 
                    ? "bg-white border border-slate-100 text-slate-700 rounded-tl-sm whitespace-pre-line" 
                    : "bg-[#0f2863] text-white rounded-tr-sm"
                )}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-3 max-w-[85%] animate-in fade-in">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-[#0f2863] flex items-center justify-center shrink-0 shadow-sm">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          {messages.length <= 1 && (
            <div className="px-4 py-3 bg-white/80 border-t border-slate-100 flex gap-2 overflow-x-auto custom-scrollbar no-scrollbar">
              {quickActions.map((action, idx) => (
                <button 
                  key={idx}
                  onClick={() => setMessage(action.label)}
                  className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-blue-100 bg-blue-50/50 text-xs font-semibold text-blue-700 hover:bg-blue-100 hover:border-blue-200 transition-all shadow-sm"
                >
                  {action.icon} {action.label}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 bg-white/90 border-t border-slate-100 rounded-b-3xl">
            <div className="relative flex items-center gap-2">
              <button 
                onClick={toggleRecording}
                className={cn(
                  "w-11 h-11 shrink-0 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm border",
                  isRecording 
                    ? "bg-rose-500 border-rose-600 text-white animate-pulse shadow-rose-200" 
                    : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200 hover:text-[#0f2863]"
                )}
              >
                {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              
              <div className="relative flex-1">
                <input 
                  type="text" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={isRecording ? "Écoute en cours..." : "Posez votre question..."}
                  disabled={isRecording}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
                />
                <button 
                  onClick={handleSend}
                  disabled={!message.trim() || isRecording}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-[#0f2863] flex items-center justify-center text-white hover:bg-[#1a387e] transition-colors disabled:opacity-50 disabled:hover:bg-[#0f2863]"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </div>
            {isRecording && (
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-2 animate-in slide-in-from-bottom-2 shadow-lg">
                <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                Reconnaissance vocale activée
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-105 hover:rotate-3 relative group",
          isOpen ? "bg-slate-800 text-white rotate-12" : "bg-gradient-to-br from-blue-600 to-[#0f2863] text-white"
        )}
      >
        {isOpen ? <X className="w-7 h-7" /> : (
          <>
            <Sparkles className="w-7 h-7" />
            <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-400 rounded-full border-[3px] border-white group-hover:scale-110 transition-transform"></div>
            <div className="absolute inset-0 rounded-3xl bg-white/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </>
        )}
      </button>
    </div>
  );
}
