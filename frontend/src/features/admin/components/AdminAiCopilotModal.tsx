import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, Send, Sparkles, AlertTriangle, TrendingUp, DollarSign, Award, X, Loader2 } from 'lucide-react';
import api from '@shared/lib/api';
import { cn } from '@shared/lib/utils';

interface AdminAiCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminAiCopilotModal({ isOpen, onClose }: AdminAiCopilotModalProps) {
  const { t, i18n } = useTranslation(['admin', 'common']);
  const isRtl = i18n.language === 'ar';

  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ id: number; text: string; sender: 'user' | 'ai'; data?: any }>>([
    {
      id: 1,
      sender: 'ai',
      text: 'Bonjour ! Je suis le Copilote IA Administratif de l\'ENCG Fès. Posez-moi vos questions en Français, Arabe ou Darija sur la délibération, les absences, le budget des vacations ou les convocations.'
    }
  ]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || loading) return;

    const userText = inputQuery;
    setInputQuery('');
    setMessages(prev => [...prev, { id: Date.now(), text: userText, sender: 'user' }]);

    try {
      setLoading(true);
      const res = await api.post('/ai/copilot/query', { query: userText });
      const aiResponse = res.data?.data;

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: aiResponse?.answer || 'Analyse IA effectuée avec succès.',
          data: aiResponse
        }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: 'Désolé, une erreur est survenue lors de l\'analyse par l\'IA.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'Taux de réussite prévisionnel S5',
    'Étudiants à risque de décrochage',
    'Prévision budget vacations ce mois-ci',
    'Cas du Conseil de Discipline'
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={cn("bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col h-[650px] border border-slate-200 animate-in zoom-in-95", isRtl && "rtl")}>
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0f2863] to-[#002e5b] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-400 text-slate-900 rounded-2xl flex items-center justify-center font-bold shadow-md">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <span>Copilote IA Administratif</span>
                <span className="px-2 py-0.5 bg-white/10 text-amber-300 text-[10px] rounded-full font-mono">v2.4 ENCG</span>
              </h3>
              <p className="text-xs text-slate-300">Commandes & Analyses Exécutives en Temps Réel</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Quick Prompts Bar */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 flex gap-2 overflow-x-auto text-xs">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputQuery(prompt);
              }}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl hover:border-blue-500 hover:text-blue-600 font-semibold text-slate-600 transition-colors whitespace-nowrap shrink-0"
            >
              ✨ {prompt}
            </button>
          ))}
        </div>

        {/* Message Log */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={cn("flex gap-3 max-w-[85%]", msg.sender === 'user' ? "ml-auto flex-row-reverse" : "mr-auto")}
            >
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold",
                msg.sender === 'user' ? "bg-slate-900 text-white" : "bg-blue-100 text-[#0f2863]"
              )}>
                {msg.sender === 'user' ? 'Admin' : <Bot className="w-4 h-4" />}
              </div>

              <div className={cn(
                "p-4 rounded-2xl text-xs leading-relaxed shadow-sm space-y-3",
                msg.sender === 'user' ? "bg-[#0f2863] text-white rounded-tr-none" : "bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none"
              )}>
                <p>{msg.text}</p>

                {/* KPI Cards Rendering if returned by AI */}
                {msg.data?.kpis && (
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60">
                    {msg.data.kpis.map((kpi: any, kIdx: number) => (
                      <div key={kIdx} className="bg-white p-2.5 rounded-xl border border-slate-200 text-center">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">{kpi.label}</div>
                        <div className="text-sm font-extrabold text-[#0f2863] mt-0.5">{kpi.value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-xs text-slate-400 italic">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>L'IA analyse la base de données...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200 flex items-center gap-3">
          <input
            type="text"
            value={inputQuery}
            onChange={e => setInputQuery(e.target.value)}
            placeholder="Posez votre question (Français, Arabe, Darija)..."
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading || !inputQuery.trim()}
            className="bg-[#0f2863] hover:bg-[#1a387e] text-white p-3.5 rounded-2xl shadow-md transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
