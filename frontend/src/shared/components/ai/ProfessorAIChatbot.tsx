import React, { useState, useRef, useEffect } from 'react';
import { X, Calendar, UserX, FileText, Building, Send, MessageSquare, Loader2 } from 'lucide-react';
import { useAuthStore } from '@stores/authStore';
import api from '@/shared/lib/api';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
}

export default function ProfessorAIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const { hasAnyRole } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: "Bonjour Professeur ! Je suis votre assistant IA 🤝\nJe peux vous aider à générer des QCM, trouver le règlement, ou analyser vos présences."
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Only render if user is a professor
  if (!hasAnyRole(['professor', 'vacataire'])) return null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isTyping, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent, predefinedText?: string) => {
    e?.preventDefault();
    const textToSend = predefinedText || inputValue;
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const res = await api.post('/chatbot/message', {
        message: userMsg.text
      });

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: res.data.data.reply
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      toast.error("Erreur de connexion à l'IA.");
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: "Désolé, je rencontre des difficultés techniques. Veuillez réessayer plus tard."
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-tr from-amber-500 to-orange-400 hover:from-amber-600 hover:to-orange-500 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-xl shadow-orange-500/30 transition-transform hover:scale-105 z-50 animate-bounce-short"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[380px] bg-white rounded-3xl shadow-2xl z-50 overflow-hidden flex flex-col border border-gray-100 font-sans animate-in slide-in-from-bottom-5 fade-in duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4 flex items-center justify-between text-white relative">
            <div className="flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl shadow-sm backdrop-blur-sm border border-white/30">
                🧑‍🏫
              </div>
              <div>
                <h3 className="font-black text-lg leading-tight">UPF Prof AI</h3>
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-100">
                  <div className="w-1.5 h-1.5 bg-yellow-300 rounded-full animate-pulse"></div>
                  Assistant enseignant · Gemini IA
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-full transition-colors relative z-10"
            >
              <X className="w-5 h-5" />
            </button>
            {/* Background decoration */}
            <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
          </div>

          {/* Chat Body */}
          <div className="flex-1 p-5 bg-gray-50/50 min-h-[300px] max-h-[400px] overflow-y-auto space-y-4">
            
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-sm shrink-0 shadow-sm border border-amber-200">
                    🧑‍🏫
                  </div>
                )}
                
                <div className={`p-4 rounded-2xl shadow-sm border text-sm w-fit max-w-[85%] ${
                  msg.sender === 'user' 
                    ? 'bg-gradient-to-tr from-amber-500 to-orange-400 text-white rounded-tr-sm border-transparent' 
                    : 'bg-white border-gray-100 text-gray-700 rounded-tl-sm'
                }`}>
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.sender === 'bot' ? (
                      msg.text.split('**').map((part, i) => i % 2 === 1 ? <strong key={i} className="text-gray-900">{part}</strong> : part)
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-sm shrink-0 shadow-sm border border-amber-200">
                  🧑‍🏫
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-orange-400/80 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-orange-400/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="px-5 py-3 flex flex-wrap gap-2 border-t border-gray-100 bg-white">
            <button 
              onClick={() => handleSendMessage(undefined, "Quelles sont mes heures de cours cette semaine ?")}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-full text-xs font-bold border border-amber-200 flex items-center gap-1.5 transition-colors"
            >
              <Calendar className="w-3 h-3" /> Mon planning
            </button>
            <button 
              onClick={() => handleSendMessage(undefined, "Génère un QCM de 3 questions sur la Comptabilité de Gestion.")}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-full text-xs font-bold border border-rose-200 flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3 h-3" /> Générer un QCM
            </button>
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white">
            <form onSubmit={(e) => handleSendMessage(e)} className="flex gap-2 items-center bg-gray-50 p-1.5 rounded-2xl border border-gray-200 focus-within:border-orange-400 focus-within:ring-1 focus-within:ring-orange-400 transition-all">
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Votre question..."
                disabled={isTyping}
                className="flex-1 bg-transparent px-3 py-2 text-sm font-medium focus:outline-none text-gray-700 placeholder:text-gray-400 disabled:opacity-50"
              />
              <button 
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="bg-orange-400 hover:bg-orange-500 disabled:bg-orange-300 text-white w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors"
              >
                {isTyping ? <Loader2 className="w-4 h-4 ml-1 animate-spin" /> : <Send className="w-4 h-4 ml-1" />}
              </button>
            </form>
          </div>

        </div>
      )}
    </>
  );
}
