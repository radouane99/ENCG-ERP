import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, Sparkles, User, RefreshCw } from 'lucide-react';
import api from '@shared/lib/api';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  actions?: Array<{ label: string; action: string }>;
  timestamp: string;
}

export default function AiScolarBotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'bot',
      text: '👋 **أهلاً بك في المساعد الذكي لـ ENCG Fès! (ScolarBot AI)**\n\nكيف يمكنني مساعدتك اليوم بخصوص التسجيل، الوثائق المطلوبة، أو تتبع ملفك؟\n\n*يمكنك الكتابة بالدارجة المغربية أو بالفرنسية.*',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actions: [
        { label: '📋 الوثائق المطلوبة', action: 'query_docs' },
        { label: '⏰ التواريخ والمواعيد', action: 'query_dates' },
      ],
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const sendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await api.post('/public/scolarbot/chat', { message: query });
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: res.data.reply,
        actions: res.data.actions,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: '🤖 **ScolarBot ENCG :**\nPour toute question concernant votre dossier, contactez la Scolarité au **0535 xx xx xx** ou par email à **scolarite@encg-fes.ac.ma**.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="px-5 py-3.5 bg-gradient-to-r from-[#0f2863] via-[#1a387e] to-[#0f2863] text-white rounded-full shadow-2xl hover:scale-105 transition-all flex items-center gap-2.5 cursor-pointer border border-amber-400/40 group"
        >
          <div className="relative">
            <Bot className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
          </div>
          <span className="font-black text-xs uppercase tracking-wider">ScolarBot IA — الدعم الفوري</span>
        </button>
      )}

      {/* Chat Modal Window */}
      {isOpen && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-[90vw] max-w-[380px] h-[520px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-[#0f2863] to-[#1a387e] text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-400 font-bold">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                  ScolarBot IA <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </h4>
                <p className="text-[10px] text-blue-200">مساعد التسجيل — ENCG Fès</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/10 rounded-full text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50 dark:bg-slate-950">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-xl bg-[#0f2863] text-amber-400 flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
                    🤖
                  </div>
                )}

                <div className="space-y-1.5 max-w-[82%]">
                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-[#0f2863] to-[#1a387e] text-white rounded-br-none shadow-md font-semibold'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200/80 dark:border-slate-700 shadow-xs'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  </div>

                  {/* Actions buttons */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.actions.map(act => (
                        <button
                          key={act.label}
                          onClick={() => {
                            if (act.action === 'query_docs') sendMessage('شنو هما الوثائق المطلوبين للتسجيل؟');
                            else if (act.action === 'query_dates') sendMessage('شنو هما التواريخ والأجل المحدد؟');
                            else if (act.action === 'track_status') window.location.href = '/mon-inscription';
                          }}
                          className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 rounded-xl text-[10px] font-black hover:bg-amber-100 transition-all cursor-pointer"
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <p className="text-[9px] text-slate-400 font-mono px-1">
                    {msg.timestamp}
                  </p>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 text-xs font-bold">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-xs p-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0f2863]" />
                <span className="font-bold">ScolarBot يكتب...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="اكتب سؤالك بالدارجة أو بالفرنسية..."
              className="flex-1 px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#0f2863]"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="p-2.5 bg-[#0f2863] hover:bg-[#1a387e] text-white rounded-xl shadow transition-all disabled:opacity-40 cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4 text-amber-400" />
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
