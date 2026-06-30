import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import api from '@/shared/lib/api';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export default function AiAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'bot',
      text: "Bonjour ! Je suis l'Assistant Virtuel de l'Université. Je suis connecté aux règlements APOGEE et Ã  votre dossier académique. Comment puis-je vous aider aujourd'hui ?",
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputValue,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const res = await api.post('/ai/chat', {
        message: userMsg.text,
        student_id: 1 // Mock student ID
      });

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: res.data.data.reply,
        timestamp: res.data.data.timestamp
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      toast.error("Erreur de connexion Ã  l'IA.");
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: "Désolé, je rencontre des difficultés techniques. Veuillez réessayer plus tard.",
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col bg-card border border-white/10 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-[#1F3A5F] p-4 flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-white font-bold text-lg flex items-center gap-2">
            ENCG-Bot
            <span className="text-xs font-medium bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> APOGEE RAG
            </span>
          </h1>
          <p className="text-white/70 text-xs">Toujours en ligne</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white/5/10">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.sender === 'bot' && (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-primary" />
              </div>
            )}
            
            <div className={`max-w-[75%] rounded-2xl px-5 py-3 shadow-sm ${msg.sender === 'user' ? 'bg-[#1F3A5F] text-white rounded-br-none' : 'bg-white border border-white/10 rounded-bl-none text-foreground'}`}>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {/* Basic markdown simulation for bold text in bot response */}
                {msg.sender === 'bot' ? (
                  msg.text.split('**').map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)
                ) : (
                  msg.text
                )}
              </div>
              <div className={`text-[10px] mt-1 text-right ${msg.sender === 'user' ? 'text-white/60' : 'text-white/50'}`}>
                {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-white/50" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div className="bg-white border border-white/10 rounded-2xl rounded-bl-none px-5 py-4 shadow-sm flex gap-1 items-center">
              <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background border-t border-white/10 shrink-0">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Posez votre question sur le règlement, la compensation, vos notes..."
            className="flex-1 bg-white/5/50 border border-input rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping}
            className="bg-[#A80A0B] hover:bg-[#7D0809] text-white p-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="text-center text-xs text-white/50 mt-2">
          L'IA peut faire des erreurs. Référez-vous toujours au règlement intérieur officiel.
        </p>
      </div>
    </div>
  );
}
